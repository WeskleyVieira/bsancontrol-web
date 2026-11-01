"use strict";
const crypto = require('node:crypto');
class ProdutoError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
const fail = (message, status) => { throw new ProdutoError(message, status); };
const text = (v, max = 240) => String(v == null ? '' : v).trim().slice(0, max);
const skuKey = v => text(v, 150).normalize('NFC').toUpperCase();
const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
function point(v) { const p = text(v); if (!['Bsan', 'Powerfull'].includes(p)) fail('Ponto inválido.'); return p; }
function cents(value, { optional = false, zero = false } = {}) {
  if (value === null || value === undefined || value === '') { if (optional) return null; fail('Informe o valor.'); }
  const s = typeof value === 'number' ? String(value) : text(value).replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(s)) fail('Use um valor positivo com até duas casas decimais.');
  const [a, b = ''] = s.split('.'); const n = Number(a) * 100 + Number(b.padEnd(2, '0'));
  if (!Number.isSafeInteger(n) || n > 100000000000 || (!zero && n === 0)) fail('Valor fora do intervalo permitido.');
  return n;
}
function legacyCents(v) {
  if (v === '' || v === null || v === undefined || typeof v === 'boolean') return null;
  const n = Number(String(v).replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0 || n > 1000000000) return null;
  return Math.round((n + Number.EPSILON) * 100);
}
function capabilities(user, grants = []) {
  if (!user || user.ativo === 0 || user.ativo === false) fail('Entre com uma conta ativa.', 401);
  const resource=key=>!user.efetivas||user.efetivas[key]===true;
  if(!resource('produtos.ver'))fail('Seu acesso não permite consultar Produtos.',403);
  const admin = user.perfil === 'direcao';
  const estoque = user.perfil === 'estoque';
  const allowed = grants.filter(g => g.usuario_id === String(user.id));
  const pontos = admin ? ['Bsan', 'Powerfull'] : allowed.filter(g => g.operacional === 1).map(g => g.ponto);
  return { userId: String(user.id), admin, estoque, pontos: [...new Set(pontos)],
    financeiro: p => !estoque && resource('produtos.custos.ver') && (admin || allowed.some(g => g.ponto === p && g.custo_ler === 1 && g.operacional === 1)),
    editar: p => !estoque && resource('produtos.custos.editar') && resource('produtos.custos.ver') && (admin || allowed.some(g => g.ponto === p && g.custo_editar === 1 && g.custo_ler === 1 && g.operacional === 1)),
    aprovar: p => !estoque && resource('produtos.custos.aprovar') && resource('produtos.custos.editar') && resource('produtos.custos.ver') && (admin || allowed.some(g => g.ponto === p && g.custo_aprovar === 1 && g.custo_editar === 1 && g.custo_ler === 1 && g.operacional === 1)) };
}
function scope(cap, p, financial = false) {
  if (!cap.pontos.includes(p)) fail('Ponto fora do seu acesso.', 403);
  if (financial && !cap.financeiro(p)) fail('Acesso financeiro não autorizado.', 403);
}
function operational(row) {
  return Object.fromEntries(['id','ponto','sku','gtin','nome','tipo','tipo_variacao','situacao','data_original','atualizado_em','ncm','marca','categoria','logistica_estado','altura_cm','largura_cm','comprimento_cm','diametro_cm','peso_liquido_kg','peso_kg','embalagem_tipo','embalagem_descricao'].map(k => [k, row[k] ?? null]));
}
function stockControl(empresa, canal) {
  const e = skuKey(empresa), c = skuKey(canal);
  if (['PESSEGUINHO', 'PESSEGUINHO STORE', 'MARY KASE', 'POWERFULL FILIAL'].includes(e) || (e.startsWith('POWERFULL') && c === 'AMAZON')) return 'nao_se_aplica';
  return 'a_conferir';
}
module.exports = { ProdutoError, fail, text, skuKey, id, now, point, cents, legacyCents, capabilities, scope, operational, stockControl };
