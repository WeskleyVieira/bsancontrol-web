/* Produtos is an isolated same-origin view using the host's validated session. */
(function(){'use strict';
 const pageId='cadastro-produtos',S={frame:null,ready:false,cap:null,signature:'',sent:'',mode:'catalog'};
 const sections=[['catalog','Catálogo'],['tasks','Pendências de custo'],['entries','Entradas de compra'],['materials','Materiais'],['pack','Embalagens'],['prep','Preparação de embalagens'],['review','Homologação'],['sales','Apuração de custos'],['sync','Atualização'],['publication','Integração']];
 window.bcProdutoSection='catalog';
 BCGroupMap.splice(BCGroupMap.findIndex(g=>g.id==='operacao')+1,0,{id:'cadastro-produtos',label:'Produtos',items:sections.map(([mode,label])=>({id:'cadastro-'+mode,label,page:pageId,productMode:mode}))});
 NAV_PAGES.push({id:pageId,label:'Produtos'});
 const nav=document.createElement('button');nav.id='nav-'+pageId;nav.className='ntab';nav.textContent='Produtos';nav.onclick=()=>bcGroupedOpen(pageId);document.getElementById('main-nav')?.append(nav);
 const root=document.createElement('section');root.id='page-'+pageId;root.className='page bc-products-page';
 const status=document.createElement('p');status.className='bc-products-status';status.setAttribute('role','status');status.textContent='Abra Produtos para consultar o cadastro.';
 root.append(status);document.querySelector('.page')?.parentElement.append(root);
 window.bcProdutosAllowed=(item,user)=>{
   if(!user?.produtos_habilitado||!window.BCAcessos?.pode(user,'produtos.ver'))return false;
   const m=item.productMode;if(['catalog','prep'].includes(m))return true;
   if(m==='sync')return !!S.cap?.administrar;
   if(['review','sales','publication'].includes(m))return !!S.cap?.administrar&&!!S.cap?.financeiro?.includes(S.cap?.ponto);
   return !!S.cap?.financeiro?.includes(S.cap?.ponto);
 };
 function theme(){return document.body.classList.contains('light')?'light':'dark';}
 function send(refresh=false){if(!S.frame||!S.ready)return;const token=BCAUTH.token;if(!token)return;
   S.frame.contentWindow.postMessage({type:'bsan-produtos-auth',token,section:S.mode,theme:theme(),refresh},location.origin);
 }
 function mount(){if(S.frame)return;const f=document.createElement('iframe');f.id='cadastro-produtos-frame';f.title='Cadastro de Produtos';f.className='bc-products-frame';f.src='/produtos?embedded=1';f.onload=()=>{S.ready=true;send();};root.append(f);S.frame=f;status.textContent='Carregando cadastro e permissões…';}
 window.bcProdutosOpenMode=mode=>{if(!sections.some(([m])=>m===mode))return;S.mode=mode;window.bcProdutoSection=mode;mount();send();};
 const go=goPage;goPage=function(id,button){if(id===pageId){if(!bcProdutosAllowed({productMode:S.mode},BCAUTH.user))return;mount();send();}const r=go.apply(this,arguments);document.body.classList.toggle('bc-products-open',activePage===pageId);return r;};
 window.addEventListener('message',e=>{
   if(e.origin!==location.origin||e.source!==S.frame?.contentWindow)return;
   if(e.data?.type==='bsan-produtos-ready'){S.ready=true;send();}
   if(e.data?.type==='bsan-produtos-expired'){BCAUTH.clear();S.cap=null;S.frame?.remove();S.frame=null;S.ready=false;bcShowLogin(true);}
   if(e.data?.type==='bsan-produtos-state'){
     S.cap=e.data.access;const mode=e.data.section;if(sections.some(([m])=>m===mode)){S.mode=mode;window.bcProdutoSection=mode;}
     status.textContent='';status.hidden=true;bcGroupedRefresh();
   }
 });
 setInterval(()=>{if(activePage===pageId&&!document.hidden)send(true);},60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&activePage===pageId)send(true);});
 new MutationObserver(()=>{if(S.frame?.contentWindow)S.frame.contentWindow.postMessage({type:'bsan-produtos-theme',theme:theme()},location.origin);}).observe(document.body,{attributes:true,attributeFilter:['class']});
 setInterval(()=>{const signature=BCAUTH.token+'|'+JSON.stringify(BCAUTH.user?.efetivas||{});if(signature===S.signature)return;S.signature=signature;S.cap=null;
   if(!BCAUTH.token){S.frame?.remove();S.frame=null;S.ready=false;return;}send(true);bcGroupedRefresh();
 },1000);
})();
