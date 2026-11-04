"use strict";
const D = require('./domain');
const {sanitizeDetails,operationalDetails}=require('./enrichment');
const {catalogWhere,pagination,term}=require('./query');
const {csv,amount}=require('./export');
const L=require('./logistics');const {createIdentity}=require('./identity');
const {createCosting}=require('./costing');
const {createCostReview}=require('./cost-review');
const {createEffectiveCosts}=require('./effective-costs');
const {createSalesCosts}=require('./sales-costs');
const hash = value => require('node:crypto').createHash('sha256').update(value).digest('hex');
const lastCost = (db, pid) => db.get('SELECT * FROM prd_custos WHERE produto_id=? ORDER BY versao DESC LIMIT 1', [pid]);
const lockProduct = (db,pid) => db.kind==='postgres'?db.get('SELECT id FROM prd_produtos WHERE id=? FOR UPDATE',[pid]):Promise.resolve();
async function event(db, pid, actor, action, data) {
  await db.run('INSERT INTO prd_eventos(id,produto_id,ator_id,acao,dados,criado_em) VALUES(?,?,?,?,?,?)', [D.id(),pid,String(actor),action,JSON.stringify(data),D.now()]);
}
async function issue(db, pid, type, detail, open = true) {
  await db.run(`INSERT INTO prd_pendencias(id,produto_id,tipo,responsavel,estado,detalhe,criado_em,atualizado_em)
    VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(produto_id,tipo) DO UPDATE SET estado=EXCLUDED.estado,detalhe=EXCLUDED.detalhe,atualizado_em=EXCLUDED.atualizado_em`,
    [D.id(),pid,type,'compradora',open?'aberta':'resolvida',detail,D.now(),D.now()]);
}
async function reconcile(db, pid) {
  const p = await db.get('SELECT * FROM prd_produtos WHERE id=?',[pid]);
  const cost = await lastCost(db,pid);
  const entries = await db.all("SELECT id FROM prd_entradas WHERE ponto=? AND sku_chave=? AND estado='aguardando_vinculo'",[p.ponto,p.sku_chave]);
  await issue(db,pid,'aguardando_vinculo','Há uma entrada de compra a conferir antes de solicitar o custo.',!cost && entries.length>0);
  await issue(db,pid,'aguardando_custo','Informar o custo do produto; ausência não representa custo zero.',!cost && entries.length===0);
  await issue(db,pid,'em_revisao','Custo cadastrado ou importado aguarda revisão.',!!cost && cost.estado!=='aprovado');
}
function createService(store,{listUsers,clock}={}) {
  const run = fn => store.exclusive(fn);
  const acl = async (db,user) => {if(!user)D.fail('Entre com uma conta ativa.',401);return D.capabilities(user,await db.all('SELECT * FROM prd_acessos WHERE usuario_id=?',[String(user.id)]));};
  async function product(db,cap,pid,financial=false) {
    const p = await db.get('SELECT * FROM prd_produtos WHERE id=?',[pid]);
    if(!p) D.fail('Produto não encontrado.',404); D.scope(cap,p.ponto,financial); return p;
  }
  const costPublic = c => c ? { id:c.id,versao:Number(c.versao),estado:c.estado,
    produto_centavos:c.produto_centavos==null?null:Number(c.produto_centavos),embalagem_centavos:c.embalagem_centavos==null?null:Number(c.embalagem_centavos),
    total_centavos:c.total_centavos==null?null:Number(c.total_centavos),fonte:c.fonte,observacao:c.observacao,criado_em:c.criado_em,aprovado_por:c.aprovado_por,aprovado_em:c.aprovado_em,...(c.composicao_snapshot?{embalagens:JSON.parse(c.composicao_snapshot).itens.filter(i=>i.embalagem_id).map(i=>({id:i.embalagem_id,codigo:i.codigo,nome:i.nome,familia:i.familia,tamanho:i.tamanho,versao:i.versao}))}:{}) } : null;
  const identity=createIdentity({acl,product,event,lockProduct});
  const costing=createCosting({acl,product,event,issue,reconcile});
  const operationalPackaging=require('./operational-packaging').createOperationalPackaging({acl,event,lock:costing.lock,refreshProducts:costing.pending,calculate:(db,user,input)=>costing.packaging.calculate(db,user,input)});
  const review=createCostReview({acl,event,costing});
  const effective=createEffectiveCosts({acl,product,event,costing,clock});
  const publication=require('./publication').createPublication({acl,event,costing,clock});
  const sales=createSalesCosts({acl,event,costing,clock});
  return {
    publicationState:(user,ponto)=>run(db=>publication.state(db,user,ponto)),
    bindConsumer:(user,input)=>run(db=>publication.bind(db,user,input)),
    publishCosts:(user,input)=>run(db=>publication.publish(db,user,input)),
    downloadPublication:(user,id)=>run(db=>publication.download(db,user,id)),
    packagingPreparations:(user,query)=>run(db=>operationalPackaging.list(db,user,query)),
    packagingPreparation:(user,id,query)=>run(db=>operationalPackaging.detail(db,user,id,query)),
    savePackagingPreparation:(user,input)=>run(db=>operationalPackaging.save(db,user,input)),
    preparePackagingCost:(user,id,input)=>run(db=>operationalPackaging.prepare(db,user,id,input)),
    packagingTypes:(user,query)=>run(db=>costing.packaging.list(db,user,query)),
    packagingType:(user,id,query)=>run(db=>costing.packaging.detail(db,user,id,query)),
    calculatePackaging:(user,input)=>run(db=>costing.packaging.calculate(db,user,input)),
    savePackaging:(user,input)=>run(db=>costing.packaging.save(db,user,input)),
    approvePackaging:(user,id,input)=>run(db=>costing.packaging.approve(db,user,id,input)),
    previewSalesCosts:(user,input)=>run(db=>sales.preview(db,user,input)),
    saveSalesCosts:(user,input)=>run(db=>sales.save(db,user,input)),
    salesCostRuns:(user,query)=>run(db=>sales.list(db,user,query)),
    salesCostRun:(user,id,query)=>run(db=>sales.detail(db,user,id,query)),
    downloadSalesCostRun:(user,id)=>run(db=>sales.download(db,user,id)),
    costTimeline:(user,pid,query)=>run(db=>effective.history(db,user,pid,query)),
    costOnDate:(user,pid,query)=>run(db=>effective.lookup(db,user,pid,query)),
    previewEffectiveCost:(user,pid,input)=>run(db=>effective.preview(db,user,pid,input)),
    saveEffectiveCost:(user,pid,input)=>run(db=>effective.save(db,user,pid,input)),
    downloadCostTimeline:(user,pid,query)=>run(db=>effective.download(db,user,pid,query)),
    previewCostReview:(user,query)=>run(db=>review.preview(db,user,query)),
    captureCostReview:(user,input)=>run(db=>review.capture(db,user,input)),
    costReviews:(user,query)=>run(db=>review.list(db,user,query)),
    costReview:(user,id,query)=>run(db=>review.detail(db,user,id,query)),
    downloadCostReview:(user,id)=>run(db=>review.download(db,user,id)),
    materials:(user,query)=>run(db=>costing.list(db,user,query)),
    materialDetail:(user,id)=>run(db=>costing.detail(db,user,id)),
    saveMaterial:(user,input)=>run(db=>costing.save(db,user,input)),
    composition:(user,pid,query)=>run(db=>costing.composition(db,user,pid,query)),
    calculateComposition:(user,pid,input)=>run(db=>costing.calculate(db,user,pid,input)),
    saveComposition:(user,pid,input)=>run(db=>costing.saveComposition(db,user,pid,input)),
    access: user => run(async db => {const cap=await acl(db,user);return {pontos:cap.pontos,administrar:cap.admin,
      financeiro:cap.pontos.filter(p=>cap.financeiro(p)),editar:cap.pontos.filter(p=>cap.editar(p)),aprovar:cap.pontos.filter(p=>cap.aprovar(p)),conferir_logistica:cap.admin||cap.estoque?cap.pontos:[],editar_fichas_embalagem:cap.admin||cap.estoque?cap.pontos:[]};}),
    compareProducts:(user,pid,query)=>run(db=>identity.compare(db,user,pid,query)),
    decideRelation:(user,pid,input)=>run(db=>identity.decide(db,user,pid,input)),
    confirmLogistics:(user,pid,input)=>run(async db=>{const cap=await acl(db,user),p=await product(db,cap,pid);if(!cap.admin&&!cap.estoque)D.fail('Conferência logística restrita ao estoque e direção.',403);
      if(!['cm','mm','m'].includes(input.unidade_dimensao)||!['kg','g'].includes(input.unidade_peso))D.fail('Confirme as unidades das medidas e do peso.');
      if(input.conferido!==true)D.fail('Confirme que as medidas e o peso foram conferidos.');
      const note=D.text(input.observacao,1000);if(note.length<5)D.fail('Registre como os dados foram conferidos.');
      return db.transaction(async tx=>{await lockProduct(tx,pid);const details=await operationalDetails(tx,pid),view=await L.projection(tx,pid,details);
        if(!view.assinatura||input.assinatura!==view.assinatura)D.fail('Os dados logísticos mudaram. Atualize a ficha.',409);
        if(!Number.isInteger(input.expectedVersion)||input.expectedVersion!==view.versao)D.fail('A conferência mudou. Atualize a ficha.',409);
        if(view.pendencias.length)D.fail('Corrija os dados pendentes na Olist e aguarde a atualização da ficha.');
        await tx.run(`INSERT INTO prd_logistica(produto_id,assinatura,versao,unidade_dimensao,unidade_peso,observacao,ator_id,conferido_em) VALUES(?,?,?,?,?,?,?,?)
          ON CONFLICT(produto_id) DO UPDATE SET assinatura=EXCLUDED.assinatura,versao=EXCLUDED.versao,unidade_dimensao=EXCLUDED.unidade_dimensao,unidade_peso=EXCLUDED.unidade_peso,observacao=EXCLUDED.observacao,ator_id=EXCLUDED.ator_id,conferido_em=EXCLUDED.conferido_em`,
          [pid,view.assinatura,view.versao+1,input.unidade_dimensao,input.unidade_peso,note,String(user.id),D.now()]);
        await L.refresh(tx,pid,details);await event(tx,pid,user.id,'logistica_conferida',{versao:view.versao+1,assinatura:view.assinatura,unidade_dimensao:input.unidade_dimensao,unidade_peso:input.unidade_peso,observacao:note});return {ok:true};});}),
    grant: (user,input) => run(async db => {
      const cap=await acl(db,user);if(!cap.admin)D.fail('Somente direção pode atribuir acesso.',403);
      const uid=D.text(input.usuario_id,80),p=D.point(input.ponto);if(!uid)D.fail('Informe o usuário.');
      const flags=['operacional','custo_ler','custo_editar','custo_aprovar'].map(k=>input[k]===true||input[k]===1?1:0);
      if(flags[3]>flags[2]||flags[2]>flags[1]||flags[1]>flags[0])D.fail('Permissões dependentes precisam estar habilitadas.');
      if(listUsers){const target=(await listUsers()).find(u=>String(u.id)===uid);if(!target)D.fail('Usuário não encontrado.',404);
        if(target.perfil==='direcao')D.fail('Direção já tem acesso administrativo aos dois pontos.');
        if(flags.some(Boolean)&&!target.ativo)D.fail('Ative o usuário antes de conceder acesso.');
        if(flags[3]&&target.aprovador_produtos===false)D.fail('Aprovação disponível para Weskley ou Compradora autorizada.');
        if(target.perfil==='estoque'&&flags.slice(1).some(Boolean))D.fail('Estoque pode receber somente acesso operacional.');}
      return db.transaction(async tx=>{const previous=await tx.get('SELECT versao FROM prd_acessos WHERE usuario_id=? AND ponto=?',[uid,p]),version=previous?Number(previous.versao):0;
        if(input.expectedVersion!==undefined&&(!Number.isInteger(input.expectedVersion)||input.expectedVersion!==version))D.fail('As permissões mudaram. Atualize antes de salvar.',409);
        const changed=await tx.get(`INSERT INTO prd_acessos AS current_acl(usuario_id,ponto,operacional,custo_ler,custo_editar,custo_aprovar,versao)
        VALUES(?,?,?,?,?,?,?) ON CONFLICT(usuario_id,ponto) DO UPDATE SET operacional=EXCLUDED.operacional,custo_ler=EXCLUDED.custo_ler,custo_editar=EXCLUDED.custo_editar,custo_aprovar=EXCLUDED.custo_aprovar,versao=EXCLUDED.versao WHERE current_acl.versao=? RETURNING versao`,[uid,p,...flags,version+1,version]);
        if(!changed)D.fail('As permissões mudaram. Atualize antes de salvar.',409);
        await event(tx,null,user.id,'acesso_alterado',{usuario_id:uid,ponto:p,flags});return {ok:true,versao:version+1};});
    }),
    adminAccess: user=>run(async db=>{const cap=await acl(db,user);if(!cap.admin)D.fail('Somente direção pode administrar acessos.',403);
      if(!listUsers)D.fail('Diretório de usuários não configurado.',503);
      const users=(await listUsers()).map(u=>({id:String(u.id),nome:D.text(u.nome),email:D.text(u.email),perfil:D.text(u.perfil,40),ativo:u.ativo===1||u.ativo===true,...(u.aprovador_produtos!==undefined?{aprovador_produtos:u.aprovador_produtos}:{})}));
      return {usuarios:users,pontos:['Bsan','Powerfull'],acessos:await db.all('SELECT usuario_id,ponto,operacional,custo_ler,custo_editar,custo_aprovar,versao FROM prd_acessos ORDER BY usuario_id,ponto')};}),
    coverage: ()=>run(db=>db.all('SELECT e.conta,p.ponto,COUNT(*) AS quantidade FROM prd_erp e JOIN prd_produtos p ON p.id=e.produto_id GROUP BY e.conta,p.ponto ORDER BY e.conta')),
    syncState: (key,state)=>run(async db=>{const previous=await db.get('SELECT dados FROM prd_integracoes WHERE chave=?',[key]);return db.run(`INSERT INTO prd_integracoes(chave,estado,ultima_tentativa,ultimo_sucesso,referencia,detalhe,dados) VALUES(?,?,?,?,?,?,?)
      ON CONFLICT(chave) DO UPDATE SET estado=EXCLUDED.estado,ultima_tentativa=EXCLUDED.ultima_tentativa,ultimo_sucesso=COALESCE(EXCLUDED.ultimo_sucesso,prd_integracoes.ultimo_sucesso),referencia=COALESCE(EXCLUDED.referencia,prd_integracoes.referencia),detalhe=EXCLUDED.detalhe,dados=EXCLUDED.dados`,
      [D.text(key,80),state.estado,D.now(),state.sucesso?D.now():null,state.referencia||null,state.detalhe,JSON.stringify({...(previous?JSON.parse(previous.dados):{}),...(state.dados||{})})]);}),
    syncCheckpoint: key=>run(async db=>{const row=await db.get('SELECT dados FROM prd_integracoes WHERE chave=?',[key]);return row?JSON.parse(row.dados):{};}),
    syncOverview: user=>run(async db=>{const cap=await acl(db,user);if(!cap.admin)D.fail('Somente direção.',403);
      return {fontes:(await db.all('SELECT * FROM prd_integracoes ORDER BY chave')).map(r=>({...r,dados:JSON.parse(r.dados)})),
        cobertura:await db.all('SELECT e.conta,p.ponto,COUNT(*) AS quantidade,MAX(e.visto_em) AS importado_em FROM prd_erp e JOIN prd_produtos p ON p.id=e.produto_id GROUP BY e.conta,p.ponto ORDER BY e.conta')};}),
    summary:(user,query={})=>run(async db=>require('./dashboard').summary(db,await acl(db,user),query.ponto)),
    list: (user,query={}) => run(async db => {
      const cap=await acl(db,user),{where,args}=catalogWhere(cap,query),{page,pageSize:size}=pagination(query);
      const total=Number((await db.get(`SELECT COUNT(*) AS n FROM prd_produtos p WHERE ${where}`,args)).n);
      const rows=await db.all(`SELECT p.* FROM prd_produtos p WHERE ${where} ORDER BY p.nome,p.id LIMIT ? OFFSET ?`,[...args,size,(page-1)*size]);
      const items=await require('./dashboard').catalog(db,rows,cap,costPublic);
      return {items,total,page,pageSize:size};
    }),
    exportCatalog: (user,query={})=>run(async db=>{
      const cap=await acl(db,user),ponto=D.point(query.ponto),financial=cap.financeiro(ponto),{where,args}=catalogWhere(cap,query);
      const total=Number((await db.get(`SELECT COUNT(*) AS n FROM prd_produtos p WHERE ${where}`,args)).n);
      if(total>50000)D.fail('Refine os filtros para exportar até 50 mil produtos.',413);
      const rows=await db.all(`SELECT p.id,p.sku,p.gtin,p.nome,p.ponto,p.tipo,p.tipo_variacao,p.situacao,p.ncm,p.categoria,p.data_original,p.atualizado_em,p.logistica_estado,p.altura_cm,p.largura_cm,p.comprimento_cm,p.peso_kg,p.diametro_cm,p.peso_liquido_kg,p.embalagem_tipo,p.embalagem_descricao${financial?',p.custo_recalcular,c.produto_centavos,c.embalagem_centavos,c.total_centavos,c.versao,c.estado':''}
        FROM prd_produtos p ${financial?'LEFT JOIN prd_custos c ON c.produto_id=p.id AND c.versao=(SELECT MAX(c2.versao) FROM prd_custos c2 WHERE c2.produto_id=p.id)':''}
        WHERE ${where} ORDER BY p.nome,p.id`,args);
      const headers=['ID interno','SKU','GTIN','Produto','Ponto','Estrutura Olist','Nível de variação','Situação Olist','NCM','Categoria','Data original','Atualização da ficha','Conferência logística','Altura conferida (cm)','Largura conferida (cm)','Comprimento conferido (cm)','Peso bruto conferido (kg)','Diâmetro conferido (cm)','Peso líquido conferido (kg)','Formato embalagem Olist','Descrição embalagem Olist',...(financial?['Custo produto (R$)','Embalagem (R$)','CTP (R$)','Versão custo','Estado custo','Recalcular composição']:[])];
      const values=rows.map(r=>[r.id,r.sku,r.gtin,r.nome,r.ponto,r.tipo,r.tipo_variacao,r.situacao,r.ncm,r.categoria,r.data_original,r.atualizado_em,r.logistica_estado,...[r.altura_cm,r.largura_cm,r.comprimento_cm,r.peso_kg,r.diametro_cm,r.peso_liquido_kg].map(n=>n==null?'':String(n).replace('.',',')),r.embalagem_tipo,r.embalagem_descricao,
        ...(financial?[amount(r.produto_centavos),amount(r.embalagem_centavos),amount(r.total_centavos),r.versao,r.estado,r.custo_recalcular?'Sim':'Não']:[])]);
      await event(db,null,user.id,'catalogo_exportado',{ponto,financeiro:financial,quantidade:rows.length});
      return {filename:'produtos-'+ponto.toLowerCase()+'.csv',csv:csv(headers,values),total:rows.length};
    }),
    detail: (user,pid) => run(async db=>{
      const cap=await acl(db,user),p=await product(db,cap,pid),result=D.operational(p);
      result.vinculos=await db.all('SELECT conta,erp_id,fonte,visto_em FROM prd_erp WHERE produto_id=? ORDER BY conta',[pid]);
      const details=await operationalDetails(db,pid);if(details)result.detalhes=details;
      result.logistica=await L.projection(db,pid,details);result.correspondencias=await identity.relations(db,cap,p);
      if(cap.financeiro(p.ponto)){
        result.recalculo_pendente=!!p.custo_recalcular;
        result.composicao_versao=Number((await db.get('SELECT MAX(versao) v FROM prd_composicoes WHERE produto_id=?',[pid])).v||0);
        result.custos=(await db.all('SELECT c.*,r.snapshot AS composicao_snapshot FROM prd_custos c LEFT JOIN prd_composicoes r ON r.custo_id=c.id WHERE c.produto_id=? ORDER BY c.versao DESC',[pid])).map(costPublic);
        result.pendencias=await db.all("SELECT tipo,responsavel,estado,detalhe,criado_em FROM prd_pendencias WHERE produto_id=? ORDER BY criado_em",[pid]);
        result.candidatos=await db.all("SELECT id,sku,nome,fonte,criado_em FROM prd_entradas WHERE ponto=? AND sku_chave=? AND estado='aguardando_vinculo'",[p.ponto,p.sku_chave]);
        result.eventos=await db.all('SELECT acao,ator_id,criado_em FROM prd_eventos WHERE produto_id=? ORDER BY criado_em DESC LIMIT 30',[pid]);
      }return result;
    }),
    saveCost: (user,pid,input) => run(async db=>{
      const cap=await acl(db,user),p=await product(db,cap,pid,true);if(!cap.editar(p.ponto))D.fail('Sem permissão para editar custos.',403);
      if(D.text(input.embalagem_id,100))return costing.manualWithPackaging(db,user,pid,input);
      const prod=D.cents(input.produto),emb=D.cents(input.embalagem,{zero:true}),note=D.text(input.observacao,1000);
      if(note.length<5)D.fail('Descreva a origem ou o motivo do custo.');
      const version=Number(input.expectedVersion);if(!Number.isInteger(version)||version<0)D.fail('Informe a versão exibida na ficha.');
      return db.transaction(async tx=>{
        await costing.lock(tx,p.ponto);
        await lockProduct(tx,pid);
        const previous=await lastCost(tx,pid);if((previous?Number(previous.versao):0)!==version)D.fail('O custo mudou. Atualize a ficha antes de salvar.',409);
        const costId=D.id();await tx.run(`INSERT INTO prd_custos(id,produto_id,versao,produto_centavos,embalagem_centavos,total_centavos,estado,fonte,fonte_chave,observacao,autor_id,criado_em)
          VALUES(?,?,?,?,?,?,'rascunho','manual',NULL,?,?,?)`,[costId,pid,version+1,prod,emb,prod+emb,note,String(user.id),D.now()]);
        await event(tx,pid,user.id,'custo_informado',{custo_id:costId,versao:version+1});await reconcile(tx,pid);await costing.pending(tx,p.ponto);return {ok:true,id:costId,versao:version+1};
      });
    }),
    approve: (user,pid,input) => run(async db=>{
      const cap=await acl(db,user),p=await product(db,cap,pid,true);if(!cap.aprovar(p.ponto))D.fail('Sem permissão para aprovar custos.',403);
      if(D.text(input.observacao,1000).length<5)D.fail('Registre a conferência realizada.');
      return db.transaction(async tx=>{await costing.lock(tx,p.ponto);await lockProduct(tx,pid);const c=await lastCost(tx,pid);
        if(!c||Number(c.versao)!==Number(input.expectedVersion))D.fail('O custo mudou. Atualize a ficha.',409);
        if(c.estado==='aprovado')return {ok:true,ja_aprovado:true};
        await costing.assertFresh(tx,c);
        if(!['importado','rascunho'].includes(c.estado)||!(Number(c.total_centavos)>0))D.fail('Este custo não pode ser aprovado.');
        await tx.run("UPDATE prd_custos SET estado='aprovado',aprovado_por=?,aprovado_em=? WHERE id=?",[String(user.id),D.now(),c.id]);
        await event(tx,pid,user.id,'custo_aprovado',{custo_id:c.id,observacao:D.text(input.observacao,1000)});await reconcile(tx,pid);await costing.pending(tx,p.ponto);return {ok:true};});
    }),
    entries: (user,ponto,search='',query={}) => run(async db=>{const cap=await acl(db,user);D.scope(cap,D.point(ponto),true);
      const {page,pageSize}=pagination(query),args=[ponto,term(search),term(search)],where="ponto=? AND estado='aguardando_vinculo' AND (UPPER(sku) LIKE ? OR UPPER(nome) LIKE ?)";
      const total=Number((await db.get('SELECT COUNT(*) AS n FROM prd_entradas WHERE '+where,args)).n);
      const items=await db.all('SELECT id,ponto,sku,nome,produto_centavos,embalagem_centavos,total_centavos,estado,fonte,criado_em FROM prd_entradas WHERE '+where+' ORDER BY criado_em DESC,id LIMIT ? OFFSET ?',[...args,pageSize,(page-1)*pageSize]);
      return {items,total,page,pageSize};}),
    entryDetail: (user,eid,query={})=>run(async db=>{
      const cap=await acl(db,user),entry=await db.get('SELECT * FROM prd_entradas WHERE id=?',[eid]);if(!entry)D.fail('Entrada não encontrada.',404);D.scope(cap,entry.ponto,true);
      const {page,pageSize}=pagination(query),args=[entry.ponto];let where='p.ponto=?';
      if(D.text(query.q)){where+=' AND (UPPER(p.sku) LIKE ? OR UPPER(p.nome) LIKE ?)';args.push(term(query.q),term(query.q));}
      else if(entry.sku_chave){where+=' AND p.sku_chave=?';args.push(entry.sku_chave);}else where+=' AND 1=0';
      const total=Number((await db.get('SELECT COUNT(*) AS n FROM prd_produtos p WHERE '+where,args)).n);
      const candidates=await db.all(`SELECT p.id,p.sku,p.nome,p.ponto,e.conta,e.erp_id,
        CASE WHEN EXISTS(SELECT 1 FROM prd_custos c WHERE c.produto_id=p.id) THEN 1 ELSE 0 END AS tem_custo
        FROM prd_produtos p JOIN prd_erp e ON e.produto_id=p.id WHERE ${where} ORDER BY p.nome,p.id,e.conta LIMIT ? OFFSET ?`,[...args,pageSize,(page-1)*pageSize]);
      return {entrada:{id:entry.id,ponto:entry.ponto,sku:entry.sku,nome:entry.nome,estado:entry.estado,produto_centavos:entry.produto_centavos==null?null:Number(entry.produto_centavos),embalagem_centavos:entry.embalagem_centavos==null?null:Number(entry.embalagem_centavos),total_centavos:entry.total_centavos==null?null:Number(entry.total_centavos),observacao:entry.observacao},candidatos:candidates,total,page,pageSize};
    }),
    createEntry: (user,input) => run(async db=>{
      const cap=await acl(db,user),ponto=D.point(input.ponto);D.scope(cap,ponto,true);if(!cap.editar(ponto))D.fail('Sem permissão para informar custos.',403);
      const sku=D.text(input.sku,150),nome=D.text(input.nome);if(!nome)D.fail('Informe o produto.');
      const prod=D.cents(input.produto),emb=D.cents(input.embalagem,{zero:true});
      return db.transaction(async tx=>{const eid=D.id();await tx.run(`INSERT INTO prd_entradas(id,ponto,sku,sku_chave,nome,produto_centavos,embalagem_centavos,total_centavos,estado,fonte,observacao,autor_id,criado_em)
        VALUES(?,?,?,?,?,?,?,?,'aguardando_vinculo','manual',?,?,?)`,[eid,ponto,sku,D.skuKey(sku),nome,prod,emb,prod+emb,D.text(input.observacao,1000),String(user.id),D.now()]);
        await event(tx,null,user.id,'entrada_criada',{entrada_id:eid,ponto});
        if(sku){for(const r of await tx.all('SELECT id FROM prd_produtos WHERE ponto=? AND sku_chave=?',[ponto,D.skuKey(sku)]))await reconcile(tx,r.id);}
        return {ok:true,id:eid};});
    }),
    linkEntry: (user,eid,input) => run(async db=>{
      const cap=await acl(db,user),p=await product(db,cap,input.produto_id,true);if(!cap.editar(p.ponto))D.fail('Sem permissão para vincular.',403);
      return db.transaction(async tx=>{await costing.lock(tx,p.ponto);await lockProduct(tx,p.id);const e=await tx.get('SELECT * FROM prd_entradas WHERE id=?'+(tx.kind==='postgres'?' FOR UPDATE':''),[eid]);
        if(!e||e.ponto!==p.ponto)D.fail('Entrada não encontrada neste ponto.',404);
        if(e.estado==='vinculada'){if(e.produto_id===p.id)return {ok:true,ja_vinculada:true};D.fail('Entrada já vinculada a outro produto.',409);}
        const old=await lastCost(tx,p.id);if(old)D.fail('O produto já possui custo. Revise as versões antes de vincular outra compra.',409);
        await tx.run("UPDATE prd_entradas SET produto_id=?,estado='vinculada' WHERE id=?",[p.id,eid]);
        if(Number(e.total_centavos)>0)await tx.run(`INSERT INTO prd_custos(id,produto_id,versao,produto_centavos,embalagem_centavos,total_centavos,estado,fonte,fonte_chave,observacao,autor_id,criado_em)
          VALUES(?,?,1,?,?,?,'rascunho',?,?,?,?,?)`,[D.id(),p.id,e.produto_centavos,e.embalagem_centavos,e.total_centavos,e.fonte,'entrada:'+eid,e.observacao,String(user.id),D.now()]);
        await event(tx,p.id,user.id,'entrada_vinculada',{entrada_id:eid});
        for(const candidate of await tx.all('SELECT id FROM prd_produtos WHERE ponto=? AND (sku_chave=? OR id=?)',[p.ponto,e.sku_chave,p.id]))await reconcile(tx,candidate.id);
        await costing.pending(tx,p.ponto);return {ok:true};});
    }),
    importDetails: batch=>run(db=>db.transaction(tx=>require('./details-bulk').importDetails(tx,batch,{sanitizeDetails,logistics:L,lockProduct,event}))),
    importBatch: batch => run(db=>db.transaction(async tx=>{
      if(!batch.source||!batch.hash||!Array.isArray(batch.products)||!Array.isArray(batch.costs))D.fail('Lote de importação inválido.');
      const source=D.text(batch.source,1000),syncHash=batch.hash+(batch.revision?':'+D.text(batch.revision,50):'');
      if(await tx.get('SELECT id FROM prd_sincronizacoes WHERE fonte=? AND hash=?',[source,syncHash]))return {ok:true,repetido:true};
      for(const ponto of ['Bsan','Powerfull'])await costing.lock(tx,ponto);
      if(batch.products.length&&!batch.costs.length)return require('./catalog-bulk').importCatalog(tx,batch,{source,syncHash,reconcile,logistics:L,operationalDetails,costing,event});
      let products=0,costs=0,unlinked=0;const seen=new Set();
      for(const r of batch.products){const ponto=D.point(r.ponto),conta=D.text(r.conta,100),erp=D.text(r.erp_id,100),sku=D.text(r.sku,150),nome=D.text(r.nome);
        if(!conta||!erp||!nome)D.fail('Cadastro ERP incompleto no lote.');const k=conta+'|'+erp;if(seen.has(k))D.fail('ID ERP duplicado no lote.');seen.add(k);
        const existing=await tx.get('SELECT produto_id FROM prd_erp WHERE conta=? AND erp_id=?',[conta,erp]);const pid=existing?existing.produto_id:'erp-'+hash(k).slice(0,32);
        let identityChanged=false;
        if(existing){const before=await tx.get('SELECT ponto,sku,nome,tipo,gtin,tipo_variacao FROM prd_produtos WHERE id=?',[pid]);if(before.ponto!==ponto)D.fail('Mudança de ponto ERP exige revisão.');
          identityChanged=JSON.stringify([before.sku,before.nome,before.tipo,before.gtin,before.tipo_variacao])!==JSON.stringify([sku,nome,D.text(r.tipo,40),D.text(r.gtin,100)||null,D.text(r.tipo_variacao,30)||null]);
          await tx.run('UPDATE prd_produtos SET sku=?,sku_chave=?,nome=?,tipo=?,situacao=?,atualizado_em=? WHERE id=?',[sku,D.skuKey(sku),nome,D.text(r.tipo,40),D.text(r.situacao,30),D.now(),pid]);}
        else await tx.run('INSERT INTO prd_produtos(id,ponto,sku,sku_chave,nome,tipo,situacao,data_original,criado_em,atualizado_em) VALUES(?,?,?,?,?,?,?,?,?,?)',
          [pid,ponto,sku,D.skuKey(sku),nome,D.text(r.tipo,40),D.text(r.situacao,30),r.data_original||null,D.now(),D.now()]);
        await tx.run(`INSERT INTO prd_erp(conta,erp_id,produto_id,fonte,visto_em) VALUES(?,?,?,?,?) ON CONFLICT(conta,erp_id) DO UPDATE SET fonte=EXCLUDED.fonte,visto_em=EXCLUDED.visto_em`,[conta,erp,pid,source,D.now()]);products++;
        await tx.run('UPDATE prd_produtos SET gtin=?,tipo_variacao=? WHERE id=?',[D.text(r.gtin,100)||null,D.text(r.tipo_variacao,30)||null,pid]);
        if(identityChanged)await L.refresh(tx,pid,await operationalDetails(tx,pid));
      }
      const costKeys=new Map();for(const r of batch.costs){const k=r.ponto+'|'+D.skuKey(r.sku);costKeys.set(k,(costKeys.get(k)||0)+1);}
      for(const r of batch.costs){const ponto=D.point(r.ponto),sku=D.text(r.sku,150),key=source+'|'+batch.hash+'|'+D.text(r.sourceKey,300);
        if(!sku||!r.sourceKey)continue;
        if(await tx.get('SELECT id FROM prd_entradas WHERE fonte_chave=?',[key]))continue;
        const candidates=await tx.all('SELECT id FROM prd_produtos WHERE ponto=? AND sku_chave=?',[ponto,D.skuKey(sku)]);
        const dup=costKeys.get(ponto+'|'+D.skuKey(sku))>1;
        const pid=candidates.length===1&&!dup?candidates[0].id:null;
        const total=D.legacyCents(r.total),prod=D.legacyCents(r.produto),emb=r.embalagem===0?0:D.legacyCents(r.embalagem);
        const eid=D.id();await tx.run(`INSERT INTO prd_entradas(id,ponto,sku,sku_chave,nome,produto_centavos,embalagem_centavos,total_centavos,data_original,produto_id,estado,fonte,fonte_chave,observacao,autor_id,criado_em)
          VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[eid,ponto,sku,D.skuKey(sku),D.text(r.nome)||sku,prod,emb,total,r.data_original||null,pid,pid?'vinculada':'aguardando_vinculo',source,key,D.text(r.observacao,1000),'importacao',D.now()]);
        if(pid){const old=await lastCost(tx,pid);if(!old&&total!=null){await tx.run(`INSERT INTO prd_custos(id,produto_id,versao,produto_centavos,embalagem_centavos,total_centavos,estado,fonte,fonte_chave,observacao,autor_id,criado_em)
          VALUES(?,?,1,?,?,?,'importado',?,?,?,?,?)`,[D.id(),pid,prod,emb,total,source,key,'Valor legado; não foi aprovado automaticamente.','importacao',D.now()]);costs++;}
          else if(old&&total!=null&&Number(old.total_centavos)!==total)await issue(tx,pid,'divergencia_legada','Outra fonte informa custo diferente. Revise sem substituir o custo atual.');
          if(r.data_original)await tx.run('UPDATE prd_produtos SET data_original=COALESCE(data_original,?) WHERE id=?',[r.data_original,pid]);
        }else unlinked++;
      }
      for(const p of await tx.all('SELECT id FROM prd_produtos'))await reconcile(tx,p.id);
      for(const ponto of ['Bsan','Powerfull'])await costing.pending(tx,ponto);
      await tx.run('INSERT INTO prd_sincronizacoes(id,fonte,hash,iniciado_em,concluido_em,quantidade) VALUES(?,?,?,?,?,?)',[D.id(),source,syncHash,D.now(),D.now(),products+batch.costs.length]);
      await event(tx,null,'importacao','lote_importado',{source,hash:batch.hash,revision:batch.revision||null,products,costs,unlinked});return {ok:true,products,costs,unlinked};
    })),
    status: user=>run(async db=>{const cap=await acl(db,user);if(!cap.admin)D.fail('Somente direção.',403);return db.all('SELECT fonte,concluido_em,quantidade FROM prd_sincronizacoes ORDER BY concluido_em DESC LIMIT 12');})
  };
}
module.exports = { createService };
