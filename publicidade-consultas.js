'use strict';
const M=require('./publicidade-leitura-modelo'),A=require('./acessos'),Margens=require('./margens-consultas');
const error=(text,status=400)=>Object.assign(Error(text),{status});
const names=['ads','adsCamp','adsDia','afiliadosFonte','afiliadosDia','comissaoDet','comissao','publicidadeMetas'];
function validate(q){
 const date=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
 if(!date(q.de)||!date(q.ate)||q.de>q.ate||Date.parse(q.ate)-Date.parse(q.de)>1098*864e5)throw error('Informe um período válido de até três anos.');
 if(q.ponto&&!['Bsan','Powerfull'].includes(q.ponto)||[q.emp,q.mkt].some(v=>v&&String(v).length>150))throw error('Escopo de publicidade inválido.');
 if(q.ops){let list;try{list=JSON.parse(q.ops);}catch(_){throw error('Carteira inválida.');}if(!Array.isArray(list)||!list.length||list.length>100||list.some(r=>!Array.isArray(r)||r.length!==2||r.some(v=>typeof v!=='string'||!v||v.length>150)))throw error('Carteira inválida.');}
}
function authorize(user){if(!A.pode(user,'gestao.ver'))throw error('Seu acesso não permite consultar publicidade.',403);}
async function carregar(db,q={},user){
 authorize(user);validate(q);
 const args=[],where=[];
 if(q.ponto){where.push('v.ponto=?');args.push(q.ponto);}
 if(q.emp){where.push('v.empresa=?');args.push(q.emp);}
 if(q.mkt){where.push('v.canal=?');args.push(q.mkt);}
 if(q.ops){const list=JSON.parse(q.ops);where.push('('+list.map(()=>'(v.empresa=? AND v.canal=?)').join(' OR ')+')');args.push(...list.flat());}
 if(user.perfil==='gestor'){where.push('EXISTS(SELECT 1 FROM operacoes o WHERE o.empresa=v.empresa AND o.marketplace=v.canal AND o.gestor=?)');args.push(user.gestor_ref||'');if(!user.gestor_ref)where.push('1=0');}
 const ops=await db.all('SELECT DISTINCT v.empresa AS emp,v.canal AS mkt FROM vendas v WHERE '+(where.join(' AND ')||'1=1'),args),allowed=new Set(ops.map(r=>M.key(r.emp,r.mkt,'')));
 const money=k=>`COALESCE(v.${k}_n,CAST(NULLIF(TRIM(CAST(v.${k} AS TEXT)),'') AS NUMERIC))`,sum=k=>`SUM(CAST(COALESCE(${money(k)},0) AS DOUBLE PRECISION))`;
 const scope=where.length?' AND '+where.join(' AND '):'';
 const [rows,raw,marginResult,pointRows]=await Promise.all([
  db.all(`SELECT v.data AS date,v.empresa AS emp,v.canal AS mkt,${sum('receita')} AS fat,${sum('publicidade')} AS pub,${sum('afiliados')} AS afil,SUM(CASE WHEN ${money('publicidade')} IS NULL THEN 1 ELSE 0 END) AS "pubMissing",SUM(CASE WHEN ${money('afiliados')} IS NULL THEN 1 ELSE 0 END) AS "afilMissing" FROM vendas v WHERE v.data>=? AND v.data<=? AND LOWER(TRIM(v.status)) IN ('venda','venda_com_troca')${scope} GROUP BY v.data,v.empresa,v.canal ORDER BY v.data LIMIT 50001`,[q.de,q.ate,...args]),
  db.all("SELECT nome,json,atualizado FROM datasets WHERE nome IN ('"+names.join("','")+"')"),
  q.ops?Promise.resolve({value:null}):Margens.carregar(db,{...q,carteira:'1'},user).then(v=>({value:v.resumo})).catch(()=>({value:null,error:'Composição da margem indisponível; as fontes de publicidade continuam independentes.'})),
  q.ponto?db.all('SELECT DISTINCT v.empresa AS emp,v.canal AS mkt,v.ponto FROM vendas v WHERE '+(where.slice(1).join(' AND ')||'1=1'),args.slice(1)):Promise.resolve([])
 ]);
 if(rows.length>50000)throw error('Selecione um período menor.',422);
 const sources={},versions={},warnings=[],pointSets=new Map();let goalStore={version:0,revisions:[]};for(const r of pointRows){const k=M.key(r.emp,r.mkt,'');if(!pointSets.has(k))pointSets.set(k,new Set());pointSets.get(k).add(r.ponto||'não informado');}const ambiguous=new Set([...pointSets].filter(([,ps])=>ps.size>1).map(([k])=>k));
 if(ambiguous.size)warnings.push('Há operação com vendas em mais de um ponto. Relatórios sem identificação de ponto não foram atribuídos integralmente a um ponto; confira a origem antes de consolidar.');
 for(const r of raw){versions[r.nome]=r.atualizado||null;try{const value=JSON.parse(r.json);if(r.nome==='publicidadeMetas'){if(!Number.isInteger(value.version)||!Array.isArray(value.revisions))throw Error();goalStore=value;continue;}if(!Array.isArray(value))throw Error();sources[r.nome]=value.filter(r=>{const o=M.operation(r),k=M.key(o.emp,o.mkt,'');return allowed.has(k)&&(!q.ponto||(r.ponto?r.ponto===q.ponto:!ambiguous.has(k)));});}catch(_){warnings.push('Fonte '+r.nome+' inválida; nenhum zero foi presumido.');}}
 if(marginResult.error)warnings.push(marginResult.error);
 const goals=goalStore.revisions.filter(g=>allowed.has(M.key(g.emp,g.mkt,'')));
 // Margens não possui o filtro opcional de seleção de operações. Não exibir margem de outro conjunto.
 const selectedMargin=q.ops?null:marginResult.value;
 return{...M.model({q,rows,sources,margin:selectedMargin,goals,scopeOps:ops}),fontes:versions,avisos:warnings,metasVersao:goalStore.version,podeEditarMetas:user.perfil==='direcao',consultadoEm:new Date().toISOString()};
}
async function salvarMeta(db,input,user){
 authorize(user);if(user.perfil!=='direcao')throw error('Somente a Direção define estas metas.',403);
 const {emp,mkt,mes,version}=input;if(!emp||!mkt||typeof emp!=='string'||typeof mkt!=='string'||emp.length>150||mkt.length>150||!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes||'')||!Number.isInteger(version)||version<0)throw error('Operação, competência ou versão inválida.');
 const values={};for(const k of ['midiaBudget','midiaCeiling','afiliadosBudget']){const v=input[k];if(v===null||v===undefined||v==='')values[k]=null;else if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>(k==='midiaCeiling'?100:1e9))throw error('Informe limites válidos.');else values[k]=M.money(v);}
 if(!await db.get('SELECT empresa FROM operacoes WHERE empresa=? AND marketplace=?',[emp,mkt]))throw error('Operação não encontrada.',404);
 const old=await db.get("SELECT json FROM datasets WHERE nome='publicidadeMetas'");let store={version:0,revisions:[]};try{if(old)store=JSON.parse(old.json);if(!Number.isInteger(store.version)||!Array.isArray(store.revisions))throw Error();}catch(_){throw error('Histórico de metas inválido. Nenhum registro foi alterado.',503);}
 if(store.version!==version)throw error('As metas mudaram. Atualize a leitura antes de salvar.',409);
 const revision={emp,mkt,mes,...values,revision:version+1,atualizadoEm:new Date().toISOString(),autorId:user.id};
 const next=JSON.stringify({version:version+1,revisions:[...store.revisions,revision]});
 const saved=old?await db.get("UPDATE datasets SET json=?,atualizado=? WHERE nome='publicidadeMetas' AND json=? RETURNING nome",[next,revision.atualizadoEm,old.json]):await db.get("INSERT INTO datasets(nome,json,atualizado) VALUES('publicidadeMetas',?,?) ON CONFLICT(nome) DO NOTHING RETURNING nome",[next,revision.atualizadoEm]);
 if(!saved)throw error('Outra pessoa salvou metas neste momento. Atualize antes de salvar.',409);
 return{ok:true,version:version+1,meta:revision,nota:'Meta operacional independente. Não altera a comissão nem os objetivos consolidados existentes.'};
}
module.exports={carregar,salvarMeta,validate};
