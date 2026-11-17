/* Preferências da prévia por identidade. A integração oficial deverá persistir no servidor. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else{root.BCReviewPreferences=factory();if(root.BC_REVIEW_AUTH?.user?.id){root.BCReviewPreferenceStore=root.BCReviewPreferences.create(root.localStorage,String(root.BC_REVIEW_AUTH.user.id));root.document.documentElement.dataset.reviewTheme=root.BCReviewPreferenceStore.theme;root.document.documentElement.style.colorScheme=root.BCReviewPreferenceStore.theme;}}})(typeof window==='object'?window:this,function(){'use strict';
 const cleanLayout=value=>({mode:value?.mode==='all'?'all':'essential',items:Object.fromEntries(Object.entries(value?.items||{}).filter(([k,v])=>k.length<500&&typeof v==='boolean')),order:[...new Set((Array.isArray(value?.order)?value.order:[]).filter(k=>typeof k==='string'&&k.length<500))]});
 function create(storage,identity){
  if(typeof identity!=='string'||!identity.trim())throw Error('Preferências exigem uma identidade.');
  const key='preferences:v2:'+identity;let input;try{input=JSON.parse(storage.getItem(key));}catch{}
  const state={version:2,theme:input?.theme==='dark'?'dark':'light',collapsed:input?.collapsed===true,pages:Object.fromEntries(Object.entries(input?.pages||{}).map(([k,v])=>[k,cleanLayout(v)]))};
  let saved=true;function commit(){try{storage.setItem(key,JSON.stringify(state));saved=true;}catch{saved=false;}return saved;}
  return{get theme(){return state.theme;},get collapsed(){return state.collapsed;},get saved(){return saved;},setTheme(theme){state.theme=theme==='dark'?'dark':'light';return commit();},setCollapsed(value){state.collapsed=value===true;return commit();},getLayout(page){return Object.hasOwn(state.pages,page)?cleanLayout(state.pages[page]):null;},setLayout(page,layout){state.pages[page]=cleanLayout(layout);return commit();}};
 }
 return{create,cleanLayout};
});
