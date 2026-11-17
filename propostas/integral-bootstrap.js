/* Ambiente local de revisão: identidade e gravações pertencem apenas a esta prévia. */
(function(){'use strict';
 window.BC_REVIEW=true;
 window.addEventListener('error',e=>console.error('Prévia: '+e.filename+':'+e.lineno+' '+(e.error?.stack||e.message)));
 const role=new URL(location.href).searchParams.get('perfil')||'direcao',allowed=['direcao','coordenacao','gestor','compradora','estoque','posvenda'];
 const perfil=allowed.includes(role)?role:'direcao';
 const user={id:'review-'+perfil,nome:'Revisão · '+perfil,perfil,gestor_ref:'Gestor A',ativo:true,produtos_habilitado:true,restricoes:{},revogacao:0};
 window.BC_REVIEW_AUTH={get token(){return'review-'+perfil;},get user(){return user;},_set(){},clear(){},login:async()=>({ok:true,token:'review-'+perfil,...user})};
 window.BC_REVIEW_PRODUCT_CAP={pontos:['Bsan','Powerfull'],administrar:perfil==='direcao',financeiro:['estoque','posvenda'].includes(perfil)?[]:['Bsan','Powerfull']};
 // O estado do protótipo não lê nem substitui chaves da aplicação antiga neste navegador.
 for(const key of ['localStorage','sessionStorage']){try{const raw=window[key],prefix='bsan-review-integral-v1:';Object.defineProperty(window,key,{value:{getItem:k=>raw.getItem(prefix+k),setItem:(k,v)=>raw.setItem(prefix+k,String(v)),removeItem:k=>raw.removeItem(prefix+k),clear:()=>{for(let i=raw.length-1;i>=0;i--){const k=raw.key(i);if(k.startsWith(prefix))raw.removeItem(k);}},key:i=>raw.key(i),get length(){return raw.length;}}});}catch{}}
 const original=window.fetch.bind(window);window.fetch=(input,opts)=>{const url=new URL(typeof input==='string'?input:input.url,location.href);if(url.origin!==location.origin)return Promise.reject(Error('A revisão consulta somente seu servidor local.'));return original(input,opts);};
 // Os gráficos conservam a instância Chart original e todos os seus plugins.
})();
