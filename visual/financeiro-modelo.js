/* DRE gerencial: leitura derivada, sem reprocessar a apuração ou a remuneração. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BCFinanceiroModelo=api;})(typeof window==='object'?window:this,function(){
 'use strict';
 const number=v=>v==null||String(v).trim()===''||!Number.isFinite(Number(v))?null:Number(v),n=v=>number(v)??0,cent=v=>Math.round(n(v)*100),money=v=>cent(v)/100,key=(...a)=>JSON.stringify(a);
 const validMonth=m=>/^\d{4}-(0[1-9]|1[0-2])$/.test(String(m)),end=m=>new Date(Date.UTC(+m.slice(0,4),+m.slice(5,7),0,12)).toISOString().slice(0,10);
 function months(a,b){if(!validMonth(a)||!validMonth(b)||a>b)return[];const list=[];for(let m=a;m<=b&&list.length<120;m=new Date(Date.UTC(+m.slice(0,4),+m.slice(5,7),1,12)).toISOString().slice(0,7))list.push(m);return list;}
 function allocate(value,weights){const total=cent(value),items=weights.map(([id,w])=>({id,w:Math.max(0,n(w))})),sum=items.reduce((s,x)=>s+x.w,0);if(sum<=0)return[];let used=0;const out=items.map(x=>{const exact=Math.abs(total)*x.w/sum,c=Math.floor(exact);used+=c;return{...x,c,remainder:exact-c};});const ranked=out.slice().sort((a,b)=>b.remainder-a.remainder||String(a.id).localeCompare(String(b.id)));for(let i=0;i<Math.abs(total)-used;i++)ranked[i%ranked.length].c++;return out.map(x=>[x.id,Math.sign(total)*x.c/100]);}
 const fields=['fat','liq','ctp','imp','mc','real','pub','afil','n','realMissing','missing','provis','devN','devReal'];
 function blank(){return Object.fromEntries(fields.map(k=>[k,0]));}
 function sum(rows){const out=blank();for(const r of rows)for(const k of fields)out[k]+=n(r[k]);for(const k of fields)if(!['n','realMissing','missing','provis','devN'].includes(k))out[k]=money(out[k]);return out;}
 const affiliate=r=>/afiliad|\bCVAF\b/i.test(String(r.fonte||'')+' '+String(r.campanha||''));
 function model({rows=[],costs=null,ads=[],campaigns=[],scope={},from,to,points={}}){
  const ms=months(from,to);if(!ms.length)throw Error('Competências inválidas.');
  const wanted=r=>(!scope.emp||r.emp===scope.emp)&&(!scope.mkt||r.mkt===scope.mkt),selected=rows.filter(r=>ms.includes(r.month)&&wanted(r)),entries=new Map(),issues=[],details=[],media=[];
  const ensure=(month,emp,ponto='')=>{const k=key(month,emp,ponto);if(!entries.has(k))entries.set(k,{month,emp,ponto,rows:[],direct:0,shared:0,media:0,manualAffiliate:0,embeddedAffiliate:0,live:0,mediaMissing:0,service:false,unassigned:false});return entries.get(k);};
  for(const r of selected)if(!scope.ponto||r.ponto===scope.ponto)ensure(r.month,r.emp,r.ponto).rows.push(r);
  const addIssue=(code,text)=>{if(!issues.some(i=>i.code===code&&i.text===text))issues.push({code,text});};
  const c=costs&&typeof costs==='object'?costs:null,costRows=Array.isArray(c?.custos)?c.custos:[],invest=Array.isArray(c?.investimento)?c.investimento:[];
  const costMonths=ms.filter(m=>costRows.some(r=>r.mes===m&&(!scope.ponto||r.ponto===scope.ponto)&&(!scope.emp||r.emp===scope.emp||r.tipo==='compartilhado'))||(!scope.emp||scope.emp==='Box Wyl')&&!scope.ponto&&!scope.mkt&&Array.isArray(c?.boxwyl)&&c.boxwyl.some(r=>r.mes===m)),missingMonths=ms.filter(m=>!costMonths.includes(m));
  if(!c)addIssue('costs','Pacote de custos não disponível. O resultado completo não pode ser apresentado.');
  if(missingMonths.length)addIssue('months','Sem lançamento de estrutura nas competências '+missingMonths.join(', ')+'. Ausência não confirma custo zero.');
  // Custos empresariais não são atribuídos integralmente a um único marketplace.
  const structureApplicable=!scope.mkt;
  for(const r of costRows.filter(r=>ms.includes(r.mes)&&(!scope.ponto||r.ponto===scope.ponto))){
   if(number(r.valor)===null||n(r.valor)<0){addIssue('invalid','Há custo inválido na origem; confira o pacote.');continue;}
   if(r.tipo==='direto'){
    if(scope.emp&&r.emp!==scope.emp)continue;const e=ensure(r.mes,r.emp||'Estrutura sem empresa',r.ponto);if(structureApplicable)e.direct=money(e.direct+n(r.valor));details.push({month:r.mes,emp:r.emp,ponto:r.ponto,type:'Direto',description:String(r.descricao||''),source:money(r.valor),allocated:structureApplicable?money(r.valor):null,weight:null});
   }else if(r.tipo==='compartilhado'){
    const weights=Object.entries(c?.rateio?.[r.ponto]||{}).filter(([e,w])=>number(w)!==null&&n(w)>=0),weight=weights.reduce((s,[,w])=>s+n(w),0),valid=Math.abs(weight-1)<1e-8&&weights.length>0;
    if(!valid){addIssue('allocation','Rateio de '+r.ponto+' não fecha 100%. O pool fica sem atribuição por empresa.');if(!scope.emp&&structureApplicable){const e=ensure(r.mes,'Estrutura sem empresa',r.ponto);e.unassigned=true;e.shared=money(e.shared+n(r.valor));}details.push({month:r.mes,emp:'Sem atribuição',ponto:r.ponto,type:'Compartilhado pendente',description:String(r.descricao||''),source:money(r.valor),allocated:!scope.emp&&structureApplicable?money(r.valor):null,weight:null});continue;}
    for(const[emp,value]of allocate(r.valor,weights)){if(scope.emp&&emp!==scope.emp)continue;const e=ensure(r.mes,emp,r.ponto);if(structureApplicable)e.shared=money(e.shared+value);details.push({month:r.mes,emp,ponto:r.ponto,type:'Compartilhado',description:String(r.descricao||''),source:money(r.valor),allocated:structureApplicable?value:null,weight:n(c.rateio[r.ponto][emp])});}
   }else addIssue('invalid','Tipo de custo desconhecido na origem.');
  }
  if(scope.mkt)addIssue('channel','Estrutura pertence à empresa/ponto e não tem rateio por marketplace. A leitura deste canal termina antes da estrutura; resultado e equilíbrio ficam indisponíveis.');
  // Mídia por operação e competência: anúncio e campanha são duas visões, não dois gastos.
  const ops=new Map();for(const r of selected)ops.set(key(r.month,r.emp,r.mkt),{month:r.month,emp:r.emp,mkt:r.mkt});
  for(const r of [...ads,...campaigns])if(ms.includes(r.comp)&&wanted(r))ops.set(key(r.comp,r.emp,r.mkt),{month:r.comp,emp:r.emp,mkt:r.mkt});
  for(const r of invest)if(ms.includes(r.mes)&&(!scope.emp||r.emp===scope.emp)&&(!scope.mkt||r.canal===scope.mkt))ops.set(key(r.mes,r.emp,r.canal),{month:r.mes,emp:r.emp,mkt:r.canal||''});
  for(const op of ops.values()){
   const rs=selected.filter(r=>r.month===op.month&&r.emp===op.emp&&r.mkt===op.mkt),a=ads.filter(r=>r.comp===op.month&&r.emp===op.emp&&r.mkt===op.mkt&&!affiliate(r)),b=campaigns.filter(r=>r.comp===op.month&&r.emp===op.emp&&r.mkt===op.mkt&&!affiliate(r)),manual=invest.filter(r=>r.mes===op.month&&r.emp===op.emp&&String(r.canal||'')===op.mkt),manualAd=manual.reduce((s,r)=>s+n(r.ads),0),apiAd=Math.max(a.reduce((s,r)=>s+n(r.inv),0),b.reduce((s,r)=>s+n(r.inv),0)),paid=a.length||b.length?apiAd:manual.length?manualAd:null;
   const tik=/tik\s*tok/i.test(op.mkt),embedded=money(rs.reduce((s,r)=>s+Math.max(0,-n(r.afil)),0)),manualAffiliate=money(manual.reduce((s,r)=>s+n(r.afi),0)),affiliateExtra=money(Math.max(0,manualAffiliate-embedded)),live=money(manual.reduce((s,r)=>s+n(r.live),0)),extra=money((tik?0:n(paid))+affiliateExtra+live),pointRevenue=new Map();
   for(const r of rs)pointRevenue.set(r.ponto||'',(pointRevenue.get(r.ponto||'')||0)+Math.max(0,n(r.fat)));
   if(!pointRevenue.size){pointRevenue.set(points[op.emp]||'',1);if(extra!==0)addIssue('media','Investimento sem vendas: ponto obtido do cadastro quando disponível; atribuição precisa de conferência.');}
   let weights=[...pointRevenue];if(!weights.some(([,v])=>v>0)){weights=weights.length===1?[[weights[0][0],1]]:[];addIssue('media','Mídia sem receita positiva para distribuir entre pontos.');}
   const allocated=allocate(extra,weights),missing=!tik&&paid===null;
   if(missing)addIssue('ads','Sem registro de Ads para '+op.emp+' · '+op.mkt+' em '+op.month+'. Não confirma gasto zero.');
   if(manualAffiliate>0)addIssue('affiliate','Afiliados manuais são confrontados com o total já identificado no líquido; só o excesso cadastrado é adicional. Datas/origens podem exigir conciliação.');
   if(tik)addIssue('tiktok','TikTok: Ads do relatório não é descontado novamente da margem do repasse. Afiliados já identificados no líquido também não são repetidos.');
   for(const[ponto,value]of allocated){if(scope.ponto&&ponto!==scope.ponto)continue;const e=ensure(op.month,op.emp,ponto);e.media=money(e.media+value);e.mediaMissing+=missing?1:0;media.push({...op,ponto,api:paid,source:a.length||b.length?'Maior total: anúncio/campanha':manual.length?'Cadastro de investimento':'Não informado',embeddedAffiliate:embedded,manualAffiliate,affiliateExtra,live,extra:value,pointAllocated:weights.length>1});}
   if(!allocated.length&&extra)addIssue('media','Gasto de mídia de '+op.emp+' não atribuído: '+extra.toFixed(2)+'.');
  }
  // Serviço sem ponto/canal: participa somente do Grupo sem filtro físico ou marketplace.
  const serviceRows=Array.isArray(c?.boxwyl)?c.boxwyl.filter(r=>ms.includes(r.mes)):[];
  if(serviceRows.length&&(!scope.emp||scope.emp==='Box Wyl')&&(scope.ponto||scope.mkt))addIssue('service','Box Wyl não tem ponto ou marketplace na fonte; fica fora deste filtro.');
  if(!scope.ponto&&!scope.mkt&&(!scope.emp||scope.emp==='Box Wyl'))for(const r of serviceRows){const e=ensure(r.mes,'Box Wyl','');e.service=true;e.rows.push({...blank(),n:1,fat:n(r.fat),liq:n(r.fat),real:n(r.fat)});e.direct=money(e.direct+n(r.custos));details.push({month:r.mes,emp:'Box Wyl',ponto:'Não informado',type:'Serviço',description:'Custos Box Wyl',source:n(r.custos),allocated:n(r.custos),weight:null});}
  const lines=[...entries.values()].map(e=>{const s=sum(e.rows),cost=money(e.direct+e.shared),after=money(s.real-e.media),available=money(after-cost),hasSales=s.n>0,complete=structureApplicable&&c!==null&&!missingMonths.length&&!e.mediaMissing&&!s.realMissing&&!s.missing&&!issues.some(i=>['allocation','invalid','media'].includes(i.code));return{...e,...s,cost,after,available,result:complete?available:null,percent:s.fat?100*available/s.fat:null,hasSales,complete};});
  const totalSales=sum(lines),mediaTotal=money(lines.reduce((s,r)=>s+r.media,0)),costTotal=money(lines.reduce((s,r)=>s+r.cost,0)),available=money(totalSales.real-mediaTotal-costTotal),complete=lines.length>0&&(totalSales.n>0||costTotal!==0||mediaTotal!==0)&&lines.every(r=>r.complete),total={...totalSales,media:mediaTotal,cost:costTotal,after:money(totalSales.real-mediaTotal),available,result:complete?available:null,complete,percent:totalSales.fat?100*available/totalSales.fat:null};
  if(total.realMissing)addIssue('real','Margem real ausente em '+total.realMissing+' linha(s); foi usada a margem de origem nessas linhas.');
  if(total.missing)addIssue('missing','Há campos financeiros ausentes na base. Valores disponíveis não certificam a composição completa.');
  if(total.provis)addIssue('provisional',total.provis+' linha(s) com líquido provisório; resultado ainda pode mudar.');
  if(lines.some(r=>!r.hasSales&&r.cost>0))addIssue('nosales','Há estrutura atribuída a empresa sem venda finalizada no recorte. Esses custos permanecem na leitura.');
  if(details.some(r=>r.type==='Compartilhado'))addIssue('historical','O rateio de estrutura é o cadastro vigente, sem data de vigência histórica. Não reconstitui fotografias fechadas.');
  const fixedKnown=structureApplicable&&c!==null&&!missingMonths.length,rate=total.fat>0?total.after/total.fat:null,equilibrium=fixedKnown&&complete&&rate>0?money(total.cost/rate):null;
  const monthly=ms.map(month=>{const rs=lines.filter(r=>r.month===month),s=sum(rs),media=money(rs.reduce((v,r)=>v+r.media,0)),cost=money(rs.reduce((v,r)=>v+r.cost,0));return{month,...s,media,cost,available:money(s.real-media-cost),result:rs.length&&(s.n>0||cost!==0||media!==0)&&rs.every(r=>r.complete)?money(s.real-media-cost):null};});
  const companies=[...new Set(lines.map(r=>r.emp))].sort().map(emp=>{const rs=lines.filter(r=>r.emp===emp),s=sum(rs),media=money(rs.reduce((v,r)=>v+r.media,0)),cost=money(rs.reduce((v,r)=>v+r.cost,0));return{emp,...s,media,cost,available:money(s.real-media-cost),result:(s.n>0||cost!==0||media!==0)&&rs.every(r=>r.complete)?money(s.real-media-cost):null};});
  total.structureApplicable=structureApplicable;total.costsPresent=c!==null;
  return{months:ms,from:ms[0]+'-01',to:end(ms.at(-1)),scope,lines,total,companies,monthly,issues,details,media,costsPresent:c!==null,missingMonths,structureApplicable,equilibrium,rate,serviceExcluded:!!serviceRows.length&&!!(scope.ponto||scope.mkt)};
 }
 function bridge(summary,detail){if(!summary||!detail)return{same:false,reasons:['Cadastro ou detalhamento ausente.']};const reasons=[];for(const[k,d]of[['mes','mes'],['operacao','operacao']])if(summary[k]!==detail[d])reasons.push('Competência ou operação diferente.');return{same:!reasons.length,reasons};}
 function commissionHistory(rows,operation=''){const by=new Map();for(const r of rows.filter(r=>!operation||r.operacao===operation)){const a=by.get(r.mes)||[];a.push(r);by.set(r.mes,a);}return[...by].sort(([a],[b])=>a.localeCompare(b)).map(([month,rs])=>{const keys=new Set(),duplicate=rs.some(r=>keys.size===keys.add(r.operacao).size),known=rs.every(r=>number(r.bonus_final_rs)!==null),closed=rs.every(r=>String(r.fechado_em||'').trim()),mixed=rs.some(r=>String(r.fechado_em||'').trim())&&!closed;return{month,bonus:duplicate||!known?null:rs.reduce((s,r)=>s+cent(r.bonus_final_rs),0)/100,closed,mixed,duplicate};});}
 return{number,cent,money,validMonth,months,end,allocate,sum,model,bridge,commissionHistory};
});
