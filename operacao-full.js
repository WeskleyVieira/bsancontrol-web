'use strict';
const {number}=require('./visual/operacao-leitura-modelo');
const string=v=>typeof v==='string'?v.trim():'',fields=['sku','prod','mlb','inv','classe','corte','obs','status'],numeric=['aptas','proc','cam','dias'];
// Contrato somente logístico: nunca encaminha mc, TACOS, custos ou objetos da fonte.
function sanitize(raw,ponto=''){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||!raw.contas||typeof raw.contas!=='object'||Array.isArray(raw.contas))throw Object.assign(Error('A relação Full não pôde ser lida.'),{status:500});
 const contas=Object.create(null);for(const [id,rel]of Object.entries(raw.contas)){if(!rel||typeof rel!=='object'||!Array.isArray(rel.linhas))throw Object.assign(Error('Uma conta da relação Full está inválida.'),{status:500});if(ponto&&string(rel.ponto)!==ponto)continue;contas[id]={emp:string(rel.emp),mkt:string(rel.mkt),ponto:string(rel.ponto),linhas:rel.linhas.map(r=>{if(!r||typeof r!=='object'||Array.isArray(r))throw Object.assign(Error('Uma posição Full está inválida.'),{status:500});const out={};for(const f of fields)out[f]=string(r[f]);for(const f of numeric)out[f]=number(r[f]);for(const f of ['needH','aloc']){out[f]={};for(const h of ['7','15','30','60','regra'])out[f][h]=number(r[f]?.[h]);}out.semPosicao=r.semPosicao===true;return out;})};}
 return{dia:string(raw.dia),gerado:string(raw.gerado),contas};
}
async function read(db,q={}){const row=await db.get('SELECT json,atualizado FROM datasets WHERE nome=?',['fullRel']);if(!row)return{contas:{},meta:{existe:false,sincronizadoEm:null}};let raw;try{raw=JSON.parse(row.json);}catch(e){throw Object.assign(Error('A relação Full não pôde ser lida. Nenhuma ausência foi convertida em zero.'),{status:500});}return{...sanitize(raw,String(q.ponto||'')),meta:{existe:true,sincronizadoEm:row.atualizado||null,consultadoEm:new Date().toISOString()}};}
module.exports={sanitize,read};
