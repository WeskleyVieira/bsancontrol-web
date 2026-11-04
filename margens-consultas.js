'use strict';
const M=require('./margens-modelo'),A=require('./acessos');
const fail=t=>Object.assign(Error(t),{status:400});
function consulta(q={},user){
 const valid=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
 if(!valid(q.de)||!valid(q.ate)||q.de>q.ate||Date.parse(q.ate)-Date.parse(q.de)>1098*864e5)throw fail('Informe um período válido de até três anos.');
 if(String(q.sku||'').length>200||String(q.q||'').length>200)throw fail('Busca inválida.');
 const basis=[q.de.slice(0,7)+'-01',new Date(Date.UTC(+q.ate.slice(0,4),+q.ate.slice(5,7),0)).toISOString().slice(0,10)],args=[...basis],w=["v.status IN ('venda','venda_com_troca')",'v.data>=?','v.data<=?'];
 // Ponto e SKU são aplicados APÓS o rateio: nunca usar somente as vendas selecionadas como denominador do mês.
 for(const[k,col]of [['emp','empresa'],['mkt','canal']])if(q[k]){w.push('v.'+col+'=?');args.push(String(q[k]));}
 if(q.carteira==='1'&&user?.perfil==='gestor'){w.push('EXISTS(SELECT 1 FROM operacoes o WHERE o.empresa=v.empresa AND o.marketplace=v.canal AND o.gestor=?)');args.push(user.gestor_ref||'');if(!user.gestor_ref)w.push('1=0');}
 const nullable=k=>`COALESCE(v.${k}_n,CAST(NULLIF(TRIM(CAST(v.${k} AS TEXT)),'') AS NUMERIC))`,V=k=>`CAST(COALESCE(${nullable(k)},0) AS DOUBLE PRECISION)`,mc=q.baseMargem==='real'?`CAST(COALESCE(${nullable('mc_real')},${V('mc_comissao')}) AS DOUBLE PRECISION)`:V('mc_comissao');
 const selected=[],selArgs=[],search=String(q.q||'').trim().toLowerCase();if(search){const like='%'+search.replace(/[!%_]/g,'!$&')+'%';selected.push("(LOWER(COALESCE(v.sku,'')) LIKE ? ESCAPE '!' OR LOWER(COALESCE(v.titulo,'')) LIKE ? ESCAPE '!' OR LOWER(COALESCE(v.pedido,'')) LIKE ? ESCAPE '!' OR LOWER(COALESCE(v.anuncio_id,'')) LIKE ? ESCAPE '!')");selArgs.push(like,like,like,like);}if(q.neg==='1')selected.push(V('mc_comissao')+'<0');
 const base=`CASE WHEN LOWER(v.canal) LIKE '%temu%' THEN ${V('liquido')} ELSE ${V('receita')} END`,values={fat:V('receita'),liq:V('liquido'),mc,ctp:V('ctp'),pub:V('publicidade'),base,qtd:'v.qtd',n:'1'},selFields=Object.entries(values).map(([k,v])=>`SUM(CASE WHEN v.included=1 THEN ${v} ELSE 0 END) AS "sel${k[0].toUpperCase()+k.slice(1)}"`).join(',');
 return{basis,args:[...selArgs,...args],sql:`WITH scoped AS (SELECT v.*,CASE WHEN ${selected.join(' AND ')||'1=1'} THEN 1 ELSE 0 END AS included FROM vendas v WHERE ${w.join(' AND ')}) SELECT v.data AS date,v.empresa AS emp,v.canal AS mkt,v.ponto,v.sku,v.anuncio_id AS anuncio,MAX(v.titulo) AS titulo,COUNT(*) AS n,SUM(v.qtd) AS qtd,SUM(${V('receita')}) AS fat,SUM(${V('liquido')}) AS liq,SUM(${mc}) AS mc,SUM(${V('ctp')}) AS ctp,SUM(CASE WHEN ${nullable('ctp')} IS NULL THEN 1 ELSE 0 END) AS "ctpMissing",SUM(${V('publicidade')}) AS pub,SUM(CASE WHEN ${nullable('publicidade')} IS NULL THEN 1 ELSE 0 END) AS "pubMissing",SUM(${base}) AS base,${selFields} FROM scoped v GROUP BY v.data,v.empresa,v.canal,v.ponto,v.sku,v.anuncio_id ORDER BY v.data,v.empresa,v.canal,v.ponto,v.sku,v.anuncio_id LIMIT 250001`};
}
async function carregar(db,q={},user){
 if(user&&!A.pode(user,'vendas.ver'))throw Object.assign(Error('Seu acesso não permite consultar margens.'),{status:403});
 const c=consulta(q,user),[rows,datasets]=await Promise.all([db.all(c.sql,c.args),db.all("SELECT nome,json,atualizado FROM datasets WHERE nome IN ('ads','adsCamp','adsDia')")]),source={},updated={};
 for(const r of datasets){try{source[r.nome]=JSON.parse(r.json);if(!Array.isArray(source[r.nome]))throw Error();updated[r.nome]=r.atualizado||null;}catch(_){throw Object.assign(Error('Fonte de publicidade inválida. Nenhuma margem confirmada.'),{status:503});}}
 if(rows.length>250000)throw Object.assign(Error('Selecione um período menor para apurar as margens.'),{status:422});
 const own=new Set(rows.map(r=>M.key(r.emp,r.mkt)));const keep=(r,day=false)=>(q.carteira!=='1'||!user||user.perfil!=='gestor'||own.has(M.key(r.emp,r.mkt)))&&(!q.emp||r.emp===q.emp)&&(!q.mkt||r.mkt===q.mkt)&&String(day?r.data:r.comp).slice(0,7)>=c.basis[0].slice(0,7)&&String(day?r.data:r.comp).slice(0,7)<=c.basis[1].slice(0,7),data=M.view(M.allocate(rows,{ads:(source.ads||[]).filter(r=>keep(r)),camp:(source.adsCamp||[]).filter(r=>keep(r)),dia:(source.adsDia||[]).filter(r=>keep(r,true))}),q);
 if(q.itens!=='1'&&!q.sku)delete data.produtos;return{...data,baseMargem:q.baseMargem==='real'?'real-disponivel':'teto',fontes:updated,consultadoEm:new Date().toISOString(),completudeConfirmada:false};
}
module.exports={consulta,carregar};
