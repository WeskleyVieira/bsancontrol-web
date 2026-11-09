'use strict';
const F=require('./visual/forecast-anuncios-modelo');
const {scope}=require('./resultados-consultas');
const bad=message=>Object.assign(new Error(message),{status:400});
const finished="LOWER(TRIM(COALESCE(status,''))) IN ('venda','venda_com_troca')";
const revenue="CAST(COALESCE(receita_n,CAST(NULLIF(TRIM(CAST(receita AS TEXT)),'') AS NUMERIC)) AS DOUBLE PRECISION)";
function parameters(q,today){
 if(!F.iso(q.de)||!F.iso(q.ate)||q.de>q.ate||F.span(q.de,q.ate)>180)throw bad('Selecione um período válido de até 180 dias.');
 const mode=q.referencia||'month';if(!['month','month-full','previous','header'].includes(mode))throw bad('Referência inválida.');
 if(mode==='header'&&(q.refDe||q.refAte)&&(!F.iso(q.refDe)||!F.iso(q.refAte)))throw bad('Datas de referência inválidas.');
 return{from:q.de,to:q.ate,limit:[q.ate,F.add(today,-1)].sort()[0],mode,chosen:q.refDe&&q.refAte?[q.refDe,q.refAte]:null};
}
function query(q,p,asof){
 const ref=F.reference(p.from,asof&&p.from.slice(0,7)===p.to.slice(0,7)&&p.to!==F.endMonth(p.to)?asof:p.to,p.mode,p.chosen);
 const valid=!!F.iso(ref.from)&&!!F.iso(ref.to)&&ref.from<=ref.to&&ref.to<p.from&&F.span(ref.from,ref.to)<=366;
 const s=scope(q);s.conditions.push(finished);const intervals=['(data>=? AND data<=?)'];s.args.push(p.from,asof||p.limit);if(valid){intervals.push('(data>=? AND data<=?)');s.args.push(ref.from,ref.to);}s.conditions.push('('+intervals.join(' OR ')+')');
 return{ref,args:s.args,sql:`SELECT data AS date,empresa AS emp,canal AS mkt,COALESCE(ponto,'') AS ponto,TRIM(COALESCE(sku,'')) AS sku,MAX(titulo) AS tit,CASE WHEN SUM(CASE WHEN ${revenue} IS NULL OR ${revenue}<0 THEN 1 ELSE 0 END)>0 THEN NULL ELSE SUM(${revenue}) END AS fat,CASE WHEN SUM(CASE WHEN qtd IS NULL OR qtd<0 THEN 1 ELSE 0 END)>0 THEN NULL ELSE SUM(qtd) END AS qtd FROM vendas WHERE ${s.conditions.join(' AND ')} GROUP BY data,empresa,canal,COALESCE(ponto,''),TRIM(COALESCE(sku,'')) ORDER BY data,empresa,canal,sku LIMIT 100001`};
}
async function carregar(db,q,{today=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'})}={}){
 const p=parameters(q,today),s=scope(q);s.conditions.push(finished,'data>=?','data<=?');s.args.push(p.from,p.limit);
 const last=await db.get('SELECT MAX(data) AS ultima FROM vendas WHERE '+s.conditions.join(' AND '),s.args),asof=last?.ultima||null;
 const c=query(q,p,asof),rows=asof?await db.all(c.sql,c.args):[];
 if(rows.length>100000)throw Object.assign(new Error('Selecione um intervalo menor para acompanhar os produtos.'),{status:422});
 return{rows:rows.map(r=>({...r,stat:'venda',anuncio:'',fat:r.fat==null?null:Number(r.fat),qtd:r.qtd==null?null:Number(r.qtd)})),corte:asof,referencia:c.ref,hoje:today,consultadoEm:new Date().toISOString(),agregado:true,completudeConfirmada:false};
}
module.exports={parameters,query,carregar};
