'use strict';
function corrigir(html){
 function patch(old,next){if(html.includes(next))return;if(html.includes(old))html=html.replace(old,next);else throw Error('Contrato da auditoria mudou: '+old.slice(0,85));}
 const helpers=`function _resumoEsc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function _resumoAgrupa(rows,key){const out=by(rows,key);if(rows.length&&rows.every(r=>r.fatMetas!=null&&r.fatMetas!=='')){for(const k in out)out[k].fat=0;for(const r of rows)out[r[key]].fat+=+r.fatMetas||0;}return out;}
function _resumoPorDia(rows){const out=byDate(rows);if(rows.length&&rows.every(r=>r.fatMetas!=null&&r.fatMetas!=='')){for(const k in out)out[k].fat=0;for(const r of rows)out[r.date].fat+=+r.fatMetas||0;}return out;}
function _resumoPctAds(A,ads){const base=A.linhas.reduce((s,r)=>s+mcBase(r.mkt,+r.fat||0,+r.liq||0),0);return base?100*(A.mc-ads)/base:0;}
`;
 if(!html.includes('function _resumoEsc('))html=html.replace('function renderOverview(){',helpers+'function renderOverview(){');
 patch("const byEmp=by(rows,'emp');const byMkt=by(rows,'mkt');","const byEmp=_resumoAgrupa(rows,'emp');const byMkt=_resumoAgrupa(rows,'mkt');");
 patch('const dMap=byDate(rows);const dates=Object.keys(dMap).sort();','const dMap=_resumoPorDia(rows);const dates=Object.keys(dMap).sort();');
 // A função de tendência é a única ocorrência com esta indentação exata.
 patch('function renderOvTrend(){\n  const[s,e]=getR();\n  const rows=fr(s,e);\n  const dMap=byDate(rows);','function renderOvTrend(){\n  const[s,e]=getR();\n  const rows=fr(s,e);\n  const dMap=_resumoPorDia(rows);');
 patch('const mktNames=Object.keys(MKT_C).filter(m=>byMkt[m]);','const mktNames=Object.keys(byMkt).filter(m=>byMkt[m].fat>0);');
 patch('backgroundColor:mktNames.map(m=>MKT_C[m])',"backgroundColor:mktNames.map(m=>MKT_C[m]||'#91a0b7')");
 patch('A.mcp&&A.mc?A.mcp*_mcA/A.mc:0, _pB=B.mcp&&B.mc?B.mcp*_mcB/B.mc:0','_resumoPctAds(A,_adsA), _pB=_resumoPctAds(B,_adsB)');
 patch('return f?100*m/f:0;});','const base=l.reduce((s,r)=>s+mcBase(r.mkt,+r.fat||0,+r.liq||0),0);return base?100*m/base:null;});');
 patch("label:c=>c.dataset.yAxisID==='y1'?", "label:c=>c.raw==null?'Sem base percentual':c.dataset.yAxisID==='y1'?");
 patch('if(_ADSD&&_ADSD.sig===sig) return _ADSD;','if(_ADSD&&_ADSD.sig===sig&&_ADSD.refs&&_ADSD.refs[0]===ADS&&_ADSD.refs[1]===ADS_CAMP&&_ADSD.refs[2]===ADS_DIA&&_ADSD.refs[3]===R0) return _ADSD;');
 patch('return _ADSD={sig,porDia,mesInv};','return _ADSD={sig,porDia,mesInv,refs:[ADS,ADS_CAMP,ADS_DIA,R0]};');
 patch("String(neg.sort((a,b)=>a[1].mc-b[1].mc)[0][1].tit||'').slice(0,60)","_resumoEsc(String(neg.sort((a,b)=>a[1].mc-b[1].mc)[0][1].tit||'').slice(0,60))");
 patch('<b>Ads deste mês ainda não coletado</b> — a operação investiu em Ads no mês passado; até o relatório entrar, a margem aparece maior do que é.','<b>Confira a cobertura de Ads</b> — há gasto em meses anteriores e nenhum gasto adicional registrado neste mês. Isso não confirma falha de coleta nem gasto zero.');
 const claim='Cada venda neste canal está gerando prejuízo.',neutral='O total do canal é negativo nesta base. Investigue os anúncios antes de alterar a operação.';
 if(html.includes(claim))html=html.replaceAll(claim,neutral);else if(!html.includes(neutral))throw Error('Contrato do texto de diagnóstico mudou');
 patch('Ação imediata: pause ou revise os anúncios no ${m}. Verifique se as taxas do canal estão consideradas no preço.','Investigue os anúncios do ${_resumoEsc(m)} e confira as taxas na abertura da operação.');
 for(const old of ['${bestEmp?.[0]','${bestMkt?.[0]','${worstMC?.[0]','${bestMC?.[0]']){const name=old.slice(2);const expr=old+"||'–'}";if(html.includes(expr))html=html.replaceAll(expr,'${_resumoEsc('+name+"||'–')}" );}
 patch("${top1?.[0]||'–'}","${_resumoEsc(top1?.[0]||'–')}");
 return html;
}
module.exports={corrigir};
