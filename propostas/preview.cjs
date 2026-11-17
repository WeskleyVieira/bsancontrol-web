'use strict';
// Prévia em loopback. Arquivos explícitos e dados fictícios; sem API da operação.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const D=require('./preview-data.cjs'),assets=new Map([['/',['panorama-shopeers.html','text/html']],['/panorama-shopeers.html',['panorama-shopeers.html','text/html']],...['workspace-catalog.js','workspace.js','workspace-widgets.js'].map(f=>['/'+f,[f,'text/javascript']]),['/workspace.css',['workspace.css','text/css']]]);
function createServer(){return http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');let body,type;
 if(req.method!=='GET'){res.writeHead(405);res.end();return;}
 if(url.pathname.startsWith('/demo-data/')){const dep=url.pathname.slice(11);if(!D.dependencies.includes(dep)){res.writeHead(404);res.end();return;}const ctx=Object.fromEntries(['point','company','market','period','competence','role','operations','criterion'].map(k=>[k,(url.searchParams.get(k)||'').slice(0,2000)]));body=JSON.stringify(D.make(dep,ctx));type='application/json';}
 else if(assets.has(url.pathname)){const[f,t]=assets.get(url.pathname);body=fs.readFileSync(path.join(__dirname,f));type=t;}
 else{res.writeHead(404);res.end('Não encontrado');return;}
 res.writeHead(200,{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"});res.end(body);
 });}
if(require.main===module){const server=createServer();server.listen(Number(process.env.PROPOSTA_PORT)||0,'127.0.0.1',()=>console.log('PROPOSTA_URL=http://127.0.0.1:'+server.address().port+'/'));}
module.exports={createServer};
