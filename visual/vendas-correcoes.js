'use strict';
function corrigirVendas(html){
 function patch(old,next){if(html.includes(next))return;if(!html.includes(old))throw Error('Contrato de Vendas mudou: '+old.slice(0,90));html=html.replace(old,next);}
 patch("if(tbl) tbl.innerHTML='<tbody><tr><td style=\"padding:30px;text-align:center;color:var(--t2)\">Não foi possível carregar as vendas.</td></tr></tbody>';","if(tbl) tbl.innerHTML='<tbody><tr><td style=\"padding:30px;text-align:center;color:var(--t2)\">Não foi possível carregar as vendas.</td></tr></tbody>'; if(typeof window.bcVendasFalha==='function')window.bcVendasFalha();");
 for(const name of ['exportVendasCSV','exportGerVendasCSV']){const start=html.indexOf('function '+name+'(){'),end=html.indexOf('\n}',start);if(start<0||end<0)throw Error('Exportador ausente: '+name);const part=html.slice(start,end).replaceAll('.toFixed(1)', '.toFixed(2)').replaceAll("new Date().toISOString().slice(0,10)","new Date().toLocaleDateString('sv-SE')");html=html.slice(0,start)+part+html.slice(end);}
 patch("if(c.k==='custop')return (r.fat-r.liq).toFixed(2);", "if(c.k==='custop')return (-(r.fat-r.liq)).toFixed(2);");
 patch("return r[c.k]!=null?r[c.k]:0; };", "return r[c.k]!=null&&r[c.k]!==''?r[c.k]:''; };");
 patch("const raw=+r[c.k]||0;\n      if(!raw){", "const raw=+r[c.k]||0, missing=r[c.k]==null||r[c.k]==='';\n      if(missing){");
 patch('pagina.forEach(r=>{\n    const _b=mcBase', 'window._dsVndPagina=pagina;\n  pagina.forEach(r=>{\n    const _b=mcBase');
 patch("const ordFin=ord.filter(r=>/venda/i.test(String(r.stat||'venda')));", "const ordFin=ord.filter(r=>['venda','venda_com_troca'].includes(String(r.stat||'')));");
 for(const name of ['renderVendas','_renderGerVendas']){const start=html.indexOf('function '+name+'('),end=html.indexOf('\n}',start);if(start<0||end<0)throw Error('Tabela ausente: '+name);const part=html.slice(start,end).replaceAll("venda(s)","linha(s)").replaceAll("vendas</span>","linhas</span>").replaceAll("o <b>Líquido</b> continua sendo a verdade.","o <b>Líquido</b> informado pela fonte é preservado; confira se ainda está em liquidação.").replaceAll("O <b>Líquido</b> vem da liquidação e é a verdade.","O <b>Líquido</b> é o registrado na fonte, com a provisoriedade indicada quando disponível.").replaceAll("o <b>Líquido</b> vem da fatura e é a verdade.","o <b>Líquido</b> vem da fatura, com a origem indicada na linha.").replaceAll("O <b>Líquido</b> é a verdade.","O <b>Líquido</b> segue a fonte informada, podendo ser provisório.").replaceAll("${nome}</span>","${esc(nome)}</span>").replaceAll("${envioLabel(r.ent)}</span>","${esc(envioLabel(r.ent))}</span>");html=html.slice(0,start)+part+html.slice(end);}
 return html;
}
module.exports={corrigirVendas};
