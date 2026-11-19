/* Preferências locais vinculadas à identidade autenticada. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BCReviewPreferences=factory();})(typeof window==='object'?window:this,function(){'use strict';
 const cleanLayout=value=>({composition:value?.composition===3?3:2,mode:value?.mode==='all'?'all':'essential',items:Object.fromEntries(Object.entries(value?.items||{}).filter(([k,v])=>k.length<500&&typeof v==='boolean')),order:[...new Set((Array.isArray(value?.order)?value.order:[]).filter(k=>typeof k==='string'&&k.length<500))],sizes:Object.fromEntries(Object.entries(value?.sizes||{}).filter(([k,v])=>k.length<500&&['compact','third','half','wide','full'].includes(v))),tables:Object.fromEntries(Object.entries(value?.tables||{}).filter(([k])=>k.length<500).map(([k,v])=>[k,{hidden:[...new Set((Array.isArray(v?.hidden)?v.hidden:[]).filter(s=>typeof s==='string'&&s.length<300))],density:v?.density==='comfortable'?'comfortable':'compact'}])),filtersOpen:value?.filtersOpen===true});
 const normalizeMotion = value => ['medium','fast','off'].includes(value) ? value : 'calm';
 function create(storage,identity){
  if(typeof identity!=='string'||!identity.trim())throw Error('Preferências exigem uma identidade.');
  const key='preferences:v2:'+identity;let input;try{input=JSON.parse(storage.getItem(key));}catch{}
  const state={version:2,brand:input?.brand==='jowcase'?'jowcase':'bsan',motion:normalizeMotion(input?.motion),theme:input?.theme==='dark'?'dark':'light',collapsed:input?.collapsed===true,pages:Object.fromEntries(Object.entries(input?.pages||{}).map(([k,v])=>[k,cleanLayout(v)]))};
  let saved=true;function commit(){try{storage.setItem(key,JSON.stringify(state));saved=true;}catch{saved=false;}return saved;}
  return{get brand(){return state.brand;},get motion(){return state.motion;},setBrand(value){state.brand=value==='jowcase'?'jowcase':'bsan';return commit();},setMotion(value){state.motion=normalizeMotion(value);return commit();},get theme(){return state.theme;},get collapsed(){return state.collapsed;},get saved(){return saved;},setTheme(theme){state.theme=theme==='dark'?'dark':'light';return commit();},setCollapsed(value){state.collapsed=value===true;return commit();},getLayout(page){return Object.hasOwn(state.pages,page)?cleanLayout(state.pages[page]):null;},setLayout(page,layout){state.pages[page]=cleanLayout(layout);return commit();}};
 }
 return{create,cleanLayout};
});
