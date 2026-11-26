'use strict';
// leitura-consultas.js — /api/leitura/* (24/11/2026): visão do GRUPO em JSON enxuto, p/ integrações (Otto, a IA de operação no Grok).
// Só leitura. Reaproveita as MESMAS consultas e bases do painel (resultados-consultas + margens, datasets do db-sync), p/ o número
// que o Otto lê ser o mesmo da tela. Nada aqui grava.
//
//   GET /api/leitura                 índice das rotas
//   GET /api/leitura/status          frescor de cada base + ALERTAS (base que não subiu, dias vazios de vendas/Ads, envios parados)
//   GET /api/leitura/vendas-dia      vendas e margem por operação e dia, antes e depois do Ads  (?de&ate&emp&mkt; padrão: 7 dias)
//   GET /api/leitura/produtos        vendas e margem por anúncio ou SKU, antes e depois do Ads (?de&ate&agrupar&emp&mkt&ordenar&limite)
//   GET /api/leitura/metas           metas do mês × realizado por operação                     (?mes=AAAA-MM; padrão: mês atual)
//   GET /api/leitura/full            Full: resumo, ruptura, não pode faltar, parado, estoque antigo, pendências (?emp&mkt&limite)
//   GET /api/leitura/publicidade     Ads por campanha (gasto, receita, ACOS, ROAS) e TACOS da operação (?mes&emp&mkt)
//   GET /api/leitura/acompanhamento  demandas por gestor: estados, atrasadas, R$ em risco, desfechos  (?competencia&gestor&limite)
//   GET /api/leitura/estoque         estoque por SKU: saldo, disponível, reservado, Full, venda/dia, cobertura (?sku&ponto&conta&agrupar&ordenar&limite)
//   GET /api/leitura/vendas-sku      unidades por SKU em 7d/30d/período, canais, última venda; série diária opcional (?ate&dias&sku&ponto&emp&mkt&serie&limite)
const resultados = require('./resultados-consultas');

const S = v => String(v == null ? '' : v).trim();
const N = v => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
const r2 = v => Math.round(N(v) * 100) / 100;
const hojeBR = () => new Date(Date.now() - 3 * 36e5).toISOString().slice(0, 10);
const somaDias = (d, k) => new Date(Date.parse(d + 'T12:00:00Z') + k * 864e5).toISOString().slice(0, 10);
const diasEntre = (a, b) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5);
const erro = (msg, status = 400) => Object.assign(new Error(msg), { status });
const dataOk = d => /^\d{4}-\d{2}-\d{2}$/.test(S(d));
const mesOk = m => /^\d{4}-\d{2}$/.test(S(m));

async function dataset(db, nome) {
  const r = await db.get('SELECT json, atualizado FROM datasets WHERE nome=?', [nome]);
  if (!r) return { dados: null, atualizado: null };
  try { return { dados: JSON.parse(r.json), atualizado: r.atualizado }; } catch (e) { return { dados: null, atualizado: r.atualizado }; }
}
const linhas = d => Array.isArray(d) ? d : (d && (d.rows || d.linhas)) || [];

// ───────────────────────────── STATUS + ALERTAS ─────────────────────────────
async function status(db) {
  const hoje = hojeBR(), agora = Date.now(), alertas = [];
  const alerta = (nivel, base, operacao, mensagem) => alertas.push({ nivel, base, operacao: operacao || null, mensagem });
  // 1) carimbo de cada base do painel (cada db-sync regrava; a mais nova = última sincronização)
  const ds = await db.all('SELECT nome, atualizado FROM datasets ORDER BY nome');
  const bases = ds.map(d => ({ nome: d.nome, atualizado: d.atualizado, horas: d.atualizado ? Math.round((agora - Date.parse(d.atualizado)) / 36e5 * 10) / 10 : null }));
  const ultimaSync = ds.map(d => d.atualizado).filter(Boolean).sort().pop() || null;
  if (!ultimaSync) alerta('erro', 'sincronização', null, 'nenhuma base foi sincronizada');
  else if ((agora - Date.parse(ultimaSync)) / 36e5 > 26) alerta('erro', 'sincronização', null, `última atualização do painel há ${Math.round((agora - Date.parse(ultimaSync)) / 36e5)} h (${ultimaSync}) — o pipeline não rodou`);

  // 2) vendas por operação: último dia com venda, dias sem venda e dias vazios nos últimos 14
  const desde = somaDias(hoje, -45);
  const vd = await db.all('SELECT empresa, canal, data, COUNT(*) AS n FROM vendas WHERE data>=? GROUP BY empresa, canal, data', [desde]);
  const ult = await db.all('SELECT empresa, canal, MAX(data) AS d FROM vendas GROUP BY empresa, canal');
  const ops = {};
  ult.forEach(r => { ops[r.empresa + '|' + r.canal] = { empresa: r.empresa, canal: r.canal, ultima_venda: r.d, dias: new Set() }; });
  vd.forEach(r => { const o = ops[r.empresa + '|' + r.canal]; if (o && N(r.n) > 0) o.dias.add(S(r.data).slice(0, 10)); });
  const vendas = Object.values(ops).map(o => {
    const ult30 = [...o.dias].filter(d => d >= somaDias(hoje, -30)).length;
    const semVenda = o.ultima_venda ? diasEntre(S(o.ultima_venda).slice(0, 10), hoje) : null;
    // dias vazios: só p/ operação que vende quase todo dia (≥ 20 dos últimos 30) — entre hoje−14 e o último dia com venda
    let vazios = [];
    if (ult30 >= 20 && o.ultima_venda) for (let d = somaDias(hoje, -14); d < S(o.ultima_venda).slice(0, 10); d = somaDias(d, 1)) if (!o.dias.has(d)) vazios.push(d);
    const ativa = ult30 >= 10;
    if (ativa && semVenda >= 4) alerta('erro', 'vendas', o.empresa + ' · ' + o.canal, `sem venda registrada há ${semVenda} dias (última ${o.ultima_venda}) — coleta parada?`);
    else if (ativa && semVenda >= 2) alerta('aviso', 'vendas', o.empresa + ' · ' + o.canal, `última venda registrada em ${o.ultima_venda} (${semVenda} dias)`);
    if (vazios.length) alerta('aviso', 'vendas', o.empresa + ' · ' + o.canal, `dias sem nenhuma venda nos últimos 14: ${vazios.join(', ')}`);
    return { empresa: o.empresa, canal: o.canal, ultima_venda: o.ultima_venda, dias_sem_venda: semVenda, dias_com_venda_30d: ult30, ativa, dias_vazios_14d: vazios };
  }).sort((a, b) => (a.empresa + a.canal).localeCompare(b.empresa + b.canal));

  // 3) Ads por dia: último dia com gasto e dias vazios (operação que investiu em ≥ 5 dos 30 dias anteriores)
  const ad = await dataset(db, 'adsDia');
  const adsOps = {};
  linhas(ad.dados).forEach(r => { const k = S(r.emp) + '|' + S(r.mkt); const d = S(r.data).slice(0, 10); if (!dataOk(d)) return;
    const o = adsOps[k] || (adsOps[k] = { empresa: S(r.emp), canal: S(r.mkt), dias: new Set(), ultimo: '' });
    if (N(r.inv) > 0) { o.dias.add(d); if (d > o.ultimo) o.ultimo = d; } });
  const ads = Object.values(adsOps).filter(o => o.empresa).map(o => {
    const ativos30 = [...o.dias].filter(d => d >= somaDias(hoje, -30)).length;
    const semAds = o.ultimo ? diasEntre(o.ultimo, hoje) : null;
    let vazios = [];
    if (ativos30 >= 5 && o.ultimo) for (let d = somaDias(hoje, -14); d < o.ultimo; d = somaDias(d, 1)) if (!o.dias.has(d)) vazios.push(d);
    if (ativos30 >= 5 && semAds >= 3) alerta('aviso', 'ads', o.empresa + ' · ' + o.canal, `último dia com gasto de Ads registrado: ${o.ultimo} (${semAds} dias) — relatório não subiu?`);
    if (vazios.length) alerta('aviso', 'ads', o.empresa + ' · ' + o.canal, `dias sem gasto de Ads registrado nos últimos 14: ${vazios.join(', ')}`);
    return { empresa: o.empresa, canal: o.canal, ultimo_dia: o.ultimo || null, dias_sem_ads: semAds, dias_com_gasto_30d: ativos30, dias_vazios_14d: vazios };
  }).sort((a, b) => (a.empresa + a.canal).localeCompare(b.empresa + b.canal));
  if (!ad.dados) alerta('aviso', 'ads', null, 'base de Ads por dia ausente');

  // 4) envios (lançados no painel): último dia por operação e no geral
  const ev = await dataset(db, 'envios');
  const envOps = {};
  linhas(ev.dados).forEach(r => { const d = S(r.data).slice(0, 10); if (!dataOk(d)) return; const k = S(r.empresa) + '|' + S(r.plataforma);
    if (!envOps[k] || d > envOps[k].ultimo) envOps[k] = { empresa: S(r.empresa), canal: S(r.plataforma), ultimo: d }; });
  const envUlt = Object.values(envOps).map(o => o.ultimo).sort().pop() || null;
  if (!envUlt) alerta('aviso', 'envios', null, 'nenhum envio registrado');
  else if (diasEntre(envUlt, hoje) > 3) alerta('erro', 'envios', null, `registro de envios parado: último dia lançado ${envUlt} (${diasEntre(envUlt, hoje)} dias); base gravada em ${ev.atualizado}`);

  // 5) Relação do Full (semanal)
  const fr = await dataset(db, 'fullRel');
  const full = fr.dados ? { dia: fr.dados.dia || null, gerado: fr.dados.gerado || null, contas: Object.keys(fr.dados.contas || {}).length } : null;
  if (!full || !full.dia) alerta('aviso', 'full', null, 'Relação do Full ausente');
  else if (diasEntre(full.dia, hoje) > 8) alerta('aviso', 'full', null, `Relação do Full de ${full.dia} (${diasEntre(full.dia, hoje)} dias) — a semanal não rodou`);

  const ordem = { erro: 0, aviso: 1 };
  alertas.sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
  return { hoje, ultima_sincronizacao: ultimaSync, situacao: alertas.some(a => a.nivel === 'erro') ? 'erro' : alertas.length ? 'aviso' : 'ok',
    alertas, bases, vendas, ads, envios: { ultimo_dia: envUlt, por_operacao: Object.values(envOps).sort((a, b) => (a.empresa + a.canal).localeCompare(b.empresa + b.canal)) }, full };
}

// ───────────────────────────── VENDAS E MARGEM POR DIA ─────────────────────────────
async function vendasDia(db, q, user) {
  const hoje = hojeBR();
  const ate = dataOk(q.ate) ? S(q.ate) : hoje, de = dataOk(q.de) ? S(q.de) : somaDias(ate, -6);
  if (de > ate) throw erro('"de" depois de "ate"');
  if (diasEntre(de, ate) > 62) throw erro('período máximo de 62 dias');
  const r = await resultados.resumo(db, { de, ate, emp: S(q.emp), mkt: S(q.mkt) }, user);
  const chave = x => S(x.date) + '|' + S(x.emp) + '|' + S(x.mkt);
  const mg = {}; (r.margensDiarias || []).forEach(x => { mg[chave(x)] = x; });
  const rows = (r.dias || []).filter(x => x.date >= de && x.date <= ate).map(x => {
    const m = mg[chave(x)] || null;
    const pre = m ? N(m.pre) : N(x.mc), adsV = m ? N(m.ads) : null, pos = m ? N(m.after) : null;
    return { data: x.date, empresa: x.emp, canal: x.mkt, pedidos: N(x.ped), unidades: N(x.qtd), faturamento: r2(x.fat),
      mc_pre_ads: r2(pre), mc_pre_ads_pct: x.fat ? r2(pre / x.fat * 100) : null,
      ads: adsV == null ? null : r2(adsV), mc_pos_ads: pos == null ? null : r2(pos), mc_pos_ads_pct: pos == null || !x.fat ? null : r2(pos / x.fat * 100),
      tacos_pct: m && m.tacos != null ? r2(m.tacos) : null, ads_estimado: m ? !!m.estimated : null, devolucoes: N(x.devN) };
  }).sort((a, b) => (a.data + a.empresa + a.canal).localeCompare(b.data + b.empresa + b.canal));
  const tot = rows.reduce((t, x) => { t.pedidos += x.pedidos; t.faturamento += x.faturamento; t.mc_pre_ads += x.mc_pre_ads; if (x.ads != null) { t.ads += x.ads; t.mc_pos_ads += x.mc_pos_ads; } return t; },
    { pedidos: 0, faturamento: 0, mc_pre_ads: 0, ads: 0, mc_pos_ads: 0 });
  ['faturamento', 'mc_pre_ads', 'ads', 'mc_pos_ads'].forEach(k => { tot[k] = r2(tot[k]); });
  tot.mc_pre_ads_pct = tot.faturamento ? r2(tot.mc_pre_ads / tot.faturamento * 100) : null;
  tot.mc_pos_ads_pct = tot.faturamento ? r2(tot.mc_pos_ads / tot.faturamento * 100) : null;
  tot.tacos_pct = tot.faturamento ? r2(tot.ads / tot.faturamento * 100) : null;
  return { periodo: { de, ate }, filtro: { emp: S(q.emp) || null, mkt: S(q.mkt) || null }, total: tot, linhas: rows,
    observacao: 'faturamento e margem contam só vendas efetivadas (status venda/venda_com_troca); Ads pode ser estimado (rateio) quando o relatório do dia não tem vínculo por anúncio — ver ads_estimado',
    consultado_em: new Date().toISOString() };
}

// ───────────────────────────── VENDAS POR PRODUTO (SKU / ANÚNCIO) ─────────────────────────────
// (24/11/2026, pedido do Otto: "vendas por produto agrupada por SKU e anúncio, sem exportar pela tela toda semana")
// agrupar=anuncio (padrão): margens-consultas com itens=1 — a MESMA conta do painel, Ads alocado por anúncio.
// agrupar=sku: resultados-consultas.skus — a consulta da tela Produtos (pedidos, devoluções, margem antes/depois do Ads).
async function produtos(db, q, user) {
  const hoje = hojeBR();
  const ate = dataOk(q.ate) ? S(q.ate) : hoje, de = dataOk(q.de) ? S(q.de) : somaDias(ate, -6);
  if (de > ate) throw erro('"de" depois de "ate"');
  if (diasEntre(de, ate) > 62) throw erro('período máximo de 62 dias');
  const agrupar = S(q.agrupar).toLowerCase() === 'sku' ? 'sku' : 'anuncio';
  const lim = Math.min(Math.max(N(q.limite) || 200, 1), 3000);
  const ORD = { faturamento: 'faturamento', margem: 'mc_pos_ads', unidades: 'unidades', ads: 'ads', margem_pct: 'mc_pos_ads_pct' };
  const ordem = ORD[S(q.ordenar).toLowerCase()] || 'faturamento';
  const pct = (a, b) => b ? r2(a / b * 100) : null;
  let linhasOut, aviso = null;
  if (agrupar === 'sku') {
    const r = await resultados.skus(db, { de, ate, emp: S(q.emp), mkt: S(q.mkt) }, user);
    aviso = r.financeErro || null;
    linhasOut = (r.rows || []).map(x => ({ empresa: x.emp, canal: x.mkt, sku: x.sku, produto: S(x.titulo).slice(0, 90),
      pedidos: N(x.ped), unidades: N(x.qtd), faturamento: r2(x.fat), mc_pre_ads: r2(x.before ?? x.mc), mc_pre_ads_pct: pct(N(x.before ?? x.mc), N(x.fat)),
      ads: x.adsMissing ? null : r2(x.extra), mc_pos_ads: x.after == null ? null : r2(x.after), mc_pos_ads_pct: x.after == null ? null : pct(N(x.after), N(x.fat)),
      tacos_pct: x.tacos == null ? null : r2(x.tacos), devolucoes: N(x.devN), ads_estimado: !!x.estimated }));
  } else {
    const m = await require('./margens-consultas').carregar(db, { de, ate, emp: S(q.emp), mkt: S(q.mkt), itens: '1', baseMargem: 'teto' }, user);
    linhasOut = (m.produtos || []).map(x => ({ empresa: x.emp, canal: x.mkt, sku: x.sku, anuncio: x.anuncio || null, produto: S(x.titulo).slice(0, 90),
      vendas: N(x.n), unidades: N(x.qtd), faturamento: r2(x.fat), mc_pre_ads: r2(x.pre), mc_pre_ads_pct: pct(N(x.pre), N(x.fat)),
      ads: x.missing ? null : r2(x.ads), mc_pos_ads: x.missing || x.after == null ? null : r2(x.after), mc_pos_ads_pct: x.missing || x.after == null ? null : pct(N(x.after), N(x.fat)),
      tacos_pct: N(x.fat) && !x.missing ? r2(N(x.ads) / N(x.fat) * 100) : null, custo_unitario: x.custoUn == null ? null : r2(x.custoUn), sem_custo: N(x.ctpMissing) > 0, ads_estimado: !!x.estimated }));
  }
  linhasOut.sort((a, b) => (N(b[ordem]) - N(a[ordem])));
  const tot = linhasOut.reduce((t, x) => { t.unidades += x.unidades; t.faturamento += x.faturamento; t.mc_pre_ads += x.mc_pre_ads; if (x.ads != null) { t.ads += x.ads; t.mc_pos_ads += x.mc_pos_ads; } return t; },
    { itens: linhasOut.length, unidades: 0, faturamento: 0, mc_pre_ads: 0, ads: 0, mc_pos_ads: 0 });
  ['faturamento', 'mc_pre_ads', 'ads', 'mc_pos_ads'].forEach(k => { tot[k] = r2(tot[k]); });
  tot.mc_pos_ads_pct = pct(tot.mc_pos_ads, tot.faturamento); tot.tacos_pct = pct(tot.ads, tot.faturamento);
  return { periodo: { de, ate }, agrupar, ordenar: ordem, filtro: { emp: S(q.emp) || null, mkt: S(q.mkt) || null }, total: tot,
    linhas: linhasOut.slice(0, lim), mostrando: Math.min(lim, linhasOut.length), aviso,
    observacao: 'só vendas efetivadas; Ads por anúncio é o alocado pelo painel (ads_estimado = rateio quando o relatório não liga o gasto ao anúncio); custo_unitario vem da planilha de custos (sem_custo = SKU sem custo cadastrado)',
    consultado_em: new Date().toISOString() };
}

// ───────────────────────────── ESTOQUE POR SKU ─────────────────────────────
// (26/11/2026, pedido do Otto: "estoque por SKU direto do control, sem planilha no Drive" — p/ o alerta de ruptura)
// Fonte: o dataset 'estoque' do db-sync (foto da Olist do atualizar: Tiny_Estoque Por_Produto/Estoque) — a mesma da tela Operação.
// agrupar=ponto (padrão): soma as empresas do mesmo ponto (Bsan + Jowcase = estoque real multiempresa); agrupar=conta: uma linha por empresa.
async function estoque(db, q, user) {
  const acessos = require('./acessos');
  if (user && !acessos.pode(user, 'estoque.ver')) throw erro('sem permissão de estoque', 403);
  const r = await require('./operacao-consultas').estoque(db);
  const alvo = S(q.sku) ? new Set(S(q.sku).split(',').map(x => x.trim().toUpperCase()).filter(Boolean)) : null;
  const skusDe = x => [S(x.sku).toUpperCase(), ...S(x.SKUs).split(/[,;|\s]+/).map(s => s.trim().toUpperCase())].filter(Boolean);
  let rows = (r.rows || []).filter(x => (!q.ponto || S(x.ponto) === S(q.ponto)) && (!q.conta || S(x.conta).toLowerCase() === S(q.conta).toLowerCase()) && (!alvo || skusDe(x).some(s => alvo.has(s))));
  const agrupar = S(q.agrupar).toLowerCase() === 'conta' ? 'conta' : 'ponto';
  const lim = Math.min(Math.max(N(q.limite) || 500, 1), 5000);
  const nn = v => v == null ? null : N(v);
  let out;
  if (agrupar === 'conta') {
    out = rows.map(x => ({ ponto: x.ponto, conta: x.conta, sku: x.sku, skus: x.SKUs || x.sku, produto: S(x.produto).slice(0, 90), nivel: x.nivel || null,
      saldo: nn(x.saldoGeral), disponivel: nn(x.dispGeral), reservado: nn(x.reservado), full_ml: nn(x.fullML),
      vendas_dia: nn(x.vendaDia), un_90d: nn(x.un90d), cobertura_dias: nn(x.coberturaDias), cobertura_full_dias: nn(x.cobFull), cobertura_cd_dias: nn(x.cobCD),
      veredito: x.veredito || null, acao_canal: x.acaoCanal || null }));
  } else {
    const g = {};
    rows.forEach(x => { const k = S(x.ponto) + '|' + S(x.sku).toUpperCase();
      const o = g[k] || (g[k] = { ponto: x.ponto, sku: x.sku, skus: x.SKUs || x.sku, produto: S(x.produto).slice(0, 90), saldo: 0, disponivel: 0, reservado: 0,
        full_ml: null, vendas_dia: null, un_90d: null, contas: [], vereditos: [] });
      o.saldo += N(x.saldoGeral); o.disponivel += N(x.dispGeral); o.reservado += N(x.reservado);
      // Full, venda/dia e 90d são do PRODUTO (iguais nas duas linhas) — não somar
      if (x.fullML != null) o.full_ml = Math.max(N(o.full_ml), N(x.fullML));
      if (x.vendaDia != null) o.vendas_dia = Math.max(N(o.vendas_dia), N(x.vendaDia));
      if (x.un90d != null) o.un_90d = Math.max(N(o.un_90d), N(x.un90d));
      o.contas.push({ conta: x.conta, saldo: nn(x.saldoGeral), disponivel: nn(x.dispGeral), reservado: nn(x.reservado) });
      if (x.veredito) o.vereditos.push(x.conta + ': ' + x.veredito); });
    out = Object.values(g).map(o => ({ ...o, vendas_dia: o.vendas_dia == null ? null : r2(o.vendas_dia),
      cobertura_dias: o.vendas_dia ? r2(Math.max(0, o.disponivel) / o.vendas_dia) : null,
      cobertura_com_full_dias: o.vendas_dia ? r2((Math.max(0, o.disponivel) + N(o.full_ml)) / o.vendas_dia) : null }));
  }
  const ORD = { cobertura: 'cobertura_dias', vendas: 'vendas_dia', saldo: 'disponivel' };
  const ord = ORD[S(q.ordenar).toLowerCase()] || null;
  if (ord === 'cobertura_dias') out.sort((a, b) => (a.cobertura_dias == null ? 1e9 : a.cobertura_dias) - (b.cobertura_dias == null ? 1e9 : b.cobertura_dias));
  else if (ord) out.sort((a, b) => N(b[ord]) - N(a[ord]));
  return { posicao_de: r.meta && r.meta.sincronizadoEm || null, agrupar, filtro: { sku: S(q.sku) || null, ponto: S(q.ponto) || null, conta: S(q.conta) || null },
    total_linhas: out.length, mostrando: Math.min(lim, out.length), linhas: out.slice(0, lim),
    observacao: 'foto da Olist da última atualização (posicao_de). Ponto Bsan = Bsan + Jowcase (multiempresa: a Jowcase fica negativa porque vende do estoque da Bsan) — agrupar=ponto soma as duas e é o estoque real do CD. full_ml = unidades no Full do ML (fora do CD). vendas_dia = média dos últimos 90 dias do produto. cobertura_dias = disponível no CD ÷ vendas_dia; cobertura_com_full_dias soma o Full',
    consultado_em: new Date().toISOString() };
}

// ───────────────────────────── VENDAS POR SKU ─────────────────────────────
// (26/11/2026, pedido do Otto, junto do estoque por SKU) unidades vendidas por SKU em 7 dias, 30 dias e no período (?dias=, máx. 120),
// por ponto, com canais e última venda; ?serie=1 (com até 30 SKUs no ?sku=) acrescenta a série diária. Só vendas efetivadas.
async function vendasSku(db, q) {
  const ate = dataOk(q.ate) ? S(q.ate) : hojeBR();
  const dias = Math.min(Math.max(N(q.dias) || 30, 7), 120);
  const de = somaDias(ate, -(dias - 1)), d7 = somaDias(ate, -6), d30 = somaDias(ate, -29);
  const alvo = S(q.sku) ? S(q.sku).split(',').map(x => x.trim().toUpperCase()).filter(Boolean).slice(0, 500) : [];
  const base = de < d30 ? de : d30;   // lê o que for maior: o período pedido ou os 30 dias (un_7d/un_30d valem sempre)
  const where = ["data>=?", "data<=?", "status IN ('venda','venda_com_troca')", "TRIM(COALESCE(sku,''))<>''"], args = [base, ate];
  if (S(q.ponto)) { where.push('ponto=?'); args.push(S(q.ponto)); }
  if (S(q.emp)) { where.push('empresa=?'); args.push(S(q.emp)); }
  if (S(q.mkt)) { where.push('canal=?'); args.push(S(q.mkt)); }
  if (alvo.length) { where.push('UPPER(TRIM(sku)) IN (' + alvo.map(() => '?').join(',') + ')'); args.push(...alvo); }
  const qt = 'COALESCE(qtd,0)', fat = 'CAST(COALESCE(receita_n,CAST(receita AS NUMERIC),0) AS DOUBLE PRECISION)';
  const sql = `SELECT COALESCE(NULLIF(TRIM(ponto),''),'(sem ponto)') AS ponto, UPPER(TRIM(sku)) AS sku, MAX(titulo) AS titulo, canal,
      SUM(CASE WHEN data>=? THEN ${qt} ELSE 0 END) AS un, SUM(CASE WHEN data>=? THEN ${qt} ELSE 0 END) AS un7, SUM(CASE WHEN data>=? THEN ${qt} ELSE 0 END) AS un30,
      SUM(CASE WHEN data>=? THEN ${fat} ELSE 0 END) AS fat, SUM(CASE WHEN data>=? THEN 1 ELSE 0 END) AS vendas, MAX(data) AS ultima
    FROM vendas WHERE ${where.join(' AND ')} GROUP BY 1, 2, canal`;
  const rs = await db.all(sql, [de, d7, d30, de, de, ...args]);
  const g = {};
  rs.forEach(x => { const k = x.ponto + '|' + x.sku; const o = g[k] || (g[k] = { ponto: x.ponto, sku: x.sku, produto: S(x.titulo).slice(0, 90), un_7d: 0, un_30d: 0, un_periodo: 0, faturamento_periodo: 0, vendas_periodo: 0, ultima_venda: null, canais: {} });
    o.un_7d += N(x.un7); o.un_30d += N(x.un30); o.un_periodo += N(x.un); o.faturamento_periodo += N(x.fat); o.vendas_periodo += N(x.vendas);
    if (!o.ultima_venda || S(x.ultima) > o.ultima_venda) o.ultima_venda = S(x.ultima).slice(0, 10);
    o.canais[x.canal] = (o.canais[x.canal] || 0) + N(x.un); });
  let out = Object.values(g).filter(o => o.un_periodo > 0 || o.un_30d > 0).map(o => ({ ...o, canais: Object.fromEntries(Object.entries(o.canais).filter(([, u]) => u > 0)), faturamento_periodo: r2(o.faturamento_periodo), vel_dia_7d: r2(o.un_7d / 7), vel_dia_30d: r2(o.un_30d / 30) }))
    .sort((a, b) => b.un_30d - a.un_30d || b.un_periodo - a.un_periodo);
  const lim = Math.min(Math.max(N(q.limite) || 500, 1), 5000);
  let serie = null;
  if (S(q.serie) === '1') {
    if (!alvo.length || alvo.length > 30) throw erro('serie=1 pede de 1 a 30 SKUs em ?sku=');
    const sd = await db.all(`SELECT UPPER(TRIM(sku)) AS sku, data, SUM(${qt}) AS un FROM vendas WHERE ${where.join(' AND ')} AND data>=? GROUP BY 1, 2 ORDER BY 1, 2`, [...args, de]);
    serie = {}; sd.forEach(x => { (serie[x.sku] = serie[x.sku] || []).push({ data: S(x.data).slice(0, 10), unidades: N(x.un) }); });
  }
  return { periodo: { de, ate, dias }, filtro: { sku: alvo.length ? alvo : null, ponto: S(q.ponto) || null, emp: S(q.emp) || null, mkt: S(q.mkt) || null },
    total_skus: out.length, mostrando: Math.min(lim, out.length), linhas: out.slice(0, lim), serie_diaria: serie,
    observacao: 'unidades de vendas efetivadas (venda/venda_com_troca) em todos os canais, inclusive Full; SKU = o do anúncio na venda (kit conta como o SKU do kit). vel_dia_7d/30d = unidades ÷ dias. Vendas do dia corrente entram só após a atualização',
    consultado_em: new Date().toISOString() };
}

// ───────────────────────────── METAS DO MÊS ─────────────────────────────
async function metas(db, q) {
  const mes = mesOk(q.mes) ? S(q.mes) : hojeBR().slice(0, 7);
  const det = linhas((await dataset(db, 'comissaoDet')).dados).filter(r => S(r.mes) === mes);
  const real = {}; linhas((await dataset(db, 'comissao')).dados).filter(r => S(r.mes) === mes).forEach(r => { real[S(r.operacao)] = r; });
  const ops = det.map(d => { const r = real[S(d.operacao)] || {};
    return { operacao: S(d.operacao), serie: S(d.Serie) || null, modelo: S(d.Modelo) || null,
      faturamento: { meta: N(d.Faturamento_obj) || null, realizado: N(d.Faturamento_real), atingido_pct: N(d.Faturamento_obj) ? r2(N(d.Faturamento_real) / N(d.Faturamento_obj) * 100) : null },
      margem_pct: { meta: d.MC_obj === '' || d.MC_obj == null ? null : r2(N(d.MC_obj) * 100), realizado: d.MC_real === '' || d.MC_real == null ? null : r2(N(d.MC_real) * 100) },
      tacos_pct: { meta: d.TACOS_obj === '' || d.TACOS_obj == null ? null : r2(N(d.TACOS_obj) * 100), realizado: d.TACOS_real === '' || d.TACOS_real == null ? null : r2(N(d.TACOS_real) * 100) },
      ads_rs: { meta: d.Ads_obj === '' || d.Ads_obj == null ? null : r2(d.Ads_obj), realizado: r2(d.Ads_real) },
      progresso_metas_pct: r.progresso_metas == null ? null : N(r.progresso_metas),
      vendas_em_aberto: r.vendas_abertas == null ? null : N(r.vendas_abertas), liquidado_pct: r.liquidado_pct == null ? null : N(r.liquidado_pct),
      alerta: S(d.Alerta) || null };
  }).sort((a, b) => a.operacao.localeCompare(b.operacao));
  return { mes, operacoes: ops, observacao: 'margem = margem FINAL do gestor (pós-Ads e custos da operação), a mesma régua da comissão; realizado do mês até a última atualização', consultado_em: new Date().toISOString() };
}

// ───────────────────────────── FULL ─────────────────────────────
async function full(db, q) {
  const fr = await dataset(db, 'fullRel');
  if (!fr.dados) return { dia: null, contas: [], observacao: 'Relação do Full ainda não gerada' };
  const lim = Math.min(Math.max(N(q.limite) || 30, 1), 300);
  const enxuta = l => ({ sku: l.sku, anuncio: l.mlb, produto: S(l.prod).slice(0, 80), classe: l.classe, tendencia: l.tendencia, aptas: N(l.aptas), a_caminho: N(l.cam),
    vendas_dia: r2(l.vel), cobertura_dias: l.dias == null ? null : N(l.dias), sugestao_envio: N(l.sug), urgencia_ml: l.urg || null, mc_pct: l.mc == null ? null : N(l.mc), curva: l.curva || null, motivo: l.motivo || null });
  const contas = Object.values(fr.dados.contas || {}).filter(c => (!q.emp || S(c.emp) === S(q.emp)) && (!q.mkt || S(c.mkt) === S(q.mkt))).map(c => {
    const ls = c.linhas || [], porClasse = {};
    ls.forEach(l => { porClasse[l.classe] = (porClasse[l.classe] || 0) + 1; });
    const ruptura = ls.filter(l => l.classe === 'Ruptura' || /URGENT|THIS_WEEK/.test(S(l.urg)) && N(l.sug) > 0).sort((a, b) => N(a.dias) - N(b.dias));
    const npf = ls.filter(l => l.classe === 'Não pode faltar').sort((a, b) => N(a.dias) - N(b.dias));
    const antigo = ls.filter(l => l.antigo).map(l => ({ sku: l.sku, anuncio: l.mlb, produto: S(l.prod).slice(0, 80), unidades: N(l.antigo.un), dias: N(l.antigo.dias), custo_previsto: r2(l.antigo.custo) }))
      .sort((a, b) => b.custo_previsto - a.custo_previsto);
    return { empresa: c.emp, canal: c.mkt, ponto: c.ponto, ancora: c.ancora,
      resumo: { anuncios: ls.length, por_classe: porClasse, sugestao_envio_un: ls.reduce((t, l) => t + N(l.sug), 0), ruptura: ruptura.length, nao_pode_faltar: npf.length, parados: (c.parado || []).length },
      estoque_antigo: c.antigo ? { relatorio_de: c.antigo.dia || null, vence: c.antigo.vence || null, custo_previsto: c.antigo.previsto == null ? null : r2(c.antigo.previsto), itens: antigo.slice(0, lim) } : null,
      desempenho: c.desemp ? { tempo_estoque_pct: c.desemp.pctTempo, fora_de_venda_pct: c.desemp.pctFora, rotatividade_30d: c.desemp.rot30 } : null,
      ruptura: ruptura.slice(0, lim).map(enxuta), nao_pode_faltar: npf.slice(0, lim).map(enxuta),
      parados: (c.parado || []).slice(0, lim).map(p => ({ sku: p.sku, anuncio: p.mlb, produto: S(p.prod).slice(0, 80), aptas: N(p.aptas), dias_sem_vender: p.dias, motivo: p.motivo })),
      pendencias: (c.pend || []).slice(0, lim).map(p => ({ acao: p.acao, sku: p.sku, anuncio: p.mlb, detalhe: p.detalhe })) };
  });
  return { dia: fr.dados.dia || null, gerado: fr.dados.gerado || null, limite_por_lista: lim, contas,
    observacao: '"Não pode faltar" = curva A/tração que não pode zerar no Full; "parado" = sem venda em 30 dias com estoque no Full; estoque antigo vem do relatório do Seller Central (custo na próxima fatura)',
    consultado_em: new Date().toISOString() };
}

// ───────────────────────────── PUBLICIDADE ─────────────────────────────
async function publicidade(db, q) {
  const mes = mesOk(q.mes) ? S(q.mes) : hojeBR().slice(0, 7);
  const camp = linhas((await dataset(db, 'adsCamp')).dados).filter(r => S(r.comp) === mes && S(r.emp) && (!q.emp || S(r.emp) === S(q.emp)) && (!q.mkt || S(r.mkt) === S(q.mkt)));
  const fat = {}; linhas((await dataset(db, 'comissao')).dados).filter(r => S(r.mes) === mes).forEach(r => { fat[S(r.operacao)] = N(r.faturamento); });
  const ops = {};
  camp.forEach(r => { const k = S(r.emp) + ' · ' + S(r.mkt); const o = ops[k] || (ops[k] = { operacao: k, empresa: S(r.emp), canal: S(r.mkt), gasto: 0, receita_ads: 0, campanhas: [] });
    o.gasto += N(r.inv); o.receita_ads += N(r.rec);
    o.campanhas.push({ campanha: S(r.campanha), status: S(r.status) || null, orcamento: r2(r.orc), acos_objetivo: r.obj ? r2(r.obj) : null, gasto: r2(r.inv), receita: r2(r.rec),
      acos_pct: N(r.rec) ? r2(N(r.inv) / N(r.rec) * 100) : null, roas: N(r.inv) ? r2(N(r.rec) / N(r.inv)) : null, impressoes: N(r.impr), cliques: N(r.cli), unidades: N(r.un),
      perda_por_orcamento_pct: r.perdOrc ? r2(r.perdOrc) : null, perda_por_classificacao_pct: r.perdCls ? r2(r.perdCls) : null }); });
  const out = Object.values(ops).map(o => { const f = fat[o.operacao] || null;
    o.campanhas.sort((a, b) => b.gasto - a.gasto);
    return { operacao: o.operacao, empresa: o.empresa, canal: o.canal, gasto: r2(o.gasto), receita_ads: r2(o.receita_ads), acos_pct: o.receita_ads ? r2(o.gasto / o.receita_ads * 100) : null,
      faturamento_mes: f, tacos_pct: f ? r2(o.gasto / f * 100) : null, campanhas: o.campanhas };
  }).sort((a, b) => b.gasto - a.gasto);
  return { mes, operacoes: out, observacao: 'ACOS = gasto ÷ receita atribuída ao Ads; TACOS = gasto ÷ faturamento total da operação no mês (a régua da meta); campanhas do relatório de Ads de cada marketplace (Magalu depende do relatório subido)', consultado_em: new Date().toISOString() };
}

// ───────────────────────────── ACOMPANHAMENTO ─────────────────────────────
async function acompanhamento(db, q) {
  const hoje = hojeBR();
  const comp = mesOk(q.competencia) ? S(q.competencia) : hoje.slice(0, 7);
  const lim = Math.min(Math.max(N(q.limite) || 30, 1), 300);
  const args = [comp]; let filtro = '';
  if (S(q.gestor)) { filtro = ' AND d.gestor=?'; args.push(S(q.gestor)); }
  const dem = await db.all(`SELECT d.id, d.empresa, d.canal, d.gestor, d.sku, d.anuncio_id, d.titulo, d.tipo, d.causa, d.estado, d.criado_em, d.prazo_dias, d.risco, d.fat, d.mc_pct, d.meta,
      (SELECT COUNT(*) FROM tratativas t WHERE t.demanda_id=d.id) AS n_trat, (SELECT MAX(t.registrado_em) FROM tratativas t WHERE t.demanda_id=d.id) AS ult_trat,
      (SELECT r.desfecho FROM resultados r WHERE r.demanda_id=d.id ORDER BY r.verificado_em DESC LIMIT 1) AS desfecho,
      (SELECT r.recuperado FROM resultados r WHERE r.demanda_id=d.id ORDER BY r.verificado_em DESC LIMIT 1) AS recuperado
    FROM demandas d WHERE d.competencia=?${filtro}`, args);
  const atrasada = d => S(d.estado) === 'diag' && d.criado_em && d.prazo_dias != null && somaDias(S(d.criado_em).slice(0, 10), N(d.prazo_dias)) < hoje;
  const ges = {};
  dem.forEach(d => { const g = ges[d.gestor || '(sem gestor)'] || (ges[d.gestor || '(sem gestor)'] = { gestor: d.gestor || '(sem gestor)', total: 0, por_estado: {}, atrasadas: 0, risco_aberto_rs: 0, recuperado_rs: 0, desfechos: {} });
    g.total++; g.por_estado[d.estado || '?'] = (g.por_estado[d.estado || '?'] || 0) + 1;
    if (atrasada(d)) g.atrasadas++;
    if (S(d.estado) === 'diag') g.risco_aberto_rs += N(d.risco);
    g.recuperado_rs += N(d.recuperado);
    if (d.desfecho) g.desfechos[d.desfecho] = (g.desfechos[d.desfecho] || 0) + 1; });
  Object.values(ges).forEach(g => { g.risco_aberto_rs = r2(g.risco_aberto_rs); g.recuperado_rs = r2(g.recuperado_rs); });
  const abertas = dem.filter(d => S(d.estado) === 'diag').sort((a, b) => N(b.risco) - N(a.risco)).slice(0, lim).map(d => ({ id: d.id, gestor: d.gestor, empresa: d.empresa, canal: d.canal,
    sku: d.sku, anuncio: d.anuncio_id, produto: S(d.titulo).slice(0, 80), tipo: d.tipo, causa: S(d.causa).slice(0, 200), risco_rs: r2(d.risco), mc_pct: d.mc_pct == null ? null : r2(d.mc_pct),
    meta_mc_pct: d.meta == null ? null : r2(d.meta), criada_em: d.criado_em, prazo_dias: d.prazo_dias == null ? null : N(d.prazo_dias), atrasada: atrasada(d) }));
  return { competencia: comp, por_gestor: Object.values(ges).sort((a, b) => b.risco_aberto_rs - a.risco_aberto_rs), abertas_por_risco: abertas,
    estados: { diag: 'aberta, sem ação do gestor', trat: 'gestor registrou ação', aguardando: 'aguardando venda/efeito p/ medir', fora: 'saiu da fila (resolvida sozinha ou fora da regra)' },
    observacao: 'atrasada = aberta (diag) e criada há mais que o prazo; risco = R$ estimado em jogo na demanda; desfecho/recuperado = medição por resultado (verificar-tratativas)',
    consultado_em: new Date().toISOString() };
}

const INDICE = {
  descricao: 'BsanControl · rotas de leitura (JSON). Autenticação: Authorization: Bearer <token>. Só GET.',
  rotas: {
    '/api/leitura/status': 'frescor das bases e alertas (comece por aqui: situacao = ok | aviso | erro)',
    '/api/leitura/vendas-dia?de=AAAA-MM-DD&ate=AAAA-MM-DD&emp=&mkt=': 'vendas e margem por operação e dia, antes e depois do Ads (padrão: últimos 7 dias; máx. 62)',
    '/api/leitura/produtos?de=AAAA-MM-DD&ate=AAAA-MM-DD&agrupar=anuncio|sku&emp=&mkt=&ordenar=faturamento|margem|unidades|ads|margem_pct&limite=200': 'vendas e margem por anúncio (padrão) ou por SKU, antes e depois do Ads (máx. 62 dias)',
    '/api/leitura/metas?mes=AAAA-MM': 'metas do mês × realizado por operação',
    '/api/leitura/full?emp=&mkt=&limite=30': 'Full: resumo, ruptura, não pode faltar, parado, estoque antigo, pendências',
    '/api/leitura/publicidade?mes=AAAA-MM&emp=&mkt=': 'Ads por campanha e TACOS da operação',
    '/api/leitura/acompanhamento?competencia=AAAA-MM&gestor=&limite=30': 'demandas por gestor: estados, atrasadas, R$ em risco, desfechos',
    '/api/leitura/estoque?sku=A,B&ponto=&conta=&agrupar=ponto|conta&ordenar=cobertura|vendas|saldo&limite=500': 'estoque por SKU (foto da Olist da última atualização): saldo, disponível, reservado, Full ML, venda/dia e cobertura',
    '/api/leitura/vendas-sku?ate=AAAA-MM-DD&dias=30&sku=A,B&ponto=&emp=&mkt=&serie=1&limite=500': 'unidades vendidas por SKU em 7d, 30d e no período (máx. 120 dias), canais e última venda; serie=1 = série diária (até 30 SKUs)'
  }
};

async function rota(db, pathname, q, user) {
  switch (pathname) {
    case '/api/leitura': case '/api/leitura/': return INDICE;
    case '/api/leitura/status': return status(db);
    case '/api/leitura/vendas-dia': return vendasDia(db, q, user);
    case '/api/leitura/produtos': return produtos(db, q, user);
    case '/api/leitura/metas': return metas(db, q);
    case '/api/leitura/full': return full(db, q);
    case '/api/leitura/publicidade': return publicidade(db, q);
    case '/api/leitura/acompanhamento': return acompanhamento(db, q);
    case '/api/leitura/estoque': return estoque(db, q, user);
    case '/api/leitura/vendas-sku': return vendasSku(db, q);
    default: return null;
  }
}

module.exports = { rota, status, vendasDia, produtos, metas, full, publicidade, acompanhamento, estoque, vendasSku, INDICE };
