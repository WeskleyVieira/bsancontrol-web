'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict'),{create}=require('./integral-preferences.js');
function memory(){const m=new Map();return{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};}
test('preferências sobrevivem a uma nova sessão e não atravessam identidades',()=>{
 const storage=memory(),a=create(storage,'pessoa-a');assert.equal(a.theme,'light');a.setTheme('dark');a.setCollapsed(true);a.setLayout('gerencial/produtos',{mode:'all',items:{margem:false},order:['faturamento','margem']});
 const again=create(storage,'pessoa-a');assert.equal(again.theme,'dark');assert.equal(again.collapsed,true);assert.equal(again.getLayout('gerencial/produtos').items.margem,false);
 const b=create(storage,'pessoa-b');assert.equal(b.theme,'light');assert.equal(b.collapsed,false);assert.equal(b.getLayout('gerencial/produtos'),null);assert.equal(again.getLayout('financeiro/dre'),null);
});
test('estado inválido volta ao padrão e falha de armazenamento é informada',()=>{
 const storage=memory();storage.setItem('preferences:v2:a','{');assert.equal(create(storage,'a').theme,'light');
 const p=create({getItem:()=>null,setItem:()=>{throw Error('bloqueado');}},'a');assert.equal(p.setCollapsed(true),false);assert.equal(p.saved,false);assert.throws(()=>create(storage,''),/identidade/);
});
