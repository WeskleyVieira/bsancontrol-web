'use strict';
const {openStore}=require('../produtos/store'),{createService}=require('../produtos/service'),{createHttp,body,json}=require('../produtos/http');
async function createApi(data){
 const store=await openStore({sqliteFile:':memory:'}),users=['direcao','coordenacao','gestor','compradora','estoque','posvenda'].map(perfil=>({id:'review-'+perfil,nome:'Revisão · '+perfil,perfil,ativo:true,produtos_habilitado:true})),admin=users[0];
 const service=createService(store,{listUsers:async()=>users});
 for(const user of users.slice(1))for(const ponto of ['Bsan','Powerfull'])await service.grant(admin,{usuario_id:user.id,ponto,operacional:true,custo_ler:!['estoque','posvenda'].includes(user.perfil),custo_editar:['compradora','coordenacao'].includes(user.perfil)});
 const products=[...new Map(data.source.map(r=>[r.point+'|'+r.sku,r])).values()];
 await service.importBatch({source:'Revisão integral · dados fictícios',hash:'review-v1',products:products.map((r,i)=>({conta:r.point,erp_id:'DEMO-'+i,ponto:r.point,sku:r.sku,nome:r.name,tipo:'S',situacao:'Ativo',gtin:'78900000'+String(i).padStart(5,'0')})),costs:products.slice(0,8).map(r=>({ponto:r.point,sku:r.sku,nome:r.name,total:Math.round(r.cost/r.units*100)/100,sourceKey:'review-'+r.point+'-'+r.sku}))});
 for(const r of products.slice(0,3))await service.createEntry(admin,{ponto:r.point,sku:r.sku,nome:'Entrada demonstrativa · '+r.name,produto:'15',embalagem:'0.85',observacao:'Revisão isolada; nenhuma compra real.'});
 for(const[codigo,nome,unidade,custo]of [['DEMO-KRAFT','Papel kraft','M','1.20'],['DEMO-BOLHA','Plástico bolha','M','2.30'],['DEMO-FITA','Fita adesiva','M','0.18']])await service.saveMaterial(admin,{ponto:'Bsan',codigo,nome,tipo:'insumo',unidade,quantidade_base:'1',custo_compra:custo,observacao:'Origem fictícia para homologar o fluxo na prévia.',expectedVersion:0});
 const pack={ponto:'Bsan',codigo:'DEMO-CAIXA-P',nome:'Caixa de proteção P',familia:'Caixas',tamanho:'P',modo:'referencia',composicao_descritiva:'Papel kraft e proteção interna.',origem_referencia:'Referência fictícia da revisão.',custo_referencia:'1.45',observacao:'Versão fictícia para revisão da interface.',expectedVersion:0};
 const calculation=await service.calculatePackaging(admin,pack);await service.savePackaging(admin,{...pack,assinatura:calculation.assinatura});
 await service.savePackagingPreparation(admin,{ponto:'Bsan',codigo:'DEMO-PREPARO-P',nome:'Preparo de proteção P',familia:'Proteção',tamanho:'P',insumos:[{nome:'Papel kraft',referencia:'DEMO-KRAFT',quantidade:'0.5',unidade:'M'},{nome:'Fita adesiva',referencia:'DEMO-FITA',quantidade:'0.3',unidade:'M'}],observacao:'Ficha fictícia para revisar o fluxo completo.',expectedVersion:0});
 const userOf=req=>users.find(u=>req.headers.authorization==='Bearer review-'+u.perfil)||admin;
 const productHandler=createHttp({service,resolveUser:async req=>userOf(req)});
 const operations=[...new Map(data.source.map(r=>[r.company+'|'+r.market,{empresa:r.company,marketplace:r.market,canal:r.market,operacao:r.company+' · '+r.market,gestor:r.company==='Powerfull Imports'?'Gestor B':'Gestor A'}])).values()];
 const demands=data.source.slice(0,18).map((r,i)=>({id:'review-task-'+i,empresa:r.company,mkt:r.market,gestor:'Gestor A',ponto:r.point,sku:r.sku,anuncio:r.id,titulo:r.name,tipo:['queima','peso','perdendo','ganhando','prejuizo','promo_execucao','ads_queima'][i%7],sub:i%7===5?'promos':i%7===6?'ads':'tarefas',estado:i%4===0?'aguardando':'pendente',mes:'2026-11',competencia:'2026-11',gerado_em:'2026-11-10T10:00:00Z',criado_em:'2026-11-10T10:00:00Z',prazo:3,meta:20,mcPct:r.margin,fat:r.fat,mc:r.after,quantidade:r.units,financeiro:{status:'ok',receita:r.fat,margem:r.after,incompletas:0},desempenho:'a_conferir',registro:i%3===0?{acao:'Em acompanhamento',em:'2026-11-14T10:00:00Z',obs:'Revisão demonstrativa de evidência e próximo retorno.'}:null}));
 let alignments=[{id:'review-align-1',empresa:'Bsan Shop',mkt:'Mercado Livre',gestor:'Gestor A',titulo:'Conferir estratégia de margem',pedido:'Revisar a composição da margem e registrar a estratégia aplicada.',prova:'Demonstrativo do período e justificativa registrada.',regua:'sem-fonte',estado:'aberto',prazo:'2026-11-18',criado_em:'2026-11-12T10:00:00Z'}],histories=[],costItems=[{id:'review-cost-1',empresa:'Bsan Shop',descricao:'Estrutura demonstrativa',categoria:'Estrutura',tipo:'fixo',valor:4200,valor_mes:4200,desde:'2026-01',status:'fixo',comissao:false},{id:'review-cost-2',empresa:'Powerfull Imports',descricao:'Energia demonstrativa',tipo:'variavel',valor:550,valor_mes:550,desde:'2026-01',status:'estimado',comissao:false}];
 let cases=data.source.slice(0,9).map((r,i)=>({id:'review-pv-'+i,empresa:r.company,canal:r.market,tipo:['duvida','reclamacao','devolucao'][i%3],estado:['aberto','aguardando','resolvido'][i%3],titulo:'Atendimento demonstrativo · '+r.name,descricao:'Exemplo de atendimento para revisar o fluxo completo, com dados fictícios.',sku:r.sku,pedido:'DEMO-PED-'+i,cliente:'Cliente demonstrativo',responsavel:'Equipe de revisão',prioridade:'normal',prazo:'2026-11-'+(15+i),data_abertura:'2026-11-10',versao:1}));
 const tipos={duvida:'Dúvida',reclamacao:'Reclamação',devolucao:'Devolução'},estados={aberto:'Aberto',aguardando:'Aguardando retorno',resolvido:'Resolvido',cancelado:'Cancelado',a_conferir:'A conferir'};
 const config=()=>({tipos,estados,prioridades:{normal:'Normal',alta:'Alta',urgente:'Urgente'},operacoes:operations.map(o=>({empresa:o.empresa,canal:o.canal})),pode_editar:true,hoje:'2026-11-17'});
 const missing=[],closures=new Map(),rules=new Map(),owners=new Map(),ownerHistory=[];
 async function handle(req,res,u){
  if(u.pathname.startsWith('/produtos')||u.pathname.startsWith('/api/produtos'))return productHandler(req,res,u);
  if(!u.pathname.startsWith('/api/'))return false;
  const q=Object.fromEntries(u.searchParams),input=req.method==='POST'?await body(req):{},send=d=>{json(res,d);return true;};
  if(u.pathname==='/api/demo')return send({demo:true});
  if(u.pathname==='/api/me')return send({...userOf(req),ok:true});
  if(u.pathname==='/api/sessao')return send({ok:true,usuario:{...userOf(req),gestor_ref:'Gestor A',restricoes:{},revogacao:0}});
  if(u.pathname==='/api/admin/usuarios'){if(req.method==='POST'){const saved={...input,id:input.id||'review-user-'+Date.now(),versao:(+input.versao||0)+1},old=users.find(u=>u.id===saved.id);if(old)Object.assign(old,saved);else users.push(saved);return send({ok:true,acao:old?'atualizado':'criado'});}return send({usuarios:users.map((u,i)=>({...u,email:u.perfil+'@exemplo.invalid',gestor_ref:u.perfil==='gestor'?'Gestor A':'',versao:u.versao||1,restricoes:{},senha_pendente:false})),gestores:['Gestor A','Gestor B'],operacoes:operations,meu_id:admin.id});}
  if(u.pathname==='/api/admin/historico')return send({eventos:[]});
  if(u.pathname==='/api/pos-venda/acessos')return send({usuarios:users,operacoes:operations,acessos:[]});
  if(u.pathname==='/api/abertura')return send({abertura:data.DETALHE.filter(r=>r.emp===q.emp&&r.mkt===q.mkt).map(r=>({k:[r.ped,r.sku,r.date,r.mkt].join('|'),pcheio:r.fat,desc:0,comis:r.fat-r.liq,tarif:0,freteC:0,imp:r.imp,afil:r.afil,pub:r.pub,ent:r.mod,ads:r.pub}))});
  if(u.pathname==='/api/demandas')return send(demands);
  if(u.pathname==='/api/tratativas'){if(req.method==='POST'){const row=demands.find(r=>r.id===input.demanda_id);if(row)row.registro={...input,em:new Date().toISOString()};histories.push({...input,registrado_em:new Date().toISOString()});return send({ok:true,demonstracao:true});}return send({registros:histories.filter(r=>r.demanda_id===q.demanda_id)});}
  if(u.pathname==='/api/alinhamentos'){if(req.method==='POST'){alignments.push({...input,id:'review-align-'+Date.now(),estado:'aberto',criado_em:new Date().toISOString()});return send({ok:true});}return send({itens:alignments,faltam:0});}
  if(u.pathname.startsWith('/api/alinhamentos/'))return send({ok:true,item:alignments[0],historico:[]});
  if(u.pathname==='/api/pendencias')return send({linhas:[{id:'review-pending-1',conta:'bsan',empresa:'Bsan Shop',canal:'Mercado Livre',gestor:'Gestor A',grupo:'Full',titulo:'Conferir necessidade de reposição',detalhe:'Exemplo de pendência da fonte, separado da tratativa de margem.',valor:4,unidade:'unidades',fonte:'painel'},{id:'review-pending-2',conta:'bsan',empresa:'Bsan Shop',canal:'Mercado Livre',gestor:'Gestor A',grupo:'Publicidade',titulo:'Conferir ACOS da conta',detalhe:'Leitura demonstrativa da campanha.',valor:18.5,unidade:'%',fonte:'painel'}],contas:[{id:'bsan',empresa:'Bsan Shop',canal:'Mercado Livre',gestor:'Gestor A'}],fontes:{full:'2026-11-16T12:00:00Z'},periodo:['2026-11-01','2026-11-16']});
  if(u.pathname==='/api/comandos')return send([]);
  if(u.pathname==='/api/gestao/estado')return send({mes:q.mes,gestores:['Gestor A','Gestor B'],operacoes:operations.map((o,i)=>({...o,gestor:owners.get(o.operacao)??o.gestor,regra:rules.get(o.operacao)||{paga:true,regra:'metas',teto:.04},comissao:data.COMISSAO.find(c=>c.operacao===o.operacao&&c.mes===q.mes)||data.COMISSAO.find(c=>c.operacao===o.operacao),fechamento:closures.get(q.mes+'|'+o.operacao)||null})),historico:ownerHistory});
  if(u.pathname==='/api/gestao/custos')return send({mes:q.mes,empresas:['Bsan Shop','Jowcase','Powerfull Imports','Ponto 1 (compartilhado)','Ponto 2 (compartilhado)'],itens:costItems});
  if(u.pathname.startsWith('/api/gestao/')){
   const action=u.pathname.split('/').at(-1),now=new Date().toISOString();
   if(action==='custo'){const saved={...input,id:input.id||'review-cost-'+Date.now(),valor:+input.valor,valor_mes:+input.valor,status:'confirmado'};const old=costItems.find(i=>i.id===saved.id);if(old)Object.assign(old,saved);else costItems.push(saved);}
   if(action==='custo-mes'){const old=costItems.find(i=>i.id===input.custo_id);if(old)Object.assign(old,{valor_mes:+input.valor,status:'confirmado'});}
   if(action==='regra')rules.set(input.operacao,{...(rules.get(input.operacao)||{}),...input});
   if(action==='fechar')for(const op of input.operacoes||[]){const c=data.COMISSAO.find(c=>c.operacao===op&&c.mes===input.mes);closures.set(input.mes+'|'+op,{fechado_em:now,bonus_rs:c?.bonus_final_rs||0,por:'Revisão local'});}
   if(action==='reabrir')closures.delete(input.mes+'|'+input.operacao);
   if(action==='pagar')for(const op of input.operacoes||[]){const row=closures.get(input.mes+'|'+op);if(row)row.pago_em=input.pago_em;}
   if(action==='carteira'){const op=input.empresa+' · '+input.marketplace;owners.set(op,input.gestor);ownerHistory.push({...input,por:'Revisão local',em:now});}
   return send({ok:true,demonstracao:true,meses:[input.mes||'2026-11'],aviso:'Alteração registrada apenas na prévia em memória.'});
  }
  if(u.pathname==='/api/pos-venda/config')return send(config());
  if(u.pathname==='/api/pos-venda/atendimentos'){
   if(req.method==='POST'){const row={...input,id:input.id||'review-pv-'+Date.now(),versao:1,data_abertura:'2026-11-17'};cases.push(row);return send({atendimento:row,ok:true});}
   let rows=cases.filter(r=>(!q.estado||r.estado===q.estado)&&(!q.empresa||r.empresa===q.empresa)&&(!q.canal||r.canal===q.canal)&&(!q.tipo||r.tipo===q.tipo));
   return send({rows,total:rows.length,pagina:1,paginas:1,resumo:Object.fromEntries(Object.keys(estados).map(k=>[k,rows.filter(r=>r.estado===k).length])),indicadores:{atrasados:2,hoje:1,sem_responsavel:0,sem_prazo:0},hoje:'2026-11-17',consultado_em:new Date().toISOString()});
  }
  const pv=u.pathname.match(/^\/api\/pos-venda\/atendimentos\/([^/]+)(?:\/(contexto))?$/);if(pv){const r=cases.find(r=>r.id===pv[1]);if(!r)return send({atendimento:null,historico:[]});if(pv[2])return send({disponivel:true,encontrado:true,itens:[{data:r.data_abertura,sku:r.sku,titulo:r.titulo,situacao:'Venda',unidades:1}],consultado_em:new Date().toISOString()});if(req.method==='POST')Object.assign(r,input,{versao:r.versao+1});return send({ok:true,atendimento:r,historico:[{ator_nome:'Revisão',criado_em:'2026-11-10T12:00:00Z',acao:'abertura',comentario:'Caso fictício de revisão.',versao:1,dados:{}}]});}
  missing.push({method:req.method,path:u.pathname});json(res,{erro:'Contrato ainda não atendido na revisão: '+u.pathname},404);return true;
 }
 return{handle,service,store,missing,close:()=>store.close()};
}
module.exports={createApi};
