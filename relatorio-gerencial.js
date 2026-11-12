// relatorio-gerencial.js — RELATÓRIO GERENCIAL de UMA operação (empresa · marketplace) em Excel. 12/11/2026. SÓ LEITURA.
//
// Por quê (Weskley, 12/11/2026): o gestor Marcos ficou sem acesso ao BsanControl (rede). O relatório substitui a planilha
// gerencial antiga (Vendas / Devoluções / Ads / Geral / ABC / Metas / Resultados), agora com os números do pipeline.
// Fase 1 = gerador. Fase 2 = acabamento (formatação, gráficos nas Metas, venda × cancelamento × devolução separados,
// tarefas do gestor). Fase 3 = o mesmo gerar() atrás do botão "Exportar relatório" da aba Gerencial, com a trava de carteira.
// Nada é gravado no banco nem no Drive do gestor.
//
// Mesmas contas do painel: resultados-consultas (resumo/dias), margens-consultas (Ads rateado, MC antes/depois do Ads por
// dia e por anúncio) e visual/resultados-modelo (curva ABC 80/95 e quadrantes). Metas e DRE = comissaoDet (comissao.js).
// Pedidos do Weskley (12/11): não mostrar de onde vem cada dado (fonte do líquido etc.); custo faltando = "Precisa preencher o custo".
// Período: SÓ por mês, --mes=AAAA-MM (mês fechado = mês inteiro; mês corrente = até o último dia com venda).
// Formatação/gráficos: xlsx-populate (preserva os gráficos do modelo modelos/relatorio-gerencial-modelo.xlsx, aba Metas).
//
// uso: node relatorio-gerencial.js --emp="Powerfull Imports" --mkt="Mercado Livre" --mes=2026-11
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const db = require("./dbx");
const R = require("./resultados-consultas"), MG = require("./margens-consultas"), RM = require("./visual/resultados-modelo");
// local: o npm trava no Drive → dependências ficam em ~/.bsancontrol/deps (o mesmo do 'pg' no dbx.js)
const dep = n => { try { return require(n); } catch (e) { return require(path.join(os.homedir(), ".bsancontrol", "deps", "node_modules", n)); } };
const XP = dep("xlsx-populate"), ACAB = require("./xlsx-acabamento"), JSZip = ACAB.JSZip;
const MODELO = path.join(__dirname, "modelos", "relatorio-gerencial-modelo.xlsx");

const S = v => String(v == null ? "" : v).trim(), N = v => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
const nn = v => (v == null || v === "" || !Number.isFinite(Number(v))) ? null : Number(v);   // zero não é vazio
const div = (a, b) => (b ? a / b : null);
const fimMes = m => new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7), 0)).toISOString().slice(0, 10);
const diasMes = m => +fimMes(m).slice(8, 10);
const meses = (de, ate) => { const o = []; let m = de.slice(0, 7); while (m <= ate.slice(0, 7)) { o.push(m); m = new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7), 1)).toISOString().slice(0, 7); } return o; };
const diasEntre = (de, ate) => { const o = []; for (let d = new Date(de + "T00:00:00Z"); d <= new Date(ate + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 1)) o.push(d.toISOString().slice(0, 10)); return o; };
const SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const semana = d => SEMANA[new Date(d + "T12:00:00Z").getUTCDay()];
const br = d => d ? d.slice(8, 10) + "/" + d.slice(5, 7) + "/" + d.slice(0, 4) : "";
// status do pipeline → o que o gestor lê. ML/Shein/TikTok: "pendente" = devolução ou reclamação ainda aberta (dinheiro retido).
const STATUS = { venda: "Venda", venda_com_troca: "Venda (com troca)", cancelada: "Cancelada", devolvida: "Devolução finalizada", pendente: "Devolução/reclamação em andamento" };
const grupo = st => { st = S(st).toLowerCase(); return /^venda/.test(st) ? "venda" : /cancel/.test(st) ? "cancelada" : /devol/.test(st) ? "devolvida" : /pendente/.test(st) ? "andamento" : "outro"; };
const SEM_CUSTO = "Precisa preencher o custo";
const TAREFA_PLANILHA_DESDE = "2026-11";   // tarefas antes disso não se tratam pela planilha (Weskley, 12/11/2026)
const ACOES_PLANILHA = ["Ajustei o preço", "Pausei o anúncio", "Mudei de campanha", "Ajustei o ROAS", "Corrigi custo ou cadastro", "Tirei da promoção", "Não fiz (explicar o motivo)", "Outro"];

// ---------- período ----------
// SÓ POR MÊS (Weskley, 12/11/2026): período livre quebraria a leitura entre abas (Ads do marketplace e DRE são mensais,
// meta vira proporcional). Análise por período livre fica no painel.
async function periodo({ emp, mkt, mes }) {
  if (!/^\d{4}-\d{2}$/.test(S(mes))) throw new Error("a exportação em Excel é por mês: informe o mês (AAAA-MM)");
  const ult = await R.resumo(db, { emp, mkt, ultima: "1" });
  const ultima = S(ult && ult.ultima);
  const de = mes + "-01", ate = fimMes(mes);
  const corte = ultima && ultima < ate ? ultima : ate;   // mês corrente: até o último dia com venda carregada
  return { de, ate: corte, ateSolicitado: ate, ultimaVenda: ultima, parcial: corte < ate };
}

// ---------- dados ----------
async function vendasDetalhe(emp, mkt, de, ate) {
  const num = c => `CAST(COALESCE(${c}_n, CAST(NULLIF(TRIM(CAST(${c} AS TEXT)),'') AS NUMERIC)) AS DOUBLE PRECISION)`;
  const cols = ["receita", "liquido", "comissao", "tarifas", "frete", "bonus_flex", "imposto", "ctp", "mc_real", "mc_comissao", "afiliados", "reembolso"];
  return db.all(`SELECT data, pedido, status, anuncio_id, sku, titulo, qtd, forma_entrega, veio_de_ads, ${cols.map(c => num(c) + " AS " + c).join(", ")}
    FROM vendas WHERE empresa=? AND canal=? AND data>=? AND data<=? ORDER BY data, pedido`, [emp, mkt, de, ate]);
}
async function dataset(nome) { const r = await db.get("SELECT json FROM datasets WHERE nome=?", [nome]); try { return JSON.parse(r.json); } catch (e) { return []; } }

// ---------- montagem (abas como especificações; o Excel é escrito no fim) ----------
// spec: { nome, linhas, cab (índice da linha de cabeçalho), formatos {coluna: rs|pct|int|n2}, celulas [[r,c,fmt]], larguras, filtro, vermelho [colunas], titulo [linhas em destaque] }
async function gerar({ emp, mkt, mes }) {
  const per = await periodo({ emp, mkt, mes });
  const q = { de: per.de, ate: per.ate, emp, mkt }, op = emp + " · " + mkt;
  const [res, mg, vendas, det, com, adsAll, metr, plano, dem, trat] = await Promise.all([
    R.resumo(db, q), MG.carregar(db, { ...q, itens: "1" }), vendasDetalhe(emp, mkt, per.de, per.ate),
    dataset("comissaoDet"), dataset("comissao"), dataset("ads"),
    db.all("SELECT * FROM ml_metricas WHERE empresa=? AND data=(SELECT MAX(data) FROM ml_metricas WHERE empresa=?)", [emp, emp]).catch(() => []),
    db.all("SELECT * FROM ads_plano WHERE empresa=? AND data=(SELECT MAX(data) FROM ads_plano WHERE empresa=?)", [emp, emp]).catch(() => []),
    db.all("SELECT * FROM demandas WHERE empresa=? AND canal=? ORDER BY criado_em DESC", [emp, mkt]).catch(() => []),
    db.all("SELECT t.* FROM tratativas t JOIN demandas d ON d.id=t.demanda_id WHERE d.empresa=? AND d.canal=? ORDER BY t.registrado_em DESC", [emp, mkt]).catch(() => []),
  ]);
  const tot = (res.faixas[0].ops || [])[0] || {}, mres = mg.resumo || {};
  const fat = N(tot.fat), ped = N(tot.ped || tot.n_fin), un = N(tot.qtd), base = N(mres.base || fat);
  const G = { venda: [], cancelada: [], devolvida: [], andamento: [], outro: [] }; vendas.forEach(v => G[grupo(v.status)].push(v));
  const ms = meses(per.de, per.ate), dets = ms.map(m => det.find(d => d.mes === m && d.operacao === op)).filter(Boolean);

  const metaFatPeriodo = ms.reduce((s, m) => { const d = dets.find(x => x.mes === m); if (!d || nn(d.Faturamento_obj) == null) return s;
    const dias = diasEntre(per.de < m + "-01" ? m + "-01" : per.de, per.ate > fimMes(m) ? fimMes(m) : per.ate).length; return s + N(d.Faturamento_obj) * dias / diasMes(m); }, 0);
  const ultDet = dets[dets.length - 1] || {}, metaMC = nn(ultDet.MC_obj), metaTacos = nn(ultDet.TACOS_obj);
  const mcPre = N(mres.pre != null ? mres.pre : tot.mc), adsTot = N(mres.ads), mcPos = N(mres.after != null ? mres.after : mcPre - adsTot);

  // comparação: mesmo número de dias no mês anterior
  const nDias = diasEntre(per.de, per.ate).length, antDe = new Date(per.de + "T00:00:00Z"); antDe.setUTCMonth(antDe.getUTCMonth() - 1);
  const aDe = antDe.toISOString().slice(0, 10), aAteD = new Date(antDe); aAteD.setUTCDate(aAteD.getUTCDate() + nDias - 1);
  const aAte = aAteD.toISOString().slice(0, 10) > fimMes(aDe.slice(0, 7)) ? fimMes(aDe.slice(0, 7)) : aAteD.toISOString().slice(0, 10);
  const ant = await R.resumo(db, { de: aDe, ate: aAte, emp, mkt }).then(r => (r.faixas[0].ops || [])[0] || {}).catch(() => ({}));
  const antM = await MG.carregar(db, { de: aDe, ate: aAte, emp, mkt }).then(r => r.resumo || {}).catch(() => ({}));
  const antBase = N(antM.base || ant.base || ant.fat);

  // anúncios: margens por produto + métricas do ML + curva ABC/quadrante do painel
  const prods = (mg.produtos || []).map(p => ({ ...p, id: (p.anuncio || "") + "|" + p.sku, mcReal: N(p.after) }));
  const abc = new Map(RM.matrix(prods, 0.8, 0.95, "mcReal").map(r => [r.id, r.code]));
  const fats = prods.map(p => N(p.fat)).sort((a, b) => a - b), medFat = fats.length ? fats[Math.floor(fats.length / 2)] : 0;
  const pctMedia = div(prods.reduce((s, p) => s + N(p.after), 0), prods.reduce((s, p) => s + N(p.base || p.fat), 0)) || 0;
  const quad = p => { const pa = div(N(p.after), N(p.base || p.fat)) || 0; return N(p.fat) >= medFat ? (pa >= pctMedia ? "Estrela" : "Margem baixa") : (pa >= pctMedia ? "Nicho" : "Revisar"); };
  const ACAO = { Estrela: "Proteger: manter preço, estoque e Ads eficiente", "Margem baixa": "Vende muito com margem baixa: revisar preço, custo ou Ads", Nicho: "Margem boa e pouco volume: ganhar tráfego (Ads/catálogo)", Revisar: "Pouco volume e margem baixa: corrigir o anúncio ou descontinuar" };
  const met = new Map(metr.map(m => [S(m.anuncio), m]));
  const planoAn = new Map(plano.filter(p => !/campanha/i.test(S(p.nivel))).map(p => [S(p.chave), p]));
  const faltaCusto = p => N(p.qtd) > 0 && (N(p.ctpMissing) > 0 || N(p.ctp) === 0);   // custo ausente ou zerado
  const semCusto = prods.filter(faltaCusto);
  const specs = [];

  // 1) RESUMO
  const R1 = [["Relatório gerencial — " + op], ["Período: " + br(per.de) + " a " + br(per.ate) + (per.parcial ? ` (mês em andamento, dados até ${br(per.ate)})` : "")],
    ["Gerado em " + new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })], [], ["Indicador", "Período", "Mês anterior (mesmos dias)"]], C1 = [];
  const L = (rot, v, f, a, fa) => { R1.push([rot, v, a == null ? null : a]); C1.push([R1.length - 1, 1, f], [R1.length - 1, 2, fa || f]); };
  L("Faturamento", fat, "rs", nn(ant.fat)); L("Pedidos", ped, "int", nn(ant.ped || ant.n_fin)); L("Unidades", un, "int", nn(ant.qtd));
  L("Ticket médio", div(fat, ped), "rs", div(N(ant.fat), N(ant.ped || ant.n_fin)));
  L("MC antes do Ads (R$)", mcPre, "rs", nn(ant.mc)); L("MC antes do Ads (%)", div(mcPre, base), "pct", div(N(ant.mc), antBase));
  L("Ads (R$)", adsTot, "rs", nn(antM.ads)); L("TACOS", div(adsTot, base), "pct", div(N(antM.ads), antBase));
  L("MC depois do Ads (R$)", mcPos, "rs", nn(antM.after)); L("MC depois do Ads (%)", div(mcPos, base), "pct", div(N(antM.after), antBase));
  R1.push([]); R1.push(["Pedidos fora da venda", "Quantidade", "Valor de venda"]); const tPed = R1.length - 1;
  [["Cancelados", G.cancelada], ["Devoluções finalizadas", G.devolvida], ["Devoluções/reclamações em andamento", G.andamento]].forEach(([rot, arr]) => {
    R1.push([rot, arr.length, arr.reduce((s, v) => s + N(v.receita), 0)]); C1.push([R1.length - 1, 1, "int"], [R1.length - 1, 2, "rs"]); });
  R1.push(["Taxa de cancelamento", div(G.cancelada.length, vendas.length), null]); C1.push([R1.length - 1, 1, "pct"]);
  R1.push([]); R1.push(["Metas", "Meta", "Realizado"]); const tMeta = R1.length - 1;
  R1.push(["Faturamento (meta proporcional ao período)", metaFatPeriodo || null, fat]); C1.push([R1.length - 1, 1, "rs"], [R1.length - 1, 2, "rs"]);
  R1.push(["Atingimento do faturamento", null, metaFatPeriodo ? fat / metaFatPeriodo : null]); C1.push([R1.length - 1, 2, "pct"]);
  R1.push(["MC antes do Ads (%)", metaMC, div(mcPre, base)]); C1.push([R1.length - 1, 1, "pct"], [R1.length - 1, 2, "pct"]);
  R1.push(["TACOS", metaTacos, div(adsTot, base)]); C1.push([R1.length - 1, 1, "pct"], [R1.length - 1, 2, "pct"]);
  if (per.parcial) { R1.push(["Projeção do mês (ritmo atual)", null, fat / nDias * diasMes(per.ate.slice(0, 7))]); C1.push([R1.length - 1, 2, "rs"]); }
  const tit1 = [4, tPed, tMeta];
  if (semCusto.length) { R1.push([]); R1.push([`Atenção: ${semCusto.length} anúncio(s) vendendo sem custo cadastrado — a margem deles aparece maior do que é (${SEM_CUSTO.toLowerCase()}).`]); tit1.push(-(R1.length - 1)); }
  const alertas = prods.filter(p => N(p.after) < 0).sort((a, b) => N(a.after) - N(b.after)).slice(0, 5);
  if (alertas.length) { R1.push([]); R1.push(["Anúncios com margem negativa depois do Ads", "MC depois do Ads (R$)", "Faturamento"]); tit1.push(R1.length - 1);
    alertas.forEach(p => { R1.push([`${p.anuncio || ""} ${S(p.titulo).slice(0, 55)}`, N(p.after), N(p.fat)]); C1.push([R1.length - 1, 1, "rs"], [R1.length - 1, 2, "rs"]); }); }
  specs.push({ nome: "Resumo", linhas: R1, celulas: C1, larguras: [60, 22, 28], titulo: tit1, capa: true });

  // 2) RESULTADOS DIÁRIOS
  const md = new Map((mg.diarias || []).map(d => [d.date, d])), rd = new Map((res.dias || []).map(d => [d.date, d]));
  const cnt = arr => { const o = {}; arr.forEach(v => o[v.data] = (o[v.data] || 0) + 1); return o; }, cD = cnt(G.cancelada), dD = cnt(G.devolvida), aD = cnt(G.andamento);
  const H2 = ["Data", "Dia", "Pedidos", "Unidades", "Faturamento", "MC antes do Ads", "MC antes (%)", "Ads", "TACOS", "MC depois do Ads", "MC depois (%)", "Cancelados", "Devoluções finalizadas", "Devoluções em andamento"];
  const L2 = [H2]; diasEntre(per.de, per.ate).forEach(d => { const a = md.get(d) || {}, b = rd.get(d) || {}, bs = N(a.base || b.base || b.fat), pre = a.pre != null ? N(a.pre) : N(b.mc), pos = a.after != null ? N(a.after) : N(b.mc);
    L2.push([br(d), semana(d), N(b.ped || b.n_fin), N(b.qtd), N(b.fat), pre, div(pre, bs), N(a.ads), div(N(a.ads), bs), pos, div(pos, bs), cD[d] || 0, dD[d] || 0, aD[d] || 0]); });
  const tt = k => L2.slice(1).reduce((s, r) => s + N(r[H2.indexOf(k)]), 0);
  L2.push(["Total", "", tt("Pedidos"), tt("Unidades"), fat, mcPre, div(mcPre, base), adsTot, div(adsTot, base), mcPos, div(mcPos, base), tt("Cancelados"), tt("Devoluções finalizadas"), tt("Devoluções em andamento")]);
  specs.push({ nome: "Resultados diários", linhas: L2, formatos: { Faturamento: "rs", "MC antes do Ads": "rs", "MC antes (%)": "pct", Ads: "rs", TACOS: "pct", "MC depois do Ads": "rs", "MC depois (%)": "pct", Pedidos: "int", Unidades: "int" },
    vermelho: ["MC antes do Ads", "MC depois do Ads", "MC depois (%)"], total: true, larguras: [12, 10] });

  // 3) METAS (dia a dia, acumulado) — escrita na aba do modelo, que tem os gráficos
  const H3 = ["Data", "Meta faturamento (dia)", "Realizado (dia)", "Meta acumulada", "Realizado acumulado", "Atingimento acumulado", "Meta MC (%)", "MC antes do Ads acumulada (%)", "Meta TACOS", "TACOS acumulado"];
  const L3 = [H3]; let ma = 0, ra = 0, mca = 0, basea = 0, adsa = 0;
  diasEntre(per.de, per.ate).forEach(d => { const m = d.slice(0, 7), dt = dets.find(x => x.mes === m), md1 = dt && nn(dt.Faturamento_obj) != null ? N(dt.Faturamento_obj) / diasMes(m) : null, a = md.get(d) || {}, b = rd.get(d) || {};
    ma += md1 || 0; ra += N(b.fat); mca += a.pre != null ? N(a.pre) : N(b.mc); basea += N(a.base || b.base || b.fat); adsa += N(a.ads);
    L3.push([d.slice(8, 10) + "/" + d.slice(5, 7), md1, N(b.fat), md1 == null ? null : ma, ra, ma ? ra / ma : null, dt ? nn(dt.MC_obj) : null, div(mca, basea), dt ? nn(dt.TACOS_obj) : null, div(adsa, basea)]); });
  specs.push({ nome: "Metas", linhas: L3, formatos: { "Meta faturamento (dia)": "rs", "Realizado (dia)": "rs", "Meta acumulada": "rs", "Realizado acumulado": "rs", "Atingimento acumulado": "pct", "Meta MC (%)": "pct", "MC antes do Ads acumulada (%)": "pct", "Meta TACOS": "pct", "TACOS acumulado": "pct" },
    larguras: [8, 14, 14, 14, 14, 13, 11, 16, 11, 12], modelo: true, filtro: false });

  // 4) VENDAS (só venda) · 5) CANCELAMENTOS · 6) DEVOLUÇÕES (finalizadas e em andamento, separadas)
  const RS = ["Receita", "Comissão", "Tarifas", "Frete", "Bônus Flex", "Líquido", "Imposto", "Custo do produto", "MC (base comissão)", "MC real", "Afiliados", "Reembolso"];
  const H4 = ["Data", "Pedido", "Anúncio", "SKU", "Título", "Unidades", "Forma de entrega", "Veio de Ads", "Receita", "Comissão", "Tarifas", "Frete", "Bônus Flex", "Líquido", "Imposto", "Custo do produto", "MC (base comissão)", "MC real", "Afiliados"];
  const custoTxt = v => (N(v.ctp) === 0 && /^venda/i.test(S(v.status))) ? SEM_CUSTO : nn(v.ctp);
  specs.push({ nome: "Vendas", linhas: [H4, ...G.venda.map(v => [br(v.data), S(v.pedido), S(v.anuncio_id), S(v.sku), S(v.titulo), N(v.qtd), S(v.forma_entrega), /^(s|sim|1|true)$/i.test(S(v.veio_de_ads)) ? "Sim" : "",
    nn(v.receita), nn(v.comissao), nn(v.tarifas), nn(v.frete), nn(v.bonus_flex), nn(v.liquido), nn(v.imposto), custoTxt(v), nn(v.mc_comissao), nn(v.mc_real), nn(v.afiliados)])],
    formatos: Object.fromEntries(RS.map(k => [k, "rs"])), vermelho: ["MC (base comissão)", "MC real"], larguras: [11, 18, 15, 22, 45, 9, 18, 9] });
  const porAn = arr => { const m = {}; arr.forEach(v => { const k = S(v.anuncio_id) || "(sem anúncio)", o = m[k] || (m[k] = { an: k, tit: S(v.titulo), n: 0, un: 0, rec: 0, liq: 0 }); o.n++; o.un += N(v.qtd); o.rec += N(v.receita); o.liq += N(v.liquido); }); return Object.values(m).sort((a, b) => b.n - a.n); };
  const totAn = {}; vendas.forEach(v => { const k = S(v.anuncio_id) || "(sem anúncio)"; totAn[k] = (totAn[k] || 0) + 1; });
  const L5 = [["Data", "Pedido", "Anúncio", "SKU", "Título", "Unidades", "Forma de entrega", "Valor do pedido"], ...G.cancelada.map(v => [br(v.data), S(v.pedido), S(v.anuncio_id), S(v.sku), S(v.titulo), N(v.qtd), S(v.forma_entrega), nn(v.receita)])];
  L5.push([], ["Por anúncio", "Cancelados", "Pedidos do anúncio", "Taxa de cancelamento", "Título"]); const c5 = L5.length - 1, C5 = [];
  porAn(G.cancelada).forEach(o => { L5.push([o.an, o.n, totAn[o.an] || 0, div(o.n, totAn[o.an]), o.tit]); C5.push([L5.length - 1, 3, "pct"]); });
  specs.push({ nome: "Cancelamentos", linhas: L5, formatos: { "Valor do pedido": "rs" }, celulas: C5, titulo: [c5], larguras: [14, 18, 15, 22, 45, 9, 18, 14] });
  const H6 = ["Situação", "Data da venda", "Pedido", "Anúncio", "SKU", "Título", "Unidades", "Valor da venda", "Reembolso", "Líquido (o que ficou)"];
  const lin6 = (sit, v) => [sit, br(v.data), S(v.pedido), S(v.anuncio_id), S(v.sku), S(v.titulo), N(v.qtd), nn(v.receita), nn(v.reembolso), nn(v.liquido)];
  const L6 = [H6, ...G.devolvida.map(v => lin6("Devolução finalizada", v)), ...G.andamento.map(v => lin6("Em andamento (dinheiro retido)", v))];
  L6.push([], ["Por anúncio", "Finalizadas", "Em andamento", "Pedidos do anúncio", "Taxa de devolução", "Título"]); const c6 = L6.length - 1, C6 = [];
  const fin = new Map(porAn(G.devolvida).map(o => [o.an, o])), andm = new Map(porAn(G.andamento).map(o => [o.an, o]));
  [...new Set([...fin.keys(), ...andm.keys()])].forEach(k => { const a = fin.get(k), b = andm.get(k), n1 = a ? a.n : 0, n2 = b ? b.n : 0;
    L6.push([k, n1, n2, totAn[k] || 0, div(n1 + n2, totAn[k]), (a || b).tit]); C6.push([L6.length - 1, 4, "pct"]); });
  specs.push({ nome: "Devoluções", linhas: L6, formatos: { "Valor da venda": "rs", Reembolso: "rs", "Líquido (o que ficou)": "rs" }, celulas: C6, titulo: [c6], vermelho: ["Líquido (o que ficou)"], larguras: [30, 12, 18, 15, 22, 45, 9, 14, 12, 18] });

  // 7) ANÚNCIOS
  const H7 = ["Anúncio", "SKU", "Título", "Pedidos", "Unidades", "Faturamento", "Preço médio", "Custo unitário", "MC antes do Ads", "MC antes (%)", "Ads", "TACOS", "MC depois do Ads", "MC depois (%)", "Curva (Fat·Un·MC)", "Quadrante", "Visitas 30d", "Conversão 30d", "Qualidade", "Diagnóstico do ML"];
  const ordP = prods.slice().sort((a, b) => N(b.fat) - N(a.fat));
  specs.push({ nome: "Anúncios", linhas: [H7, ...ordP.map(p => { const m = met.get(S(p.anuncio)) || {}, bs = N(p.base || p.fat), cv = nn(m.conversao_30d);
    return [S(p.anuncio), S(p.sku), S(p.titulo), N(p.n), N(p.qtd), N(p.fat), div(N(p.fat), N(p.qtd)), faltaCusto(p) ? SEM_CUSTO : nn(p.custoUn), N(p.pre), div(N(p.pre), bs), N(p.ads), div(N(p.ads), bs), N(p.after), div(N(p.after), bs),
      abc.get(p.id) || "", quad(p), nn(m.visitas_30d), cv == null ? null : cv / (cv > 1 ? 100 : 1), nn(m.qualidade), S(m.diagnostico)]; })],
    formatos: { Faturamento: "rs", "Preço médio": "rs", "Custo unitário": "rs", "MC antes do Ads": "rs", "MC antes (%)": "pct", Ads: "rs", TACOS: "pct", "MC depois do Ads": "rs", "MC depois (%)": "pct", "Visitas 30d": "int", "Conversão 30d": "pct" },
    vermelho: ["MC antes do Ads", "MC depois do Ads", "MC depois (%)"], alerta: ["Custo unitário"], larguras: [15, 22, 45, 8, 9, 13, 11, 22] });

  // 8) ADS POR ANÚNCIO (o Ads chega por mês: entram os meses do período)
  const ads = (Array.isArray(adsAll) ? adsAll : []).filter(a => a.emp === emp && a.mkt === mkt && ms.includes(a.comp));
  const agA = {}; ads.forEach(a => { const k = a.comp + "|" + S(a.mlb || a.anuncio) + "|" + S(a.campanha), o = agA[k] || (agA[k] = { comp: a.comp, an: S(a.mlb || a.anuncio), tit: S(a.tit), camp: S(a.campanha), inv: 0, rec: 0, impr: 0, cli: 0, vd: 0, vi: 0 });
    o.inv += N(a.inv); o.rec += N(a.recAds); o.impr += N(a.impr); o.cli += N(a.cli); o.vd += N(a.vd); o.vi += N(a.vi); });
  const H8 = ["Mês", "Anúncio", "Título", "Campanha", "Investimento", "Receita de Ads", "ACOS", "ROAS", "Impressões", "Cliques", "CTR", "CPC", "Vendas diretas", "Vendas indiretas", "Ação sugerida", "Motivo"];
  const L8 = [H8, ...Object.values(agA).sort((a, b) => b.inv - a.inv).map(o => { const p = planoAn.get(o.an) || {};
    return [o.comp, o.an, o.tit, o.camp, o.inv, o.rec, div(o.inv, o.rec), div(o.rec, o.inv), o.impr, o.cli, div(o.cli, o.impr), div(o.inv, o.cli), o.vd, o.vi, S(p.acao), S(p.motivo)]; })];
  if (L8.length === 1) L8.push(["", "", "Sem investimento em Ads nesta operação no período."]);
  specs.push({ nome: "Ads por anúncio", linhas: L8, formatos: { Investimento: "rs", "Receita de Ads": "rs", ACOS: "pct", ROAS: "n2", "Impressões": "int", Cliques: "int", CTR: "pct", CPC: "rs" }, larguras: [9, 15, 40, 18, 13, 14, 9, 8, 11, 9, 8, 9, 9, 9, 40, 40] });

  // 9) CURVA ABC
  const H9 = ["Anúncio", "SKU", "Título", "Curva (Fat·Un·MC)", "Quadrante", "O que fazer", "Faturamento", "% do faturamento", "MC depois do Ads", "MC depois (%)"];
  specs.push({ nome: "Curva ABC", linhas: [H9, ...ordP.map(p => { const q1 = quad(p); return [S(p.anuncio), S(p.sku), S(p.titulo), abc.get(p.id) || "", q1, ACAO[q1], N(p.fat), div(N(p.fat), fat), N(p.after), div(N(p.after), N(p.base || p.fat))]; })],
    formatos: { Faturamento: "rs", "% do faturamento": "pct", "MC depois do Ads": "rs", "MC depois (%)": "pct" }, vermelho: ["MC depois do Ads", "MC depois (%)"], larguras: [15, 22, 45, 12, 13, 55, 13, 12, 14, 12] });

  // 10) TAREFAS do gestor nesta operação (a mais recente de cada anúncio + tipo)
  const ultTrat = new Map(); trat.forEach(t => { if (!ultTrat.has(t.demanda_id)) ultTrat.set(t.demanda_id, t); });
  const vistas = new Set(), tarefas = dem.filter(d => ms.includes(S(d.competencia))).filter(d => { const k = S(d.anuncio_id) + "|" + S(d.tipo); if (vistas.has(k)) return false; vistas.add(k); return true; });
  // Preenchimento pela planilha (Weskley, 12/11/2026): qualquer gestor pode registrar a tarefa aqui e subir o arquivo
  // (importar-tarefas.js grava como o registro do painel). Só tarefa de novembro/2026 em diante e ainda sem registro.
  const H10 = ["Criada em", "Tipo", "Anúncio", "SKU", "Título", "O que fazer", "MC (%)", "Meta (%)", "Faturamento", "Prazo (dias)", "Situação", "Último registro",
    "O que foi feito", "Descrição do que foi feito (mín. 15 caracteres)", "Novo preço (se mudou)", "ID da tarefa"];
  const editavel = (d, t) => S(d.competencia) >= TAREFA_PLANILHA_DESDE && !t;
  const L10 = [H10, ...tarefas.map(d => { const t = ultTrat.get(d.id); return [br(S(d.criado_em).slice(0, 10)), S(d.tipo), S(d.anuncio_id), S(d.sku), S(d.titulo), S(d.causa), nn(d.mc_pct) == null ? null : N(d.mc_pct) / 100, nn(d.meta) == null ? null : N(d.meta) / 100, nn(d.fat), nn(d.prazo_dias),
    t ? "Registrada" : editavel(d, t) ? "Aberta — preencher ao lado" : "Aberta", t ? `${br(S(t.registrado_em).slice(0, 10))} · ${S(t.acao)} · ${S(t.obs)}` : "", "", "", "", editavel(d, t) ? S(d.id) : ""]; })];
  if (L10.length === 1) L10.push(["", "", "", "", "Nenhuma tarefa aberta para esta operação."]);
  const linhasEditaveis = L10.map((r, i) => i > 0 && r[15] ? i : null).filter(i => i != null);
  specs.push({ nome: "Tarefas", linhas: L10, formatos: { "MC (%)": "pct", "Meta (%)": "pct", Faturamento: "rs", "Novo preço (se mudou)": "rs" }, vermelho: ["MC (%)"],
    larguras: [11, 26, 15, 20, 40, 70, 9, 9, 12, 9, 22, 40, 26, 50, 14, 6], preencher: { linhas: linhasEditaveis, colunas: [12, 13, 14], lista: 12, oculta: 15 } });

  // 11) DRE DA COMISSÃO (por mês do período, como no fechamento)
  const ROT = [["Faturamento", "DreFat", "rs"], ["Líquido recebido", "DreLiquido", "rs"], ["Comissão e tarifas do marketplace", "DreComissao", "rs"], ["Imposto", "DreImposto", "rs"], ["Custo dos produtos (CMV)", "DreCmv", "rs"],
    ["Frete", "DreFrete", "rs"], ["Devoluções", "DreDevolucao", "rs"], ["Margem de contribuição", "DreMc", "rs"], ["Ads descontado da margem", "AdsNaMargem", "rs"], ["Margem para a comissão", "DreMargem", "rs"], [],
    ["Meta de faturamento", "Faturamento_obj", "rs"], ["Faturamento realizado", "Faturamento_real", "rs"], ["Pontos do faturamento", "Faturamento_bonus", "n2"],
    ["Meta de MC", "MC_obj", "pct"], ["MC realizada", "MC_real", "pct"], ["Pontos da MC", "MC_bonus", "n2"], ["Meta de TACOS", "TACOS_obj", "pct"], ["TACOS realizado", "TACOS_real", "pct"],
    ["Pontos do TACOS", "TACOS_bonus", "n2"], ["Meta de Ads", "Ads_obj", "rs"], ["Ads realizado", "Ads_real", "rs"], ["Pontos do Ads", "Ads_bonus", "n2"], [],
    ["Progresso das metas", "Progresso", "pct"], ["Teto do bônus", "Teto", "pct"], ["Bônus final (%)", "BonusFinal_pct", "pct"], ["Bônus final (R$)", "BonusFinal_rs", "rs"]];
  const D = [["DRE da comissão — " + op], ["Mês inteiro, como no fechamento da comissão (não é cortado pelo período do relatório)."], [], ["Linha", ...dets.map(d => d.mes)]], CD = [], tD = [3];
  ROT.forEach(r => { D.push(r.length ? [r[0], ...dets.map(d => { const v = d[r[1]]; return v !== "" && v != null && Number.isFinite(Number(v)) ? Number(v) : S(v); })] : []); if (r[2]) dets.forEach((_, j) => CD.push([D.length - 1, 1 + j, r[2]])); });
  D.push([], ["Situação", ...dets.map(d => { const c = (Array.isArray(com) ? com : []).find(x => x.mes === d.mes && x.operacao === op) || {};
    return c.fechado_em ? `Fechado em ${br(S(c.fechado_em).slice(0, 10))}${c.paga === "sim" ? "" : " (operação sem comissão paga)"}` : `Aberto · ${nn(c.liquidado_pct) == null ? "—" : c.liquidado_pct + "% liquidado"}`; })]);
  if (!dets.length) D.push(["Sem fechamento de comissão para os meses do período."]);
  const tDb = [7, 9].map(i => 4 + i);   // Margem de contribuição e Margem para a comissão em negrito
  specs.push({ nome: "DRE da comissão", linhas: D, celulas: CD, larguras: [38, ...dets.map(() => 18)], titulo: tD, negrito: tDb, capa: true });

  // 12) COMO LER
  specs.push({ nome: "Como ler", linhas: [["Termo", "O que significa"],
    ["Faturamento", "Receita das vendas (status Venda). Cancelamentos e devoluções ficam de fora e aparecem nas abas próprias."],
    ["MC antes do Ads", "Margem de contribuição na base da comissão: receita − comissão/tarifas/frete − imposto − custo do produto."],
    ["MC depois do Ads", "MC antes do Ads − investimento em Ads da operação, distribuído pelos dias e anúncios. É o que de fato sobrou."],
    ["TACOS", "Ads ÷ faturamento: quanto da venda total foi gasto em publicidade."],
    ["ACOS / ROAS", "ACOS = investimento ÷ receita vinda do Ads. ROAS = receita do Ads ÷ investimento (o inverso)."],
    ["Devolução finalizada", "O marketplace já concluiu a devolução e estornou o valor. É perda real."],
    ["Devolução/reclamação em andamento", "Ainda aberta: o dinheiro fica retido até o marketplace decidir. Pode virar devolução ou voltar a ser venda."],
    ["Curva (Fat·Un·MC)", "Três letras: curva ABC (80% / 95%) por faturamento, por unidades e por MC depois do Ads. N = sem valor positivo."],
    ["Quadrante", "Estrela = vende acima da mediana com margem acima da média · Margem baixa = vende muito, margem baixa · Nicho = vende pouco, margem boa · Revisar = vende pouco, margem baixa."],
    [SEM_CUSTO, "O produto vendeu sem custo cadastrado: a margem dele aparece maior do que é até o custo ser lançado."],
    ["Ads por anúncio", "O investimento do marketplace chega por mês: a aba traz os meses que o período toca."],
    ["Tarefas", "Pendências abertas para os anúncios desta operação, com o que fazer em cada uma."],
    ["DRE da comissão", "Mês inteiro, igual ao fechamento da comissão. Mês em aberto muda até as vendas liquidarem."]],
    larguras: [34, 125], filtro: false });

  return { specs, per, op, totais: { fat, ped, un, mcPre, adsTot, mcPos, cancelados: G.cancelada.length, devFinalizadas: G.devolvida.length, devAndamento: G.andamento.length, vendas: G.venda.length, tarefas: tarefas.length } };
}

// ---------- escrita do Excel ----------
const FMT = { rs: '"R$" #,##0.00', pct: "0.0%", int: "#,##0", n2: "#,##0.00" };
const AZUL = "1F3864", CINZA = "D9E1F2", VERMELHO = "C00000", AMARELO = "FFF2CC";
async function escrever(specs) {
  const wb = await XP.fromFileAsync(MODELO);
  const metas = wb.sheet("Metas");
  const ordem = specs.map(s => s.nome);
  for (const sp of specs) {
    const sh = sp.modelo ? metas : wb.addSheet(sp.nome);
    const L = sp.linhas, cab = sp.capa ? -1 : 0, H = cab >= 0 ? L[0] : [];
    if (sp.modelo) sh.range("A1:J32").value(null);   // o modelo vem com zeros de exemplo nas linhas 1..32
    L.forEach((row, r) => row.forEach((v, c) => { if (v === null || v === undefined || v === "") return; sh.cell(r + 1, c + 1).value(v); }));
    // formatos por coluna (cabeçalho) e por célula
    if (cab >= 0) H.forEach((h, c) => { const f = sp.formatos && sp.formatos[h]; if (f && L.length > 1) sh.range(2, c + 1, L.length, c + 1).style("numberFormat", FMT[f] || f); });
    (sp.celulas || []).forEach(([r, c, f]) => { if (f) sh.cell(r + 1, c + 1).style("numberFormat", FMT[f] || f); });
    // negativo em vermelho
    (sp.vermelho || []).forEach(h => { const c = H.indexOf(h); if (c < 0) return; for (let r = 1; r < L.length; r++) if (typeof L[r][c] === "number" && L[r][c] < 0) sh.cell(r + 1, c + 1).style({ fontColor: VERMELHO, bold: true }); });
    // texto de alerta (ex.: "Precisa preencher o custo")
    (sp.alerta || []).forEach(h => { const c = H.indexOf(h); if (c < 0) return; for (let r = 1; r < L.length; r++) if (typeof L[r][c] === "string" && L[r][c]) sh.cell(r + 1, c + 1).style({ fill: AMARELO, fontColor: VERMELHO, bold: true }); });
    // cabeçalho
    if (cab >= 0 && H.length) { sh.range(1, 1, 1, H.length).style({ bold: true, fill: AZUL, fontColor: "FFFFFF", wrapText: true, verticalAlignment: "center" }); sh.row(1).height(32);
      try { sh.freezePanes(sp.nome === "Metas" || sp.nome === "Resultados diários" ? 1 : 0, 1); } catch (e) { }
      if (sp.filtro !== false && L.length > 1) { try { sh.autoFilter(sh.range(1, 1, L.length, H.length)); } catch (e) { } } }
    if (sp.total) sh.range(L.length, 1, L.length, H.length).style({ bold: true, fill: CINZA });
    // colunas para o gestor preencher (aba Tarefas): amarelo, lista fechada na ação, coluna do ID escondida
    if (sp.preencher) { const P = sp.preencher;
      P.linhas.forEach(r => P.colunas.forEach(c => sh.cell(r + 1, c + 1).style({ fill: AMARELO, border: true })));
      P.colunas.forEach(c => sh.cell(1, c + 1).style({ fill: "BF8F00" }));
      P.linhas.forEach(r => { try { sh.cell(r + 1, P.lista + 1).dataValidation({ type: "list", allowBlank: true, showErrorMessage: true, error: "Escolha uma opção da lista.", formula1: '"' + ACOES_PLANILHA.join(",") + '"' }); } catch (e) { } });
      sh.column(P.oculta + 1).hidden(true); }
    // linhas de título dentro da aba (negativo = linha de aviso)
    (sp.titulo || []).forEach(t => { const r = Math.abs(t) + 1, w = Math.max(3, (L[Math.abs(t)] || []).length);
      if (t < 0) sh.range(r, 1, r, w).style({ bold: true, fontColor: VERMELHO }); else sh.range(r, 1, r, w).style({ bold: true, fill: AZUL, fontColor: "FFFFFF" }); });
    (sp.negrito || []).forEach(r => sh.row(r + 1).style("bold", true));
    if (sp.capa) { sh.cell(1, 1).style({ bold: true, fontSize: 15, fontColor: AZUL }); sh.cell(2, 1).style({ italic: true }); }
    (sp.larguras || []).forEach((w, i) => sh.column(i + 1).width(w));
    if (cab >= 0) H.forEach((h, i) => { if (!(sp.larguras || [])[i]) sh.column(i + 1).width(Math.min(45, Math.max(10, S(h).length + 3))); });
  }
  ordem.forEach((n, i) => wb.moveSheet(n, i));
  const old = wb.sheet("Sheet") || wb.sheet("Sheet1"); if (old && wb.sheets().length > 1 && !ordem.includes(old.name())) wb.deleteSheet(old);
  wb.activeSheet("Resumo");
  // gráficos do modelo apontam para as linhas 2..32: ajusta para o número real de dias e usa a data (texto) como categoria
  const ultimaLinha = specs.find(s => s.modelo).linhas.length;
  const zip = await JSZip.loadAsync(await wb.outputAsync());
  for (const f of Object.keys(zip.files).filter(f => /^xl\/charts\/chart\d+\.xml$/.test(f))) {
    let x = await zip.file(f).async("string");
    x = x.replace(/\$32<\/f>/g, "$" + ultimaLinha + "</f>").replace(/<cat><numRef><f>([^<]*)<\/f><\/numRef><\/cat>/g, "<cat><strRef><f>$1</f></strRef></cat>");
    zip.file(f, x);
  }
  await ACAB.corrigirZip(zip);   // pane/selection, ="undefined" da lista, <fill/> vazio (xlsx-acabamento.js)
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

async function gerarArquivo(params) { const r = await gerar(params); return { ...r, buffer: await escrever(r.specs) }; }
const nomeArquivo = r => `Gerencial_${r.op.replace(/ · /g, "_").replace(/[^\w]+/g, "")}_${r.per.de}_a_${r.per.ate}.xlsx`;
module.exports = { gerar, gerarArquivo, periodo, nomeArquivo };

if (require.main === module) {
  const arg = k => { const a = process.argv.find(x => x.startsWith("--" + k + "=")); return a ? a.split("=").slice(1).join("=") : null; };
  (async () => {
    const r = await gerarArquivo({ emp: arg("emp"), mkt: arg("mkt"), mes: arg("mes") });
    const dir = path.join(__dirname, "SAIDA", "Relatorios"); fs.mkdirSync(dir, { recursive: true });
    const arq = path.join(dir, nomeArquivo(r)); fs.writeFileSync(arq, r.buffer);
    console.log(`${r.op} · ${r.per.de} a ${r.per.ate}${r.per.parcial ? " (parcial)" : ""}`); console.log(JSON.stringify(r.totais)); console.log(arq);
    process.exit(0);
  })().catch(e => { console.error("ERRO:", e.stack || e.message); process.exit(1); });
}
