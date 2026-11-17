'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const C=require('./workspace-catalog.js'),D=require('./preview-data.cjs'),{createServer}=require('./preview.cjs');
const widgetModule=import('data:text/javascript;base64,'+fs.readFileSync(path.join(__dirname,'workspace-widgets.js')).toString('base64'));
const close=(a,b)=>assert.ok(Math.abs(a-b)<.03,`${a} != ${b}`);
test('39 abas têm recursos próprios, IDs únicos e fontes rastreáveis',()=>{
 assert.equal(Object.keys(C.pages).length,39);const ids=[];
 for(const p of Object.values(C.pages)){assert.ok(p.widgets.some(w=>w.essential));assert.ok(p.copy);for(const w of p.widgets){assert.ok(D.dependencies.includes(w.dependency));assert.ok(w.source);ids.push(w.id);}}
 assert.equal(new Set(ids).size,ids.length);assert.equal(ids.length,175);
 assert.ok(C.pages['g-metas'].widgets.some(w=>w.kind==='goalDaily'));
 assert.ok(C.pages['g-metas'].widgets.some(w=>w.kind==='goalAccumulated'));
 assert.ok(C.pages['publicidade'].widgets.some(w=>w.kind==='affiliate'));
 assert.notDeepEqual(C.pages['p-materiais'].widgets[1].fields,C.pages['p-entradas'].widgets[1].fields);
});
test('cenários preservam totais por SKU/operação e Pós-Ads = Pré-Ads − Ads',()=>{
 for(const period of ['month','week','october'])for(const point of ['','Bsan','Powerfull']){
  const d=D.make('commerce',{period,point});for(const key of ['fat','after','ads','units']){close(d.bySku.reduce((s,r)=>s+r[key],0),d.totals[key]);close(d.byOperation.reduce((s,r)=>s+r[key],0),d.totals[key]);}
  for(const r of d.rows){close(r.after,r.pre-r.ads);assert.ok(Number.isInteger(r.units));}
  assert.ok(d.bySku.every(r=>r.id===null));assert.ok(d.bySku.some(r=>r.ids.length>1));
 }
});
test('canais sem Ads mantêm contribuição; Magalu varia por período no cenário',()=>{
 const all=D.make('commerce',{});assert.ok(all.byOperation.some(r=>r.market==='Shein'));assert.equal(new Set(all.rows.map(r=>r.market)).size,7);
 for(const market of ['Shein','Temu','Kwai Shop']){const d=D.make('commerce',{market});assert.ok(d.totals.fat>0);assert.equal(d.totals.ads,0);close(d.totals.after,d.totals.pre);}
 assert.equal(D.make('commerce',{market:'Magazine Luiza',period:'october'}).totals.ads,0);
 assert.ok(D.make('commerce',{market:'Magazine Luiza',period:'month'}).totals.ads>0);
});
test('todos os 175 blocos renderizam e não produzem NaN ou Infinity',async()=>{
 const{renderWidget}=await widgetModule;
 for(const p of Object.values(C.pages))for(const w of p.widgets){for(const ctx of [{},{point:'Inexistente'}]){const html=renderWidget(w,D.make(w.dependency,ctx),{mode:'sku',period:'month'});assert.equal(typeof html,'string',w.id);assert.ok(html.length>10,w.id);assert.doesNotMatch(html,/NaN|Infinity|undefined/,w.id);}}
});
test('cores de margem e TACOS respeitam exatamente os limites',async()=>{
 const{helpers:h}=await widgetModule;assert.deepEqual([h.tone(9.99),h.tone(10),h.tone(19.99),h.tone(20)],['bad','warn','warn','good']);assert.deepEqual([h.tacos(2.99),h.tacos(3),h.tacos(4.99),h.tacos(5)],['good','warn','warn','bad']);assert.equal(h.tacos(null),'');
});
test('seleção individual, soma escolhida e conjunto vazio têm denominadores próprios',()=>{
 const one=D.make('commerce',{operations:JSON.stringify(['Bsan Shop · Shein'])});assert.equal(one.byOperation.length,1);
 const two=D.make('commerce',{operations:JSON.stringify(['Bsan Shop · Shein','Bsan Shop · Amazon'])});assert.equal(two.byOperation.length,2);assert.ok(two.totals.fat>one.totals.fat);
 const none=D.make('commerce',{operations:'[]'});assert.equal(none.rows.length,0);assert.equal(none.bySku.length,0);
 const units=D.make('commerce',{criterion:'units'}).bySku;assert.ok(units.every((r,i)=>i===0||units[i-1].units>=r.units));
 const selected=D.make('commerce',{company:'Bsan Shop',market:'Shein'}),all=D.make('commerce',{});
 for(const r of selected.rows)assert.ok(all.rows.some(x=>x.id===r.id&&x.operation===r.operation));
});
test('tabela não atribui um ID ao SKU e preserva colunas e símbolos no #',async()=>{
 const{renderWidget,helpers}=await widgetModule,w=C.pages.anuncios.widgets[1],d=D.make('commerce',{market:'Mercado Livre',company:'Bsan Shop'}),html=renderWidget(w,d,{mode:'sku'});
 assert.match(html,/<th scope="col">ID do anúncio<\/th>/);assert.match(html,/ws-rank/);assert.match(html,/Pré-Ads/);assert.match(html,/TACOS/);assert.doesNotMatch(html,/data-ws-copy="DEMO-/);
 const row={...d.rows[0],ads:0};assert.equal(helpers.cell('Publicidade',row,0,d,{mode:'sku'}),'');
});
test('preferências descartam IDs inválidos/duplicados sem perder uma seleção vazia',()=>{
 const sandbox={window:{BsanWorkspaceCatalog:C}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'workspace.js'),'utf8'),sandbox);const W=sandbox.window.BsanWorkspace;
 assert.equal(W.normalize('panorama',[]).length,0);assert.equal(W.normalize('panorama',[{id:'inexistente'}]).length,0);
 const id=C.pages.panorama.widgets[0].id;assert.equal(W.normalize('panorama',[{id},{id}]).length,1);
 assert.notEqual(W.storeKey('gestor','panorama'),W.storeKey('direcao','panorama'));
});
test('servidor só publica recursos explícitos e GETs de dados fictícios',async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{for(const dep of D.dependencies){const r=await fetch(base+'/demo-data/'+dep+'?period=month');assert.equal(r.status,200);assert.equal((await r.json()).fictitious,true);}
  for(const route of ['/api.js','/demo-data/segredos','/SAIDA','/package.json'])assert.equal((await fetch(base+route)).status,404);
  assert.equal((await fetch(base+'/demo-data/commerce',{method:'POST'})).status,405);
  assert.match((await fetch(base+'/workspace.js')).headers.get('content-security-policy'),/connect-src 'self'/);
 }finally{await new Promise(r=>server.close(r));}
});
