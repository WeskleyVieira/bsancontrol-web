"use strict";
// Offline comparison only. No consumer switches, ERP calls, credentials or database connections.
const D=require('./domain'),{verify}=require('./cost-review');
function compare(document,baseline,{ponto}={}){
 verify(document);if(D.point(ponto)!==document.ponto||baseline.ponto!==document.ponto)D.fail('Conferência e origem devem pertencer ao mesmo ponto.');
 const newer=new Map(),older=new Map(),missing=[];const group=(map,k,r)=>{if(!map.has(k))map.set(k,[]);map.get(k).push(r);};
 for(const item of document.itens){if(item.sku_chave)group(newer,item.sku_chave,item);else missing.push({sku_chave:'',sku:'',estado:'sku_ausente_no_modulo',produto_id:item.produto_id,custo_versao:item.custo?.versao||null,novo_centavos:null,origem_centavos:null,diferenca_centavos:null,motivos:item.motivos,referencias:[]});}for(const row of baseline.rows){if(D.skuKey(row.sku))group(older,D.skuKey(row.sku),row);else missing.push({sku_chave:'',sku:'',estado:'sku_ausente_na_origem',produto_id:null,custo_versao:null,novo_centavos:null,origem_centavos:null,diferenca_centavos:null,motivos:['sku_ausente'],referencias:[{fonte:row.fonte,chave:row.chave}]});}
 const keys=[...new Set([...newer.keys(),...older.keys()])].sort(),items=[];for(const key of keys){
  const ns=newer.get(key)||[],os=older.get(key)||[],n=ns[0],o=os[0];let state;
  if(ns.length>1||os.length>1)state='identidade_ambigua';else if(!n)state='sem_cadastro_no_modulo';else if(n.motivos.length)state='bloqueado_no_modulo';else if(!o)state='sem_custo_na_origem';else if(o.total_centavos==null)state='origem_sem_valor';else state=n.custo.total_centavos===o.total_centavos?'igual':'divergente';
  items.push({sku_chave:key,sku:n?.sku||o?.sku||'',estado:state,produto_id:ns.length===1?n.produto_id:null,custo_versao:ns.length===1?n.custo?.versao||null:null,novo_centavos:ns.length===1&&!n.motivos.length?n.custo.total_centavos:null,origem_centavos:os.length===1?o.total_centavos:null,diferenca_centavos:state==='igual'||state==='divergente'?n.custo.total_centavos-o.total_centavos:null,motivos:ns.flatMap(i=>i.motivos),referencias:os.map(r=>({fonte:r.fonte,chave:r.chave}))});
 }
 items.push(...missing);const counts={};for(const i of items)counts[i.estado]=(counts[i.estado]||0)+1;
 return {contrato:'bsan-produtos-custos/comparacao-v1',finalidade:'conferencia',publicavel:false,ponto:document.ponto,conferencia:{id:document.id,versao:document.versao,sha256:document.sha256},fontes:baseline.fontes,limites:['Cache salvo do Excel; não recalcula fórmulas.','Não aplica de-para de anúncios nem vigência de vendas.','Não migra regras de leilão, embalagem ou calculadoras.','Chaves normalizadas para comparação; duplicidades não escolhem primeiro/último.'],reserva_novos_skus:!!baseline.reserva,resumo:{chaves:keys.length,linhas:items.length,registros_sem_sku:missing.length,estados:counts},itens:items};
}
function baselineFromBatches(primary,reserve,{ponto}){
 D.point(ponto);if([...primary.costs,...(reserve?.costs||[])].some(r=>r.ponto!==ponto))D.fail('Origem contém dados de outro ponto.');
 const rows=primary.costs.map(r=>({sku:r.sku,total_centavos:D.legacyCents(r.total),fonte:'precifique',chave:r.sourceKey}));
 // Reserve is considered only for absent/invalid unique primary costs. Preserve ambiguity in either source.
 if(reserve){const rs=new Map();for(const r of reserve.costs){const k=D.skuKey(r.sku);if(!rs.has(k))rs.set(k,[]);rs.get(k).push({sku:r.sku,total_centavos:D.legacyCents(r.total),fonte:'novos_skus',chave:r.sourceKey});}
  for(const [k,list] of rs){const old=rows.filter(r=>D.skuKey(r.sku)===k);if(old.length>1||old[0]?.total_centavos!=null)continue;if(old.length)rows.splice(rows.indexOf(old[0]),1);rows.push(...list);}}
 return {ponto,rows,reserva:!!reserve,fontes:[{tipo:'precifique',arquivo:primary.source,sha256:primary.hash},...(reserve?[{tipo:'novos_skus',arquivo:reserve.source,sha256:reserve.hash}]:[])]};
}
async function main(){const fs=require('node:fs'),path=require('node:path'),{readBatch}=require('./import');const args=Object.fromEntries(process.argv.slice(2).map(s=>{const i=s.indexOf('=');if(!s.startsWith('--')||i<0)D.fail('Use --snapshot=... --precifique=... --ponto=Bsan|Powerfull [--pesquisas=...] [--out=...].');return [s.slice(2,i),s.slice(i+1)];}));
 if(!args.snapshot||!args.precifique||!args.ponto)D.fail('Informe snapshot, precifique e ponto explicitamente.');const ponto=D.point(args.ponto),document=JSON.parse(fs.readFileSync(path.resolve(args.snapshot),'utf8').replace(/^\uFEFF/,'')),primary=readBatch(path.resolve(args.precifique),{kind:'precifique',ponto}),reserve=args.pesquisas?readBatch(path.resolve(args.pesquisas),{kind:'pesquisas',ponto}):null;
 const result=compare(document,baselineFromBatches(primary,reserve,{ponto}),{ponto}),text=JSON.stringify(result,null,2)+'\n';if(args.out){fs.writeFileSync(path.resolve(args.out),text,{flag:'wx'});console.log(JSON.stringify({arquivo:path.resolve(args.out),resumo:result.resumo}));}else process.stdout.write(text);
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={compare,baselineFromBatches};
