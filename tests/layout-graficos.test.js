'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict');
const plugin=require('../layout/integral-charts.js'),M=plugin.model,P=require('../layout/integral-preferences.js');
test('a formação é sequencial e termina em cada valor original',()=>{
 assert.equal(M.step(0,0,4),0);assert.equal(M.step(.25,0,4),1);assert.equal(M.step(.25,1,4),0);assert.equal(M.step(.375,1,4)>0,true);assert.equal(M.step(1,3,4),1);
 const bars=[{y:20,base:100,horizontal:false},{y:130,base:100,horizontal:false}],before=structuredClone(bars),chart={getDatasetMeta:()=>({type:'bar',data:bars})};
 const restore=M.geometry(chart,0,.25);assert.ok(bars[0].y>20&&bars[0].y<100);assert.equal(bars[1].y,100);restore();assert.deepEqual(bars,before);
 const horizontal=[{x:80,base:0,horizontal:true}];const reset=M.geometry({getDatasetMeta:()=>({type:'bar',data:horizontal})},0,.5);assert.ok(horizontal[0].x>0&&horizontal[0].x<80);reset();assert.equal(horizontal[0].x,80);
});
test('bolhas crescem sem alterar o raio definitivo nem opções compartilhadas',()=>{
 const options={radius:20,backgroundColor:'#00B1EB'},points=[{options},{options}],restore=M.geometry({getDatasetMeta:()=>({type:'bubble',data:points})},0,.25);
 assert.ok(points[0].options.radius>0&&points[0].options.radius<20);assert.equal(points[1].options.radius,0);assert.equal(options.radius,20);restore();assert.equal(points[0].options,options);assert.equal(points[1].options,options);
});
test('fatias preenchem uma por vez e devolvem a geometria integral',()=>{
 const arcs=[{startAngle:0,endAngle:2,circumference:2},{startAngle:2,endAngle:5,circumference:3}],before=structuredClone(arcs),restore=M.geometry({getDatasetMeta:()=>({type:'doughnut',data:arcs})},0,.25);
 assert.ok(arcs[0].endAngle>0&&arcs[0].endAngle<2);assert.equal(arcs[1].endAngle,2);restore();assert.deepEqual(arcs,before);
});
test('a linha revela o trajeto por recorte e restaura o contexto do canvas',()=>{
 const calls=[],ctx={save:()=>calls.push('save'),beginPath(){},rect:(...v)=>calls.push(v),clip:()=>calls.push('clip'),restore:()=>calls.push('restore')};
 const chart={ctx,chartArea:{left:10,right:110,top:0,bottom:80},getDatasetMeta:()=>({type:'line',data:[]})},restore=M.geometry(chart,0,.5);assert.deepEqual(calls[1],[5,-8,55,96]);restore();assert.equal(calls.at(-1),'restore');
});
test('A/B/C usam verde, âmbar e vermelho nas duas identidades',()=>{
 for(const name of ['bsan','jowcase']){assert.ok(M.brands[name].primary);const chart={canvas:{id:'res-abc-share'},config:{type:'doughnut'},data:{labels:['A','Curva B','Curva C'],datasets:[{data:[80,15,5]}]},options:{}};plugin.beforeUpdate(chart);assert.deepEqual(chart.data.datasets[0].backgroundColor,[M.curves.A,M.curves.B,M.curves.C]);assert.deepEqual(chart.data.datasets[0].data,[80,15,5]);}
 assert.equal(M.curveLabel('Ads'),null);assert.equal(M.curveLabel('Amazon'),null);
 const points=['#13976B','#D94457'],line={label:'Margem',data:[10,-5],pointBackgroundColor:points},chart={canvas:{id:'daily'},config:{type:'line'},data:{labels:['01','02'],datasets:[line]},options:{}};plugin.beforeUpdate(chart);assert.equal(line.pointBackgroundColor,points);
 const accumulated={label:'Acumulado (%)',type:'line',data:[80,95,100]};chart.canvas.id='res-abc-pareto';chart.data.datasets=[accumulated];plugin.beforeUpdate(chart);assert.equal(accumulated.borderColor,M.brands.bsan.secondary);

});
test('marca e movimento persistem por identidade sem redefinir o layout',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},a=P.create(storage,'direcao');a.setBrand('jowcase');a.setMotion('off');a.setLayout('tarefas',{composition:3,mode:'all',items:{x:true},sizes:{x:'wide'},order:['x']});const reopened=P.create(storage,'direcao');assert.equal(reopened.brand,'jowcase');assert.equal(reopened.motion,'off');assert.equal(reopened.getLayout('tarefas').sizes.x,'wide');assert.equal(P.create(storage,'gestor').brand,'bsan');assert.equal(P.create(storage,'gestor').motion,'calm');
 for(const speed of ['calm','medium','fast','off']){
  a.setMotion(speed);
  assert.equal(P.create(storage,'direcao').motion,speed);
 }
 assert.ok(M.durations.calm>M.durations.medium&&M.durations.medium>M.durations.fast);
 assert.equal(M.durations.off,0);
});
