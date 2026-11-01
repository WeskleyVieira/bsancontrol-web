"use strict";
const fs=require('node:fs'),path=require('node:path');
const {readBatch}=require('./import');const {SnapshotError,accountPolicy,validateSnapshot}=require('./snapshot');
function createSnapshotSync({service,directory,accounts,intervalMs=300000,settleMs=1000,reader=readBatch}={}){
 if(!directory||!path.isAbsolute(directory))throw new Error('Configure uma pasta absoluta para as capturas.');
 const policy=accountPolicy(accounts);if(!Number.isInteger(intervalMs)||intervalMs<60000)throw new Error('Intervalo mínimo de atualização: 60 segundos.');
 const dir=path.resolve(directory);let running=null,timer=null;
 const problem=(code,message)=>{throw new SnapshotError(code,message);};
 function stable(file,kind){const before=fs.statSync(file);if(!before.isFile()||before.size>100*1024*1024||Date.now()-before.mtimeMs<settleMs)problem('em_gravacao','Arquivo recente, em gravação ou fora do tamanho permitido. Nova tentativa no próximo ciclo.');
   const batch=reader(file,{kind}),after=fs.statSync(file);if(before.size!==after.size||before.mtimeMs!==after.mtimeMs)problem('em_gravacao','Arquivo alterado durante a leitura. Cadastros anteriores preservados.');return batch;}
 async function capture(){let reference;
  try{const files=fs.readdirSync(dir).filter(n=>/^Tiny_Cadastro_\d{4}-\d{2}-\d{2}\.xlsx$/.test(n)).sort();if(!files.length)problem('aguardando','Nenhuma captura de catálogo encontrada.');reference=files.at(-1);const file=path.join(dir,reference),proof=file+'.manifest.json';
   if(!fs.existsSync(proof))problem('sem_comprovante','A captura ainda não tem comprovante de conclusão por conta. Execute o coletor atualizado; a base atual foi preservada.');
   if(fs.statSync(proof).size>256*1024)problem('manifesto','Comprovante fora do tamanho permitido.');
   const manifestText=fs.readFileSync(proof,'utf8'),manifest=JSON.parse(manifestText),batch=stable(file,'tiny');
   if(fs.readFileSync(proof,'utf8')!==manifestText)problem('em_gravacao','Comprovante alterado durante a leitura. Nova tentativa no próximo ciclo.');
   const checkpoint=await service.syncCheckpoint('catalogo'),coverage=validateSnapshot(batch,manifest,policy,await service.coverage(),checkpoint.capturado_em);
   const result=await service.importBatch(batch),old=Date.now()-Date.parse(coverage.capturado_em)>48*3600000;
   await service.syncState('catalogo',{estado:old?'desatualizada':'atualizada',sucesso:true,referencia:reference,
    detalhe:old?'Captura completa processada, mas coletada há mais de 48 horas. Confira o coletor.':result.repetido?'Captura completa já importada. Aguardando uma coleta nova.':'Captura completa importada e conferida por conta.',dados:{...coverage,repetido:!!result.repetido}});
   return {ok:true,...result};
  }catch(e){await service.syncState('catalogo',{estado:e instanceof SnapshotError?e.code:'falha_leitura',referencia:reference,
    detalhe:e instanceof SnapshotError?e.message:'Não foi possível ler ou importar a captura. Base anterior preservada; confira os arquivos e a configuração.'});return {ok:false};}}
 async function details(){const file=path.join(dir,'Tiny_NCM_Cache.json');try{if(!fs.existsSync(file)){await service.syncState('detalhes',{estado:'aguardando',detalhe:'Cache de detalhes ainda não disponível.'});return {ok:false};}
   const result=await service.importDetails(stable(file,'detalhes'));
   await service.syncState('detalhes',{estado:'processada',sucesso:true,referencia:path.basename(file),detalhe:result.repetido?'Cache já importado. Aguardando atualização do coletor.':'Detalhes aplicados somente por conta + ID; registros sem identidade foram preservados para conferência.',
    dados:result.repetido?undefined:{aplicados:result.matched,sem_identidade:result.missingIdentity,nao_encontrados:result.notFound,antigos:result.older}});return {ok:true,...result};
  }catch(e){await service.syncState('detalhes',{estado:e instanceof SnapshotError?e.code:'falha_leitura',detalhe:e instanceof SnapshotError?e.message:'Cache inválido ou em gravação. Detalhes anteriores preservados.'});return {ok:false};}}
 function runOnce(){if(running)return running;running=(async()=>({catalogo:await capture(),detalhes:await details()}))().finally(()=>{running=null;});return running;}
 return {runOnce,start({unref=true}={}){if(timer)return;void runOnce().catch(()=>{});timer=setInterval(()=>{void runOnce().catch(()=>{});},intervalMs);if(unref)timer.unref();},async stop(){clearInterval(timer);timer=null;await running;}};
}
function syncOptions(args,env=process.env){
 const rawAccounts=args.accounts||(args['accounts-env']===true?env.PRODUTOS_SYNC_ACCOUNTS:null);
 if(!args.dir||!rawAccounts||(!args.db&&args.postgres!==true)||(args.db&&args.postgres))throw new Error('Escolha --db=<banco-isolado> ou --postgres; informe --dir e --accounts ou --accounts-env.');
 if(args.db&&path.basename(args.db).toLowerCase()==='bsan.db')throw new Error('Não use o banco operacional.');
 if(args.postgres&&!env.PRODUTOS_DATABASE_URL)throw new Error('Configure PRODUTOS_DATABASE_URL explicitamente para o worker PostgreSQL.');
 if(!path.isAbsolute(args.dir))throw new Error('Configure uma pasta absoluta para as capturas.');
 const accounts=accountPolicy(JSON.parse(rawAccounts));
 return {store:args.postgres?{connectionString:env.PRODUTOS_DATABASE_URL}:{sqliteFile:path.resolve(args.db)},worker:{directory:args.dir,accounts},once:args.once===true};
}
async function main(){const args=Object.fromEntries(process.argv.slice(2).filter(v=>v.startsWith('--')).map(v=>{const i=v.indexOf('=');return [v.slice(2,i<0?undefined:i),i<0?true:v.slice(i+1)];}));
 const options=syncOptions(args),{openStore}=require('./store'),{createService}=require('./service');const store=await openStore(options.store);
 try{const worker=createSnapshotSync({service:createService(store),...options.worker});
  if(options.once){const result=await worker.runOnce();console.log(JSON.stringify(result));if(!result.catalogo.ok)process.exitCode=1;await store.close();return;}
  worker.start({unref:false});console.log('Produtos: monitorando capturas locais; nenhuma chamada ao ERP.');let stopping=false;
  const stop=async()=>{if(stopping)return;stopping=true;await worker.stop();await store.close();};process.once('SIGINT',stop);process.once('SIGTERM',stop);
 }catch(e){await store.close();throw e;}}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={createSnapshotSync,syncOptions};
