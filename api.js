// api.js — BsanControl 2.0 API (dual-mode via dbx: SQLite local / Postgres cloud) + login por perfil.
// Serve o BsanControl E os endpoints na mesma origem (sem CORS). uso: node api.js → http://localhost:8787
const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");
const dbx = require("./dbx");
// token do cache-bust: hash do DATABASE_URL (quem tem a conexão pode limpar — zero config novo)
const BUST_TOKEN = crypto.createHash("sha256").update(process.env.DATABASE_URL || "sem-db").digest("hex");
const { hashSenha, verificaSenha, assinaToken, verificaToken } = require("./auth");
const { consultaVendas, resumoVendasSQL } = require("./vendas-pagina");
const { completar: completarResumoVendas } = require("./vendas-indicadores");
const lancamento = require("./lancamento");
const writeStore = require("./datasets-versionados");
const acessos = require("./acessos");
const usuarios = require("./usuarios").criarServico(dbx);
const acompanhamentoRegistros = require('./acompanhamento-registros');

const PORT = process.env.PORT || 8787;
const SENHA_PADRAO = "bsan@2026";   // quem ainda tem essa é obrigado a trocar no 1º acesso
const AUTH_REQ = process.env.AUTH_REQUIRED === "1";                      // em produção: 1 (exige login)
// ONLINE (AUTH_REQ): serve só esta pasta e a página enxuta (Acompanhamento). LOCAL: serve o BsanControl do Drive.
const STATIC_ROOT = AUTH_REQ ? __dirname : path.resolve(__dirname, "..", "..");
const INDEX = AUTH_REQ ? "/acompanhamento.html" : "/BsanControl.html";

const J = (res, obj, code = 200) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }); res.end(JSON.stringify(obj)); };
// envia JSON com gzip quando o cliente aceita (datasets grandes ~10x menores no fio)
const JZ = (req, res, obj, code = 200) => {
  const buf = Buffer.from(JSON.stringify(obj));
  const h = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" };
  if (/\bgzip\b/.test(String(req.headers["accept-encoding"] || "")) && buf.length > 1400) {
    h["Content-Encoding"] = "gzip"; res.writeHead(code, h); res.end(zlib.gzipSync(buf));
  } else { res.writeHead(code, h); res.end(buf); }
};
// cache em memória de respostas pesadas (buffer já gzipado), por escopo, com TTL — evita re-buscar 44MB a cada acesso
const _gzCache = new Map();
// (21/10/2026) o cache vale até o próximo db-sync (que chama /api/cache/clear); 12h é só rede de segurança. Antes: 15 min — com o
// Render Free hibernando, cada acordada relia a base inteira do Supabase (17 GB de egress em out/26 → restrição do plano free).
const GZ_TTL = +(process.env.CACHE_TTL_MS || 12 * 3600 * 1000);
const GZ_CAP = 90 * 1024 * 1024;   // ~90MB de teto (Render free tem 512MB)
// VERSÃO DOS DADOS (ETag): muda a cada db-sync (cache/clear), a cada escrita que mexe nos extras e a cada reinício. O navegador guarda a
// resposta e, na próxima abertura, só pergunta "mudou?" (If-None-Match) → 304 sem corpo e SEM consultar o banco. Corta o tráfego
// do Render (4,8 GB de respostas em out/26) e o egress do Supabase: cada usuário baixa os dados 1x por atualização, não 1x por abertura.
let _geracao = Date.now();
const etagDe = k => 'W/"' + _geracao.toString(36) + '-' + crypto.createHash("sha1").update(k).digest("hex").slice(0, 12) + '"';
function gzCacheGet(k) { const e = _gzCache.get(k); if (e && Date.now() - e.t < GZ_TTL) { _gzCache.delete(k); _gzCache.set(k, e); return e.buf; } if (e) _gzCache.delete(k); return null; }
function gzCacheSet(k, buf) { let tot = buf.length; for (const e of _gzCache.values()) tot += e.buf.length; while (tot > GZ_CAP && _gzCache.size) { const first = _gzCache.keys().next().value; tot -= _gzCache.get(first).buf.length; _gzCache.delete(first); } _gzCache.set(k, { t: Date.now(), buf }); }
// Abas macro (dataset, detalhe, vendas-agregado) mostram o grupo ao gestor.
// Gerencial, Acompanhamento e comissão cortam pela operação. Carteira vazia nesses cortes devolve vazio.
async function operacaoDoGestor(user, emp, mkt) {
  if (!user || user.perfil !== "gestor") return true;
  if (!user.gestor_ref || !emp || !mkt) return false;
  const r = await dbx.get("SELECT 1 AS ok FROM operacoes WHERE gestor=? AND empresa=? AND marketplace=?", [user.gestor_ref, emp, mkt]);
  return !!r;
}
const body = req => new Promise(r => { let b = ""; req.on("data", c => b += c); req.on("end", () => { try { r(JSON.parse(b || "{}")); } catch (e) { r({}); } }); });
// Relê ativo e perfil no banco. O token só prova a assinatura; o perfil de doze horas atrás não vale.
async function sessaoDe(req) {
  const h = req.headers["authorization"] || "";
  const tok = verificaToken(h.replace(/^Bearer\s+/i, ""));
  if (!tok) return null;
  const us = await usuarios.sessao(tok.id, tok.revogacao || 0, tok.trocar === true);
  if (!us) return { recusado: 401, erro: "sessão expirada; entre novamente" };
  return us;
}

// demanda do banco → modelo que o Acompanhamento (ac2) consome
const mapDem = r => ({ id: r.id, competencia: r.competencia, empresa: r.empresa, mkt: r.canal, ponto: r.ponto, gestor: r.gestor, sku: r.sku, anuncio: r.anuncio_id,
  titulo: r.titulo, tipo: r.tipo, causa: r.causa, mcPct: r.mc_pct, meta: r.meta, fat: r.fat, risco: r.risco, qtd: r.qtd, pedidos: r.pedidos,
  // `criado_em` é a idade da demanda: sem ele a Coordenação não calcula "dias parados", e a
  // urgência (dinheiro × dias) vira só dinheiro — era o que a fila fazia antes.
  criado_em: r.criado_em || null,
  estado: (r.estado && r.estado !== "diag") ? r.estado : (r.acao ? "trat" : "diag"), trat: r.acao || null, reacaoH: r.reacao_h, tratD: null, demora: 0,
  prazo: r.prazo_dias == null ? null : +r.prazo_dias,
  registro: r.acao ? { acao: r.acao, causa: r.t_causa || "", obs: r.t_obs || "", em: r.t_em || null, gestor: r.t_gestor || "", n: +r.t_n || 1, precoNovo: r.t_preco == null ? null : +r.t_preco, ate: r.t_ate || null } : null,
  recuperado: r.recuperado || 0, mcDepois: (r.mc_depois == null ? null : r.mc_depois), desfecho: r.desfecho || null,
  resultado: r.desfecho ? { desfecho: r.desfecho, detalhe: r.r_detalhe || "", mcAntes: r.r_mc_antes, mcDepois: r.mc_depois, precoAntes: r.r_pa, precoDepois: r.r_pd,
    lucroDiaAntes: r.r_la, lucroDiaDepois: r.r_ld, aplicou: r.r_aplicou || null, dias: r.r_dias, em: r.r_em, recuperado: r.recuperado || 0 } : null,
  // o preço que o comprador paga hoje no anúncio × o que o gestor informou (só ML por enquanto)
  checagem: r.c_sit ? { situacao: r.c_sit, praticado: r.c_prat == null ? null : +r.c_prat, tabela: r.c_tab == null ? null : +r.c_tab, promocao: r.c_promo || "", em: r.c_em } : null,
  // tarefa de PROMOÇÃO: como o anúncio está HOJE no diagnóstico mais recente (o texto da causa é o de quando a tarefa nasceu)
  hoje: r.pd_data ? { data: r.pd_data, acao: r.pd_acao || "", preco: r.pd_preco == null ? null : +r.pd_preco, mc: r.pd_mc == null ? null : +r.pd_mc, motivo: r.pd_motivo || "" } : null,
  // revalidação do registro do gestor na regra (ml-promos → promo_validacao): ok · fora (com o porquê e o preço certo) · sem
  validacao: r.pv_ver ? { veredito: r.pv_ver, motivo: r.pv_mot || "", sugestao: r.pv_sug || "", em: r.pv_em } : null,
  // acerto do gestor: só veredito FECHADO conta. Leitura parcial (1–2 vendas), Pausado, Sem leitura e
  // Aguardando não entram (ainda não dá para julgar); Justificado conta a favor; Parou de vender, contra.
  funcionou: !r.desfecho || /Aguardando|Sem venda|Sem leitura|Pausado|parcial/.test(r.desfecho) ? null : /Resolvido|Progrediu|Justificado/.test(r.desfecho) });

async function rotaGET(u, user) {
  if (user && !acessos.rota(user, "GET", u.pathname)) throw Object.assign(new Error("Seu acesso não permite esta consulta."), { status: 403, codigo: "PERMISSAO_NEGADA" });
  const q = Object.fromEntries(u.searchParams);
  if (u.pathname === '/api/tratativas') {
    await garantePrecoNovo();
    return acompanhamentoRegistros.historico(dbx, user, q.demanda_id);
  }
  const entrada = u.pathname.match(/^\/api\/lancamentos\/(envios|custos|comissao)$/);
  if (entrada) return writeStore.ler(dbx, entrada[1], user);
  if (u.pathname === "/api/health") {
    const v = await dbx.get("SELECT COUNT(*) n FROM vendas");
    const d = await dbx.get("SELECT COUNT(*) n FROM demandas");
    const s = await dbx.get("SELECT MAX(atualizado) m FROM datasets");   // carimbo do último db-sync (p/ o auto-refresh detectar dado novo)
    return { ok: true, banco: dbx.IS_PG ? "Postgres" : "SQLite", vendas: v.n, demandas: d.n, _sync: (s && s.m) ? s.m : null };
  }
  if (u.pathname === "/api/demandas") {
    await garantePrecoNovo();
    // ESCOPO POR PERFIL: gestor só vê as contas dele; direção/coordenação veem tudo
    // o REGISTRO DO GESTOR: o último (ação, causa, observação, quando, quem) + quantos já houve; e a
    // reação do PRIMEIRO registro (MIN) — é ela que mede se registrou dentro do prazo.
    // TODA coluna que o mapDem lê tem de estar AQUI: até 16/10/2026 t_preco e os r_* ficavam só nos subselects, e o
    // painel nunca recebia o novo preço informado nem o detalhe da medição (vinham sempre vazios).
    let sql = `SELECT d.*, t.acao, t.t_causa, t.t_obs, t.t_em, t.t_gestor, t.t_n, t.reacao_h, t.t_preco, t.t_ate,
      r.desfecho, r.recuperado, r.mc_depois, r.r_mc_antes, r.r_pa, r.r_pd, r.r_la, r.r_ld, r.r_aplicou, r.r_dias, r.r_detalhe, r.r_em,
      ck.c_sit, ck.c_prat, ck.c_tab, ck.c_promo, ck.c_em, pd.data AS pd_data, pd.acao AS pd_acao, pd.preco_atual AS pd_preco, pd.mc_atual AS pd_mc, pd.motivo AS pd_motivo,
      pv.veredito AS pv_ver, pv.motivo AS pv_mot, pv.sugestao AS pv_sug, pv.em AS pv_em FROM demandas d
      LEFT JOIN (SELECT t1.demanda_id, t1.acao, t1.causa AS t_causa, t1.obs AS t_obs, t1.registrado_em AS t_em, t1.gestor AS t_gestor, t1.preco_novo AS t_preco, t1.aguardar_ate AS t_ate,
          c.n AS t_n, c.reac1 AS reacao_h FROM tratativas t1
        JOIN (SELECT demanda_id, MAX(id) ult, COUNT(*) n, MIN(reacao_h) reac1 FROM tratativas GROUP BY demanda_id) c ON c.ult=t1.id) t ON t.demanda_id=d.id
      LEFT JOIN (SELECT r1.demanda_id, r1.desfecho, r1.recuperado, r1.mc_depois, r1.mc_antes AS r_mc_antes, r1.preco_antes AS r_pa, r1.preco_depois AS r_pd,
          r1.lucro_dia_antes AS r_la, r1.lucro_dia_depois AS r_ld, r1.aplicou AS r_aplicou, r1.dias AS r_dias, r1.detalhe AS r_detalhe, r1.verificado_em AS r_em
        FROM resultados r1 JOIN (SELECT demanda_id, MAX(id) ult FROM resultados GROUP BY demanda_id) rr ON rr.ult=r1.id) r ON r.demanda_id=d.id
      LEFT JOIN (SELECT c1.demanda_id, c1.situacao AS c_sit, c1.preco_praticado AS c_prat, c1.preco_tabela AS c_tab, c1.promocao AS c_promo, c1.verificado_em AS c_em
        FROM checagem_preco c1 JOIN (SELECT demanda_id, MAX(verificado_em) ult FROM checagem_preco GROUP BY demanda_id) cc ON cc.demanda_id=c1.demanda_id AND cc.ult=c1.verificado_em) ck ON ck.demanda_id=d.id
      LEFT JOIN (SELECT p1.empresa, p1.anuncio, p1.data, p1.acao, p1.preco_atual, p1.mc_atual, p1.motivo FROM promo_diagnostico p1
        JOIN (SELECT empresa, MAX(data) m FROM promo_diagnostico GROUP BY empresa) pm ON pm.empresa=p1.empresa AND pm.m=p1.data) pd
        ON d.id LIKE 'promo|%' AND pd.empresa=d.empresa AND pd.anuncio=d.anuncio_id
      LEFT JOIN promo_validacao pv ON pv.demanda_id=d.id`;
    const args = [], w = [];
    if (q.mes) { w.push("d.competencia=?"); args.push(q.mes); }   // ?mes opcional; sem ele devolve todos os meses — o painel filtra por período no cliente (segue o filtro do topo)
    if (user && user.perfil === "gestor") { if (!user.gestor_ref) w.push("1=0"); else { w.push("d.gestor=?"); args.push(user.gestor_ref); } }
    if (w.length) sql += " WHERE " + w.join(" AND ");
    sql += " ORDER BY d.risco DESC";
    return (await dbx.all(sql, args)).map(mapDem);
  }
  // pedidos de reaplicação dos últimos 14 dias (o painel mostra o estado na tarefa) — gestor só vê os dele
  if (u.pathname === "/api/comandos") {
    await garanteComandos();
    const w = ["criado_em >= ?"], args = [new Date(Date.now() - 14 * 864e5).toISOString()];
    if (user && user.perfil === "gestor") { if (!user.gestor_ref) w.push("1=0"); else { w.push("gestor=?"); args.push(user.gestor_ref); } }
    return await dbx.all("SELECT id, criado_em, pedido_por, demanda_id, empresa, anuncio, estado, resultado, atualizado_em FROM comandos WHERE " + w.join(" AND ") + " ORDER BY criado_em DESC", args);
  }
  if (u.pathname === "/api/vendas-agregado") {
    const de = q.de || "0000-00-00", ate = q.ate || "9999-99-99", t0 = Date.now();
    const w = ["data>=?", "data<=?", "status LIKE '%venda%'"], args = [de, ate];
    const W = " WHERE " + w.join(" AND ");
    const kpi = await dbx.get("SELECT COUNT(*) n, ROUND(SUM(CAST(COALESCE(receita_n,CAST(receita AS NUMERIC)) AS DOUBLE PRECISION))) fat, ROUND(SUM(CAST(COALESCE(mc_comissao_n,CAST(mc_comissao AS NUMERIC)) AS DOUBLE PRECISION))) mc FROM vendas" + W, args);
    const porOp = await dbx.all("SELECT empresa, canal, ROUND(SUM(CAST(COALESCE(receita_n,CAST(receita AS NUMERIC)) AS DOUBLE PRECISION))) fat, ROUND(SUM(CAST(COALESCE(mc_comissao_n,CAST(mc_comissao AS NUMERIC)) AS DOUBLE PRECISION))) mc, COUNT(*) n FROM vendas" + W + " GROUP BY empresa, canal ORDER BY mc DESC", args);
    return { periodo: [de, ate], ms: Date.now() - t0, kpi, por_operacao: porOp };
  }
  // Página de 50. O KPI usa o mesmo filtro da tabela, sem o recorte de status (os cartões contam todos).
  if (u.pathname === "/api/vendas") {
    const t0 = Date.now();
    const c = consultaVendas(q);
    const fat = "CAST(COALESCE(receita_n,CAST(receita AS NUMERIC)) AS DOUBLE PRECISION)";
    const par = (n, v) => ({ n: +n || 0, v: Math.round((+v || 0) * 100) / 100 });
    const resumoQuery=resumoVendasSQL(c);
    const [kpiRow, linhas, resumoRow] = await Promise.all([
      dbx.get(`SELECT COUNT(*) n,
        SUM(CASE WHEN status IN ('venda','venda_com_troca') THEN 1 ELSE 0 END) n_fin,
        SUM(CASE WHEN status='pendente' THEN 1 ELSE 0 END) n_pen,
        SUM(CASE WHEN status='cancelada' THEN 1 ELSE 0 END) n_can,
        SUM(CASE WHEN status='devolvida' THEN 1 ELSE 0 END) n_dev,
        SUM(CASE WHEN status='extravio' THEN 1 ELSE 0 END) n_ext,
        SUM(${fat}) fat,
        SUM(CASE WHEN status IN ('venda','venda_com_troca') THEN ${fat} ELSE 0 END) fat_fin,
        SUM(CASE WHEN status='pendente' THEN ${fat} ELSE 0 END) fat_pen,
        SUM(CASE WHEN status='cancelada' THEN ${fat} ELSE 0 END) fat_can,
        SUM(CASE WHEN status='devolvida' THEN ${fat} ELSE 0 END) fat_dev,
        SUM(CASE WHEN status='extravio' THEN ${fat} ELSE 0 END) fat_ext
      FROM vendas WHERE ${c.base}`, c.baseArgs),
      dbx.all(`SELECT data AS date, empresa AS emp, canal AS mkt, ponto, sku, anuncio_id AS anuncio, titulo AS tit, pedido AS ped,
        qtd, ${fat} AS fat, CAST(COALESCE(liquido_n,CAST(liquido AS NUMERIC)) AS DOUBLE PRECISION) AS liq, CAST(COALESCE(ctp_n,CAST(ctp AS NUMERIC)) AS DOUBLE PRECISION) AS ctp, CAST(COALESCE(imposto_n,CAST(imposto AS NUMERIC)) AS DOUBLE PRECISION) AS imp,
        CAST(COALESCE(mc_comissao_n,CAST(mc_comissao AS NUMERIC)) AS DOUBLE PRECISION) AS mc, fonte_liquido AS fonte, status AS stat
      FROM vendas WHERE ${c.where} ORDER BY ${c.order} LIMIT ? OFFSET ?`, c.args.concat([c.limite, c.offset])),
      dbx.get(resumoQuery.sql,resumoQuery.args)
    ]);
    linhas.forEach(o => {
      o.date = String(o.date || "").slice(0, 10);
      for (const k of ["qtd", "fat", "liq", "ctp", "imp", "mc"]) o[k] = Math.round((+o[k] || 0) * 100) / 100;
    });
    const faixa = { finalizadas: ["n_fin", "fat_fin"], pendente: ["n_pen", "fat_pen"], cancelada: ["n_can", "fat_can"], devolvida: ["n_dev", "fat_dev"], extravio: ["n_ext", "fat_ext"] }[q.status];
    const n = faixa ? (+kpiRow[faixa[0]] || 0) : (+kpiRow.n || 0);
    const fatFiltrado = faixa ? kpiRow[faixa[1]] : kpiRow.fat;
    return {
      periodo: [q.de || null, q.ate || null], ms: Date.now() - t0,
      kpi: {
        total: par(kpiRow.n, kpiRow.fat), finalizadas: par(kpiRow.n_fin, kpiRow.fat_fin),
        pendente: par(kpiRow.n_pen, kpiRow.fat_pen), cancelada: par(kpiRow.n_can, kpiRow.fat_can),
        devolvida: par(kpiRow.n_dev, kpiRow.fat_dev), extravio: par(kpiRow.n_ext, kpiRow.fat_ext)
      },
      total: +resumoRow.linhas||0, fat: par(0, fatFiltrado).v, paginas: Math.max(1, Math.ceil((+resumoRow.linhas||0) / c.limite)), pagina: c.pagina, limite: c.limite,
      linhas, resumo: completarResumoVendas(resumoRow)
    };
  }
  // ── /api/dataset — datasets do painel (ROWS/DETALHE/agregados) escopados por PONTO, janela de meses ──
  if (u.pathname === "/api/dataset") {
    const t0 = Date.now();
    // janela: de/ate explícitos, ou últimos N meses presentes (default 4)
    let de = q.de, ate = q.ate;
    if (!de || !ate) {
      const mx = await dbx.get("SELECT MAX(data) d FROM vendas");
      const maxd = (mx && mx.d) ? String(mx.d).slice(0, 10) : "2026-12-31";
      ate = ate || maxd;
      const meses = Math.max(1, Math.min(36, parseInt(q.meses || "4", 10)));
      const dt = new Date(maxd + "T00:00:00Z"); dt.setUTCDate(1); dt.setUTCMonth(dt.getUTCMonth() - (meses - 1));
      de = de || dt.toISOString().slice(0, 10);
    }
    const w = ["data>=?", "data<=?"]; const args = [de, ate];
    const W = "WHERE " + w.join(" AND ");
    const r2 = n => Math.round((+n || 0) * 100) / 100;
    const mapMoney = (a, campos) => a.map(o => { for (const c of campos) o[c] = r2(o[c]); return o; });
    // AGREGADOS via GROUP BY no banco (retorna ~11k linhas, não as 37k cruas) — carga inicial leve.
    // O DETALHE (linha a linha, pesado) é lazy: /api/detalhe, só quando Raio-X ou Gerencial abrem.
    // BASE = VENDAS FINALIZADAS (30/10/2026, Weskley): faturamento, custos, margem, unidades e pedidos contam só
    // venda/venda_com_troca — a mesma base da meta e da comissão. Pendente (devolução/mediação em andamento),
    // devolvida e extravio ficam fora e seguem à parte (devN/devFat/devMc). mcMetas continua a regra da comissão
    // (venda + devolvida). V(): a coluna exata (_n, NUMERIC) com a antiga como reserva — sem o CAST o Postgres somava em float4.
    const V = c => `CAST(COALESCE(${c}_n,CAST(${c} AS NUMERIC)) AS DOUBLE PRECISION)`;
    const FIN = "LOWER(COALESCE(NULLIF(TRIM(status),''),'venda')) LIKE '%venda%'";
    const SF = c => `SUM(CASE WHEN ${FIN} THEN ${V(c)} ELSE 0 END)`;
    const DEV = "LOWER(TRIM(COALESCE(status,'')))='devolvida'";
    const rows = mapMoney(await dbx.all(`SELECT data AS date, empresa AS emp, canal AS mkt, ponto,
        ${SF("receita")} AS fat, ${SF("liquido")} AS liq, ${SF("ctp")} AS ctp, ${SF("imposto")} AS imp,
        ${SF("mc_comissao")} AS mc, ${SF("mc_real")} AS "mcReal",
        SUM(CASE WHEN ${FIN} THEN qtd ELSE 0 END) AS qtd, SUM(CASE WHEN ${FIN} THEN 1 ELSE 0 END) AS ped,
        SUM(CASE WHEN ${FIN} THEN CAST(COALESCE(publicidade_n,CAST(publicidade AS NUMERIC),0) AS DOUBLE PRECISION) ELSE 0 END) AS pub,
        SUM(CASE WHEN ${FIN} THEN CAST(COALESCE(afiliados_n,CAST(afiliados AS NUMERIC),0) AS DOUBLE PRECISION) ELSE 0 END) AS afil,
        SUM(CASE WHEN ${DEV} THEN 1 ELSE 0 END) AS "devN",
        SUM(CASE WHEN ${DEV} THEN ${V("receita")} ELSE 0 END) AS "devFat",
        SUM(CASE WHEN ${DEV} THEN ${V("mc_comissao")} ELSE 0 END) AS "devMc",
        ${SF("receita")} AS "fatMetas",
        SUM(CAST(CASE WHEN ${FIN} OR ${DEV} THEN COALESCE(mc_comissao_n,CAST(mc_comissao AS NUMERIC),mc_real_n,CAST(mc_real AS NUMERIC),0) ELSE 0 END AS DOUBLE PRECISION)) AS "mcMetas"
      FROM vendas ${W} GROUP BY data, empresa, canal, ponto`, args), ["fat", "liq", "ctp", "imp", "mc", "mcReal", "qtd", "fatMetas", "mcMetas", "pub", "afil", "devFat", "devMc"]);
    rows.forEach(o => { o.ped = +o.ped; o.devN = +o.devN || 0; });
    const WF = W + " AND " + FIN;
    const skuMon = mapMoney(await dbx.all(`SELECT competencia AS mes, sku AS "SKU", SUM(${V("receita")}) AS fat, SUM(${V("liquido")}) AS liq,
        SUM(${V("ctp")}) AS ctp, SUM(${V("imposto")}) AS imp, SUM(${V("mc_real")}) AS mc, SUM(qtd) AS qtd FROM vendas ${WF} GROUP BY competencia, sku`, args), ["fat", "liq", "ctp", "imp", "mc", "qtd"]);
    const skuMkt = mapMoney(await dbx.all(`SELECT canal AS mkt, sku, SUM(qtd) AS qtd, SUM(${V("receita")}) AS fat, SUM(${V("mc_real")}) AS mc,
        SUM(${V("liquido")}) AS liq FROM vendas ${WF} GROUP BY canal, sku`, args), ["qtd", "fat", "mc", "liq"]);
    const skuMktMon = mapMoney(await dbx.all(`SELECT competencia AS mes, canal AS mkt, sku, SUM(${V("receita")}) AS fat, SUM(${V("mc_real")}) AS mc,
        SUM(qtd) AS qtd, SUM(${V("liquido")}) AS liq FROM vendas ${WF} GROUP BY competencia, canal, sku`, args), ["fat", "mc", "qtd", "liq"]);
    const ex = await dbx.get("SELECT MIN(data) min, MAX(data) max FROM vendas");
    return { periodo: [de, ate], ms: Date.now() - t0,
      extremos: [ex && ex.min ? String(ex.min).slice(0, 10) : de, ex && ex.max ? String(ex.max).slice(0, 10) : ate],
      contagem: { rows: rows.length, skuMon: skuMon.length, skuMkt: skuMkt.length, skuMktMon: skuMktMon.length },
      rows, skuMon, skuMkt, skuMktMon };
  }
  // ── /api/detalhe — DETALHE linha a linha (lazy; Raio-X / Panorama), mesmo escopo/janela ──
  if (u.pathname === "/api/detalhe") {
    const t0 = Date.now();
    let de = q.de, ate = q.ate;
    if (!de || !ate) {
      const mx = await dbx.get("SELECT MAX(data) d FROM vendas");
      const maxd = (mx && mx.d) ? String(mx.d).slice(0, 10) : "2026-12-31";
      ate = ate || maxd;
      const meses = Math.max(1, Math.min(36, parseInt(q.meses || "4", 10)));
      const dt = new Date(maxd + "T00:00:00Z"); dt.setUTCDate(1); dt.setUTCMonth(dt.getUTCMonth() - (meses - 1));
      de = de || dt.toISOString().slice(0, 10);
    }
    const w = ["data>=?", "data<=?"]; const args = [de, ate];
    const r2 = n => Math.round((+n || 0) * 100) / 100;
    // ⚠ NÃO acrescentar colunas aqui. Este endpoint devolve a base INTEIRA (148k linhas em out/2026);
    // cada campo a mais é multiplicado por isso. Medido: 16 campos de abertura levavam o pico de
    // 137 MB para 249 MB e estouravam os 512 MB do plano free (exit 134, OOM, 502 no ar).
    // A abertura de custos mora em /api/abertura, que é escopado a UMA operação.
    const raw = await dbx.all(`SELECT data, empresa, canal, ponto, sku, anuncio_id, titulo, pedido,
        qtd, CAST(COALESCE(receita_n,CAST(receita AS NUMERIC)) AS DOUBLE PRECISION) AS receita, CAST(COALESCE(liquido_n,CAST(liquido AS NUMERIC)) AS DOUBLE PRECISION) AS liquido, CAST(COALESCE(ctp_n,CAST(ctp AS NUMERIC)) AS DOUBLE PRECISION) AS ctp, CAST(COALESCE(imposto_n,CAST(imposto AS NUMERIC)) AS DOUBLE PRECISION) AS imposto, CAST(COALESCE(mc_real_n,CAST(mc_real AS NUMERIC)) AS DOUBLE PRECISION) AS mc_real, CAST(COALESCE(mc_comissao_n,CAST(mc_comissao AS NUMERIC)) AS DOUBLE PRECISION) AS mc_comissao, fonte_liquido, status FROM vendas WHERE ${w.join(" AND ")}`, args);
    const detalhe = raw.map(v => ({ date: v.data, emp: v.empresa, mkt: v.canal, sku: v.sku, tit: v.titulo, ped: v.pedido,
      anuncio: v.anuncio_id, qtd: r2(v.qtd), fat: r2(v.receita), liq: r2(v.liquido), ctp: r2(v.ctp), imp: r2(v.imposto),
      mc: r2(v.mc_comissao), mccom: r2(v.mc_comissao), mcReal: r2(v.mc_real), mcRealInformada: v.mc_real!=null&&v.mc_real!=='', fonte: v.fonte_liquido, stat: v.status, ponto: v.ponto }));
    return { periodo: [de, ate], ms: Date.now() - t0, n: detalhe.length, detalhe };
  }
  // ── /api/abertura — custos por venda de UMA operação (sub-aba Vendas da Gerencial) ────────────
  // Escopado de propósito: a abertura só é olhada uma operação por vez, então mandar as 16 colunas
  // de toda a base era desperdício que custou um OOM. Aqui vão só a chave e os campos de custo —
  // o painel casa com o DETALHE que já tem. Campo zerado é OMITIDO (chave ausente = 0 no painel),
  // o que corta a maior parte do peso: fora Amazon, `pcheio` é zero em quase tudo.
  if (u.pathname === "/api/abertura") {
    const t0 = Date.now();
    const emp = q.emp || "", mkt = q.mkt || "";
    if (!emp || !mkt) return { erro: "informe emp e mkt" };
    if (!(await operacaoDoGestor(user, emp, mkt))) return { periodo: [q.de || null, q.ate || null], n: 0, abertura: [] };
    const w = ["empresa=?", "canal=?"], args = [emp, mkt];
    if (q.de) { w.push("data>=?"); args.push(q.de); }
    if (q.ate) { w.push("data<=?"); args.push(q.ate); }
    const r2 = n => Math.round((+n || 0) * 100) / 100;
    const raw = await dbx.all(`SELECT data, canal, sku, pedido, CAST(COALESCE(preco_cheio_n,CAST(preco_cheio AS NUMERIC)) AS DOUBLE PRECISION) AS preco_cheio, CAST(COALESCE(desconto_n,CAST(desconto AS NUMERIC)) AS DOUBLE PRECISION) AS desconto, CAST(COALESCE(comissao_n,CAST(comissao AS NUMERIC)) AS DOUBLE PRECISION) AS comissao, CAST(COALESCE(tarifas_n,CAST(tarifas AS NUMERIC)) AS DOUBLE PRECISION) AS tarifas,
        CAST(COALESCE(frete_n,CAST(frete AS NUMERIC)) AS DOUBLE PRECISION) AS frete, CAST(COALESCE(reembolso_n,CAST(reembolso AS NUMERIC)) AS DOUBLE PRECISION) AS reembolso, CAST(COALESCE(afiliados_n,CAST(afiliados AS NUMERIC)) AS DOUBLE PRECISION) AS afiliados, CAST(COALESCE(publicidade_n,CAST(publicidade AS NUMERIC)) AS DOUBLE PRECISION) AS publicidade, CAST(COALESCE(bonus_flex_n,CAST(bonus_flex AS NUMERIC)) AS DOUBLE PRECISION) AS bonus_flex, CAST(COALESCE(custo_motoboy_n,CAST(custo_motoboy AS NUMERIC)) AS DOUBLE PRECISION) AS custo_motoboy, CAST(COALESCE(custo_fatura_n,CAST(custo_fatura AS NUMERIC)) AS DOUBLE PRECISION) AS custo_fatura,
        CAST(COALESCE(subsidios_n,CAST(subsidios AS NUMERIC)) AS DOUBLE PRECISION) AS subsidios, CAST(COALESCE(copart_frete_n,CAST(copart_frete AS NUMERIC)) AS DOUBLE PRECISION) AS copart_frete, CAST(COALESCE(acerto_vapt_n,CAST(acerto_vapt AS NUMERIC)) AS DOUBLE PRECISION) AS acerto_vapt, CAST(COALESCE(repasse_flash_n,CAST(repasse_flash AS NUMERIC)) AS DOUBLE PRECISION) AS repasse_flash, forma_entrega, veio_de_ads
      FROM vendas WHERE ${w.join(" AND ")}`, args);
    const PAR = [["pcheio", "preco_cheio"], ["desc", "desconto"], ["comis", "comissao"], ["tarif", "tarifas"],
      ["freteC", "frete"], ["reemb", "reembolso"], ["afil", "afiliados"], ["pub", "publicidade"],
      ["flex", "bonus_flex"], ["motoboy", "custo_motoboy"], ["fatura", "custo_fatura"],
      ["subs", "subsidios"], ["copart", "copart_frete"], ["vapt", "acerto_vapt"], ["repasse", "repasse_flash"]];
    const abertura = raw.map(v => {
      // mesma chave que o painel monta do DETALHE: pedido|sku|data|canal
      const o = { k: (v.pedido || "") + "|" + (v.sku || "") + "|" + v.data + "|" + (v.canal || "") };
      for (const [curta, col] of PAR) { const x = r2(v[col]); if (x) o[curta] = x; }
      if (v.forma_entrega) o.ent = v.forma_entrega;
      if (v.veio_de_ads) o.ads = v.veio_de_ads;
      return o;
    });
    return { periodo: [q.de || null, q.ate || null], ms: Date.now() - t0, n: abertura.length, abertura };
  }
  // ── /api/equipe — MÉDIA DA EQUIPE, sem nomes (16/10/2026) ──
  // O card "Como estou indo" do gestor compara com a equipe. O perfil gestor só recebe as próprias
  // demandas; aqui vai só o agregado — nenhuma linha, nenhum nome. Mesmas regras do painel.
  if (u.pathname === "/api/equipe") {
    await garantePrecoNovo();
    const desde = /^\d{4}-\d{2}$/.test(q.desde || "") ? q.desde : "2026-10";
    const rs = await dbx.all(`SELECT d.estado, d.criado_em, d.prazo_dias, t.n AS tn, t.reac, r.desfecho FROM demandas d
      LEFT JOIN (SELECT demanda_id, COUNT(*) n, MIN(reacao_h) reac FROM tratativas GROUP BY demanda_id) t ON t.demanda_id=d.id
      LEFT JOIN (SELECT r1.demanda_id, r1.desfecho FROM resultados r1 JOIN (SELECT demanda_id, MAX(id) ult FROM resultados GROUP BY demanda_id) rr ON rr.ult=r1.id) r ON r.demanda_id=d.id
      WHERE d.competencia >= ?`, [desde]);
    let n = 0, reg = 0, venc = 0, noPrazo = 0, med = 0, ok = 0; const agora = Date.now();
    for (const x of rs) {
      n++; const isReg = +x.tn > 0 || x.estado === "trat"; if (isReg) reg++;
      const p = x.prazo_dias == null ? null : +x.prazo_dias, t0 = Date.parse(x.criado_em || "");
      // entra quando o desfecho do prazo é conhecido: registrou (no prazo ou não) ou o prazo venceu
      if (p != null && !isNaN(t0) && (isReg || t0 + p * 864e5 <= agora)) { venc++; if (isReg && x.reac != null && +x.reac / 24 <= p) noPrazo++; }
      const f = !x.desfecho || /Aguardando|Sem venda|Sem leitura|Pausado|parcial/.test(x.desfecho) ? null : /Resolvido|Progrediu|Justificado/.test(x.desfecho);
      if (f != null) { med++; if (f) ok++; }
    }
    const pc = (v, b) => b ? Math.round(1000 * v / b) / 10 : null;
    return { n, registro: pc(reg, n), no_prazo: pc(noPrazo, venc), efeito: pc(ok, med), medidas: med };
  }
  // ── /api/historico — preço e margem MÊS A MÊS de UM anúncio (ou SKU), por SKU ──
  // Pedido dos gestores (14/10/2026): na tarefa, ver a que preço e com que margem o produto vendia
  // antes, para saber o que recuperar. O DETALHE só traz ~4 meses e não pode crescer (OOM no plano
  // free); aqui é um GROUP BY escopado a um anúncio — dezenas de linhas.
  if (u.pathname === "/api/historico") {
    const emp = q.emp || "", mkt = q.mkt || "", anuncio = q.anuncio || "", sku = q.sku || "";
    if (!emp || !mkt || (!anuncio && !sku)) return { erro: "informe emp, mkt e anuncio ou sku" };
    const meses = Math.max(2, Math.min(24, parseInt(q.meses || "13", 10)));
    const ref = /^\d{4}-\d{2}$/.test(q.ate || "") ? q.ate : new Date().toISOString().slice(0, 7);
    const d0 = new Date(ref + "-01T00:00:00Z"); d0.setUTCMonth(d0.getUTCMonth() - (meses - 1));
    if (!(await operacaoDoGestor(user, emp, mkt))) return { anuncio, sku, ate: ref, linhas: [] };
    const w = ["empresa=?", "canal=?", anuncio ? "anuncio_id=?" : "sku=?", "status LIKE '%venda%'", "competencia>=?", "competencia<=?"];
    const args = [emp, mkt, anuncio || sku, d0.toISOString().slice(0, 7), ref];
    const r2 = n => Math.round((+n || 0) * 100) / 100;
    const linhas = (await dbx.all(`SELECT competencia AS mes, sku, SUM(qtd) AS qtd, COUNT(*) AS ped,
        SUM(CAST(COALESCE(receita_n,CAST(receita AS NUMERIC)) AS DOUBLE PRECISION)) AS fat, SUM(CAST(COALESCE(liquido_n,CAST(liquido AS NUMERIC)) AS DOUBLE PRECISION)) AS liq, SUM(CAST(COALESCE(imposto_n,CAST(imposto AS NUMERIC)) AS DOUBLE PRECISION)) AS imp, SUM(CAST(COALESCE(ctp_n,CAST(ctp AS NUMERIC)) AS DOUBLE PRECISION)) AS ctp, SUM(CAST(COALESCE(mc_real_n,CAST(mc_real AS NUMERIC)) AS DOUBLE PRECISION)) AS mc,
        SUM(ABS(CAST(COALESCE(comissao_n,CAST(comissao AS NUMERIC),0) AS DOUBLE PRECISION))) AS comis, SUM(ABS(CAST(COALESCE(tarifas_n,CAST(tarifas AS NUMERIC),0) AS DOUBLE PRECISION))) AS tarif
      FROM vendas WHERE ${w.join(" AND ")} GROUP BY competencia, sku ORDER BY competencia, sku`, args))
      .map(o => ({ mes: o.mes, sku: o.sku, qtd: +o.qtd || 0, ped: +o.ped || 0, fat: r2(o.fat), liq: r2(o.liq),
        imp: r2(o.imp), ctp: r2(o.ctp), mc: r2(o.mc), comis: r2(o.comis), tarif: r2(o.tarif) }));
    return { anuncio, sku, ate: ref, linhas };
  }
  // ── /api/extras — datasets não-vendas (Ads/Estoque/Comissão/Produtos/…) escopados por ponto ──
  if (u.pathname === "/api/extras") {
    const t0 = Date.now();
    const dsr = await dbx.all("SELECT nome, json, atualizado FROM datasets");
    const got = {};
    for (const r of dsr) { try { got[r.nome] = JSON.parse(r.json); } catch (e) {} }
    got._versions = {};
    for (const tipo of ["envios", "custos", "comissao"]) if (user && lancamento.podeLancar(user.perfil, tipo)) got._versions[tipo] = writeStore.versao(tipo, dsr.find(r => r.nome === tipo) || null);
    // Metas usa o vínculo atual do servidor, em vez do mapa estático da página.
    got.operacoes = await dbx.all("SELECT empresa, marketplace, gestor FROM operacoes" +
      (user && user.perfil === "gestor" ? " WHERE gestor=?" : ""),
      user && user.perfil === "gestor" ? [user.gestor_ref] : []);
    if (user && user.perfil === "gestor") {   // macro (ads, estoque, envios) fica o grupo; comissão e acompanhamento, só a operação dele
      const opGestor = {}; (await dbx.all("SELECT empresa, marketplace, gestor FROM operacoes")).forEach(o => { opGestor[o.empresa + " · " + o.marketplace] = o.gestor; });
      const daMinha = r => !!user.gestor_ref && opGestor[r.operacao] === user.gestor_ref;
      const afProprio = r => !!user.gestor_ref && opGestor[r.emp + " · " + r.mkt] === user.gestor_ref;
      if (got.acomp) got.acomp = got.acomp.filter(daMinha);
      if (got.acompItens) got.acompItens = got.acompItens.filter(daMinha);
      if (got.afiliadosDia) got.afiliadosDia = got.afiliadosDia.filter(afProprio);
      if (got.afiliadosFonte) got.afiliadosFonte = got.afiliadosFonte.filter(afProprio);
      if (got.comissao) got.comissao = got.comissao.filter(r => daMinha(r));
      if (got.comissaoDet) got.comissaoDet = got.comissaoDet.filter(r => daMinha(r));
      const skus = new Set(user.gestor_ref ? (await dbx.all("SELECT DISTINCT v.sku sku FROM vendas v JOIN operacoes o ON v.empresa=o.empresa AND v.canal=o.marketplace WHERE o.gestor=?", [user.gestor_ref])).map(r => String(r.sku || "").toUpperCase()) : []);
      if (got.skuCad && typeof got.skuCad === "object" && !Array.isArray(got.skuCad)) {
        const f = {}; for (const k of Object.keys(got.skuCad)) if (skus.has(String(k).toUpperCase())) f[k] = got.skuCad[k];
        got.skuCad = f;
      }
    }
    if (user && user.perfil !== "direcao") delete got.custos;   // DRE só a direção; coordenação e gestor não recebem o blob
    const mx = await dbx.get("SELECT MAX(atualizado) m FROM datasets");   // carimbo do último db-sync (frescor)
    return acessos.filtrarExtras({ ms: Date.now() - t0, ...got, _sync: (mx && mx.m) ? mx.m : null }, user || { perfil: "direcao" });
  }
  return null;
}

let _colPreco = false;   // coluna tratativas.preco_novo garantida uma vez por processo — ANTES de qualquer
// SELECT que a cite: sem ela o /api/demandas falharia e o Acompanhamento inteiro sairia vazio
async function garantePrecoNovo() { if (_colPreco) return; try { await dbx.exec("ALTER TABLE tratativas ADD COLUMN preco_novo REAL"); } catch (e) { }
  try { await dbx.exec("ALTER TABLE tratativas ADD COLUMN aguardar_ate TEXT"); } catch (e) { }
  // checagem do preço praticado (checar-preco.js) — a tabela tem de existir antes do JOIN do /api/demandas
  try { await dbx.exec("CREATE TABLE IF NOT EXISTS checagem_preco (demanda_id TEXT, verificado_em TEXT, preco_informado REAL, preco_praticado REAL, preco_tabela REAL, promocao TEXT, situacao TEXT, status_anuncio TEXT)"); } catch (e) { }   // "aguardando terceiro": até quando (16/10/2026)
  // diagnóstico de promoções (ml-promos.js) — o /api/demandas lê a situação de HOJE das tarefas de promoção (mesmo schema do ml-promos)
  try { await dbx.exec(`CREATE TABLE IF NOT EXISTS promo_diagnostico (data TEXT, empresa TEXT, anuncio TEXT, sku TEXT, produto TEXT, acao TEXT,
      motivo TEXT, faixa TEXT, trajetoria TEXT, vende TEXT, preco_lista REAL, preco_atual REAL, mc_atual REAL, desconto REAL, preco_promo REAL,
      mc_promo REAL, mc_pos_ads REAL, situacao TEXT, campanhas_ativas TEXT, campanhas_elegiveis TEXT, ajustar_preco TEXT, link TEXT,
      PRIMARY KEY (data, empresa, anuncio))`); } catch (e) { }
  try { await dbx.exec(`CREATE TABLE IF NOT EXISTS promo_validacao (demanda_id TEXT PRIMARY KEY, data TEXT, em TEXT, empresa TEXT, anuncio TEXT, acao TEXT,
      preco_informado REAL, veredito TEXT, motivo TEXT, sugestao TEXT, mc_atual REAL, piso REAL)`); } catch (e) { }
  // colunas da verificação de efeito (verificar-tratativas.js) — mesmas garantias, mesma razão
  for (const c of ["preco_antes REAL", "preco_depois REAL", "lucro_dia_antes REAL", "lucro_dia_depois REAL", "un_dia_antes REAL", "un_dia_depois REAL", "aplicou TEXT", "dias INTEGER", "detalhe TEXT"])
    try { await dbx.exec("ALTER TABLE resultados ADD COLUMN " + c); } catch (e) { }
  _colPreco = true; }
// fila de comandos do painel → PC (fila-comandos.js). Mesma tabela nos dois lados; criada por quem chegar primeiro.
let _colCmd = false;
async function garanteComandos() { if (_colCmd) return;
  await dbx.exec(`CREATE TABLE IF NOT EXISTS comandos (id TEXT PRIMARY KEY, criado_em TEXT, pedido_por TEXT, perfil TEXT, gestor TEXT, tipo TEXT,
    demanda_id TEXT, empresa TEXT, anuncio TEXT, estado TEXT, resultado TEXT, atualizado_em TEXT)`);
  _colCmd = true; }
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  try {
    // ── cache-bust: o db-sync chama isto no fim de cada atualização (dado novo → limpa o cache na hora) ──
    if (req.method === "POST" && u.pathname === "/api/cache/clear") {
      if (String(req.headers["x-bust-token"] || "") !== BUST_TOKEN) return J(res, { ok: false, erro: "token inválido" }, 403);
      const n = _gzCache.size; _gzCache.clear(); _geracao = Date.now();
      return J(res, { ok: true, limpas: n });
    }
    // ── LOGIN ──
    if (req.method === "POST" && u.pathname === "/api/login") {
      res.setHeader("Cache-Control", "no-store");
      const b = await body(req);
      const us = await dbx.get("SELECT * FROM usuarios WHERE email=? AND ativo=1", [String(b.email || "").toLowerCase()]);
      if (!us || !verificaSenha(b.senha || "", us.senha)) return J(res, { ok: false, erro: "credenciais inválidas" }, 401);
      const acesso = await usuarios.login(us), trocar = acesso.trocar;
      const token = assinaToken({ id: us.id, revogacao: acesso.revogacao, ...(trocar ? { trocar: true } : {}) });
      let ponto = null;   // ponto do gestor (só p/ a lente visual começar nele; não restringe dados)
      if (us.perfil === "gestor") { const pr = await dbx.get("SELECT v.ponto p, COUNT(*) n FROM vendas v JOIN operacoes o ON v.empresa=o.empresa AND v.canal=o.marketplace WHERE o.gestor=? GROUP BY v.ponto ORDER BY n DESC", [us.gestor_ref]); ponto = pr ? pr.p : null; }
      return J(res, { ok: true, token, ...acesso, ponto, trocar });
    }
    let user = null;
    if (u.pathname.startsWith("/api/")) {
      const s = await sessaoDe(req);
      if (s && s.recusado) return J(res, { ok: false, erro: s.erro }, s.recusado);
      if (s && s.trocar && !["/api/trocar-senha", "/api/sessao"].includes(u.pathname)) return J(res, { ok: false, codigo: "TROCA_OBRIGATORIA", erro: "troque a senha para continuar" }, 403);
      if (s && !s.recusado) user = s;
    }
    if (u.pathname.startsWith("/api/") && user && !acessos.rota(user, req.method, u.pathname)) return J(res, { ok: false, codigo: "PERMISSAO_NEGADA", erro: "Seu perfil e suas permissões não permitem esta ação." }, 403);
    if (u.pathname === "/api/sessao" && req.method === "GET") {
      res.setHeader("Cache-Control", "no-store");
      if (!user) return J(res, { ok: false, erro: "não autenticado" }, 401);
      return J(res, { ok: true, usuario: user });
    }
    // ── POST /api/trocar-senha (usuário logado troca a própria senha) ──
    if (req.method === "POST" && u.pathname === "/api/trocar-senha") {
      if (!user) return J(res, { ok: false, erro: "não autenticado" }, 401);
      const o = await body(req);
      const us = await usuarios.trocar(user, String(o.senha_atual || ""), String(o.senha_nova || ""));
      res.setHeader("Cache-Control", "no-store");
      const token = assinaToken({ id: us.id, revogacao: us.revogacao });
      return J(res, { ok: true, token, usuario: us });
    }
    // ── POST /api/tratativas (gestor registra; calcula reação) ──
    if (req.method === "POST" && u.pathname === "/api/tratativas") {
      if (AUTH_REQ && !user) return J(res, { ok: false, erro: "não autenticado" }, 401);
      const o = await body(req);
      await garantePrecoNovo();
      // Hora do servidor e carteira vigente; registro e estado gravados na mesma transação.
      const salvo = await acompanhamentoRegistros.salvar(dbx, user, o);
      // espelha na planilha Google da operação (o bot lê de lá). Assíncrono: não segura a resposta.
      try { require("./espelho-planilhas").agendarPorDemanda(dbx, o.demanda_id); } catch (e) { console.error("[planilhas] " + e.message); }
      return J(res, salvo);
    }
    // ── POST /api/comandos (29/10/2026) — botão "Reaplicar" de uma tarefa "Promo · Execução falhou" ──
    // O online NÃO executa nada: só enfileira um pedido. Quem executa é o fila-comandos.js no PC (onde moram os tokens do ML), que
    // aceita UM tipo de pedido (reaplicar a promoção de um anúncio). Conta e anúncio vêm da TAREFA no banco, nunca do cliente.
    if (req.method === "POST" && u.pathname === "/api/comandos") {
      if (AUTH_REQ && !user) return J(res, { ok: false, erro: "não autenticado" }, 401);
      const o = await body(req);
      if (o.tipo !== "reaplicar_promo") return J(res, { ok: false, erro: "tipo de comando não permitido" }, 400);
      const dem = await dbx.get("SELECT id, gestor, empresa, canal, anuncio_id, tipo FROM demandas WHERE id=?", [String(o.demanda_id || "")]);
      if (!dem || !/^promo\|/.test(dem.id) || dem.canal !== "Mercado Livre" || !/execução falhou/i.test(dem.tipo || "") || !/^MLB\d{6,}$/.test(dem.anuncio_id || ""))
        return J(res, { ok: false, erro: "esta tarefa não aceita reaplicação automática" }, 400);
      if (user && user.perfil === "gestor" && (!user.gestor_ref || !dem || dem.gestor !== user.gestor_ref)) return J(res, { ok: false, erro: "fora do seu escopo" }, 403);
      await garanteComandos();
      const aberto = await dbx.get("SELECT * FROM comandos WHERE demanda_id=? AND estado IN ('pendente','rodando') ORDER BY criado_em DESC LIMIT 1", [dem.id]);
      if (aberto) return J(res, { ok: true, comando: aberto, repetido: true });
      const cmd = { id: crypto.randomUUID(), criado_em: new Date().toISOString(), pedido_por: (user && user.nome) || "local", perfil: (user && user.perfil) || "", gestor: dem.gestor,
        tipo: "reaplicar_promo", demanda_id: dem.id, empresa: dem.empresa, anuncio: dem.anuncio_id, estado: "pendente", resultado: "", atualizado_em: new Date().toISOString() };
      await dbx.run("INSERT INTO comandos(id,criado_em,pedido_por,perfil,gestor,tipo,demanda_id,empresa,anuncio,estado,resultado,atualizado_em) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
        [cmd.id, cmd.criado_em, cmd.pedido_por, cmd.perfil, cmd.gestor, cmd.tipo, cmd.demanda_id, cmd.empresa, cmd.anuncio, cmd.estado, cmd.resultado, cmd.atualizado_em]);
      return J(res, { ok: true, comando: cmd });
    }
    // O pacote só é substituído se a versão lida ainda é a do banco.
    if (req.method === "POST" && ["/api/envios", "/api/custos", "/api/comissao"].includes(u.pathname)) {
      const tipo = u.pathname.slice(5);
      writeStore.autorizar(tipo, user);
      const o = await body(req);
      const dados = tipo === "envios" ? o.rows : tipo === "custos" ? o.custos : o.linhas;
      const salvo = await writeStore.gravar(dbx, tipo, dados, o.versao, user);
      for (const k of [..._gzCache.keys()]) if (k.startsWith("/api/extras")) _gzCache.delete(k);
      _geracao = Math.max(Date.now(), _geracao + 1);
      return J(res, salvo);
    }
    // Administração usa operações transacionais e o mesmo contrato de acesso da sessão.
    if (u.pathname.startsWith('/api/admin/')) {
      res.setHeader('Cache-Control', 'no-store');
      if (!user || user.perfil !== 'direcao') return J(res,{ok:false,erro:'Somente a Direção pode administrar usuários.'},403);
      let result;
      if(req.method==='GET' && u.pathname==='/api/admin/usuarios') result=await usuarios.listar(user);
      else if(req.method==='GET' && u.pathname==='/api/admin/historico') result=await usuarios.historico(user,Number(u.searchParams.get('id')));
      else if(req.method==='GET' && u.pathname==='/api/admin/remocao') result=await usuarios.remocao(user,Number(u.searchParams.get('id')));
      else if(req.method==='POST' && u.pathname==='/api/admin/usuarios') result=await usuarios.salvar(user,await body(req));
      else if(req.method==='POST' && u.pathname==='/api/admin/reset-senha') result=await usuarios.resetar(user,await body(req));
      else if(req.method==='POST' && u.pathname==='/api/admin/arquivar') result=await usuarios.arquivar(user,await body(req));
      else if(req.method==='POST' && u.pathname==='/api/admin/restaurar') result=await usuarios.arquivar(user,await body(req),true);
      else if(req.method==='POST' && u.pathname==='/api/admin/excluir') result=await usuarios.excluir(user,await body(req));
      else return J(res,{ok:false,erro:'Rota administrativa não encontrada.'},404);
      if(req.method!=='GET')for(const k of [..._gzCache.keys()]) _gzCache.delete(k);
      return J(res,result);
    }
    // ── GET da API ──
    if (req.method === "GET" && u.pathname.startsWith("/api/")) {
      if (AUTH_REQ && u.pathname !== "/api/health" && !user) return J(res, { erro: "não autenticado" }, 401);
      // cache (gzip) das rotas pesadas, por escopo (perfil+gestor) — 1º acesso busca, demais são instantâneos
      const pesada = (u.pathname === "/api/dataset" || u.pathname === "/api/detalhe" || u.pathname === "/api/extras");
      const aceitaGz = /\bgzip\b/.test(String(req.headers["accept-encoding"] || ""));
      // cache por escopo (dados do gestor são restritos ao ponto dele; direção/coord compartilham)
      const macro = u.pathname === "/api/dataset" || u.pathname === "/api/detalhe";
      const escopo = macro ? "grupo" : (user ? user.perfil + ":" + (user.gestor_ref || "") : "anon");
      // Consultas macro já foram autorizadas acima e devolvem o mesmo conteúdo para quem pode ler vendas.
      // Extras compartilham cache apenas quando escopo e permissões efetivas são iguais.
      const assinaturaAcesso=macro?'vendas-v1':user?crypto.createHash('sha256').update(JSON.stringify(user.efetivas)).digest('hex').slice(0,24):'dev';
      const ckey = u.pathname + u.search + "#" + escopo + '#' + assinaturaAcesso;
      const etag = pesada ? etagDe(ckey) : null, vers = etag ? { ETag: etag, "Cache-Control": "private, no-cache" } : {};
      if (etag && String(req.headers["if-none-match"] || "") === etag) { res.writeHead(304, vers); return res.end(); }   // não mudou: o navegador usa a cópia dele
      if (pesada && aceitaGz) { const hit = gzCacheGet(ckey); if (hit) { res.writeHead(200, Object.assign({ "Content-Type": "application/json; charset=utf-8", "Content-Encoding": "gzip", "Access-Control-Allow-Origin": "*", "X-Cache": "HIT" }, vers)); return res.end(hit); } }
      const out = await rotaGET(u, user);
      if (out === null) return J(res, { erro: "rota não encontrada" }, 404);
      if (pesada && aceitaGz) { const buf = zlib.gzipSync(Buffer.from(JSON.stringify(out))); gzCacheSet(ckey, buf); res.writeHead(200, Object.assign({ "Content-Type": "application/json; charset=utf-8", "Content-Encoding": "gzip", "Access-Control-Allow-Origin": "*", "X-Cache": "MISS" }, vers)); return res.end(buf); }
      return JZ(req, res, out);
    }
    // ── estático ──
    let p = decodeURIComponent(u.pathname); if (p === "/") p = INDEX;
    if (AUTH_REQ && p !== INDEX) { res.writeHead(404); return res.end("not found"); }   // online: só a página enxuta (não expõe .js/.json)
    const fp = path.join(STATIC_ROOT, p);
    if (!fp.startsWith(STATIC_ROOT)) { res.writeHead(403); return res.end("forbidden"); }
    fs.readFile(fp, (e, d) => {
      if (e) { res.writeHead(404); return res.end("not found"); }
      const ext = path.extname(fp).toLowerCase();
      const ct = ext === ".html" ? "text/html; charset=utf-8" : ext === ".js" ? "text/javascript" : ext === ".xlsx" ? "application/octet-stream" : "text/plain";
      res.writeHead(200, { "Content-Type": ct }); res.end(d);
    });
  } catch (e) { J(res, { ok: false, codigo: e.codigo || "ERRO_INTERNO", erro: e.message }, e.status || 500); }
});
server.listen(PORT, process.env.BC_QA_NO_WORKER === "1" ? "127.0.0.1" : undefined, () => {
  console.log(`BsanControl 2.0 API · http://localhost:${PORT} · banco: ${dbx.IS_PG ? "Postgres" : "SQLite"} · auth: ${AUTH_REQ ? "exigido" : "dev (aberto)"}`);
  if (process.env.BC_QA_NO_WORKER === "1") return; // Homologação isolada, sem espelhamento externo.
  const espelho = require("./espelho-planilhas");
  const pulso = () => espelho.drenar(dbx).catch(e => console.error("[planilhas] " + e.message));
  setTimeout(pulso, 1500);
  setInterval(pulso, 4000);
});
