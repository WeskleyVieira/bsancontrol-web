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
    const like = "%" + busca + "%";
    w.push("(LOWER(COALESCE(sku,'')) LIKE ? OR LOWER(COALESCE(titulo,'')) LIKE ? OR LOWER(COALESCE(pedido,'')) LIKE ? OR LOWER(COALESCE(anuncio_id,'')) LIKE ?)");
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
module.exports = { consultaVendas };
