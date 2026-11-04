/* Resultados: modelos puros, sem acesso à rede ou alteração das fontes. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BCResultadosModelo = api;
})(typeof window === 'object' ? window : this, function() {
  'use strict';
  const n = v => v == null || String(v).trim() === '' || !Number.isFinite(Number(v)) ? null : Number(v);
  const key = (...v) => JSON.stringify(v);
  const date = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v)) && Number.isFinite(Date.parse(v + 'T12:00:00Z')) && new Date(v + 'T12:00:00Z').toISOString().slice(0,10) === v;
  const iso = d => d.toISOString().slice(0,10), parse = d => new Date(d + 'T12:00:00Z');
  const add = (d, amount) => iso(new Date(+parse(d) + amount * 864e5));
  const span = (a,b) => date(a) && date(b) && a <= b ? Math.round((+parse(b)-parse(a))/864e5)+1 : 0;
  const monthEnd = m => iso(new Date(Date.UTC(+m.slice(0,4), +m.slice(5,7), 0, 12)));
  function shiftMonth(m, amount) { return iso(new Date(Date.UTC(+m.slice(0,4), +m.slice(5,7)-1+amount, 1, 12))).slice(0,7); }
  function months(a,b) { const out=[]; for(let m=a.slice(0,7); m<=b.slice(0,7) && out.length<1200; m=shiftMonth(m,1)) out.push(m); return out; }
  const previous = (a,b) => span(a,b) ? [add(a,-span(a,b)),add(a,-1)] : null;
  const fields = ['n_all','n_fin','qtd','qtdMissing','fat','liq','ctp','imp','mc','mcReal','realMissing','base','pub','afil','mediaMissing','devN','devFat','devMc','ped','semId','fatIdent'];
  function blank() { return Object.fromEntries(fields.map(k=>[k,0])); }
  function sum(rows) {
    if(!rows.length) return null;
    const o=blank(); for(const r of rows) for(const k of fields) o[k]+=n(r[k])??0;
    o.extra=rows.reduce((s,r)=>s+(n(r.extra)??0),0);
    o.embedded=rows.reduce((s,r)=>s+(n(r.embedded)??0),0);
    o.before=o.mc+o.embedded; o.after=rows.some(r=>r.adsMissing)?null:o.mc-o.extra;
    o.percent=o.base ? o.mc/o.base*100 : null;
    o.percentAfter=o.base&&o.after!=null ? o.after/o.base*100 : null;
    o.percentBefore=o.base ? o.before/o.base*100 : null;
    o.ticket=o.ped>0 && !rows.some(r=>r.ordersUnknown) ? o.fatIdent/o.ped : null;
    o.ordersUnknown=rows.some(r=>r.ordersUnknown);
    if(o.ordersUnknown)o.ped=null;
    o.adsMissing=rows.some(r=>r.adsMissing);
    o.mediaOnly=rows.every(r=>r.mediaOnly);
    if(o.n_all===0&&o.mediaOnly){for(const k of ['fat','liq','ctp','imp','mc','mcReal','base','qtd','ped','ticket','before','after','percent','percentAfter','percentBefore'])o[k]=null;}
    return o;
  }
  function difference(current, prior) {
    return current==null||prior==null ? null : {value:current-prior,percent:prior===0?null:(current-prior)/Math.abs(prior)*100};
  }
  function lineValue(r) {
    const financial = ['venda','venda_com_troca'].includes(String(r.stat??r.status??'').trim().toLowerCase());
    const out=blank(), value=(a,b)=>n(r[a]??r[b])??0;
    out.n_all=1;
    if(financial) {
      out.n_fin=1; out.qtd=n(r.qtd)??0; out.qtdMissing=n(r.qtd)==null||out.qtd<0?1:0;
      out.fat=value('fat','receita'); out.liq=value('liq','liquido'); out.ctp=value('ctp','ctp'); out.imp=value('imp','imposto'); out.mc=value('mc','mc_comissao');
      const real=r.mcRealInformada===false?null:n(r.mcReal??r.mcr??r.mc_real);out.mcReal=real??out.mc;out.realMissing=real==null?1:0;
      out.base=/temu/i.test(r.mkt??r.canal)?out.liq:out.fat;
      out.pub=value('pub','publicidade');out.afil=value('afil','afiliados');out.mediaMissing=n(r.pub??r.publicidade)==null||n(r.afil??r.afiliados)==null?1:0;
      const id=String(r.ped??r.pedido??'').trim();out.ped=id?1:0;out.semId=id?0:1;out.fatIdent=id?out.fat:0;
    } else if(String(r.stat??r.status).trim().toLowerCase()==='devolvida') {out.devN=1;out.devFat=value('fat','receita');out.devMc=value('mc','mc_comissao');}
    return out;
  }
  function aggregateLines(lines, ranges, scope={}) {
    const from=ranges.map(r=>r.from).sort()[0], to=ranges.map(r=>r.to).sort().at(-1), start=from.slice(0,7)+'-01', end=monthEnd(to.slice(0,7));
    const included=lines.filter(r=>date(r.date)&&(!scope.emp||r.emp===scope.emp)&&(!scope.mkt||r.mkt===scope.mkt)&&(!scope.ponto||r.ponto===scope.ponto));
    function group(rows, daily=false) {
      const map=new Map();for(const r of rows) {const k=key(r.emp,r.mkt,daily?r.date:''),g=map.get(k)||{emp:r.emp,mkt:r.mkt,date:daily?r.date:'',...blank(),ids:new Set()};const v=lineValue(r);for(const f of fields) if(f!=='ped')g[f]+=v[f];if(v.n_fin&&v.ped)g.ids.add(String(r.ped??r.pedido).trim());map.set(k,g);}
      return [...map.values()].map(({ids,...r})=>({...r,ped:ids.size}));
    }
    const dates=included.filter(r=>lineValue(r).n_fin).map(r=>r.date).sort();
    const allPoints=scope.ponto?aggregateLines(lines,ranges,{...scope,ponto:''}).dias:null;
    return {faixas:ranges.map(r=>({...r,ops:group(included.filter(v=>v.date>=r.from&&v.date<=r.to))})),dias:group(included.filter(r=>r.date>=start&&r.date<=end),true),midiaBase:allPoints,escopo:scope,base:[start,end],alcance:{primeira:dates[0]||null,ultima:dates.at(-1)||null},local:true};
  }
  function aggregateRows(rows,ranges,scope={}) {
    const from=ranges.map(r=>r.from).sort()[0],to=ranges.map(r=>r.to).sort().at(-1),filtered=rows.filter(r=>date(r.date)&&(!scope.emp||r.emp===scope.emp)&&(!scope.mkt||r.mkt===scope.mkt)&&(!scope.ponto||r.ponto===scope.ponto));
    const fallback=filtered.some(r=>n(r.fatMetas)==null);
    const dias=filtered.map(r=>{const o={emp:r.emp,mkt:r.mkt,date:r.date,...blank(),ordersUnknown:true};for(const k of ['fat','liq','ctp','imp','mc','qtd','pub','afil'])o[k]=n(r[k])??0;o.fat=fallback?o.fat:+r.fatMetas;o.base=/temu/i.test(r.mkt)?o.liq:o.fat;o.mcReal=n(r.mcReal)??o.mc;o.realMissing=n(r.mcReal)==null?1:0;o.n_all=1;o.n_fin=(n(r.ped)??0);o.semId=o.n_fin;return o;});
    return {faixas:ranges.map(r=>{const map=new Map();for(const d of dias.filter(d=>d.date>=r.from&&d.date<=r.to)){const k=key(d.emp,d.mkt);if(!map.has(k))map.set(k,[]);map.get(k).push(d);}return {...r,ops:[...map.values()].map(ds=>({...sum(ds),emp:ds[0].emp,mkt:ds[0].mkt,ordersUnknown:true}))};}),dias,midiaBase:scope.ponto?aggregateRows(rows,ranges,{...scope,ponto:''}).dias:null,escopo:scope,base:[from,to],local:true,legacyAggregate:true,fallback};
  }
  function media(data,{ads=[],camp=[],dia=[]}={}) {
    if(data.margensDiarias||data.margensErro){const mapped=new Map(data.dias.map(r=>[key(r.emp,r.mkt,r.date),{...r,extra:0,embedded:/tik\s*tok/i.test(r.mkt)?-(r.pub||0):0,adsMissing:true}]));for(const r of data.margensDiarias||[]){const k=key(r.emp,r.mkt,r.date),o=mapped.get(k)||{...blank(),emp:r.emp,mkt:r.mkt,date:r.date,mediaOnly:true};Object.assign(o,{extra:r.extra,embedded:r.embeddedAds,adsMissing:r.missing,adsMode:r.coverage});mapped.set(k,o);}const dias=[...mapped.values()],faixas=data.faixas.map(range=>{const relevant=dias.filter(r=>r.date>=range.from&&r.date<=range.to),ops=new Map(range.ops.map(r=>[key(r.emp,r.mkt),r]));for(const d of relevant)if(d.extra&&!ops.has(key(d.emp,d.mkt)))ops.set(key(d.emp,d.mkt),{...blank(),emp:d.emp,mkt:d.mkt,mediaOnly:true});for(const w of data.margensNaoAlocadas||[])if(w.month>=range.from.slice(0,7)&&w.month<=range.to.slice(0,7)&&!ops.has(key(w.emp,w.mkt)))ops.set(key(w.emp,w.mkt),{...blank(),emp:w.emp,mkt:w.mkt,mediaOnly:true});return{...range,ops:[...ops.values()].map(o=>{const rs=relevant.filter(d=>d.emp===o.emp&&d.mkt===o.mkt);return{...o,extra:rs.reduce((s,r)=>s+(r.extra||0),0),embedded:rs.reduce((s,r)=>s+(r.embedded||0),0),adsMissing:rs.some(r=>r.adsMissing)||(data.margensNaoAlocadas||[]).some(r=>r.emp===o.emp&&r.mkt===o.mkt&&r.month>=range.from.slice(0,7)&&r.month<=range.to.slice(0,7)),adsModes:[...new Set(rs.map(r=>r.adsMode))]};})};});return{...data,dias,faixas,mediaWarnings:data.margensNaoAlocadas||[]};}

    const monthly=new Map(),weights=new Map(),revenue=new Map(),selected=new Map(),scope=data.escopo||{},warnings=[];
    const excluded=r=>/afiliad/i.test(String(r.fonte||'')+' '+String(r.campanha||''))||/tik\s*tok/i.test(r.mkt||'')||scope.emp&&r.emp!==scope.emp||scope.mkt&&r.mkt!==scope.mkt;
    for(const[list,field]of[[ads,'ads'],[camp,'camp']])for(const r of list)if(!excluded(r)){const k=key(r.emp,r.mkt,String(r.comp).slice(0,7)),o=monthly.get(k)||{ads:0,camp:0};o[field]+=n(r.inv)??0;monthly.set(k,o);}
    for(const r of dia)if(!excluded(r)&&date(String(r.data).slice(0,10))){const d=String(r.data).slice(0,10),k=key(r.emp,r.mkt,d.slice(0,7)),o=weights.get(k)||new Map();o.set(d,(o.get(d)||0)+(n(r.inv)??0));weights.set(k,o);}
    for(const [rows,target]of[[data.midiaBase||data.dias,revenue],[data.dias,selected]])for(const r of rows){const k=key(r.emp,r.mkt,r.date.slice(0,7)),o=target.get(k)||new Map();o.set(r.date,(o.get(r.date)||0)+(n(r.fat)??0));target.set(k,o);}
    const mapped=new Map(data.dias.map(r=>{const tt=/tik\s*tok/i.test(r.mkt),k=key(r.emp,r.mkt,r.date.slice(0,7)),w=weights.get(k),wt=w?[...w.values()].reduce((a,b)=>a+b,0):0,m=monthly.get(k),missingDay=!!m&&Math.max(m.ads,m.camp)>0&&wt>0&&!w.has(r.date);return[key(r.emp,r.mkt,r.date),{...r,extra:0,embedded:tt?-(r.pub||0):0,adsMissing:tt?(r.mediaMissing>0):(!m||missingDay),adsMode:tt?'liquido':missingDay?'peso-diario-ausente':m?'mensal':'ausente'}];}));
    for(const[k,m]of monthly){const[emp,mkt,month]=JSON.parse(k),inv=Math.max(m.ads,m.camp);if(!(inv>0)||month<data.base[0].slice(0,7)||month>data.base[1].slice(0,7))continue;
      const w=weights.get(k),wt=w?[...w.values()].reduce((a,b)=>a+b,0):0,f=revenue.get(k),ft=f?[...f.values()].reduce((a,b)=>a+b,0):0,useWeights=wt>0,base=useWeights?w:f,den=useWeights?wt:ft;
      if(!(den>0)){warnings.push({emp,mkt,month,inv,reason:'Sem pesos diários ou faturamento mensal para alocar'});continue;}
      for(const[d,weight]of base){if(d<data.base[0]||d>data.base[1])continue;let extra=inv*weight/den;
        if(scope.ponto){const all=f?.get(d)||0,part=selected.get(k)?.get(d)||0;if(!(all>0)){if(extra>0)warnings.push({emp,mkt,month,inv:extra,reason:'Mídia diária sem receita para atribuição por ponto'});continue;}extra*=part/all;}
        const id=key(emp,mkt,d);if(!mapped.has(id)&&extra!==0)mapped.set(id,{emp,mkt,date:d,...blank(),extra:0,embedded:0,mediaOnly:true,adsMissing:false});const row=mapped.get(id);if(row){row.extra+=extra;row.adsMode=scope.ponto?(useWeights?'pesos-diarios-e-ponto':'receita-mensal-e-ponto'):useWeights?'pesos-diarios':'rateio-faturamento';}
      }
    }
    const dias=[...mapped.values()].sort((a,b)=>a.date.localeCompare(b.date));
    const faixas=data.faixas.map(range=>{const relevant=dias.filter(d=>d.date>=range.from&&d.date<=range.to),ops=new Map(range.ops.map(o=>[key(o.emp,o.mkt),o]));for(const r of relevant)if(r.extra&&!ops.has(key(r.emp,r.mkt)))ops.set(key(r.emp,r.mkt),{emp:r.emp,mkt:r.mkt,...blank(),mediaOnly:true});for(const w of data.margensNaoAlocadas||[])if(w.month>=range.from.slice(0,7)&&w.month<=range.to.slice(0,7)&&!ops.has(key(w.emp,w.mkt)))ops.set(key(w.emp,w.mkt),{...blank(),emp:w.emp,mkt:w.mkt,mediaOnly:true});return{...range,ops:[...ops.values()].map(o=>{const rs=relevant.filter(d=>d.emp===o.emp&&d.mkt===o.mkt),allocation=sum(rs);return{...o,extra:allocation?.extra||0,embedded:allocation?.embedded||0,adsMissing:rs.some(r=>r.adsMissing),adsModes:[...new Set(rs.map(r=>r.adsMode))]};})};});
    return{...data,dias,faixas,mediaWarnings:warnings};
  }
  function rangeModel(data,id) {
    const range=data.faixas.find(r=>r.id===id);if(!range)return null;
    return {...range,total:sum(range.ops),ops:range.ops.map(r=>({...r,...sum([r]),id:key(r.emp,r.mkt)})),dias:data.dias.filter(r=>r.date>=range.from&&r.date<=range.to)};
  }
  function periods(ref,kind='dia',compare='anterior',custom=null) {
    if(!date(ref))return null;
    if(kind==='custom')return custom&&custom.every(r=>span(r[0],r[1]))?{cur:custom[0],prev:custom[1],divisor:1}:null;
    if(/^(mes|trimestre|semestre|ano)-completo$/.test(kind)) {
      const unit=kind.split('-')[0],size={mes:1,trimestre:3,semestre:6,ano:12}[unit],d=parse(ref),m=Math.floor(d.getUTCMonth()/size)*size,start=iso(new Date(Date.UTC(d.getUTCFullYear(),m,1,12)));
      return{cur:[start,monthEnd(shiftMonth(start.slice(0,7),size-1))],prev:[shiftMonth(start.slice(0,7),-size)+'-01',add(start,-1)],divisor:1};
    }
    if(kind==='dia')return {cur:[ref,ref],prev:compare==='weekday'?[add(ref,-7),add(ref,-7)]:compare==='media7'?[add(ref,-7),add(ref,-1)]:[add(ref,-1),add(ref,-1)],divisor:compare==='media7'?7:1};
    const d=parse(ref),y=d.getUTCFullYear(),m=d.getUTCMonth(),start=kind==='semana'?add(ref,-((d.getUTCDay()+6)%7)):kind==='mes'?iso(new Date(Date.UTC(y,m,1,12))):kind==='trimestre'?iso(new Date(Date.UTC(y,Math.floor(m/3)*3,1,12))):kind==='semestre'?iso(new Date(Date.UTC(y,Math.floor(m/6)*6,1,12))):`${y}-01-01`;
    if(kind==='semana')return{cur:[start,ref],prev:[add(start,-7),add(ref,-7)],divisor:1};
    const shift={mes:-1,trimestre:-3,semestre:-6,ano:-12}[kind],pstart=shiftMonth(start.slice(0,7),shift)+'-01',pend=add(pstart,span(start,ref)-1),last=monthEnd(shiftMonth(start.slice(0,7),-1));
    return{cur:[start,ref],prev:[pstart,pend>last?last:pend],divisor:1};
  }
  function scale(r,divisor=1) {if(!r)return null;const o={...r};for(const k of [...fields,'extra','embedded','before','after'])if(o[k]!=null)o[k]/=divisor;return o;}
  function score(ops,weights) {const keys=['after','percentAfter','fat','qtd','ped'],total=keys.reduce((s,k)=>s+Math.max(0,n(weights[k])??0),0);return ops.map(r=>({...r,score:r.adsMissing||!total||keys.some(k=>(n(weights[k])??0)>0&&r[k]==null)?null:keys.reduce((s,k)=>{const max=Math.max(0,...ops.map(r=>n(r[k])??0));return s+(max?Math.max(0,r[k]??0)/max*100:0)*Math.max(0,n(weights[k])??0);},0)/total}));}
  function diaryFinance(total,ops=[]) {
    if(!total)return {beforeAds:null,after:null,ads:null,affiliates:null,percentBeforeAds:null,percentAfter:null,missing:false};
    const tt=ops.filter(r=>/tik\s*tok/i.test(r.mkt||'')),missing=tt.some(r=>r.mediaMissing>0),embeddedAds=tt.reduce((v,r)=>v-(n(r.pub)??0),0),affiliates=tt.reduce((v,r)=>v-(n(r.afil)??0),0);
    const beforeAds=missing||total.mc==null?null:total.mc+embeddedAds;const adsMissing=missing||total.adsMissing;
    return{beforeAds,after:total.after,ads:adsMissing?null:(total.extra||0)+embeddedAds,affiliates:missing?null:affiliates,percentBeforeAds:beforeAds!=null&&total.base?100*beforeAds/total.base:null,percentAfter:total.percentAfter,missing:adsMissing};
  }
  function diaryRows(current,prior,divisor,weights) {
    const cur=score(current.ops,weights),old=score(prior.ops.map(r=>scale(r,divisor)),weights),rank=(rows,k)=>{const sorted=rows.filter(r=>n(r[k])!=null).slice().sort((a,b)=>b[k]-a[k]||a.id.localeCompare(b.id)),out=new Map();let last,position;sorted.forEach((r,i)=>{if(i===0||r[k]!==last)position=i+1;out.set(r.id,position);last=r[k];});return out;},cr=rank(cur,'score'),pr=rank(old,'score'),metrics=['fat','after','percentAfter','ped','qtd','ticket'],positions=Object.fromEntries(metrics.map(k=>[k,[rank(cur,k),rank(old,k)]])),cmap=new Map(cur.map(r=>[r.id,r])),pmap=new Map(old.map(r=>[r.id,r]));
    return [...new Set([...cmap.keys(),...pmap.keys()])].map(id=>{const c=cmap.get(id)||null,p=pmap.get(id)||null,op=c||p;return{id,emp:op.emp,mkt:op.mkt,c,p,rank:cr.get(id)??null,priorRank:pr.get(id)??null,movement:cr.has(id)&&pr.has(id)?pr.get(id)-cr.get(id):null,change:difference(c?.after,p?.after)?.value??null,financial:diaryFinance(c,c?[c]:[]),priorFinancial:diaryFinance(p,p?[p]:[]),positions:Object.fromEntries(metrics.map(k=>[k,{current:positions[k][0].get(id)??null,prior:positions[k][1].get(id)??null}]))};});
  }
  function diaryContributions(rows,metric='fat') {
    return rows.filter(r=>n(r.c?.[metric])!=null&&n(r.p?.[metric])!=null).map(r=>({...r,value:r.c[metric]-r.p[metric]})).sort((a,b)=>Math.abs(b.value)-Math.abs(a.value)||a.id.localeCompare(b.id));
  }
  function diaryBubble(ops) {
    const valid=ops.filter(r=>!r.adsMissing&&n(r.fat)>0&&n(r.percentAfter)!=null&&n(r.qtd)!=null&&n(r.qtd)>=0&&!(r.qtdMissing>0)),sorted=valid.map(r=>r.fat).sort((a,b)=>a-b),mid=Math.floor(sorted.length/2),median=sorted.length?(sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2):null,base=valid.reduce((s,r)=>s+(r.base||0),0),average=base?100*valid.reduce((s,r)=>s+r.after,0)/base:null,max=Math.max(1,...valid.map(r=>r.qtd));
    return{median,average,points:valid.map(r=>({...r,x:r.fat,y:r.percentAfter,r:8+Math.sqrt(r.qtd/max)*26,quadrant:r.fat>=median?(r.percentAfter>=average?'estrela':'margem'):(r.percentAfter>=average?'nicho':'revisar')}))};
  }
  function localSkus(lines,scope) {const map=new Map();for(const r of lines){if(!date(r.date)||r.date<scope.from||r.date>scope.to||scope.emp&&r.emp!==scope.emp||scope.mkt&&r.mkt!==scope.mkt||scope.ponto&&r.ponto!==scope.ponto)continue;const v=lineValue(r);if(!v.n_fin)continue;const code=String(r.sku||'').trim().toUpperCase(),k=key(r.emp,r.mkt,code),o=map.get(k)||{emp:r.emp,mkt:r.mkt,sku:code,titulo:r.tit||code,...blank()};for(const f of fields)o[f]+=v[f];map.set(k,o);}return [...map.values()];}
  function skuGroups(rows,byOperation=true) {const map=new Map();for(const r of rows){const k=byOperation?key(r.emp,r.mkt,r.sku):key(r.sku);if(!map.has(k))map.set(k,[]);map.get(k).push(r);}return [...map.entries()].map(([id,parts])=>({...sum(parts),id,sku:parts[0].sku,titulo:parts[0].titulo,emp:byOperation?parts[0].emp:'',mkt:byOperation?parts[0].mkt:'',parts}));}
  function abc(items,metric='fat',a=.8,b=.95) {
    if(!(a>0&&a<b&&b<1))throw Error('Cortes inválidos');
    const sorted=items.slice().sort((x,y)=>(n(y[metric])??-Infinity)-(n(x[metric])??-Infinity)||x.id.localeCompare(y.id)),total=sorted.reduce((s,r)=>s+Math.max(0,n(r[metric])??0),0);let accumulated=0,lastValue=null,lastClass=null;
    return {total,rows:sorted.map((r,index)=>{const value=n(r[metric]),positive=value>0,curve=positive?(value===lastValue?lastClass:accumulated/total<a?'A':accumulated/total<b?'B':'C'):'N',before=accumulated;if(positive)accumulated+=value;lastValue=value;lastClass=curve;return {...r,value,curve,rank:index+1,share:positive?100*value/total:null,cumulative:positive?100*accumulated/total:null,before:positive?100*before/total:null};})};
  }
  function matrix(items,a=.8,b=.95) {const maps=['fat','qtd','mcReal'].map(k=>new Map(abc(items,k,a,b).rows.map(r=>[r.id,r.curve])));return items.map(r=>({...r,code:maps.map(m=>m.get(r.id)||'N').join('')}));}
  const monthIndex=m=>+m.slice(0,4)*12 + +m.slice(5,7)-1;
  function regression(points) {if(points.length<2)return null;const origin=monthIndex(points[0].mes),rs=points.map(p=>({x:monthIndex(p.mes)-origin,y:p.value})),N=rs.length,sx=rs.reduce((s,p)=>s+p.x,0),sy=rs.reduce((s,p)=>s+p.y,0),den=N*rs.reduce((s,p)=>s+p.x*p.x,0)-sx*sx;if(!den)return null;const slope=(N*rs.reduce((s,p)=>s+p.x*p.y,0)-sx*sy)/den;return {origin,slope,intercept:(sy-slope*sx)/N};}
  function forecast(daily,{from,to,metric='fat',method='linear',horizon=3,variation=10,excluded=[],today}={}) {
    const map=new Map();for(const r of daily)if(r.date>=from&&r.date<=to){const m=r.date.slice(0,7);if(!map.has(m))map.set(m,[]);map.get(m).push(r);}
    const actual=months(from,to).map(mes=>{const rs=map.get(mes)||[],o=sum(rs),value=o?metric==='after'?o.after:o[metric]:null,whole=from<=mes+'-01'&&to>=monthEnd(mes)&&(!today||monthEnd(mes)<today);return{mes,value,total:o,days:new Set(rs.filter(r=>r.n_all>0).map(r=>r.date)).size,first:rs.filter(r=>r.n_all>0).map(r=>r.date).sort()[0]||null,last:rs.filter(r=>r.n_all>0).map(r=>r.date).sort().at(-1)||null,whole,used:whole&&value!=null&&!excluded.includes(mes)};}),training=actual.filter(r=>r.used),reg=method==='linear'?regression(training):null,mean=training.length?training.reduce((s,p)=>s+p.value,0)/training.length:null,ready=method==='linear'?!!reg:mean!=null,last=to.slice(0,7);
    const future=Array.from({length:horizon},(_,i)=>{const mes=shiftMonth(last,i+1),raw=!ready?null:method==='linear'?reg.intercept+reg.slope*(monthIndex(mes)-reg.origin):mean,value=raw==null?null:['fat','qtd'].includes(metric)?Math.max(0,raw):raw,gap=value==null?null:Math.abs(value)*variation/100,lower=value==null?null:['fat','qtd'].includes(metric)?Math.max(0,value-gap):value-gap;return{mes,raw,value,lower,upper:value==null?null:value+gap,clamped:raw<0&&value===0};});
    return{actual,training,reg,mean,ready,future,method,metric,horizon,variation};
  }
  function targetHistory(daily,goals,from,to) {
    return months(from,to).map(mes=>{const eligible=goals.filter(g=>g.mes===mes&&n(g.Faturamento_obj)!=null&&n(g.Faturamento_obj)>=0),keys=new Set(eligible.map(g=>String(g.operacao))),rs=daily.filter(r=>r.date>=from&&r.date<=to&&r.date.slice(0,7)===mes&&keys.has(r.emp+' · '+r.mkt)),present=new Set(rs.filter(r=>r.n_all>0).map(r=>r.emp+' · '+r.mkt)),target=eligible.length?eligible.reduce((s,g)=>s+Number(g.Faturamento_obj),0):null,covered=eligible.length>0&&[...keys].every(k=>present.has(k)),actual=covered?sum(rs)?.fat??null:null;return{mes,target,actual,covered,withGoal:keys.size,missing:[...keys].filter(k=>!present.has(k)).length,attainment:actual!=null&&target>0?actual/target*100:null};});
  }
  return {n,key,date,add,span,monthEnd,shiftMonth,months,previous,fields,blank,sum,difference,lineValue,aggregateLines,aggregateRows,media,rangeModel,periods,scale,score,diaryFinance,diaryRows,diaryContributions,diaryBubble,localSkus,skuGroups,abc,matrix,regression,forecast,targetHistory};
});
