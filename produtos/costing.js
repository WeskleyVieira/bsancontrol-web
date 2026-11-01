"use strict";
const D=require('./domain'),F=require('./decimal'),{fingerprint}=require('./identity'),{pagination,term}=require('./query'),crypto=require('node:crypto');
const sha=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const lastCost=(db,pid)=>db.get('SELECT * FROM prd_custos WHERE produto_id=? ORDER BY versao DESC LIMIT 1',[pid]);
const lastRecipe=(db,pid)=>db.get('SELECT * FROM prd_composicoes WHERE produto_id=? ORDER BY versao DESC LIMIT 1',[pid]);
const latestMaterial=(db,id)=>db.get('SELECT * FROM prd_material_versoes WHERE material_id=? ORDER BY versao DESC LIMIT 1',[id]);
const lock=(db,ponto)=>db.kind==='postgres'?db.get('SELECT pg_advisory_xact_lock(482604,?)',[ponto==='Bsan'?1:2]):Promise.resolve();
function createCosting({acl,product,event,issue,reconcile}){
 const packaging=require('./packaging').createPackaging({permission,material,latestMaterial,lock,event,refreshProducts:pending});
 async function permission(db,user,ponto,edit=false){const cap=await acl(db,user);D.scope(cap,D.point(ponto),true);if(edit&&!cap.editar(ponto))D.fail('Sem permissão para cadastrar custos.',403);return cap;}
 async function material(db,id){const m=await db.get('SELECT * FROM prd_materiais WHERE id=?',[id]);if(!m)D.fail('Material não encontrado.',404);return m;}
 function materialVersion(v){return {versao:Number(v.versao),unidade:v.unidade,quantidade_base:v.quantidade_base,custo_compra:v.custo_micro==null?null:F.display(v.custo_micro),gratuito:!!v.gratuito,observacao:v.observacao,criado_em:v.criado_em};}
 async function freshCost(db,c,seen=new Set()){
  if(!c||c.estado!=='aprovado')return false;const recipe=await lastRecipe(db,c.produto_id);
  if(recipe&&!recipe.custo_id&&Number(c.versao)<=JSON.parse(recipe.snapshot).versao_custo_base)return false;
  if(c.fonte!=='composicao')return true;
  if(seen.has(c.produto_id)||seen.size>100)return false;seen=new Set([...seen,c.produto_id]);
  const r=await db.get('SELECT snapshot FROM prd_composicoes WHERE custo_id=?',[c.id]);if(!r)return false;return freshSnapshot(db,JSON.parse(r.snapshot),c.produto_id,seen);
 }
 async function freshSnapshot(db,snapshot,pid,seen=new Set()){
  const p=await db.get('SELECT * FROM prd_produtos WHERE id=?',[pid]);if(!p||snapshot.identidade!==fingerprint(p))return false;
  for(const source of snapshot.fontes){if(source.tipo==='material'){const v=await latestMaterial(db,source.id);if(!v||Number(v.versao)!==source.versao)return false;}
   else if(source.tipo==='embalagem'){if(!await packaging.isFresh(db,source.id,source.versao))return false;}
   else{const c=await lastCost(db,source.id),p2=await db.get('SELECT * FROM prd_produtos WHERE id=?',[source.id]);if(!p2||fingerprint(p2)!==source.identidade||c?.id!==source.custo_id||!await freshCost(db,c,seen))return false;}}
  return true;
 }
 async function pending(db,ponto){const rows=await db.all('SELECT c.* FROM prd_composicoes c JOIN prd_produtos p ON p.id=c.produto_id WHERE p.ponto=? AND c.versao=(SELECT MAX(c2.versao) FROM prd_composicoes c2 WHERE c2.produto_id=c.produto_id)',[ponto]);
  for(const r of rows){const head=await lastCost(db,r.produto_id),s=JSON.parse(r.snapshot),overridden=r.custo_id?head?.id!==r.custo_id:!!head&&Number(head.versao)>s.versao_custo_base;
   const incomplete=!overridden&&!r.custo_id,stale=!overridden&&!!r.custo_id&&!await freshSnapshot(db,s,r.produto_id);
   await issue(db,r.produto_id,'composicao_pendente','A composição está incompleta. Confira materiais, unidades e custos dos componentes.',incomplete);
   if(incomplete&&!head)await issue(db,r.produto_id,'aguardando_custo','Custo em elaboração na composição; confira suas pendências.',false);
   await issue(db,r.produto_id,'composicao_desatualizada','Uma fonte da composição mudou. Recalcule e revise uma nova versão.',stale);
   await db.run('UPDATE prd_produtos SET custo_recalcular=? WHERE id=?',[incomplete||stale?1:0,r.produto_id]);}
 }
 async function cycles(db,pid,lines){const recipes=await db.all('SELECT c.produto_id,c.linhas FROM prd_composicoes c WHERE c.versao=(SELECT MAX(c2.versao) FROM prd_composicoes c2 WHERE c2.produto_id=c.produto_id)'),graph=new Map(recipes.map(r=>[r.produto_id,JSON.parse(r.linhas).filter(x=>x.produto_id).map(x=>x.produto_id)]));graph.set(pid,lines.filter(x=>x.produto_id).map(x=>x.produto_id));
  const active=new Set(),done=new Set();function visit(id){if(active.has(id))D.fail('A composição cria um ciclo entre produtos.');if(done.has(id))return;if(active.size>100)D.fail('Composição excede a profundidade permitida.');active.add(id);for(const child of graph.get(id)||[])visit(child);active.delete(id);done.add(id);}visit(pid);
 }
 async function evaluate(db,cap,p,input){if(!Array.isArray(input.linhas)||!input.linhas.length||input.linhas.length>50)D.fail('Informe de 1 a 50 linhas de composição.');
  const lines=[],items=[],sources=[],problems=[],keys=new Set();let prod=F.fraction(0n),pack=F.fraction(0n),productLines=0;
  for(const raw of input.linhas){const mid=D.text(raw.material_id,100),pid=D.text(raw.produto_id,100),eid=D.text(raw.embalagem_id,100),base=raw.base_manual!=null;if([!!mid,!!pid,!!eid,base].filter(Boolean).length!==1)D.fail('Selecione um material, produto, tipo de embalagem ou custo base em cada linha.');
   const q=F.display(F.fixed(raw.quantidade)),u=F.unit(raw.unidade),purpose=raw.finalidade;if(!['produto','embalagem'].includes(purpose))D.fail('Informe a finalidade da linha.');
   const key=mid?'m:'+mid:pid?'p:'+pid:eid?'e:'+eid:'base:manual';if(keys.has(key))D.fail('Reúna cada material, produto ou embalagem em uma única linha.');keys.add(key);if(purpose==='produto')productLines++;
   const normalized={...(mid?{material_id:mid}:pid?{produto_id:pid}:eid?{embalagem_id:eid}:{base_manual:D.cents(raw.base_manual)/100}),quantidade:q,unidade:u,finalidade:purpose};lines.push(normalized);let amount=null,item;
   if(mid){const m=await material(db,mid);D.scope(cap,m.ponto,true);if(m.ponto!==p.ponto)D.fail('O material pertence a outro ponto.',403);const v=await latestMaterial(db,mid);
    if((m.tipo==='embalagem'&&purpose!=='embalagem')||(m.tipo==='produto'&&purpose!=='produto'))D.fail('Use materiais de embalagem na finalidade Embalagem e produtos comprados na finalidade Produto.');
    // Validate unit compatibility even when the purchase cost is still missing.
    F.line(0n,v.quantidade_base,v.unidade,q,u);if(v.custo_micro==null)problems.push(m.codigo+': custo de compra não informado.');else amount=F.line(v.custo_micro,v.quantidade_base,v.unidade,q,u);
    sources.push({tipo:'material',id:mid,versao:Number(v.versao)});item={...normalized,codigo:m.codigo,nome:m.nome,tipo:m.tipo,versao:Number(v.versao),unidade_compra:v.unidade,quantidade_base:v.quantidade_base,custo_compra: v.custo_micro==null?null:F.display(v.custo_micro)};
   }else if(eid){if(purpose!=='embalagem'||u!=='UN')D.fail('Tipo de embalagem usa UN e finalidade Embalagem.');const selected=await packaging.forProduct(db,cap,p.ponto,eid),s=selected.snapshot;if(!selected.atualizada)problems.push(selected.tipo.codigo+': embalagem precisa de receita aprovada e atualizada.');else amount=F.fraction(BigInt(s.exato.n)*F.fixed(q),BigInt(s.exato.d)*1000000n);if(amount&&amount.n>amount.d*1000000000000000n)D.fail('Custo da embalagem fora do intervalo permitido.');sources.push({tipo:'embalagem',id:eid,versao:selected.versao});item={...normalized,codigo:selected.tipo.codigo,nome:selected.tipo.nome,familia:selected.tipo.familia,tamanho:selected.tipo.tamanho,versao:selected.versao,modo:s?.modo||'calculado',...(s?.modo==='referencia'?{composicao_descritiva:s.composicao_descritiva,origem_referencia:s.origem_referencia}:{}),insumos:s?.itens||[]};
   }else if(base){if(purpose!=='produto'||u!=='UN'||q!=='1')D.fail('Custo base informado usa 1 UN e finalidade Produto.');amount=F.fraction(BigInt(D.cents(raw.base_manual))*10000n);item={...normalized,codigo:'BASE INFORMADA',nome:'Custo do produto informado nesta versão'};
   }else{if(pid===p.id)D.fail('Produto não pode ser componente de si mesmo.');if(purpose!=='produto'||u!=='UN')D.fail('Componentes de produto usam a unidade de custo UN e a finalidade Produto.');
    const component=await product(db,cap,pid,true);if(component.ponto!==p.ponto)D.fail('O componente pertence a outro ponto.',403);const cost=await lastCost(db,pid);
    if(!await freshCost(db,cost))problems.push(component.sku+': custo aprovado e atualizado ainda não disponível.');
    else if(cost.produto_centavos==null)problems.push(component.sku+': custo sem separação entre produto e embalagem.');
    else if(cost.fonte==='composicao'){const recipe=await db.get('SELECT snapshot FROM prd_composicoes WHERE custo_id=?',[cost.id]),exact=JSON.parse(recipe.snapshot).exatos?.produto;
      amount=exact?F.fraction(BigInt(exact.n)*F.fixed(q),BigInt(exact.d)*1000000n):F.line(BigInt(cost.produto_centavos)*10000n,'1','UN',q,u);
      if(amount.n>amount.d*1000000000000000n)D.fail('Custo da linha fora do intervalo permitido.');}
    else amount=F.line(BigInt(cost.produto_centavos)*10000n,'1','UN',q,u);
    sources.push({tipo:'produto',id:pid,custo_id:cost?.id||null,identidade:fingerprint(component)});item={...normalized,codigo:component.sku,nome:component.nome,versao:cost?Number(cost.versao):null,embalagem_individual_excluida:true};
   }
   if(amount){if(purpose==='embalagem')pack=F.add(pack,amount);else prod=F.add(prod,amount);}items.push({...item,custo_linha:amount==null?null:F.display(F.round(amount.n,amount.d))});
  }
  await cycles(db,p.id,lines);if(!productLines)problems.push('Inclua ao menos um material ou componente do produto.');
  const tc=F.cents(F.add(prod,pack)),ec=F.cents(pack),pc=tc-ec;if(!problems.length&&tc===0)problems.push('O custo total arredondado é zero. Revise antes de gerar uma versão financeira.');
  const head=await lastCost(db,p.id),r=await lastRecipe(db,p.id),snapshot={identidade:fingerprint(p),produto:{id:p.id,ponto:p.ponto,sku:p.sku,nome:p.nome,tipo:p.tipo},fontes:sources,itens:items,pendencias:problems,completo:!problems.length,exatos:{produto:{n:String(prod.n),d:String(prod.d)},embalagem:{n:String(pack.n),d:String(pack.d)}},totais:problems.length?null:{produto_centavos:pc,embalagem_centavos:ec,total_centavos:tc},versao_custo_base:Number(head?.versao||0),versao_composicao_base:Number(r?.versao||0)};
  return {...snapshot,linhas:lines,assinatura:sha({linhas:lines,snapshot})};
 }
 const api={
  lock,pending,packaging,
  async manualWithPackaging(db,user,pid,input){const cap=await acl(db,user),p=await product(db,cap,pid,true);if(!cap.editar(p.ponto))D.fail('Sem permissão para editar custos.',403);if(input.embalagem!=null&&D.text(input.embalagem)!=='')D.fail('Escolha o tipo de embalagem ou informe custo manual, sem combinar os dois.');const value=await evaluate(db,cap,p,{linhas:[{base_manual:input.produto,quantidade:'1',unidade:'UN',finalidade:'produto'},{embalagem_id:input.embalagem_id,quantidade:'1',unidade:'UN',finalidade:'embalagem'}]});if(!value.completo)D.fail('A embalagem precisa de composição aprovada e atualizada.');if(Number(input.expectedVersion)!==value.versao_custo_base||input.expectedCompositionVersion!==value.versao_composicao_base||input.embalagem_versao!==value.fontes.find(s=>s.tipo==='embalagem').versao)D.fail('Custo, composição ou embalagem mudou. Atualize a ficha.',409);const saved=await api.saveComposition(db,user,pid,{linhas:value.linhas,assinatura:value.assinatura,expectedVersion:value.versao_composicao_base,expectedCostVersion:value.versao_custo_base,observacao:input.observacao});return {ok:true,id:saved.custo_id,versao:saved.versao_custo,composicao_id:saved.id};},
  async assertFresh(db,c){const current=await lastRecipe(db,c.produto_id);if(current&&!current.custo_id&&Number(c.versao)<=JSON.parse(current.snapshot).versao_custo_base)D.fail('A composição atual está pendente. Complete e recalcule antes de aprovar.',409);
   if(c.fonte!=='composicao')return;const r=await db.get('SELECT snapshot FROM prd_composicoes WHERE custo_id=?',[c.id]);if(!r||current?.custo_id!==c.id||!await freshSnapshot(db,JSON.parse(r.snapshot),c.produto_id))D.fail('A composição mudou. Recalcule antes de aprovar o custo.',409);},
  async list(db,user,query={}){await permission(db,user,query.ponto);const {page,pageSize}=pagination(query),args=[query.ponto,term(query.q),term(query.q)],where='m.ponto=? AND (UPPER(m.codigo) LIKE ? OR UPPER(m.nome) LIKE ?)'+(query.uso_embalagem==='1'?" AND m.tipo IN ('insumo','embalagem')":'');
   const total=Number((await db.get('SELECT COUNT(*) AS n FROM prd_materiais m WHERE '+where,args)).n),rows=await db.all('SELECT m.* FROM prd_materiais m WHERE '+where+' ORDER BY m.nome,m.id LIMIT ? OFFSET ?',[...args,pageSize,(page-1)*pageSize]),items=[];for(const m of rows)items.push({...m,atual:materialVersion(await latestMaterial(db,m.id))});return {items,total,page,pageSize};},
  async detail(db,user,id){const m=await material(db,id);await permission(db,user,m.ponto);return {...m,versoes:(await db.all('SELECT * FROM prd_material_versoes WHERE material_id=? ORDER BY versao DESC',[id])).map(materialVersion)};},
  async save(db,user,input){const ponto=D.point(input.ponto);await permission(db,user,ponto,true);const id=D.text(input.id,100)||D.id(),existing=await db.get('SELECT * FROM prd_materiais WHERE id=?',[id]);if(existing&&existing.ponto!==ponto)D.fail('Material fora do ponto.',403);
   const code=D.text(input.codigo,150),name=D.text(input.nome),type=input.tipo,u=F.unit(input.unidade),basis=F.display(F.fixed(input.quantidade_base)),note=D.text(input.observacao,1000);if(!code||!name||!['produto','insumo','embalagem'].includes(type)||note.length<5)D.fail('Informe código, nome, tipo e origem do custo.');
   const cost=input.custo_compra==null||D.text(input.custo_compra)===''?null:F.fixed(input.custo_compra,{zero:true});if(cost===0n&&input.gratuito!==true)D.fail('Custo zero exige confirmar que o material é gratuito.');if(input.gratuito===true&&cost!==0n)D.fail('Material gratuito deve ter custo zero informado explicitamente.');
   return db.transaction(async tx=>{await lock(tx,ponto);const previous=await latestMaterial(tx,id),version=Number(previous?.versao||0);if(!Number.isInteger(input.expectedVersion)||input.expectedVersion!==version)D.fail('O material mudou. Atualize antes de salvar.',409);
    const duplicate=await tx.get('SELECT id FROM prd_materiais WHERE ponto=? AND codigo_chave=?',[ponto,D.skuKey(code)]);if(duplicate&&duplicate.id!==id)D.fail('Código já cadastrado neste ponto.',409);
    if(existing)await tx.run('UPDATE prd_materiais SET codigo=?,codigo_chave=?,nome=?,tipo=? WHERE id=?',[code,D.skuKey(code),name,type,id]);else await tx.run('INSERT INTO prd_materiais(id,ponto,codigo,codigo_chave,nome,tipo,criado_em) VALUES(?,?,?,?,?,?,?)',[id,ponto,code,D.skuKey(code),name,type,D.now()]);
    await tx.run('INSERT INTO prd_material_versoes(id,material_id,versao,unidade,quantidade_base,custo_micro,gratuito,observacao,autor_id,criado_em) VALUES(?,?,?,?,?,?,?,?,?,?)',[D.id(),id,version+1,u,basis,cost==null?null:Number(cost),cost===0n?1:0,note,String(user.id),D.now()]);
    await event(tx,null,user.id,'material_versionado',{material_id:id,ponto,versao:version+1});await pending(tx,ponto);return {ok:true,id,versao:version+1};});},
  async composition(db,user,pid,query={}){const cap=await acl(db,user),p=await product(db,cap,pid,true),latest=await lastRecipe(db,pid),head=await lastCost(db,pid);let r=latest,status='nao_cadastrada';
   if(query.versao){const version=Number(query.versao);if(!Number.isInteger(version)||version<1)D.fail('Versão de composição inválida.');r=await db.get('SELECT * FROM prd_composicoes WHERE produto_id=? AND versao=?',[pid,version]);if(!r)D.fail('Versão de composição não encontrada.',404);}
   if(r){const s=JSON.parse(r.snapshot);status=r.custo_id?(head?.id!==r.custo_id?'substituida':await freshSnapshot(db,s,pid)?'calculada':'desatualizada'):(head&&Number(head.versao)>s.versao_custo_base?'substituida':'pendente');}
   if(r&&r.versao!==latest.versao)status='historica';
   return {produto:{id:p.id,ponto:p.ponto,sku:p.sku,nome:p.nome},estado:status,historico:await db.all('SELECT versao,estado,criado_em FROM prd_composicoes WHERE produto_id=? ORDER BY versao DESC',[pid]),expectedVersion:Number(latest?.versao||0),expectedCostVersion:Number(head?.versao||0),composicao:r?{id:r.id,versao:Number(r.versao),linhas:JSON.parse(r.linhas),snapshot:JSON.parse(r.snapshot),observacao:r.observacao,criado_em:r.criado_em}:null};},
  async calculate(db,user,pid,input){const cap=await acl(db,user),p=await product(db,cap,pid,true);return evaluate(db,cap,p,input);},
  async saveComposition(db,user,pid,input){const cap=await acl(db,user),p=await product(db,cap,pid,true);if(!cap.editar(p.ponto))D.fail('Sem permissão para editar composição.',403);const note=D.text(input.observacao,1000);if(note.length<5)D.fail('Registre a origem ou motivo da composição.');
   return db.transaction(async tx=>{await lock(tx,p.ponto);const fresh=await product(tx,cap,pid,true),value=await evaluate(tx,cap,fresh,input);if(input.assinatura!==value.assinatura||input.expectedVersion!==value.versao_composicao_base||input.expectedCostVersion!==value.versao_custo_base)D.fail('Uma fonte ou versão mudou. Calcule novamente antes de salvar.',409);
    const rid=D.id(),cid=value.completo?D.id():null; if(cid)await tx.run(`INSERT INTO prd_custos(id,produto_id,versao,produto_centavos,embalagem_centavos,total_centavos,estado,fonte,fonte_chave,observacao,autor_id,criado_em) VALUES(?,?,?,?,?,?,'rascunho','composicao',?,?,?,?)`,[cid,pid,value.versao_custo_base+1,value.totais.produto_centavos,value.totais.embalagem_centavos,value.totais.total_centavos,'composicao:'+rid,note,String(user.id),D.now()]);
    await tx.run('INSERT INTO prd_composicoes(id,produto_id,versao,linhas,snapshot,estado,custo_id,observacao,autor_id,criado_em) VALUES(?,?,?,?,?,?,?,?,?,?)',[rid,pid,value.versao_composicao_base+1,JSON.stringify(value.linhas),JSON.stringify(value),value.completo?'calculada':'pendente',cid,note,String(user.id),D.now()]);
    await event(tx,pid,user.id,'composicao_versionada',{composicao_id:rid,custo_id:cid,versao:value.versao_composicao_base+1});await reconcile(tx,pid);await pending(tx,p.ponto);return {ok:true,id:rid,calculada:value.completo,custo_id:cid,versao_custo:cid?value.versao_custo_base+1:null};});}
 };return api;
}
module.exports={createCosting};
