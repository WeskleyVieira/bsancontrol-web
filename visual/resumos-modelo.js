(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('../publicidade-cobertura'):root.BCPublicidadeCobertura);if(typeof module==='object'&&module.exports)module.exports=api;else root.BCResumos=api;})(typeof window==='object'?window:this,function(P){
 'use strict';const key=(emp,mkt)=>JSON.stringify([emp,mkt]);
 function variacao(atual,anterior,presente){if(!presente||atual==null||anterior==null)return null;return{valor:atual-anterior,percentual:anterior===0?null:(atual-anterior)/Math.abs(anterior)*100};}
 const amount=v=>Math.round((Number(v)||0)*100)/100;
 function overview(rows,previous,sum,revenue){
  const total=rows.length?sum(rows):null,old=previous?.length?sum(previous):null,fallback=!!total?total._semFatMetas:false;
  const group=list=>{const map=new Map();for(const r of list||[]){const k=key(r.emp,r.mkt);if(!map.has(k))map.set(k,[]);map.get(k).push(r);}return map;},groups=group(rows),prev=group(previous);
  const comparable=!!old&&!!total&&!!old._semFatMetas===!!total._semFatMetas;
  // Ausência na referência não comprova operação sem vendas.
  const ops=[...groups.entries()].map(([k,list])=>{const t=sum(list),fat=fallback?t.fat:revenue(t),b=prev.has(k)?sum(prev.get(k)):null;
   return{emp:list[0].emp,mkt:list[0].mkt,fat,mc:t.mc,qtd:t.qtd,pct:fat?t.mc/fat*100:null,
    change:comparable&&b?{fat:amount(fat-(fallback?b.fat:revenue(b))),mc:amount(t.mc-b.mc)}:null};
  }).sort((a,b)=>b.fat-a.fat||a.emp.localeCompare(b.emp));
  return{total,old,fat:total?revenue(total):null,pct:total&&revenue(total)?total.mc/revenue(total)*100:null,fallback,ops,comparable,
   semReferencia:ops.filter(o=>!o.change).length,foraAtual:[...prev.keys()].filter(k=>!groups.has(k)).length,dates:[...new Set(rows.map(r=>r.date))].sort()};
 }
 function evolucao(fat,mc,oldFat,oldMc){
  const f=amount(fat-oldFat),m=amount(mc-oldMc);
  return{fat:f,mc:m,tipo:f>0&&m<0?'cresce-perde-margem':f>0&&m>0?'cresce-com-margem':f<0&&m>0?'menos-venda-mais-margem':f<0&&m<0?'venda-margem-caem':'misto',aindaNegativa:mc<0};
 }
 function sinaisOverview(M){
  if(!M.total)return[];const out=[];
  if(M.comparable)out.push({tipo:'evolucao',dados:evolucao(M.fat,M.total.mc,M.old._semFatMetas?M.old.fat:M.old.fatMetas,M.old.mc)});
  const comparable=M.ops.filter(o=>o.change),down=comparable.filter(o=>o.change.mc<0).sort((a,b)=>a.change.mc-b.change.mc)[0],up=comparable.filter(o=>o.change.mc>0).sort((a,b)=>b.change.mc-a.change.mc)[0];
  if(down)out.push({tipo:'queda-operacao',op:down});if(up)out.push({tipo:'ganho-operacao',op:up});
  const neg=M.ops.filter(o=>o.mc<0).sort((a,b)=>a.mc-b.mc);if(neg.length)out.push({tipo:'negativas',quantidade:neg.length,valor:amount(neg.reduce((s,o)=>s+o.mc,0)),op:neg[0]});
  if(!M.comparable&&M.ops.length){const leader=[...M.ops].sort((a,b)=>b.mc-a.mc)[0];if(leader.mc>0)out.unshift({tipo:'contribuicao',op:leader,participacao:M.total.mc>0?100*leader.mc/M.total.mc:null});}
  return out;
 }
 function pedidos(linhas){
  const ids=new Set();let centavos=0,semId=0;
  for(const r of linhas){const id=String(r.ped??'').trim();if(!id){semId++;continue;}ids.add(JSON.stringify([r.emp,r.mkt,id]));centavos+=Math.round((+r.fat||0)*100);}
  const receita=centavos/100;
  return{quantidade:ids.size||null,ticket:ids.size?receita/ids.size:null,receita,semId,linhas:linhas.length,cobertura:linhas.length?100*(linhas.length-semId)/linhas.length:null};
 }
 function anuncios(linhas){
  const map=new Map();let semId=0,fatSemId=0;
  for(const r of linhas){const ad=String(r.anuncio??'').trim(),sku=String(r.sku??'').trim();if(!ad&&!sku){semId++;fatSemId+=+r.fat||0;continue;}const k=ad?'anuncio:'+ad:'sku:'+sku;if(!map.has(k))map.set(k,{id:ad||sku,origem:ad?'anúncio':'SKU sem ID de anúncio',titulo:String(r.tit||sku||ad),fat:0,mc:0});const o=map.get(k);o.fat+=+r.fat||0;o.mc+=+r.mc||0;}
  const list=[...map.values()].sort((a,b)=>b.fat-a.fat),negative=list.filter(o=>o.mc<0).sort((a,b)=>a.mc-b.mc),top=list.slice(0,5),fat=linhas.reduce((n,r)=>n+(+r.fat||0),0);
  return{grupos:list.length,negativos:negative.length,margemNegativa:amount(negative.reduce((n,o)=>n+o.mc,0)),pior:negative[0]||null,top:top.length,participacao:fat>0?100*top.reduce((n,o)=>n+o.fat,0)/fat:null,semId,fatSemId,porSku:list.filter(o=>o.origem!=='anúncio').length};
 }
 function depoisAds(A,ads,baseFn){const base=A.linhas.reduce((n,r)=>n+baseFn(r.mkt,+r.fat||0,+r.liq||0),0);return{valor:A.mc-ads,base,percentual:base?100*(A.mc-ads)/base:null};}
 function meta(monthRows,goalRows,target,sum,revenue){const keys=new Set(goalRows.map(r=>String(r.operacao||''))),all=new Set(monthRows.map(r=>r.emp+' · '+r.mkt)),rows=monthRows.filter(r=>keys.has(r.emp+' · '+r.mkt));const actual=rows.length?revenue(sum(rows)):null;return{target,actual,percentual:actual!=null&&target>0?actual/target*100:null,comMeta:keys.size,semMeta:[...all].filter(k=>!keys.has(k)).length};}
 function coberturaAds({emp,mkt,from,to,ads=[],camp=[],dia=[]}){
  if(/tik\s*tok/i.test(mkt))return{tipo:'liquido',completude:'nao-informada',meses:[],texto:'Neste canal, a publicidade já incluída no líquido não é descontada novamente. A composição do líquido deve ser conferida na fonte.'};
  const eligible=a=>a.emp===emp&&a.mkt===mkt&&!/afiliad/i.test(String(a.fonte||'')+' '+String(a.campanha||'')),months=[];
  let d=new Date(from.slice(0,7)+'-01T12:00:00Z');const end=to.slice(0,7);for(let i=0;i<240&&d.toISOString().slice(0,7)<=end;i++){months.push(d.toISOString().slice(0,7));d.setUTCMonth(d.getUTCMonth()+1);}
  const meses=months.map(m=>{const records=dia.filter(a=>eligible(a)&&String(a.data||'').slice(0,7)===m),days=[...new Set(records.map(a=>String(a.data).slice(0,10)))].filter(v=>v>=from&&v<=to).sort(),monthly=[...ads,...camp].some(a=>eligible(a)&&String(a.comp||'').slice(0,7)===m),weights=records.reduce((n,a)=>n+(+a.inv||0),0)>0;
   const zero=!monthly&&!weights&&P?.semAds(emp,mkt,m);return{mes:m,registrado:monthly||!!zero,modo:zero?'sem-ads-confirmado':!monthly?'ausente':weights?'pesos-diarios':'rateio-faturamento',dias:days.length,primeiro:days[0]||null,ultimo:days.at(-1)||null};});
  const missing=meses.filter(m=>!m.registrado).map(m=>m.mes),daily=meses.filter(m=>m.modo==='pesos-diarios').length,rateio=meses.filter(m=>m.modo==='rateio-faturamento').length;
  const semAds=meses.filter(m=>m.modo==='sem-ads-confirmado');const texto=semAds.length===meses.length?'Sem Ads confirmado nas competências consultadas: o Pós-Ads é igual ao Pré-Ads.':missing.length?'Sem registro adicional de Ads em '+missing.join(', ')+'. Ausência de registro não confirma gasto zero.':daily&&rateio?'Ads mensal distribuído por pesos diários em parte dos meses e por faturamento nos demais.':daily?'Ads mensal distribuído pelos pesos da série diária disponível; o valor exibido por dia é uma alocação do total mensal.':'Ads mensal distribuído pelo faturamento de cada dia; o valor diário é um rateio.';
  return{tipo:missing.length?'incompleto':semAds.length===meses.length?'sem-ads':daily&&rateio?'misto':daily?'diario':'rateio',faltantes:missing,meses,completude:'nao-informada',texto:texto+' A carga não comprova cobertura completa da coleta. Afiliados já incluídos no líquido não são descontados novamente.'};
 }
 return{variacao,overview,sinaisOverview,evolucao,depoisAds,pedidos,anuncios,meta,coberturaAds,key};
});
