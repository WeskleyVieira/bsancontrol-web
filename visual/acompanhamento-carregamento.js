(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BCAcompanhamentoCarregamento=factory();})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 function create({request,commit,changed=()=>{}}){let generation=0,pending=null,controller=null,status='idle',error='';
  function reset(){generation++;controller?.abort();controller=null;pending=null;status='idle';error='';}
  function load(){if(pending)return pending;if(status==='ready')return Promise.resolve(true);const version=generation;controller=new AbortController();status='loading';error='';const signal=controller.signal;
   pending=(async()=>{try{const value=await request(signal);if(version!==generation)return false;commit(value);status='ready';return true;}catch(e){if(version!==generation)return false;status='error';error=e.message||'Não foi possível consultar esta leitura.';return false;}finally{if(version===generation){pending=null;changed();}}})();changed();return pending;
  }
  return{load,reset,state:()=>({status,error})};
 }
 // Uma leitura leve compartilhada entre a prévia do produto e a fila. O cache pertence à sessão.
 function sharedRead({identity,request,ttl=60000,clock=Date.now}){let current=null,version=0;
  function reset(){current?.controller.abort();current=null;}
  function read(force=false){const key=identity();if(!force&&current?.key===key){if(current.pending)return current.pending;if(current.at!=null&&clock()-current.at<ttl)return Promise.resolve(current.data);}reset();const state={key,controller:new AbortController(),at:null,data:null,pending:null};current=state;
   state.pending=Promise.resolve().then(()=>request(state.controller.signal)).then(data=>{if(current!==state||identity()!==key)throw Error('Consulta substituída ou sessão alterada. Atualize a leitura.');state.data=data;state.at=clock();version++;return data;}).finally(()=>{state.pending=null;});return state.pending;
  }return{read,reset,get version(){return version;},get ready(){return current?.at!=null;}};
 }
 return{create,sharedRead};
});
