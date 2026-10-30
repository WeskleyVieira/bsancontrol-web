// lancamento.js — encaixa um lançamento na lista que já está na nuvem.
// O painel e o servidor usam as mesmas funções. Um lançamento não apaga o resto.
"use strict";
const S = v => String(v == null ? "" : v).trim();
const num = v => {
  const n = Number(String(v == null ? "" : v).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};

function podeLancar(perfil, tipo) {
  if (perfil === "direcao") return tipo === "envios" || tipo === "custos" || tipo === "comissao";
  if (perfil === "coordenacao") return tipo === "envios";
  return false;
}

function mesclarEnvio(lista, linha) {
  const rows = Array.isArray(lista) ? lista.map(r => Object.assign({}, r)) : [];
  const nova = {
    data: S(linha.data).slice(0, 10),
    empresa: S(linha.empresa),
    plataforma: S(linha.plataforma),
    coleta: num(linha.coleta) || 0,
    flex: num(linha.flex) || 0,
    full: num(linha.full) || 0
  };
  const i = rows.findIndex(r => r.data === nova.data && r.empresa === nova.empresa && r.plataforma === nova.plataforma);
  if (i >= 0) rows[i] = nova;
  else rows.push(nova);
  return rows;
}

function validarEnvios(rows) {
  if (!Array.isArray(rows) || !rows.length) return "A lista de envios chegou vazia.";
  for (const r of rows) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(S(r.data))) return "Cada envio precisa de uma data.";
    if (!S(r.empresa) || !S(r.plataforma)) return "Cada envio precisa de empresa e plataforma.";
    for (const c of ["coleta", "flex", "full"]) {
      const n = num(r[c]);
      if (!Number.isFinite(n) || n < 0) return "Coleta, flex e full são quantidades a partir de zero.";
    }
  }
  return "";
}

function pacoteCustos(c) {
  const o = c && typeof c === "object" && !Array.isArray(c) ? c : {};
  const rateio = {};
  if (o.rateio && typeof o.rateio === "object" && !Array.isArray(o.rateio)) {
    Object.keys(o.rateio).forEach(p => {
      rateio[p] = {};
      Object.keys(o.rateio[p] || {}).forEach(e => { rateio[p][e] = +o.rateio[p][e] || 0; });
    });
  }
  return {
    rateio,
    custos: Array.isArray(o.custos) ? o.custos.map(x => Object.assign({}, x)) : [],
    investimento: Array.isArray(o.investimento) ? o.investimento.map(x => Object.assign({}, x)) : [],
    boxwyl: Array.isArray(o.boxwyl) ? o.boxwyl.map(x => Object.assign({}, x)) : []
  };
}

function mesclarCusto(pacote, linha) {
  const p = pacoteCustos(pacote);
  const mes = S(linha.mes).slice(0, 7);
  if (linha.bloco === "direto" || linha.bloco === "compartilhado") {
    const tipo = linha.bloco;
    const emp = tipo === "compartilhado" ? "" : S(linha.emp);
    const ponto = S(linha.ponto);
    const nova = { mes, ponto, emp, tipo, valor: num(linha.valor) || 0 };
    let i = Number.isInteger(linha.idx) ? linha.idx : -1;
    if (linha.remover) {
      if (i >= 0 && i < p.custos.length) p.custos.splice(i, 1);
      return p;
    }
    if (!(i >= 0 && i < p.custos.length)) i = p.custos.findIndex(c => c.mes === mes && c.tipo === tipo && c.ponto === ponto && S(c.emp) === emp);
    if (i >= 0) p.custos[i] = nova;
    else p.custos.push(nova);
    return p;
  }
  if (linha.bloco === "invest") {
    const emp = S(linha.emp), canal = S(linha.canal);
    let i = Number.isInteger(linha.idx) ? linha.idx : p.investimento.findIndex(x => x.mes === mes && x.emp === emp && S(x.canal) === canal);
    if (linha.remover) {
      if (i >= 0 && i < p.investimento.length) p.investimento.splice(i, 1);
      return p;
    }
    const prev = i >= 0 && i < p.investimento.length ? p.investimento[i] : {};
    const nova = { mes, emp, canal, ads: num(prev.ads) || 0, afi: num(linha.afi) || 0, live: num(linha.live) || 0 };
    if (i >= 0 && i < p.investimento.length) p.investimento[i] = nova;
    else p.investimento.push(nova);
    return p;
  }
  if (linha.bloco === "box") {
    let i = Number.isInteger(linha.idx) ? linha.idx : p.boxwyl.findIndex(x => x.mes === mes);
    if (linha.remover) {
      if (i >= 0 && i < p.boxwyl.length) p.boxwyl.splice(i, 1);
      return p;
    }
    const nova = { mes, fat: num(linha.fat) || 0, custos: num(linha.custos) || 0 };
    if (i >= 0 && i < p.boxwyl.length) p.boxwyl[i] = nova;
    else p.boxwyl.push(nova);
    return p;
  }
  if (linha.bloco === "rateio") {
    const mapa = {};
    (linha.pares || []).forEach(par => {
      const emp = S(par.emp);
      if (!emp) return;
      mapa[emp] = (num(par.percentual) || 0) / 100;
    });
    p.rateio[S(linha.ponto)] = mapa;
    return p;
  }
  return p;
}

function validarCustos(c) {
  const p = pacoteCustos(c);
  const tem = p.custos.length || p.investimento.length || p.boxwyl.length || Object.keys(p.rateio).length;
  if (!tem) return "O pacote de custos chegou vazio.";
  for (const linha of p.custos) {
    if (!/^\d{4}-\d{2}$/.test(S(linha.mes))) return "Cada custo precisa do mês.";
    if (linha.tipo !== "direto" && linha.tipo !== "compartilhado") return "O custo é direto ou compartilhado.";
    if (!S(linha.ponto)) return "Cada custo precisa do ponto.";
    if (linha.tipo === "direto" && !S(linha.emp)) return "O custo direto precisa da empresa.";
    if (!Number.isFinite(num(linha.valor)) || num(linha.valor) < 0) return "O valor do custo precisa ser um número.";
  }
  for (const linha of p.investimento) {
    if (!/^\d{4}-\d{2}$/.test(S(linha.mes)) || !S(linha.emp)) return "Afiliados e lives precisam de mês e empresa.";
  }
  for (const linha of p.boxwyl) {
    if (!/^\d{4}-\d{2}$/.test(S(linha.mes))) return "Box Wyl precisa do mês.";
  }
  for (const ponto of Object.keys(p.rateio)) {
    const vals = Object.values(p.rateio[ponto] || {});
    if (!vals.length) continue;
    const soma = vals.reduce((a, b) => a + (+b || 0), 0);
    if (Math.abs(soma - 1) > 0.001) return "O rateio de cada ponto tem de somar 100%.";
  }
  return "";
}

function mesFechado(lista, mes) {
  return (lista || []).some(r => r.mes === mes && S(r.fechado_em));
}

function mesclarComissao(lista, linha) {
  const rows = Array.isArray(lista) ? lista.map(r => Object.assign({}, r)) : [];
  const mes = S(linha.mes).slice(0, 7);
  const operacao = S(linha.operacao);
  if (mesFechado(rows, mes)) return { erro: "Esse mês já foi fechado. O bônus pago fica como está.", linhas: lista || [] };
  const i = rows.findIndex(r => r.mes === mes && r.operacao === operacao);
  const prev = i >= 0 ? rows[i] : {};
  const nova = Object.assign({}, prev, {
    mes, operacao,
    faturamento: num(linha.faturamento) || 0,
    margem_cont: num(linha.margem_cont) || 0,
    mc_pct: num(linha.mc_pct) || 0,
    tacos_pct: num(linha.tacos_pct) || 0,
    progresso_metas: num(linha.progresso_metas) || 0,
    teto_pct: num(linha.teto_pct) || 0,
    bonus_final_rs: num(linha.bonus_final_rs) || 0,
    fechado_em: ""
  });
  if (i >= 0) rows[i] = nova;
  else rows.push(nova);
  return { erro: "", linhas: rows };
}

function validarComissao(linhas) {
  if (!Array.isArray(linhas) || !linhas.length) return "A lista de comissão chegou vazia.";
  for (const r of linhas) {
    if (!/^\d{4}-\d{2}$/.test(S(r.mes)) || !S(r.operacao)) return "Cada comissão precisa de mês e operação.";
    if (!Number.isFinite(num(r.bonus_final_rs))) return "O bônus precisa ser um número.";
  }
  return "";
}

function comissaoFechadaIntacta(antes, depois) {
  for (const a of (antes || []).filter(r => S(r.fechado_em))) {
    const b = (depois || []).find(r => r.mes === a.mes && r.operacao === a.operacao);
    if (!b || S(b.fechado_em) !== S(a.fechado_em)) return "Um mês fechado não pode sair nem mudar de carimbo.";
    if (Math.round((+a.bonus_final_rs) * 100) !== Math.round((+b.bonus_final_rs) * 100)) return "O bônus de um mês fechado fica como foi pago.";
  }
  return "";
}

module.exports = {
  podeLancar, mesclarEnvio, validarEnvios, pacoteCustos, mesclarCusto, validarCustos,
  mesclarComissao, validarComissao, comissaoFechadaIntacta
};
