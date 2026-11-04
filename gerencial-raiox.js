// Consulta compacta do SKU: período independente, carteira validada no servidor.
const M = require('./visual/gerencial-modelo');
function erro(message) { const e = Error(message); e.status = 400; return e; }
function consulta(q = {}, user) {
  const valid = v => /^\d{4}-\d{2}-\d{2}$/.test(v || '') && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v;
  if (!valid(q.de) || !valid(q.ate) || q.de > q.ate) throw erro('Informe um período válido para o Raio-X.');
  if ((Date.parse(q.ate) - Date.parse(q.de)) / 86400000 > 1098) throw erro('Consulte até três anos por vez.');
  const sku = String(q.sku || '').trim();
  if (!sku || sku.length > 200) throw erro('Informe o SKU exato do produto.');
  const w = ['v.data>=?', 'v.data<=?'], args = [q.de, q.ate];
  for (const [key,col] of [['ponto','ponto'],['emp','empresa'],['mkt','canal']]) if (q[key]) { w.push('v.' + col + '=?'); args.push(String(q[key])); }
  if (user?.perfil === 'gestor') {
    w.push('EXISTS (SELECT 1 FROM operacoes o WHERE o.empresa=v.empresa AND o.marketplace=v.canal AND o.gestor=?)');
    args.push(user.gestor_ref || '');
    if (!user.gestor_ref) w.push('1=0');
  }
  const V = k => `CAST(COALESCE(v.${k}_n,CAST(NULLIF(TRIM(CAST(v.${k} AS TEXT)),'') AS NUMERIC),0) AS DOUBLE PRECISION)`, fin = "v.status IN ('venda','venda_com_troca')", sum = x => `SUM(CASE WHEN ${fin} THEN ${x} ELSE 0 END)`;
  const fields = `${sum('v.qtd')} AS qtd, ${sum(V('receita'))} AS fat, ${sum(V('liquido'))} AS liq, ${sum(V('mc_comissao'))} AS mc, ${sum(V('ctp'))} AS ctp,
    ${sum(`CASE WHEN LOWER(v.canal) LIKE '%temu%' THEN ${V('liquido')} ELSE ${V('receita')} END`)} AS base,
    ${sum('1')} AS n, SUM(CASE WHEN v.status='devolvida' THEN 1 ELSE 0 END) AS dev,
    ${sum(`CASE WHEN ${V('mc_comissao')}<0 THEN 1 ELSE 0 END`)} AS negativas`;
  const where = w.join(' AND ');
  return { sku, args,
    series: `SELECT v.data AS date,v.empresa AS emp,v.canal AS mkt,MAX(v.titulo) AS titulo,${fields} FROM vendas v WHERE ${where} AND v.sku=? GROUP BY v.data,v.empresa,v.canal ORDER BY v.data,v.empresa,v.canal`,
    peers: `SELECT v.sku,${fields} FROM vendas v WHERE ${where} AND TRIM(COALESCE(v.sku,''))<>'' GROUP BY v.sku`
  };
}
async function carregar(db, q, user) {
  const c = consulta(q,user);
  const [series, peers] = await Promise.all([db.all(c.series,c.args.concat(c.sku)),db.all(c.peers,c.args)]);
  const out = M.raiox(series,peers,c.sku);
  return { ...out, sku:c.sku, periodo:[q.de,q.ate], escopo:{ponto:q.ponto||'',emp:q.emp||'',mkt:q.mkt||'',carteira:user?.perfil==='gestor'} };
}
module.exports = {consulta,carregar};
