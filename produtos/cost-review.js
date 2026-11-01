"use strict";
const D=require('./domain'),crypto=require('node:crypto'),{pagination}=require('./query');
const CONTRACT='bsan-produtos-custos/conferencia-v1';
const ordered=value=>Array.isArray(value)?value.map(ordered):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,ordered(value[k])])):value;
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(ordered(value))).digest('hex');
const reasons={sem_custo:'Custo ainda não informado',custo_nao_aprovado:'Última versão ainda não aprovada',valor_invalido:'Total de custo inválido',composicao_desatualizada:'Composição pendente ou desatualizada',sku_ambiguo:'SKU em mais de um cadastro do ponto',sku_ausente:'SKU não informado',produto_inativo:'Produto inativo ou situação ainda não reconhecida',produto_pai:'Cadastro pai de variações'};
function verify(document){
 if(!document||document.contrato!==CONTRACT||document.finalidade!=='conferencia'||document.publicavel!==false||document.vigencia!==null||!Array.isArray(document.itens))D.fail('Arquivo não é uma conferência de custos suportada.');
 const {sha256,...payload}=document;if(typeof sha256!=='string'||digest(payload)!==sha256)D.fail('A integridade da conferência não pôde ser confirmada.',409);
 if(typeof payload.id!=='string'||!Number.isSafeInteger(payload.versao)||payload.versao<1||!payload.resumo)D.fail('Metadados de conferência inválidos.');
 D.point(payload.ponto);const ids=new Set();
 const skus=new Map();for(const i of payload.itens){if(!i||typeof i.produto_id!=='string'||ids.has(i.produto_id)||!Array.isArray(i.motivos)||i.motivos.some(r=>typeof r!=='string'||!Object.hasOwn(reasons,r))||typeof i.sku!=='string'||i.sku_chave!==D.skuKey(i.sku))D.fail('Itens de conferência inválidos.');ids.add(i.produto_id);skus.set(i.sku_chave,(skus.get(i.sku_chave)||0)+1);if(!i.motivos.length&&(!i.custo||i.custo.estado!=='aprovado'||!Number.isSafeInteger(i.custo.total_centavos)||i.custo.total_centavos<=0||i.custo.total_centavos>100000000000))D.fail('Custo de conferência inválido.');}
 if(payload.itens.some(i=>(i.sku_chave&&skus.get(i.sku_chave)>1&&!i.motivos.includes('sku_ambiguo'))||(!i.sku_chave&&!i.motivos.includes('sku_ausente'))))D.fail('Ambiguidade de SKU sem pendência explícita.');
 if(payload.resumo.cadastros!==payload.itens.length||payload.resumo.comparaveis!==payload.itens.filter(i=>!i.motivos.length).length||payload.resumo.bloqueados!==payload.itens.filter(i=>i.motivos.length).length)D.fail('Resumo da conferência inconsistente.');
 return document;
}
function createCostReview({acl,event,costing}){
 async function allowed(db,user,ponto){const cap=await acl(db,user);if(!cap.admin)D.fail('Somente direção pode preparar conferências de custo.',403);D.scope(cap,D.point(ponto),true);}
 async function current(db,ponto){
  const products=await db.all('SELECT * FROM prd_produtos WHERE ponto=? ORDER BY sku_chave,id',[ponto]);if(products.length>50000)D.fail('A conferência aceita até 50 mil cadastros por ponto.',413);
  const costs=await db.all('SELECT c.* FROM prd_custos c JOIN prd_produtos p ON p.id=c.produto_id WHERE p.ponto=? AND c.versao=(SELECT MAX(c2.versao) FROM prd_custos c2 WHERE c2.produto_id=c.produto_id)',[ponto]);
  const links=await db.all('SELECT e.conta,e.erp_id,e.produto_id FROM prd_erp e JOIN prd_produtos p ON p.id=e.produto_id WHERE p.ponto=? ORDER BY e.conta,e.erp_id',[ponto]);
  const recipes=await db.all('SELECT c.produto_id,MAX(c.versao) AS versao FROM prd_composicoes c JOIN prd_produtos p ON p.id=c.produto_id WHERE p.ponto=? GROUP BY c.produto_id',[ponto]);
  const cm=new Map(costs.map(c=>[c.produto_id,c])),rm=new Map(recipes.map(c=>[c.produto_id,Number(c.versao)])),lm=new Map(),counts=new Map();
  for(const l of links){if(!lm.has(l.produto_id))lm.set(l.produto_id,[]);lm.get(l.produto_id).push({conta:l.conta,erp_id:l.erp_id});}for(const p of products)counts.set(p.sku_chave,(counts.get(p.sku_chave)||0)+1);
  const items=[];
  for(const p of products){const c=cm.get(p.id),motivos=[];
   if(!p.sku_chave)motivos.push('sku_ausente');else if(counts.get(p.sku_chave)>1)motivos.push('sku_ambiguo');
   if(!['A','ATIVO','ATIVA'].includes(D.skuKey(p.situacao)))motivos.push('produto_inativo');if(p.tipo_variacao==='P')motivos.push('produto_pai');
   if(!c)motivos.push('sem_custo');else{
    if(c.estado!=='aprovado')motivos.push('custo_nao_aprovado');const total=Number(c.total_centavos);if(c.total_centavos==null||!Number.isSafeInteger(total)||total<=0||total>100000000000)motivos.push('valor_invalido');
    if(c.estado==='aprovado')try{await costing.assertFresh(db,c);}catch(e){if(e.status!==409)throw e;motivos.push('composicao_desatualizada');}
   }
   items.push({produto_id:p.id,sku:p.sku,sku_chave:p.sku_chave,nome:p.nome,estrutura:p.tipo,nivel_variacao:p.tipo_variacao,situacao:p.situacao,vinculos:lm.get(p.id)||[],composicao_versao:rm.get(p.id)||null,motivos,
    custo:c?{id:c.id,versao:Number(c.versao),estado:c.estado,produto_centavos:c.produto_centavos==null?null:Number(c.produto_centavos),embalagem_centavos:c.embalagem_centavos==null?null:Number(c.embalagem_centavos),total_centavos:c.total_centavos==null?null:Number(c.total_centavos),fonte:c.fonte,aprovado_por:c.aprovado_por,aprovado_em:c.aprovado_em}:null});
  }
  const resumo={cadastros:items.length,comparaveis:items.filter(i=>!i.motivos.length).length,bloqueados:items.filter(i=>i.motivos.length).length,motivos:{}};for(const i of items)for(const reason of i.motivos)resumo.motivos[reason]=(resumo.motivos[reason]||0)+1;
  return {contrato:CONTRACT,finalidade:'conferencia',publicavel:false,vigencia:null,ponto,resumo,itens:items};
 }
 const last=(db,ponto)=>db.get('SELECT versao FROM prd_conferencias_custo WHERE ponto=? ORDER BY versao DESC LIMIT 1',[ponto]);
 async function stored(db,user,id){const cap=await acl(db,user);if(!cap.admin)D.fail('Somente direção.',403);const r=await db.get('SELECT * FROM prd_conferencias_custo WHERE id=?',[id]);if(!r)D.fail('Conferência não encontrada.',404);D.scope(cap,r.ponto,true);const document=verify({...JSON.parse(r.conteudo),sha256:r.sha256});if(document.id!==r.id||document.ponto!==r.ponto||document.versao!==Number(r.versao))D.fail('Metadados da conferência inconsistentes.',409);return document;}
 return {
  async preview(db,user,query){const ponto=D.point(query.ponto);await allowed(db,user,ponto);return db.transaction(async tx=>{await costing.lock(tx,ponto);const payload=await current(tx,ponto);return {ponto,resumo:payload.resumo,assinatura:digest(payload),expectedVersion:Number((await last(tx,ponto))?.versao||0)};});},
  async capture(db,user,input){const ponto=D.point(input.ponto);await allowed(db,user,ponto);const note=D.text(input.observacao,1000);if(note.length<5)D.fail('Registre o motivo da conferência.');
   return db.transaction(async tx=>{await costing.lock(tx,ponto);const payload=await current(tx,ponto),version=Number((await last(tx,ponto))?.versao||0);if(!Number.isInteger(input.expectedVersion)||input.expectedVersion!==version||input.assinatura!==digest(payload))D.fail('Os custos ou a conferência mudaram. Prepare novamente antes de registrar.',409);
    const document={...payload,id:D.id(),versao:version+1,criado_em:D.now(),autor_id:String(user.id),observacao:note},hash=digest(document);await tx.run('INSERT INTO prd_conferencias_custo(id,ponto,versao,conteudo,sha256,observacao,autor_id,criado_em) VALUES(?,?,?,?,?,?,?,?)',[document.id,ponto,document.versao,JSON.stringify(document),hash,note,String(user.id),document.criado_em]);await event(tx,null,user.id,'conferencia_custo_registrada',{id:document.id,ponto,versao:document.versao,sha256:hash,resumo:payload.resumo});return {ok:true,id:document.id,versao:document.versao,sha256:hash,resumo:payload.resumo};});},
  async list(db,user,query){const ponto=D.point(query.ponto);await allowed(db,user,ponto);const {page,pageSize}=pagination(query),rows=await db.all('SELECT id,versao,sha256,observacao,autor_id,criado_em FROM prd_conferencias_custo WHERE ponto=? ORDER BY versao DESC LIMIT ? OFFSET ?',[ponto,pageSize,(page-1)*pageSize]),total=Number((await db.get('SELECT COUNT(*) n FROM prd_conferencias_custo WHERE ponto=?',[ponto])).n);return {items:rows.map(r=>({...r,versao:Number(r.versao)})),total,page,pageSize};},
  async detail(db,user,id,query={}){const d=await stored(db,user,id),{page,pageSize}=pagination(query),q=D.skuKey(query.q),state=query.estado||'todos';if(!['todos','comparaveis','bloqueados'].includes(state))D.fail('Filtro de conferência inválido.');const filtered=d.itens.filter(i=>(!q||D.skuKey(i.sku+' '+i.nome).includes(q))&&(state==='todos'||(state==='bloqueados'?!!i.motivos.length:!i.motivos.length))),{itens,...meta}=d;return {...meta,items:filtered.slice((page-1)*pageSize,page*pageSize),total:filtered.length,page,pageSize};},
  async download(db,user,id){const d=await stored(db,user,id);await event(db,null,user.id,'conferencia_custo_exportada',{id:d.id,ponto:d.ponto,versao:d.versao,sha256:d.sha256});return d;}
 };
}
module.exports={createCostReview,verify,digest,CONTRACT,reasons};
