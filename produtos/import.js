"use strict";
const crypto=require('node:crypto');const fs=require('node:fs');const path=require('node:path');
function xlsx(){try{return require('xlsx');}catch{if(process.env.PRODUTOS_XLSX_MODULE)return require(path.resolve(process.env.PRODUTOS_XLSX_MODULE));throw new Error('Informe PRODUTOS_XLSX_MODULE com o módulo xlsx já instalado no Pipeline.');}}
const {legacyCents,text}=require('./domain');
function date(v){if(v instanceof Date&&!isNaN(v))return v.toISOString().slice(0,10);
 if(typeof v==='number'&&v>20000&&v<100000)return new Date(Math.round((v-25569)*86400000)).toISOString().slice(0,10);
 const s=String(v||'');return /^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(0,10):null;}
function readBatch(file,{kind,ponto}={}){
 const bytes=fs.readFileSync(file);
 const batch={source:path.resolve(file),hash:crypto.createHash('sha256').update(bytes).digest('hex'),products:[],costs:[]};
 if(kind==='detalhes'){const data=JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,''));if(!data.PRODUTOS||Array.isArray(data.PRODUTOS)||typeof data.PRODUTOS!=='object')throw new Error('Cache de detalhes inválido.');
   batch.details=Object.values(data.PRODUTOS);return batch;}
 const X=xlsx(),wb=X.read(bytes,{type:'buffer',cellDates:true});
 const grid=name=>{if(!wb.Sheets[name])throw new Error('Aba não encontrada: '+name);return X.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:null,raw:true});};
 if(kind==='tiny'){
  // Reprocessing an older snapshot must populate fields added by this reader revision.
  batch.revision='tiny-catalog-v2';
  const rows=grid('Produtos'),heads=rows.shift().map(x=>String(x||'').trim());
  for(const row of rows){const r=Object.fromEntries(heads.map((h,i)=>[h,row[i]]));if(!r.id&&!r.sku)continue;
   batch.products.push({conta:text(r.conta),ponto:text(r.ponto),erp_id:String(r.id||''),sku:String(r.sku??''),gtin:String(r.gtin??''),nome:r.descricao,tipo:r.tipo,tipo_variacao:r.tipoVariacao,situacao:r.situacao});}
 }else if(kind==='precifique'){
  if(!ponto)throw new Error('Informe --ponto para a base de custos.');
  const rows=grid('PRECIFIQUE 2.0');const hi=rows.findIndex(r=>r.some(v=>String(v||'').trim()==='SKU')&&r.some(v=>String(v||'').includes('Custo Total')));
  if(hi<0)throw new Error('Cabeçalho de custo não localizado.');const heads=rows[hi].map(v=>String(v||'').trim());
  for(let i=hi+1;i<rows.length;i++){const r=Object.fromEntries(heads.map((h,j)=>[h,rows[i][j]]));if(!r.SKU)continue;
   batch.costs.push({ponto,sku:String(r.SKU),nome:r['Descrição'],total:r['Custo Total'],sourceKey:'PRECIFIQUE 2.0!'+(i+1)});}
 }else if(kind==='pesquisas'){
  if(!ponto)throw new Error('Informe --ponto: não inferimos a base financeira de uma planilha compartilhada.');
  const rows=grid('NOVOS SKUS'),heads=rows.shift().map(v=>String(v||'').trim());
  for(let i=0;i<rows.length;i++){const r=Object.fromEntries(heads.map((h,j)=>[h,rows[i][j]]));if(!r['SKU BSAN'])continue;
   const prod=legacyCents(r.CTP),emb=r['CUSTO EMB.']===0?0:legacyCents(r['CUSTO EMB.']);
   const total=legacyCents(r['CTP FINAL'])??(prod!==null&&emb!==null?prod+emb:null);
   batch.costs.push({ponto,sku:String(r['SKU BSAN']),nome:r['DESCRIÇÃO'],produto:prod===null?null:prod/100,embalagem:emb===null?null:emb/100,
    total:total===null?null:total/100,data_original:date(r['DATA DE CADASTRO']),sourceKey:'NOVOS SKUS!'+(i+2)});}
 }else throw new Error('Tipo esperado: tiny, precifique, pesquisas ou detalhes.');
 return batch;
}
module.exports={readBatch,date};
