"use strict";
// Loopback-only review server. No existing database/configuration, network collector or production credentials are loaded.
const http=require('node:http'),crypto=require('node:crypto');const {openStore}=require('./store');const {createService}=require('./service');const {createHttp,body,json}=require('./http');
async function startPreview({dbFile=':memory:',password,port=8791,demo=false}={}){
 if(!password||password.length<12)throw new Error('Defina PRODUTOS_PREVIEW_PASSWORD com pelo menos 12 caracteres.');
 if(demo&&dbFile!==':memory:')throw new Error('Demonstração deve usar apenas o banco fictício em memória.');
 const store=await openStore({sqliteFile:dbFile}),service=createService(store,{listUsers:async()=>users}),sessions=new Map();
 const users=[{id:'local-direcao',nome:'Direção local',email:'direcao@local',perfil:'direcao',ativo:1},{id:'local-compradora',nome:'Compradora local',email:'compradora@local',perfil:'compradora',ativo:1},{id:'local-estoque',nome:'Estoque local',email:'estoque@local',perfil:'estoque',ativo:1}];
 const admin=users[0];for(const user of users.slice(1))await service.grant(admin,{usuario_id:user.id,ponto:'Bsan',operacional:true,custo_ler:user.perfil==='compradora',custo_editar:user.perfil==='compradora'});
 if(demo){await service.importBatch({source:'Exemplo de demonstração',hash:'demo-v1',products:[
  {conta:'Bsan',erp_id:'demo-1',ponto:'Bsan',sku:'PRODUTO-NOVO-AZUL',gtin:'07891234567890',tipo_variacao:'N',nome:'Organizador de viagem · azul',tipo:'S',situacao:'Ativo'},
  {conta:'Bsan',erp_id:'demo-2',ponto:'Bsan',sku:'KIT2-ORGANIZADOR',nome:'Kit com dois organizadores',tipo:'K',situacao:'Ativo'},
  {conta:'Bsan',erp_id:'demo-3',ponto:'Bsan',sku:'CAIXA-ORGANIZADORA',nome:'Caixa organizadora transparente',tipo:'S',situacao:'Ativo'}],costs:[{ponto:'Bsan',sku:'CAIXA-ORGANIZADORA',nome:'Caixa organizadora',total:15.35,sourceKey:'demo-cost'}]});
  await service.createEntry(users[1],{ponto:'Bsan',sku:'KIT2-ORGANIZADOR',nome:'Compra dos organizadores',produto:'30',embalagem:'0.69',observacao:'Dados fictícios para revisar o fluxo'});
  await service.importDetails({source:'Exemplo de detalhes fictícios',hash:'demo-details-1',details:[
    {conta:'Bsan',id:'demo-1',ncm_puro:'12345678',categoria:'Viagem',data_coleta:'2026-10-24T10:00:00Z',dimensoes:{altura:10,largura:15,comprimento:20,pesoLiquido:0.2,pesoBruto:0.25,embalagem:{tipo:2,descricao:'Caixa de demonstração'}}},
    {conta:'Bsan',id:'demo-3',ncm_puro:'87654321',categoria:'Organização',data_coleta:'2026-10-24T10:00:00Z'}]});}
 const handler=createHttp({service,resolveUser:async req=>{const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');const s=sessions.get(token);return s&&s.expires>Date.now()?s.user:null;}});
 const server=http.createServer(async(req,res)=>{const u=new URL(req.url,'http://localhost');
  try{if(req.method==='GET'&&u.pathname==='/api/demo')return json(res,{demo,revisao_local:!demo&&dbFile!==':memory:'});
   if(demo&&req.method==='POST'&&u.pathname==='/api/demo/login'){const input=await body(req);const user=users.find(x=>x.perfil===input.perfil);if(!user)return json(res,{erro:'Perfil inválido.'},400);
     const token=crypto.randomBytes(32).toString('hex');sessions.set(token,{user,expires:Date.now()+3600000});return json(res,{token});}
   if(req.method==='POST'&&u.pathname==='/api/login'){const input=await body(req);const user=users.find(x=>x.email===input.email);
    const a=crypto.createHash('sha256').update(String(input.senha||'')).digest(),b=crypto.createHash('sha256').update(password).digest();
    if(!user||!crypto.timingSafeEqual(a,b))return json(res,{erro:'Credenciais inválidas.'},401);
    const token=crypto.randomBytes(32).toString('hex');sessions.set(token,{user,expires:Date.now()+3600000});return json(res,{token,nome:user.nome,perfil:user.perfil});}
   if(u.pathname==='/')u.pathname='/produtos';if(!await handler(req,res,u))json(res,{erro:'Não encontrado.'},404);
  }catch(e){json(res,{erro:'Não foi possível concluir.'},500);}});
 await new Promise(r=>server.listen(port,'127.0.0.1',r));return {server,store,service,close:async()=>{await new Promise(r=>server.close(r));await store.close();}};
}
if(require.main===module){startPreview({dbFile:process.env.PRODUTOS_DB_FILE||':memory:',password:process.env.PRODUTOS_PREVIEW_PASSWORD,port:Number(process.env.PORT||8791),demo:process.argv.includes('--demo')})
 .then(()=>console.log('Produtos: http://127.0.0.1:'+Number(process.env.PORT||8791)+'/produtos · usuários: direcao@local, compradora@local, estoque@local'))
 .catch(e=>{console.error(e.message);process.exitCode=1;});}
module.exports={startPreview};
