// api.js — BsanControl 2.0 API (dual-mode via dbx: SQLite local / Postgres cloud) + login por perfil.
// Serve o BsanControl E os endpoints na mesma origem (sem CORS). uso: node api.js → http://localhost:8787
const http = require("http");
const fs = require("fs");
const path = require("path");
const dbx = require("./dbx");
const { verificaSenha, assinaToken, verificaToken } = require("./auth");

const PORT = process.env.PORT || 8787;
const AUTH_REQ = process.env.AUTH_REQUIRED === "1";                      // em produção: 1 (exige login)
// ONLINE (AUTH_REQ): serve só esta pasta e a página enxuta (Acompanhamento). LOCAL: serve o BsanControl do Drive.
const STATIC_ROOT = AUTH_REQ ? __dirname : path.resolve(__dirname, "..", "..");
const INDEX = AUTH_REQ ? "/acompanhamento.html" : "/BsanControl.html";

const J = (res, obj, code = 200) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }); res.end(JSON.stringify(obj)); };
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
      return J(res, { ok: true, token, nome: us.nome, perfil: us.perfil, gestor_ref: us.gestor_ref });
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
      if (out !== null) return J(res, out);
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
