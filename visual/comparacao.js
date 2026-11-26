/* Comparação de resultados e seleção de referência temporal. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BCComparacao=api;})(typeof window==='object'?window:this,function(){
 'use strict';
 const key=(emp,mkt)=>JSON.stringify([emp,mkt]);
 function catalogo(ops,point){const map=new Map();for(const o of ops)if(o.emp&&o.mkt&&(!point||o.ponto===point))map.set(key(o.emp,o.mkt),{...o});return [...map.values()];}
 function validar(selections,mode,catalog){const used=new Set();return selections.map(s=>{if(!s.emp)return 'Escolha a empresa.';if(mode==='operacoes'&&!s.mkt)return 'Escolha o marketplace.';if(!catalog.some(o=>o.emp===s.emp&&(mode==='empresas'||o.mkt===s.mkt)))return 'Esta seleção não está disponível neste recorte.';const id=key(s.emp,mode==='operacoes'?s.mkt:'');if(used.has(id))return 'Esta seleção já está em outra coluna.';used.add(id);return '';});}
 function modelo({rows,ops,point,range,selections,mode,sum,revenue}){
  if(typeof sum!=='function'||typeof revenue!=='function')throw Error('Use os agregadores do painel.');
  if(!['empresas','operacoes'].includes(mode)||selections.length<2||selections.length>4)throw Error('Escolha de duas a quatro seleções.');
  if(!range[0]||!range[1]||range[0]>range[1])throw Error('Período inválido.');
  const catalog=catalogo(ops,point),errors=validar(selections,mode,catalog),allowed=new Set(catalog.map(o=>key(o.emp,o.mkt)));
  if(errors.some(Boolean))return{errors,items:[],catalog};
  const base=rows.filter(r=>r.date>=range[0]&&r.date<=range[1]&&(!point||r.ponto===point)&&allowed.has(key(r.emp,r.mkt)));
  return{errors, catalog,items:selections.map(s=>{const selected=base.filter(r=>r.emp===s.emp&&(mode==='empresas'||r.mkt===s.mkt)),label=s.emp+(mode==='operacoes'?' · '+s.mkt:'');if(!selected.length)return{label,values:null,channels:catalog.filter(o=>o.emp===s.emp&&(mode==='empresas'||o.mkt===s.mkt)).length};const t=sum(selected),fat=revenue(t);return{label,channels:new Set(selected.map(r=>r.mkt)).size,values:{fat,mc:t.mc,pct:fat?t.mc/fat*100:null,qtd:t.qtd},fallback:!!t._semFatMetas};})};
 }
 const diferenca=(value,base)=>value==null||base==null?null:value-base;
 function referenceRange(mode,from,to,custom){
  const stamp=s=>Date.parse(s+'T12:00:00Z'),iso=n=>new Date(n).toISOString().slice(0,10),day=86400000;
  if(!Number.isFinite(stamp(from))||!Number.isFinite(stamp(to))||from>to||mode==='off')return null;
  if(mode==='custom')return custom?.length===2&&custom.every(d=>Number.isFinite(stamp(d)))&&custom[0]<=custom[1]?custom:null;
  function shift(date,months,last=false){
   const [year,month,d]=date.split('-').map(Number),end=new Date(Date.UTC(year,month+months,0)).getUTCDate();
   return iso(Date.UTC(year,month-1+months,last?end:Math.min(d,end),12));
  }
  const full=from.endsWith('-01')&&from.slice(0,7)===to.slice(0,7)&&shift(to,0,true)===to;
  if(mode==='year'||mode==='month'||mode==='auto'&&full){
   const months=mode==='year'?-12:-1;
   return [shift(from,months),shift(to,months,full)];
  }
  return [iso(stamp(from)-(stamp(to)-stamp(from)+day)),iso(stamp(from)-day)];
 }
 return{catalogo,validar,modelo,diferenca,referenceRange};
});
(function(){
 'use strict';if(typeof document==='undefined')return;
 const S={dialog:null,mode:'empresas',picks:{empresas:null,operacoes:null},origin:null,identity:'',point:'',range:[],ops:[]};
 const $=id=>document.getElementById(id),el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};
 function button(text,action,cls='bc-cmp-button'){const b=el('button',cls,text);b.type='button';b.onclick=action;return b;}
 function note(text){return el('p','bc-cmp-note',text);}
 function field(text,input){const l=el('label','bc-cmp-field');l.append(el('span','',text),input);return l;}
 function select(options,value,id,change){const s=el('select');s.id=id;for(const [v,text]of options)s.append(new Option(text,v));s.value=value||'';s.onchange=()=>change(s.value);return s;}
 function can(){return typeof bcPodeRecurso==='function'?bcPodeRecurso('vendas.ver'):!!bcNavSession()||typeof painelOnline==='function'&&!painelOnline();}
 function catalog(){return BCComparacao.catalogo(S.ops,S.point);}
 function companies(){return [...new Set(catalog().map(o=>o.emp))].sort((a,b)=>a.localeCompare(b,'pt-BR'));}
 function channels(emp){return catalog().filter(o=>o.emp===emp).map(o=>o.mkt).sort((a,b)=>a.localeCompare(b,'pt-BR'));}
 function capture(){S.ops=bcNavCatalogue(activePage).map(o=>({...o}));S.point=PONTO_SEL;S.range=[...getR()];S.identity=bcNavKey();const u=bcNavSession();S.scope=(S.point||'Grupo')+(activePage==='gerencial'&&u?.perfil==='gestor'?' · carteira '+u.gestor_ref:'');}
 function defaults(mode){const emp=companies(),first=emp.includes(BCNav.company)?BCNav.company:emp[0]||'';if(mode==='empresas')return[{emp:first,mkt:''},{emp:emp.find(e=>e!==first)||'',mkt:''}];const ops=catalog(),a=ops.find(o=>o.emp===first&&o.mkt===BCNav.marketplace)||ops.find(o=>o.emp===first)||ops[0],b=ops.find(o=>o.emp===a?.emp&&o.mkt!==a?.mkt)||ops.find(o=>o.emp!==a?.emp);return[a?{emp:a.emp,mkt:a.mkt}:{emp:'',mkt:''},b?{emp:b.emp,mkt:b.mkt}:{emp:'',mkt:''}];}
 let revision=0;
 function invalidate(){revision++;const result=$('bc-cmp-results');if(result)result.replaceChildren(note('Escolha as seleções e clique em Comparar resultados.'));const status=$('bc-cmp-error');if(status)status.textContent='';}
 function setMode(mode){S.mode=mode;if(!S.picks[mode])S.picks[mode]=defaults(mode);for(const b of $('bc-cmp-modes').children)b.setAttribute('aria-pressed',String(b.dataset.mode===mode));$('bc-cmp-same-company').hidden=mode!=='operacoes';renderChoices();invalidate();}
 function renderChoices(focus){const picks=S.picks[S.mode],host=$('bc-cmp-choices');host.replaceChildren();const errors=BCComparacao.validar(picks,S.mode,catalog());
  picks.forEach((pick,i)=>{const card=el('section','bc-cmp-choice'),head=el('div','bc-cmp-choice-head');head.append(el('h3','',i===0?'1 · Referência':(i+1)+' · Comparar com'));if(picks.length>2){const remove=button('Remover',()=>{picks.splice(i,1);renderChoices();invalidate();});remove.setAttribute('aria-label','Remover seleção '+(i+1));head.append(remove);}card.append(head);
   const company=select([['','Escolha a empresa'],...companies().map(e=>[e,e])],pick.emp,'bc-cmp-company-'+i,value=>{pick.emp=value;pick.mkt='';const m=channels(value);if(S.mode==='operacoes'&&m.length===1)pick.mkt=m[0];renderChoices('bc-cmp-company-'+i);invalidate();});card.append(field('Empresa · seleção '+(i+1),company));
   if(S.mode==='operacoes'){const market=select([['',pick.emp?'Escolha o marketplace':'Selecione a empresa'],...channels(pick.emp).map(m=>[m,m])],pick.mkt,'bc-cmp-marketplace-'+i,value=>{pick.mkt=value;renderChoices('bc-cmp-marketplace-'+i);invalidate();});market.disabled=!pick.emp;card.append(field('Marketplace · seleção '+(i+1),market));}
   else{const n=channels(pick.emp).length;card.append(note(pick.emp?n+' marketplace'+(n===1?' disponível':'s disponíveis')+' neste recorte.':'A comparação reúne os marketplaces da empresa.'));}
   if(errors[i]&&pick.emp)card.append(el('p','bc-cmp-choice-error',errors[i]));host.append(card);
  });$('bc-cmp-add').disabled=picks.length>=4;if(focus)$(focus)?.focus();
 }
 function sameCompany(){const picks=S.picks.operacoes,emp=picks[0]?.emp||BCNav.company||companies()[0],markets=channels(emp);if(markets.length<2){$('bc-cmp-error').textContent='Esta empresa tem apenas um marketplace neste recorte. Escolha uma segunda empresa.';return;}S.picks.operacoes=[{emp,mkt:markets.includes(picks[0]?.mkt)?picks[0].mkt:markets[0]},{emp,mkt:''}];S.picks.operacoes[1].mkt=markets.find(m=>m!==S.picks.operacoes[0].mkt);renderChoices();invalidate();}
 const defs=[['fat','Faturamento','money'],['mc','Pré-Ads (R$)','money'],['pct','Margem pré-Ads (%)','percent'],['after','Pós-Ads (R$)','money'],['afterPct','Margem pós-Ads (%)','percent'],['tacos','TACOS (%)','percent'],['qtd','Unidades','number'],['ped','Pedidos identificados','number'],['ticket','Ticket médio','money']];
 function format(v,type){if(v==null)return 'Não disponível';if(type==='money')return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:2});return v.toLocaleString('pt-BR',{minimumFractionDigits:type==='percent'?2:0,maximumFractionDigits:type==='percent'?2:4})+(type==='percent'?'%':'');}
 async function compare(){if(!can()||S.identity!==bcNavKey()){close();return;}const picks=S.picks[S.mode],model={errors:BCComparacao.validar(picks,S.mode,catalog())};const error=$('bc-cmp-error');if(model.errors.some(Boolean)){error.textContent='Revise as seleções: '+[...new Set(model.errors.filter(Boolean))].join(' ');const idx=model.errors.findIndex(Boolean);$('bc-cmp-company-'+idx)?.focus();return;}error.textContent='';
  const host=$('bc-cmp-results'),ticket=++revision;
  host.replaceChildren(note('Consultando os resultados…'));
  try{
   model.items=await Promise.all(picks.map(async pick=>{
    const mkt=S.mode==='operacoes'?pick.mkt:'';
    return {label:pick.emp+(mkt?' · '+mkt:''),values:await BCResultados.comparisonValues(S.range,{ponto:S.point||'',emp:pick.emp,mkt},channels(pick.emp))};
   }));
  }catch(e){if(ticket===revision&&S.dialog.open){host.replaceChildren();error.textContent='Falha ao consultar os resultados. Tente novamente.';}return;}
  if(ticket!==revision||!S.dialog.open||S.identity!==bcNavKey()||!can())return;
  host.replaceChildren(el('h3','','Resultado da comparação'),note('Cada coluna usa o mesmo período. As diferenças são em relação à primeira seleção.'));
  const wrap=el('div','bc-cmp-table-wrap'),table=el('table','bc-cmp-table'),caption=el('caption','',bcHeaderDate(S.range[0])+' a '+bcHeaderDate(S.range[1])+' · '+S.scope);table.append(caption);const head=el('thead'),hr=el('tr');hr.append(el('th','','Indicador'));
  model.items.forEach((item,i)=>{const th=el('th','',item.label);th.append(el('small','',i===0?'Referência':'Diferença para a referência'));hr.append(th);});head.append(hr);table.append(head);const body=el('tbody');
  for(const [key,label,type] of defs){
   const tr=el('tr'),heading=el('th');heading.scope='row';tr.dataset.metric=key;heading.append(el('span','bc-cmp-metric-name',label));tr.append(heading);
   const postAds=key==='after'||key==='afterPct'||key==='tacos',base=model.items[0].values;
   model.items.forEach(({values},i)=>{
    const td=el('td'),value=values?.[key];
    const amount=el('strong','bc-cmp-value',values?format(value,type):'Sem registros no período');
    if(value!=null&&['mc','pct','after','afterPct'].includes(key))amount.dataset.tone=value<0?'bad':value>0?'good':'neutral';
    td.append(amount);
    if(value!=null)td.title=String(value).replace('.',',')+(type==='percent'?'%':'');
    if(postAds&&values?.partial)td.append(el('small','','Parcial · '+values.coveredOps+' de '+values.totalOps+' operações apuradas'));
    else if(postAds&&values&&values.coveredOps===0)td.append(el('small','','Publicidade sem apuração completa'));
    if(i&&values){
     const partial=postAds&&(values.partial||base?.partial),delta=BCComparacao.diferenca(value,base?.[key]);
     let difference='Sem referência para calcular';
     if(partial)difference='Diferença indisponível · cobertura parcial';
     else if(delta!=null)difference=(delta>0?'+':'')+(type==='percent'?format(delta,'number')+' p.p.':format(delta,type));
     const badge=el('small','bc-cmp-difference',difference);
     if(!partial&&delta!=null){
      badge.textContent=(delta>0?'↑ ':delta<0?'↓ ':'= ')+difference;
      const margin=['mc','pct','after','afterPct'].includes(key);
      badge.dataset.tone=delta===0?'neutral':key==='tacos'?(delta<0?'good':'bad'):margin?(delta>0?'good':'bad'):'info';
     }
     td.append(badge);
    }
    tr.append(td);
   });
   body.append(tr);
  }
  table.append(body);wrap.tabIndex=0;wrap.setAttribute('aria-label','Tabela de comparação, com rolagem horizontal');wrap.append(table);host.append(el('p','bc-cmp-scroll-hint','Deslize a tabela para ver as outras colunas.'),wrap);
  host.append(note('TACOS é a publicidade considerada dividida pelo faturamento da base apurada. Nas diferenças, verde indica margem maior ou TACOS menor que a referência, e vermelho indica o inverso. As setas mostram a direção da diferença. O Pós-Ads mostra a margem após a publicidade. O ticket médio divide o faturamento dos pedidos identificados pela quantidade desses pedidos.'));
  host.append(note('Para comparar bônus e metas publicados, consulte Comissão. Para comparar datas diferentes, use Período → Comparar períodos.'));host.focus();
 }
 function close(){revision++;S.dialog?.close();S.origin?.focus();}
 function open(seed){if(!can())return;S.origin=document.activeElement;capture();S.picks={empresas:null,operacoes:null};if(!S.dialog){const d=el('dialog','bc-cmp-dialog');d.id='bc-results-comparison';d.setAttribute('aria-labelledby','bc-cmp-title');d.innerHTML='<header class="bc-cmp-heading"><div><p class="bc-cmp-eyebrow">RESULTADOS / COMPARAÇÃO</p><h2 id="bc-cmp-title">Comparar empresas e marketplaces</h2><p id="bc-cmp-context"></p></div><div id="bc-cmp-close-slot"></div></header><div class="bc-cmp-body"><section><h3>1. O que você quer comparar?</h3><p class="bc-cmp-note">No modo Empresas, os marketplaces disponíveis de cada empresa são reunidos. No modo Marketplaces, escolha operações específicas, inclusive da mesma empresa.</p><div id="bc-cmp-modes" class="bc-cmp-modes" role="group" aria-label="Tipo de comparação"></div></section><section><div class="bc-cmp-select-heading"><h3>2. Escolha de duas a quatro seleções</h3><div id="bc-cmp-tools"></div></div><div id="bc-cmp-choices" class="bc-cmp-choices"></div></section><div class="bc-cmp-apply"><p id="bc-cmp-error" role="alert"></p><div id="bc-cmp-apply-slot"></div></div><section id="bc-cmp-results" tabindex="-1" aria-label="Resultado da comparação"></section></div>';
   document.body.append(d);S.dialog=d;d.addEventListener('cancel',e=>{e.preventDefault();close();});$('bc-cmp-close-slot').append(button('Voltar à consulta',close));for(const [mode,title]of [['empresas','Empresas'],['operacoes','Marketplaces / operações']]){const b=button(title,()=>setMode(mode));b.dataset.mode=mode;$('bc-cmp-modes').append(b);}const same=button('Comparar marketplaces da mesma empresa',sameCompany);same.id='bc-cmp-same-company';const add=button('Adicionar seleção',()=>{S.picks[S.mode].push({emp:'',mkt:''});renderChoices();invalidate();});add.id='bc-cmp-add';$('bc-cmp-tools').append(same,add);$('bc-cmp-apply-slot').append(button('Comparar resultados',compare,'bc-cmp-button bc-cmp-primary'));}
  $('bc-cmp-context').textContent=S.scope+' · '+bcHeaderDate(S.range[0])+' a '+bcHeaderDate(S.range[1])+' · período igual para todas as seleções';if(seed?.emp)S.picks.operacoes=[{emp:seed.emp,mkt:seed.mkt},{emp:'',mkt:''}];setMode(seed?.emp||BCNav.company?'operacoes':'empresas');S.dialog.showModal();$('bc-cmp-modes').querySelector('[aria-pressed="true"]').focus();
 }
 window.bcCompareOperation=(emp,mkt)=>open({emp,mkt});
 window.bcCompareRefresh=function(){const heading=document.querySelector('.bc-view-title-row');if(!heading)return;let b=$('bc-compare-results');if(!b){b=button('Comparar empresas e marketplaces',open);b.id='bc-compare-results';heading.append(b);}const visible=can()&&(['overview','marketplaces'].includes(activePage)||activePage==='gerencial'&&GER_SUB==='panorama');if(b.hidden===visible)b.hidden=!visible;b.disabled=!bcNavCatalogue(activePage).length;
  const summary=document.querySelector('.bc-period-compare>summary');const cmpLabel=$('bc-compare-label');if(cmpLabel&&cmpLabel.textContent!=='Período de referência')cmpLabel.textContent='Período de referência';
  const scope=$('bc-scope-note');if(scope){const text=scope.textContent.replace('A comparação fica dentro do seletor de período.',visible?'Use Período para comparar datas. O botão Comparar empresas e marketplaces abre a leitura lado a lado.':'Use Período para comparar datas. A comparação de empresas fica em Resultados → Visão Geral.');if(text!==scope.textContent)scope.textContent=text;}
  window.BCPeriodoComparacao?.refresh();
  let help=$('bc-comparison-help');if(!help&&summary){help=note('Compara a consulta atual com outra janela de datas, mantendo a empresa e o marketplace escolhidos no cabeçalho.');help.id='bc-comparison-help';summary.after(help);}
  for(const s of document.querySelectorAll('.bc-com-root details>summary')){const t=s.textContent;if(t.startsWith('Comparar as operações deste mês'))s.textContent=t.replace('Comparar as operações deste mês','Bônus e metas por operação neste mês');else if(t.startsWith('Comparar com '))s.textContent=t.replace('Comparar com ','Comparar este registro com ');}
  if(S.dialog?.open&&(!can()||S.identity!==bcNavKey()))close();
 };
})();

(function(){
 'use strict';
 if(typeof document==='undefined')return;
 const $=id=>document.getElementById(id);
 const choices=[['month','Mesmo recorte do mês anterior'],['prev','Intervalo imediatamente anterior'],['year','Mesmo recorte do ano anterior'],['custom','Personalizada'],['auto','Automática'],['off','Sem comparação']];
 let mode='auto',pendingCustom=false,version=0,finishEdit=null;
 const range=BCComparacao.referenceRange;
 function available(){
  if(['overview','marketplaces','envios'].includes(activePage))return true;
  const forecast=activePage==='metas'||activePage==='gerencial'&&GER_SUB==='previsao';
  if(forecast)return !!document.querySelector('.page.active #res-forecast-products, .studio-active-page #res-forecast-products, .page.active .fc-controls, .studio-active-page .fc-controls');
  return activePage==='gerencial'&&['panorama','produtos','diag'].includes(GER_SUB);
 }
 function fill(select){
  if(select.dataset.referenceModes)return;
  select.replaceChildren(...choices.map(([value,label])=>new Option(label,value)));
  select.dataset.referenceModes='1';
 }
 function storeMode(value,from,to,custom){
  mode=value;version++;const pair=range(value,from,to,custom);
  cmpMode=!!pair&&!['auto','off'].includes(value);
  if(pair){$('d2-start').value=pair[0];$('d2-end').value=pair[1];}
 }
 function syncDraft(value){
  const select=$('cmp-sel');fill(select);select.value=value;
  $('bc-compare-custom').hidden=value!=='custom';
  const customButton=$('bc-compare-custom').querySelector('button');if(customButton&&!customButton.hidden)customButton.hidden=true;
  const pair=range(value,$('bc-range-from').value,$('bc-range-to').value,[$('bc-compare-from').value,$('bc-compare-to').value]);
  const note=$('bc-comparison-note'),text=pair?'Referência · '+pair.map(bcHeaderDate).join(' — '):value==='custom'?'Escolha o início e o fim da referência.':'Sem comparação de períodos';
  if(note.textContent!==text)note.textContent=text;
 }
 function open(event,custom=false,onFinish=null){
  event?.stopPropagation();const menu=$('bc-range-menu');if(!menu)return;
  finishEdit=onFinish;pendingCustom=custom;menu.open=true;bcHeaderRangeSync(true);
  const panel=menu.querySelector('.bc-period-compare');if(panel){panel.hidden=false;panel.open=true;}
  const field=custom?$('bc-compare-from'):$('cmp-sel');field.focus({preventScroll:true});
  const body=menu.querySelector('.bc-period-body');if(body&&panel)body.scrollTop=panel.offsetTop-body.offsetTop;
 }
 function refresh(){
  const menu=$('bc-range-menu'),native=$('cmp-sel');if(!menu||!native||!$('bc-compare-from'))return;
  if(!menu.dataset.referenceMounted){
   menu.dataset.referenceMounted='1';
   menu.addEventListener('toggle',()=>{if(!menu.open&&finishEdit){const done=finishEdit;finishEdit=null;done(false);}});
  }
  const show=available(),panel=menu.querySelector('.bc-period-compare');
  if(panel&&panel.hidden===show)panel.hidden=!show;

  fill(native);if(!menu.open)native.value=mode;
  const summary=panel?.querySelector('summary');
  const caption='Comparar períodos · '+(choices.find(([key])=>key===(menu.open?native.value:mode))?.[1]||'Automática');
  if(summary&&summary.textContent!==caption)summary.textContent=caption;
  const forecast=activePage==='metas'||activePage==='gerencial'&&GER_SUB==='previsao';
  const current=forecast&&document.querySelector('.studio-active-page [data-forecast-reference],.page.on [data-forecast-reference]')?.dataset;
  const local=current&&current.forecastReference!=='header'&&(mode!=='auto'||current.forecastReference!=='month');
  let context=$('bc-reference-context');
  if(!context&&panel){context=document.createElement('p');context.id='bc-reference-context';context.className='bc-cmp-note';context.hidden=true;panel.append(context);}
  if(context){
   const text=local?'O Forecast usa uma referência própria: '+current.forecastLabel+'. Altere a referência do Forecast para usar a comparação do cabeçalho.':'';
   if(context.textContent!==text)context.textContent=text;
   if(context.hidden===!!local)context.hidden=!local;
  }
 }
 const previousSync=bcHeaderRangeSync;
 bcHeaderRangeSync=function(force=false){
  previousSync.apply(this,arguments);const menu=$('bc-range-menu');if(!menu||!$('bc-compare-from'))return;
  if(!menu.open)pendingCustom=false;
  syncDraft(force||!menu.open?(pendingCustom?'custom':mode):$('cmp-sel').value);
 };
 bcHeaderComparison=value=>{pendingCustom=false;syncDraft(value);refresh();};
 bcHeaderApplyRange=function(){
  const from=$('bc-range-from'),to=$('bc-range-to');
  if(!bcHeaderValidate(from,to))return;
  const menu=$('bc-range-menu'),value=available()?$('cmp-sel').value:mode;
  const start=$('bc-compare-from'),end=$('bc-compare-to');
  if(value==='custom'&&!bcHeaderValidate(start,end))return;
  storeMode(value,from.value,to.value,[start.value,end.value]);
  const done=finishEdit;finishEdit=null;done?.(true);pendingCustom=false;menu.open=false;aplicarPeriodo(from.value,to.value,'main');bcHeaderRefresh();
 };
 bcHeaderApplyComparison=bcHeaderApplyRange;
 const applyPeriod=aplicarPeriodo;
 aplicarPeriodo=function(from,to,target){
  if(target==='main'&&['month','prev','year'].includes(mode)){
   const pair=range(mode,from,to);if(pair){$('d2-start').value=pair[0];$('d2-end').value=pair[1];}
  }
  return applyPeriod.apply(this,arguments);
 };
 window.BCPeriodoComparacao={get version(){return version;},get mode(){return mode;},restore(value){mode=choices.some(([k])=>k===value)?value:cmpMode?'custom':'auto';},open,refresh};
})();
