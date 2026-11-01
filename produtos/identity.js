"use strict";
const D=require('./domain'),crypto=require('node:crypto'),{pagination,term}=require('./query');
const fingerprint=p=>crypto.createHash('sha256').update(JSON.stringify([p.id,p.ponto,p.sku,p.nome,p.tipo,p.gtin,p.tipo_variacao])).digest('hex');
const pair=(a,b)=>[a,b].sort();
function current(r,a,b){const ordered=pair(a.id,b.id),left=ordered[0]===a.id?a:b,right=ordered[1]===b.id?b:a;return r.assinatura_a===fingerprint(left)&&r.assinatura_b===fingerprint(right);}
function checkGraph(edges,products,a,b,state){if(state==='revogada')return;
 const active=edges.filter(e=>!(e.produto_a===a&&e.produto_b===b)&&products.has(e.produto_a)&&products.has(e.produto_b)&&current(e,products.get(e.produto_a),products.get(e.produto_b))),adj=new Map();
 for(const e of active.filter(e=>e.estado==='mesmo_produto'))for(const [x,y] of [[e.produto_a,e.produto_b],[e.produto_b,e.produto_a]]){if(!adj.has(x))adj.set(x,[]);adj.get(x).push(y);}
 function component(id){const found=new Set([id]),queue=[id];for(let i=0;i<queue.length;i++)for(const n of adj.get(queue[i])||[])if(!found.has(n)){found.add(n);queue.push(n);}return found;}
 const ca=component(a),cb=component(b);
 if(state==='distintos'&&ca.has(b))D.fail('Há correspondências confirmadas ligando esses cadastros. Revise os vínculos existentes antes de declará-los distintos.',409);
 if(state==='mesmo_produto'&&active.some(e=>e.estado==='distintos'&&((ca.has(e.produto_a)&&cb.has(e.produto_b))||(cb.has(e.produto_a)&&ca.has(e.produto_b)))))D.fail('Esta correspondência contradiz uma decisão de produtos distintos. Revise o vínculo anterior.',409);
}
function createIdentity({acl,product,event,lockProduct}){
 async function view(db,p){const result=D.operational(p);result.assinatura=fingerprint(p);result.vinculos=await db.all('SELECT conta,erp_id FROM prd_erp WHERE produto_id=? ORDER BY conta,erp_id',[p.id]);
  const c=await db.get('SELECT total_centavos,estado,versao FROM prd_custos WHERE produto_id=? ORDER BY versao DESC LIMIT 1',[p.id]);result.custo=c?{total_centavos:c.total_centavos==null?null:Number(c.total_centavos),estado:c.estado,versao:Number(c.versao)}:null;return result;}
 return {
  async compare(db,user,pid,query={}){const cap=await acl(db,user);if(!cap.admin)D.fail('Somente direção pode conciliar cadastros.',403);const p=await product(db,cap,pid),{page,pageSize}=pagination(query),args=[p.ponto,p.id];
   let where='p.ponto=? AND p.id<>?';if(D.text(query.q)){where+=' AND (UPPER(p.sku) LIKE ? OR UPPER(p.nome) LIKE ? OR p.gtin LIKE ?)';args.push(term(query.q),term(query.q),term(query.q));}
   else{where+=" AND ((p.sku_chave=? AND p.sku_chave<>'') OR (p.gtin=? AND p.gtin IS NOT NULL AND p.gtin<>''))";args.push(p.sku_chave,p.gtin);}
   const total=Number((await db.get('SELECT COUNT(*) AS n FROM prd_produtos p WHERE '+where,args)).n),rows=await db.all('SELECT p.* FROM prd_produtos p WHERE '+where+' ORDER BY p.nome,p.id LIMIT ? OFFSET ?',[...args,pageSize,(page-1)*pageSize]),items=[];
   for(const r of rows){const [a,b]=pair(pid,r.id),relation=await db.get('SELECT * FROM prd_equivalencias WHERE produto_a=? AND produto_b=?',[a,b]);items.push({...await view(db,r),evidencias:[...(r.sku_chave&&r.sku_chave===p.sku_chave?['SKU igual']:[]),...(r.gtin&&r.gtin===p.gtin?['GTIN igual']:[])],
    relacao:relation?{estado:current(relation,p,r)?relation.estado:'revisao_necessaria',versao:Number(relation.versao),observacao:relation.observacao}:null});}
   return {produto:await view(db,p),items,total,page,pageSize};
  },
  async decide(db,user,pid,input){const cap=await acl(db,user);if(!cap.admin)D.fail('Somente direção pode conciliar cadastros.',403);const other=D.text(input.produto_id,100);if(!other||other===pid)D.fail('Selecione outro cadastro.');
   const state=input.estado;if(!['mesmo_produto','distintos','revogada'].includes(state))D.fail('Decisão inválida.');const note=D.text(input.observacao,1000);if(note.length<5)D.fail('Registre o motivo da decisão.');
   const [a,b]=pair(pid,other),p=await product(db,cap,pid),q=await product(db,cap,other);if(p.ponto!==q.ponto)D.fail('Concilie cadastros do mesmo ponto.',403);
   return db.transaction(async tx=>{if(tx.kind==='postgres')await tx.get('SELECT pg_advisory_xact_lock(482602,?)',[p.ponto==='Bsan'?1:2]);for(const id of [a,b])await lockProduct(tx,id);
    const fresh=await product(tx,cap,pid),candidate=await product(tx,cap,other);if(input.assinatura!==fingerprint(fresh)||input.assinatura_candidato!==fingerprint(candidate))D.fail('O cadastro mudou. Atualize a comparação antes de decidir.',409);
    const previous=await tx.get('SELECT * FROM prd_equivalencias WHERE produto_a=? AND produto_b=?',[a,b]),version=Number(previous?.versao||0);if(!Number.isInteger(input.expectedVersion)||input.expectedVersion!==version)D.fail('A decisão mudou. Atualize a comparação.',409);
    const products=new Map((await tx.all('SELECT id,ponto,sku,nome,tipo,gtin,tipo_variacao FROM prd_produtos WHERE ponto=?',[p.ponto])).map(r=>[r.id,r]));
    checkGraph(await tx.all("SELECT * FROM prd_equivalencias WHERE estado<>'revogada'"),products,a,b,state);
    const left=products.get(a),right=products.get(b);await tx.run(`INSERT INTO prd_equivalencias(produto_a,produto_b,estado,versao,assinatura_a,assinatura_b,observacao,ator_id,atualizado_em) VALUES(?,?,?,?,?,?,?,?,?)
      ON CONFLICT(produto_a,produto_b) DO UPDATE SET estado=EXCLUDED.estado,versao=EXCLUDED.versao,assinatura_a=EXCLUDED.assinatura_a,assinatura_b=EXCLUDED.assinatura_b,observacao=EXCLUDED.observacao,ator_id=EXCLUDED.ator_id,atualizado_em=EXCLUDED.atualizado_em`,[a,b,state,version+1,fingerprint(left),fingerprint(right),note,String(user.id),D.now()]);
    for(const id of [a,b])await event(tx,id,user.id,'correspondencia_conferida',{produto_a:a,produto_b:b,estado:state,versao:version+1,observacao:note});return {ok:true,versao:version+1};});
  },
  async relations(db,cap,p){const items=[];for(const r of await db.all("SELECT * FROM prd_equivalencias WHERE (produto_a=? OR produto_b=?) AND estado='mesmo_produto'",[p.id,p.id])){const other=await db.get('SELECT * FROM prd_produtos WHERE id=?',[r.produto_a===p.id?r.produto_b:r.produto_a]);
    if(other&&cap.pontos.includes(other.ponto)&&current(r,p,other))items.push({id:other.id,sku:other.sku,nome:other.nome,ponto:other.ponto,vinculos:await db.all('SELECT conta,erp_id FROM prd_erp WHERE produto_id=?',[other.id])});}return items;}
 };
}
module.exports={createIdentity,fingerprint,checkGraph};
