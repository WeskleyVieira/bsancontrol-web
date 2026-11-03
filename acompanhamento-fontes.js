'use strict';
const economia=require('./acompanhamento-economia');
// Complementa somente demandas já autorizadas pelo endpoint. Nunca altera plano ou marketplace.
const text=v=>String(v??'').trim(),num=v=>v==null||v===''||!Number.isFinite(Number(v))?null:Number(v);
const type=i=>/^promo(?:\|| ·)/i.test(i.id||'')||/^promo ·/i.test(i.tipo||'')?'promos':/^ads(?:\|| ·)/i.test(i.id||'')||/^ads ·/i.test(i.tipo||'')?'ads':null;
const validDay=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;
const campaignKey=v=>text(v).replace(/\|/g,'/');
function identity(i,kind=type(i)){
 if(kind==='promos')return text(i.anuncio)?{empresa:i.empresa,nivel:'anuncio',chave:text(i.anuncio).toUpperCase()}:null;
 const key=text(i.id).split('|')[3]||'';
 if(key.startsWith('camp:')&&key.slice(5))return{empresa:i.empresa,nivel:'campanha',chave:key.slice(5)};
 if(text(i.anuncio))return{empresa:i.empresa,nivel:'anuncio',chave:text(i.anuncio).toUpperCase()};
 return null;
}
const keyOf=r=>JSON.stringify([text(r.empresa),r.nivel||'anuncio',r.nivel==='campanha'?campaignKey(r.chave):text(r.chave||r.anuncio).toUpperCase()]);
function promo(r){return{data:r.data,acao:text(r.acao),preco:num(r.preco_atual),mc:num(r.mc_atual),motivo:text(r.motivo),precoLista:num(r.preco_lista),precoCenario:num(r.preco_promo),descontoCenario:num(r.desconto),mcCenarioPre:num(r.mc_promo),mcCenarioPos:num(r.mc_pos_ads),situacao:text(r.situacao),campanhasAtivas:text(r.campanhas_ativas),campanhasElegiveis:text(r.campanhas_elegiveis),ajusteSugerido:text(r.ajustar_preco),link:text(r.link)};}
function ads(r){return{data:r.data,nivel:r.nivel,chave:text(r.chave),campanha:text(r.campanha),campanhas:text(r.campanhas),janela:text(r.janela),acao:text(r.acao),motivo:text(r.motivo),faturamento:num(r.faturamento),mcPre:num(r.pre_ads),mcPos:num(r.pos_ads),gasto:num(r.gasto),receitaAtribuida:num(r.receita),limiteGasto:num(r.cabe),corteReferencia:num(r.corte),roasAtual:num(r.roas_atual),roasSugerido:num(r.roas_sugerido)};}
async function enrichSource(db,items,kind){
 const table=kind==='promos'?'promo_diagnostico':'ads_plano',list=items.filter(i=>type(i)===kind);
 if(!list.length)return;
 for(const i of list)i.evidencias={tipo:kind,status:'unsupported',dataConta:null};
 const supported=list.filter(i=>/mercado livre/i.test(i.mkt||''));
 if(!supported.length)return;
 const targets=new Map();for(const i of supported){i.evidencias.status='not-linked';const id=identity(i,kind);if(id){const key=keyOf(id);if(!targets.has(key))targets.set(key,{...id,items:[]});targets.get(key).items.push(i);}}
 if(!targets.size)return;
 try{
  const empresas=[...new Set([...targets.values()].map(r=>r.empresa))],latest=await db.all(`SELECT empresa,MAX(data) AS data FROM ${table} WHERE empresa IN (${empresas.map(()=>'?').join(',')}) GROUP BY empresa`,empresas),dates=new Map(latest.map(r=>[r.empresa,text(r.data)])),requests=[];
  for(const t of targets.values()){const day=dates.get(t.empresa)||null;for(const i of t.items)i.evidencias={tipo:kind,status:day&&!validDay(day)?'unavailable':'missing',dataConta:validDay(day||'')?day:null};if(day&&validDay(day))requests.push({...t,data:day});}
  const found=new Map();
  for(let start=0;start<requests.length;start+=200){const chunk=requests.slice(start,start+200),args=[],where=chunk.map(t=>{args.push(t.empresa,t.data);if(kind==='promos'){args.push(t.chave);return '(p.empresa=? AND p.data=? AND UPPER(p.anuncio)=?)';}args.push(t.nivel,t.chave);return "(p.empresa=? AND p.data=? AND p.nivel=? AND "+(t.nivel==='campanha'?"REPLACE(p.chave,'|','/')":"UPPER(p.chave)")+'=?)';});const rows=await db.all(`SELECT p.* FROM ${table} p WHERE ${where.join(' OR ')}`,args);for(const r of rows){const key=keyOf(r);if(!found.has(key))found.set(key,[]);found.get(key).push(r);}}
  for(const[key,t]of targets){const rows=found.get(key)||[];for(const i of t.items){if(rows.length>1)i.evidencias.status='ambiguous';else if(rows.length===1){const reading=kind==='promos'?promo(rows[0]):ads(rows[0]);i.evidencias.status='ok';if(kind==='promos')i.hoje=reading;else i.ads=reading;}}}
 }catch(e){for(const t of targets.values())for(const i of t.items)i.evidencias={tipo:kind,status:'unavailable',dataConta:null};}
}
async function validationDetails(db,items){const relevant=items.filter(i=>type(i)==='promos'&&i.validacao);for(let start=0;start<relevant.length;start+=200){const chunk=relevant.slice(start,start+200);try{const rows=await db.all('SELECT * FROM promo_validacao WHERE demanda_id IN ('+chunk.map(()=>'?').join(',')+')',chunk.map(i=>i.id)),byId=new Map(rows.map(r=>[r.demanda_id,r]));for(const i of chunk){const r=byId.get(i.id);if(r&&r.em===i.validacao.em)i.validacao={...i.validacao,mcAtual:num(r.mc_atual),piso:num(r.piso)};}}catch(e){/* A revalidação básica continua na demanda; campos opcionais não apagam a fila. */}}}
async function enriquecer(db,items,{financeiro=true}={}){const out=items.map(i=>({...i})),finance=financeiro?economia.enriquecer(db,out):Promise.resolve(out.map(i=>({...i,financeiro:{status:'deferred'}})));await Promise.all([enrichSource(db,out,'promos'),enrichSource(db,out,'ads'),validationDetails(db,out)]);const byId=new Map((await finance).map(i=>[i.id,i.financeiro]));return out.map(i=>({...i,financeiro:byId.get(i.id)}));}
module.exports={enriquecer,identity,promo,ads,keyOf};
