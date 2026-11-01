"use strict";
const fs = require('node:fs');
const path = require('node:path');
const { ProdutoError } = require('./domain');
const files = { '/produtos': ['index.html','text/html; charset=utf-8'], '/produtos/': ['index.html','text/html; charset=utf-8'],
  '/produtos/app.js': ['app.js','text/javascript; charset=utf-8'], '/produtos/costing-ui.js':['costing-ui.js','text/javascript; charset=utf-8'], '/produtos/review-ui.js':['review-ui.js','text/javascript; charset=utf-8'], '/produtos/effective-ui.js':['effective-ui.js','text/javascript; charset=utf-8'], '/produtos/sales-ui.js':['sales-ui.js','text/javascript; charset=utf-8'], '/produtos/style.css': ['style.css','text/css; charset=utf-8'] };
files['/produtos/packaging-ui.js']=['packaging-ui.js','text/javascript; charset=utf-8'];
files['/produtos/operational-packaging-ui.js']=['operational-packaging-ui.js','text/javascript; charset=utf-8'];
files['/produtos/publication-ui.js']=['publication-ui.js','text/javascript; charset=utf-8'];
files['/produtos/host-theme.css']=['host-theme.css','text/css; charset=utf-8'];
function json(res,obj,status=200){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(obj));}
function body(req){return new Promise((resolve,reject)=>{let size=0,parts=[],bad=false;
  req.on('data',chunk=>{size+=chunk.length;if(size>16384){bad=true;parts=[];}else if(!bad)parts.push(chunk);});
  req.on('error',reject);req.on('end',()=>{if(bad)return reject(new ProdutoError('Solicitação muito grande.',413));
    try{const x=JSON.parse(Buffer.concat(parts).toString()||'{}');if(!x||Array.isArray(x)||typeof x!=='object')throw 0;resolve(x);}catch{reject(new ProdutoError('JSON inválido.'));}});
});}
function serveAsset(req,res,u){const file=files[u.pathname];if(!file)return false;
  if(req.method!=='GET'){json(res,{erro:'Método não permitido.'},405);return true;}
  res.writeHead(200,{'Content-Type':file[1],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
    'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' https: data:; base-uri 'none'; form-action 'self'; frame-ancestors 'self'"});
  res.end(fs.readFileSync(path.join(__dirname,'web',file[0])));return true;
}
function createHttp({service,resolveUser}){
  return async function handle(req,res,u=new URL(req.url,'http://localhost')){
    if(serveAsset(req,res,u))return true;
    if(u.pathname!=='/api/produtos'&&!u.pathname.startsWith('/api/produtos/'))return false;
    try{
      const user=await resolveUser(req);if(!user)throw new ProdutoError('Entre para acessar Produtos.',401);
      if(user.trocar_senha)throw new ProdutoError('Troque a senha inicial para acessar Produtos.',428);
      if(user.efetivas&&user.efetivas['produtos.ver']!==true)throw new ProdutoError('Seu acesso não permite consultar Produtos.',403);
      const rest=u.pathname.slice('/api/produtos'.length),method=req.method;
      if(user.efetivas&&user.efetivas['produtos.custos.ver']!==true&&(/^\/(publicacoes|consumidores|apuracoes|conferencias|materiais|embalagens|entradas)(?:\/|$)/.test(rest)||/\/(composicao|vigencias|custo-na-data|custos)(?:\/|$)/.test(rest)))throw new ProdutoError('Acesso financeiro não autorizado.',403);
      if(method==='GET'&&rest==='/publicacoes'){json(res,await service.publicationState(user,u.searchParams.get('ponto')));return true;}
      const publication=rest.match(/^\/publicacoes\/([\w-]+)\/arquivo$/);if(method==='GET'&&publication){json(res,await service.downloadPublication(user,publication[1]));return true;}
      if(method==='GET'&&rest==='/acesso'){json(res,await service.access(user));return true;}
      if(method==='GET'&&rest==='/acessos'){json(res,await service.adminAccess(user));return true;}
      if(method==='GET'&&rest==='/integracoes'){json(res,await service.syncOverview(user));return true;}
      if(method==='GET'&&rest==='/apuracoes'){json(res,await service.salesCostRuns(user,Object.fromEntries(u.searchParams)));return true;}
      const salesRun=rest.match(/^\/apuracoes\/([\w-]+)$/),salesFile=rest.match(/^\/apuracoes\/([\w-]+)\/arquivo$/);
      if(method==='GET'&&salesRun){json(res,await service.salesCostRun(user,salesRun[1],Object.fromEntries(u.searchParams)));return true;}
      if(method==='GET'&&salesFile){const d=await service.downloadSalesCostRun(user,salesFile[1]);res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="apuracao-'+d.operacao.id+'-v'+d.versao+'.json"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(d,null,2));return true;}
      if(method==='GET'&&rest==='/conferencias'){json(res,await service.costReviews(user,Object.fromEntries(u.searchParams)));return true;}
      if(method==='GET'&&rest==='/conferencias/preparar'){json(res,await service.previewCostReview(user,Object.fromEntries(u.searchParams)));return true;}
      const review=rest.match(/^\/conferencias\/([\w-]+)$/);if(method==='GET'&&review){json(res,await service.costReview(user,review[1],Object.fromEntries(u.searchParams)));return true;}
      const reviewDownload=rest.match(/^\/conferencias\/([\w-]+)\/arquivo$/);if(method==='GET'&&reviewDownload){const d=await service.downloadCostReview(user,reviewDownload[1]);res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="conferencia-custos-'+d.ponto.toLowerCase()+'-v'+d.versao+'.json"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(d,null,2));return true;}
      if(method==='GET'&&rest==='/materiais'){json(res,await service.materials(user,Object.fromEntries(u.searchParams)));return true;}
      if(method==='GET'&&rest==='/embalagens'){json(res,await service.packagingTypes(user,Object.fromEntries(u.searchParams)));return true;}
      if(method==='GET'&&rest==='/fichas-embalagem'){json(res,await service.packagingPreparations(user,Object.fromEntries(u.searchParams)));return true;}
      const packagingPreparation=rest.match(/^\/fichas-embalagem\/([\w-]+)$/);if(method==='GET'&&packagingPreparation){json(res,await service.packagingPreparation(user,packagingPreparation[1],Object.fromEntries(u.searchParams)));return true;}
      const packaging=rest.match(/^\/embalagens\/([\w-]+)$/);if(method==='GET'&&packaging){json(res,await service.packagingType(user,packaging[1],Object.fromEntries(u.searchParams)));return true;}
      const material=rest.match(/^\/materiais\/([\w-]+)$/);if(method==='GET'&&material){json(res,await service.materialDetail(user,material[1]));return true;}
      const composition=rest.match(/^\/([\w-]+)\/composicao$/);if(method==='GET'&&composition){json(res,await service.composition(user,composition[1],Object.fromEntries(u.searchParams)));return true;}
      const effective=rest.match(/^\/([\w-]+)\/vigencias$/),effectivePreview=rest.match(/^\/([\w-]+)\/vigencias\/conferir$/),effectiveDownload=rest.match(/^\/([\w-]+)\/vigencias\/arquivo$/),dated=rest.match(/^\/([\w-]+)\/custo-na-data$/);
      if(method==='GET'&&effective){json(res,await service.costTimeline(user,effective[1],Object.fromEntries(u.searchParams)));return true;}
      if(method==='GET'&&dated){json(res,await service.costOnDate(user,dated[1],Object.fromEntries(u.searchParams)));return true;}
      if(method==='GET'&&effectiveDownload){const d=await service.downloadCostTimeline(user,effectiveDownload[1],Object.fromEntries(u.searchParams));res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="vigencias-'+d.produto_id+'-r'+d.versao+'.json"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(d,null,2));return true;}
      if(method==='GET'&&rest===''){json(res,await service.list(user,Object.fromEntries(u.searchParams)));return true;}
      if(method==='GET'&&rest==='/exportar'){
        const result=await service.exportCatalog(user,Object.fromEntries(u.searchParams));
        res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="'+result.filename+'"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(result.csv);return true;
      }
      if(method==='GET'&&rest==='/entradas'){json(res,await service.entries(user,u.searchParams.get('ponto'),u.searchParams.get('q')||'',Object.fromEntries(u.searchParams)));return true;}
      const entry=rest.match(/^\/entradas\/([\w-]+)$/);
      if(method==='GET'&&entry){json(res,await service.entryDetail(user,entry[1],Object.fromEntries(u.searchParams)));return true;}
      if(method==='GET'&&rest==='/sincronizacoes'){json(res,{items:await service.status(user)});return true;}
      const comparison=rest.match(/^\/([\w-]+)\/comparar$/);if(method==='GET'&&comparison){json(res,await service.compareProducts(user,comparison[1],Object.fromEntries(u.searchParams)));return true;}
      if(method==='POST'){
        if(rest==='/publicacoes'||rest==='/consumidores'){const origin=req.headers.origin;if(origin&&new URL(origin).host!==req.headers.host)throw new ProdutoError('Origem não autorizada.',403);const input=await body(req);json(res,rest==='/publicacoes'?await service.publishCosts(user,input):await service.bindConsumer(user,input));return true;}

        const origin=req.headers.origin;
        if(origin&&new URL(origin).host!==req.headers.host)throw new ProdutoError('Origem não permitida.',403);
        if(!/^application\/json(?:;|$)/i.test(String(req.headers['content-type']||'')))throw new ProdutoError('Use application/json.',415);
        const input=await body(req);
        if(rest==='/fichas-embalagem'){json(res,await service.savePackagingPreparation(user,input),201);return true;}
        const packagingPreparationCost=rest.match(/^\/fichas-embalagem\/([\w-]+)\/preparar$/);if(packagingPreparationCost){json(res,await service.preparePackagingCost(user,packagingPreparationCost[1],input));return true;}
        if(rest==='/embalagens/calcular'){json(res,await service.calculatePackaging(user,input));return true;}
        if(rest==='/embalagens'){json(res,await service.savePackaging(user,input),201);return true;}
        const packagingApproval=rest.match(/^\/embalagens\/([\w-]+)\/aprovar$/);if(packagingApproval){json(res,await service.approvePackaging(user,packagingApproval[1],input));return true;}
        if(rest==='/apuracoes/conferir'){json(res,await service.previewSalesCosts(user,input));return true;}
        if(rest==='/apuracoes'){json(res,await service.saveSalesCosts(user,input),201);return true;}
        if(effectivePreview){json(res,await service.previewEffectiveCost(user,effectivePreview[1],input));return true;}
        if(effective){json(res,await service.saveEffectiveCost(user,effective[1],input),201);return true;}
        if(rest==='/conferencias'){json(res,await service.captureCostReview(user,input),201);return true;}
        if(rest==='/materiais'){json(res,await service.saveMaterial(user,input));return true;}
        if(composition){json(res,await service.saveComposition(user,composition[1],input));return true;}
        const calculation=rest.match(/^\/([\w-]+)\/composicao\/calcular$/);if(calculation){json(res,await service.calculateComposition(user,calculation[1],input));return true;}
        const logistics=rest.match(/^\/([\w-]+)\/conferir-logistica$/);if(logistics){json(res,await service.confirmLogistics(user,logistics[1],input));return true;}
        const relation=rest.match(/^\/([\w-]+)\/correspondencia$/);if(relation){json(res,await service.decideRelation(user,relation[1],input));return true;}
        if(rest==='/acessos'){if(!Number.isInteger(input.expectedVersion)||input.expectedVersion<0)throw new ProdutoError('Informe a versão exibida das permissões.');json(res,await service.grant(user,input));return true;}
        if(rest==='/entradas'){json(res,await service.createEntry(user,input),201);return true;}
        const link=rest.match(/^\/entradas\/([\w-]+)\/vincular$/);
        if(link){json(res,await service.linkEntry(user,link[1],input));return true;}
        const action=rest.match(/^\/([\w-]+)\/(custos|aprovar)$/);
        if(action){json(res,await (action[2]==='custos'?service.saveCost(user,action[1],input):service.approve(user,action[1],input)));return true;}
      }
      const item=rest.match(/^\/([\w-]+)$/);if(method==='GET'&&item){json(res,await service.detail(user,item[1]));return true;}
      json(res,{erro:'Rota de Produtos não encontrada.'},404);
    }catch(e){json(res,{erro:e instanceof ProdutoError?e.message:'Não foi possível concluir a operação.'},e.status||500);}
    return true;
  };
}
module.exports={createHttp,serveAsset,body,json};
