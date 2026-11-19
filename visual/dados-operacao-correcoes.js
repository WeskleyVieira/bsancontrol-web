'use strict';
const fs=require('node:fs'),path=require('node:path');
function corrigirDadosOperacao(html){
 html=html.replace(/\r\n/g,'\n');
 const from=html.indexOf('/* bc-ger-abertura-v2')>=0?html.indexOf('/* bc-ger-abertura-v2'):html.indexOf('function _gerGaranteAbertura('),to=html.indexOf('\nwindow._gerGaranteAbertura',from);if(from<0||to<0)throw Error('Função de abertura da operação ausente.');html=html.slice(0,from)+fs.readFileSync(path.join(__dirname,'abertura-vendas.js'),'utf8').replace(/\r\n/g,'\n').trim()+html.slice(to);
 html=html.replace("rows.some(r=>r.pcheio||r.desc||r.comis||r.tarif||r.freteC)","rows.some(r=>r.aberturaConfirmada||r.pcheio||r.desc||r.comis||r.tarif||r.freteC)");
 html=html.replaceAll("'Ads e afiliados'","'Gastos com publicidade'").replaceAll("'Orçamento de Ads e afiliados'","'Orçamento de publicidade'");
 return corrigirMetasPublicidade(html);
}
function corrigirMetasPublicidade(html){
 html=html.replace(/\r\n/g,'\n');
 const anchor='function _metAdsFontes(',source=fs.readFileSync(path.join(__dirname,'metas-publicidade.js'),'utf8').replace(/\r\n/g,'\n');if(!html.includes(anchor))throw Error('Fonte de publicidade de Metas ausente.');const marker=html.indexOf('/* bc-metas-publicidade-v2');if(marker>=0)html=html.slice(0,marker)+source+'\n'+html.slice(html.indexOf(anchor,marker));else html=html.replace(anchor,()=>source+'\n'+anchor);
 const panelGuard=" if((k==='ads'||k==='tacos')&&M.comAds.length&&(!R.adsReportValid||!R.pos))return painel+_metPublicidadeMensalHTML(R,k);",chartGuard=" if((k==='ads'||k==='tacos')&&R.M.comAds.length&&(!R.adsReportValid||!R.pos))return _metPublicidadeMensalChart(R,k);";
 // Normaliza guardas de compilações anteriores, incluindo duplicatas legadas.
 const mensalEDiario=chartGuard.replace("return _metPublicidadeMensalChart","_metPublicidadeMensalChart");
 const atualizarSerie=mensalEDiario.replace("_metPublicidadeMensalChart(R,k);","{_metPublicidadeMensalChart(R,k);R=_metLeituraObservada(R);}");
 const guards=new Set([panelGuard,chartGuard,mensalEDiario,atualizarSerie,panelGuard.replace('adsReportValid','adsValid'),chartGuard.replace('adsReportValid','adsValid')]);html=html.split('\n').filter(line=>!guards.has(line)).join('\n');
 const line=' const painel=_metPainelHTML(M,k);';if(!html.includes(line))throw Error('Painel de Metas ausente.');html=html.replace(line,line+'\n'+panelGuard);
 const chart="function _metRouteChart(R,k,modo='acumulado'){";if(!html.includes(chart))throw Error('Gráfico de Metas ausente.');html=html.replace(chart,chart+'\n'+atualizarSerie);
 // O gráfico diário também pode exibir só o plano de publicidade.
 html=html.replace("const el=document.getElementById('c-met-rota');if(!el||typeof Chart==='undefined'||!R.pos)return;","const el=document.getElementById('c-met-rota');if(!el||typeof Chart==='undefined'||(!R.pos&&!['ads','tacos'].includes(k)))return;");
 const semSerie=" if(['ads','tacos'].includes(k)&&(!R.adsReportValid||!R.pos))datasets=datasets.slice(0,1);";
 const rec=" if(!diario&&rec&&rec.remaining>0";
 if(!html.includes(semSerie))html=html.replace(rec,semSerie+'\n'+rec);
 const corte="' · dados disponíveis até '+_metDia(R.M.mes+'-'+String(R.limite).padStart(2,'0'))";
 html=html.replace(corte,"(R.limite?' · referência até '+_metDia(R.rows[R.limite-1].date):' · sem dia apurado')");
 const inicioDia=" for(const row of R.rows){const future=row.date>M.hoje,";
 const diaComCusto=" for(const row of R.rows){if(k==='ads'||k==='tacos'){h+=_metBotaoDiaPublicidade(R,k,row);continue;}const future=row.date>M.hoje,";
 if(!html.includes(diaComCusto)){
  if(!html.includes(inicioDia))throw Error('Calendário de Metas ausente.');
  html=html.replace(inicioDia,diaComCusto);
 }
 const ajustes=[
  ["medida(nomeReal,fmt(c.exibido))","medida(R.observada?_metRotuloObservado(k,acumulado):nomeReal,fmt(c.exibido))"],
  ["E(c.status)","E(R.observada?(acumulado?R.pos.cobertos+' de '+R.cut+' dias com mídia informada.':R.pos.informado?'Mídia informada pela fonte diária.':'Sem registro de mídia nesta data.'):c.status)"],
  ["if(c.parcial)h+=","if(c.parcial&&!R.observada)h+="],
  ["(parcial?' · campanha sem afiliados':'')","(R.observada?' · mídia parcial dos dias informados':parcial?' · campanha sem afiliados':'')"],
  ["<th scope=\"col\">Informado '+label+'","<th scope=\"col\">'+(R.observada?_metRotuloObservado(k,acumulado):'Informado '+label)+'"],
  ["const open=_MET_UI.get(_MET_UI_SCOPE)?.open[key]===true;","const open=_MET_UI.get(_MET_UI_SCOPE)?.open[key]??(key==='demonstrativo');"],
  [semSerie," if(R.observada&&datasets.length>1)datasets[1].label=_metRotuloObservado(k,!diario);\n"+semSerie]
 ];
 for(const [antes,depois] of ajustes)if(!html.includes(depois))html=html.replace(antes,depois);
 return html;
}
module.exports={corrigirDadosOperacao,corrigirMetasPublicidade};
