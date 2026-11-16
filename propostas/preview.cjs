'use strict';
// Prévia isolada, somente leitura: não inicializa a API nem acessa configurações ou dados da operação.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const file=path.join(__dirname,'panorama-shopeers.html');
const server=http.createServer((req,res)=>{
 if(req.method!=='GET'||!['/','/panorama-shopeers.html'].includes(new URL(req.url,'http://localhost').pathname)){res.writeHead(404);res.end('Não encontrado');return;}
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"});
 res.end(fs.readFileSync(file));
});
server.listen(Number(process.env.PROPOSTA_PORT)||0,'127.0.0.1',()=>console.log('PROPOSTA_URL=http://127.0.0.1:'+server.address().port+'/'));
