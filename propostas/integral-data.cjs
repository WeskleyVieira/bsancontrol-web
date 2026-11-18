'use strict';
// Dados de demonstração, com o contrato das fontes originais. Nenhum dado de SAIDA é importado.
const D=require('./preview-data.cjs');
const money=n=>Math.round(n*100)/100;
function group(rows,fields,shape){const map=new Map();for(const r of rows){const k=JSON.stringify(fields.map(f=>r[f]));let g=map.get(k);if(!g){g={...Object.fromEntries(fields.map(f=>[f,r[f]])),fat:0,liq:0,ctp:0,imp:0,mc:0,mccom:0,qtd:0,ped:0};map.set(k,g);}for(const f of ['fat','liq','ctp','imp','mc','mccom','qtd'])g[f]+=r[f]||0;g.ped++;}return [...map.values()].map(r=>{for(const f of ['fat','liq','ctp','imp','mc','mccom'])r[f]=money(r[f]);return shape?shape(r):r;});}
function createData(){
 const source=D.make('commerce',{}).rows;
 for(const [emp,mkt,scale]of [['Bsan Shop','TikTok Shop',.42],['Powerfull Filial','Mercado Livre',.12],['Pesseguinho Store','Mercado Livre',.29],['Mary Kase','Mercado Livre',.19]]){
  source.push(...source.filter(r=>r.company==='Bsan Shop'&&r.market==='Mercado Livre').map(r=>({...r,id:'DEMO-'+emp.replace(/\W/g,'')+'-'+r.id,company:emp,market:mkt,point:emp==='Powerfull Filial'?'Powerfull':'Bsan',units:Math.round(r.units*scale)||1,fat:r.fat*scale,cost:r.cost*scale,pre:r.pre*scale,after:r.after*scale,ads:mkt==='TikTok Shop'?r.ads*scale:0})));
 }
 const lines=[],ads=[],campaigns=[],adDays=[],stock=[],ship=[],commissions=[],commissionDetails=[],monthOps=new Map(),months=[];
 for(let month=0;month<12;month++){
  const date=new Date(Date.UTC(2025,11+month,1)),comp=date.toISOString().slice(0,7),end=comp==='2026-11'?16:new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();months.push(comp);
  for(let day=1;day<=end;day++){
   // Histórico anterior a setembro usa amostra semanal explícita; setembro a novembro são diários.
   if(comp<'2026-09'&&day%7!==1)continue;
   const iso=comp+'-'+String(day).padStart(2,'0');
   source.forEach((r,i)=>{if(i%3!==day%3)return;
    const qtd=Math.max(1,Math.round(r.units/6*(.72+Math.sin(day*.61+i)*.3)*(1+(month-8)*.03))),fat=money(qtd*r.fat/r.units),ctp=money(qtd*r.cost/r.units),imp=money(fat*.06),margin=(r.pre/r.fat)+(Math.sin(day*.55+i)*.018),mc=money(fat*margin),platform=money(fat-ctp-imp-mc),pub=r.market==='TikTok Shop'?money(-fat*.025):0;
    const row={date:iso,emp:r.company,mkt:r.market,ponto:r.point,sku:r.sku,tit:r.name,ped:'DEMO-PED-'+month+'-'+day+'-'+i,anuncio:r.market==='Mercado Livre'?'MLBDEMO'+i:r.id,qtd,fat,liq:money(fat-platform),ctp,imp,mc,mccom:mc,mcReal:mc,mcRealInformada:true,pub,afil:r.market==='TikTok Shop'?money(-fat*.006):0,fonte:'Demonstração isolada',stat:'venda',leilao:false,mod:['Coleta','Flex','Full'][i%3]};
    lines.push(row);const key=comp+'||'+r.company+'||'+r.market;const entry=monthOps.get(key)||{comp,emp:r.company,mkt:r.market,fat:0,mc:0,ads:0,units:0};entry.fat+=fat;entry.mc+=mc;entry.units+=qtd;entry.ads+=r.ads&&!(r.market==='Magazine Luiza'&&comp==='2026-10')?fat*(r.tacos||2)/100:0;monthOps.set(key,entry);
    if(day%11===0&&i%7===0)lines.push({...row,ped:row.ped+'-DEV',stat:'devolvida',qtd:1,fat:money(fat/qtd),mc:money(-fat/qtd*.2),mccom:money(-fat/qtd*.2)});
   });
   for(const op of D.make('commerce',{}).byOperation)ship.push({data:iso,date:iso,empresa:op.company,emp:op.company,marketplace:op.market,plataforma:op.market,mkt:op.market,ponto:op.point,coleta:12+day%4,flex:day%3,full:day%5,total:12+day%4+day%3+day%5});
  }
 }
 for(const r of lines.filter(r=>r.stat==='devolvida')){const entry=monthOps.get(r.date.slice(0,7)+'||'+r.emp+'||'+r.mkt);if(entry)entry.mc+=r.mccom;}
 for(const r of monthOps.values()){
  const inv=money(r.ads),campanha='DEMO · '+r.mkt;campaigns.push({comp:r.comp,emp:r.emp,mkt:r.mkt,campanha,inv,receita:money(inv*5.4),cliques:300,impressoes:14000,vendas:32,roas:5.4,orcamento:money(inv*1.15),status:'Ativa'});
  const products=source.filter(p=>p.company===r.emp&&p.market===r.mkt),weight=products.reduce((s,p)=>s+p.fat,0);
  for(const p of products)ads.push({comp:r.comp,emp:r.emp,mkt:r.mkt,campanha,anuncio:r.mkt==='Mercado Livre'?'MLBDEMO'+source.indexOf(p):p.id,sku:p.sku,titulo:p.name,inv:money(inv*p.fat/weight),receita:money(inv*p.fat/weight*5.4),cliques:22,impressoes:1000,vendas:3,status:'Ativa',roasAlvo:5});
  const n=r.comp==='2026-11'?16:30;for(let day=1;day<=n;day++)adDays.push({data:r.comp+'-'+String(day).padStart(2,'0'),emp:r.emp,mkt:r.mkt,campanha,inv:money(inv/n),receita:money(inv/n*5.4),cliques:10,impressoes:500});
  const op=r.emp+' · '+r.mkt,mes=r.comp,margin=money(r.mc-inv);
  commissions.push({mes,operacao:op,empresa:r.emp,marketplace:r.mkt,emp:r.emp,mkt:r.mkt,gestor:r.emp==='Powerfull Imports'?'Gestor B':'Gestor A',paga:'sim',margem_final:margin,margem_rs:margin,mc_rs:margin,bonus_final_rs:money(Math.max(0,margin)*.02),bonus_rs:money(Math.max(0,margin)*.02),metas_pct:84,atingimento_pct:84,faturamento:money(r.fat),mc_bruto:money(r.mc),margem_cont:margin,mc_pct:r.fat?margin/r.fat*100:0,ads:inv,afiliados:0,progresso_metas:84,teto_pct:4,sem_ads:inv?'não':'sim',fat_rs:money(r.fat),meta_fat_rs:money(r.fat*1.05),ads_rs:inv,tacos_pct:r.fat?inv/r.fat*100:0,liquidado_pct:mes==='2026-11'?88:100,vendas_abertas:mes==='2026-11'?2:0,base_dados_em:'2026-11-17T12:00:00Z'});
  for(const[tipo,realizado,meta]of [['faturamento',r.fat,r.fat*1.05],['margem',margin,r.fat*.2],['ads',inv,r.fat*.04],['tacos',r.fat?inv/r.fat*100:0,3.8]])commissionDetails.push({mes,operacao:op,empresa:r.emp,marketplace:r.mkt,meta:tipo,indicador:tipo,tipo,realizado,meta_valor:money(meta),objetivo:money(meta),peso:.25,atingimento:realizado/meta,bonus:money(margin*.005)});
 }
 for(const[ponto,company]of [['Bsan','Bsan Shop'],['Powerfull','Powerfull Imports']])for(const[r,i]of D.make('commerce',{company,market:'Mercado Livre'}).bySku.map((r,i)=>[r,i]))stock.push({sku:r.sku,conta:ponto,ponto,produto:r.name,saldoGeral:i===2?null:i===4?-2:70+i*14,dispGeral:i===2?null:65+i*14,saldoFull:i%3?20+i*2:0,reservado:5,fullML:i%3?20+i*2:0,un90d:r.units*2,vendaDia:r.units/16,coberturaDias:i===2?null:10+i,cobFull:4,cobCD:10+i,janelaDias:90,origem:'Demonstração isolada',coletado_em:'2026-11-16T12:00:00Z'});
 const details=commissions.map(c=>({mes:c.mes,operacao:c.operacao,DreFat:c.faturamento,DreMc:c.mc_bruto,DreMargem:c.margem_cont,Faturamento_real:c.faturamento,Faturamento_obj:money(c.faturamento*1.05),Faturamento_peso:c.ads?1:4,MC_obj:.20,MC_peso:6,TACOS_obj:.038,TACOS_peso:c.ads?2:0,Ads_real:c.ads,Ads_obj:money(c.faturamento*.04),Ads_peso:c.ads?1:0,Teto:.04,CustoFull:0,MinhaPagina:0,Picapinha:0,OutrosCustos:0,AdsNaMargem:c.ads}));
 const final=lines.filter(r=>r.stat==='venda'),rows=group(final,['date','emp','mkt','ponto']),skuMon=group(final.map(r=>({...r,mes:r.date.slice(0,7)})),['mes','sku'],r=>({...r,SKU:r.sku})),skuMkt=group(final,['mkt','sku']),skuMktMon=group(final.map(r=>({...r,mes:r.date.slice(0,7)})),['mes','mkt','sku']);
 const costs={custos:months.flatMap(mes=>[{mes,ponto:'Bsan',emp:'Bsan Shop',tipo:'direto',descricao:'Estrutura demonstrativa',valor:4200},{mes,ponto:'Powerfull',emp:'Powerfull Imports',tipo:'direto',valor:2300}]),rateio:{Bsan:{'Bsan Shop':.8,Jowcase:.2},Powerfull:{'Powerfull Imports':1}},investimento:[],boxwyl:[]};
 const full={gerado:'2026-11-16T12:00:00Z',contas:{}};
 for(const op of [...new Map(source.filter(r=>r.market==='Mercado Livre'||r.market==='Amazon').map(r=>[r.company+'|'+r.market,r])).values()])full.contas[op.company+'|'+op.market]={emp:op.company,mkt:op.market,ponto:op.point,ancora:'2026-11-16',linhas:source.filter(r=>r.company===op.company&&r.market===op.market).map((r,i)=>({sku:r.sku,prod:r.name,mlb:r.market==='Mercado Livre'?'MLBDEMO'+source.indexOf(r):r.id,inv:'DEMO-INVENTORY-'+i,aptas:i===3?2:20+i*2,proc:i%3,cam:i%4*3,un31:r.units,fullPct:65,dias:i===3?2:12,classe:'Repor',needH:{regra:15,'7':8,'15':15,'30':30,'60':60},aloc:{regra:12,'7':8,'15':12,'30':20,'60':35}})),parado:[],antigo:{previsto:0}};
 return{DETALHE:lines,ROWS:rows,SKU_MON:skuMon,SKU_MKT:skuMkt,SKU_MKT_MON:skuMktMon,TOP10:{},TOP10_EM:{},ADS:ads,ADS_CAMP:campaigns,ADS_DIA:adDays,ESTOQUE:stock,ENVIOS:ship,CUSTOS:costs,COMISSAO:commissions,COMISSAO_DET:details,FULL_REL:full,ACOMP:[],ACOMP_ITENS:[],METAS_FONTE:{atualizadoEm:'2026-11-17T12:00:00Z',demonstracao:true},METAS_GESTORES:Object.fromEntries(source.map(r=>[r.company+'|'+r.market,r.company==='Powerfull Imports'?'Gestor B':'Gestor A'])),months,source};
}
module.exports={createData,group};
