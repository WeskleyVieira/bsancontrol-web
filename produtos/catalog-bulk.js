'use strict';
const D=require('./domain'),{fingerprint}=require('./identity'),crypto=require('node:crypto');
async function insert(db,table,keys,rows,conflict){for(let i=0;i<rows.length;i+=100){const chunk=rows.slice(i,i+100);await db.run('INSERT INTO '+table+'('+keys.join(',')+') VALUES '+chunk.map(()=> '('+keys.map(()=>'?').join(',')+')').join(',')+' '+conflict,chunk.flat());}}
async function importCatalog(db,batch,{source,syncHash,reconcile,logistics,operationalDetails,costing,event}){
 const previous=await db.all('SELECT e.conta,e.erp_id,p.* FROM prd_erp e JOIN prd_produtos p ON p.id=e.produto_id'),map=new Map(previous.map(p=>[p.conta+'|'+p.erp_id,p])),seen=new Set(),products=[],links=[],changed=[],stamp=D.now();
 for(const r of batch.products){const ponto=D.point(r.ponto),conta=D.text(r.conta,100),erp=D.text(r.erp_id,100),sku=D.text(r.sku,150),nome=D.text(r.nome),key=conta+'|'+erp;if(!conta||!erp||!nome)D.fail('Cadastro ERP incompleto no lote.');if(seen.has(key))D.fail('ID ERP duplicado no lote.');seen.add(key);const old=map.get(key);if(old&&old.ponto!==ponto)D.fail('Mudança de ponto ERP exige revisão.');const id=old?.id||'erp-'+crypto.createHash('sha256').update(key).digest('hex').slice(0,32),next={id,ponto,sku,nome,tipo:D.text(r.tipo,40),gtin:D.text(r.gtin,100)||null,tipo_variacao:D.text(r.tipo_variacao,30)||null};
  products.push([id,ponto,sku,D.skuKey(sku),nome,next.tipo,D.text(r.situacao,30),old?.data_original||r.data_original||null,old?.criado_em||stamp,stamp,next.gtin,next.tipo_variacao]);links.push([conta,erp,id,source,stamp]);if(!old||fingerprint(old)!==fingerprint(next))changed.push({id,existing:!!old});
 }
 await insert(db,'prd_produtos AS current',['id','ponto','sku','sku_chave','nome','tipo','situacao','data_original','criado_em','atualizado_em','gtin','tipo_variacao'],products,'ON CONFLICT(id) DO UPDATE SET sku=excluded.sku,sku_chave=excluded.sku_chave,nome=excluded.nome,tipo=excluded.tipo,situacao=excluded.situacao,atualizado_em=excluded.atualizado_em,gtin=excluded.gtin,tipo_variacao=excluded.tipo_variacao');
 await insert(db,'prd_erp',['conta','erp_id','produto_id','fonte','visto_em'],links,'ON CONFLICT(conta,erp_id) DO UPDATE SET fonte=excluded.fonte,visto_em=excluded.visto_em');
 for(const p of changed){if(p.existing)await logistics.refresh(db,p.id,await operationalDetails(db,p.id));await reconcile(db,p.id);}
 for(const ponto of ['Bsan','Powerfull'])await costing.pending(db,ponto);
 await db.run('INSERT INTO prd_sincronizacoes(id,fonte,hash,iniciado_em,concluido_em,quantidade) VALUES(?,?,?,?,?,?)',[D.id(),source,syncHash,stamp,D.now(),products.length]);await event(db,null,'importacao','lote_importado',{source,hash:batch.hash,products:products.length,costs:0,unlinked:0,modo:'catalogo_em_lotes'});
 return {ok:true,products:products.length,costs:0,unlinked:0};
}
module.exports={importCatalog,insert};
