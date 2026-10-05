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
const GZ_TTL = +(process.env.CACHE_TTL_MS || 15 * 60 * 1000);
const GZ_CAP = 90 * 1024 * 1024;   // ~90MB de teto (Render free tem 512MB)
function gzCacheGet(k) { const e = _gzCache.get(k); if (e && Date.now() - e.t < GZ_TTL) { _gzCache.delete(k); _gzCache.set(k, e); return e.buf; } if (e) _gzCache.delete(k); return null; }
function gzCacheSet(k, buf) { let tot = buf.length; for (const e of _gzCache.values()) tot += e.buf.length; while (tot > GZ_CAP && _gzCache.size) { const first = _gzCache.keys().next().value; tot -= _gzCache.get(first).buf.length; _gzCache.delete(first); } _gzCache.set(k, { t: Date.now(), buf }); }
// ponto(s) em que um gestor opera (1 ou 2) — restringe a visão dele; direção/coord veem tudo
async function pontosDoGestor(gestorRef) {
  const rs = await dbx.all("SELECT DISTINCT v.ponto p FROM vendas v JOIN operacoes o ON v.empresa=o.empresa AND v.canal=o.marketplace WHERE o.gestor=?", [gestorRef]);
  return rs.map(r => r.p).filter(Boolean);
}
const body = req => new Promise(r => { let b = ""; req.on("data", c => b += c); req.on("end", () => { try { r(JSON.parse(b || "{}")); } catch (e) { r({}); } }); });
const userDe = req => { const h = req.headers["authorization"] || ""; return verificaToken(h.replace(/^Bearer\s+/i, "")); };

// demanda do banco → modelo que o Acompanhamento (ac2) consome
const mapDem = r => ({ id: r.id, competencia: r.competencia, empresa: r.empresa, mkt: r.canal, ponto: r.ponto, gestor: r.gestor, sku: r.sku, anuncio: r.anuncio_id,
  titulo: r.titulo, tipo: r.tipo, causa: r.causa, mcPct: r.mc_pct, meta: r.meta, fat: r.fat, risco: r.risco, qtd: r.qtd, pedidos: r.pedidos,
  estado: (r.estado && r.estado !== "diag") ? r.estado : (r.acao ? "trat" : "diag"), trat: r.acao || null, reacaoH: r.reacao_h, tratD: null, demora: 0,
  recuperado: r.recuperado || 0, funcionou: r.desfecho ? (r.desfecho === "Resolvido" || r.desfecho === "Progrediu") : null });

async function rotaGET(u, user) {
  const q = Object.fromEntries(u.searchParams);
  if (u.pathname === "/api/health") {
    const v = await dbx.get("SELECT COUNT(*) n FROM vendas");
    const d = await dbx.get("SELECT COUNT(*) n FROM demandas");
    const s = await dbx.get("SELECT MAX(atualizado) m FROM datasets");   // carimbo do último db-sync (p/ o auto-refresh detectar dado novo)
    return { ok: true, banco: dbx.IS_PG ? "Postgres" : "SQLite", vendas: v.n, demandas: d.n, _sync: (s && s.m) ? s.m : null };
  }
  if (u.pathname === "/api/demandas") {
    // ESCOPO POR PERFIL: gestor só vê as contas dele; direção/coordenação veem tudo
    let sql = `SELECT d.*, t.acao, t.reacao_h, r.desfecho, r.recuperado FROM demandas d
      LEFT JOIN (SELECT demanda_id, MAX(acao) acao, MAX(reacao_h) reacao_h FROM tratativas GROUP BY demanda_id) t ON t.demanda_id=d.id
      LEFT JOIN (SELECT demanda_id, MAX(desfecho) desfecho, MAX(recuperado) recuperado FROM resultados GROUP BY demanda_id) r ON r.demanda_id=d.id`;
    const args = [], w = [];
    if (q.mes) { w.push("d.competencia=?"); args.push(q.mes); }   // ?mes opcional; sem ele devolve todos os meses — o painel filtra por período no cliente (segue o filtro do topo)
    if (user && user.perfil === "gestor") { w.push("d.gestor=?"); args.push(user.gestor_ref); }
    if (w.length) sql += " WHERE " + w.join(" AND ");
    sql += " ORDER BY d.risco DESC";
    return (await dbx.all(sql, args)).map(mapDem);
  }
  if (u.pathname === "/api/vendas-agregado") {
    const de = q.de || "0000-00-00", ate = q.ate || "9999-99-99", t0 = Date.now();
    const kpi = await dbx.get("SELECT COUNT(*) n, ROUND(SUM(receita)) fat, ROUND(SUM(mc_comissao)) mc FROM vendas WHERE data>=? AND data<=? AND status LIKE '%venda%'", [de, ate]);
    const porOp = await dbx.all("SELECT empresa, canal, ROUND(SUM(receita)) fat, ROUND(SUM(mc_comissao)) mc, COUNT(*) n FROM vendas WHERE data>=? AND data<=? AND status LIKE '%venda%' GROUP BY empresa, canal ORDER BY mc DESC", [de, ate]);
    return { periodo: [de, ate], ms: Date.now() - t0, kpi, por_operacao: porOp };
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
    if (user && user.perfil === "gestor") { const pts = await pontosDoGestor(user.gestor_ref); if (pts.length) { w.push("ponto IN (" + pts.map(() => "?").join(",") + ")"); args.push(...pts); } }
    const W = "WHERE " + w.join(" AND ");
    const r2 = n => Math.round((+n || 0) * 100) / 100;
    const mapMoney = (a, campos) => a.map(o => { for (const c of campos) o[c] = r2(o[c]); return o; });
    // AGREGADOS via GROUP BY no banco (retorna ~11k linhas, não as 37k cruas) — carga inicial leve.
    // O DETALHE (linha a linha, pesado) é lazy: /api/detalhe, só quando Raio-X/Panorama precisam.
    const rows = mapMoney(await dbx.all(`SELECT data AS date, empresa AS emp, canal AS mkt, ponto,
        SUM(receita) AS fat, SUM(liquido) AS liq, SUM(ctp) AS ctp, SUM(imposto) AS imp,
        SUM(mc_comissao) AS mc, SUM(mc_real) AS "mcReal", SUM(qtd) AS qtd, COUNT(*) AS ped
      FROM vendas ${W} GROUP BY data, empresa, canal, ponto`, args), ["fat", "liq", "ctp", "imp", "mc", "mcReal", "qtd"]);
    rows.forEach(o => { o.ped = +o.ped; });
    const skuMon = mapMoney(await dbx.all(`SELECT competencia AS mes, sku AS "SKU", SUM(receita) AS fat, SUM(liquido) AS liq,
        SUM(ctp) AS ctp, SUM(imposto) AS imp, SUM(mc_real) AS mc, SUM(qtd) AS qtd FROM vendas ${W} GROUP BY competencia, sku`, args), ["fat", "liq", "ctp", "imp", "mc", "qtd"]);
    const skuMkt = mapMoney(await dbx.all(`SELECT canal AS mkt, sku, SUM(qtd) AS qtd, SUM(receita) AS fat, SUM(mc_real) AS mc,
        SUM(liquido) AS liq FROM vendas ${W} GROUP BY canal, sku`, args), ["qtd", "fat", "mc", "liq"]);
    const skuMktMon = mapMoney(await dbx.all(`SELECT competencia AS mes, canal AS mkt, sku, SUM(receita) AS fat, SUM(mc_real) AS mc,
        SUM(qtd) AS qtd, SUM(liquido) AS liq FROM vendas ${W} GROUP BY competencia, canal, sku`, args), ["fat", "mc", "qtd", "liq"]);
    return { periodo: [de, ate], ms: Date.now() - t0,
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
    if (user && user.perfil === "gestor") { const pts = await pontosDoGestor(user.gestor_ref); if (pts.length) { w.push("ponto IN (" + pts.map(() => "?").join(",") + ")"); args.push(...pts); } }
    const r2 = n => Math.round((+n || 0) * 100) / 100;
    const raw = await dbx.all(`SELECT data, empresa, canal, ponto, sku, anuncio_id, titulo, pedido,
        qtd, receita, liquido, ctp, imposto, mc_real, mc_comissao, fonte_liquido, status FROM vendas WHERE ${w.join(" AND ")}`, args);
    const detalhe = raw.map(v => ({ date: v.data, emp: v.empresa, mkt: v.canal, sku: v.sku, tit: v.titulo, ped: v.pedido,
      anuncio: v.anuncio_id, qtd: r2(v.qtd), fat: r2(v.receita), liq: r2(v.liquido), ctp: r2(v.ctp), imp: r2(v.imposto),
      mc: r2(v.mc_comissao), mccom: r2(v.mc_comissao), mcReal: r2(v.mc_real), fonte: v.fonte_liquido, stat: v.status, ponto: v.ponto }));
    return { periodo: [de, ate], ms: Date.now() - t0, n: detalhe.length, detalhe };
  }
  // ── /api/extras — datasets não-vendas (Ads/Estoque/Comissão/Produtos/…) escopados por ponto ──
  if (u.pathname === "/api/extras") {
    const t0 = Date.now();
    const dsr = await dbx.all("SELECT nome, json FROM datasets");
    const got = {};
    for (const r of dsr) { try { got[r.nome] = JSON.parse(r.json); } catch (e) {} }
    if (user && user.perfil === "gestor") {   // gestor: dados do(s) ponto(s) dele; comissão só das operações dele
      const pts = new Set(await pontosDoGestor(user.gestor_ref));
      const opm = {};   // op (emp|mkt) → ponto dominante
      (await dbx.all("SELECT empresa, canal, ponto, COUNT(*) n FROM vendas GROUP BY empresa, canal, ponto ORDER BY n DESC")).forEach(r => { const k = r.empresa + "|" + r.canal; if (!(k in opm)) opm[k] = r.ponto; });
      const porOp = r => pts.has(opm[(r.emp || "") + "|" + (r.mkt || "")]);
      if (got.ads) got.ads = got.ads.filter(porOp);
      if (got.adsCamp) got.adsCamp = got.adsCamp.filter(porOp);
      if (got.adsDia) got.adsDia = got.adsDia.filter(porOp);
      if (got.estoque) got.estoque = got.estoque.filter(r => pts.has(r.ponto));
      if (got.produtos) got.produtos = got.produtos.filter(r => pts.has(r.ponto));
      if (got.envios) { const empm = {}; (await dbx.all("SELECT empresa, ponto, COUNT(*) n FROM vendas GROUP BY empresa, ponto ORDER BY n DESC")).forEach(r => { if (!(r.empresa in empm)) empm[r.empresa] = r.ponto; }); got.envios = got.envios.filter(r => pts.has(empm[r.empresa])); }
      const opGestor = {}; (await dbx.all("SELECT empresa, marketplace, gestor FROM operacoes")).forEach(o => { opGestor[o.empresa + " · " + o.marketplace] = o.gestor; });
      if (got.comissao) got.comissao = got.comissao.filter(r => opGestor[r.operacao] === user.gestor_ref);
      if (got.comissaoDet) got.comissaoDet = got.comissaoDet.filter(r => opGestor[r.operacao] === user.gestor_ref);
      delete got.custos;   // custos/DRE é financeiro — gestor não vê
    }
    const mx = await dbx.get("SELECT MAX(atualizado) m FROM datasets");   // carimbo do último db-sync (frescor)
    return { ms: Date.now() - t0, ...got, _sync: (mx && mx.m) ? mx.m : null };
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  try {
    // ── cache-bust: o db-sync chama isto no fim de cada atualização (dado novo → limpa o cache na hora) ──
    if (req.method === "POST" && u.pathname === "/api/cache/clear") {
      if (String(req.headers["x-bust-token"] || "") !== BUST_TOKEN) return J(res, { ok: false, erro: "token inválido" }, 403);
      const n = _gzCache.size; _gzCache.clear();
      return J(res, { ok: true, limpas: n });
    }
    // ── LOGIN ──
    if (req.method === "POST" && u.pathname === "/api/login") {
      const b = await body(req);
      const us = await dbx.get("SELECT * FROM usuarios WHERE email=? AND ativo=1", [String(b.email || "").toLowerCase()]);
      if (!us || !verificaSenha(b.senha || "", us.senha)) return J(res, { ok: false, erro: "credenciais inválidas" }, 401);
      const token = assinaToken({ id: us.id, nome: us.nome, perfil: us.perfil, gestor_ref: us.gestor_ref });
      const trocar = verificaSenha(SENHA_PADRAO, us.senha);   // ainda na senha padrão → front força a troca
      let ponto = null;   // ponto do gestor (só p/ a lente visual começar nele; não restringe dados)
      if (us.perfil === "gestor") { const pr = await dbx.get("SELECT v.ponto p, COUNT(*) n FROM vendas v JOIN operacoes o ON v.empresa=o.empresa AND v.canal=o.marketplace WHERE o.gestor=? GROUP BY v.ponto ORDER BY n DESC", [us.gestor_ref]); ponto = pr ? pr.p : null; }
      return J(res, { ok: true, token, nome: us.nome, perfil: us.perfil, gestor_ref: us.gestor_ref, ponto, trocar });
    }
    // ── POST /api/trocar-senha (usuário logado troca a própria senha) ──
    if (req.method === "POST" && u.pathname === "/api/trocar-senha") {
      const user = userDe(req);
      if (!user) return J(res, { ok: false, erro: "não autenticado" }, 401);
      const o = await body(req);
      const us = await dbx.get("SELECT * FROM usuarios WHERE id=? AND ativo=1", [user.id]);
      if (!us || !verificaSenha(o.senha_atual || "", us.senha)) return J(res, { ok: false, erro: "senha atual incorreta" }, 400);
      const nova = String(o.senha_nova || "");
      if (nova.length < 6) return J(res, { ok: false, erro: "a nova senha precisa de ao menos 6 caracteres" }, 400);
      if (verificaSenha(nova, us.senha)) return J(res, { ok: false, erro: "a nova senha não pode ser igual à atual" }, 400);
      await dbx.run("UPDATE usuarios SET senha=? WHERE id=?", [hashSenha(nova), us.id]);
      return J(res, { ok: true });
    }
    // ── POST /api/tratativas (gestor registra; calcula reação) ──
    if (req.method === "POST" && u.pathname === "/api/tratativas") {
      const user = userDe(req);
      if (AUTH_REQ && !user) return J(res, { ok: false, erro: "não autenticado" }, 401);
      const o = await body(req);
      const dem = await dbx.get("SELECT criado_em, gestor FROM demandas WHERE id=?", [o.demanda_id]);
      if (user && user.perfil === "gestor" && dem && dem.gestor !== user.gestor_ref) return J(res, { ok: false, erro: "fora do seu escopo" }, 403);
      const reacaoH = dem && o.registrado_em ? (new Date(o.registrado_em) - new Date(dem.criado_em)) / 36e5 : null;
      await dbx.run("INSERT INTO tratativas(demanda_id,gestor,acao,causa,obs,estado,registrado_em,reacao_h) VALUES(?,?,?,?,?,?,?,?)",
        [o.demanda_id, (user && user.gestor_ref) || o.gestor || "", o.acao || "", o.causa || "", o.obs || "", o.estado || "trat", o.registrado_em || new Date().toISOString(), reacaoH]);
      if (o.estado) await dbx.run("UPDATE demandas SET estado=? WHERE id=?", [o.estado, o.demanda_id]);
      return J(res, { ok: true, reacaoH });
    }
    // ── POST /api/envios (coord/direção sobe a planilha de envios → salva na nuvem) ──
    if (req.method === "POST" && u.pathname === "/api/envios") {
      const user = userDe(req);
      if (AUTH_REQ && !user) return J(res, { ok: false, erro: "não autenticado" }, 401);
      if (user && user.perfil === "gestor") return J(res, { ok: false, erro: "sem permissão (só coordenação/direção)" }, 403);
      const o = await body(req);
      const rows = Array.isArray(o.rows) ? o.rows : [];
      await dbx.run("INSERT INTO datasets(nome,json,atualizado) VALUES(?,?,?) ON CONFLICT(nome) DO UPDATE SET json=EXCLUDED.json, atualizado=EXCLUDED.atualizado",
        ["envios", JSON.stringify(rows), new Date().toISOString()]);
      for (const k of [..._gzCache.keys()]) if (k.startsWith("/api/extras")) _gzCache.delete(k);   // invalida cache
      return J(res, { ok: true, n: rows.length });
    }
    // ── POST /api/custos (coord/direção sobem custos operacionais + afi/lives; Ads já vem do dataset) ──
    if (req.method === "POST" && u.pathname === "/api/custos") {
      const user = userDe(req);
      if (AUTH_REQ && !user) return J(res, { ok: false, erro: "não autenticado" }, 401);
      if (user && user.perfil === "gestor") return J(res, { ok: false, erro: "sem permissão (só coordenação/direção)" }, 403);
      const o = await body(req);
      await dbx.run("INSERT INTO datasets(nome,json,atualizado) VALUES(?,?,?) ON CONFLICT(nome) DO UPDATE SET json=EXCLUDED.json, atualizado=EXCLUDED.atualizado",
        ["custos", JSON.stringify(o.custos || {}), new Date().toISOString()]);
      for (const k of [..._gzCache.keys()]) if (k.startsWith("/api/extras")) _gzCache.delete(k);
      return J(res, { ok: true });
    }
    // ── ADMIN de usuários (SÓ Direção) ──
    if (u.pathname.startsWith("/api/admin/")) {
      const user = userDe(req);
      if ((AUTH_REQ && !user) || (user && user.perfil !== "direcao")) return J(res, { ok: false, erro: "acesso só de administrador (Direção)" }, 403);
      if (req.method === "GET" && u.pathname === "/api/admin/usuarios") {
        const us = await dbx.all("SELECT id, nome, email, perfil, gestor_ref, ativo, senha FROM usuarios ORDER BY perfil, nome");
        const gestores = (await dbx.all("SELECT DISTINCT gestor FROM operacoes ORDER BY gestor")).map(r => r.gestor);
        return J(res, { ok: true, gestores, usuarios: us.map(x => ({ id: x.id, nome: x.nome, email: x.email, perfil: x.perfil, gestor_ref: x.gestor_ref, ativo: x.ativo, senha_padrao: verificaSenha(SENHA_PADRAO, x.senha) })) });
      }
      if (req.method === "POST" && u.pathname === "/api/admin/usuarios") {
        const o = await body(req);
        const nome = String(o.nome || "").trim(), email = String(o.email || "").trim().toLowerCase(), perfil = String(o.perfil || "gestor").trim();
        if (!nome || !email) return J(res, { ok: false, erro: "nome e e-mail são obrigatórios" }, 400);
        if (!["direcao", "coordenacao", "gestor"].includes(perfil)) return J(res, { ok: false, erro: "perfil inválido" }, 400);
        const gestor_ref = perfil === "gestor" ? (String(o.gestor_ref || "").trim() || null) : null;
        const ativo = (o.ativo === 0 || o.ativo === false) ? 0 : 1;
        const existe = await dbx.get("SELECT id FROM usuarios WHERE email=?", [email]);
        if (existe) { await dbx.run("UPDATE usuarios SET nome=?, perfil=?, gestor_ref=?, ativo=? WHERE email=?", [nome, perfil, gestor_ref, ativo, email]); return J(res, { ok: true, acao: "atualizado" }); }
        await dbx.run("INSERT INTO usuarios(nome,email,senha,perfil,gestor_ref,ativo) VALUES(?,?,?,?,?,?)", [nome, email, hashSenha(SENHA_PADRAO), perfil, gestor_ref, ativo]);
        return J(res, { ok: true, acao: "criado", senha_inicial: SENHA_PADRAO });
      }
      if (req.method === "POST" && u.pathname === "/api/admin/reset-senha") {
        const o = await body(req); await dbx.run("UPDATE usuarios SET senha=? WHERE id=?", [hashSenha(SENHA_PADRAO), +o.id]);
        return J(res, { ok: true, senha_inicial: SENHA_PADRAO });
      }
      return J(res, { ok: false, erro: "rota admin não encontrada" }, 404);
    }
    // ── GET da API ──
    if (req.method === "GET" && u.pathname.startsWith("/api/")) {
      const user = userDe(req);
      if (AUTH_REQ && u.pathname !== "/api/health" && !user) return J(res, { erro: "não autenticado" }, 401);
      // cache (gzip) das rotas pesadas, por escopo (perfil+gestor) — 1º acesso busca, demais são instantâneos
      const pesada = (u.pathname === "/api/dataset" || u.pathname === "/api/detalhe" || u.pathname === "/api/extras");
      const aceitaGz = /\bgzip\b/.test(String(req.headers["accept-encoding"] || ""));
      // cache por escopo (dados do gestor são restritos ao ponto dele; direção/coord compartilham)
      const ckey = u.pathname + u.search + "#" + (user ? user.perfil + ":" + (user.gestor_ref || "") : "anon");
      if (pesada && aceitaGz) { const hit = gzCacheGet(ckey); if (hit) { res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Content-Encoding": "gzip", "Access-Control-Allow-Origin": "*", "X-Cache": "HIT" }); return res.end(hit); } }
      const out = await rotaGET(u, user);
      if (out === null) return J(res, { erro: "rota não encontrada" }, 404);
      if (pesada && aceitaGz) { const buf = zlib.gzipSync(Buffer.from(JSON.stringify(out))); gzCacheSet(ckey, buf); res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Content-Encoding": "gzip", "Access-Control-Allow-Origin": "*", "X-Cache": "MISS" }); return res.end(buf); }
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
  } catch (e) { J(res, { erro: e.message }, 500); }
});
server.listen(PORT, () => console.log(`BsanControl 2.0 API · http://localhost:${PORT} · banco: ${dbx.IS_PG ? "Postgres" : "SQLite"} · auth: ${AUTH_REQ ? "exigido" : "dev (aberto)"}`));
