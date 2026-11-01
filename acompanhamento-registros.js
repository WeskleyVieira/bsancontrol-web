'use strict';
const A=require('./acessos');
const queues=new WeakMap();
const fail=(status,message)=>Object.assign(new Error(message),{status});
async function demanda(db,user,id){const key=String(id||'');if(!key||key.length>1000)throw fail(400,'Demanda inválida.');const d=await db.get('SELECT id, criado_em, gestor FROM demandas WHERE id=?',[key]);if(user?.perfil==='gestor'&&(!user.gestor_ref||!d||d.gestor!==user.gestor_ref))throw fail(403,'Fora do seu escopo.');if(!d)throw fail(404,'Demanda não encontrada.');return d;}
async function historico(db,user,id){if(user&&!A.pode(user,'acompanhamento.ver'))throw fail(403,'Seu acesso não permite consultar esta fila.');const d=await demanda(db,user,id);const registros=await db.all('SELECT id, gestor, acao, causa, obs, estado, registrado_em, reacao_h, preco_novo, aguardar_ate FROM tratativas WHERE demanda_id=? ORDER BY id DESC',[d.id]);return{demanda_id:d.id,registros};}
function validar(input){const acao=String(input.acao||'').trim(),causa=String(input.causa||'').trim(),obs=String(input.obs||'').trim();if(!acao||acao.length>250)throw fail(400,'Informe uma ação válida.');if(obs.length<15||obs.length>8000)throw fail(400,'Descreva o que foi feito (entre 15 e 8000 caracteres).');if(causa.length>500)throw fail(400,'A causa deve ter até 500 caracteres.');const raw=input.preco_novo,preco=raw==null||raw===''?null:Number(String(raw).replace(',','.'));if(preco!=null&&(!Number.isFinite(preco)||preco<=0))throw fail(400,'Informe um novo preço válido maior que zero.');if(/ajustei o pre/i.test(acao)&&!(preco>0))throw fail(400,'Informe o novo preço de venda.');const date=String(input.aguardar_ate||''),dt=new Date(date+'T12:00:00Z'),ate=/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(dt.getTime())&&dt.toISOString().slice(0,10)===date?date:null;if(date&&!ate)throw fail(400,'Informe uma data de retorno válida.');return{acao,causa,obs,preco_novo:preco,aguardar_ate:ate};}
async function salvar(db,user,input,clock=()=>new Date().toISOString()){
 if(user&&!A.pode(user,'acompanhamento.tratar'))throw fail(403,'Seu acesso não permite registrar tratativas.');const v=validar(input);
 const work=()=>db.withTransaction(async tx=>{const d=await demanda(tx,user,input.demanda_id),agora=clock(),created=Date.parse(d.criado_em),reacaoH=Number.isFinite(created)?(Date.parse(agora)-created)/36e5:null;
  await tx.run('INSERT INTO tratativas(demanda_id,gestor,acao,causa,obs,estado,registrado_em,reacao_h,preco_novo,aguardar_ate) VALUES(?,?,?,?,?,?,?,?,?,?)',[d.id,user?.gestor_ref||user?.nome||String(input.gestor||''),v.acao,v.causa,v.obs,'trat',agora,reacaoH,v.preco_novo,v.aguardar_ate]);
  await tx.run('UPDATE demandas SET estado=? WHERE id=?',['trat',d.id]);return{ok:true,reacaoH,registrado_em:agora};
 });const job=(queues.get(db)||Promise.resolve()).then(work);queues.set(db,job.catch(()=>{}));return job;
}
module.exports={historico,salvar,validar};
