'use strict';
// escopo-ponto.js — gestor só enxerga as operações do(s) próprio(s) ponto(s) (regra do Weskley, 10/11/2026; substitui a de 01/11).
// Quem tem operação em dois pontos usa as duas lentes, uma de cada vez: o Grupo inteiro nunca é entregue a um gestor.
// O ponto vem das vendas, não do nome da empresa: a Powerfull Imports · Amazon pertence ao ponto Bsan.
// A regra vale no SERVIDOR. A tela só deixa de oferecer o que o servidor já não entrega.
const SEM_PONTO = '__sem_ponto__';
const TTL = 30 * 60 * 1000;
// Rotas que devolvem dado de mais de uma operação. Quem já é restrito à carteira (demandas, abertura, histórico) não entra.
const ROTAS = new Set(['/api/dataset', '/api/detalhe', '/api/extras', '/api/margens', '/api/vendas', '/api/vendas-agregado', '/api/vendas/raiox', '/api/vendas/exportar',
  '/api/gerencial/raiox', '/api/publicidade/resumo', '/api/resultados/resumo', '/api/resultados/skus', '/api/resultados/forecast-produtos',
  '/api/operacao/full', '/api/operacao/estoque', '/api/operacao/projecao', '/api/lancamentos/envios', '/api/envios']);
const texto = v => String(v == null ? '' : v).trim();
const chave = (emp, mkt) => texto(emp) + '|' + texto(mkt);
let memo = null;
async function mapa(dbx) {
  if (memo && Date.now() - memo.em < TTL) return memo;
  const [vendas, ops] = await Promise.all([dbx.all("SELECT DISTINCT empresa, canal, ponto FROM vendas WHERE ponto IS NOT NULL AND TRIM(ponto)<>''"), dbx.all('SELECT empresa, marketplace, gestor FROM operacoes')]);
  const porOp = new Map(), porEmpresa = new Map(), porGestor = new Map();
  const soma = (m, k, v) => { if (!m.has(k)) m.set(k, new Set()); m.get(k).add(v); };
  for (const r of vendas) { soma(porOp, chave(r.empresa, r.canal), texto(r.ponto)); soma(porEmpresa, texto(r.empresa), texto(r.ponto)); }
  for (const o of ops) for (const p of porOp.get(chave(o.empresa, o.marketplace)) || []) soma(porGestor, texto(o.gestor), p);
  memo = { em: Date.now(), porOp, porEmpresa, porGestor };
  return memo;
}
const limpar = () => { memo = null; };
const ehGestor = user => !!user && user.perfil === 'gestor';
async function pontos(dbx, user) { const m = await mapa(dbx); return [...(m.porGestor.get(texto(user.gestor_ref)) || [])].sort(); }
// Fixa o ponto da consulta ANTES do cache: pedido sem ponto, ou de ponto alheio, vira o ponto do gestor.
async function aplicar(dbx, u, user) {
  if (!ehGestor(user) || !ROTAS.has(u.pathname)) return;
  const permitidos = await pontos(dbx, user), pedido = u.searchParams.get('ponto') || '';
  if (!permitidos.includes(pedido)) u.searchParams.set('ponto', permitidos[0] || SEM_PONTO);
}
function pertence(m, emp, mkt, ponto) { const op = m.porOp.get(chave(emp, mkt)); if (op) return op.has(ponto); const e = m.porEmpresa.get(texto(emp)); return !!e && e.has(ponto); }
const filtrarEnvios = (m, linhas, ponto) => (Array.isArray(linhas) ? linhas : []).filter(r => pertence(m, r.empresa, r.plataforma, ponto));
function filtrarExtras(m, got, ponto) {
  for (const k of ['ads', 'adsCamp', 'adsDia']) if (Array.isArray(got[k])) got[k] = got[k].filter(r => pertence(m, r.emp, r.mkt, ponto));
  for (const k of ['estoque', 'produtos']) if (Array.isArray(got[k])) got[k] = got[k].filter(r => texto(r.ponto) === ponto);
  if (got.envios) got.envios = filtrarEnvios(m, got.envios, ponto);
  if (got.fullRel && got.fullRel.contas) { const contas = {}; for (const [id, rel] of Object.entries(got.fullRel.contas)) if (rel && texto(rel.ponto) === ponto) contas[id] = rel; got.fullRel = { ...got.fullRel, contas }; }
  if (got.linksAnuncio && typeof got.linksAnuncio === 'object') { const f = {}; for (const [k, v] of Object.entries(got.linksAnuncio)) { const [emp, mkt] = k.split('|'); if (pertence(m, emp, mkt, ponto)) f[k] = v; } got.linksAnuncio = f; }
  return got;
}
module.exports = { SEM_PONTO, ROTAS, mapa, limpar, ehGestor, pontos, aplicar, pertence, filtrarExtras, filtrarEnvios };
