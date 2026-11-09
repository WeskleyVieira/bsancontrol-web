(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BCForecastAnunciosModelo=api;})(typeof window==='object'?window:this,function(){
 'use strict';
 const DAY=86400000,finite=v=>v!==null&&v!==''&&v!==undefined&&Number.isFinite(+v),round=v=>Math.round(v*100)/100;
 function iso(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(v||'')))return null;const d=new Date(v+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===v?v:null;}
 const stamp=d=>Date.parse(d+'T00:00:00Z'),add=(d,n)=>new Date(stamp(d)+n*DAY).toISOString().slice(0,10),span=(a,b)=>Math.round((stamp(b)-stamp(a))/DAY)+1;
 function dates(a,b){if(!iso(a)||!iso(b)||a>b||span(a,b)>550)return[];return Array.from({length:span(a,b)},(_,i)=>add(a,i));}
 const endMonth=d=>new Date(Date.UTC(+d.slice(0,4),+d.slice(5,7),0)).toISOString().slice(0,10);
 function shiftMonth(d,offset){const y=+d.slice(0,4),m=+d.slice(5,7)-1+offset,last=new Date(Date.UTC(y,m+1,0)).getUTCDate();return new Date(Date.UTC(y,m,Math.min(+d.slice(8,10),last))).toISOString().slice(0,10);}
 function reference(from,to,mode='month',chosen){
  if(mode==='header')return chosen?.length===2?{from:chosen[0],to:chosen[1],label:'Referência do cabeçalho'}:{from:null,to:null,label:'Comparação do cabeçalho não ativada'};
  if(mode==='month-full'){const start=shiftMonth(from.slice(0,7)+'-01',-1);return{from:start,to:endMonth(start),label:'Mês anterior completo'};}
  if(mode==='previous'||from.slice(0,7)!==to.slice(0,7)){const e=add(from,-1);return{from:add(e,1-span(from,to)),to:e,label:'Intervalo anterior de mesma duração'};}
  return{from:shiftMonth(from,-1),to:from.endsWith('-01')&&to===endMonth(to)?endMonth(shiftMonth(from,-1)):shiftMonth(to,-1),label:'Mesmo recorte do mês anterior'};
 }
 function stats(values){const sorted=values.slice().sort((a,b)=>a-b),len=values.length,mean=len?values.reduce((a,b)=>a+b,0)/len:0,median=len?(sorted[Math.floor((len-1)/2)]+sorted[Math.ceil((len-1)/2)])/2:0;return{mean,median,active:values.filter(v=>v>0).length};}
 const methods={mean:'Média diária do recorte',recent:'Média dos últimos 7 dias',weekday:'Ritmo por dia da semana'};
 function predict(values,calendar,future,method){
  const rate=stats(method==='recent'?values.slice(-7):values).mean;
  if(method!=='weekday')return future.map(()=>Math.max(0,rate));
  const buckets=Array.from({length:7},()=>[]);values.slice(-28).forEach((v,i)=>buckets[new Date(stamp(calendar[calendar.length-Math.min(28,values.length)+i])).getUTCDay()].push(v));
  return future.map(d=>{const b=buckets[new Date(stamp(d)).getUTCDay()];return Math.max(0,b.length?stats(b).mean:rate);});
 }
 // Origem móvel: somente dados anteriores a cada corte entram no treino.
 // WAPE fica indisponível quando o realizado dos testes é zero; MAE continua válido.
 function fit(values,calendar,method='auto'){
  const candidates=['mean','recent',...(values.length>=49?['weekday']:[])],folds=[21,14,7].map(n=>values.length-n).filter(n=>n>=14);
  const scores=candidates.map(key=>{let error=0,actual=0,count=0;for(const cut of folds){const expected=predict(values.slice(0,cut),calendar.slice(0,cut),calendar.slice(cut,cut+7),key);for(let i=0;i<expected.length;i++){error+=Math.abs(values[cut+i]-expected[i]);actual+=Math.abs(values[cut+i]);count++;}}return{key,mae:count?error/count:null,wape:actual?100*error/actual:null,folds:folds.length};});
  let key=method==='auto'&&folds.length===3?scores.slice().sort((a,b)=>a.mae-b.mae||candidates.indexOf(a.key)-candidates.indexOf(b.key))[0].key:method==='auto'?'mean':method;
  if(!Object.hasOwn(methods,key)||key==='weekday'&&values.length<28)key='mean';
  const score=scores.find(s=>s.key===key);return{key,label:methods[key],automatic:method==='auto',validation:folds.length===3?score:null,scores:folds.length===3?scores:[],...stats(values)};
 }
 function route(projected,expected,tolerance=5){if(!finite(projected)||!finite(expected)||expected<=0)return{key:'no-reference',label:'Sem referência',tone:'neutral',percent:null,gap:null};const percent=100*(projected-expected)/expected;return{key:percent< -tolerance-1e-9?'below':percent>tolerance+1e-9?'above':'on-track',label:percent< -tolerance-1e-9?'Abaixo do esperado':percent>tolerance+1e-9?'Acima do esperado':'No ritmo esperado',tone:percent< -tolerance-1e-9?'bad':percent>tolerance+1e-9?'good':'info',percent,gap:round(projected-expected)};}
 function model(input,{from,to,today,dataThrough,emp,mkt,macro=false,mode='anuncio',horizon='month',referenceMode='month',chosenReference,metric='fat',method='auto',growth=0,variation=20,tolerance=5}={}){
  if(macro)mode='sku';
  if(!iso(from)||!iso(to)||from>to||span(from,to)>180||!iso(today))throw Error('Selecione um período válido de até 180 dias.');
  if(!['fat','qtd'].includes(metric)||!['anuncio','sku'].includes(mode)||!['month','7','30'].includes(String(horizon))||!finite(growth)||growth< -100||growth>500||!finite(variation)||variation<0||variation>100)throw Error('Revise os parâmetros do cenário.');
  const eligible=input.filter(r=>(macro?(!emp||r.emp===emp)&&(!mkt||r.mkt===mkt):r.emp===emp&&r.mkt===mkt)&&iso(r.date)),limit=[to,add(today,-1)].sort()[0],last=eligible.filter(r=>r.date<=limit).map(r=>r.date).sort().pop(),through=iso(dataThrough)?[dataThrough,limit].sort()[0]:last,asof=through&&through>=from?through:null,ref=reference(from,asof&&from.slice(0,7)===to.slice(0,7)&&to!==endMonth(to)?asof:to,referenceMode,chosenReference);
  const referenceValid=!!iso(ref.from)&&!!iso(ref.to)&&ref.from<=ref.to&&ref.to<from&&span(ref.from,ref.to)<=366;
  if(!asof)return{empty:true,from,to,asof:null,reference:ref,items:[],reason:'Não há data de vendas disponível no recorte para calcular o ritmo.'};
  const calendar=dates(from,asof),end=horizon==='month'?endMonth(asof):add(asof,+horizon),future=dates(add(asof,1),end),full=calendar.concat(future),refDates=referenceValid?dates(ref.from,ref.to):[],operationDays=new Set(eligible.filter(r=>r.date>=from&&r.date<=asof).map(r=>r.date)),referenceDays=new Set(eligible.filter(r=>referenceValid&&r.date>=ref.from&&r.date<=ref.to).map(r=>r.date));
  const groups=new Map();let missingIdentity=0,missingRevenue=0;
  for(const r of eligible){if(!['venda','venda_com_troca'].includes(r.stat))continue;const current=r.date>=from&&r.date<=asof,previous=referenceValid&&r.date>=ref.from&&r.date<=ref.to;if(!current&&!previous)continue;
   const id=String(r.anuncio||'').trim(),sku=String(r.sku||'').trim(),key=mode==='sku'?(sku?'sku:'+sku:null):(id?'id:'+id:sku?'sem-id:'+sku:null);
   if(!key){if(current){missingIdentity++;missingRevenue+=finite(r.fat)?+r.fat:0;}continue;}
   if(!groups.has(key))groups.set(key,{key,mode,anuncio:mode==='anuncio'?id:'',sku:mode==='sku'?sku:'',titulo:String(r.tit||sku||id),skus:new Set(),anuncios:new Set(),operations:new Map(),days:new Map(),previous:new Map(),currentRows:0,referenceRows:0});
   const g=groups.get(key);if(id)g.anuncios.add(id);if(sku)g.skus.add(sku);if(current){g.currentRows++;if(r.tit)g.titulo=String(r.tit);}else g.referenceRows++;
   const opKey=JSON.stringify([r.emp,r.mkt,r.ponto||'']);if(!g.operations.has(opKey))g.operations.set(opKey,{emp:r.emp,mkt:r.mkt,ponto:r.ponto||'',observed:{fat:0,qtd:0},reference:{fat:0,qtd:0}});const op=g.operations.get(opKey),tot=current?op.observed:op.reference;tot.fat+=finite(r.fat)?+r.fat:0;tot.qtd+=finite(r.qtd)?+r.qtd:0;
   const map=current?g.days:g.previous,v=map.get(r.date)||{fat:0,qtd:0,invalidFat:false,invalidQty:false};v.invalidFat||=!finite(r.fat)||+r.fat<0;v.invalidQty||=!finite(r.qtd)||+r.qtd<0;v.fat+=finite(r.fat)?+r.fat:0;v.qtd+=finite(r.qtd)?+r.qtd:0;map.set(r.date,v);
  }
  const refHasRecords=referenceDays.size>0;
  const items=[...groups.values()].map(g=>{
   const daily=calendar.map(d=>g.days.get(d)||{fat:0,qtd:0}),old=refDates.map(d=>g.previous.get(d)||{fat:0,qtd:0}),invalid=daily.some(d=>d.invalidFat||d.invalidQty),oldInvalid=old.some(d=>d.invalidFat||d.invalidQty),known=g.referenceRows>0&&refHasRecords&&!oldInvalid;
   const observed={fat:round(daily.reduce((s,d)=>s+d.fat,0)),qtd:daily.reduce((s,d)=>s+d.qtd,0)},fits=Object.fromEntries(['fat','qtd'].map(k=>[k,fit(daily.map(d=>d[k]),calendar,method)])),forecast=Object.fromEntries(['fat','qtd'].map(k=>[k,predict(daily.map(d=>d[k]),calendar,future,fits[k].key)]));
   const projected={fat:invalid?null:round(observed.fat+forecast.fat.reduce((s,v)=>s+v,0)),qtd:invalid?null:observed.qtd+forecast.qtd.reduce((s,v)=>s+v,0)},rates={fat:known?old.reduce((s,d)=>s+d.fat,0)/refDates.length*(1+growth/100):null,qtd:known?old.reduce((s,d)=>s+d.qtd,0)/refDates.length*(1+growth/100):null},expected=Object.fromEntries(['fat','qtd'].map(k=>[k,rates[k]==null?null:(k==="fat"?round(rates[k]*full.length):rates[k]*full.length)])),expectedToDate=Object.fromEntries(['fat','qtd'].map(k=>[k,rates[k]==null?null:(k==="fat"?round(rates[k]*calendar.length):rates[k]*calendar.length)])),status=route(projected[metric],expected[metric],tolerance);
   let cumulative={fat:0,qtd:0};const series=full.map((date,i)=>{const past=i<calendar.length,index=i-calendar.length,v=past?daily[i]:null,step=past?null:{fat:forecast.fat[index],qtd:forecast.qtd[index]};for(const k of ['fat','qtd'])cumulative[k]+=past?v[k]:step[k];return{date,past,observed:past?{fat:operationDays.has(date)?v.fat:null,qtd:operationDays.has(date)?v.qtd:null}:null,future:step,cumulative:{...cumulative},expected:rates[metric],expectedCumulative:rates[metric]==null?null:rates[metric]*(i+1)};});
   const score=fits[metric],quality=invalid?'Valores a conferir':calendar.length<7?'Base curta':score.active<3?'Vendas esparsas':operationDays.size<calendar.length?'Conferir cobertura':score.validation?'Método comparado no histórico':'Projeção de ritmo';
   return{...g,skus:[...g.skus],anuncios:[...g.anuncios],operations:[...g.operations.values()].map(op=>({...op,observed:{fat:round(op.observed.fat),qtd:op.observed.qtd},reference:{fat:round(op.reference.fat),qtd:op.reference.qtd}})),days:undefined,previous:undefined,observed,projected,expected,expectedToDate,rates,series,fit:score,status,quality,invalid,referenceKnown:known,activeDays:score.active,lower:projected[metric]==null?null:observed[metric]+Math.max(0,(projected[metric]-observed[metric])*(1-variation/100)),upper:projected[metric]==null?null:observed[metric]+Math.max(0,(projected[metric]-observed[metric])*(1+variation/100)),neededPerDay:known&&future.length?Math.max(0,(expected[metric]-observed[metric])/future.length):null};
  }).sort((a,b)=>(b.projected[metric]??-Infinity)-(a.projected[metric]??-Infinity)||a.key.localeCompare(b.key));
  return{empty:items.length===0,from,to,asof,end,calendar,future,full,reference:ref,referenceValid,referenceReason:referenceMode==='header'&&!chosenReference?'Ative Comparar períodos no menu Período e aplique as datas da referência.':referenceValid?refHasRecords?'':'Sem registros da operação na referência.':'Escolha uma referência anterior ao início do período de vendas.',metric,mode,method,growth,variation,tolerance,operationDays:operationDays.size,calendarDays:calendar.length,referenceDays:referenceDays.size,items,missingIdentity,missingRevenue:round(missingRevenue)};
 }
 function summary(model,items=model.items){
  const k=model.metric,comparable=items.filter(o=>o.referenceKnown&&o.projected[k]!=null),sum=(key,rows=items)=>rows.reduce((s,o)=>s+(o[key]?.[k]||0),0),observed=sum('observed'),projected=items.some(o=>o.projected[k]==null)?null:sum('projected'),expected=comparable.length?sum('expected',comparable):null,comparisonProjected=comparable.length?sum('projected',comparable):null;
  const counts=Object.fromEntries(['below','on-track','above','no-reference'].map(key=>[key,items.filter(o=>o.status.key===key).length]));
  return{count:items.length,observed,projected,expected,comparisonProjected,observedComparable:sum('observed',comparable),expectedToDate:comparable.length?sum('expectedToDate',comparable):null,comparable:comparable.length,counts,status:route(comparisonProjected,expected,model.tolerance),lower:items.some(o=>o.lower==null)?null:items.reduce((s,o)=>s+o.lower,0),upper:items.some(o=>o.upper==null)?null:items.reduce((s,o)=>s+o.upper,0)};
 }
 function series(model,items=model.items,{comparable=false}={}){const rows=comparable?items.filter(o=>o.referenceKnown&&o.projected[model.metric]!=null):items,k=model.metric;return model.full.map((date,i)=>({date,past:i<model.calendar.length,actual:i<model.calendar.length&&rows.length&&rows.every(o=>o.series[i].observed?.[k]!=null)?rows.reduce((s,o)=>s+o.series[i].observed[k],0):null,cumulative:i<model.calendar.length&&rows.length?rows.reduce((s,o)=>s+o.series[i].cumulative[k],0):null,projected:i>=model.calendar.length&&rows.length&&!rows.some(o=>o.projected[k]==null)?rows.reduce((s,o)=>s+o.series[i].future[k],0):null,projectedCumulative:i>=model.calendar.length&&rows.length&&!rows.some(o=>o.projected[k]==null)?rows.reduce((s,o)=>s+o.series[i].cumulative[k],0):null,expected:rows.length&&rows.every(o=>o.referenceKnown)?rows.reduce((s,o)=>s+o.rates[k],0):null,expectedCumulative:rows.length&&rows.every(o=>o.referenceKnown)?rows.reduce((s,o)=>s+o.series[i].expectedCumulative,0):null}));}
 return{iso,add,span,dates,endMonth,shiftMonth,reference,stats,predict,fit,route,model,summary,series};
});
