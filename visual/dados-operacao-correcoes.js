'use strict';
const fs=require('node:fs'),path=require('node:path');
function corrigirDadosOperacao(html){
 html=html.replace(/\r\n/g,'\n');
 const from=html.indexOf('/* bc-ger-abertura-v2')>=0?html.indexOf('/* bc-ger-abertura-v2'):html.indexOf('function _gerGaranteAbertura('),to=html.indexOf('\nwindow._gerGaranteAbertura',from);if(from<0||to<0)throw Error('Função de abertura da operação ausente.');html=html.slice(0,from)+fs.readFileSync(path.join(__dirname,'abertura-vendas.js'),'utf8').replace(/\r\n/g,'\n').trim()+html.slice(to);
 html=html.replace("rows.some(r=>r.pcheio||r.desc||r.comis||r.tarif||r.freteC)","rows.some(r=>r.aberturaConfirmada||r.pcheio||r.desc||r.comis||r.tarif||r.freteC)");
 html=html.replaceAll("'Ads e afiliados'","'Gastos com publicidade'").replaceAll("'Orçamento de Ads e afiliados'","'Orçamento de publicidade'");
 const anchor='function _metAdsFontes(',source=fs.readFileSync(path.join(__dirname,'metas-publicidade.js'),'utf8').replace(/\r\n/g,'\n');if(!html.includes(anchor))throw Error('Fonte de publicidade de Metas ausente.');const marker=html.indexOf('/* bc-metas-publicidade-v2');if(marker>=0)html=html.slice(0,marker)+source+'\n'+html.slice(html.indexOf(anchor,marker));else html=html.replace(anchor,()=>source+'\n'+anchor);
 const panelGuard=" if((k==='ads'||k==='tacos')&&M.comAds.length&&(!R.adsReportValid||!R.pos))return painel+_metPublicidadeMensalHTML(R,k);",chartGuard=" if((k==='ads'||k==='tacos')&&R.M.comAds.length&&(!R.adsReportValid||!R.pos))return _metPublicidadeMensalChart(R,k);";
 // Normaliza guardas de compilações anteriores, incluindo duplicatas legadas.
 const guards=new Set([panelGuard,chartGuard,panelGuard.replace('adsReportValid','adsValid'),chartGuard.replace('adsReportValid','adsValid')]);html=html.split('\n').filter(line=>!guards.has(line)).join('\n');
 const line=' const painel=_metPainelHTML(M,k);';if(!html.includes(line))throw Error('Painel de Metas ausente.');html=html.replace(line,line+'\n'+panelGuard);
 const chart="function _metRouteChart(R,k,modo='acumulado'){";if(!html.includes(chart))throw Error('Gráfico de Metas ausente.');html=html.replace(chart,chart+'\n'+chartGuard);return html;
}
module.exports={corrigirDadosOperacao};
