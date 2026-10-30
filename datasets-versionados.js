'use strict';
const crypto = require('node:crypto');
const lancamento = require('./lancamento');
const tipos = new Set(['envios', 'custos', 'comissao']);
class ErroGravacao extends Error {
  constructor(status, codigo, mensagem) { super(mensagem); this.status = status; this.codigo = codigo; }
}
function autorizar(tipo, user) {
  if (!tipos.has(tipo)) throw new ErroGravacao(404, 'TIPO_INVALIDO', 'Lançamento não encontrado.');
  if (!user) throw new ErroGravacao(401, 'SEM_SESSAO', 'Entre novamente para salvar.');
  if (!lancamento.podeLancar(user.perfil, tipo)) throw new ErroGravacao(403, 'SEM_PERMISSAO', 'Seu acesso não permite este lançamento.');
}
function versao(tipo, registro) {
  const raw = registro ? ['existe', registro.json, registro.atualizado ?? ''] : ['ausente'];
  return 'v1-' + crypto.createHash('sha256').update(JSON.stringify([tipo, ...raw])).digest('hex');
}
function parse(registro, tipo) {
  if (!registro) return tipo === 'custos' ? null : [];
  try { return JSON.parse(registro.json); }
  catch (_) { throw new ErroGravacao(500, 'BASE_INVALIDA', 'Não foi possível ler os dados já gravados. Nenhum valor foi substituído.'); }
}
function estavel(value) {
  if (Array.isArray(value)) return '[' + value.map(estavel).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + estavel(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
const numero = (v, negativo = false) => v !== null && v !== undefined && String(v).trim() !== '' && Number.isFinite(Number(v)) && (negativo || Number(v) >= 0);
const mes = v => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(v));
function validar(tipo, value, antes) {
  let erro = '';
  if (tipo === 'envios') {
    erro = lancamento.validarEnvios(value);
    if (!erro) {
      const keys = new Set();
      for (const row of value) {
        const date = new Date(String(row.data) + 'T12:00:00Z');
        if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== row.data) { erro = 'Há uma data inválida nos envios.'; break; }
        if (['coleta', 'flex', 'full'].some(k => !numero(row[k]) || !Number.isSafeInteger(Number(row[k])))) { erro = 'Preencha as três quantidades com números inteiros a partir de zero.'; break; }
        const key = JSON.stringify([row.data, row.empresa, row.plataforma]);
        if (keys.has(key)) { erro = 'Há registros de envios repetidos para o mesmo dia e operação.'; break; }
        keys.add(key);
      }
    }
  } else if (tipo === 'custos') {
    if (!value || Array.isArray(value) || typeof value !== 'object') erro = 'Informe um pacote de custos.';
    else {
      for (const k of ['custos', 'investimento', 'boxwyl']) if (!Array.isArray(value[k])) erro = 'O pacote precisa conter custos, investimento e boxwyl.';
      if (!value.rateio || Array.isArray(value.rateio) || typeof value.rateio !== 'object') erro = 'Informe o rateio do pacote.';
      if (!erro) {
        for (const r of value.custos) if (!mes(r.mes) || !numero(r.valor)) erro = 'Há mês ou valor de custo inválido.';
        for (const r of value.investimento) if (!mes(r.mes) || ['ads', 'afi', 'live'].some(k => !numero(r[k]))) erro = 'Preencha Ads, afiliados e lives. Use zero quando não houver.';
        for (const r of value.boxwyl) if (!mes(r.mes) || !numero(r.fat) || !numero(r.custos)) erro = 'Há mês ou valor inválido em Box Wyl.';
        for (const [ponto, mapa] of Object.entries(value.rateio)) {
          if (['__proto__', 'constructor', 'prototype'].includes(ponto) || !mapa || typeof mapa !== 'object' || Array.isArray(mapa)) { erro = 'Ponto inválido no rateio.'; break; }
          for (const [emp, n] of Object.entries(mapa)) if (['__proto__', 'constructor', 'prototype'].includes(emp) || !numero(n) || Number(n) > 1) erro = 'Use frações de zero a um no rateio.';
        }
        if (!erro) erro = lancamento.validarCustos(value);
      }
    }
  } else {
    erro = lancamento.validarComissao(value);
    if (!erro) {
      const keys = new Set(), fechados = (antes || []).filter(r => String(r.fechado_em || '').trim());
      const mesesFechados = new Set(fechados.map(r => r.mes));
      for (const r of value) {
        const key = JSON.stringify([r.mes, r.operacao]);
        if (keys.has(key)) { erro = 'Há operação repetida no mesmo mês de comissão.'; break; } keys.add(key);
        if (!mes(r.mes) || ['faturamento', 'tacos_pct', 'progresso_metas', 'teto_pct', 'bonus_final_rs'].some(k => !numero(r[k])) || ['margem_cont', 'mc_pct'].some(k => !numero(r[k], true))) { erro = 'Preencha todos os valores da comissão.'; break; }
        const antiga = (antes || []).find(a => a.mes === r.mes && a.operacao === r.operacao);
        if (mesesFechados.has(r.mes) && (!antiga || estavel(antiga) !== estavel(r))) { erro = 'O mês está fechado. A fotografia da comissão não pode ser alterada.'; break; }
        if (String(r.fechado_em || '').trim() && (!antiga || r.fechado_em !== antiga.fechado_em)) { erro = 'Este formulário não fecha comissão.'; break; }
      }
      if (!erro) for (const antiga of fechados) if (!value.some(r => r.mes === antiga.mes && r.operacao === antiga.operacao && estavel(r) === estavel(antiga))) erro = 'Uma fotografia fechada não pode ser removida.';
    }
  }
  if (erro) throw new ErroGravacao(400, 'DADOS_INVALIDOS', erro);
}
async function ler(db, tipo, user) {
  autorizar(tipo, user);
  const registro = await db.get('SELECT nome,json,atualizado FROM datasets WHERE nome=?', [tipo]);
  return { ok: true, tipo, dados: parse(registro, tipo), versao: versao(tipo, registro) };
}
async function compararEGravar(db, sql, params) {
  for (let tentativa = 0; ; tentativa++) {
    try { return await db.get(sql, params); }
    catch (e) {
      if (tentativa >= 2 || !/SQLITE_BUSY|database is locked|database table is locked/i.test(String(e.code || '') + ' ' + e.message)) throw e;
      // Repete somente o mesmo CAS, nunca uma escrita sem a condição original.
      await new Promise(resolve => setTimeout(resolve, 15));
    }
  }
}
async function gravar(db, tipo, dados, esperada, user) {
  autorizar(tipo, user);
  if (typeof esperada !== 'string' || !/^v1-[a-f0-9]{64}$/.test(esperada)) throw new ErroGravacao(428, 'VERSAO_OBRIGATORIA', 'Carregue a versão atual dos dados antes de salvar.');
  const antes = await db.get('SELECT nome,json,atualizado FROM datasets WHERE nome=?', [tipo]);
  if (versao(tipo, antes) !== esperada) throw new ErroGravacao(409, 'VERSAO_DESATUALIZADA', 'Outra gravação atualizou estes dados. Seu preenchimento foi mantido. Confira os valores atuais antes de tentar novamente.');
  validar(tipo, dados, parse(antes, tipo));
  const json = JSON.stringify(dados);
  if (antes && estavel(JSON.parse(antes.json)) === estavel(dados)) return { ok: true, versao: esperada, semAlteracao: true };
  // Um único statement compara e grava. Vale mesmo entre processos/instâncias diferentes.
  const timestamp = new Date(Math.max(Date.now(), (Date.parse(antes?.atualizado) || 0) + 1)).toISOString();
  const alterada = antes
    ? await compararEGravar(db, 'UPDATE datasets SET json=?,atualizado=? WHERE nome=? AND json=? AND COALESCE(atualizado,\'\')=? RETURNING nome', [json, timestamp, tipo, antes.json, antes.atualizado ?? ''])
    : await compararEGravar(db, 'INSERT INTO datasets(nome,json,atualizado) VALUES(?,?,?) ON CONFLICT(nome) DO NOTHING RETURNING nome', [tipo, json, timestamp]);
  if (!alterada) throw new ErroGravacao(409, 'VERSAO_DESATUALIZADA', 'Outra gravação terminou primeiro. Seu preenchimento foi mantido. Confira os dados atuais antes de confirmar novamente.');
  return { ok: true, versao: versao(tipo, { json, atualizado: timestamp }) };
}
module.exports = { ErroGravacao, autorizar, versao, ler, gravar, validar, estavel };
