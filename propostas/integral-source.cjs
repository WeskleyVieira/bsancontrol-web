'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),acorn=require('acorn');
const defaultSource='T:/Meu Drive/Business Intelligence/Grupo Bsan/BsanControl.html';
function sha(s){return crypto.createHash('sha256').update(s).digest('hex');}
function transform(input,data){
 const fonte=require('../visual/metas-historico-correcoes').incluirOrcamentoDiario(input);
 const substitutions=[],functions=[],scripts=[];let count=0;
 let html=fonte.replace(/<script([^>]*)>([\s\S]*?)<\/script>/g,(whole,attrs,js)=>{
  if(!js.trim()||/application\/json/.test(attrs))return whole;
  const ast=acorn.parse(js,{ecmaVersion:'latest'}),edits=[];
  for(const n of ast.body){if(n.type==='VariableDeclaration')for(const d of n.declarations){if(!d.init||d.id.type!=='Identifier')continue;const name=d.id.name;
   if(Object.hasOwn(data,name)){edits.push({start:d.init.start,end:d.init.end,value:'window.BC_REVIEW_DATA['+JSON.stringify(name)+']'});substitutions.push(name);}
   if(name==='BCAUTH')edits.push({start:d.init.start,end:d.init.end,value:'window.BC_REVIEW_AUTH'});
   if(name==='DRE_HASH')edits.push({start:d.init.start,end:d.init.end,value:'""'});
  }
  if(n.type==='FunctionDeclaration')functions.push({name:n.id.name,hash:sha(js.slice(n.start,n.end))});}
  for(const e of edits.sort((a,b)=>b.start-a.start))js=js.slice(0,e.start)+e.value+js.slice(e.end);
  // Somente o adaptador de disponibilidade: os três formulários de gestão usam a API isolada.
  js=js.replace("const online=()=>typeof authFetch==='function'&&typeof painelOnline==='function'&&painelOnline();","const online=()=>!!window.BC_REVIEW;");
  js=js.replace('S={frame:null,ready:false,cap:null,','S={frame:null,ready:false,cap:window.BC_REVIEW_PRODUCT_CAP,');
  js=js.replace("mode:'catalog',point:'',busy:false","mode:'catalog',point:window.BC_REVIEW_PRODUCT_CAP?.pontos?.[0]||'',busy:false");
  scripts.push({id:attrs.match(/id="([^"]+)"/)?.[1]||'original-'+(++count),hash:sha(js)});
  return '<script'+attrs+'>'+js+'</script>';
 });
 for(const key of ['DETALHE','ROWS','SKU_MON','SKU_MKT','SKU_MKT_MON','TOP10','TOP10_EM'])if(!substitutions.includes(key))throw Error('Fonte mudou: não foi possível isolar '+key);
 html=html.replace(/https:\/\/cdnjs.cloudflare.com\/ajax\/libs\/Chart.js\/4.4.1\/chart.umd.min.js/g,'/revisao/vendor/chart.js').replace(/https:\/\/cdn.jsdelivr.net\/npm\/chartjs-plugin-datalabels@2.2.0\/dist\/chartjs-plugin-datalabels.min.js/g,'/revisao/vendor/labels.js');
 html=html.replace(/<script src="https:\/\/cdn.sheetjs.com\/[^>]+><\/script>/,'<script src="/revisao/vendor/xlsx.js"></script>');
 html=html.replace('</head>','<link rel="stylesheet" href="/revisao/typography.css"><link rel="stylesheet" href="/revisao/integral.css"><link rel="stylesheet" href="/revisao/studio.css"><link rel="stylesheet" href="/revisao/experience.css"><script src="/revisao/dados.js"></script><script src="/revisao/bootstrap.js"></script><script src="/revisao/preferencias.js"></script><script src="/revisao/charts.js"></script></head>');
 html=html.replace('</body>','<script src="/revisao/studio-catalogue.js"></script><script src="/revisao/studio-composition.js"></script><script src="/revisao/integral.js"></script><script src="/revisao/snapshot.js"></script><script src="/revisao/experience.js"></script></body>');
 html=html.replace(/<body([^>]*)>/,'<body$1><script>document.body.classList.add("review-integral");document.body.classList.toggle("light",window.BCReviewPreferenceStore?.theme!=="dark");</script>');
 return{html,manifest:{sourceHash:sha(input),scripts,functions,substitutions,generated:'2026-11-17',data:'fictitious',rendererStrategy:'original-functions-retained'}};
}
function build(data,file=process.env.BSAN_REVIEW_SOURCE||defaultSource){return transform(fs.readFileSync(file,'utf8'),data);}
module.exports={build,transform,sha,defaultSource};
