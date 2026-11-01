"use strict";
const path=require('node:path');const {openStore}=require('./store');const {createService}=require('./service');const {readBatch}=require('./import');
async function main(){
 const args=Object.fromEntries(process.argv.slice(2).filter(x=>x.startsWith('--')).map(x=>{const i=x.indexOf('=');return [x.slice(2,i<0?undefined:i),i<0?true:x.slice(i+1)];}));
 if(args.help){console.log('node produtos/cli.js --db=C:/local/produtos.db --kind=tiny|precifique|pesquisas|detalhes --file=... [--ponto=Bsan|Powerfull]\nImporta apenas arquivos locais para um banco Produtos explicitamente escolhido. Não lê credenciais nem escreve na Olist.');return;}
 if(!args.db||!args.file)throw new Error('Informe --db e --file explicitamente. Use --help.');
 const dbPath=path.resolve(args.db);if(path.basename(dbPath).toLowerCase()==='bsan.db')throw new Error('Use um banco separado, nunca bsan.db.');
 const batch=readBatch(path.resolve(args.file),{kind:args.kind,ponto:args.ponto});
 const store=await openStore({sqliteFile:dbPath});try{const service=createService(store);console.log(JSON.stringify(await (args.kind==='detalhes'?service.importDetails(batch):service.importBatch(batch))));}finally{await store.close();}
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={main};
