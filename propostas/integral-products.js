/* Apresentação do módulo Produtos original; seus formulários e serviços são mantidos. */
(function(){'use strict';
 window.addEventListener('error',e=>console.error('Prévia Produtos: '+e.filename+':'+e.lineno+' '+(e.error?.stack||e.message)));
 function init(){let pending=false,identity='';const prefs=new Map();
 function mode(){return document.querySelector('nav [class*="selected"]')?.id||[...document.querySelectorAll('#workspace>section')].find(n=>!n.hidden)?.id||'catalog';}
 function state(){const k=identity+':'+mode();if(!prefs.has(k)){try{prefs.set(k,identity?JSON.parse(localStorage.getItem('review-integral:'+k))||{}:{});}catch{prefs.set(k,{});}}return prefs.get(k);}
 // Registros de produtos, materiais e custos são dados da lista, não widgets.
 // A personalização nunca retira linhas individuais da análise.
 function nodes(){return [...document.querySelectorAll('#workspace .section,#workspace .dashboard-section')].filter(n=>!n.parentElement.closest('.section,.dashboard-section')&&!n.matches('form')&&!n.closest('form'));}
 function apply(){const s=state();for(const[n,i]of nodes().map((n,i)=>[n,i])){const key=n.id||n.querySelector('h2,h3')?.textContent||'Bloco '+i;n.dataset.reviewProductKey=key;n.classList.toggle('pr-review-hidden',s[key]===false);}}
 function dialog(){
  let d=document.getElementById('pr-review-dialog');if(!d){d=document.createElement('dialog');d.id='pr-review-dialog';d.className='pr-review-dialog';document.body.append(d);}d.replaceChildren();
  const h=document.createElement('header'),title=document.createElement('h2');title.textContent='Personalizar recursos de Produtos';const close=document.createElement('button');close.textContent='Fechar';close.onclick=()=>d.close();h.append(title,close);d.append(h);
  const available=nodes().filter(n=>!n.hidden&&!n.closest('section[hidden]'));
  const note=document.createElement('p');note.textContent=available.length?'Escolha painéis de apoio. Cadastros, linhas e formulários permanecem completos.':'Esta aba é um fluxo de cadastro. Seus registros, campos e ações ficam disponíveis por inteiro; não há painéis opcionais neste contexto.';d.append(note);
  for(const[n,i]of available.map((n,i)=>[n,i])){const label=document.createElement('label'),input=document.createElement('input'),name=n.querySelector('h2,h3')?.textContent||'Painel de apoio '+(i+1);input.type='checkbox';input.checked=!n.classList.contains('pr-review-hidden');input.onchange=()=>{state()[n.dataset.reviewProductKey]=input.checked;if(identity)localStorage.setItem('review-integral:'+identity+':'+mode(),JSON.stringify(state()));apply();};label.append(input,document.createTextNode(name));d.append(label);}if(!d.open)d.showModal();
 }
 window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent)return;if(['review-personalize','review-user'].includes(e.data?.type)&&typeof e.data.identity==='string'){if(identity!==e.data.identity){identity=e.data.identity;prefs.clear();apply();}if(e.data.type==='review-personalize')dialog();}});
 new MutationObserver(records=>{if(!pending&&records.some(r=>!r.target.closest?.('#pr-review-dialog'))){pending=true;requestAnimationFrame(()=>{pending=false;apply();});}}).observe(document.body,{childList:true,subtree:true});apply();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
