"use strict";
const {text}=require('./domain');
const {sanitizeLogistics}=require('./logistics');
// Explicit operational allowlist. Never copy an entire legacy row into the stock response.
function sanitizeDetails(value={}){
  const ncm=String(value.ncm_puro??value.ncm??'').replace(/\D/g,'');
  const rawPhoto=Array.isArray(value.anexos)?value.anexos.find(x=>typeof x==='string'&&/^https:\/\//i.test(x)):value.foto;
  let foto=null;try{const url=new URL(rawPhoto);if(url.protocol==='https:'&&!url.username&&!url.password)foto=url.href.slice(0,2000);}catch{}
  const rawDate=text(value.data_coleta??value.fonte_coletada_em,60);
  const validDate=/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(rawDate)&&Number.isFinite(Date.parse(rawDate));
  return {ncm:ncm.length===8?ncm:null,categoria:typeof value.categoria==='string'?text(value.categoria,240)||null:null,foto,
    fonte_coletada_em:validDate?new Date(rawDate).toISOString():null,logistica_origem:sanitizeLogistics(value.dimensoes??value.logistica_origem)};
}
async function operationalDetails(db,pid){const row=await db.get('SELECT dados,fonte,importado_em FROM prd_detalhes WHERE produto_id=?',[pid]);
  if(!row)return null;const safe=sanitizeDetails(JSON.parse(row.dados));return {...safe,fonte:row.fonte,importado_em:row.importado_em};}
module.exports={sanitizeDetails,operationalDetails};
