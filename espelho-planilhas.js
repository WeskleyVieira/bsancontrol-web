// espelho-planilhas.js — MÓDULO: espelha tarefas e registros dos gestores nas planilhas Google,
// UMA POR OPERAÇÃO, via o Apps Script (apps-script/Planilhas.gs). Usado em dois lugares:
//   api.js           — quando o gestor registra uma tarefa, atualiza a planilha da operação na hora
//   plano-sheets.js  — sincroniza todas as operações (tarefas novas do dia, depois do db-sync)
//
// UMA PORTA SÓ: o registro nasce no BsanControl (o servidor carimba a hora — é a métrica de
// agilidade). A planilha é espelho, somente leitura, e cada envio reescreve as abas da operação
// inteira a partir do banco. Não há nada do gestor dentro da planilha para preservar.
//
// Configuração: variáveis PLANILHAS_URL e PLANILHAS_TOKEN (Render) ou planilhas_config.json
// { "url": ".../exec", "token": "..." } (pipeline). Sem configuração, tudo vira no-op silencioso.
const fs = require("fs"), path = require("path"), https = require("https"), { URL } = require("url");

const S = v => String(v == null ? "" : v).trim();
const n = v => Number(v) || 0;

function config() {
  if (process.env.PLANILHAS_URL && process.env.PLANILHAS_TOKEN) return { url: process.env.PLANILHAS_URL, token: process.env.PLANILHAS_TOKEN };
  try { const c = JSON.parse(fs.readFileSync(path.join(__dirname, "planilhas_config.json"), "utf8")); if (c.url && c.token) return c; } catch (e) { }
  return null;
}

// O /exec do Apps Script responde 302 para googleusercontent: o resultado está no Location (GET).
function http(metodo, urlStr, corpo, saltos = 0) {
  return new Promise((res, rej) => {
    const u = new URL(urlStr), body = corpo == null ? null : JSON.stringify(corpo);
    const h = body ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } : {};
    const r = https.request({ hostname: u.hostname, path: u.pathname + u.search, method: metodo, headers: h }, x => {
      if (x.statusCode >= 300 && x.statusCode < 400 && x.headers.location && saltos < 5) {
        x.resume(); return http("GET", x.headers.location, null, saltos + 1).then(res, rej);
      }
      let d = ""; x.on("data", c => d += c);
      x.on("end", () => { try { const j = JSON.parse(d); j.ok ? res(j) : rej(new Error(j.erro || "falhou")); }
        catch (e) { rej(new Error("HTTP " + x.statusCode + " · " + d.slice(0, 200))); } });
    });
    r.setTimeout(120000, () => r.destroy(new Error("timeout")));
    r.on("error", rej); if (body) r.write(body); r.end();
  });
}
const chamar = (cfg, corpo) => http("POST", cfg.url, Object.assign({ token: cfg.token }, corpo));

// competência mínima = a MESMA régua do painel (AC2_DESDE no BsanControl.html): demanda de setembro
// para trás é do modelo antigo e não entra na cobrança. Daqui para frente, todos os meses entram.
// Se o painel mudar a régua, mude aqui junto — senão a planilha e o painel contam coisas diferentes.
const AC2_DESDE = "2026-10";
function desdePadrao() { return AC2_DESDE; }
const opDe = (empresa, canal) => S(empresa) + " · " + S(canal);

const ACAO = {
  "Estancamento de Prejuízo": "Subir preço, renegociar custo ou pausar o anúncio.",
  "Correção de Margem": "Rever preço, custo da ficha e frete.",
  "Queima de Margem": "Agir agora, antes de virar prejuízo: preço ou custo.",
  "Maturação (produto novo)": "Produto novo: trabalhar a margem, não descartar."
};
const ORIGEM = { "": "BsanControl", planilha: "Planilha antiga", historico: "Histórico (importado)" };

const CAB_TAREFAS = ["Competência", "Gestor", "Prioridade", "Tipo de ação", "Anúncio", "Produto", "Impacto R$",
  "Margem hoje %", "Meta %", "Situação hoje", "Ação recomendada", "Status", "Última ação registrada",
  "Causa", "Observação", "Registrado em", "Reação (h)", "Nº de registros", "Resultado", "Criada em", "ID da tarefa"];
const CAB_REGISTROS = ["Registrado em", "Gestor", "Competência", "Anúncio", "Produto", "Tipo de ação",
  "Ação", "Causa", "Observação", "Reação (h)", "Origem", "ID da tarefa"];
const DATAS = ["Registrado em", "Criada em"];

async function emLotes(dbx, sql, ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 400) {
    const ch = ids.slice(i, i + 400);
    out.push(...await dbx.all(sql.replace("(?)", "(" + ch.map(() => "?").join(",") + ")"), ch));
  }
  return out;
}

// Abas de UMA operação, prontas para o Apps Script.
async function montarOperacao(dbx, empresa, canal, desde) {
  const dem = await dbx.all("SELECT * FROM demandas WHERE empresa=? AND canal=? AND competencia>=? ORDER BY competencia DESC, risco DESC",
    [empresa, canal, desde]);
  const ids = dem.map(d => S(d.id));
  const trat = ids.length ? await emLotes(dbx, "SELECT * FROM tratativas WHERE demanda_id IN (?) ORDER BY registrado_em", ids) : [];
  const res = ids.length ? await emLotes(dbx, "SELECT * FROM resultados WHERE demanda_id IN (?) ORDER BY verificado_em", ids) : [];
  const tPor = {}, rPor = {};
  trat.forEach(t => (tPor[S(t.demanda_id)] = tPor[S(t.demanda_id)] || []).push(t));
  res.forEach(r => { rPor[S(r.demanda_id)] = r; });            // o último verificado vale
  const porId = {}; dem.forEach(d => porId[S(d.id)] = d);

  const op = await dbx.get("SELECT gestor FROM operacoes WHERE empresa=? AND marketplace=?", [empresa, canal]);
  const prio = {}; const rank = {};                              // prioridade = posição por impacto dentro da competência
  dem.forEach(d => { const c = S(d.competencia); rank[c] = (rank[c] || 0) + 1; prio[S(d.id)] = rank[c]; });

  const tarefas = [CAB_TAREFAS].concat(dem.map(d => {
    const id = S(d.id), ts = tPor[id] || [], ult = ts[ts.length - 1], r = rPor[id];
    return [S(d.competencia), S(d.gestor), prio[id], S(d.tipo), S(d.anuncio_id) || S(d.sku), S(d.titulo).slice(0, 90),
      Math.round(n(d.risco)), +n(d.mc_pct).toFixed(1), +n(d.meta).toFixed(1), S(d.causa), ACAO[S(d.tipo)] || "Rever preço e custo.",
      ts.length ? "Registrada" : "Pendente", ult ? S(ult.acao) : "", ult ? S(ult.causa) : "", ult ? S(ult.obs) : "",
      ult ? S(ult.registrado_em) : "", ult && ult.reacao_h != null ? +n(ult.reacao_h).toFixed(1) : "", ts.length,
      r ? S(r.desfecho) : "", S(d.criado_em), id];
  }));
  const registros = [CAB_REGISTROS].concat(trat.slice().reverse().map(t => {   // mais recente primeiro
    const d = porId[S(t.demanda_id)] || {};
    return [S(t.registrado_em), S(t.gestor) || S(d.gestor), S(d.competencia), S(d.anuncio_id) || S(d.sku), S(d.titulo).slice(0, 90),
      S(d.tipo), S(t.acao), S(t.causa), S(t.obs), t.reacao_h != null ? +n(t.reacao_h).toFixed(1) : "",
      ORIGEM[S(t.origem)] || S(t.origem), S(t.demanda_id)];
  }));
  return { operacao: opDe(empresa, canal), gestor: op ? S(op.gestor) : [...new Set(dem.map(d => S(d.gestor)))].join(", "), abas: { "Tarefas": tarefas, "Registros": registros }, datas: DATAS,
    nTarefas: dem.length, nPendentes: dem.filter(d => !(tPor[S(d.id)] || []).length).length, nRegistros: trat.length };
}

async function sincronizarOperacao(dbx, empresa, canal, opts = {}) {
  const m = await montarOperacao(dbx, empresa, canal, opts.desde || desdePadrao());
  if (opts.seco) return Object.assign({ seco: true }, m);
  const cfg = opts.cfg || config(); if (!cfg) return Object.assign({ pulado: "sem configuração" }, m);
  const r = await chamar(cfg, { acao: "escrever", operacao: m.operacao, gestor: m.gestor, abas: m.abas, datas: m.datas,
    nTarefas: m.nTarefas, nPendentes: m.nPendentes, nRegistros: m.nRegistros });
  return Object.assign(m, { url: r.url });
}

// Para o servidor: a partir do id da tarefa registrada, atualiza a planilha daquela operação.
// Junta registros em rajada (o gestor registra várias seguidas) num envio só, 8 s depois do último.
const _pend = new Map();
function agendarPorDemanda(dbx, demandaId) {
  if (!config()) return;
  dbx.get("SELECT empresa, canal FROM demandas WHERE id=?", [demandaId]).then(d => {
    if (!d) return; const k = opDe(d.empresa, d.canal);
    clearTimeout(_pend.get(k));
    _pend.set(k, setTimeout(() => { _pend.delete(k);
      sincronizarOperacao(dbx, d.empresa, d.canal).catch(e => console.error("[planilhas] " + k + ": " + e.message)); }, 8000));
  }).catch(e => console.error("[planilhas] " + e.message));
}

const listar = cfg => chamar(cfg || config(), { acao: "listar" });

module.exports = { config, montarOperacao, sincronizarOperacao, agendarPorDemanda, listar, desdePadrao };
