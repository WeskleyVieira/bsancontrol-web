(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BCAcompanhamentoCarregamento=factory();})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 function create({request,commit,changed=()=>{}}){let generation=0,pending=null,controller=null,status='idle',error='';
  function reset(){generation++;controller?.abort();controller=null;pending=null;status='idle';error='';}
  function load(){if(pending)return pending;if(status==='ready')return Promise.resolve(true);const version=generation;controller=new AbortController();status='loading';error='';const signal=controller.signal;
   pending=(async()=>{try{const value=await request(signal);if(version!==generation)return false;commit(value);status='ready';return true;}catch(e){if(version!==generation)return false;status='error';error=e.message||'Não foi possível consultar esta leitura.';return false;}finally{if(version===generation){pending=null;changed();}}})();changed();return pending;
  }
  return{load,reset,state:()=>({status,error})};
 }
 return{create};
});
