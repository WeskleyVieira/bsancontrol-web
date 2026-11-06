/* A composição acompanha o período e o escopo sem interferir nos registros da operação. */
(function(){'use strict';
 const $=id=>document.getElementById(id);
 function panel(root,id,q,options={}){if(!root)return;let host=$(id);if(!host){host=document.createElement('section');host.id=id;host.className='bc-margin-panel';root.prepend(host);}BCMargensUI.mount(host,q,options);}
 function scope(){const[de,ate]=getR();return{de,ate,ponto:PONTO_SEL||'',emp:BCNav.company||'',mkt:BCNav.marketplace||'',baseMargem:'teto'};}
 const ger=renderGerencial;renderGerencial=function(){const out=ger.apply(this,arguments);if(['produtos','panorama','diag'].includes(GER_SUB)){const[emp,mkt]=GER_OP.split('||'),q={...scope(),emp,mkt,carteira:'1',itens:'1'},root=$('ger-sub-'+GER_SUB),cached=BCMargensUI.get(q);panel(root,'bc-margin-ger-'+GER_SUB,q,{title:'Resultado após publicidade',onData:()=>{if(!cached&&activePage==='gerencial'&&GER_OP===emp+'||'+mkt)renderGerencial();}});}return out;};
 const vendas=renderVendas;renderVendas=function(){const out=vendas.apply(this,arguments);const p=vndParams(),q=Object.fromEntries([...p].filter(([k])=>['de','ate','ponto','emp','mkt','sku','q','neg','status'].includes(k)));q.baseMargem='teto';panel($('page-vendas'),'bc-margin-vendas',q,{title:'Margem das vendas finalizadas · filtro inteiro'});return out;};
})();
