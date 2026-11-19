'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),acorn=require('acorn');
const{createData}=require('./integral-data.cjs'),{build,sha,defaultSource}=require('./integral-source.cjs'),{createIntegralServer}=require('./integral-server.cjs');
const data=createData(),original=fs.readFileSync(process.env.BSAN_REVIEW_SOURCE||defaultSource,'utf8'),built=build(data);
function scriptBlocks(html){return [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>m[2].trim()&&!/application\/json/.test(m[1])).map(m=>m[2]);}
function declarations(html){const result=[];for(const js of scriptBlocks(html)){const ast=acorn.parse(js,{ecmaVersion:'latest'}),stack=[ast];while(stack.length){const n=stack.pop();if(n.type==='FunctionDeclaration')result.push([n.id.name,sha(js.slice(n.start,n.end))].join(':'));for(const value of Object.values(n))if(Array.isArray(value)){for(const child of value)if(child?.type)stack.push(child);}else if(value?.type)stack.push(value);}}return result.sort();}
test('todas as funções nomeadas originais são preservadas byte a byte, inclusive funções internas',()=>{
 const before=declarations(require('../visual/dados-operacao-correcoes').corrigirMetasPublicidade(require('../visual/metas-historico-correcoes').incluirOrcamentoDiario(original))),after=declarations(built.html);assert.ok(before.length>700);assert.deepEqual(after,before);console.log('Funções originais preservadas: '+before.length);
 for(const name of ['fluxoPonto','fluxoCasa','_renderGerProdutos','_renderGerMetas','_renderGerPublicidade','drawABC','detailProduct','fechamento','custos','carteiras'])assert.ok(before.some(v=>v.startsWith(name+':')),name);
});
test('IDs e elementos estáticos originais continuam presentes; nenhuma seção é removida',()=>{
 const ids=h=>[...h.replace(/<script[^>]*>[\s\S]*?<\/script>/g,'').matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);const next=new Set(ids(built.html));for(const id of ids(original))assert.ok(next.has(id),id);
});
test('os scripts transformados compilam e os sete conjuntos privados são substituídos',()=>{
 for(const js of scriptBlocks(built.html))new vm.Script(js);
 for(const key of ['DETALHE','ROWS','SKU_MON','SKU_MKT','SKU_MKT_MON','TOP10','TOP10_EM'])assert.ok(built.manifest.substitutions.includes(key));
 assert.match(built.html,/BCAUTH\s*=\s*window.BC_REVIEW_AUTH/);assert.match(built.html,/DRE_HASH\s*=\s*""/);assert.doesNotMatch(built.html,/<script[^>]+src="https?:/);
});
test('o novo padrão dos gráficos preserva valores, escalas e callbacks',()=>{
 const plugin=require('./integral-charts.js'),data=[10,-4,null],callback=()=>'',scale={type:'linear',min:-10,max:20};
 const chart={config:{type:'bar'},data:{datasets:[{data,borderWidth:3}]},options:{scales:{y:scale},plugins:{tooltip:{callbacks:{label:callback}},legend:{labels:{}}}}};
 plugin.beforeUpdate(chart);assert.equal(chart.data.datasets[0].data,data);assert.deepEqual(data,[10,-4,null]);assert.equal(chart.options.scales.y,scale);assert.equal(chart.options.plugins.tooltip.callbacks.label,callback);assert.equal(chart.data.datasets[0].borderWidth,0);
});
test('dados demonstrativos preenchem todos os canais e mantêm contratos financeiros e metas',()=>{
 assert.equal(new Set(data.source.map(r=>r.market)).size,8);assert.equal(new Set(data.source.map(r=>r.operation||r.company+' · '+r.market)).size>=10,true);
 assert.equal(new Set(data.DETALHE.map(r=>r.date.slice(0,7))).size,12);assert.equal(data.ESTOQUE.length>0,true);assert.ok(Object.keys(data.FULL_REL.contas).length>=4);
 for(const r of data.DETALHE.slice(0,100))assert.ok(Math.abs(r.fat-r.ctp-r.imp-r.mc-(r.fat-r.liq))<.03);
 assert.equal(data.COMISSAO.length,data.COMISSAO_DET.length);assert.ok(data.COMISSAO_DET.every(r=>r.Faturamento_obj>0&&r.MC_obj>0));
 assert.deepEqual([...new Set(data.ROWS.map(r=>r.ponto))].sort(),['Bsan','Powerfull']);
 assert.ok(data.ADS.every(r=>r.inv>=0));assert.ok(data.ENVIOS.every(r=>r.empresa&&r.plataforma));
});
test('servidor usa os módulos reais de Produtos com armazenamento em memória e não publica arquivos do projeto',async()=>{
 const app=await createIntegralServer();await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.server.address().port,headers={Authorization:'Bearer review-direcao'};
 try{
  const html=await(await fetch(base+'/')).text();assert.match(html,/revisao\/integral.js/);assert.match(html,/window.BC_REVIEW_DATA/);
  const cap=await(await fetch(base+'/api/produtos/acesso',{headers})).json();assert.equal(cap.administrar,true);
  const material=await(await fetch(base+'/api/produtos/materiais?ponto=Bsan',{headers})).json();assert.equal(material.items.length,3);
  const packs=await(await fetch(base+'/api/produtos/embalagens?ponto=Bsan',{headers})).json();assert.equal(packs.items.length,1);
  const session=await(await fetch(base+'/api/sessao',{headers})).json();assert.equal(session.usuario.perfil,'direcao');
  const state=await(await fetch(base+'/api/gestao/estado?mes=2026-10',{headers})).json(),operation=state.operacoes[0].operacao;
  const post=(url,payload)=>fetch(base+url,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  await post('/api/gestao/fechar',{mes:'2026-10',operacoes:[operation]});
  const closed=await(await fetch(base+'/api/gestao/estado?mes=2026-10',{headers})).json();assert.ok(closed.operacoes[0].fechamento.fechado_em);
  await post('/api/gestao/reabrir',{mes:'2026-10',operacao:operation});
  const reopened=await(await fetch(base+'/api/gestao/estado?mes=2026-10',{headers})).json();assert.equal(reopened.operacoes[0].fechamento,null);
  const script=await(await fetch(base+'/produtos/app.js')).text();assert.equal(sha(script),sha(fs.readFileSync(path.join(__dirname,'../produtos/web/app.js'),'utf8')));
  for(const resource of ['/api.js','/db_config.json','/SAIDA','/../api.js'])assert.equal((await fetch(base+resource)).status,404);
  const manifest=await(await fetch(base+'/revisao/manifesto')).json();assert.equal(manifest.rendererStrategy,'original-functions-retained');
 }finally{await app.close();}
});
