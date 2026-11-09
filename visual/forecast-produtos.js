/* Forecast macro por SKU: leitura agregada, sem alterar metas ou registros. */
(function(){'use strict';
 const cache=new Map(),pending=new Map();let mounted=null,identity='';
 function who(){const u=bcNavSession();return JSON.stringify([u?.id,u?.perfil,u?.restricoes,window._vndGer||0]);}
 const engine=BCForecastCriarMacro({host:()=>mounted,active:()=>!!mounted?.isConnected,source(q,refresh){
  const session=who();if(identity!==session){identity=session;cache.clear();for(const p of pending.values())p.controller.abort();pending.clear();}
  const params={de:q.from,ate:q.to,emp:q.emp,mkt:q.mkt,ponto:q.ponto,referencia:q.reference};if(q.reference==='header'&&q.chosen){params.refDe=q.chosen[0];params.refAte=q.chosen[1];}
  const key=JSON.stringify([session,params]),saved=cache.get(key);if(saved&&Date.now()-saved.time<60000){if(saved.error){const p=document.createElement('p');p.className='fc-warning';p.textContent=saved.error;const b=document.createElement('button');b.type='button';b.className='sum-button';b.textContent='Tentar novamente';b.onclick=()=>{cache.delete(key);refresh();};mounted.append(p,b);return{error:true};}return saved.data;}
  if(!painelOnline()){const rows=DETALHE.filter(r=>(!q.emp||r.emp===q.emp)&&(!q.mkt||r.mkt===q.mkt)&&(!q.ponto||r.ponto===q.ponto)),hoje=_hojeCalendario(),limit=[q.to,BCForecastAnunciosModelo.add(hoje,-1)].sort()[0],corte=rows.filter(r=>['venda','venda_com_troca'].includes(r.stat)&&r.date>=q.from&&r.date<=limit).map(r=>r.date).sort().pop();return{rows,hoje,corte};}
  if(!pending.has(key)){const controller=new AbortController(),node=mounted,p={controller};pending.set(key,p);const timer=setTimeout(()=>controller.abort(),30000);authFetch('/api/resultados/forecast-produtos?'+new URLSearchParams(params),{signal:controller.signal,cache:'no-store'}).then(async r=>{const data=await r.json();if(!r.ok)throw Error(data.erro||'Não foi possível consultar os produtos.');return data;}).then(data=>{if(who()===session&&pending.get(key)===p)cache.set(key,{time:Date.now(),data});}).catch(e=>{if(who()===session&&pending.get(key)===p)cache.set(key,{time:Date.now(),error:e.name==='AbortError'?'A consulta demorou mais que o esperado. Tente novamente ou reduza o intervalo.':e.message});}).finally(()=>{clearTimeout(timer);if(pending.get(key)===p){pending.delete(key);if(mounted===node&&node.isConnected&&who()===session)refresh();}if(cache.size>8)cache.delete(cache.keys().next().value);});}
  return null;
 }});
 window.BCForecastProdutos={render(node,force=false){mounted=node;if(force)cache.clear();engine.render();},dispose(){engine.dispose();mounted=null;for(const p of pending.values())p.controller.abort();pending.clear();}};
})();
