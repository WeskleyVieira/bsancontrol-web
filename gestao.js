'use strict';
// gestao.js — Financeiro da Direção (01/11/2026): carteira dos gestores, regras de comissão, custos recorrentes e
// fechamento por operação. Tudo vale "a partir do mês" (vigência mensal): trocar no meio do mês partiria tarefas,
// histórico e comissão entre dois responsáveis (Weskley, 01/11/2026).
//   · carteira: um responsável por operação; a linha com o maior `desde` ≤ mês é a vigente.
//   · regra de comissão por operação: paga (sim/não), teto %, regra (metas | % do lucro líquido) e desde quando o
//     rateio do ponto entra no lucro. Bsan ML, Jowcase ML e Mary Kase ML: calculadas e exibidas, não pagas.
//   · custos recorrentes: fixo (mesmo valor até mudar), variável (estimado pelo último valor confirmado até confirmar a
//     conta do mês) e pontual. O mês confirmado guarda o valor real. "É comissão" = a própria comissão paga (ex.: parceria
//     da Maressa): fica fora do lucro da regra de 10% e do pacote da DRE, para não contar duas vezes.
//   · fechar: o painel só ENFILEIRA (tabela comandos); o PC fecha (fila-comandos.js → comissao.js --fechar).
const MES = /^\d{4}-(0[1-9]|1[0-2])$/;
const EMP_PONTO = { 'Bsan Shop': 'Ponto 1', 'Jowcase': 'Ponto 1', 'Mary Kase': 'Ponto 1', 'Pesseguinho Store': 'Ponto 1', 'Powerfull Imports': 'Ponto 2', 'Powerfull Filial': 'Ponto 2' };
const COMPARTILHADO = { 'Ponto 1 (compartilhado)': 'Ponto 1', 'Ponto 2 (compartilhado)': 'Ponto 2' };
const BOX = 'Box Wyl';
const EMPRESAS_CUSTO = [...Object.keys(EMP_PONTO), ...Object.keys(COMPARTILHADO), BOX];
const TIPOS_CUSTO = ['fixo', 'variavel', 'pontual'];
const S = v => String(v == null ? '' : v).trim();
// vazio NÃO é zero: Number(null) = 0 zerava o teto da regra (e o bônus) de quem não tem teto próprio
const num = v => { if (v === null || v === undefined || String(v).trim() === '') return null; const x = Number(v); return Number.isFinite(x) ? x : null; };
const r2 = v => Math.round((+v || 0) * 100) / 100;
const falha = (status, erro) => Object.assign(new Error(erro), { status });

async function schema(dbx) {
  await dbx.exec(`CREATE TABLE IF NOT EXISTS gestao_carteira (desde TEXT NOT NULL, empresa TEXT NOT NULL, marketplace TEXT NOT NULL, gestor TEXT,
      por TEXT, em TEXT, PRIMARY KEY (desde, empresa, marketplace));
    CREATE TABLE IF NOT EXISTS gestao_regra (desde TEXT NOT NULL, operacao TEXT NOT NULL, paga INTEGER, teto REAL, regra TEXT, pct_lucro REAL,
      rateio_desde TEXT, por TEXT, em TEXT, PRIMARY KEY (desde, operacao));
    CREATE TABLE IF NOT EXISTS gestao_custo (id TEXT PRIMARY KEY, descricao TEXT, empresa TEXT, categoria TEXT, tipo TEXT, valor REAL, dia INTEGER,
      desde TEXT, ate TEXT, comissao INTEGER, por TEXT, em TEXT);
    CREATE TABLE IF NOT EXISTS gestao_custo_mes (mes TEXT NOT NULL, custo_id TEXT NOT NULL, valor REAL, por TEXT, em TEXT, PRIMARY KEY (mes, custo_id));`);
}

// ── vigência ────────────────────────────────────────────────────────────────────────────────────────────
// para cada chave, a linha com o maior `desde` que não passa do mês
function vigentes(rows, mes, chave) {
  const out = {};
  for (const r of rows) { if (!r.desde || r.desde > mes) continue; const k = chave(r); if (!out[k] || out[k].desde < r.desde) out[k] = r; }
  return out;
}
const carteiraDoMes = (rows, mes) => { const v = vigentes(rows, mes, r => r.empresa + '|' + r.marketplace); const o = {}; for (const [k, r] of Object.entries(v)) if (S(r.gestor)) o[k] = S(r.gestor); return o; };
const regrasDoMes = (rows, mes) => vigentes(rows, mes, r => r.operacao);

// valor de cada custo ativo no mês. Confirmado (o mês guardado) > fixo (cadastro) > variável estimado pelo último confirmado.
function custosDoMes(itens, instancias, mes) {
  const conf = {}; for (const i of instancias) (conf[i.custo_id] = conf[i.custo_id] || []).push(i);
  const out = [];
  for (const c of itens) {
    if (!c.desde || c.desde > mes || (c.ate && c.ate < mes)) continue;
    const doMes = (conf[c.id] || []).find(i => i.mes === mes);
    if (c.tipo === 'pontual' && !doMes && c.desde !== mes) continue;
    let valor, status;
    if (doMes) { valor = +doMes.valor; status = 'confirmado'; }
    else if (c.tipo === 'variavel') { const ant = (conf[c.id] || []).filter(i => i.mes < mes).sort((a, b) => a.mes < b.mes ? 1 : -1)[0]; valor = ant ? +ant.valor : +c.valor; status = 'estimado'; }
    else { valor = +c.valor; status = 'fixo'; }
    out.push({ ...c, comissao: !!+c.comissao, valor_mes: r2(valor), status });
  }
  return out;
}

// pacote da DRE (formato do lançamento "custos"): substitui os meses gerados, mantém os demais, o rateio, o investimento
// e o faturamento do Box Wyl. Custo marcado como comissão fica de fora.
function pacoteDRE(atual, porMes) {
  const base = atual && typeof atual === 'object' ? atual : {};
  const meses = new Set(Object.keys(porMes));
  const custos = (base.custos || []).filter(r => !meses.has(r.mes));
  const box = new Map((base.boxwyl || []).map(r => [r.mes, { ...r }]));
  for (const [mes, lista] of Object.entries(porMes)) {
    let boxTot = 0;
    for (const c of lista) {
      if (c.comissao || !(c.valor_mes > 0)) continue;
      if (c.empresa === BOX) { boxTot += c.valor_mes; continue; }
      const ponto = COMPARTILHADO[c.empresa] || EMP_PONTO[c.empresa]; if (!ponto) continue;
      custos.push({ mes, ponto, emp: COMPARTILHADO[c.empresa] ? '' : c.empresa, tipo: COMPARTILHADO[c.empresa] ? 'compartilhado' : 'direto', valor: c.valor_mes, descricao: c.descricao, categoria: c.categoria || '' });
    }
    const b = box.get(mes) || { mes, fat: 0, custos: 0 }; b.custos = r2(boxTot); box.set(mes, b);
  }
  custos.sort((a, b) => a.mes < b.mes ? -1 : a.mes > b.mes ? 1 : 0);
  return { rateio: base.rateio || { 'Ponto 1': { 'Bsan Shop': 0.45, 'Jowcase': 0.45, 'Mary Kase': 0.05, 'Pesseguinho Store': 0.05 }, 'Ponto 2': { 'Powerfull Imports': 1, 'Powerfull Filial': 0 } },
    custos, investimento: base.investimento || [], boxwyl: [...box.values()].sort((a, b) => a.mes < b.mes ? -1 : 1) };
}

// custos da EMPRESA no mês para a regra "% do lucro líquido": diretos (sem os marcados como comissão) + parte do
// compartilhado do ponto pelo rateio, quando o mês já passou do rateio_desde da regra.
function custosEmpresa(lista, empresa, rateio, comRateio) {
  const ponto = EMP_PONTO[empresa]; let diretos = 0, comp = 0;
  for (const c of lista) { if (c.comissao) continue; if (c.empresa === empresa) diretos += c.valor_mes; else if (COMPARTILHADO[c.empresa] === ponto) comp += c.valor_mes; }
  const parte = comRateio && rateio && rateio[ponto] ? (+rateio[ponto][empresa] || 0) * comp : 0;
  return { diretos: r2(diretos), rateio: r2(parte), total: r2(diretos + parte) };
}

// exportação para o pipeline (comissao.js lê SAIDA/_config/gestao.json; o db-sync aplica a carteira)
async function exportar(dbx, meses) {
  await schema(dbx);
  const [cart, regras, itens, inst, pac] = await Promise.all([dbx.all('SELECT * FROM gestao_carteira'), dbx.all('SELECT * FROM gestao_regra'),
    dbx.all('SELECT * FROM gestao_custo'), dbx.all('SELECT * FROM gestao_custo_mes'), dbx.get("SELECT json FROM datasets WHERE nome='custos'")]);
  let rateio = null; try { rateio = JSON.parse(pac.json).rateio; } catch (e) { }
  const out = { gerado: new Date().toISOString(), meses: {} };
  for (const mes of meses) {
    const lista = custosDoMes(itens, inst, mes), R = regrasDoMes(regras, mes), regrasMes = {};
    for (const [op, r] of Object.entries(R)) {
      const emp = op.split(' · ')[0], lucro = /lucro/i.test(S(r.regra));
      regrasMes[op] = { paga: r.paga == null ? null : !!+r.paga, teto: num(r.teto), regra: S(r.regra) || 'metas', pct_lucro: num(r.pct_lucro), desde: r.desde,
        custos_empresa: lucro && lista.length ? custosEmpresa(lista, emp, rateio, !!(r.rateio_desde && mes >= r.rateio_desde)) : null };
    }
    out.meses[mes] = { carteira: carteiraDoMes(cart, mes), regras: regrasMes, custos: lista.length };
  }
  return out;
}
async function aplicarCarteira(dbx, GESTOR, mes) {
  await schema(dbx);
  const c = carteiraDoMes(await dbx.all('SELECT * FROM gestao_carteira'), mes);
  for (const [k, g] of Object.entries(c)) GESTOR[k] = g;
  return Object.keys(c).length;
}
// sementes: a carteira atual (operacoes) vira a vigente desde jan/26; as regras conhecidas em 01/11/2026
async function semear(dbx) {
  await schema(dbx);
  const em = new Date().toISOString();
  if (!(+(await dbx.get('SELECT COUNT(*) n FROM gestao_carteira')).n)) {
    for (const o of await dbx.all('SELECT empresa, marketplace, gestor FROM operacoes')) if (S(o.gestor))
      await dbx.run('INSERT INTO gestao_carteira(desde,empresa,marketplace,gestor,por,em) VALUES(?,?,?,?,?,?) ON CONFLICT DO NOTHING', ['2026-01', o.empresa, o.marketplace, o.gestor, 'semente', em]);
  }
  if (!(+(await dbx.get('SELECT COUNT(*) n FROM gestao_regra')).n)) {
    for (const op of ['Bsan Shop · Mercado Livre', 'Jowcase · Mercado Livre', 'Mary Kase · Mercado Livre'])
      await dbx.run('INSERT INTO gestao_regra(desde,operacao,paga,regra,por,em) VALUES(?,?,?,?,?,?) ON CONFLICT DO NOTHING', ['2026-08', op, 0, 'metas', 'semente', em]);
    await dbx.run('INSERT INTO gestao_regra(desde,operacao,paga,regra,pct_lucro,rateio_desde,por,em) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING',
      ['2026-08', 'Pesseguinho Store · Mercado Livre', 1, 'lucro_liquido', 0.10, '2026-11', 'semente', em]);
  }
}

// ── HTTP ───────────────────────────────────────────────────────────────────────────────────────────────
function createHttp(dbx, { writeStore }) {
  const J = (res, obj, code = 200) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
  const corpo = req => new Promise(r => { let b = ''; req.on('data', c => { b += c; if (b.length > 2e6) req.destroy(); }); req.on('end', () => { try { r(JSON.parse(b || '{}')); } catch (e) { r({}); } }); });
  let pronto = null;
  const mesOk = v => { if (!MES.test(S(v))) throw falha(400, 'Informe o mês no formato AAAA-MM.'); return S(v); };
  const quem = user => S(user.email || user.nome);
  async function estado(mes) {
    const [ops, cart, regras, usuarios, com, cmds] = await Promise.all([dbx.all('SELECT empresa, marketplace, gestor FROM operacoes ORDER BY empresa, marketplace'),
      dbx.all('SELECT * FROM gestao_carteira ORDER BY desde DESC'), dbx.all('SELECT * FROM gestao_regra'),
      dbx.all("SELECT nome, gestor_ref FROM usuarios WHERE perfil='gestor' AND ativo=1"), dbx.get("SELECT json, atualizado FROM datasets WHERE nome='comissao'"),
      dbx.all("SELECT id, criado_em, pedido_por, demanda_id, anuncio, estado, resultado, atualizado_em FROM comandos WHERE tipo='fechar_comissao' ORDER BY criado_em DESC LIMIT 20").catch(() => [])]);
    const C = carteiraDoMes(cart, mes), R = regrasDoMes(regras, mes);
    let linhas = []; try { linhas = JSON.parse(com.json).filter(r => r.mes === mes); } catch (e) { }
    const nomes = new Set([...usuarios.map(u => S(u.gestor_ref)).filter(Boolean), ...cart.map(r => S(r.gestor)).filter(Boolean), ...ops.map(o => S(o.gestor)).filter(Boolean)]);
    const chaves = new Set([...ops.map(o => o.empresa + '|' + o.marketplace), ...cart.map(r => r.empresa + '|' + r.marketplace), ...linhas.map(l => l.operacao.replace(' · ', '|'))]);
    const operacoes = [...chaves].sort().map(k => { const [empresa, marketplace] = k.split('|'), op = empresa + ' · ' + marketplace, r = R[op] || null;
      return { operacao: op, empresa, marketplace, gestor: C[k] || null, regra: r ? { desde: r.desde, paga: r.paga == null ? null : !!+r.paga, teto: num(r.teto), regra: S(r.regra) || 'metas', pct_lucro: num(r.pct_lucro), rateio_desde: S(r.rateio_desde) || null } : null,
        comissao: linhas.find(l => l.operacao === op) || null }; });
    return { ok: true, mes, operacoes, gestores: [...nomes].sort(), historico: cart.slice(0, 60), comissao_atualizada: com ? com.atualizado : null, fechamentos: cmds };
  }
  async function custos(mes) {
    const [itens, inst] = await Promise.all([dbx.all('SELECT * FROM gestao_custo ORDER BY empresa, categoria, descricao'), dbx.all('SELECT * FROM gestao_custo_mes')]);
    return { ok: true, mes, itens: custosDoMes(itens, inst, mes), cadastro: itens, empresas: EMPRESAS_CUSTO, tipos: TIPOS_CUSTO };
  }
  return async function (req, res, u, user) {
    if (!u.pathname.startsWith('/api/gestao/')) return false;
    try {
      if (!user || user.perfil !== 'direcao') return J(res, { ok: false, erro: 'Somente a Direção acessa o fechamento, os custos e as carteiras.' }, 403), true;
      if (!pronto) pronto = semear(dbx); await pronto;
      const q = Object.fromEntries(u.searchParams), em = new Date().toISOString();
      if (req.method === 'GET' && u.pathname === '/api/gestao/estado') return J(res, await estado(mesOk(q.mes))), true;
      if (req.method === 'GET' && u.pathname === '/api/gestao/custos') return J(res, await custos(mesOk(q.mes))), true;
      if (req.method !== 'POST') return J(res, { ok: false, erro: 'Rota não encontrada.' }, 404), true;
      const b = await corpo(req);
      if (u.pathname === '/api/gestao/carteira') {
        const desde = mesOk(b.desde), empresa = S(b.empresa), marketplace = S(b.marketplace), gestor = S(b.gestor);
        if (!empresa || !marketplace) throw falha(400, 'Informe a operação.');
        await dbx.run('INSERT INTO gestao_carteira(desde,empresa,marketplace,gestor,por,em) VALUES(?,?,?,?,?,?) ON CONFLICT(desde,empresa,marketplace) DO UPDATE SET gestor=EXCLUDED.gestor, por=EXCLUDED.por, em=EXCLUDED.em',
          [desde, empresa, marketplace, gestor || null, quem(user), em]);
        return J(res, await estado(desde)), true;
      }
      if (u.pathname === '/api/gestao/regra') {
        const desde = mesOk(b.desde), operacao = S(b.operacao); if (!/ · /.test(operacao)) throw falha(400, 'Informe a operação.');
        const regra = /lucro/i.test(S(b.regra)) ? 'lucro_liquido' : 'metas', teto = b.teto === '' || b.teto == null ? null : num(b.teto), pct = b.pct_lucro === '' || b.pct_lucro == null ? null : num(b.pct_lucro);
        if (teto != null && (teto < 0 || teto > 0.5)) throw falha(400, 'Use o teto como fração (3,333% = 0,03333).');
        if (regra === 'lucro_liquido' && !(pct > 0 && pct <= 1)) throw falha(400, 'Informe o percentual do lucro como fração (10% = 0,10).');
        const rd = S(b.rateio_desde); if (rd && !MES.test(rd)) throw falha(400, 'Informe o início do rateio no formato AAAA-MM.');
        await dbx.run('INSERT INTO gestao_regra(desde,operacao,paga,teto,regra,pct_lucro,rateio_desde,por,em) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(desde,operacao) DO UPDATE SET paga=EXCLUDED.paga, teto=EXCLUDED.teto, regra=EXCLUDED.regra, pct_lucro=EXCLUDED.pct_lucro, rateio_desde=EXCLUDED.rateio_desde, por=EXCLUDED.por, em=EXCLUDED.em',
          [desde, operacao, b.paga === false || b.paga === 0 || b.paga === '0' ? 0 : 1, teto, regra, regra === 'lucro_liquido' ? pct : null, rd || null, quem(user), em]);
        return J(res, await estado(desde)), true;
      }
      if (u.pathname === '/api/gestao/custo') {
        const desc = S(b.descricao), empresa = S(b.empresa), tipo = S(b.tipo), valor = num(b.valor), desde = mesOk(b.desde), ate = S(b.ate);
        if (!desc || desc.length > 160) throw falha(400, 'Informe a descrição (até 160 caracteres).');
        if (!EMPRESAS_CUSTO.includes(empresa)) throw falha(400, 'Escolha a empresa ou o ponto do custo.');
        if (!TIPOS_CUSTO.includes(tipo)) throw falha(400, 'O custo é fixo, variável ou pontual.');
        if (!(valor >= 0)) throw falha(400, 'Informe um valor maior ou igual a zero.');
        if (ate && (!MES.test(ate) || ate < desde)) throw falha(400, 'O fim precisa ser um mês igual ou depois do início.');
        const id = S(b.id) || 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        await dbx.run('INSERT INTO gestao_custo(id,descricao,empresa,categoria,tipo,valor,dia,desde,ate,comissao,por,em) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET descricao=EXCLUDED.descricao, empresa=EXCLUDED.empresa, categoria=EXCLUDED.categoria, tipo=EXCLUDED.tipo, valor=EXCLUDED.valor, dia=EXCLUDED.dia, desde=EXCLUDED.desde, ate=EXCLUDED.ate, comissao=EXCLUDED.comissao, por=EXCLUDED.por, em=EXCLUDED.em',
          [id, desc, empresa, S(b.categoria).slice(0, 60), tipo, valor, num(b.dia) || null, desde, ate || null, b.comissao ? 1 : 0, quem(user), em]);
        return J(res, await custos(mesOk(b.mes || desde))), true;
      }
      if (u.pathname === '/api/gestao/custo-mes') {
        const mes = mesOk(b.mes), id = S(b.custo_id);
        if (!(await dbx.get('SELECT 1 ok FROM gestao_custo WHERE id=?', [id]))) throw falha(404, 'Custo não encontrado.');
        if (b.valor === null || b.valor === '') await dbx.run('DELETE FROM gestao_custo_mes WHERE mes=? AND custo_id=?', [mes, id]);
        else { const v = num(b.valor); if (!(v >= 0)) throw falha(400, 'Informe um valor maior ou igual a zero.');
          await dbx.run('INSERT INTO gestao_custo_mes(mes,custo_id,valor,por,em) VALUES(?,?,?,?,?) ON CONFLICT(mes,custo_id) DO UPDATE SET valor=EXCLUDED.valor, por=EXCLUDED.por, em=EXCLUDED.em', [mes, id, v, quem(user), em]); }
        return J(res, await custos(mes)), true;
      }
      if (u.pathname === '/api/gestao/custos-dre') {
        const de = mesOk(b.de), ate = mesOk(b.ate); if (ate < de) throw falha(400, 'O mês final vem depois do inicial.');
        const [itens, inst] = await Promise.all([dbx.all('SELECT * FROM gestao_custo'), dbx.all('SELECT * FROM gestao_custo_mes')]);
        const porMes = {}; for (let m = de; m <= ate;) { porMes[m] = custosDoMes(itens, inst, m); const [y, mm] = m.split('-').map(Number); m = mm === 12 ? (y + 1) + '-01' : y + '-' + String(mm + 1).padStart(2, '0'); }
        const atual = await writeStore.ler(dbx, 'custos', user);
        const salvo = await writeStore.gravar(dbx, 'custos', pacoteDRE(atual.dados, porMes), atual.versao, user);
        return J(res, { ...salvo, meses: Object.keys(porMes) }), true;
      }
      if (u.pathname === '/api/gestao/fechar') {
        const mes = mesOk(b.mes), ops = (Array.isArray(b.operacoes) ? b.operacoes : []).map(S).filter(o => / · /.test(o) && o.length < 80);
        if (!ops.length) throw falha(400, 'Escolha as operações a fechar.');
        await dbx.exec(`CREATE TABLE IF NOT EXISTS comandos (id TEXT PRIMARY KEY, criado_em TEXT, pedido_por TEXT, perfil TEXT, gestor TEXT, tipo TEXT,
          demanda_id TEXT, empresa TEXT, anuncio TEXT, estado TEXT, resultado TEXT, atualizado_em TEXT)`);
        const id = 'fc-' + Date.now().toString(36);
        await dbx.run('INSERT INTO comandos(id,criado_em,pedido_por,perfil,gestor,tipo,demanda_id,empresa,anuncio,estado,resultado,atualizado_em) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
          [id, em, quem(user), user.perfil, '', 'fechar_comissao', 'comissao|' + mes, '', ops.join('\n'), 'pendente', 'na fila: o PC fecha em até 15 minutos', em]);
        return J(res, await estado(mes)), true;
      }
      return J(res, { ok: false, erro: 'Rota não encontrada.' }, 404), true;
    } catch (e) { return J(res, { ok: false, erro: e.status ? e.message : 'Não foi possível concluir. Nada foi alterado.' }, e.status || 500), true; }
  };
}

module.exports = { createHttp, schema, semear, exportar, aplicarCarteira, carteiraDoMes, regrasDoMes, custosDoMes, pacoteDRE, custosEmpresa, EMP_PONTO, EMPRESAS_CUSTO };
