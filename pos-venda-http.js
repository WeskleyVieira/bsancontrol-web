'use strict';
function createHttp(service){return async function(req,res,u,user){
 if(!u.pathname.startsWith('/api/pos-venda/'))return false;
 const send=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 const path=u.pathname.replace('/api/pos-venda/',''),match=path.match(/^atendimentos\/([a-f\d-]{36})$/i);
 if(!user){send({erro:'Entre para acessar Pós-venda.'},401);return true;}
 if(req.method==='GET'){
  if(path==='acessos')send(await service.accessState(user,u.searchParams.get('usuario_id')));
  else if(path==='config')send(await service.config(user));
  else if(path==='atendimentos')send(await service.list(user,Object.fromEntries(u.searchParams)));
  else if(match)send(await service.detail(user,match[1]));
  else send({erro:'Rota de Pós-venda não encontrada.'},404);
 }else if(req.method==='POST'&&(path==='acessos'||path==='atendimentos'||match)){
  if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host){send({erro:'Origem da ação inválida.'},403);return true;}
  if(!String(req.headers['content-type']||'').includes('application/json')){send({erro:'Envie os dados em JSON.'},415);return true;}
  let size=0,parts=[];for await(const part of req){size+=part.length;if(size>32768){send({erro:'Registro acima do tamanho permitido.'},413);return true;}parts.push(part);}
  let input;try{input=JSON.parse(Buffer.concat(parts).toString('utf8'));if(!input||typeof input!=='object'||Array.isArray(input))throw Error();}catch{send({erro:'Registro inválido.'},400);return true;}
  send(path==='acessos'?await service.grantAccess(user,input):match?await service.update(user,match[1],input):await service.create(user,input));
 }else send({erro:'Método ou rota de Pós-venda não disponível.'},405);
 return true;
};}
module.exports={createHttp};
