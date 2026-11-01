"use strict";
const {openStore}=require('./store');const {createService}=require('./service');const {createHttp,json}=require('./http');
const path=require('node:path');
const RESTRICTED=new Set(['estoque','compradora']);
function approvalEligible(user){return user.perfil==='compradora'||(user.perfil==='direcao'&&String(user.email||'').toLowerCase()==='weskley@grupobsan');}
function createIntegration({dbx,userDe,mustChangePassword,resolveSession}){
 let promise, productStore;
 const eligible=approvalEligible;
 const resolveUser=async req=>{if(resolveSession){const user=await resolveSession(req);if(!user||user.recusado)return null;return {...user,efetivas:{...user.efetivas,'produtos.custos.aprovar':user.efetivas?.['produtos.custos.aprovar']===true&&eligible(user)},trocar_senha:!!user.trocar};}
   const claim=userDe(req);if(!claim||claim.id==null)return null;
   const row=await dbx.get('SELECT id,nome,perfil,gestor_ref,ativo,senha FROM usuarios WHERE id=? AND ativo=1',[claim.id]);if(!row)return null;
   const {senha,...user}=row;return {...user,trocar_senha:mustChangePassword?mustChangePassword(row):false};};
 const getHandler=()=>promise||(promise=(async()=>{
   const file=process.env.PRODUTOS_DB_FILE,url=process.env.PRODUTOS_DATABASE_URL;
   if(!file&&!url)throw new Error('Configure um banco exclusivo do módulo Produtos.');
   if(file&&path.basename(file).toLowerCase()==='bsan.db')throw new Error('Produtos não deve usar o SQLite operacional.');
   const store=await openStore({sqliteFile:file,connectionString:url});productStore=store;
   const service=createService(store,{listUsers:async()=>(await dbx.all('SELECT id,nome,email,perfil,ativo FROM usuarios ORDER BY nome,id')).map(u=>({...u,aprovador_produtos:eligible(u)}))});
   if(process.env.PRODUTOS_SYNC_ENABLED==='1'){
     try{require('./sync').createSnapshotSync({service,directory:process.env.PRODUTOS_SYNC_DIR,accounts:JSON.parse(process.env.PRODUTOS_SYNC_ACCOUNTS||'null'),intervalMs:Number(process.env.PRODUTOS_SYNC_INTERVAL_MS||300000)}).start();}
     catch{await service.syncState('catalogo',{estado:'configuracao',detalhe:'Atualização automática sem configuração válida de pasta, contas ou intervalo. Catálogo disponível para consulta.'});}
   }
   return createHttp({service,resolveUser});
 })().catch(e=>{promise=null;throw e;}));
 const handle=async(req,res,u)=>{
   const productPath=u.pathname==='/produtos'||u.pathname.startsWith('/produtos/')||u.pathname==='/api/produtos'||u.pathname.startsWith('/api/produtos/');
   if(productPath){if(process.env.PRODUTOS_ENABLED!=='1'){json(res,{erro:'Produtos ainda não está habilitado neste ambiente.'},503);return true;}
     try{if(!await (await getHandler())(req,res,u))json(res,{erro:'Rota de Produtos não encontrada.'},404);return true;}catch{json(res,{erro:'Produtos não está disponível. Confira a configuração do módulo.'},503);return true;}}
   // These operational users must never fall through legacy routes, which only knew the original three profiles.
   if(resolveSession)return false; // The current host owns session validation and all legacy authorization.
   const user=await resolveUser(req);
   const publicAuth=['/api/login','/api/trocar-senha','/api/cache/clear'].includes(u.pathname);
   if(userDe(req)&&!user&&!publicAuth){json(res,{erro:'Sessão sem usuário ativo.'},401);return true;}
   if(user&&RESTRICTED.has(user.perfil)&&!publicAuth){json(res,{erro:'Este perfil acessa somente Produtos.'},403);return true;}
   if(process.env.PRODUTOS_ENABLED==='1'&&!publicAuth){
     if(u.pathname.startsWith('/api/')&&!user){json(res,{erro:'Entre para acessar os dados.'},401);return true;}
     // Local HTML contains historical embedded finance. Do not serve it in the operational Products mode.
     if(process.env.AUTH_REQUIRED!=='1'&&!u.pathname.startsWith('/api/')){
       if(u.pathname==='/'){res.writeHead(302,{Location:'/produtos'});res.end();}else json(res,{erro:'Use a página Produtos ou o pacote online sem dados embutidos.'},403);return true;}
   }
   return false;
 };
 handle.userReferences=async userId=>{
   if(process.env.PRODUTOS_ENABLED!=='1')return [];
   await getHandler();
   for(const [table,col]of [['prd_eventos','ator_id'],['prd_acessos','usuario_id'],['prd_custos','autor_id'],['prd_custos','aprovado_por'],['prd_entradas','autor_id'],['prd_ficha_embalagem_versoes','autor_id']]){
     if(await productStore.get(`SELECT 1 AS ok FROM ${table} WHERE ${col}=? LIMIT 1`,[String(userId)]))return ['Há acessos ou registros de autoria em Produtos. Arquive o cadastro para preservar o histórico.'];
   }
   return [];
 };
 return handle;
}
module.exports={createIntegration,approvalEligible};
