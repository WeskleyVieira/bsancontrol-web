(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BCAcompanhamentoModelo=factory();})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const num=v=>v==null||v===''||!Number.isFinite(Number(v))?null:Number(v),time=v=>v?Number.isFinite(Date.parse(v))?Date.parse(v):null:null;
 const registered=i=>!!(i.registro?.acao||i.trat||i.estado==='trat');
 const sub=i=>/^promo(?:\|| ·)/i.test(String(i.id||''))||/^promo ·/i.test(String(i.tipo||''))?'promos':/^ads(?:\|| ·)/i.test(String(i.id||''))||/^ads ·/i.test(String(i.tipo||''))?'ads':'tarefas';
 const defaults={prejuizo:1,devolucao:2,margem:1,queima:1,maturacao:2,promo_sangra:2,promo_preco:2,promo_encareceu:2,ads_pausar:2,ads_mover:2,ads_subir:2,ads_campanha:2,ads_baixar:2};
 function kind(i){const t=String(i.tipo||'');return /execução falhou/i.test(t)?'promo_execucao':/promo · sangra/i.test(t)?'promo_sangra':/promo · preço/i.test(t)?'promo_preco':/promo · encareceu/i.test(t)?'promo_encareceu':/ads · pausar an/i.test(t)?'ads_pausar':/ads · mover/i.test(t)?'ads_mover':/ads · subir/i.test(t)?'ads_subir':/ads · pausar camp/i.test(t)?'ads_campanha':/ads · baixar/i.test(t)?'ads_baixar':/preju/i.test(t)?'prejuizo':/devolu/i.test(t)?'devolucao':/corre.*margem/i.test(t)?'margem':/queima|morto/i.test(t)?'queima':/matura/i.test(t)?'maturacao':'outro';}
 function deadline(i,now=Date.now()){
  const p=num(i.prazo),days=p!=null&&p>=0?p:(defaults[kind(i)]??7),created=time(i.criado_em),reg=registered(i),reaction=num(i.reacaoH),due=created==null?null:created+days*864e5;
  const elapsed=reg?reaction:created==null?null:(now-created)/36e5;
  return {days,fallback:p==null||p<0,created,due,started:created!=null&&created<=now,overdue:!reg&&due!=null&&due<now,soon:!reg&&created!=null&&created<=now&&due>=now&&due-now<864e5,unknown:created==null,delay:!reg&&due!=null?Math.max(0,(now-due)/864e5):0,onTime:reg&&elapsed!=null&&elapsed>=0?elapsed<=days*24:null};
 }
 function fresh(e,i){const r=time(i.registro?.em),t=time(e?.em);return r!=null&&t!=null&&t>=r;}
 function outcome(i){const r=i.resultado;if(!r||!r.desfecho)return {state:'awaiting',label:'Sem medição após a ação',measured:false,stale:false};
  if(!fresh(r,i))return{state:'awaiting',label:time(r.em)==null||time(i.registro?.em)==null?'Medição sem data comparável':'Medição anterior à última ação',measured:false,stale:true};
  const t=String(r.desfecho),state=/parcial/i.test(t)?'partial':/^Resolvido$/i.test(t)?'resolved':/^Progrediu$/i.test(t)?'progress':/^Justificado$/i.test(t)?'justified':/Sem efeito|Piorou|Parou de vender/i.test(t)?'negative':/Sem venda|Sem leitura|Pausado|Aguardando/i.test(t)?'awaiting':'other';
  return {state,label:t,measured:['resolved','progress','justified','negative'].includes(state),stale:false,value:r};
 }
 function review(i,now=Date.now()){
  if(!registered(i)||i.estado==='fora'||i.estado==='aguardando')return null;
  const g=i.registro||{},v=i.validacao,r=outcome(i),c=i.checagem,reg=time(g.em);
  if(v?.veredito==='fora'&&fresh(v,i))return 'Revalidação do plano: '+(v.motivo||'ação fora do critério')+(v.sugestao?' · '+v.sugestao:'');
  if(['resolved','progress','justified'].includes(r.state))return null;
  if(c&&fresh(c,i)&&reg!=null&&now-reg>864e5&&/promoção derruba|não aplicado/i.test(c.situacao||''))return 'Conferência de preço: '+c.situacao;
  if(r.value?.aplicou==='não')return 'A medição indica preço informado não aplicado';
  if(r.state==='negative'||(r.state==='partial'&&/abaixo/i.test(r.label)))return 'Medição do plano: '+r.label+(r.state==='partial'?' · leitura parcial':'');
  if(/aguardando/i.test(g.acao||'')&&reg!=null){const day=String(g.ate||''),limit=/^\d{4}-\d{2}-\d{2}$/.test(day)?time(day+'T23:59:59-03:00'):reg+3*864e5;if(limit!=null&&now>limit)return 'Prazo de retorno informado venceu'+(g.ate?' em '+g.ate:' · sem data, regra de 3 dias');}
  return null;
 }
 function row(i,now=Date.now()){
  const reg=registered(i),d=deadline(i,now),r=outcome(i),reason=review(i,now),outside=i.estado==='fora',obs=i.estado==='aguardando';
  const state=obs?'observation':outside?'outside':!reg?'pending':reason?'review':r.state==='resolved'?'resolved':r.state==='progress'?'progress':r.state==='justified'?'justified':'awaiting';
  const labels={observation:'Em observação',outside:'Fora da régua atual',pending:'Sem registro',review:'Revisar ação',resolved:'Resolvido na medição',progress:'Progrediu na medição',justified:'Justificado na medição',awaiting:'Aguardando medição'};
  const risk=num(i.risco),priority=(Math.max(0,risk??0))*Math.max(1,d.delay);
  return {item:i,id:String(i.id||''),sub:sub(i),kind:kind(i),reg,deadline:d,result:r,reason,state,label:labels[state],risk,priority,active:!outside&&!obs};
 }
 function summary(rows){const active=rows.filter(r=>r.active),reg=active.filter(r=>r.reg),timed=reg.filter(r=>r.deadline.onTime!=null),measured=reg.filter(r=>r.result.measured),count=state=>active.filter(r=>r.state===state).length;return {total:active.length,registered:reg.length,pending:count('pending'),overdue:active.filter(r=>r.deadline.overdue).length,soon:active.filter(r=>r.deadline.soon).length,review:count('review'),awaiting:count('awaiting'),resolved:measured.filter(r=>r.result.state==='resolved').length,progress:measured.filter(r=>r.result.state==='progress').length,justified:measured.filter(r=>r.result.state==='justified').length,measured:measured.length,negative:measured.filter(r=>r.result.state==='negative').length,observations:rows.filter(r=>r.state==='observation').length,outside:rows.filter(r=>r.state==='outside').length,unknownDeadline:active.filter(r=>!r.reg&&r.deadline.unknown).length,onTime:timed.filter(r=>r.deadline.onTime).length,timed:timed.length,registrationRate:active.length?reg.length/active.length*100:null,onTimeRate:timed.length?timed.filter(r=>r.deadline.onTime).length/timed.length*100:null};}
 function select(rows,{search='',status='all',type='',operation='',gestor='',order='priority'}={}){const q=String(search).trim().toLocaleLowerCase('pt-BR');let out=rows.filter(r=>(!q||[r.id,r.item.titulo,r.item.sku,r.item.anuncio,r.item.tipo,r.item.gestor,r.item.causa].join(' ').toLocaleLowerCase('pt-BR').includes(q))&&(!type||r.kind===type)&&(!operation||r.item.empresa+' · '+r.item.mkt===operation)&&(!gestor||r.item.gestor===gestor)&& (status==='all'?r.active:status==='overdue'?r.active&&r.deadline.overdue:status==='soon'?r.active&&r.deadline.soon:status==='measured'?r.active&&r.reg&&r.result.measured:status==='registered'?r.active&&r.reg:status==='ontime'?r.active&&r.reg&&r.deadline.onTime===true:['resolved','progress','justified'].includes(status)?r.active&&r.reg&&r.result.state===status:r.state===status));
  const rank=r=>r.state==='review'?0:r.deadline.overdue?1:r.deadline.soon?2:r.state==='pending'?3:r.state==='awaiting'?4:5;
  return out.sort((a,b)=>order==='oldest'?(a.deadline.created??Infinity)-(b.deadline.created??Infinity):order==='reference'?(b.risk??-Infinity)-(a.risk??-Infinity):order==='recent'?(time(b.item.registro?.em)??0)-(time(a.item.registro?.em)??0):rank(a)-rank(b)||b.priority-a.priority||a.id.localeCompare(b.id));
 }
 const ownerKey=i=>i.gestor||'__sem_responsavel__',ownerLabel=k=>k==='__sem_responsavel__'?'Sem responsável':k,operationKey=i=>i.empresa+' · '+i.mkt;
 // O contexto governa cartões, quadros, contadores e exportação. Busca e situação só refinam a lista.
 function contextRows(rows,{gestor='',operation='',type=''}={}){return rows.filter(r=>(!gestor||ownerKey(r.item)===gestor)&&(!operation||operationKey(r.item)===operation)&&(!type||r.kind===type));}
 function compare(rows,dim='gestor'){const map=new Map();for(const r of rows){const k=dim==='operation'?operationKey(r.item):ownerKey(r.item);if(!map.has(k))map.set(k,[]);map.get(k).push(r);}return [...map].map(([key,items])=>{const overdue=items.filter(r=>r.active&&r.deadline.overdue),reactions=items.filter(r=>r.active&&r.reg&&num(r.item.reacaoH)!=null&&num(r.item.reacaoH)>=0),next=select(items).find(r=>r.state==='review'||r.state==='pending');return{key,label:dim==='operation'?key:ownerLabel(key),items,...summary(items),operations:new Set(items.filter(r=>r.active).map(r=>operationKey(r.item))).size,oldestOverdue:overdue.length?Math.max(...overdue.map(r=>r.deadline.delay)):null,meanReaction:reactions.length?reactions.reduce((n,r)=>n+num(r.item.reacaoH),0)/reactions.length:null,next:next||null};}).sort((a,b)=>b.overdue-a.overdue||b.review-a.review||a.label.localeCompare(b.label));}
 function matrix(rows){const active=rows.filter(r=>r.active),owners=compare(active),types=[...new Set(active.map(r=>r.kind))].sort();return{owners,types:types.map(kind=>{const items=active.filter(r=>r.kind===kind);return{kind,summary:summary(items),cells:owners.map(owner=>({key:owner.key,summary:summary(items.filter(r=>ownerKey(r.item)===owner.key))}))};}),summary:summary(active)};}
 const statusOptions=[['all','Fila ativa completa'],['pending','Sem registro'],['overdue','Atrasadas sem registro'],['soon','Vencem em 24 horas'],['review','Revisar ação'],['awaiting','Aguardando medição'],['registered','Com registro'],['ontime','Primeiro registro no prazo'],['measured','Com medição conclusiva'],['resolved','Resolvido na medição'],['progress','Progrediu na medição'],['justified','Justificado na medição'],['observation','Em observação'],['outside','Fora da régua atual']];
 return {num,time,registered,sub,kind,deadline,fresh,outcome,review,row,summary,select,compare,matrix,contextRows,ownerKey,ownerLabel,operationKey,statusOptions};
});
