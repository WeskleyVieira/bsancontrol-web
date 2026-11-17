/* Composição dos dez fluxos de Produtos, sobre os formulários e o serviço originais. */
(function(){'use strict';
 function init(){
  const root=document.getElementById('workspace');if(!root||!window.BCReviewStudio)return;
  let identity='',store=null,studio=null,pending=false,expanded=null;const layouts=new Map();
  const memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
  function mode(){return(document.querySelector('nav button.selected')?.id||'catalog-tab').replace(/-tab$/,'');}
  function key(){return'cadastro-produtos/cadastro-'+mode();}
  function settings(){const k=key();if(!layouts.has(k))layouts.set(k,store?.getLayout(k)||{mode:'essential',items:{},order:[],sizes:{},tables:{}});return layouts.get(k);}
  function persist(){store?.setLayout(key(),settings());}
  const dialog=document.createElement('dialog');dialog.className='review-dialog studio-ui';dialog.setAttribute('aria-label','Análise ampliada');document.body.append(dialog);
  function restoreZoom(){if(!expanded)return;expanded.marker.replaceWith(expanded.node);expanded=null;parent.postMessage({type:'bsan-produtos-table-view',open:false},location.origin);}
  function expand(node,title){restoreZoom();dialog.replaceChildren();const h=document.createElement('header'),t=document.createElement('h2'),full=document.createElement('button'),close=document.createElement('button');t.textContent=title;full.textContent='Tela cheia';full.onclick=()=>dialog.classList.toggle('review-full');close.textContent='Fechar';close.onclick=()=>dialog.close();h.append(t,full,close);const body=document.createElement('div');body.className='review-dialog-body';dialog.append(h,body);const marker=document.createComment('origem da análise ampliada');node.before(marker);body.append(node);expanded={node,marker};parent.postMessage({type:'bsan-produtos-table-view',open:true},location.origin);dialog.showModal();}
  dialog.addEventListener('close',restoreZoom);
  function makeStudio(){studio=BCReviewStudio.create({settings,persist,expand,onLibrary:open=>parent.postMessage({type:'bsan-produtos-table-view',open},location.origin)});}
  function apply(){pending=false;if(!studio||expanded)return;studio.compose(root,key());}
  function schedule(){if(!pending){pending=true;requestAnimationFrame(apply);}}
  document.body.classList.add('review-integral','studio-products','light');root.classList.add('page','on');
  store=BCReviewPreferences.create(storage,'temporary-products');makeStudio();
  window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent)return;const d=e.data||{};
   if(d.type==='bsan-produtos-theme'||d.type==='bsan-produtos-auth'){document.body.classList.toggle('light',d.theme==='light');schedule();}
   if(['review-user','review-personalize','bsan-produtos-auth'].includes(d.type)&&typeof d.identity==='string'&&d.identity!==identity){restoreZoom();studio.restore();identity=d.identity;layouts.clear();store=BCReviewPreferences.create(localStorage,'products:'+identity);makeStudio();schedule();}
   if(d.type==='review-personalize'){apply();studio.openLibrary();}
  });
  new MutationObserver(records=>{if(records.some(r=>!r.target.closest?.('.studio-ui,[data-studio-owned=true]')&&(r.type==='attributes'||[...r.addedNodes].some(n=>n.nodeType===1&&!studio.isManaged(n)))))schedule();}).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  document.addEventListener('click',e=>{if(!e.target.closest('.studio-ui'))schedule();});document.addEventListener('change',e=>{if(!e.target.closest('.studio-ui'))schedule();});schedule();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
