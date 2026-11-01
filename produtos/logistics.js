"use strict";
const D=require('./domain'),crypto=require('node:crypto');
function positive(v){if(typeof v!=='number'&&!(typeof v==='string'&&/^\d+(?:\.\d+)?$/.test(v)))return null;const n=Number(v);return Number.isFinite(n)&&n>0&&n<=1e9?n:null;}
function sanitizeLogistics(value){if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const result={};for(const key of ['altura','largura','comprimento','diametro','pesoLiquido','pesoBruto','quantidadeVolumes'])result[key]=positive(value[key]);
 if(result.quantidadeVolumes&&!Number.isInteger(result.quantidadeVolumes))result.quantidadeVolumes=null;
 const e=value.embalagem||{};result.embalagem={id:['string','number'].includes(typeof e.id)?D.text(e.id,100)||null:null,
  tipo:[1,2,3].includes(e.tipo)?e.tipo:null,descricao:typeof e.descricao==='string'?D.text(e.descricao,240)||null:null};return result;
}
function inspect(origin,confirmation,product){const assinatura=origin?crypto.createHash('sha256').update(JSON.stringify({identidade:product?[product.id,product.ponto,product.sku,product.nome,product.tipo,product.gtin,product.tipo_variacao]:null,origem:origin})).digest('hex'):null;
 const pendencias=[];if(!origin)pendencias.push('Dados logísticos ainda não importados.');
 else{if(!origin.embalagem.tipo)pendencias.push('Formato da embalagem não informado.');
  const required=origin.embalagem.tipo===3?['comprimento','diametro','pesoBruto']:['altura','largura','comprimento','pesoBruto'];
  const names={altura:'Altura',largura:'Largura',comprimento:'Comprimento',diametro:'Diâmetro',pesoBruto:'Peso bruto'};for(const k of required)if(origin[k]==null)pendencias.push(names[k]+' não informado.');
  if(origin.pesoBruto&&origin.pesoLiquido&&origin.pesoBruto<origin.pesoLiquido)pendencias.push('Peso bruto menor que o peso líquido.');}
 const valid=confirmation&&confirmation.assinatura===assinatura&&!pendencias.length;
 let normalizado=null;if(valid){const length={cm:1,mm:0.1,m:100}[confirmation.unidade_dimensao],weight={kg:1,g:0.001}[confirmation.unidade_peso];
  if(length&&weight){const scale=(n,f)=>n==null?null:Number((n*f).toPrecision(15));normalizado={};for(const k of ['altura','largura','comprimento','diametro'])normalizado[k+'_cm']=scale(origin[k],length);
   normalizado.peso_liquido_kg=scale(origin.pesoLiquido,weight);normalizado.peso_bruto_kg=scale(origin.pesoBruto,weight);
   if(origin.embalagem.tipo!==3&&normalizado.altura_cm&&normalizado.largura_cm&&normalizado.comprimento_cm)normalizado.cubagem_m3=Number((normalizado.altura_cm*normalizado.largura_cm*normalizado.comprimento_cm/1e6).toPrecision(15));
  }}
 return {origem:origin,assinatura,pendencias,estado:!origin?'nao_informada':pendencias.length?'incompleta':normalizado?'conferida':'a_conferir',versao:Number(confirmation?.versao||0),normalizado,
  conferencia:normalizado?{ator_id:confirmation.ator_id,conferido_em:confirmation.conferido_em,observacao:confirmation.observacao,unidade_dimensao:confirmation.unidade_dimensao,unidade_peso:confirmation.unidade_peso}:null};
}
async function projection(db,pid,details){return inspect(details?.logistica_origem||null,await db.get('SELECT * FROM prd_logistica WHERE produto_id=?',[pid]),await db.get('SELECT id,ponto,sku,nome,tipo,gtin,tipo_variacao FROM prd_produtos WHERE id=?',[pid]));}
async function refresh(db,pid,details){const view=await projection(db,pid,details),n=view.normalizado;
 await db.run('UPDATE prd_produtos SET logistica_estado=?,altura_cm=?,largura_cm=?,comprimento_cm=?,peso_kg=?,diametro_cm=?,peso_liquido_kg=?,embalagem_tipo=?,embalagem_descricao=? WHERE id=?',
  [view.estado,n?.altura_cm??null,n?.largura_cm??null,n?.comprimento_cm??null,n?.peso_bruto_kg??null,n?.diametro_cm??null,n?.peso_liquido_kg??null,details?.logistica_origem?.embalagem.tipo??null,details?.logistica_origem?.embalagem.descricao??null,pid]);return view;}
module.exports={positive,sanitizeLogistics,inspect,projection,refresh};
