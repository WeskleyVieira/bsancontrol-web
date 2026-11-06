/* Grupo Bsan: contrato de leitura. Fontes alternativas e estados não são parcelas. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BCPublicidadeModelo=api;})(typeof window==='object'?window:this,function(){
 'use strict';
 const number=v=>v===null||v===undefined||typeof v==='boolean'||String(v).trim()===''||!Number.isFinite(+v)?null:+v;
 const money=v=>v==null?null:Math.round((v+Number.EPSILON)*100)/100;
 const sum=(rs,k)=>money(rs.reduce((s,r)=>s+(number(r[k])??0),0));
 const total=rs=>rs.length&&rs.every(v=>v!=null)?money(rs.reduce((s,v)=>s+v,0)):null;
 const ratio=(a,b)=>a!=null&&b>0?100*a/b:null;
 const affiliate=r=>/afiliad|\bCVAF\b/i.test((r.fonte||'')+' '+(r.campanha||''));
 const key=(e,m,c)=>JSON.stringify([e,m,c]);
 const end=c=>new Date(Date.UTC(+c.slice(0,4),+c.slice(5,7),0)).toISOString().slice(0,10);
 const days=(a,b)=>{const ds=[];for(let d=a;d<=b;d=new Date(Date.parse(d)+864e5).toISOString().slice(0,10))ds.push(d);return ds;};
 const operation=r=>{const p=String(r.operacao||'').split(' · ');return{emp:r.emp||r.empresa||p[0]||'',mkt:r.mkt||r.canal||p[1]||'',month:String(r.comp||r.competencia||r.mes||r.data||r.date||'').slice(0,7)};};
 function metric(value,source,basis='data_venda',status='informado',extra={}){return{value:money(value),source,basis,status,...extra};}
 function model({q,rows=[],sources={},margin=null,goals=[],scopeOps=[]}){
  const months=new Map(),touch=(emp,mkt,month)=>{const k=key(emp,mkt,month);if(!months.has(k))months.set(k,{emp,mkt,month,sales:[],ads:[],camp:[],dia:[],af:[],afDia:[],det:[],legacy:[]});return months.get(k);};
  const match=r=>{const o=operation(r);return o.month>=q.de.slice(0,7)&&o.month<=q.ate.slice(0,7)&&(!q.emp||o.emp===q.emp)&&(!q.mkt||o.mkt===q.mkt);};
  for(const op of scopeOps)for(let month=q.de.slice(0,7);month<=q.ate.slice(0,7);month=new Date(Date.parse(end(month))+864e5).toISOString().slice(0,7))touch(op.emp,op.mkt,month);
  for(const r of rows)if(match(r))touch(r.emp,r.mkt,r.date.slice(0,7)).sales.push(r);
  for(const [name,bucket]of [['ads','ads'],['adsCamp','camp'],['adsDia','dia'],['afiliadosFonte','af'],['afiliadosDia','afDia'],['comissaoDet','det'],['comissao','legacy']])for(const r of sources[name]||[]){if(!match(r))continue;const o=operation(r);touch(o.emp,o.mkt,o.month)[bucket].push(r);}
  const operations=[];
  for(const o of months.values()){
   const a=o.month+'-01',b=end(o.month),de=q.de>a?q.de:a,ate=q.ate<b?q.ate:b,full=de===a&&ate===b,dates=days(de,ate),sales=o.sales.filter(r=>r.date>=de&&r.date<=ate),fat=sum(sales,'fat'),embedded=/tik\s*tok/i.test(o.mkt),det=o.det[0]||{},legacy=o.legacy[0]||{};
   const daily=new Map();for(const r of o.dia.filter(r=>!affiliate(r)&&number(r.inv)!=null&&r.data>=de&&r.data<=ate)){const d=String(r.data).slice(0,10),v=daily.get(d)||{date:d,inv:0,rec:0,recKnown:true};v.inv=money(v.inv+number(r.inv));v.recKnown&&=number(r.rec)!=null;v.rec=money(v.rec+(number(r.rec)||0));daily.set(d,v);}
   const alternatives=[];for(const [name,list,field]of [['adsCamp',o.camp,'rec'],['ads',o.ads,'recAds']]){const rs=list.filter(r=>!affiliate(r)&&number(r.inv)!=null);if(rs.length)alternatives.push({source:name,inv:sum(rs,'inv'),rec:rs.every(r=>number(r[field])!=null)?sum(rs,field):null});}
   const afReport=o.ads.filter(affiliate),afEstimate=number(det.Afiliados)??number(legacy.afiliados),metadata=o.af[0]||det.AfiliadosFonte||null;
   // O dataset independente e o metadado embutido são representações alternativas da mesma competência.
   const estimated=number(metadata?.esperado)??afEstimate;
   const sourceMeta=o.af.length?'afiliadosFonte':det.AfiliadosFonte?'COMISSAO_DET.AfiliadosFonte':afEstimate!=null?'cadastro mensal':null;
   const afEmbedded=sales.length&&sales.every(r=>!+r.afilMissing)?money(-sum(sales,'afil')):null;
   const afDaily=new Map();for(const r of o.afDia.length?o.afDia:(Array.isArray(det.AfiliadosDia)?det.AfiliadosDia:[])){
    const d=String(r.data||'').slice(0,10);if(d<de||d>ate||number(r.valor)==null)continue;
    if(r.conciliado!==true&&metadata?.conciliado!==true)continue;
    if(r.regime&&r.regime!=='data_venda'||r.base_data&&r.base_data!=='data_venda')continue;
    afDaily.set(d,money((afDaily.get(d)||0)+number(r.valor)));
   }
   const charged=full&&metadata?.billing_conciliado===true?number(metadata.cobrado_vendas_mes):null;
   const settled=full?number(metadata?.liquidado):null;
   let paid,paidRevenue=null;
   if(embedded){paid=metric(sales.length&&sales.every(r=>!+r.pubMissing)?-sum(sales,'pub'):null,'vendas.publicidade','data_venda','registrado no líquido');}
   else if(daily.size){paid=metric(sum([...daily.values()],'inv'),'adsDia','data_venda',daily.size===dates.length?'diário informado':'diário com lacunas');paidRevenue=[...daily.values()].every(r=>r.recKnown)?sum([...daily.values()],'rec'):null;}
   else if(full&&alternatives.length){const v=alternatives[0];paid=metric(v.inv,v.source,'competencia','mensal informado');paidRevenue=v.rec;}
   else if(full&&(number(det.Ads_relatorio)!=null||number(legacy.ads)!=null)){paid=metric(number(det.Ads_relatorio)??number(legacy.ads),'apuração mensal','competencia','mensal legado');}
   else paid=metric(null,'não disponível',full?'competencia':'data_venda','pendente');
   // Não interpretar Ads_real (total histórico) como mídia exclusiva.
   let selected=metric(null,'não disponível','data_venda','pendente');
   if(afEmbedded!=null&&(embedded||afEmbedded!==0))selected=metric(afEmbedded,'vendas.afiliados','data_venda','registrado no líquido');
   else if(afDaily.size)selected=metric(sum([...afDaily].map(([date,valor])=>({date,valor})),'valor'),sourceMeta||'afiliadosDia','data_venda','cobrança vinculada');
   else if(charged!=null)selected=metric(charged,sourceMeta,'data_venda','cobrança conciliada');
   else if(full&&estimated!=null)selected=metric(estimated,sourceMeta,'competencia','estimativa mensal');
   else if(full&&afReport.length&&afReport.every(r=>number(r.inv)!=null))selected=metric(sum(afReport,'inv'),'ads.afiliados','competencia','relatório atribuído; conciliação pendente');
   const combined=paid.value!=null&&selected.value!=null?money(paid.value+selected.value):null,partial=paid.status.includes('lacunas');
   const goal=goals.filter(g=>g.emp===o.emp&&g.mkt===o.mkt&&g.mes===o.month).sort((a,b)=>b.revision-a.revision)[0]||null;
   let ap=0,aa=0,prefixPaid=0,prefixAf=0,prefixTotal=0,prefixFat=0;
   const serie=dates.map(date=>{const rs=sales.filter(r=>r.date===date),revenue=rs.length?sum(rs,'fat'):null;
    const media=embedded?(rs.length&&rs.every(r=>!+r.pubMissing)?money(-sum(rs,'pub')):null):daily.get(date)?.inv??null;
    const affiliates=selected.source==='vendas.afiliados'?(rs.length&&rs.every(r=>!+r.afilMissing)?money(-sum(rs,'afil')):null):afDaily.get(date)??null;
    const all=media!=null&&affiliates!=null?money(media+affiliates):null;
    prefixFat+=revenue??0;prefixPaid+=media??0;prefixAf+=affiliates??0;prefixTotal+=all??0;ap+=media==null;aa+=affiliates==null;
    return{date,fat:revenue,midia:media,afiliados:affiliates,total:all,tacos:ratio(media,revenue),percentualTotal:ratio(all,revenue),acumulado:{fat:money(prefixFat),midia:ap?null:money(prefixPaid),afiliados:aa?null:money(prefixAf),total:ap||aa?null:money(prefixTotal),tacos:ap?null:ratio(prefixPaid,prefixFat),percentualTotal:ap||aa?null:ratio(prefixTotal,prefixFat)}};
   });
   operations.push({emp:o.emp,mkt:o.mkt,mes:o.month,periodo:[de,ate],mensalCompleto:full,faturamento:fat,midia:{...paid,receitaAtribuida:paidRevenue,acos:ratio(paid.value,paidRevenue),roas:paid.value>0&&paidRevenue!=null?paidRevenue/paid.value:null,tacos:ratio(paid.value,fat),diasInformados:embedded?serie.filter(r=>r.midia!=null).length:daily.size,alternativas:alternatives},afiliados:{...selected,estimado:full?estimated:null,cobrado:charged,liquidado:settled,receitaAtribuida:full&&afReport.length&&afReport.every(r=>number(r.recAds)!=null)?sum(afReport,'recAds'):null,participacao:ratio(selected.value,fat),taxaEfetiva:null,metadata:metadata?{natureza:metadata.natureza||null,conciliado:metadata.conciliado===true,billing_conciliado:metadata.billing_conciliado===true,status:metadata.status||null,motivo:metadata.motivo||null}:null},consolidado:{value:combined,percentual:ratio(combined,fat),status:combined==null?'incompleto':partial?'parcial':selected.status.includes('estimativa')?'estimado':'informado',legacy:full?number(det.Ads_real):null,legacyRatio:full?number(det.TACOS_real):null,legacyRevenue:full?(number(det.DreFat)??number(det.Faturamento_real)??number(legacy.faturamento)):null,legacyBudget:number(det.Ads_obj),legacyCeiling:number(det.TACOS_obj)==null?null:100*number(det.TACOS_obj)},meta:goal,serie});
  }
  operations.sort((a,b)=>a.emp.localeCompare(b.emp)||a.mkt.localeCompare(b.mkt)||a.mes.localeCompare(b.mes));
  // O relatório de atribuição não comprova que a estimativa/cobrança selecionada tenha o mesmo regime.
  for(const o of operations)if(o.afiliados.source==='ads.afiliados')o.afiliados.taxaEfetiva=ratio(o.afiliados.value,o.afiliados.receitaAtribuida);
  const fat=operations.length?sum(operations,'faturamento'):null,paid=total(operations.map(o=>o.midia.value)),af=total(operations.map(o=>o.afiliados.value)),combined=total(operations.map(o=>o.consolidado.value));
  const allDates=days(q.de,q.ate),serie=allDates.map(date=>{const rs=operations.filter(o=>date>=o.periodo[0]&&date<=o.periodo[1]).map(o=>o.serie.find(r=>r.date===date));return{date,fat:total(rs.map(r=>r.fat)),midia:total(rs.map(r=>r.midia)),afiliados:total(rs.map(r=>r.afiliados)),total:total(rs.map(r=>r.total))};});
  let f=0,p=0,a=0,t=0,mp=false,ma=false,mt=false;for(const r of serie){f+=r.fat??0;p+=r.midia??0;a+=r.afiliados??0;t+=r.total??0;mp||=r.midia==null;ma||=r.afiliados==null;mt||=r.total==null;Object.assign(r,{tacos:ratio(r.midia,r.fat),percentualTotal:ratio(r.total,r.fat),acumulado:{fat:money(f),midia:mp?null:money(p),afiliados:ma?null:money(a),total:mt?null:money(t),tacos:mp?null:ratio(p,f),percentualTotal:mt?null:ratio(t,f)}});}
  return{versao:1,periodo:[q.de,q.ate],escopo:{ponto:q.ponto||'',emp:q.emp||'',mkt:q.mkt||''},operacoes:operations,resumo:{faturamento:fat,midia:paid,afiliados:af,total:combined,tacos:ratio(paid,fat),percentualTotal:ratio(combined,fat),incompleto:combined==null},serie,margem:margin?{...margin,rotulo:'Pós-Ads apurado nas vendas',nota:'Afiliados já incorporados ao líquido não são descontados novamente. Estimativas mensais de afiliados ficam separadas: não alteram esta margem sem conciliação.',publicidadeLeitura:combined,diferencaAds:paid==null||margin.ads==null?null:money(paid-margin.ads)}:null,metodo:'Diário de mídia tem precedência; sem diário, campanha mensal e depois anúncio mensal são alternativas. Mensal só entra em mês inteiro. Afiliados usam cobrança nas vendas, diário conciliado ou estimativa mensal identificada. Não somar estados ou receitas atribuídas. Gaps diários permanecem vazios.',somenteLeitura:true};
 }
 return{model,number,money,ratio,key,operation,days,end};
});
