/* Declarações operacionais da Direção em 08/11/2026; fontes com gasto prevalecem. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BCPublicidadeCobertura=api;})(typeof window==='object'?window:this,function(){
 'use strict';
 const declaracoes=[
  {emp:'Bsan Shop',mkt:'Shein',status:'sem_ads',confirmadoEm:'2026-11-08'},
  {emp:'Bsan Shop',mkt:'Temu',status:'sem_ads',confirmadoEm:'2026-11-08'},
  {emp:'Jowcase',mkt:'Kwai Shop',status:'sem_ads',confirmadoEm:'2026-11-08'},
  {emp:'Powerfull Imports',mkt:'Amazon',status:'sem_ads',confirmadoEm:'2026-11-08'},
  {emp:'Powerfull Imports',mkt:'Shopee',status:'sem_ads',confirmadoEm:'2026-11-08'},
  {emp:'Jowcase',mkt:'Magazine Luiza',status:'sem_ads',de:'2026-10',ate:'2026-10',confirmadoEm:'2026-11-08'}
 ];
 const month=v=>/^\d{4}-(0[1-9]|1[0-2])$/.test(v||'');
 function semAds(emp,mkt,mes,source=declaracoes){return month(mes)&&Array.isArray(source)&&source.some(r=>r&&r.status==='sem_ads'&&r.emp===emp&&r.mkt===mkt&&(!r.de||month(r.de)&&r.de<=mes)&&(!r.ate||month(r.ate)&&r.ate>=mes));}
 return{declaracoes,semAds};
});
