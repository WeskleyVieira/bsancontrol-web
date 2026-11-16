(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BCInterfaceModelo=api;})(typeof window==='object'?window:this,function(){
 'use strict';
 const defaultScale=mobile=>mobile?100:90;
 function normalize(value,fallback=90){if(value==null||typeof value==='boolean'||String(value).trim()===''||!Number.isFinite(Number(value)))return fallback;return Math.min(120,Math.max(80,Math.round(Number(value)/5)*5));}
 const key=(id,mobile)=>'bc-interface-size:v1:'+encodeURIComponent(String(id??'local'))+':'+(mobile?'mobile':'desktop');
 function read(storage,id,mobile){try{return normalize(storage.getItem(key(id,mobile)),defaultScale(mobile));}catch{return defaultScale(mobile);}}
 function write(storage,id,mobile,value){const scale=normalize(value,defaultScale(mobile));try{storage.setItem(key(id,mobile),String(scale));}catch{}return scale;}
 return{normalize,defaultScale,key,read,write};
});
