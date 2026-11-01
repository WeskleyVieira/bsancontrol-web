"use strict";
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
class SnapshotError extends Error{constructor(code,message){super(message);this.code=code;}}
const reject=(code,message)=>{throw new SnapshotError(code,message);};
function accountPolicy(accounts){
 if(!Array.isArray(accounts)||!accounts.length)reject('configuracao','Configure as contas esperadas e seus pontos.');
 const seen=new Set();for(const a of accounts){if(!a||typeof a.nome!=='string'||!a.nome.trim()||!['Bsan','Powerfull'].includes(a.ponto)||seen.has(a.nome))reject('configuracao','Configuração de contas inválida.');seen.add(a.nome);}
 return accounts.map(a=>({nome:a.nome,ponto:a.ponto}));
}
function manifestFor(bytes,products,accounts,capturedAt=new Date().toISOString()){
 const policy=accountPolicy(accounts);if(accounts.some(a=>a.completa!==true))reject('incompleta','Nem todas as contas terminaram a paginação.');
 const counts=new Map(policy.map(a=>[a.nome,0]));
 for(const p of products){const name=p.conta,point=policy.find(a=>a.nome===name)?.ponto;if(!point||p.ponto!==point)reject('contas','Cadastro fora das contas e pontos esperados.');counts.set(name,counts.get(name)+1);}
 return {versao:1,capturado_em:capturedAt,sha256:digest(bytes),contas:policy.map(a=>({...a,quantidade:counts.get(a.nome),completa:true}))};
}
function publishSnapshot(file,bytes,manifest){
 if(manifest.sha256!==digest(bytes))reject('hash','O conteúdo não corresponde ao comprovante da captura.');
 fs.mkdirSync(path.dirname(file),{recursive:true});
 const temp=file+'.'+crypto.randomUUID()+'.tmp',sidecar=file+'.manifest.json',tempManifest=temp+'.json';
 try{fs.writeFileSync(temp,bytes);fs.writeFileSync(tempManifest,JSON.stringify(manifest,null,2));fs.renameSync(temp,file);fs.renameSync(tempManifest,sidecar);}
 finally{for(const f of [temp,tempManifest])if(fs.existsSync(f))fs.unlinkSync(f);}
}
function validateSnapshot(batch,manifest,accounts,baseline=[],previousDate=null){
 const policy=accountPolicy(accounts);
 if(manifest?.versao!==1||!Array.isArray(manifest.contas))reject('manifesto','Captura sem comprovante de conclusão válido.');
 if(manifest.sha256!==batch.hash)reject('hash','Arquivo em atualização ou diferente do comprovante. A próxima tentativa verificará novamente.');
 const collected=manifest.capturado_em;
 if(typeof collected!=='string'||!/^\d{4}-\d{2}-\d{2}T.*Z$/.test(collected)||!Number.isFinite(Date.parse(collected))||Date.parse(collected)>Date.now()+300000)reject('data','Data de coleta inválida.');
 if(previousDate&&Date.parse(collected)<Date.parse(previousDate))reject('antiga','Captura anterior à última coleta válida. Cadastros atuais preservados.');
 if(manifest.contas.length!==policy.length||new Set(manifest.contas.map(a=>a.nome)).size!==policy.length)reject('contas','A captura não cobre exatamente as contas configuradas.');
 const counts=new Map(policy.map(a=>[a.nome,0]));
 for(const p of batch.products){const a=policy.find(a=>a.nome===p.conta);if(!a||a.ponto!==p.ponto)reject('contas','Conta ou ponto da captura não corresponde à configuração.');counts.set(p.conta,counts.get(p.conta)+1);}
 for(const a of policy){const proof=manifest.contas.find(c=>c.nome===a.nome),count=counts.get(a.nome),before=Number(baseline.find(c=>c.conta===a.nome)?.quantidade||0);
  if(!proof||proof.completa!==true||proof.ponto!==a.ponto||proof.quantidade!==count||!count)reject('incompleta','Conta ausente, vazia, parcial ou com contagem diferente do comprovante.');
  if(before&&count<before*0.8)reject('queda','Queda superior a 20% no catálogo de uma conta. Confira a captura antes de uma importação manual.');
 }
 return {capturado_em:new Date(collected).toISOString(),contas:policy.map(a=>({...a,quantidade:counts.get(a.nome)}))};
}
module.exports={SnapshotError,accountPolicy,manifestFor,publishSnapshot,validateSnapshot,digest};
