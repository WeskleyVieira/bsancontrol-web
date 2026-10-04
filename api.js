// api.js — BsanControl 2.0 API (dual-mode via dbx: SQLite local / Postgres cloud) + login por perfil.
// Serve o BsanControl E os endpoints na mesma origem (sem CORS). uso: node api.js → http://localhost:8787
const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const dbx = require("./dbx");
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
const body = req => new Promise(r => { let b = ""; req.on("data", c => b += c); req.on("end", () => { try { r(JSON.parse(b || "{}")); } catch (e) { r({}); } }); });
const userDe = req => { const h = req.headers["authorization"] || ""; return verificaToken(h.replace(/^Bearer\s+/i, "")); };

// demanda do banco → modelo que o Acompanhamento (ac2) consome
const mapDem = r => ({ id: r.id, empresa: r.empresa, mkt: r.canal, ponto: r.ponto, gestor: r.gestor, sku: r.sku, anuncio: r.anuncio_id,
  titulo: r.titulo, tipo: r.tipo, causa: r.causa, mcPct: r.mc_pct, meta: r.meta, fat: r.fat, risco: r.risco,
  estado: r.estado || "diag", trat: r.acao || null, reacaoH: r.reacao_h, tratD: null, demora: 0,
  recuperado: r.recuperado || 0, funcionou: r.desfecho ? (r.desfecho === "Resolvido" || r.desfecho === "Progrediu") : null });

async function rotaGET(u, user) {
  const q = Object.fromEntries(u.searchParams);
  if (u.pathname === "/api/health") {
    const v = await dbx.get("SELECT COUNT(*) n FROM vendas");
    const d = await dbx.get("SELECT COUNT(*) n FROM demandas");
    return { ok: true, banco: dbx.IS_PG ? "Postgres" : "SQLite", vendas: v.n, demandas: d.n };
  }
  if (u.pathname === "/api/demandas") {
    // ESCOPO POR PERFIL: gestor só vê as contas dele; direção/coordenação veem tudo
    let sql = `SELECT d.*, t.acao, t.reacao_h, r.desfecho, r.recuperado FROM demandas d
      LEFT JOIN (SELECT demanda_id, MAX(acao) acao, MAX(reacao_h) reacao_h FROM tratativas GROUP BY demanda_id) t ON t.demanda_id=d.id
      LEFT JOIN (SELECT demanda_id, MAX(desfecho) desfecho, MAX(recuperado) recuperado FROM resultados GROUP BY demanda_id) r ON r.demanda_id=d.id`;
    const args = [], w = [];
    if (q.mes) { w.push("d.competencia=?"); args.push(q.mes); }
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
    let pontoScope = null;
    if (user && user.perfil === "gestor") {   // gestor: escopo pelo ponto (estoque) das contas dele
      const pr = await dbx.get("SELECT v.ponto p, COUNT(*) n FROM vendas v JOIN operacoes o ON v.empresa=o.empresa AND v.canal=o.marketplace WHERE o.gestor=? GROUP BY v.ponto ORDER BY n DESC", [user.gestor_ref]);
      pontoScope = pr ? pr.p : "__nenhum__";
      w.push("ponto=?"); args.push(pontoScope);
    }
    const W = "WHERE " + w.join(" AND ");
    const r2 = n => Math.round((+n || 0) * 100) / 100;
    // UMA query só; os agregados (ROWS/SKU_*) são montados no Node (ms) — bem mais rápido que 5 GROUP BY
    const raw = await dbx.all(`SELECT data, competencia, empresa, canal, ponto, sku, anuncio_id, titulo, pedido,
        qtd, receita, liquido, ctp, imposto, mc_real, mc_comissao, fonte_liquido, status FROM vendas ${W}`, args);
    const detalhe = [], rowsM = new Map(), smM = new Map(), skM = new Map(), smmM = new Map();
    for (const v of raw) {
      const date = v.data, emp = v.empresa, mkt = v.canal, ponto = v.ponto, sku = v.sku, mes = v.competencia;
      const fat = +v.receita || 0, liq = +v.liquido || 0, ctp = +v.ctp || 0, imp = +v.imposto || 0,
        mcr = +v.mc_real || 0, mcc = +v.mc_comissao || 0, qtd = +v.qtd || 0;
      detalhe.push({ date, emp, mkt, sku, tit: v.titulo, ped: v.pedido, anuncio: v.anuncio_id, qtd: r2(qtd),
        fat: r2(fat), liq: r2(liq), ctp: r2(ctp), imp: r2(imp), mc: r2(mcc), mccom: r2(mcc), mcReal: r2(mcr),
        fonte: v.fonte_liquido, stat: v.status, ponto });
      let k, o;
      k = date + "|" + emp + "|" + mkt; o = rowsM.get(k); if (!o) { o = { date, emp, mkt, ponto, fat: 0, liq: 0, ctp: 0, imp: 0, mc: 0, mcReal: 0, qtd: 0, ped: 0 }; rowsM.set(k, o); }
      o.fat += fat; o.liq += liq; o.ctp += ctp; o.imp += imp; o.mc += mcc; o.mcReal += mcr; o.qtd += qtd; o.ped += 1;
      k = mes + "|" + sku; o = smM.get(k); if (!o) { o = { mes, SKU: sku, fat: 0, liq: 0, ctp: 0, imp: 0, mc: 0, qtd: 0 }; smM.set(k, o); }
      o.fat += fat; o.liq += liq; o.ctp += ctp; o.imp += imp; o.mc += mcr; o.qtd += qtd;   // SKU: margem real
      k = mkt + "|" + sku; o = skM.get(k); if (!o) { o = { mkt, sku, qtd: 0, fat: 0, mc: 0, liq: 0 }; skM.set(k, o); }
      o.qtd += qtd; o.fat += fat; o.mc += mcr; o.liq += liq;
      k = mes + "|" + mkt + "|" + sku; o = smmM.get(k); if (!o) { o = { mes, mkt, sku, fat: 0, mc: 0, qtd: 0, liq: 0 }; smmM.set(k, o); }
      o.fat += fat; o.mc += mcr; o.qtd += qtd; o.liq += liq;
    }
    const round = (arr, flds) => { for (const o of arr) for (const f of flds) o[f] = r2(o[f]); return arr; };
    const rows = round([...rowsM.values()], ["fat", "liq", "ctp", "imp", "mc", "mcReal", "qtd"]);
    const skuMon = round([...smM.values()], ["fat", "liq", "ctp", "imp", "mc", "qtd"]);
    const skuMkt = round([...skM.values()], ["qtd", "fat", "mc", "liq"]);
    const skuMktMon = round([...smmM.values()], ["fat", "mc", "qtd", "liq"]);
    return { periodo: [de, ate], ponto: pontoScope, ms: Date.now() - t0,
      contagem: { rows: rows.length, detalhe: detalhe.length, skuMon: skuMon.length, skuMkt: skuMkt.length, skuMktMon: skuMktMon.length },
      rows, detalhe, skuMon, skuMkt, skuMktMon };
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  try {
    // ── LOGIN ──
    if (req.method === "POST" && u.pathname === "/api/login") {
      const b = await body(req);
      const us = await dbx.get("SELECT * FROM usuarios WHERE email=? AND ativo=1", [String(b.email || "").toLowerCase()]);
      if (!us || !verificaSenha(b.senha || "", us.senha)) return J(res, { ok: false, erro: "credenciais inválidas" }, 401);
      const token = assinaToken({ id: us.id, nome: us.nome, perfil: us.perfil, gestor_ref: us.gestor_ref });
      const trocar = verificaSenha(SENHA_PADRAO, us.senha);   // ainda na senha padrão → front força a troca
      return J(res, { ok: true, token, nome: us.nome, perfil: us.perfil, gestor_ref: us.gestor_ref, trocar });
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
    // ── GET da API ──
    if (req.method === "GET" && u.pathname.startsWith("/api/")) {
      const user = userDe(req);
      if (AUTH_REQ && u.pathname !== "/api/health" && !user) return J(res, { erro: "não autenticado" }, 401);
      const out = await rotaGET(u, user);
      if (out !== null) return JZ(req, res, out);
      return J(res, { erro: "rota não encontrada" }, 404);
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
