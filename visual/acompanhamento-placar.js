(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./acompanhamento-modelo'));else root.BCAcompanhamentoPlacar=factory(root.BCAcompanhamentoModelo);})(typeof globalThis==='undefined'?this:globalThis,function(M){
 'use strict';
 // Régua recuperada de AC2_SEM (16/10/2026). O selo usa a fração exata, antes de formatar.
 const thresholds=[{min:100,key:'ideal',label:'Ideal',tone:'good'},{min:90,key:'bom',label:'Bom',tone:'info'},{min:70,key:'atencao',label:'Atenção',tone:'attention'},{min:0,key:'critico',label:'Crítico',tone:'bad'}];
 function badge(value,total){if(!total)return{key:'sem-base',label:'Sem base',tone:'neutral',rate:null,value,total};const rate=value/total*100;return{...thresholds.find(t=>rate>=t.min),rate,value,total};}
 function summary(rows){const s=M.summary(rows),positive=s.resolved+s.progress+s.justified,registration=badge(s.registered,s.total),effect=badge(positive,s.measured),next=s.total&&s.registered<s.total?[70,90,100].find(n=>s.registered/s.total*100<n):null,missing=next==null?0:Math.max(0,Math.ceil(next*s.total/100)-s.registered);return{...s,registration,effect,milestone:next==null?null:{rate:(s.registered+missing)/s.total*100,label:badge(s.registered+missing,s.total).label,missing},allRegistered:!!s.total&&s.registered===s.total};}
 function types(rows){const active=rows.filter(r=>r.active);return[...new Set(active.map(r=>r.kind))].sort().map(kind=>({kind,items:active.filter(r=>r.kind===kind),...summary(active.filter(r=>r.kind===kind))}));}
 function owners(rows,dim='gestor'){return M.compare(rows,dim).filter(g=>g.total>0).map(g=>({...g,...summary(g.items),types:types(g.items),operationLabels:[...new Set(g.items.filter(r=>r.active).map(r=>M.operationKey(r.item)))].sort()})).sort((a,b)=>a.label.localeCompare(b.label,'pt-BR'));}
 return{badge,summary,types,owners};
});
