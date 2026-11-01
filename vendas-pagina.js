// Página de vendas: o filtro da tabela e o KPI saem da mesma cláusula.
const ORDEM = {
  date: "data", ped: "pedido", emp: "empresa", mkt: "canal", anuncio: "anuncio_id",
  sku: "sku", tit: "titulo", qtd: "qtd", stat: "status",
  fat: "COALESCE(receita_n,receita)", liq: "COALESCE(liquido_n,liquido)", mc: "COALESCE(mc_comissao_n,mc_comissao)",
  mcp: "CASE WHEN LOWER(canal) LIKE '%temu%' THEN CASE WHEN COALESCE(liquido_n,liquido)=0 THEN 0 ELSE COALESCE(mc_comissao_n,mc_comissao)/COALESCE(liquido_n,liquido) END ELSE CASE WHEN COALESCE(receita_n,receita)=0 THEN 0 ELSE COALESCE(mc_comissao_n,mc_comissao)/COALESCE(receita_n,receita) END END"
};
function consultaVendas(q) {
  const p = q || {};
  const w = ["data>=?", "data<=?"];
  const args = [p.de || "0000-00-00", p.ate || "9999-99-99"];
  if (p.emp) { w.push("empresa=?"); args.push(p.emp); }
  if (p.mkt) { w.push("canal=?"); args.push(p.mkt); }
  if (p.ponto) { w.push("ponto=?"); args.push(p.ponto); }
  const busca = String(p.q || "").trim().toLowerCase();
  if (busca) {
    const like = "%" + busca.replace(/[!%_]/g, "!$&") + "%";
    w.push("(LOWER(COALESCE(sku,'')) LIKE ? ESCAPE '!' OR LOWER(COALESCE(titulo,'')) LIKE ? ESCAPE '!' OR LOWER(COALESCE(pedido,'')) LIKE ? ESCAPE '!' OR LOWER(COALESCE(anuncio_id,'')) LIKE ? ESCAPE '!')");
    args.push(like, like, like, like);
  }
  if (String(p.neg) === "1") w.push("COALESCE(mc_comissao_n,mc_comissao) < 0");
  const base = w.join(" AND "), baseArgs = args.slice();
  if (p.status === "finalizadas") w.push("(status='venda' OR status='venda_com_troca')");
  else if (p.status) { w.push("status=?"); args.push(p.status); }
  const limite = Math.max(1, Math.min(50, parseInt(p.limite || "50", 10) || 50));
  const pagina = Math.max(0, parseInt(p.pagina || "0", 10) || 0);
  const col = ORDEM[p.sort] || "data";
  const dir = String(p.dir) === "1" ? "ASC" : "DESC";
  return { where: w.join(" AND "), args, base, baseArgs, order: col + " " + dir + ", id ASC", limite, offset: pagina * limite, pagina };
}
function resumoVendasSQL(c){
  const numeric=k=>`CAST(COALESCE(${k}_n,CAST(${k} AS NUMERIC)) AS DOUBLE PRECISION)`,fat=numeric('receita'),mc=numeric('mc_comissao'),liq=numeric('liquido'),ctp=numeric('ctp'),final="status IN ('venda','venda_com_troca')",fonte="LOWER(COALESCE(fonte_liquido,''))",prov=`(${fonte} LIKE '%provis%ri%' OR ${fonte} LIKE '%estimativa%' OR ${fonte} LIKE '%pendente%' OR ${fonte} LIKE '%estimado%' OR ${fonte} LIKE '%incompleto%')`,sum=(expr,condition=final)=>`SUM(CASE WHEN ${condition} THEN ${expr} ELSE 0 END)`;
  return{sql:`SELECT COUNT(*) AS linhas, ${sum('1')} AS finalizadas, ${sum('qtd')} AS unidades, ${sum(fat)} AS faturamento, ${sum(mc)} AS margem, ${sum(`CASE WHEN LOWER(canal) LIKE '%temu%' THEN ${liq} ELSE ${fat} END`)} AS base, ${sum(ctp)} AS ctp, ${sum('1',`${final} AND ${mc}<0`)} AS negativas, ${sum(mc,`${final} AND ${mc}<0`)} AS "margemNegativa", ${sum('1',`${final} AND ${prov}`)} AS provisorias, ${sum(liq,`${final} AND ${prov}`)} AS "liquidoProvisorio", ${sum('1',`${final} AND TRIM(COALESCE(fonte_liquido,''))=''`)} AS "semFonte" FROM vendas WHERE ${c.where}`,args:c.args};
}
module.exports = { consultaVendas, resumoVendasSQL };
