"use strict";
const D=require('./domain');
const term=value=>'%'+D.text(value,100).toUpperCase().replace(/[\\%_]/g,'')+'%';
const pagination=query=>({page:Math.max(1,Math.min(100000,parseInt(query.page,10)||1)),pageSize:Math.max(1,Math.min(100,parseInt(query.pageSize,10)||30))});
function catalogWhere(cap,query={}){
 const points=query.ponto?[D.point(query.ponto)]:cap.pontos;
 points.forEach(p=>D.scope(cap,p));
 const clauses=[points.length?`p.ponto IN (${points.map(()=>'?').join(',')})`:'1=0'],args=[...points];
 if(query.match&& !['exact','contains'].includes(query.match))D.fail('Modo de busca inválido.');
 if(query.q){if(query.match==='exact'){clauses.push('(p.sku_chave=? OR p.gtin=?)');args.push(D.skuKey(query.q),D.text(query.q,100));}
  else{clauses.push('(UPPER(p.sku) LIKE ? OR UPPER(p.nome) LIKE ? OR p.ncm LIKE ? OR UPPER(p.categoria) LIKE ? OR p.gtin LIKE ?)');args.push(...Array(5).fill(term(query.q)));}}
 if(query.ncm){if(!['missing','present'].includes(query.ncm))D.fail('Filtro de NCM inválido.');clauses.push(query.ncm==='missing'?"(p.ncm IS NULL OR p.ncm='')":"(p.ncm IS NOT NULL AND p.ncm<>'')");}
 if(query.logistica){if(!['conferida','a_conferir','incompleta','nao_informada'].includes(query.logistica))D.fail('Filtro de logística inválido.');clauses.push('p.logistica_estado=?');args.push(query.logistica);}
 if(query.pendencia){points.forEach(p=>D.scope(cap,p,true));
  if(!['todas','aguardando_custo','aguardando_vinculo','em_revisao','divergencia_legada','composicao_pendente','composicao_desatualizada'].includes(query.pendencia))D.fail('Pendência inválida.');
  clauses.push("EXISTS(SELECT 1 FROM prd_pendencias i WHERE i.produto_id=p.id AND i.estado='aberta'"+(query.pendencia==='todas'?'':" AND i.tipo=?")+')');
  if(query.pendencia!=='todas')args.push(query.pendencia);
 }
 return {where:clauses.join(' AND '),args};
}
module.exports={catalogWhere,pagination,term};
