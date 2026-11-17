'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {createData}=require('./integral-data.cjs'),{build}=require('./integral-source.cjs'),{createApi}=require('./integral-api.cjs');
async function createIntegralServer(){const data=createData(),source=build(data),api=await createApi(data),assets={
 '/revisao/bootstrap.js':['integral-bootstrap.js','text/javascript'], '/revisao/preferencias.js':['integral-preferences.js','text/javascript'], '/revisao/charts.js':['integral-charts.js','text/javascript'], '/revisao/integral.js':['integral.js','text/javascript'], '/revisao/integral.css':['integral.css','text/css'], '/revisao/produtos.js':['integral-products.js','text/javascript'], '/revisao/produtos.css':['integral-products.css','text/css'],
 '/revisao/studio-catalogue.js':['studio-catalogue.js','text/javascript'], '/revisao/studio-composition.js':['studio-composition.js','text/javascript'], '/revisao/studio.css':['studio.css','text/css'],
 '/revisao/vendor/chart.js':['node_modules/chart.js/dist/chart.umd.js','text/javascript'], '/revisao/vendor/labels.js':['node_modules/chartjs-plugin-datalabels/dist/chartjs-plugin-datalabels.min.js','text/javascript'], '/revisao/vendor/xlsx.js':['node_modules/xlsx/dist/xlsx.full.min.js','text/javascript']
 };
 const server=http.createServer(async(req,res)=>{const u=new URL(req.url,'http://localhost');try{
  if(['/produtos','/produtos/'].includes(u.pathname)&&req.method==='GET'){const html=fs.readFileSync(path.join(__dirname,'../produtos/web/index.html'),'utf8').replace('</head>','<link rel="stylesheet" href="/revisao/produtos.css"><link rel="stylesheet" href="/revisao/studio.css"><script defer src="/revisao/preferencias.js"></script><script defer src="/revisao/studio-catalogue.js"></script><script defer src="/revisao/studio-composition.js"></script><script src="/revisao/produtos.js"></script></head>');res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'self'"});res.end(html);return;}
  if(u.pathname.startsWith('/api/')||u.pathname.startsWith('/produtos')){if(await api.handle(req,res,u))return;}
  let content,type='text/html';
  if(req.method!=='GET'){res.writeHead(405);res.end();return;}
  if(['/','/panorama-shopeers.html','/revisao'].includes(u.pathname))content=source.html;
  else if(u.pathname==='/revisao/dados.js'){type='text/javascript';content='window.BC_REVIEW_DATA='+JSON.stringify(data).replaceAll('</','<\\/')+';';}
  else if(u.pathname==='/revisao/manifesto'){type='application/json';content=JSON.stringify({...source.manifest,missingContracts:api.missing});}
  else if(assets[u.pathname]){const[f,t]=assets[u.pathname];content=fs.readFileSync(path.join(__dirname,f));type=t;}
  else{res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: blob:; font-src 'self'; frame-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'self'"});res.end(content);
 }catch(e){console.error('review',u.pathname,e.message);res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({erro:e.message}));}});
 return{server,data,source,api,async close(){await new Promise(r=>server.close(r));await api.close();}};
}
if(require.main===module)createIntegralServer().then(({server})=>server.listen(Number(process.env.PROPOSTA_PORT)||59833,'127.0.0.1',()=>console.log('REVIEW_URL=http://127.0.0.1:'+server.address().port+'/'))).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={createIntegralServer};
