(function(root,factory){if(typeof module==='object'&&module.exports)module.exports={create:factory};else root.BCFullscreen=factory(document);})(typeof window==='object'?window:this,function(doc){
 'use strict';const states=new WeakMap(),active=new Set();
 function paint(s){s.dialog.classList.toggle('bc-full-viewport',s.expanded);s.button.hidden=false;s.button.textContent=s.expanded?'Restaurar tamanho':'Tela cheia';s.button.setAttribute('aria-pressed',String(s.expanded));s.resize?.();}
 function front(s){if(!s.dialog.open)return;s.dialog.close();s.dialog.showModal();s.button.focus({preventScroll:true});}
 async function toggle(dialog,button,resize){let s=states.get(dialog);if(!s){s={dialog,button,resize,expanded:false,owned:false,busy:false,active:true};states.set(dialog,s);}s.button=button;s.resize=resize;s.active=true;active.add(s);if(s.busy)return;s.busy=true;button.disabled=true;
  try{if(s.expanded){s.expanded=false;paint(s);if(s.owned&&doc.fullscreenElement===doc.documentElement){s.owned=false;await doc.exitFullscreen();}}
   else{s.expanded=true;paint(s);if(!doc.fullscreenElement&&doc.fullscreenEnabled&&typeof doc.documentElement.requestFullscreen==='function'){try{await doc.documentElement.requestFullscreen();if(!s.active){if(doc.fullscreenElement===doc.documentElement)await doc.exitFullscreen();return;}s.owned=doc.fullscreenElement===doc.documentElement;front(s);}catch(_){/* A área útil continua ampliada, mesmo em navegadores incorporados. */}}}
  }finally{s.busy=false;button.disabled=false;if(s.active)paint(s);}
 }
 function release(dialog){const s=states.get(dialog);if(!s)return;s.active=false;s.expanded=false;active.delete(s);paint(s);if(s.owned&&doc.fullscreenElement===doc.documentElement){s.owned=false;doc.exitFullscreen?.().catch(()=>{});}}
 doc.addEventListener('fullscreenchange',()=>{for(const s of active){if(s.owned&&doc.fullscreenElement!==doc.documentElement){s.owned=false;s.expanded=false;paint(s);}else if(s.expanded)s.resize?.();}});
 return{toggle,release};
});
