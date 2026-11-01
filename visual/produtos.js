/* Produtos compartilha o ponto do cabeçalho. Atualizar sessão não reinicia o formulário. */
(function(){'use strict';
 const pageId='cadastro-produtos',S={frame:null,ready:false,cap:null,signature:null,userId:null,sent:'',mode:'catalog',point:'',busy:false};
 const sections=[['catalog','Catálogo'],['tasks','Pendências de custo'],['entries','Entradas de compra'],['materials','Materiais'],['pack','Embalagens'],['prep','Preparação de embalagens'],['review','Homologação'],['sales','Apuração de custos'],['sync','Atualização'],['publication','Integração']];
 window.bcProdutoSection='catalog';
 BCGroupMap.splice(BCGroupMap.findIndex(g=>g.id==='operacao')+1,0,{id:pageId,label:'Produtos',items:sections.map(([mode,label])=>({id:'cadastro-'+mode,label,page:pageId,productMode:mode}))});
 NAV_PAGES.push({id:pageId,label:'Produtos'});
 const nav=document.createElement('button');nav.id='nav-'+pageId;nav.className='ntab';nav.textContent='Produtos';nav.onclick=()=>bcGroupedOpen(pageId);document.getElementById('main-nav')?.append(nav);
 const root=document.createElement('section');root.id='page-'+pageId;root.className='page bc-products-page';
 const status=document.createElement('p');status.className='bc-products-status';status.setAttribute('role','status');status.textContent='Abra Produtos para consultar o cadastro.';
 root.append(status);document.querySelector('.page')?.parentElement.append(root);
 window.bcProdutosAllowed=(item,user)=>{
   if(!user?.produtos_habilitado||!window.BCAcessos?.pode(user,'produtos.ver'))return false;
   const m=item.productMode;if(['catalog','prep'].includes(m))return true;
   if(m==='sync')return !!S.cap?.administrar;
   if(['review','sales','publication'].includes(m))return !!S.cap?.administrar&&!!S.cap?.financeiro?.includes(S.point);
   return !!S.cap?.financeiro?.includes(S.point);
 };
 function theme(){return document.body.classList.contains('light')?'light':'dark';}
 function choosePoint(){const points=S.cap?.pontos||[];if(points.length&&!points.includes(S.point))S.point=points.includes(PONTO_SEL)?PONTO_SEL:points[0];return S.point||PONTO_SEL||'';}
 function send(refresh=false){if(!S.frame||!S.ready||!BCAUTH.token)return;const data={type:'bsan-produtos-auth',token:BCAUTH.token,identity:String(BCAUTH.user?.id||''),section:S.mode,point:choosePoint(),theme:theme(),refresh};const signature=JSON.stringify({...data,refresh:false});if(!refresh&&signature===S.sent)return;S.sent=signature;S.frame.contentWindow.postMessage(data,location.origin);}
 function header(){if(activePage!==pageId)return;const select=document.getElementById('bc-point');if(!select)return;const point=choosePoint(),points=S.cap?.pontos||[];
   if(points.length){PONTO_SEL=point;bcNavOptions(select,points.map(p=>[p,p]),point);select.disabled=false;}else select.disabled=true;
   for(const id of ['bc-company','bc-marketplace']){const control=document.getElementById(id);if(control)(control.closest('label')||control.parentElement).classList.add('bc-products-irrelevant');}
   const note=document.getElementById('bc-scope-note');if(note)note.textContent='Cadastro de produtos por ponto. '+(point?'Ponto selecionado: '+point+'.':'Selecione Bsan ou Powerfull.');
   const summary=document.getElementById('bc-context-summary');if(summary)summary.textContent='Produtos'+(point?' · '+point:'');
 }
 function mount(){if(S.frame)return;const f=document.createElement('iframe');f.id='cadastro-produtos-frame';f.title='Cadastro de Produtos';f.className='bc-products-frame';f.src='/produtos?embedded=1';f.onload=()=>{S.ready=true;send();};root.append(f);S.frame=f;S.sent='';status.hidden=false;status.textContent='Carregando cadastro e permissões…';}
 window.bcProdutosOpenMode=mode=>{if(!sections.some(([m])=>m===mode))return;S.mode=mode;window.bcProdutoSection=mode;mount();send();};
 const go=goPage;goPage=function(id,button){if(id===pageId){if(!BCAUTH.user?.produtos_habilitado||!BCAcessos.pode(BCAUTH.user,'produtos.ver'))return;if(activePage!==pageId){S.point=PONTO_SEL||S.point;choosePoint();}if(!bcProdutosAllowed({productMode:S.mode},BCAUTH.user)){S.mode='catalog';window.bcProdutoSection='catalog';}mount();}const r=go.apply(this,arguments);document.body.classList.toggle('bc-products-open',activePage===pageId);if(id===pageId){header();send();}return r;};
 const navRefresh=bcNavRefresh;bcNavRefresh=function(){const r=navRefresh.apply(this,arguments);header();if(activePage===pageId)send();return r;};
 const chrome=bcChromeRefresh;bcChromeRefresh=function(){const r=chrome.apply(this,arguments);header();return r;};
 document.addEventListener('change',e=>{if(activePage!==pageId||e.target.id!=='bc-point')return;if(S.busy){e.stopImmediatePropagation();e.target.value=S.point;status.textContent='Feche a ficha ou o formulário antes de trocar o ponto.';status.hidden=false;return;}S.point=e.target.value;},true);
 window.addEventListener('message',e=>{
   if(e.origin!==location.origin||e.source!==S.frame?.contentWindow)return;
   if(e.data?.type==='bsan-produtos-ready'){S.ready=true;S.sent='';send();}
   if(e.data?.type==='bsan-produtos-expired'){BCAUTH.clear();S.cap=null;S.frame?.remove();S.frame=null;S.ready=false;S.sent='';bcShowLogin(true);}
   if(e.data?.type==='bsan-produtos-state'){
     S.cap=e.data.access;S.busy=e.data.busy===true;if(S.cap?.pontos?.includes(S.cap.ponto))S.point=S.cap.ponto;
     const mode=e.data.section;if(sections.some(([m])=>m===mode)){S.mode=mode;window.bcProdutoSection=mode;}
     if(activePage===pageId&&S.point){PONTO_SEL=S.point;try{localStorage.setItem('bc_ponto',S.point);}catch{}}
     status.textContent='';status.hidden=true;header();bcGroupedRefresh();
   }
 });
 setInterval(()=>{if(activePage===pageId&&!document.hidden)send(true);},60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&activePage===pageId)send(true);});
 new MutationObserver(()=>{if(S.frame?.contentWindow)S.frame.contentWindow.postMessage({type:'bsan-produtos-theme',theme:theme()},location.origin);}).observe(document.body,{attributes:true,attributeFilter:['class']});
 setInterval(()=>{const userId=String(BCAUTH.user?.id||''),signature=BCAUTH.token+'|'+JSON.stringify(BCAUTH.user?.efetivas||{});if(signature===S.signature)return;const changed=S.userId!==null&&userId!==S.userId;S.signature=signature;S.userId=userId;S.sent='';
   if(!BCAUTH.token||changed){S.cap=null;S.frame?.remove();S.frame=null;S.ready=false;S.busy=false;if(activePage===pageId&&BCAUTH.token)mount();return;}send(true);bcGroupedRefresh();
 },1000);
})();
