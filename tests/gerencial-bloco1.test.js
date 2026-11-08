const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../visual/gerencial-modelo'),F=require('../margens-modelo');
const q={de:'2026-11-01',ate:'2026-11-06'},row=(v={})=>({date:'2026-11-01',emp:'Bsan Shop',mkt:'Mercado Livre',ponto:'Bsan',stat:'venda',sku:'S',anuncio:'MLB1',tit:'Produto',fat:100,liq:80,mc:25,ctp:20,qtd:1,pub:0,...v});
function composed(rows,ads=[],mode='anuncio'){
 const data=F.local(rows,{ads},q),groups=G.grupos(rows,{modo:mode}).items;
 return groups.map(o=>{const ps=data.produtos.filter(p=>mode==='sku'?p.sku===o.sku:p.anuncio===o.anuncio),r=F.compose(ps);return{...o,abc:'A',pre:r.pre,after:r.after,pctPre:r.pctPre,pctAfter:r.pctAfter,inv:r.ads,adsMissing:r.missing,estimated:r.estimated};});
}
const ad=(id,inv,mkt='Mercado Livre')=>({emp:'Bsan Shop',mkt,comp:'2026-11',anuncio:id,inv});
test('casos da auditoria: prejuízo de produto e prejuízo após Ads entram juntos no total Pós-Ads',()=>{
 const items=composed([row({anuncio:'MLB5379285664',sku:'CORTADOR',fat:112.32,mc:4.35,qtd:5}),row({anuncio:'MLB5008814827',sku:'LACO',fat:117.84,mc:-19.47,qtd:6})],[ad('MLB5379285664',13.86),ad('MLB5008814827',.25)]),before=JSON.stringify(items),a=G.agenda(items);
 assert.equal(a.BK.estanca.length,2);assert.equal(a.totPrej,-29.23);assert.equal(a.BK.corrija.length,0);
 assert.deepEqual(a.BK.estanca.map(o=>o.causaPerda),['produto','publicidade']);
 assert.equal(a.BK.estanca.find(o=>o.sku==='CORTADOR').after,-9.51);
 assert(items.every(o=>G.situacao(o).key==='prejuizo'));assert.equal(JSON.stringify(items),before);
});
test('a classificação de perda usa o mesmo resultado no anúncio e na composição dos SKUs, conservando centavos',()=>{
 const rows=[row({sku:'A',fat:100,mc:2}),row({sku:'B',fat:200,mc:8})],sources=[ad('MLB1',17.03)],an=composed(rows,sources),sk=composed(rows,sources,'sku');
 assert.equal(G.agenda(an).totPrej,-7.03);assert.equal(G.agenda(an).BK.estanca.length,1);assert.equal(F.round(sk.reduce((s,o)=>s+o.after,0)),an[0].after);assert.equal(F.round(sk.reduce((s,o)=>s+o.inv,0)),17.03);
});
test('TikTok mantém Ads e afiliados já no líquido, inclusive ao explicar prejuízo provocado pela publicidade',()=>{
 const [o]=composed([row({mkt:'TikTok Shop',mc:-2,pub:-5,afil:-3})],[ad('MLB1',999,'TikTok Shop')]),a=G.agenda([o]);
 assert.equal(o.pre,3);assert.equal(o.after,-2);assert.equal(o.inv,5);assert.equal(a.totPrej,-2);assert.equal(a.BK.estanca[0].causaPerda,'publicidade');
 const [positive]=composed([row({mkt:'TikTok Shop',mc:12,pub:-5,afil:-3})]);assert.equal(G.agenda([positive]).atual[0].after,12);
});
test('fonte ausente vai para conferência; Ads zero registrado permite avaliar a margem',()=>{
 const missing=G.agenda(composed([row()])),zero=G.agenda(composed([row()],[ad('MLB1',0)]));
 assert.equal(missing.BK.cobertura.length,1);assert.equal(missing.BK.proteja.length,0);assert.equal(missing.atual[0].after,null);assert.equal(zero.BK.proteja.length,1);assert.equal(zero.atual[0].after,25);assert.equal(zero.atual[0].inv,0);
});
test('Temu usa líquido para piso e referência de margem, sem trocar o denominador do TACOS',()=>{
 const [o]=composed([row({mkt:'Temu',fat:100,liq:50,mc:8})],[ad('MLB1',4,'Temu')]),a=G.agenda([o]);assert.equal(o.pctPre,16);assert.equal(o.pctAfter,8);assert.equal(a.BK.adscome.length,1);assert.equal(a.atual[0].adsCabe,3);assert.equal(a.totAdsCorte,1);
});
test('perda monetária sem base percentual continua prejuízo; percentual inválido não produz estrela',()=>{
 const [o]=composed([row({fat:0,liq:0,mc:0,qtd:0})],[ad('MLB1',5)]);assert.equal(o.pctAfter,null);assert.equal(G.situacao(o).key,'prejuizo');assert.equal(G.agenda([o]).totPrej,-5);
 for(const pctAfter of [null,undefined,NaN,''])assert.equal(G.situacao({after:1,pctAfter,abc:'A'}).key,'sem-base');
 assert.equal(G.agenda([{...o,after:0,inv:0}]).BK.base.length,1);
});
test('piso e maturação conservam os grupos, mas perda Pós-Ads tem prioridade sobre margem baixa ou novidade',()=>{
 const base={key:'A',sku:'S',fat:100,base:100,mc:5,pre:5,pctPre:5,inv:2,after:3,pctAfter:3,abc:'C'};
 assert.equal(G.agenda([base]).BK.peso.length,1);assert.equal(G.agenda([base],{novo:()=>true}).BK.maturacao.length,1);
 const a=G.agenda([{...base,inv:6,after:-1,pctAfter:-1}],{novo:()=>true});assert.equal(a.BK.estanca.length,1);assert.equal(a.BK.maturacao.length,0);
});
test('sem comparação não há sinal de alta/queda; referência zero não vira crescimento calculável',()=>{
 const o={key:'A',fat:1000,mc:200,pre:200,after:200,pctPre:20,pctAfter:20,inv:0,base:1000,abc:'A'};
 const no=G.agenda(G.comparar([o],[]));assert.equal(no.perdendo.length,0);assert.equal(no.ganhando.length,0);assert.equal(no.atual[0].antFat,null);
 const zero=G.agenda(G.comparar([o],[{...o,fat:0}]));assert.equal(zero.ganhando.length,0);
 const gain=G.agenda(G.comparar([o],[{...o,fat:500}]));assert.equal(gain.ganhando.length,1);
});
test('fila com pendência e grupo sem base conserva ausência de impacto em vez de zero rentável',()=>{
 const a=G.agenda([{key:'P',pre:25,after:null,pctPre:25,pctAfter:null,inv:null,adsMissing:true,base:100,fat:100},{key:'B',pre:0,after:0,pctPre:null,pctAfter:null,inv:0,base:0,fat:0}]);
 assert.equal(a.BK.cobertura.length,1);assert.equal(a.BK.base.length,1);assert.equal(a.atual.filter(o=>o.situacao.key==='estrela').length,0);assert.equal(a.pot(a.BK.base[0]),null);
});
