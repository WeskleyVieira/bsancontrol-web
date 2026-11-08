(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BCGerencialModelo=api;})(typeof window==='object'?window:this,function(){
 'use strict';const n=v=>Number(v)||0,cent=v=>Math.round(n(v)*100),money=v=>Math.round(n(v)*100)/100,ratio=(a,b)=>b?100*a/b:null;
 const affiliate=r=>/afiliad|\bCVAF\b/i.test(String(r.fonte||'')+' '+String(r.campanha||'')),fin=r=>['venda','venda_com_troca'].includes(String(r.stat||'')),inside=(r,a,b)=>String(r.date||'')>=a&&String(r.date||'')<=b;
 // Mesmos fatores de pró-rata já usados pelo painel; a origem é separada ANTES de agrupar IDs.
 function publicidade({ads=[],camp=[],dia=[],emp,mkt,from,to,fatores={inv:()=>1,rec:()=>1},key=id=>String(id||'').trim().toUpperCase()}){
  const scoped=r=>r.emp===emp&&r.mkt===mkt&&String(r.comp||'').slice(0,7)>=from.slice(0,7)&&String(r.comp||'').slice(0,7)<=to.slice(0,7),items=new Map(),campaigns=new Map();let afiliados=0,afiliadosReceita=0,semId=0,paidRecords=0,affiliateRecords=0;
  for(const r of ads.filter(scoped)){const mes=String(r.comp).slice(0,7),fi=fatores.inv(r.campanha,mes),fr=fatores.rec(r.campanha,mes);if(affiliate(r)){affiliateRecords++;afiliados+=n(r.inv)*fi;afiliadosReceita+=n(r.recAds)*fr;continue;}paidRecords++;let id=key(r.anuncio);if(!id){semId++;id='sem-id:'+semId;}const o=items.get(id)||{id,titulo:String(r.tit||id),campanha:String(r.campanha||''),inv:0,rec:0,impr:0,cli:0,vendas:0,vis:0};o.inv+=n(r.inv)*fi;o.rec+=n(r.recAds)*fr;o.impr+=n(r.impr)*fi;o.cli+=n(r.cli)*fi;o.vendas+=(n(r.vd)+n(r.vi))*fr;o.vis=Math.max(o.vis,n(r.vis));items.set(id,o);}
  for(const r of camp.filter(scoped)){if(affiliate(r))continue;paidRecords++;const mes=String(r.comp).slice(0,7),fi=fatores.inv(r.campanha,mes),fr=fatores.rec(r.campanha,mes),id=String(r.campanha||'Sem campanha'),o=campaigns.get(id)||{id,titulo:id,inv:0,rec:0,impr:0,cli:0,vendas:0,status:'',orc:null,obj:null,perdOrc:0,perdCls:0,peso:0};o.inv+=n(r.inv)*fi;o.rec+=n(r.rec)*fr;o.impr+=n(r.impr)*fi;o.cli+=n(r.cli)*fi;o.vendas+=n(r.vatr)*fr;o.status=String(r.status||o.status);if(r.orc!=null)o.orc=n(r.orc);if(r.obj!=null)o.obj=n(r.obj);o.perdOrc+=n(r.perdOrc)*n(r.impr)*fi;o.perdCls+=n(r.perdCls)*n(r.impr)*fi;o.peso+=n(r.impr)*fi;campaigns.set(id,o);}
  const enrich=o=>({...o,acos:ratio(o.inv,o.rec),roas:o.inv?o.rec/o.inv:null,ctr:ratio(o.cli,o.impr),cvr:ratio(o.vendas,o.cli),cpc:o.cli?o.inv/o.cli:null,perdOrc:o.peso?o.perdOrc/o.peso:null,perdCls:o.peso?o.perdCls/o.peso:null}),anuncios=[...items.values()].map(enrich),campanhas=[...campaigns.values()].map(enrich),sum=(a,k)=>a.reduce((s,o)=>s+n(o[k]),0),ivA=sum(anuncios,'inv'),ivC=sum(campanhas,'inv'),recA=sum(anuncios,'rec'),recC=sum(campanhas,'rec');
  const daily=new Map();for(const r of dia){if(r.emp!==emp||r.mkt!==mkt||affiliate(r)||String(r.data)<from||String(r.data)>to)continue;const d=String(r.data).slice(0,10),o=daily.get(d)||{date:d,inv:0,rec:0};o.inv+=n(r.inv);o.rec+=n(r.rec);daily.set(d,o);}
  const inv=money(Math.max(ivA,ivC)),rec=money(Math.max(recA,recC));return{anuncios,campanhas,paidRecords,affiliateRecords,inv,rec,acos:ratio(inv,rec),roas:inv?rec/inv:null,afiliados:money(afiliados),afiliadosReceita:money(afiliadosReceita),semId,serie:[...daily.values()].sort((a,b)=>a.date.localeCompare(b.date)).map(o=>({...o,roas:o.inv>0?o.rec/o.inv:null}))};
 }
 function grupos(rows,{modo='anuncio',index=[],keyVenda=r=>String(r.anuncio||'').trim().toUpperCase(),base=(m,f,l)=>/temu/i.test(m)?l:f,jaNoLiquido=false}={}){
  const map=new Map(),join=new Map();let semIdentificacao=0,receitaSemIdentificacao=0;
  for(const r of rows.filter(fin)){const ad=String(r.anuncio||'').trim(),sku=String(r.sku||'').trim(),id=modo==='sku'?sku:(ad||sku),k=modo+':'+id;if(!id){semIdentificacao++;receitaSemIdentificacao+=cent(r.fat);continue;}const o=map.get(k)||{key:k,id,emp:r.emp,mkt:r.mkt,adsKey:keyVenda(r),anuncio:ad,sku,titulo:String(r.tit||sku||ad),fatC:0,liqC:0,mcC:0,ctpC:0,ctpKnown:true,pubKnown:true,qtd:0,inv:0,rec:0,pubC:0,afilC:0,rateado:false,adsVinculado:false,linhas:0,skus:[],anuncios:[]};if(ad&&!o.anuncios.includes(ad))o.anuncios.push(ad);if(sku&&!o.skus.includes(sku))o.skus.push(sku);for(const[a,b]of [['fatC','fat'],['liqC','liq'],['mcC','mc'],['ctpC','ctp']])o[a]+=cent(r[b]);o.ctpKnown&&=r.ctp!=null&&r.ctp!=='';o.pubKnown&&=r.pub!=null&&r.pub!==''&&Number.isFinite(+r.pub);o.qtd+=n(r.qtd);o.pubC-=cent(r.pub);o.afilC-=cent(r.afil);o.linhas++;map.set(k,o);const ak=keyVenda(r);if(ak){if(!join.has(ak))join.set(ak,new Map());const parts=join.get(ak),p=parts.get(k)||{fat:0,qtd:0};p.fat+=n(r.fat);p.qtd+=n(r.qtd);parts.set(k,p);}}
  let semVinculo=0,totalIndex=0;for(const ad of index){totalIndex+=n(ad.inv);const parts=join.get(ad.id);if(!parts?.size){semVinculo+=n(ad.inv);continue;}const list=[...parts.entries()],fat=list.reduce((s,[,p])=>s+Math.max(0,p.fat),0),qtd=list.reduce((s,[,p])=>s+Math.max(0,p.qtd),0);let allocatedInv=0,allocatedRec=0;for(let i=0;i<list.length;i++){const[k,p]=list[i],share=fat>0?Math.max(0,p.fat)/fat:qtd>0?Math.max(0,p.qtd)/qtd:1/list.length,o=map.get(k),last=i===list.length-1,iv=last?cent(ad.inv)-allocatedInv:Math.round(cent(ad.inv)*share),rv=last?cent(ad.rec)-allocatedRec:Math.round(cent(ad.rec)*share);allocatedInv+=iv;allocatedRec+=rv;o.inv+=iv/100;o.rec+=rv/100;o.rateado||=list.length>1;o.adsVinculado=true;}}
  const items=[...map.values()].map(o=>{const fat=o.fatC/100,liq=o.liqC/100,mc=o.mcC/100,ctp=o.ctpC/100,b=base(o.mkt,fat,liq),pub=o.pubC/100,afil=o.afilC/100,inv=jaNoLiquido?pub:money(o.inv),after=money(mc-(jaNoLiquido?0:inv));return{...o,fat,liq,mc,ctp,pub,afil,base:b,inv,after,pct:ratio(mc,b),pctAfter:ratio(after,b),preco:o.qtd?fat/o.qtd:null,custo:o.qtd&&o.ctpKnown?ctp/o.qtd:null,mcUn:o.qtd?mc/o.qtd:null,acos:ratio(inv,o.rec),tacos:jaNoLiquido||o.adsVinculado?ratio(inv,fat):null,jaNoLiquido};}).sort((a,b)=>b.fat-a.fat||a.id.localeCompare(b.id));
  return{items,semIdentificacao,receitaSemIdentificacao:receitaSemIdentificacao/100,semVinculo:money(semVinculo),totalIndex:money(totalIndex),alocado:money(items.reduce((s,o)=>s+o.inv,0)),margem:money(items.reduce((s,o)=>s+o.mc,0)),after:money(items.reduce((s,o)=>s+o.after,0)),fat:money(items.reduce((s,o)=>s+o.fat,0))};
 }
 // Identificação explícita: ID sem anúncio nunca é promovido de SKU para anúncio.
 function identidadeProduto(o,modo='anuncio'){
  const unique=values=>[...new Set(values.filter(v=>v!=null).map(v=>String(v).trim()).filter(Boolean))];
  const skus=unique([...(o.skus||[]),o.sku]);
  return{titulo:String(o.titulo||o.tit||skus[0]||o.anuncio||'Item sem título'),skus,anuncios:unique(modo==='sku'?(o.anuncios||[]):[o.anuncio])};
 }
 function tomMargem(valor,percentual){if(valor==null||valor===''||!Number.isFinite(+valor))return'neutral';if(+valor<0)return'bad';if(percentual==null||percentual===''||!Number.isFinite(+percentual))return'neutral';return +percentual<10?'attention':+percentual<20?'info':'good';}
 function coberturaProduto(o){return{label:o.adsMissing?'Ads pendente':o.estimated?'Rateio estimado':'Ads apurado',tone:o.adsMissing||o.estimated?'attention':'neutral',detalhe:String(o.coverage||'Origem da publicidade não informada')};}
 function comparar(current,previous){const map=new Map(previous.map(o=>[o.key,o]));return current.map(o=>{const p=map.get(o.key);return{...o,change:p?{fat:money(o.fat-p.fat),mc:money(o.mc-p.mc),pct:o.pct!=null&&p.pct!=null?o.pct-p.pct:null}:null};});}
 // Posição por faturamento positivo, com empates em centavos: 1º, 1º, 3º.
 // O universo é definido antes de qualquer busca/filtro da apresentação.
 function rankingProdutos(items){const list=items.filter(o=>o.fat!=null&&Number.isFinite(+o.fat)&&cent(o.fat)>0).slice().sort((a,b)=>cent(b.fat)-cent(a.fat)||String(a.key).localeCompare(String(b.key))),map=new Map();let last=null,rank=0;list.forEach((o,i)=>{const value=cent(o.fat);if(value!==last)rank=i+1;map.set(o.key,rank);last=value;});return map;}
 function variacaoMargemPre(atual,anterior,{jaNoLiquido=false}={}){if(!anterior||!informado(atual.pre)||jaNoLiquido&&!informado(anterior.pre)&&(anterior.pubKnown===false||!informado(anterior.pub)))return{mc:null,pct:null};const pre=informado(anterior.pre)?+anterior.pre:informado(anterior.mc)?+anterior.mc+(jaNoLiquido?n(anterior.pub):0):null;return{mc:pre==null?null:money(atual.pre-pre),pct:pre!=null&&anterior.base>0&&informado(atual.pctPre)?atual.pctPre-100*pre/anterior.base:null};}
 function evolucaoProdutos(current,previous,{comparacao=false}={}){
  const now=rankingProdutos(current),old=rankingProdutos(previous),prior=new Map(previous.map(o=>[o.key,o])),keys=new Set(current.map(o=>o.key)),available=comparacao&&previous.length>0;
  const evolution=(o,p,absent=false)=>{const atual=absent?null:now.get(o.key)??null,anterior=available?old.get(o.key)??null:null,movimento=!comparacao?'sem-comparacao':!available?'sem-base':absent?'sem-vendas-atual':!p?'sem-vendas-ref':atual==null||anterior==null?'sem-ranking':anterior>atual?'subiu':anterior<atual?'caiu':'estavel',delta=atual!=null&&anterior!=null?anterior-atual:null,abcAnterior=available&&p?.fat>0?p.abc??null:null,abcAtual=absent?null:o.abc??null,order={A:3,B:2,C:1};
   return{movimento,posicao:atual,posicaoAnterior:anterior,deltaPosicao:delta,totalAtual:now.size,totalAnterior:available?old.size:null,abcAtual,abcAnterior,deltaCurva:order[abcAtual]!=null&&order[abcAnterior]!=null?order[abcAtual]-order[abcAnterior]:null,faturamentoAnterior:available&&p&&informado(p.fat)?p.fat:null,deltaFat:!absent&&available&&p&&informado(o.fat)&&informado(p.fat)?money(o.fat-p.fat):null,deltaFatPct:!absent&&available&&p?.fat>0&&informado(o.fat)?ratio(money(o.fat-p.fat),p.fat):null};};
  const items=current.map(o=>({...o,evolucao:evolution(o,prior.get(o.key)),posicao:now.get(o.key)??null,posicaoReferencia:available?old.get(o.key)??null:null}));
  const ausentes=available?previous.filter(p=>!keys.has(p.key)).map(p=>({...p,semVendasAtual:true,fat:null,qtd:null,mc:null,pre:null,after:null,pct:null,pctPre:null,pctAfter:null,mcUn:null,preco:null,custo:null,inv:null,rec:null,tacos:null,partFat:null,partMC:null,partQtd:null,abc:null,posicao:null,posicaoReferencia:old.get(p.key)??null,change:null,estimated:false,adsMissing:true,situacao:{key:'sem-vendas',label:'Sem vendas no atual',tone:'neutral'},sinais:{},evolucao:evolution(p,p,true)})):[];
  return{items,ausentes,comparacao,disponivel:available,totais:{subiu:items.filter(o=>o.evolucao.movimento==='subiu').length,caiu:items.filter(o=>o.evolucao.movimento==='caiu').length,estavel:items.filter(o=>o.evolucao.movimento==='estavel').length,semReferencia:items.filter(o=>o.evolucao.movimento==='sem-vendas-ref').length,semAtual:ausentes.length}};
 }
 function orientacao(o){if(o.mc<0)return 'Conferir preço, CTP e taxas: a margem já é negativa antes do Ads adicional.';if(o.after<0)return 'Conferir vínculo e gasto de mídia: o desconto do Ads vinculado torna a margem negativa.';if(o.change?.fat>0&&o.change?.mc<0)return 'Faturamento subiu e margem caiu: abrir preço, custo, taxas e mix na mesma base.';if(o.change?.mc<0)return 'Conferir volume e margem por unidade contra a referência, antes de atribuir uma causa.';if(!o.change)return 'Conferir a referência e a cobertura antes de concluir sobre evolução.';return 'Acompanhar composição, estoque e mídia; o avanço registrado não garante espaço para escalar.';}
 function diagnostico(current,previous,raw,{referencia=null}={}){
  const items=comparar(current,previous).map(o=>({...o,cenario:referencia!=null&&Number.isFinite(+referencia)&&o.base>0?money(Math.max(0,o.base*(+referencia)/100-o.after)):null}));
  const negativas=items.filter(o=>o.after<0).sort((a,b)=>a.after-b.after),quedas=items.filter(o=>o.change&&o.change.mc<0).sort((a,b)=>a.change.mc-b.change.mc),avancos=items.filter(o=>o.change&&o.change.mc>0).sort((a,b)=>b.change.mc-a.change.mc),devolvidas=raw.filter(r=>String(r.stat||'')==='devolvida');
  return{items,negativas,quedas,avancos,semReferencia:items.filter(o=>!o.change).length,margemNegativa:money(negativas.reduce((s,o)=>s+o.after,0)),devolvidas:devolvidas.length,receitaDevolvida:money(devolvidas.reduce((s,r)=>s+n(r.fat),0)),cenario:referencia==null?null:money(items.reduce((s,o)=>s+n(o.cenario),0))};
 }
 function desempenhoPublicidade(list,{operacaoPct=null,groups=[]}={}){
  const joins=new Map();for(const o of groups){const k=o.adsKey||o.anuncio;if(!k)continue;const p=joins.get(k)||{fat:0,base:0,mc:0};p.fat+=o.fat;p.base+=o.base;p.mc+=o.mc;joins.set(k,p);}
  return list.map(o=>{const v=joins.get(o.id),pct=v?.base?100*v.mc/v.base:operacaoPct,estimativa=pct!=null?money(o.rec*pct/100-o.inv):null;return{...o,margemReferencia:pct,origemMargem:v?.base?'vendas vinculadas':'média da operação',estimativa,breakEven:pct>0?100/pct:null,semReceita:o.inv>0&&o.rec===0};});
 }
 function full(rel,horizon='regra'){
  if(!rel)return null;const rows=rel.linhas||[],known=rows.filter(o=>!o.semPosicao&&o.aptas!=null),send=rows.filter(o=>!o.corte&&n(o.needH?.[horizon])>0),allocated=send.reduce((s,o)=>s+n(o.aloc?.[horizon]),0),need=send.reduce((s,o)=>s+n(o.needH?.[horizon]),0),v=rows.reduce((s,o)=>s+n(o.un31),0),fullSales=rows.reduce((s,o)=>s+(o.fullPct==null?0:n(o.un31)*n(o.fullPct)/100),0);
  return{linhas:rows.length,semPosicao:rows.length-known.length,aptas:known.length?known.reduce((s,o)=>s+n(o.aptas)+n(o.proc),0):null,cam:rows.reduce((s,o)=>s+n(o.cam),0),enviar:allocated,necessidade:need,falta:Math.max(0,need-allocated),risco:known.filter(o=>n(o.un31)>=6&&n(o.dias)<7&&o.classe!=='Não repor').length,parado:(rel.parado||[]).reduce((s,o)=>s+n(o.aptas),0),antigo:rel.antigo?.previsto??null,un31:v,fullUn31:fullSales,fullPct:v?100*fullSales/v:null,ancora:rel.ancora||null};
 }
 function csv(headers,rows){const cell=v=>{if(v&&typeof v==='object'&&Object.hasOwn(v,'number'))return v.number==null||!Number.isFinite(+v.number)?'':Number(v.number).toFixed(v.digits??2);let s=v==null?'':String(v);if(/^[\s]*[=+\-@]/.test(s)&&typeof v!=='number')s="'"+s;return /[";\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};return '\uFEFF'+[headers,...rows].map(r=>r.map(cell).join(';')).join('\r\n');}
 function pagina(rows,page=0,size=50){const pages=Math.max(1,Math.ceil(rows.length/size)),index=Math.max(0,Math.min(Math.floor(Number(page)||0),pages-1));return{page:index,pages,total:rows.length,rows:rows.slice(index*size,(index+1)*size)};}
 const informado=v=>v!=null&&v!==''&&Number.isFinite(+v);
 function situacaoBase(o){if(o.adsMissing)return{key:'ads-pendente',label:'Ads pendente',tone:'attention'};const p=o.pctAfter;if(informado(o.after)&&o.after<0||informado(p)&&p<0)return{key:'prejuizo',label:'Prejuízo',tone:'bad'};if(!informado(p))return{key:'sem-base',label:'Sem base',tone:'neutral'};if(p<10)return o.abc==='C'?{key:'peso',label:'Peso morto',tone:'attention'}:{key:'corrigir',label:'Corrigir',tone:'attention'};if(p<20)return{key:'estavel',label:'Estável',tone:'info'};return o.abc==='A'?{key:'estrela',label:'Estrela',tone:'good'}:o.abc==='B'?{key:'escalar',label:'Escalar',tone:'info'}:{key:'nicho',label:'Nicho',tone:'accent'};}
 function situacao(o){const s=situacaoBase(o);return o.estimated?{...s,label:s.label+' · estimado',tone:s.tone==='good'?'attention':s.tone}:s;}
 // A agenda e Anúncios classificam a mesma composição, sem recalcular ou descontar Ads.
 function agenda(items,{novo=()=>false}={}){
  const keys=['estanca','adscome','corrija','queima','proteja','escale','escondido','maturacao','peso','cobertura','base'],BK=Object.fromEntries(keys.map(k=>[k,[]]));
  const atual=items.map(item=>{
   const o={...item,k:item.key,tit:item.titulo,aF:item.abc,mcp:item.pctPre,mcpPos:item.pctAfter,adsInv:item.inv,adsRec:item.rec,antFat:item.change?money(item.fat-item.change.fat):null},s=situacao(o);
   o.situacao=s;o.causaPerda=s.key==='prejuizo'?(informado(o.pre)?o.pre<0?'produto':'publicidade':'a-conferir'):null;
   o.adsCabe=informado(o.pre)&&o.base>0?money(Math.max(0,o.pre-o.base*.10)):null;
   o.adsCorte=informado(o.inv)&&o.adsCabe!=null?money(Math.max(0,o.inv-o.adsCabe)):null;
   o.roasAlvo=o.adsCabe>0.01&&o.adsCabe>=.25*o.inv&&o.rec>0?o.rec/o.adsCabe:null;
   let bucket=null;
   if(s.key==='ads-pendente'||!informado(o.after))bucket='cobertura';
   else if(s.key==='prejuizo')bucket='estanca';
   else if(s.key==='sem-base')bucket='base';
   else if(o.pctAfter<10){
    if(informado(o.pctPre)&&o.pctPre>=10&&o.inv>0)bucket='adscome';
    else bucket=o.abc==='C'?(novo(o.sku)?'maturacao':'peso'):'corrija';
   }else if(sinaisProduto({...o,pct:o.pctPre}).queima){bucket='queima';o.histSaud=o.history;}
   else if(s.key==='estrela')bucket='proteja';
   else if(s.key==='escalar')bucket='escale';
   else if(s.key==='nicho')bucket='escondido';
   o.bucket=bucket;if(bucket)BK[bucket].push(o);return o;
  });
  const pot=o=>informado(o.pre)&&o.base>0?money(Math.max(0,o.base*.20-o.pre)):null;
  const qmLoss=o=>informado(o.histSaud)&&informado(o.pctPre)&&o.base>0?money(Math.max(0,o.base*(o.histSaud-o.pctPre)/100)):null;
  const sum=(list,value)=>money(list.reduce((s,o)=>s+(value(o)??0),0));
  return{atual,BK,pot,qmLoss,perdendo:atual.filter(o=>sinaisProduto(o).perdendo),ganhando:atual.filter(o=>sinaisProduto(o).ganhando),totPrej:sum(BK.estanca,o=>o.after),totPot:sum(BK.corrija,pot),totQueima:sum(BK.queima,qmLoss),totAdsCorte:sum(BK.adscome,o=>o.adsCorte)};
 }
 // Referências de priorização do modelo antigo; não alteram metas nem a fila publicada.
 function sinaisProduto(o){return{perdendo:!!o.change&&o.fat>0&&o.fat-o.change.fat>200&&o.fat<(o.fat-o.change.fat)*.7,ganhando:!!o.change&&o.fat-o.change.fat>0&&o.fat>200&&o.fat>(o.fat-o.change.fat)*1.4,queima:['A','B'].includes(o.abc)&&o.history!=null&&o.pct>=10&&o.pct<o.history-5};}
 function acaoPublicidade(o){
  if(o.inv>0&&o.rec===0)return{key:'sem-retorno',label:'Sem retorno atribuído',tone:'bad',action:'Conferir cliques, oferta e atribuição antes de ampliar o investimento.'};
  if(o.margemReferencia==null||o.estimativa==null)return{key:'conferir',label:'Conferir margem',tone:'neutral',action:'Vincular as vendas e conferir a margem de referência.'};
  if(o.estimativa<0)return{key:'queima',label:'Queimando margem',tone:'bad',action:o.margemReferencia<=0?'Rever preço e custo antes de investir mais.':'Rever lance e ROAS-alvo; ACOS acima da margem de referência.'};
  if(o.inv>0&&o.acos!=null&&o.margemReferencia>0&&o.acos<=o.margemReferencia*.5)return{key:'escala',label:'Espaço para escalar',tone:'good',action:o.perdOrc>=20?'Conferir estoque e conversão; há perda por orçamento.':o.perdCls>=20?'Conferir classificação, oferta e ROAS-alvo antes de ampliar.':'Testar aumento gradual com estoque e margem acompanhados.'};
  return{key:'manter',label:'Manter e acompanhar',tone:'info',action:'Acompanhar ACOS, margem e volume no mesmo período.'};
 }
 function revisaoProduto(o){let key='acompanhar',titulo='Acompanhar resultado e oportunidades',tone='info',passos=['Conferir preço, custo por unidade e publicidade no mesmo período.','Usar o Raio-X para verificar o histórico e comparar as operações.'];
  if(o.semVendasAtual){key='continuidade';titulo='Investigar ausência de vendas';tone='attention';passos=['Conferir disponibilidade, anúncio, preço e vínculo do SKU.','Comparar o período no Raio-X antes de atribuir a queda a estoque, pausa ou falta de procura.'];}
  else if(informado(o.pre)&&o.pre<0){key='produto';titulo='Rever preço, custo e taxas';tone='bad';passos=['A contribuição já é negativa antes da publicidade. Conferir preço praticado, custo, taxas, descontos e embalagem.','Conferir também o gasto de publicidade e registrar a análise na tratativa existente.'];}
  else if(o.adsMissing||!informado(o.after)||!informado(o.pre)){key='fonte';titulo='Completar a leitura de margem';tone='attention';passos=['Conferir a fonte de publicidade e o vínculo do anúncio/SKU.','Aguardar a composição Pós-Ads antes de decidir sobre rentabilidade ou ampliação de investimento.'];}
  else if(o.after<0){key='publicidade';titulo='Rever publicidade e oferta';tone='bad';passos=['A contribuição fica negativa depois da publicidade atribuída. Conferir gasto, vínculo e conversão.','Avaliar lance, ROAS-alvo e oferta com o responsável; a orientação não executa pausa nem mudança de orçamento.'];}
  else if(o.pctAfter<10&&o.pctPre>=10&&o.inv>0){key='ads-reduz';titulo='Conferir pressão da publicidade';tone='attention';passos=['A contribuição continua positiva, mas a publicidade reduz a margem para menos de 10% do modelo. Conferir vínculo e gasto.','Avaliar oferta, conversão e ROAS-alvo com o responsável, considerando as metas oficiais.'];}
  else if(informado(o.pctAfter)&&o.pctAfter<10){key='margem';titulo='Revisar margem por unidade';tone='attention';passos=['Conferir preço, custo, taxas e publicidade: a margem Pós-Ads está abaixo da faixa de 10% do modelo.','Comparar a oferta e o custo por unidade no Raio-X; o objetivo oficial continua em Metas.'];}
  else if(o.bucket==='queima'||o.sinais?.queima){key='historico';titulo='Investigar redução da margem';tone='attention';passos=['Comparar preço, custo e descontos com a referência histórica que sinalizou a queima.','Conferir o Pós-Ads e a publicidade atuais no Raio-X antes de escolher a ação.'];}
  else if(o.evolucao?.deltaFat<0||o.sinais?.perdendo){key='vendas';titulo='Investigar queda de faturamento';tone='attention';passos=['Conferir volume, preço, exposição, disponibilidade e participação do produto.','A posição é relativa à conta: subir no ranking não elimina uma queda nas vendas.'];}
  else if(o.evolucao?.deltaFat>0&&o.change?.pct<0){key='pressao';titulo='Conferir crescimento e pressão de margem';tone='attention';passos=['O faturamento cresceu e o percentual Pré-Ads recuou. Conferir preço, custo, descontos e mix.','Ler também o Pós-Ads atual e o gasto de publicidade; a variação Pré-Ads não comprova a evolução Pós-Ads.'];}
  else if(o.pctAfter>=20){key='continuidade-saudavel';titulo='Proteger resultado e avaliar oportunidades';tone='good';passos=['Conferir estoque, oferta e concorrência para preservar o resultado.','Avaliar exposição ou investimento gradualmente, com margem Pós-Ads, publicidade e metas acompanhadas.'];}
  const alertas=[];if(o.adsMissing)alertas.push('A composição Pós-Ads ainda depende da fonte de publicidade.');if(o.estimated&&!o.semVendasAtual)alertas.push('O resultado inclui rateio estimado de publicidade. Confira o vínculo antes de decidir.');if(o.evolucao?.deltaFat<0&&o.evolucao?.movimento==='subiu')alertas.push('O anúncio subiu de posição, mas o faturamento caiu.');if(o.evolucao?.movimento==='sem-vendas-ref')alertas.push('Sem vendas na referência não comprova lançamento do produto.');return{key,titulo,tone,passos,alertas};
 }
 // Catálogo da agenda: contagens pertencem a cada grupo, sem somar sinais sobrepostos.
 function agendaGrupos(a,{comparacao=false,publicidade=[],temPublicidade=false,publicidadeNoLiquido=false,movimentos=[]}={}){
  const defs=[
   ['estanca','perdas','Margem sangrando','bad','Pós-Ads negativo. Confira se a perda já existe no produto ou surge com a publicidade.'],
   ['adscome','perdas','Ads comendo a margem','attention','Pré-Ads de pelo menos 10%, mas Pós-Ads abaixo de 10%, sem prejuízo.'],
   ['corrija','perdas','Correção de margem','attention','Pós-Ads entre 0% e 10%, fora dos grupos de publicidade e baixa participação.'],
   ['peso','perdas','Peso morto','attention','Curva C com Pós-Ads abaixo de 10%, sem prejuízo, fora do período de produto novo. Há vendas neste recorte.'],
   ['proteja','proteger','Estrelas','good','Curva A com Pós-Ads de pelo menos 20%, sem queima histórica identificada.'],
   ['queima','proteger','Queimando margem','attention','Curva A ou B: Pré-Ads de pelo menos 10%, mais de 5 pontos abaixo da referência histórica.'],
   ['escale','oportunidades','Para impulsionar','good','Curva B com Pós-Ads de pelo menos 20%, sem queima histórica identificada.'],
   ['escondido','oportunidades','Possíveis estrelas','accent','Curva C com Pós-Ads de pelo menos 20%: boa margem e baixa participação no faturamento.'],
   ['maturacao','oportunidades','Produtos em maturação','info','Curva C com Pós-Ads abaixo de 10%, sem prejuízo, marcado como novo pelo cadastro ou primeira venda disponível.'],
   ['perdendo','evolucao','Perdendo tração','attention','Faturamento cai mais de 30%; referência acima de R$ 200 e vendas no período atual.'],
   ['ganhando','evolucao','Ganhando tração','good','Faturamento cresce mais de 40%; atual acima de R$ 200 e referência positiva.'],
   ['devolucoes','evolucao','Devoluções no período','attention','Movimentos classificados como devolvida no intervalo. Não é taxa por safra de venda.'],
   ['cobertura','evolucao','Conferir publicidade pendente','attention','Fonte de publicidade insuficiente para concluir a margem Pós-Ads.'],
   ['base','evolucao','Conferir base de margem','neutral','Sem base válida para calcular o percentual Pós-Ads.'],
   ['ads-queima','perdas','Queimando no Ads','bad','Relatório: receita atribuída × margem de referência − gasto resulta negativo. É uma estimativa.'],
   ['ads-sem-retorno','perdas','Ads sem retorno atribuído','attention','Relatório com gasto positivo e nenhuma receita atribuída. Não comprova ausência de efeito orgânico.'],
   ['ads-escala','oportunidades','Espaço no Ads','good','Relatório com gasto e ACOS de até metade da margem de referência. Conferir estoque e testar gradualmente.']
  ];
  const returns=new Map();for(const r of movimentos){if(String(r.stat)!=='devolvida')continue;const key=r.anuncio?'anuncio:'+r.anuncio:'sku:'+r.sku;if(!r.anuncio&&!r.sku)continue;const o=returns.get(key)||{key,anuncio:r.anuncio||'',sku:r.sku||'',skus:[],titulo:r.tit||r.sku||r.anuncio,qtdDev:0};o.qtdDev+=Math.abs(n(r.qtd));if(r.sku&&!o.skus.includes(r.sku))o.skus.push(r.sku);returns.set(key,o);}
  return defs.map(([key,familia,label,tone,criterio])=>{const tipo=key.startsWith('ads-')?'publicidade':['perdendo','ganhando'].includes(key)?'sinal':key==='devolucoes'?'movimento':'acao';const disponivel=tipo==='sinal'?comparacao:tipo==='publicidade'?temPublicidade&&!publicidadeNoLiquido:true;
   const rows=tipo==='publicidade'?publicidade.filter(o=>acaoPublicidade(o).key===key.slice(4)):tipo==='sinal'?a[key]:tipo==='movimento'?[...returns.values()]:a.BK[key];
   return{key,familia,label,tone,criterio,tipo,disponivel,pendencia:tipo==='sinal'?'Escolha uma comparação com vendas de referência no cabeçalho.':publicidadeNoLiquido?'Neste canal a publicidade já está no líquido. Confira as cobranças por SKU em Publicidade.':'Sem relatório por anúncio neste período.',count:disponivel?rows.length:null,rows:disponivel?rows.slice():[]};});
 }
 function recorteAgenda(items,keys){const selected=new Set(keys);return items.filter(o=>selected.has(o.key));}
 const RX_FIELDS=['qtd','fat','liq','mc','ctp','base','n','dev','negativas'];
 function raioSoma(rows){const o=Object.fromEntries(RX_FIELDS.map(k=>[k,rows.reduce((s,r)=>s+n(r[k]),0)]));return{...o,pct:ratio(o.mc,o.base),mcUn:o.qtd?o.mc/o.qtd:null,preco:o.qtd?o.fat/o.qtd:null,custo:o.qtd?o.ctp/o.qtd:null};}
 function raiox(series,peers,sku){
  const normalize=r=>({...r,date:String(r.date||'').slice(0,10),...Object.fromEntries(RX_FIELDS.map(k=>[k,n(r[k])]))}),rows=series.map(normalize),resumo=raioSoma(rows),others=peers.filter(r=>String(r.sku)!==sku).map(normalize).filter(r=>r.n>0&&r.base>0),ref=raioSoma(others),ops=new Map(),days=new Map();
  for(const r of rows){const k=JSON.stringify([r.emp,r.mkt]);if(!ops.has(k))ops.set(k,[]);ops.get(k).push(r);if(!days.has(r.date))days.set(r.date,[]);days.get(r.date).push(r);}
  return{titulo:rows.find(r=>r.titulo)?.titulo||sku,resumo,serie:[...days].map(([date,rs])=>({date,...raioSoma(rs)})).sort((a,b)=>a.date.localeCompare(b.date)),operacoes:[...ops.values()].map(rs=>({emp:rs[0].emp,mkt:rs[0].mkt,...raioSoma(rs)})).sort((a,b)=>b.mc-a.mc),comparacao:{pares:others.length,referencia:ref,deltaPP:resumo.pct!=null&&ref.pct!=null?resumo.pct-ref.pct:null,posicao:resumo.n&&resumo.base>0?1+others.filter(r=>100*r.mc/r.base>resumo.pct+1e-9).length:null,total:others.length+(resumo.n?1:0),parteMargem:ref.mc+resumo.mc>0?100*resumo.mc/(ref.mc+resumo.mc):null}};
 }
 return{orientacao,pagina,publicidade,grupos,identidadeProduto,tomMargem,coberturaProduto,rankingProdutos,variacaoMargemPre,evolucaoProdutos,comparar,diagnostico,desempenhoPublicidade,full,csv,affiliate,fin,inside,ratio,situacao,agenda,agendaGrupos,recorteAgenda,sinaisProduto,acaoPublicidade,revisaoProduto,raiox,raioSoma};
});
