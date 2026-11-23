/* Nova apresentação sobre os componentes originais. Nenhum renderizador de negócio é substituído. */
(function(){'use strict';
 const $=id=>document.getElementById(id),el=(t,c,text)=>{const n=document.createElement(t);if(c)n.className=c;if(text!=null)n.textContent=text;return n;};
 const prefs=new Map(),registry=new Map();let lastRoute='',expanded=null,studio=null,lastView=null,pendingOrigin=null;const trail=[];
 const preferenceIdentity=String(BCAUTH.user.id),ui=window.BCReviewPreferenceStore||BCReviewPreferences.create(localStorage,preferenceIdentity);
 const schedule=BCReviewStudio.presentationUpdates(sync,'.review-ui,.studio-ui');
 const alias={'r-geral':'overview','r-diario':'diario','r-canais':'marketplaces','r-abc':'abc','r-forecast':'forecast','v-lista':'vendas','v-raiox':'raiox','g-vendas':'ger-vendas',diagnostico:'diag',anuncios:'produtos','g-forecast':'previsao',publicidade:'ads','g-metas':'metas','g-full':'full','o-envios':'envios','o-estoque':'estoque','o-projecao':'projecao','pv-fila':'pv-fila','a-tarefas':'tarefas','a-promocoes':'promos','a-ads':'ac-ads','a-alinhamentos':'alinhamentos','a-pendencias':'pendencias','f-dre':'dre','f-comissao':'comissao','f-fechamento':'gestao-fechamento','f-custos':'gestao-custos','f-carteiras':'gestao-carteiras'};
 const modes={'p-catalogo':'catalog','p-pendencias':'tasks','p-entradas':'entries','p-materiais':'materials','p-embalagens':'pack','p-preparacao':'prep','p-homologacao':'review','p-apuracao':'sales','p-atualizacao':'sync','p-integracao':'publication'};
 const button=(t,fn,cls='')=>{const b=el('button',cls,t);b.type='button';b.onclick=fn;return b;};
 const paths={panel:['M4 4h16v16H4z','M9 4v16'],search:['M21 21l-5-5','M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0'],settings:['M3 6h4m4 0h10M3 12h10m4 0h4M3 18h2m4 0h12','M11 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0M17 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0M9 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0'],chart:['M4 3v17h17','M8 14l4-5 4 2 5-7'],sales:['M5 7h14l1 14H4z','M8 7V5a4 4 0 0 1 8 0v2'],manage:['M4 7h16M4 17h16','M9 4v6M15 14v6'],box:['M3 7l9-5 9 5v10l-9 5-9-5z','M3 7l9 5 9-5M12 12v10'],products:['M4 3h6v7H4zM14 3h6v7h-6zM4 14h6v7H4zM14 14h6v7h-6z'],chat:['M4 4h16v12H9l-5 5z','M8 8h8M8 12h5'],tasks:['M7 4h10v3H7z','M7 5H4v16h16V5h-3M8 12l2 2 5-5M8 18h8'],money:['M3 5h17v16H3z','M3 5V3h15v2M15 11h6v5h-6z']};
 function icon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.65');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');for(const d of paths[name]||paths.panel){const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',d);svg.append(p);}return svg;}
 function iconButton(name,label,fn,cls=''){const b=button('',fn,'review-icon-button '+cls);b.append(icon(name));b.setAttribute('aria-label',label);b.title=label;return b;}
 const sidebar=el('aside','review-sidebar review-ui'),brand=el('div','review-brand'),collapse=iconButton('panel','Recolher menu lateral',()=>toggleSidebar(),'review-collapse');const home=button('',()=>{const target=homePage();if(target)open(target.group.id,target.item.id);},'review-home');
 home.append(el('b','','B'),el('strong','','BsanControl'));
 home.setAttribute('aria-label','BsanControl · Página inicial');
 brand.append(home,collapse);sidebar.append(brand);const nav=el('nav');nav.setAttribute('aria-label','Áreas e abas do BsanControl');sidebar.append(nav);document.body.prepend(sidebar);
 const bar=el('header','review-topbar review-ui'),crumb=el('div','review-crumb'),actions=el('div','review-top-actions'),menu=iconButton('panel','Expandir menu lateral',()=>toggleSidebar(),'review-menu');
 const search=el('form','review-search'),searchInput=el('input'),searchResults=el('div','review-search-results');search.setAttribute('role','search');searchInput.type='search';searchInput.placeholder='Buscar uma página ou ferramenta';searchInput.setAttribute('aria-label','Buscar no BsanControl');searchInput.autocomplete='off';searchResults.hidden=true;searchResults.setAttribute('aria-label','Resultados da busca');searchResults.setAttribute('role','region');search.append(icon('search'),searchInput,el('kbd','','Ctrl K'),searchResults);search.onsubmit=e=>{e.preventDefault();searchResults.querySelector('button')?.click();};searchInput.oninput=()=>searchPages();searchInput.onfocus=()=>searchPages();searchInput.onkeydown=e=>{if(e.key==='Escape'){searchResults.hidden=true;searchInput.blur();}if(e.key==='ArrowDown'){e.preventDefault();searchResults.querySelector('button')?.focus();}};
 bar.append(menu,search,actions);
 const toolsDialog=el('dialog','review-tools-dialog review-ui'),toolsHeading=el('header'),toolsClose=button('Fechar',()=>toolsDialog.close()),toolsContent=el('div','review-tools-content'),toolsHost=el('div','review-native-tools'),saveStatus=el('p','review-save-status');toolsDialog.setAttribute('aria-labelledby','review-tools-title');const toolsTitle=el('h2','','Preferências e ferramentas');toolsTitle.id='review-tools-title';toolsHeading.append(toolsTitle,toolsClose);toolsContent.append(button('Mapa de todas as páginas',()=>{toolsDialog.close();mapDialog();}),toolsHost,saveStatus);toolsDialog.append(toolsHeading,toolsContent);document.body.append(toolsDialog);
 const sidebarFooter=el('footer','review-sidebar-footer'),toolsButton=button('',()=>{document.body.classList.remove('review-menu-open');saveStatus.textContent=ui.saved?'Preferências salvas neste navegador para este usuário.':'Não foi possível salvar neste navegador. Verifique a permissão de armazenamento.';toolsDialog.showModal();},'review-sidebar-settings');toolsButton.append(icon('settings'),el('span','','Preferências'));toolsButton.setAttribute('aria-label','Preferências e ferramentas');toolsButton.title='Preferências e ferramentas';sidebarFooter.append(toolsButton);sidebar.append(sidebarFooter);document.body.insertBefore(bar,sidebar.nextSibling);
 const flyout=el('div','review-nav-flyout review-ui');flyout.hidden=true;document.body.append(flyout);
 const mobileShade=button('',()=>document.body.classList.remove('review-menu-open'),'review-mobile-shade review-ui');mobileShade.setAttribute('aria-label','Fechar menu lateral');document.body.append(mobileShade);
 const workspace=el('div','review-workspace');document.body.append(workspace);
 function mountChrome(){
  const context=$('bc-global-context'),heading=$('bc-page-title')?.parentElement.parentElement;
  if(heading&&heading.parentElement!==workspace&&heading!==workspace)workspace.prepend(heading);
  if(context&&heading&&context.previousElementSibling!==heading)heading.after(context);
  const originalActions=document.querySelector('.bc-header-top');if(originalActions&&originalActions.parentElement!==toolsHost)toolsHost.append(originalActions);
  const theme=$('theme-btn'),account=document.querySelector('.bc-account');if(theme&&theme.parentElement!==actions)actions.prepend(theme);if(account&&account.parentElement!==actions){account.querySelector('summary')?.setAttribute('data-initials',(BCAUTH.user.nome||'B').trim().charAt(0).toUpperCase());account.querySelector('summary')?.setAttribute('title',BCAUTH.user.nome+' · '+BCAUTH.user.perfil);actions.append(account);}
  for(const page of document.querySelectorAll('.page'))if(page.parentElement!==workspace)workspace.append(page);
  const productFrame=$('cadastro-produtos-frame');if(productFrame&&!productFrame.dataset.reviewIdentityBound){productFrame.dataset.reviewIdentityBound='true';const sendIdentity=()=>productFrame.contentWindow?.postMessage({type:'review-user',identity:preferenceIdentity},location.origin);productFrame.addEventListener('load',sendIdentity);sendIdentity();}
 }
 function current(){return typeof bcGroupedCurrent==='function'?bcGroupedCurrent():null;}
 function route(){const c=current();return c?c.group.id+'/'+c.item.id:activePage;}
 function settings(key=route()){if(!prefs.has(key)){const saved=ui.getLayout(key);prefs.set(key,saved||{mode:'essential',items:{},order:[]});}return prefs.get(key);}
 function persist(){ui.setLayout(route(),settings());}
 function open(group,id){
  restore();
  bcGroupedOpen(group,id);
  document.body.classList.remove('review-menu-open');
  flyout.hidden=true;
  searchResults.hidden=true;
  searchInput.value='';
  sidebarSync();
  schedule();
  window.scrollTo(0,0);
  const resolved=current();
  if(resolved?.item?.id)history.replaceState(null,'','#'+resolved.group.id+'/'+resolved.item.id);
 }
 function toggleSidebar(){if(matchMedia('(max-width:700px)').matches){document.body.classList.toggle('review-menu-open');return;}ui.setCollapsed(!ui.collapsed);document.body.classList.toggle('review-sidebar-collapsed',ui.collapsed);flyout.hidden=true;sidebarSync();requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));}
 function showFlyout(group,anchor){flyout.replaceChildren(el('strong','',group.label));for(const item of group.items.filter(i=>!i.disabled)){const b=button(item.label,()=>open(group.id,item.id));if(current()?.item.id===item.id)b.setAttribute('aria-current','page');flyout.append(b);}flyout.hidden=false;const scale=parseFloat(getComputedStyle(document.body).zoom)||1;flyout.style.top=Math.min(anchor.getBoundingClientRect().top/scale,Math.max(12,innerHeight/scale-flyout.offsetHeight-12))+'px';flyout.querySelector('button')?.focus();}
 const mobileNav=matchMedia('(max-width:700px)');
 let expandedGroup=null,activeNavRoute=null;
 function sidebarSync(){
  const groups=bcGroupedCatalogue(),active=current(),activeKey=active?active.group.id+'/'+active.item.id:null;
  const compact=ui.collapsed&&!mobileNav.matches;
  if(activeNavRoute!==activeKey){activeNavRoute=activeKey;expandedGroup=active?.group.id||null;}
  const signature=JSON.stringify([groups.map(g=>[g.id,g.items.map(i=>[i.id,i.label,i.disabled])]),activeKey,expandedGroup,compact]);
  if(nav.dataset.signature===signature)return;
  nav.dataset.signature=signature;
  nav.replaceChildren();
  const symbols={resultados:'chart',vendas:'sales',gerencial:'manage',operacao:'box','cadastro-produtos':'products','pos-venda':'chat',acompanhamento:'tasks',financeiro:'money'};
  for(const group of groups){
   const section=el('section','review-nav-group'),items=group.items.filter(item=>!item.disabled);
   const expanded=expandedGroup===group.id&&!compact&&items.length>1;
   const head=button('',()=>{
    if(items.length===1){open(group.id,items[0].id);return;}
    if(compact){showFlyout(group,head);return;}
    expandedGroup=expanded?null:group.id;
    sidebarSync();
    nav.querySelector('[data-review-area="'+group.id+'"]')?.focus({preventScroll:true});
   },'review-nav-area');
   head.disabled=items.length===0;
   head.dataset.reviewArea=group.id;
   head.append(icon(symbols[group.id]||'chart'),el('span','review-nav-label',group.label));
   if(items.length>1){
    head.append(el('span','review-nav-chevron',expanded?'⌄':'›'));
    head.setAttribute('aria-expanded',String(expanded));
   }
   head.setAttribute('aria-label',group.label);
   head.title=group.label;
   if(active?.group.id===group.id){
    head.classList.add('review-nav-active');
    if(items.length===1)head.setAttribute('aria-current','page');
   }
   section.append(head);
   if(expanded)for(const item of items){
    const destination=group.id+'/'+item.id,b=button(item.label,()=>open(group.id,item.id));
    b.dataset.reviewRoute=destination;
    if(activeKey===destination)b.setAttribute('aria-current','page');
    section.append(b);
   }
   nav.append(section);
  }
  crumb.textContent=active?active.group.label+' / '+active.item.label:'BsanControl';
 }
 mobileNav.addEventListener('change',sidebarSync);
 function searchPages(){const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),query=normalize(searchInput.value.trim());searchResults.replaceChildren();let count=0;for(const g of bcGroupedCatalogue())for(const item of g.items){if(count>=12||item.disabled||!normalize(g.label+' '+item.label).includes(query))continue;const b=button('',()=>open(g.id,item.id));b.append(el('span','',item.label),el('small','',g.label));b.dataset.reviewSearchRoute=g.id+'/'+item.id;searchResults.append(b);count++;}if(!count)searchResults.append(el('p','','Nenhuma página encontrada.'));searchResults.hidden=false;}
 document.addEventListener('pointerdown',e=>{if(!search.contains(e.target))searchResults.hidden=true;if(!flyout.contains(e.target)&&!nav.contains(e.target))flyout.hidden=true;});document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();searchInput.focus();}if(e.key==='Escape'){flyout.hidden=true;searchResults.hidden=true;document.body.classList.remove('review-menu-open');}});
 const selectors='.res-block,.res-chart,.res-deck,.ger-block,.ger-summary,.op-block,.op-chart,.sum-kpis,.fin-reading,.ac4-block,.ac6-block,.cc,.met-section,.met-rota,.met-resumo,.met-route,.met-quick,.met-kpis,.fc-products,.fc-kpis,.fc-chart,.pv-section,.pv-metrics,.pv-priority-grid,.ger-products,.gs-page > div';
 function nativeVisible(node,page){for(let p=node;p&&p!==page;p=p.parentElement){if(p.classList?.contains('review-widget'))continue;if(p.hidden||getComputedStyle(p).display==='none')return false;}return true;}
 function titleOf(node){const text=node.querySelector('h2,h3,h4,summary,.cc-title,.chart-title,.kpi-eye')?.textContent?.trim();return text||node.querySelector('canvas')?.getAttribute('aria-label')||node.querySelector('canvas')?.id||(/kpis|resumo|metrics/.test(node.className)?'Indicadores do resultado':node.querySelector('table')?'Tabela detalhada':'Análise da aba');}
 function decorate(){const page=document.querySelector('.page.on');if(!page)return;if(studio){studio.compose(page,route());return;}const key=route(),s=settings(key);if(key!==lastRoute){registry.clear();lastRoute=key;}
  let toolbar=page.querySelector(':scope > .review-toolbar');if(!toolbar){toolbar=el('div','review-toolbar review-ui');toolbar.append(el('span','','Mesmos indicadores e controles da plataforma original'),button('Essencial',()=>preset('essential')),button('Todos os recursos',()=>preset('all')),button('＋ Personalizar',()=>personalize(),'review-primary'));page.prepend(toolbar);}
  // O renderizador pode substituir um painel inteiro sem trocar a rota. Remova
  // seus registros antes de atribuir IDs aos componentes recém-renderizados.
  for(const[id,item]of registry)if(!item.node.isConnected||!nativeVisible(item.node,page))registry.delete(id);
  for(const widget of page.querySelectorAll('.review-widget')){const id=widget.dataset.reviewWidget,node=widget.querySelector('.review-body')?.firstElementChild;if(node&&nativeVisible(node,page)&&!registry.has(id)){const title=titleOf(node);widget.setAttribute('aria-label',title);widget.querySelector('.review-widget-head strong').textContent=title;registry.set(id,{id,title,node,widget});}}
  const candidates=[...page.querySelectorAll(selectors)].filter(n=>!n.closest('.review-ui,dialog')&&!n.classList.contains('review-body')&&!n.closest('.review-widget')&&!n.parentElement.closest(selectors));
  for(const node of candidates){if(!nativeVisible(node,page))continue;const title=titleOf(node),base=node.id||node.querySelector('canvas')?.id||title;let id=key+'::'+base;let i=2;while([...registry.values()].some(v=>v.id===id&&v.node!==node))id=key+'::'+base+'::'+i++;
   const widget=el('section','review-widget'),head=el('div','review-widget-head review-ui'),body=el('div','review-body');widget.dataset.reviewWidget=id;widget.setAttribute('aria-label',title);head.append(el('strong','',title));const controls=el('div');controls.append(button('⤢ Ampliar',()=>expand(widget,title)),button('×',()=>{settings().items[id]=false;persist();apply();}));head.append(controls);node.before(widget);body.append(node);widget.append(head,body);registry.set(id,{id,title,node,widget});
  }
  // Mantém os registros dos nós que sobreviveram ao renderizador original e descarta os antigos.
  for(const[id,item]of registry)if(!item.widget.isConnected)registry.delete(id);
  apply();
 }
 function apply(){const s=settings(),items=[...registry.values()];for(const[item,i]of items.map((x,i)=>[x,i])){const shown=s.items[item.id]??(s.mode==='all'||i<3);item.widget.dataset.reviewHidden=String(!shown);item.widget.hidden=!shown;}
  // A ordem muda somente entre irmãos: não desloca um componente para fora do seu contexto original.
  if(s.order.length){const ranked=items.slice().sort((a,b)=>(s.order.indexOf(a.id)<0?999:s.order.indexOf(a.id))-(s.order.indexOf(b.id)<0?999:s.order.indexOf(b.id)));for(const item of ranked){const siblings=ranked.filter(x=>x.widget.parentElement===item.widget.parentElement);if(siblings.length>1)for(const other of siblings)item.widget.parentElement.append(other.widget);}}
 }
 function preset(mode){settings().mode=mode;settings().items={};persist();apply();}
 const modal=el('dialog','review-dialog review-ui');modal.setAttribute('aria-labelledby','review-dialog-title');document.body.append(modal);modal.addEventListener('close',restore);
 function dialog(title,owner=document.body){restore();if(modal.parentElement!==owner)owner.append(modal);modal.replaceChildren();const head=el('header'),h=el('h2','',title);h.id='review-dialog-title';modal.classList.remove('review-full');
  const full=button('Tela cheia',()=>{
   const large=modal.classList.toggle('review-full');
   full.textContent=large?'Restaurar tamanho':'Tela cheia';
   full.setAttribute('aria-pressed',String(large));
  });
  full.setAttribute('aria-pressed','false');
  head.append(h,full,button('Fechar',()=>{restore();modal.close();}));const body=el('div','review-dialog-body');modal.append(head,body);if(!modal.open)modal.showModal();return body;}
 function personalize(){if(activePage==='cadastro-produtos'){$('cadastro-produtos-frame')?.contentWindow.postMessage({type:'review-personalize',identity:preferenceIdentity},location.origin);return;}const host=dialog('Personalizar · '+(current()?.item.label||activePage));host.append(el('p','','Estes são os componentes originais desta tela. Controles, colunas, detalhes e ações continuam dentro dos respectivos blocos.'));for(const item of registry.values()){const row=el('article'),label=el('label'),check=el('input');check.type='checkbox';check.checked=!item.widget.hidden;check.onchange=()=>{settings().items[item.id]=check.checked;persist();apply();};label.append(check,el('strong','',item.title));row.append(label,button('↑',()=>move(item,-1)),button('↓',()=>move(item,1)));host.append(row);}host.append(button('Restaurar padrão essencial',()=>{prefs.set(route(),{mode:'essential',items:{},order:[]});persist();apply();personalize();}),el('p','review-small','Algumas leituras são abertas pelo filtro, nível ou detalhe original. Personalize novamente depois de abrir esse contexto para escolher seus blocos.'));}
 function move(item,dir){const list=[...registry.keys()],i=list.indexOf(item.id),j=i+dir;if(j<0||j>=list.length)return;[list[i],list[j]]=[list[j],list[i]];settings().order=list;persist();apply();personalize();}
 function expand(widget,title){
  const scope=widget.closest('#met-root');
  const marker=el('div','review-placeholder');
  marker.style.minHeight=widget.offsetHeight+'px';
  const owner=scope||widget.parentElement;
  const host=dialog(title,owner);
  widget.before(marker);
  host.append(widget);
  expanded={widget,marker,scope};
  window.BCReviewCharts?.activate(widget);
  for(const canvas of widget.querySelectorAll('canvas'))window.Chart?.getChart(canvas)?.resize();
 }
 function restore(){
  if(!expanded)return;
  const {widget,marker,scope}=expanded;
  expanded=null;
  marker.replaceWith(widget);
  modal.classList.remove('review-full');
  if(scope&&!modal.open)document.body.append(modal);
  for(const canvas of widget.querySelectorAll('canvas'))window.Chart?.getChart(canvas)?.resize();
 }
 modal.addEventListener('close',()=>{
  if(!modal.open&&modal.parentElement!==document.body)document.body.append(modal);
  schedule();
 });
 function returnToMetas(event){
  if(!expanded?.scope)return;
  const action=event.target.closest(event.type==='change'?'#met-ref-dia':'[onclick*="met"]');
  if(!action||action.matches('.met-ampliar-cabecalho button'))return;
  restore();
  modal.close();
 }
 modal.addEventListener('click',returnToMetas,true);
 modal.addEventListener('change',returnToMetas,true);
 function mapDialog(){const host=dialog('Estrutura integral do BsanControl'),grid=el('div','review-map');for(const g of bcGroupedCatalogue()){const section=el('section');section.append(el('h3','',g.label));for(const i of g.items){const b=button(i.label,()=>{modal.close();open(g.id,i.id);});b.dataset.reviewTarget=g.id+'/'+i.id;b.disabled=!!i.disabled;section.append(b);}grid.append(section);}host.append(grid);}
 function snapshot(){const c=current();return{route:route(),label:c?.item.label||'',ponto:typeof PONTO_SEL==='undefined'?'':PONTO_SEL,company:BCNav.company,marketplace:BCNav.marketplace,month:BCNav.month,dates:Object.fromEntries(['d-start','d-end','d2-start','d2-end'].filter(id=>$(id)).map(id=>[id,$(id).value])),compare:typeof cmpMode==='undefined'?'':cmpMode};}
 function goBack(){const origin=trail.pop();if(!origin)return;pendingOrigin=null;lastView=null;restore();studio?.restore();PONTO_SEL=origin.ponto;BCNav.company=origin.company;BCNav.marketplace=origin.marketplace;BCNav.month=origin.month;for(const[id,value]of Object.entries(origin.dates))if($(id))$(id).value=value;if(typeof cmpMode!=='undefined')cmpMode=origin.compare;if(typeof bcNavRefresh==='function')bcNavRefresh();const[g,i]=origin.route.split('/');open(g,i);}
 const backButton=button('Voltar',goBack,'review-context-back review-ui');workspace.prepend(backButton);backButton.hidden=true;
 function sync(){
  if(expanded&&!modal.isConnected){
   modal.close();
   restore();
   if(!modal.isConnected)document.body.append(modal);
  }
  if(document.querySelector('dialog[open]')||document.documentElement.dataset.studioCapturing==='true')return;
  mountChrome();
  sidebarSync();
  const next=snapshot();
  if(lastView&&lastView.route!==next.route)trail.push(pendingOrigin?.route===lastView.route?pendingOrigin:lastView);
  lastView=next;
  pendingOrigin=null;
  backButton.hidden=!trail.length;
  backButton.textContent=trail.length?'← Voltar a '+trail.at(-1).label:'Voltar';
  decorate();
 }
 document.addEventListener('close',()=>schedule(),true);

 const generatedChrome='.review-ui,.studio-ui,[data-studio-owned=true],.bc-reading-guide,.bc-viz-tools,.bc-table-tools';
 new MutationObserver(records=>{
  const sourceChanged=records.some(record=>!record.target.closest?.(generatedChrome)&&[...record.addedNodes].some(node=>
   node.nodeType===1&&!node.matches(generatedChrome+',.review-widget,.review-body')&&!studio?.isManaged(node)));
  if(sourceChanged)schedule();
 }).observe(document.body,{childList:true,subtree:true});
 const oldGo=goPage;goPage=function(){restore();studio?.restore();const result=oldGo.apply(this,arguments);schedule();return result;};
 document.addEventListener('click',e=>{if(!e.target.closest('.studio-ui,.review-ui')&&e.target.closest('button,a,canvas'))pendingOrigin=snapshot();},true);
 document.body.classList.add('review-integral');document.body.classList.toggle('light',ui.theme==='light');document.body.classList.toggle('review-sidebar-collapsed',ui.collapsed);if(typeof isDark!=='undefined')isDark=ui.theme==='dark';document.documentElement.style.colorScheme=ui.theme;document.body.style.colorScheme=ui.theme;
 const originalToggleTheme=toggleTheme;toggleTheme=function(){const result=originalToggleTheme.apply(this,arguments);ui.setTheme(document.body.classList.contains('light')?'light':'dark');return result;};
 const parts=location.hash.replace(/^#/,'').split('/'),oldId=parts.at(-1);let group=parts[0],id=alias[oldId]||oldId;
 if(modes[oldId]){group='cadastro-produtos';id='cadastro-'+modes[oldId];}
 if(group==='produtos')group='cadastro-produtos';if(group==='posvenda')group='pos-venda';
 function homePage(){
  const groups=bcGroupedCatalogue();
  const results=groups.find(g=>g.id==='resultados');
  const overview=results?.items.find(i=>i.id==='overview'&&!i.disabled);
  if(overview)return {group:results,item:overview};
  const first=groups.find(g=>g.items.some(i=>!i.disabled));
  return first&&{group:first,item:first.items.find(i=>!i.disabled)};
 }
 const available=(g,i)=>bcGroupedCatalogue().some(group=>group.id===g&&group.items.some(item=>item.id===i&&!item.disabled));
 // Produtos confirma os recursos do ponto apenas depois de iniciar o aplicativo incorporado.
 const requestedProduct=group==='cadastro-produtos'&&!available(group,id)&&available(group,'cadastro-catalog')?id:null;
 if(requestedProduct)id='cadastro-catalog';
 if(!available(group,id)){
  const initial=homePage();
  group=initial?.group.id;
  id=initial?.item.id;
 }
 function drilldown(item){if(!/^(resultados|gerencial|vendas)\//.test(route()))return null;const title=BCStudioCatalogue.normalize(item.title),operation=BCNav.company&&BCNav.marketplace;let group,id,label;if(/^(faturamento|unidades|pedidos)/.test(title)){[group,id,label]=operation?['gerencial','ger-vendas','Ver vendas']:['vendas','vendas','Ver vendas'];}else if(/^(pos-ads|pre-ads|margem)/.test(title)){[group,id,label]=operation?['gerencial','produtos','Ver anúncios']:['resultados','marketplaces','Ver operações'];}else if(/^(publicidade|tacos|investimento)/.test(title)){[group,id,label]=operation?['gerencial','ads','Ver publicidade']:['resultados','marketplaces','Ver operações'];}else return null;if(route()===group+'/'+id||!available(group,id))return null;return{label,run:()=>open(group,id)};}
 if(window.BCReviewStudio)studio=BCReviewStudio.create({icon,settings,persist,expand,navigate:open,canNavigate:available,drilldown,productLibrary:()=>$('cadastro-produtos-frame')?.contentWindow.postMessage({type:'review-personalize',identity:preferenceIdentity},location.origin)});
 if(requestedProduct){
  const followProduct=e=>{
   if(e.origin!==location.origin||e.source!==$('cadastro-produtos-frame')?.contentWindow||e.data?.type!=='bsan-produtos-state')return;
   window.removeEventListener('message',followProduct);
   if(current()?.group.id==='cadastro-produtos'&&available(group,requestedProduct))open(group,requestedProduct);
  };
  window.addEventListener('message',followProduct);
 }
 if(available(group,id))bcGroupedOpen(group,id);const initial=current();if(initial?.item?.id)history.replaceState(null,'','#'+initial.group.id+'/'+initial.item.id);schedule();
 window.BCReviewIntegral={version:3,refreshPresentation:decorate,catalogue:()=>bcGroupedCatalogue(),scan(){if(studio)return studio.scan();const p=document.querySelector('.page.on');return{route:route(),widgets:[...registry.values()].map(w=>({id:w.id,title:w.title,hidden:w.widget.hidden})),tables:p?.querySelectorAll('table').length||0,columns:p?.querySelectorAll('th').length||0,charts:p?.querySelectorAll('canvas').length||0,controls:p?.querySelectorAll('input,select,textarea').length||0};}};
})();
