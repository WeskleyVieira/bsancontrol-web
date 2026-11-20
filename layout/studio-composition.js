/* Composição visual do painel. Recompõe elementos reais com CSS, preservando a árvore nativa. */
(function(){'use strict';
 const C=window.BCStudioCatalogue,$=s=>document.querySelector(s),make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
 const names={kpi:'Indicador',chart:'Gráfico',table:'Tabela',list:'Prioridades e composição',form:'Fluxo de trabalho',embed:'Fluxo de Produtos',signal:'Sinal de atenção',empty:'Consulta',help:'Critérios e fontes'};
 const skip='.studio-ui,.review-ui,.studio-workspace,.bc-products-status[hidden],.res-legacy,.bc-viz-tools,.bc-table-tools,.bc-scroll-cue,script,style,dialog';
 const cardSelector='.sum-card,.kpi,.pv-metric,.met-quick-card,.met-card,.fc-kpi,.product-kpi,.bc-com-kpi';
 const cardGroups='.sum-kpis,.kpis,.kpi-row,.pv-metrics,.fc-kpis,.met-quick,.met-kpis,.ac6-hero,.product-kpis';
 const cardDecks='.cards,.res-account-deck,.res-deck,.res-top-grid,.ac6-owner-grid,.fc-products,.admin-grid';
 const resultSources={
  'resultados/overview':'res-overview',
  'resultados/diario':'res-diario',
  'resultados/marketplaces':'res-marketplaces',
  'resultados/abc':'res-abc',
  'resultados/forecast':'res-metas'
 };
 const pageControls='.diary-period-controls,.ger-agenda,.ger-chips,.ac4-scope,.ac4-actions,.pv-heading,.bc-entry-toolbar,.fin-links,.ds-status-tabs,.met-views,.fc-tabs,.res-tabs,.ac6-tabs,.ac4-levels,.met-filtros,.fc-chart-controls,.res-abc-operation-picker,#com-ctrl,#com-kpis,#com-lancar-box,#bc-env-launch,#bc-import-launch,#vnd-filter-bar,#vnd-pager,#vrx-suggestions,#vrx-result>.ger-context:has(.sum-actions),#vrx-result .ger-rx-benchmark';
 const controlGroups='.ger-controls,.op-controls,.res-controls,.ac4-controls,.ac4-filters,.perf-fbar,.ds-modes,.sum-actions,.fc-controls';
 const sections='.op-block,.ger-block,.res-block,.sum-section,.ac4-block,.ac6-block,.fin-reading,.fc-products,.pv-section,.gs-page>div';
 const textOf=n=>(n?.textContent||'').replace(/\s+/g,' ').trim();
 const btn=(label,fn,cls='')=>{const b=make('button','studio-button '+cls,label);b.type='button';b.onclick=fn;return b;};
 function titleOf(n,fallback){return (textOf(n.querySelector(':scope>h2,:scope>h3,:scope>h4,:scope>summary,.cc-title,.chart-title,.met-quick-title h3,.kpi-eye'))||n.querySelector('canvas')?.getAttribute('aria-label')||fallback).replace(/^[^\p{L}\p{N}]+/u,'');}
 function sourceVisible(n,page){for(let p=n;p&&p!==page;p=p.parentElement){if(p.hidden||getComputedStyle(p).display==='none')return false;if(p.matches('details:not([open])')&&n!==p&&!p.querySelector(':scope>summary')?.contains(n))return false;}return true;}
 function create(options){
  let state=null,working=false,placements=[],cleanup=[],widgets=[],host=null,primary=null,advanced=null,about=null,page=null,route='',library=null,filterText='',dragId='',revision=0;
  const moving=new WeakSet();
  let guideRoute='';
  const openPortfolioFilters=new Set();
  function own(n){if(n.nodeType===1)n.dataset.studioOwned='true';return n;}
  function move(n,target,before=null){if(!n.parentNode)return;const mark=document.createComment('studio:source');n.before(mark);moving.add(n);if(n.nodeType===1)n.dataset.studioManaged='true';placements.push({n,mark});target.insertBefore(n,before);}
  function restore(){if(working)return;working=true;for(const fn of cleanup.reverse())fn();cleanup=[];for(const {n,mark}of placements.reverse()){if(mark.isConnected)mark.replaceWith(n);else n.remove();}placements=[];host?.remove();host=null;widgets=[];working=false;}
  function collect(root,p,source){const found=[],controls=[],support=[],used=new Set();
   function push(n,kind,title,required=false,layout={}){
    if(used.has(n))return;
    used.add(n);
    const layoutSize=kind==='list'&&n.matches(cardDecks)?'full':undefined;
    found.push({n,kind,title:title||titleOf(n,names[kind]),required,layoutSize,...layout});
   }
   function workflowDisclosure(n){
    if(!n.matches('details'))return false;
    if(n.matches('#fc-advanced')||n.querySelector(':scope>div input:not([type=hidden]),:scope>div select')){
     return /escolher|ajustar|selecionar|m[eé]todo|cen[aá]rio|refer[eê]ncia|per[ií]odo/i.test(textOf(n.querySelector(':scope>summary')));
    }
    return false;
   }
   function walk(n){if(n.nodeType!==1||n.matches(skip)||!sourceVisible(n,root))return;
    if(n.matches('.bc-reading-guide'))return;
    if(n.id==='ger-empty'){
     if(textOf(n))controls.push(n);
     return;
    }
    if(n.matches('.ds-facts')){
     if(n.children.length)push(n,'signal','Pontos de atenção nas vendas',true,{layoutSize:'full',canExpand:false});
     return;
    }
    if(n.matches(pageControls)){controls.push(n);return;}
    if(n.id==='com-tbl'){push(n,'list','Comissão por operação',true,{sequence:22,layoutSize:'full',keepHeadings:true,canExpand:false});return;}
    if(n.id==='com-det'){if(n.children.length)push(n,'list','Composição e histórico da operação',true,{sequence:24,layoutSize:'full',keepHeadings:true,canExpand:false});return;}
    if(n.matches('.met-orcamento-diario,section[aria-labelledby="met-resumo"],section[aria-labelledby="met-prioridades"],#met-operacao')){
     const heading=n.querySelector('h3');
     push(n,'list',textOf(heading),true,{sequence:n.matches('.met-orcamento-diario')?12:16,layoutSize:'full',keepHeadings:true,nativeTitle:true,canExpand:false,sourceId:n.id||n.getAttribute('aria-labelledby')});
     return;
    }
    if(n.matches('.met-objetivos,.met-rota')){const objectives=n.matches('.met-objetivos');push(n,'list',objectives?'Objetivos do mês':'Rota e histórico',true,{sequence:objectives?13:14,layoutSize:'full',sourceId:objectives?'met-objetivos':'met-rota'});return;}
    if(n.matches('.met-planejamento')){push(n,'help',titleOf(n,'Planejamento e referências'),true,{sequence:15,sourceId:'met-planejamento'});return;}
    if(n.matches('.ger-agenda-margin')){
     push(n,'help','Resultado da operação',false,{defaultVisible:true,sequence:12,sourceId:'ger-agenda-margin'});
     return;
    }
    if(n.matches('.res-goal-strip')){push(n,'list',textOf(n.querySelector(':scope>strong'))||'Meta de faturamento do mês',true,{sequence:20.5,layoutSize:'third',sourceId:'res-goal-strip'});return;}
    if(n.querySelector(':scope>.res-share-track')){push(n,'list','Participação dos canais',true,{sequence:20.6,layoutSize:'wide',sourceId:'res-share-track'});return;}
    if(n.id==='res-forecast-pacing'){
     push(n,'list','Ritmo do mês e distância para a meta',false,{
      sequence:12,layoutSize:'full',defaultVisible:true,canExpand:false
     });
     return;
    }
    if(workflowDisclosure(n)){push(n,'help',titleOf(n,'Ajustar consulta'),true,{sequence:12});return;}
    if(n.matches('details')){
     const isTable=n.querySelector('table');
     push(n,isTable?'table':'help',titleOf(n,'Critérios e detalhes da análise'));
     return;
    }
    if(n.id==='ac4-continuity-summary'){push(n,'list','Continuidade dos casos');return;}
    if(n.matches('#sync-panel')){push(n,'list','Atualização e cobertura do catálogo',true);return;}
    if(n.matches('.ger-context')&&/^(qual |escolha |nenhum )/i.test(textOf(n.querySelector('h2')))){push(n,'empty',titleOf(n,'Escolha o que deseja consultar'),true);return;}
    if(n.matches('.met-comparacao,.met-retomada,.met-alerta,.met-dia-grid,.met-regra,.met-ritmo')){push(n,'list',titleOf(n,n.matches('.met-alerta')?'Atenção à margem':n.matches('.met-dia-grid')?'Limite e realizado no mês':'Orientação para a rota'),true);return;}
    if(n.matches('.met-calendario,.met-filtros,.met-ref')){controls.push(n);return;}
    if(n.matches('.ger-overview-grid')&&p.route==='gerencial/produtos'){
     push(n,'list','Curvas e saúde da margem',false,{sequence:11,layoutSize:'full',defaultVisible:true});
     return;
    }
    if(n.matches('#materials-panel,#pack-panel,#prep-panel,#review-panel,#sales-panel,#publication-panel')){
     push(n,'form',titleOf(n,textOf(n.querySelector('h2'))||'Cadastro'),true,{keepHeadings:true,nativeTitle:true,canExpand:false});
     return;
    }
    if(n.matches('.op-context,.ger-context,.sum-intro,.res-coverage,.sum-intro-copy')){support.push(n);for(const action of n.querySelectorAll('button,a[href]'))controls.push(action);return;}
    if(n.matches(cardGroups)){
     const cards=[...n.children].filter(c=>c.matches(cardSelector)||c.matches('article')&&c.querySelector('.sum-value,.kpi-val'));
     if(cards.length){
      const sixCards=cards.length===6;
      const secondary=n.matches('.bc-margin-kpis');
      const isSummary=sixCards&&n.matches('#ac4-summary,.res-main-kpis');
      cards.forEach((card,index)=>{
       push(card,'kpi',titleOf(card,'Indicador'),isSummary,{
        layoutSize:sixCards||n.matches('.met-quick')?'third':undefined,
        defaultVisible:sixCards&&!secondary,
        secondary,
        sequence:isSummary?index:undefined
       });
      });
      return;
     }
    }
    if(n.matches(cardSelector)&&n.querySelector('.sum-value,.kpi-val,strong')){push(n,'kpi',titleOf(n,'Indicador'));return;}
    if(n.matches('[role=alert],.op-warning,.res-warning,.diary-coverage,.ac4-error,.pv-error')){if(textOf(n))push(n,'signal',titleOf(n,'Atenção neste recorte'),true);return;}
    if(n.matches('form')){push(n,'form',titleOf(n,p.flow==='form'?'Cadastro e filtros':'Filtros da consulta'),true);return;}
    if(n.matches('iframe')){push(n,'embed','Produtos',true);return;}
    if(n.matches(controlGroups)||n.matches('nav,[role=tablist]')&&!n.closest('table')){controls.push(n);return;}
    if(n.matches('[role=group]')&&/indicador da rota/i.test(n.getAttribute('aria-label')||'')){push(n,'list','Objetivos do mês',true);return;}
    const hasTable=!!n.querySelector('table'),canvas=n.querySelectorAll('canvas').length;
    if(n.matches('.cc,.op-chart,.fc-chart,.res-chart,.met-chart')&&canvas){
     const id=n.querySelector('canvas').id;
     const layoutSize={ 'res-overview-evolution':'wide','res-overview-contribution':'third' }[id];
     push(n,'chart',titleOf(n,'Evolução do período'),false,{layoutSize});
     return;
    }
    if(n.matches('.cc,.op-chart,.fc-chart,.res-chart')&&hasTable){push(n,'table',titleOf(n,'Registros da análise'),p.flow==='list'||p.flow==='form');return;}
    if(n.matches('.cc,.op-chart,.fc-chart,.res-chart')&&!canvas){push(n,'empty',titleOf(n,'Leitura complementar'));return;}
    if(n.matches(sections)&&n.querySelector(cardGroups)){for(const c of [...n.children])walk(c);return;}
    if(n.matches(sections)&&hasTable){push(n,'table',titleOf(n,'Registros da análise'),p.flow==='list'||p.flow==='form');return;}
    if(n.matches(sections)&&canvas&&!n.querySelector(cardGroups)){push(n,'chart',titleOf(n,'Acompanhamento do período'));return;}
    if(n.matches(sections)&&n.querySelector('article,.res-account,.fin-tile,.ac6-owner-card,.res-product,.op-signal')){push(n,'list',titleOf(n,'Prioridades do recorte'));return;}
    if(n.matches(cardDecks+',.fin-deck')&&n.children.length){push(n,'list',titleOf(n,p.flow==='form'?'Registros do cadastro':'Composição do resultado'),p.flow==='form');return;}
    if(n.matches('.tbl-wrap,.table-wrap,.op-table-wrap,.ger-table-wrap,.bc-table-scroll')&&hasTable){
     const fallback=p.route==='vendas/vendas'?'Vendas do filtro':'Registros da análise';
     push(n,'table',titleOf(n,fallback),p.flow==='list'||p.flow==='form');return;
    }
    if(n.matches('table')){push(n,'table','Registros da análise',p.flow==='list'||p.flow==='form');return;}
    if(n.matches('section,article')&&n.querySelector(':scope>dl,:scope>progress,:scope>[role=progressbar]')){push(n,'list',titleOf(n,'Acompanhamento do recorte'));return;}
    if(n.matches('section,article')&&!n.querySelector('table,canvas,article,section')&&/nenhum|sem registro|não há/i.test(textOf(n))){push(n,'empty',titleOf(n,'Sem registros neste recorte'),true);return;}
    if(n.matches('p')&&textOf(n)){
     const status=/^carregando|^consultando|^selecione uma|^escolha uma|^nenhum |^n[aã]o foi poss[ií]vel|^seu acesso n[aã]o permite/i;
     if(n.matches('[role=status]')||status.test(textOf(n)))controls.push(n);
     else support.push(n);
     return;
    }
    if(n.matches('button,a[href],label,input,select,textarea')){controls.push(n);return;}
    if(n.matches('h1,h2,h3,h4')){support.push(n);return;}
    if(n.matches('#rx-empty,.empty,.op-empty,.ac4-empty')&&textOf(n)){push(n,'empty',titleOf(n,'Escolha o que deseja consultar'),true);return;}
    const children=[...n.children];if(!children.length){if(textOf(n)&&!n.matches('canvas,svg,path,progress'))support.push(n);return;}
    for(const c of children)walk(c);
   }
   if(source)for(const n of [...source.children])walk(n);
   return{found,controls,support};
  }
  function arrangeForecastPacing(panel){
   const track=panel.querySelector('.res-pacing-track');
   if(!track)return;
   const [calendar,calendarBar,target,targetBar]=track.children;
   if(!calendar?.matches('span')||!target?.matches('span')||
    !calendarBar?.matches('.res-progress')||!targetBar?.matches('.res-progress'))return;
   track.classList.add('studio-pacing-track');
   cleanup.push(()=>track.classList.remove('studio-pacing-track'));
   const reads=[
    [calendar,calendarBar,'Progresso do calendário','No mês aberto, conta os dias corridos até a referência.'],
    [target,targetBar,'Meta de faturamento atingida','Realizado em relação à meta das operações com objetivo cadastrado.']
   ];
   for(const [label,bar,title,description]of reads){
    const value=textOf(label).split(':').at(-1).trim();
    const hasValue=value.endsWith('%');
    const row=own(make('div','studio-pacing-reading'));
    const heading=make('div','studio-pacing-label');
    heading.append(make('span','',title),make('strong','',hasValue?value:'Indisponível'));
    row.append(heading);
    track.append(row);
    if(hasValue)move(bar,row);
    else bar.classList.add('studio-support-source');
    row.append(make('small','',description));
    label.classList.add('studio-support-source');
    cleanup.push(()=>{row.remove();label.classList.remove('studio-support-source');bar.classList.remove('studio-support-source');});
   }
  }
  function arrangeMetas(routePanel){
   const heading=routePanel.querySelector(':scope>.met-section-heading');
   const calendar=routePanel.querySelector(':scope>.met-calendario');
   if(!heading||!calendar)return;
   const picker=own(make('section','studio-met-day-picker'));
   const hint=make('p','studio-met-day-hint','Selecione uma data para ver o resultado do dia e a posição acumulada até ali.');
   const reference=textOf(routePanel.parentElement.querySelector('.met-planejamento>summary')).split(' · ').slice(1).join(' · ');
   const legend=make('ul','studio-met-day-legend');
   const custo=!!calendar.querySelector('[data-met-estado]');
   const parcial=!!calendar.querySelector('[data-met-parcial="true"]');
   const observado=calendar.hasAttribute('data-met-observado');
   if(custo){
    picker.classList.add('studio-met-cost-picker');
    if(parcial)hint.textContent='As cores comparam a mídia parcial informada com o limite do dia. A apuração consolidada depende da cobertura de todos os gastos.';
   }
   const estados=custo?[
    ['selected','Contorno · dia selecionado'],['good','✓ Dentro do limite'],['bad','! Acima do limite'],['neutral','· Sem comparação']
   ]:[
    ['selected','Fundo colorido · dia selecionado'],['good','✓ No plano ou acima'],['attention','! Abaixo do plano'],['neutral','· Sem comparação neste dia']
   ];
   for(const [tone,label]of estados)legend.append(make('li','studio-met-'+tone,label));
   picker.append(make('h4','','Dia de análise'),hint);
   if(reference&&!observado)picker.append(make('p','studio-met-day-hint','Referência usada · '+reference));
   heading.after(picker);
   move(calendar,picker);
   picker.append(legend);
   const comparison=routePanel.querySelector(':scope>.met-comparacoes');
   const chart=routePanel.querySelector(':scope>.met-chart');
   if(comparison&&chart)move(chart,routePanel,comparison.nextSibling);
   const nativeLegend=routePanel.querySelector(':scope>p.met-nota:last-of-type');
   if(nativeLegend&&/^[✓!]/.test(textOf(nativeLegend))){
    nativeLegend.classList.add('studio-support-source');
    cleanup.push(()=>nativeLegend.classList.remove('studio-support-source'));
   }
   cleanup.push(()=>picker.remove());
  }
  function groupPortfolioAnalyses(toolbar){
   const names=['Comparar carteiras','Casos e continuidade','Referências econômicas'];
   const analyses=[...toolbar.children].filter(n=>n.matches('button')&&names.includes(textOf(n)));
   if(!analyses.length)return;
   const menu=own(make('details','studio-portfolio-analyses studio-ui'));
   const active=analyses.find(n=>n.classList.contains('on'));
   const trigger=make('summary','',active?textOf(active):'Análises da carteira');
   menu.append(trigger);
   analyses[0].before(menu);
   for(const button of analyses)move(button,menu);
   menu.addEventListener('keydown',event=>{
    if(event.key==='Escape'){menu.open=false;trigger.focus();}
   });
   cleanup.push(()=>menu.remove());
  }
  function compactPortfolioFilters(scope){
   const controls=[...scope.querySelectorAll(':scope>.ac4-scope-controls,:scope>label:has(select)')];
   if(!controls.length)return;
   const currentRoute=route;
   const panel=own(make('details','studio-portfolio-filters studio-ui'));
   const temporal=scope.querySelector(':scope>label select')?.selectedOptions[0]?.textContent;
   const summary=make('summary','','Filtros da carteira');
   if(temporal)summary.append(make('small','',temporal));
   panel.append(summary);
   scope.prepend(panel);
   panel.open=openPortfolioFilters.has(currentRoute);
   panel.ontoggle=()=>{
    if(!panel.isConnected)return;
    if(panel.open)openPortfolioFilters.add(currentRoute);
    else openPortfolioFilters.delete(currentRoute);
   };
   const fields=make('div','studio-portfolio-fields');
   panel.append(fields);
   for(const control of controls)move(control,fields);
   const note=scope.querySelector(':scope>p.ac4-note');
   if(note)move(note,panel);
   cleanup.push(()=>panel.remove());
  }
  function addDailyTrend(card,title){
   const canvas=page.querySelector('#res-overview-evolution');
   if(!canvas)return;
   const frame=requestAnimationFrame(()=>{
    const data=window.Chart?.getChart(canvas)?.data;
    const series=data?.datasets.find(dataset=>dataset.label===title)?.data;
    if(!series)return;
    const values=series.filter(Number.isFinite);
    if(values.length<2)return;
    const low=Math.min(...values),high=Math.max(...values);
    const dates=data.labels.map(label=>Date.parse(label));
    const span=dates.at(-1)-dates[0];
    if(!Number.isFinite(span)||span<=0)return;
    const figure=own(make('figure','studio-daily-trend'));
    figure.style.color=title==='Faturamento'?'var(--studio-brand-primary)':'var(--studio-brand-secondary)';
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 100 34');
    svg.setAttribute('aria-hidden','true');
    const path=document.createElementNS(svg.namespaceURI,'path');
    let line='',lastDate=null;
    series.forEach((value,i)=>{
     if(!Number.isFinite(value)){lastDate=null;return;}
     const x=2+96*(dates[i]-dates[0])/span;
     const y=high===low?17:30-26*(value-low)/(high-low);
     line+=(dates[i]-lastDate===86400000?'L':'M')+x.toFixed(2)+' '+y.toFixed(2);
     lastDate=dates[i];
    });
    path.setAttribute('d',line);
    svg.append(path);
    figure.append(svg,make('figcaption','','Por dia'));
    figure.title=title+' por dia · '+data.labels[0]+' — '+data.labels.at(-1);
    card.append(figure);
    cleanup.push(()=>figure.remove());
   });
   cleanup.push(()=>cancelAnimationFrame(frame));
  }
  function compactCard(n,item){
   const icons={'Faturamento':'chart','Pós-Ads':'money','Pré-Ads':'money','Publicidade':'manage','Unidades':'box','Pedidos identificados':'sales','Demandas em acompanhamento':'tasks','O que foi registrado':'tasks','Efeito medido':'chart','Ainda sem registro':'panel','Atrasadas agora':'tasks','Retornos vencidos':'chat'};
   const heading=n.querySelector(':scope>h3'),iconName=icons[item.title];
   if(heading&&iconName&&options.icon){
    const marker=own(make('span','studio-metric-icon'));
    marker.append(options.icon(iconName));
    heading.prepend(marker);
    cleanup.push(()=>marker.remove());
   }
   if(route==='resultados/overview'&&['Faturamento','Pós-Ads'].includes(item.title))addDailyTrend(n,item.title);
   if(n.matches('.ac6-kpi')){
    const value=textOf(n.querySelector('.sum-value')).match(/^(\d+)\/(\d+)$/);
    if(value&&Number(value[2])>0){
     const meter=own(make('progress','studio-register-meter'));
     meter.max=Number(value[2]);
     meter.value=Number(value[1]);
     meter.setAttribute('aria-label',item.title);
     n.querySelector('.sum-value').after(meter);
     cleanup.push(()=>meter.remove());
    }
   }
   const details=make('details','studio-kpi-detail studio-ui'),summary=make('summary','','Detalhes');summary.setAttribute('aria-label','Detalhes de '+item.title);details.append(summary);let count=0;
   for(const p of n.querySelectorAll(':scope>p,:scope>.sum-note')){
    const t=textOf(p);
    if(!t||p.matches('.met-quick-label')||n.matches('.ac6-kpi'))continue;
    if(route==='resultados/overview'&&/^(Ticket:|TACOS:)/.test(t))continue;
    if(p.matches('.sum-delta')||/^[+−-].*(?:R\$|%|p\.p\.)/.test(t)){
     p.classList.add('studio-kpi-comparison');
     cleanup.push(()=>p.classList.remove('studio-kpi-comparison'));
     continue;
    }
    move(p,details);
    count++;
   }
   if(count){n.append(own(details));cleanup.push(()=>details.remove());const value=textOf(n.querySelector('.sum-value,.kpi-val,strong'));if(!value.includes('%')){const ratio=textOf(details).match(/[-−+]?\d[\d.,]*\s*%[^·.;]{0,28}/);if(ratio&&/margem|pos.ads|pre.ads/i.test(C.normalize(item.title))){const foot=own(make('small','studio-kpi-foot',ratio[0]));n.append(foot);cleanup.push(()=>foot.remove());}}}
   const value=n.querySelector('.sum-value,.kpi-val,strong');if(value){const hint=textOf(details);if(/parcial/i.test(item.title+' '+hint)||/estimad|rateio/i.test(hint)){const flag=make('span','studio-estimate',/parcial/i.test(item.title+' '+hint)?'Parcial':'Estimado');n.append(own(flag));cleanup.push(()=>flag.remove());}}
   const drill=options.drilldown?.(item);if(drill&&!n.querySelector('button')){const link=own(btn(drill.label,drill.run,'studio-kpi-open studio-ui'));n.append(link);cleanup.push(()=>link.remove());}
   n.classList.add('studio-kpi-native');cleanup.push(()=>n.classList.remove('studio-kpi-native'));
  }
  function mini(item){const frame=make('div','studio-mini');frame.setAttribute('aria-hidden','true');
   if(item.kind==='kpi'){frame.append(make('small','',item.title),make('strong','',textOf(item.n.querySelector('.sum-value,.kpi-val,strong'))));return frame;}
   if(item.kind==='table'){const t=make('div','studio-mini-table');for(const row of [...item.n.querySelectorAll('tr')].slice(0,4)){const r=make('div');for(const cell of [...row.children].slice(0,3))r.append(make('span','',textOf(cell).slice(0,18)));t.append(r);}frame.append(t);return frame;}
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 180 90');
   const path=(d,cls)=>{const e=document.createElementNS(svg.namespaceURI,'path');e.setAttribute('d',d);e.setAttribute('class',cls);svg.append(e);};
   const chart=item.n.querySelector('canvas'),instance=chart&&window.Chart?.getChart(chart),raw=instance?.data?.datasets?.[0]?.data||[],values=raw.slice(0,18).map(v=>typeof v==='number'?v:Number(v?.y)).filter(Number.isFinite);
   if(values.length>1){const lo=Math.min(...values),hi=Math.max(...values),points=values.map((v,i)=>[10+i*160/(values.length-1),70-(v-lo)/(hi-lo||1)*50]);path('M'+points.map(p=>p.join(',')).join('L'),'studio-mini-line');}
   else if(item.kind==='form'){for(let i=0;i<3;i++)path('M12 '+(20+i*25)+'h150','studio-mini-rule');}
   else{path('M12 20h92M12 42h150M12 64h124','studio-mini-rule');path('M12 78h155','studio-mini-line');}
   frame.append(svg);return frame;
  }
  function save(){options.persist();apply();}
  function tableTools(item,container){
   const table=item.n.matches('table')?item.n:item.n.querySelector('table');if(!table)return;
   const rows=[...table.tBodies].flatMap(body=>[...body.rows]),headers=[...(table.tHead?.rows?.[0]?.cells||[])];
   const simpleRow=row=>[...row.cells].every(cell=>cell.colSpan===1&&cell.rowSpan===1);
   const dataRows=rows.filter(simpleRow);
   const canChoose=table.tHead?.rows.length===1&&simpleRow(table.tHead.rows[0])&&
    rows.every(row=>row.cells.length===1&&row.cells[0].colSpan===headers.length||row.cells.length===headers.length&&simpleRow(row));
   const info=make('span','studio-table-count');
   const updateCount=()=>{info.textContent=dataRows.length.toLocaleString('pt-BR')+' linhas carregadas'+
    (canChoose?' · '+headers.filter(h=>!h.hidden&&getComputedStyle(h).display!=='none').length+' colunas':'');};
   container.append(info);
   const cols=make('details','studio-columns studio-ui'),label=make('summary','','Colunas');cols.append(label);const menu=make('div','studio-columns-menu');cols.append(menu);
   const config=()=>{state.tables??={};return state.tables[item.id]??=( {hidden:[],density:'compact'} );};
   const originals=[];
   if(canChoose)headers.forEach((h,index)=>{
    if(h.hidden||getComputedStyle(h).display==='none')return;
    const key=textOf(h)||'Coluna '+(index+1);
    const cells=[h,...dataRows.map(row=>row.cells[index])],before=cells.map(c=>c.hidden);
    originals.push(()=>cells.forEach((cell,i)=>{cell.hidden=before[i];}));
    const row=make('label'),input=make('input');
    input.type='checkbox';input.checked=!config().hidden.includes(key);
    const paint=()=>cells.forEach((cell,i)=>{cell.hidden=before[i]||!input.checked;});
    paint();
    input.onchange=()=>{config().hidden=input.checked?config().hidden.filter(k=>k!==key):[...new Set([...config().hidden,key])];paint();updateCount();options.persist();};
    row.append(input,make('span','',key));menu.append(row);
   });
   const density=make('select');density.setAttribute('aria-label','Densidade de '+item.title);for(const[v,t]of [['compact','Compacta'],['comfortable','Confortável']])density.append(new Option(t,v));density.value=config().density;density.onchange=()=>{config().density=density.value;item.widget.dataset.density=density.value;options.persist();};item.widget.dataset.density=config().density;
   updateCount();
   if(menu.children.length)container.append(cols);
   container.append(density);
   cleanup.push(()=>originals.forEach(fn=>fn()));
  }
  function widget(item){const w=item.n,head=own(make('header','studio-widget-head studio-ui')),actions=make('div','studio-widget-actions');item.widget=w;const original={hidden:w.hidden,order:w.style.order,span:w.style.getPropertyValue('--studio-span'),label:w.getAttribute('aria-label')};w.classList.add('studio-widget','studio-kind-'+item.kind);moving.add(w);w.dataset.studioManaged='true';w.dataset.studioWidget=item.id;w.setAttribute('aria-label',item.title);cleanup.push(()=>{w.style.order=original.order;w.style.setProperty('--studio-span',original.span);w.classList.remove('studio-widget','studio-kind-'+item.kind,'studio-kpi');delete w.dataset.studioHidden;delete w.dataset.studioWidget;delete w.dataset.size;delete w.dataset.density;if(original.label==null)w.removeAttribute('aria-label');else w.setAttribute('aria-label',original.label);head.remove();});
   const title=make('h2','',item.title);head.append(title,actions);const size=make('select');size.setAttribute('aria-label','Largura de '+item.title);for(const[v,t]of [['compact','1/4'],['third','1/3'],['half','1/2'],['wide','2/3'],['full','Inteira']])size.append(new Option(t,v));size.value=state.sizes[item.id]||item.size;size.onchange=()=>{state.sizes[item.id]=size.value;save();};
   if(item.nativeTitle){title.hidden=true;head.classList.add('studio-widget-actions-only');}
   const individualChart=item.kind==='chart'&&w.querySelectorAll('canvas').length===1;
   if(individualChart){w.classList.add('studio-single-chart');cleanup.push(()=>w.classList.remove('studio-single-chart'));}
   actions.append(size);
   if(item.canExpand!==false){
    const expandButton=btn('↗',()=>{const native=individualChart&&w.querySelector('button[aria-label^="Ampliar gráfico"],.bc-viz-tools button');if(native)native.click();else options.expand(w,item.title);},'studio-expand');
    expandButton.setAttribute('aria-label','Ampliar '+item.title);
    actions.append(expandButton);
   }
   const organize=btn('⋮',()=>openLibrary(item.id),'studio-options');
   organize.setAttribute('aria-label','Organizar '+item.title);
   actions.append(organize);
   if(item.kind==='chart'){const replay=btn('↻',()=>{for(const canvas of w.querySelectorAll('canvas'))window.BCReviewCharts?.replay(window.Chart?.getChart(canvas));},'studio-replay');replay.setAttribute('aria-label','Reproduzir animação de '+item.title);replay.title='Reproduzir animação';actions.append(replay);}
   if(item.kind==='embed')return w;
   if(item.kind==='kpi'){w.classList.add('studio-kpi');compactCard(w,item);}
   else if(item.kind!=='help'){
    if(!item.keepHeadings){
     const selector=w.matches('.res-goal-strip')?':scope>strong':':scope>h2,:scope>h3,:scope>h4,:scope>.cc-hdr .cc-title';
     for(const caption of w.querySelectorAll(selector)){caption.classList.add('studio-native-caption');cleanup.push(()=>caption.classList.remove('studio-native-caption'));}
    }
    w.prepend(head);
   }
   if(w.matches('.met-rota'))arrangeMetas(w);
   if(w.id==='res-forecast-pacing')arrangeForecastPacing(w);
   if(item.kind==='table'){const tools=own(make('div','studio-table-tools studio-ui'));tableTools(item,tools);head.after(tools);cleanup.push(()=>tools.remove());}return w;
  }
  function apply(){if(!host)return;const order=state.order||[];const sorted=widgets.slice().sort((a,b)=>{const ai=order.indexOf(a.id),bi=order.indexOf(b.id);return(ai<0?999:ai)-(bi<0?999:bi)||a.rank-b.rank;});
   const sales=route==='vendas/vendas';
   for(const [index,item]of sorted.entries()){
    const visible=item.required||(state.items[item.id]??(state.mode==='all'||item.essential));
    item.widget.dataset.studioHidden=String(!visible);
    item.widget.dataset.size=state.sizes[item.id]||item.size;
    item.widget.style.setProperty('--studio-span',C.sizes[item.widget.dataset.size]||6);
    item.widget.style.order=String(20+index*(sales?8:1));
   }
   if(sales){
    const salesTable=sorted.find(item=>item.kind==='table'&&item.n.matches('#tbl-vendas,:has(#tbl-vendas)'));
    page.style.setProperty('--studio-sales-table-order',salesTable?.widget.style.order||'900');
   }
   const hidden=widgets.filter(i=>i.widget.dataset.studioHidden==='true').length;host.querySelector('.studio-library-trigger').textContent='Adicionar widgets'+(hidden?' · '+hidden:'');
   for(const button of host.querySelectorAll('[data-studio-mode]')){
    button.setAttribute('aria-pressed',String(button.dataset.studioMode===state.mode));
   }
   requestAnimationFrame(()=>{for(const item of widgets.filter(i=>i.widget.dataset.studioHidden!=='true'))for(const c of item.widget.querySelectorAll('canvas'))window.Chart?.getChart(c)?.resize();});
  }
  function reorder(id,direction){const list=widgets.slice().sort((a,b)=>{const ai=state.order.indexOf(a.id),bi=state.order.indexOf(b.id);return(ai<0?999:ai)-(bi<0?999:bi)||a.rank-b.rank;}).map(w=>w.id),i=list.indexOf(id),j=i+direction;if(j<0||j>=list.length)return;[list[i],list[j]]=[list[j],list[i]];state.order=list;save();renderLibrary(id);}
  function openLibrary(focusId){if(page.querySelector('iframe')&&options.productLibrary){options.productLibrary();return;}if(!library){library=own(make('dialog','studio-library studio-ui'));document.body.append(library);library.setAttribute('aria-label','Biblioteca de widgets');library.addEventListener('close',()=>options.onLibrary?.(false));}renderLibrary(focusId);if(!library.open){options.onLibrary?.(true);library.showModal();}}
  function renderLibrary(focusId){if(!library)return;const focused=library.contains(document.activeElement)?document.activeElement:null,position=focused?.selectionStart;library.replaceChildren();const header=make('header'),copy=make('div');copy.append(make('small','','PERSONALIZAR PÁGINA'),make('h2','','Seus widgets'));header.append(copy,btn('Fechar',()=>library.close()));const description=make('p','studio-library-copy','Escolha o que acompanhar. Ordem, largura e seleção ficam salvas para você nesta página.');const search=make('input');search.type='search';search.placeholder='Buscar indicador, gráfico ou tabela';search.setAttribute('aria-label','Buscar widget');search.value=filterText;search.oninput=()=>{filterText=search.value;renderLibrary();library.querySelector('input[type=search]').focus();library.querySelector('input[type=search]').setSelectionRange(filterText.length,filterText.length);};library.append(header,description,search);
   const list=make('div','studio-library-list'),ordered=widgets.slice().sort((a,b)=>{const ai=state.order.indexOf(a.id),bi=state.order.indexOf(b.id);return(ai<0?999:ai)-(bi<0?999:bi)||a.rank-b.rank;});
   for(const item of ordered){if(!C.normalize(item.title+' '+names[item.kind]).includes(C.normalize(filterText)))continue;const row=make('article','studio-library-item');row.dataset.widgetId=item.id;row.draggable=true;row.ondragstart=e=>{dragId=item.id;e.dataTransfer.setData('text/plain',item.id);};row.ondragover=e=>e.preventDefault();row.ondrop=e=>{e.preventDefault();if(!dragId||dragId===item.id)return;const ids=ordered.map(i=>i.id).filter(id=>id!==dragId);ids.splice(ids.indexOf(item.id),0,dragId);state.order=ids;save();renderLibrary(dragId);};row.append(mini(item));const body=make('div','studio-library-item-copy');body.append(make('span','studio-kind-label',names[item.kind]),make('h3','',item.title),make('p','',purpose(item)));const controls=make('div','studio-library-item-controls'),selected=item.widget.dataset.studioHidden!=='true',choose=btn(item.required?'Fixo nesta página':selected?'Remover':'Adicionar',()=>{state.items[item.id]=!selected;save();renderLibrary(item.id);},selected?'studio-selected':'studio-add');choose.disabled=item.required;choose.setAttribute('aria-label',(selected?'Remover ':'Adicionar ')+item.title);choose.setAttribute('aria-pressed',String(selected));controls.append(choose,btn('↑',()=>reorder(item.id,-1)),btn('↓',()=>reorder(item.id,1)));controls.children[1].setAttribute('aria-label','Mover '+item.title+' para cima');controls.children[2].setAttribute('aria-label','Mover '+item.title+' para baixo');const size=make('select');size.setAttribute('aria-label','Tamanho de '+item.title);for(const[v,t]of [['compact','Compacto'],['third','Um terço'],['half','Meia largura'],['wide','Amplo'],['full','Largura inteira']])size.append(new Option(t,v));size.value=state.sizes[item.id]||item.size;size.onchange=()=>{state.sizes[item.id]=size.value;save();};controls.append(size);body.append(controls);row.append(body);list.append(row);}
   if(!list.children.length)list.append(make('p','studio-empty-search','Nenhum widget encontrado nesta página.'));const footer=make('footer');footer.append(btn('Restaurar composição sugerida',()=>{state.mode='essential';state.items={};state.order=[];state.sizes={};state.tables={};save();renderLibrary();}),make('small','','Arraste um cartão para mudar a ordem ou use as setas.'));library.append(list,footer);if(focusId)library.querySelector('[data-widget-id="'+CSS.escape(focusId)+'"]')?.scrollIntoView({block:'nearest'});if(position!=null&&focused?.type==='search'){search.focus();search.setSelectionRange(position,position);}
  }
  function purpose(item){if(item.kind==='kpi')return'Acompanhe o valor e a referência. A composição detalhada fica em Detalhes.';if(item.kind==='table')return'Consulte os registros, ajuste colunas e abra o detalhe sem perder o recorte.';if(item.kind==='chart')return'Leia evolução e comparação; amplie para investigar os pontos da série.';if(item.kind==='form')return'Campos e ações do fluxo, com seus vínculos e validações preservados.';return'Identifique prioridades e aprofunde os itens deste recorte.';}
  function compose(nextPage,nextRoute){if(working||!nextPage)return;working=true;working=false;restore();working=true;page=nextPage;route=nextRoute;revision++;const p=C.profile(route);state=options.settings();if(state.composition!==3){state.composition=3;state.items={};state.order=[];state.sizes={};state.tables={};state.mode='essential';options.persist();}state.sizes??={};state.tables??={};
   const resultSourceId=resultSources[route],source=resultSourceId?page.querySelector('#'+resultSourceId):page;
   if(resultSourceId){
    const currentPage=page;
    currentPage.classList.add('studio-result-page');
    source?.classList.add('studio-result-source');
    cleanup.push(()=>{currentPage.classList.remove('studio-result-page');source?.classList.remove('studio-result-source');});
   }
   const collected=collect(page,p,source);
   const refresh=route==='resultados/overview'&&collected.controls.find(n=>n.matches('button')&&textOf(n)==='Atualizar Visão Geral');
   host=own(make('div','studio-workspace'));const tools=own(make('div','studio-page-tools studio-ui')),purposeText=make('p','studio-purpose',p.purpose),libraryButton=btn('Adicionar widgets',()=>openLibrary(),'studio-library-trigger studio-primary'),all=btn('Todas as análises',()=>{state.mode='all';state.items={};save();}),essential=btn('Visão essencial',()=>{state.mode='essential';state.items={};save();}),filterButton=btn('Filtros',()=>{state.filtersOpen=!state.filtersOpen;options.persist();page.classList.toggle('studio-filters-open',state.filtersOpen);}),aboutButton=btn('Como ler esta página',()=>{about.open=!about.open;guideRoute=about.open?route:'';if(about.open)about.scrollIntoView({block:'nearest'});},'studio-guide-button');
   const views=make('div','studio-view-options');
   views.setAttribute('role','group');
   views.setAttribute('aria-label','Composição da página');
   essential.dataset.studioMode='essential';
   all.dataset.studioMode='all';
   views.append(essential,all);
   tools.append(purposeText,filterButton,views,libraryButton,aboutButton);
   if(refresh){
    const requery=btn('Reconsultar',()=>refresh.click());
    requery.title='Consultar novamente os dados disponíveis para o recorte selecionado';
    tools.insertBefore(requery,filterButton);
    refresh.classList.add('studio-support-source');
    cleanup.push(()=>refresh.classList.remove('studio-support-source'));
   }
   primary=own(make('div','studio-primary-controls'));advanced=own(make('details','studio-filter-panel'));advanced.append(make('summary','','Filtros e referências'));const filterBody=own(make('div','studio-filter-body'));advanced.append(filterBody);const grid=own(make('div','studio-grid'));about=own(make('details','studio-about'));about.append(make('summary','','Guia de leitura'));const aboutBody=own(make('div','studio-about-body'));about.append(aboutBody);host.append(tools,primary,advanced,grid,about);page.prepend(host);
   const guides=[...page.querySelectorAll('.bc-reading-guide')].filter(n=>sourceVisible(n.parentElement,page));
   const guide=guides.find(n=>sourceVisible(n,page))||guides[0];
   const gerKey={'gerencial/panorama':'panorama','gerencial/ger-vendas':'gerVendas','gerencial/diag':'diagnostico','gerencial/produtos':'anuncios','gerencial/ads':'publicidade','gerencial/previsao':'forecastAnuncios','gerencial/full':'full'}[route];
   const spec=typeof BCAreas==='undefined'?null:BCAreas[gerKey]||Object.values(BCAreas).find(area=>{
    const root=page.matches(area.selector)?page:page.querySelector(area.selector);
    return root&&sourceVisible(root,page);
   });
   const lines=guide?[...guide.querySelectorAll(':scope>p')].map(textOf):[];
   const reading=lines.length?lines:spec?[spec.read,spec.scope,spec.next]:[p.purpose];
   if(C.guidance[route])reading.push(C.guidance[route]);
   const section=make('section','studio-guide-copy');
   for(const line of reading.filter(Boolean))section.append(make('p','',line));
   aboutBody.append(section);
   for(const native of guides){
    native.classList.add('studio-support-source');
    cleanup.push(()=>native.classList.remove('studio-support-source'));
   }
   if(guideRoute!==route)guideRoute='';
   about.open=guideRoute===route;
   about.id='studio-about-'+page.id;
   aboutButton.setAttribute('aria-controls',about.id);
   aboutButton.setAttribute('aria-expanded','false');
   const infoPanel=about;
   infoPanel.ontoggle=()=>{if(infoPanel.isConnected){guideRoute=infoPanel.open?route:'';aboutButton.setAttribute('aria-expanded',String(infoPanel.open));}};
   function through(n){for(let parent=n.parentElement;parent&&parent!==page;parent=parent.parentElement){if(parent.classList.contains('studio-through'))continue;parent.classList.add('studio-through');const current=parent;cleanup.push(()=>current.classList.remove('studio-through'));}}
   for(const n of collected.controls){
    if(n===refresh)continue;
    if(n.id==='ger-empty'&&route==='gerencial/ger-vendas'){
     // Preserve the native empty state for the other Gerencial tabs.
     const prompt=own(make('section','studio-operation-prompt studio-ui'));
     const company=document.getElementById('bc-company'),market=document.getElementById('bc-marketplace');
     const field=company?.value?market:company;
     prompt.append(make('h2','','Escolha a operação'),make('p','',company?.value?'Selecione o marketplace de '+company.selectedOptions[0].text+' para ver pedidos, tarifas e custos no período.':'Selecione a empresa e o marketplace para consultar os pedidos, tarifas e custos da operação.'));
     if(field&&!field.disabled)prompt.append(btn(company?.value?'Escolher marketplace':'Escolher empresa',()=>{field.focus();try{field.showPicker?.();}catch{};}));
     if(options.canNavigate?.('vendas','vendas'))prompt.append(btn('Ver vendas de todos os marketplaces',()=>options.navigate('vendas','vendas')));
     n.before(prompt);
     n.classList.add('studio-support-source');
     cleanup.push(()=>{prompt.remove();n.classList.remove('studio-support-source');});
     continue;
    }
    if(n.matches('.ac4-levels'))groupPortfolioAnalyses(n);
    if(n.matches('.ac4-scope'))compactPortfolioFilters(n);
    const rootFilter=n.parentElement===source&&n.matches('.op-controls,.res-controls')&&p.route.startsWith('resultados/');
    const important=n.id==='ger-empty'||rootFilter||p.flow==='form'||n.matches(pageControls+',nav,p,[role=tablist],[role=status]')||
     /PRODUTO \(SKU\)|Consultar SKU|Procurar produtos|Agrupar itens|Lente|Colunas|Competência|Tentar novamente/i.test(textOf(n));
    const presentation=important?'studio-primary-control':'studio-advanced-control';
    through(n);
    n.classList.add('studio-native-control',presentation);
    cleanup.push(()=>n.classList.remove('studio-native-control',presentation));
   }
   for(const n of collected.support){const text=textOf(n);if(text)aboutBody.append(make('p','',text));if(!n.querySelector('button,a,input,select,textarea')){n.classList.add('studio-support-source');cleanup.push(()=>n.classList.remove('studio-support-source'));}else{through(n);n.classList.add('studio-context-actions');cleanup.push(()=>n.classList.remove('studio-context-actions'));for(const leaf of n.querySelectorAll('h1,h2,h3,h4,p,strong'))if(!leaf.querySelector('button,a,input,select')&&!leaf.closest('button,a')){leaf.classList.add('studio-support-source');cleanup.push(()=>leaf.classList.remove('studio-support-source'));}}}
   const reference=collected.support.map(textOf).join(' ').match(/(?:refer[eê]ncia|autom[aá]tica|m[eê]s anterior)[^.]{0,100}\d{2}\/\d{2}\/\d{4}[^.]{0,100}/i);if(reference){const caption=own(make('p','studio-reference',reference[0]));host.append(caption);}
   function sourceKey(n){const path=[];for(let cur=n;cur&&cur!==page;cur=cur.parentElement){if(cur.id){path.unshift('#'+cur.id);break;}path.unshift(cur.tagName.toLowerCase()+':'+[...cur.parentElement.children].filter(c=>!c.matches('.studio-ui,.studio-workspace')).indexOf(cur));}return path.join('/');}
   const ids=new Map(),items=collected.found.map(item=>{const nativeId=item.sourceId||item.n.id||item.n.querySelector('canvas')?.id||sourceKey(item.n),base=route+'::v3:'+item.kind+':'+nativeId,count=(ids.get(base)||0)+1;ids.set(base,count);return{...item,id:base+(count>1?':'+count:''),rank:0};});
   widgets=C.defaults(items,p).sort((a,b)=>C.rank(a,p)-C.rank(b,p));widgets.forEach((item,index)=>{item.rank=index;through(item.n);widget(item);});page.dataset.studioRoute=route;page.classList.add('studio-active-page');page.classList.toggle('studio-filters-open',state.filtersOpen===true);const composedPage=page;cleanup.push(()=>{composedPage.classList.remove('studio-active-page','studio-filters-open');delete composedPage.dataset.studioRoute;composedPage.style.removeProperty('--studio-sales-table-order');});primary.hidden=true;advanced.hidden=true;filterButton.hidden=!page.querySelector('.studio-advanced-control');aboutButton.hidden=about.hidden=!aboutBody.children.length;working=false;apply();document.dispatchEvent(new CustomEvent('bc-review-composed',{detail:{page,route}}));if(library?.open)renderLibrary();
  }
  return{compose,restore,openLibrary,isManaged:n=>moving.has(n)||n.nodeType===1&&(n.dataset.studioOwned||n.dataset.studioManaged),scan:()=>({version:3,route,revision,widgets:widgets.map(i=>({id:i.id,title:i.title,kind:i.kind,size:state.sizes[i.id]||i.size,visible:i.widget.dataset.studioHidden!=='true',required:i.required})),tables:widgets.filter(i=>i.kind==='table').length,charts:widgets.filter(i=>i.kind==='chart').length})};
 }
 // Reorganizar widgets pode desanexar a tabela e fechar o seletor nativo.
 function presentationUpdates(refresh,uiSelector){
  let pending=false;
  const detectaSeletorAberto=CSS.supports('selector(select:open)');
  function run(){
   const frame=document.activeElement;
   if(detectaSeletorAberto&&(document.querySelector('select:open')||
      (frame?.tagName==='IFRAME'&&frame.contentDocument?.querySelector('select:open')))){
    setTimeout(run,120);
    return;
   }
   pending=false;
   refresh();
  }
  function schedule(){
   if(pending)return;
   pending=true;
   requestAnimationFrame(run);
  }
  document.addEventListener('click',event=>{
   const alvo=event.target;
   if(alvo.closest(uiSelector)||alvo.closest('select')||alvo.closest('label')?.control?.matches('select'))return;
   schedule();
  });
  document.addEventListener('change',event=>{if(!event.target.closest(uiSelector))schedule();});
  return schedule;
 }
 window.BCReviewStudio={create,presentationUpdates};
})();
