/* Contrato de leitura da posição. Ausência permanece null, inclusive na sincronização. */
(function(root,f){const api=f();if(typeof module==='object'&&module.exports)module.exports=api;else root.BCOperacaoDados=api;})(typeof window==='object'?window:this,function(){
 'use strict';const n=v=>v==null||typeof v==='boolean'||String(v).trim()===''||!Number.isFinite(Number(v))?null:Number(v),s=v=>String(v??'').trim(),sku=v=>s(v).toUpperCase();
 function estoque(rows){return(Array.isArray(rows)?rows:[]).filter(r=>s(r.sku)).map(r=>{const o={};for(const k of ['conta','ponto','produto','veredito','nivel','aba','acaoCanal','coletado_em','atualizado_em','data_posicao','origem'])o[k]=s(r[k]);o.sku=sku(r.sku);o.skuOrigem=s(r.skuOrigem||r.sku);o.SKUs=s(r.SKUs??r.skus);for(const k of ['un90d','vendaDia','saldoGeral','dispGeral','saldoFull','reservado','coberturaDias','fullML','un90dFull','un90dCD','cobFull','cobCD','variacoes','janelaDias'])o[k]=n(r[k]);return o;});}
 function selecionarEstoque(produtos,variacoes){const p=estoque(produtos);return p.length?p.map(r=>({...r,aba:'Por_Produto'})):estoque(variacoes).map(r=>({...r,aba:'Estoque'}));}
 return{n,s,sku,estoque,selecionarEstoque};
});
