/* bc-ger-abertura-v2: reaplica o índice quando DETALHE é substituído. */
const _GER_AB_NUM=['pcheio','desc','comis','tarif','freteC','reemb','afil','pub','flex','motoboy','fatura','subs','copart','vapt','repasse'];
let _gerAberturas=new Map(),_gerAberturaIdentidade='';
function _gerIdentidadeAbertura(){const user=typeof bcNavSession==='function'?bcNavSession():null;return JSON.stringify([user?.id,user?.perfil,user?.revogacao,user?.restricoes,typeof BCAUTH==='undefined'?'':BCAUTH.token,window._vndGer||0]);}
function _gerGaranteAbertura(emp,mkt,force=false){
 if(!emp||!mkt||typeof authFetch!=='function'||typeof DETALHE==='undefined')return;
 const identity=_gerIdentidadeAbertura();
 if(identity!==_gerAberturaIdentidade){_gerAberturaIdentidade=identity;_gerAberturas.clear();_gerAbCache={};}
 const key=emp+'||'+mkt,entry=_gerAberturas.get(key);
 const apply=index=>{for(const r of DETALHE){if(r.emp!==emp||r.mkt!==mkt)continue;const a=index.get([r.ped||'',r.sku||'',r.date,r.mkt||''].join('|'));if(!a)continue;for(const c of _GER_AB_NUM)r[c]=Object.hasOwn(a,c)?a[c]:0;r.ent=a.ent??null;r.ads=a.ads??null;r.aberturaConfirmada=true;}};
 if(!force&&entry&&(entry.loading||Date.now()-entry.time<60000)){if(entry.index)apply(entry.index);return entry.promise;}
 const state={loading:true,time:Date.now()};_gerAberturas.set(key,state);_gerAbCache[key]='carregando';
 state.promise=(async()=>{try{const r=await authFetch('/api/abertura?'+new URLSearchParams({emp,mkt}),{cache:'no-store'}),data=await r.json();if(identity!==_gerIdentidadeAbertura()||_gerAberturas.get(key)!==state)return;if(!r.ok||!Array.isArray(data.abertura))throw Error(data.erro||'Não foi possível consultar a abertura.');state.index=new Map(data.abertura.filter(a=>a&&typeof a.k==='string').map(a=>[a.k,a]));apply(state.index);_gerAbCache[key]='ok';}catch(e){if(identity!==_gerIdentidadeAbertura()||_gerAberturas.get(key)!==state)return;_gerAbCache[key]='erro';}finally{state.loading=false;if(identity===_gerIdentidadeAbertura()&&_gerAberturas.get(key)===state&&typeof activePage!=='undefined'&&activePage==='gerencial'&&GER_OP===key)renderGerencial();}})();return state.promise;
}
