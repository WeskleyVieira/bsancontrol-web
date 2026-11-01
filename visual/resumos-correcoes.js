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
 if(!html.includes('BC_RESUMOS_LEITURA_V2')){
 patch("String(neg.sort((a,b)=>a[1].mc-b[1].mc)[0][1].tit||'').slice(0,60)","_resumoEsc(String(neg.sort((a,b)=>a[1].mc-b[1].mc)[0][1].tit||'').slice(0,60))");
 patch('<b>Ads deste mês ainda não coletado</b> — a operação investiu em Ads no mês passado; até o relatório entrar, a margem aparece maior do que é.','<b>Confira a cobertura de Ads</b> — há gasto em meses anteriores e nenhum gasto adicional registrado neste mês. Isso não confirma falha de coleta nem gasto zero.');
 const claim='Cada venda neste canal está gerando prejuízo.',neutral='O total do canal é negativo nesta base. Investigue os anúncios antes de alterar a operação.';
 if(html.includes(claim))html=html.replaceAll(claim,neutral);else if(!html.includes(neutral))throw Error('Contrato do texto de diagnóstico mudou');
 patch('Ação imediata: pause ou revise os anúncios no ${m}. Verifique se as taxas do canal estão consideradas no preço.','Investigue os anúncios do ${_resumoEsc(m)} e confira as taxas na abertura da operação.');
 for(const old of ['${bestEmp?.[0]','${bestMkt?.[0]','${worstMC?.[0]','${bestMC?.[0]']){const name=old.slice(2);const expr=old+"||'–'}";if(html.includes(expr))html=html.replaceAll(expr,'${_resumoEsc('+name+"||'–')}" );}
 patch("${top1?.[0]||'–'}","${_resumoEsc(top1?.[0]||'–')}");
 // Apenas as duas telas auditadas. Réguas e cálculos de outras áreas permanecem independentes.
 const cut=(start,end,next)=>{const a=html.indexOf(start),b=html.indexOf(end,a);if(a<0||b<=a)throw Error('Contrato da leitura mudou: '+start);html=html.slice(0,a)+next+html.slice(b);};
 cut('function renderDiagnosis(rows, tot, d){','// ═══════════════════════════════════════════════════════════════\n// EXECUTIVE MODE',
     'function renderDiagnosis(){ /* BC_RESUMOS_LEITURA_V2: síntese gerencial em visual/resumos.js */ }\n\n');
 cut('  const bestEmp=[...empArr]', '  const empNames=Object.keys(EMP_C)',
     '  // Síntese e apoio mensal renderizados pelo modelo da mesma leitura dos indicadores.\n');
 cut('  // ── Alertas ──\n  const av=[];', '  // ── Gráficos ──',
     '  // Pré-diagnóstico visível renderizado pelo modelo da operação; sem cortes universais.\n  al.replaceChildren();\n\n');
 }
 if(!html.includes('BC_RESUMOS_EXEC_V2')){
  const a=html.indexOf('function openExec(){'),b=html.indexOf('function closeExec(){',a);if(a<0||b<=a)throw Error('Contrato do modo executivo mudou');
  let exec=html.slice(a,b);const edit=(old,next)=>{if(!exec.includes(old))throw Error('Contrato executivo mudou: '+old);exec=exec.replaceAll(old,next);};
  edit("const byMkt=by(rows,'mkt'); const byEmp=by(rows,'emp');","const byMkt=_resumoAgrupa(rows,'mkt'); const byEmp=_resumoAgrupa(rows,'emp');");
  edit('const mcPct=tot.fat>0?tot.mc/tot.fat*100:0;','const mcPct=fatDe(tot)>0?tot.mc/fatDe(tot)*100:0;');
  edit("const mcStat = mcPct>=META_MARGEM?'exec-status-g':'exec-status-w';","const mcStat = ''; // BC_RESUMOS_EXEC_V2");
  edit("const mcMsg  = mcPct>=META_MARGEM?'✅ Na meta de 15%':'⚠️ Abaixo da meta de 15%';","const mcMsg = 'Margem registrada antes do Ads adicional. Objetivos específicos em Metas.';");
  edit('brl(Math.round(fatDe(tot)/d))','brl(fatDe(tot)/d)');
  edit('do bruto · Taxas:','do bruto · Diferença bruto/líquido:');
  edit('const mpColor=mcCor(mp);','');edit('${mcBadge(mp)}','exec-neutral');edit('${m}\n','${_resumoEsc(m)}\n');edit('${e}\n','${_resumoEsc(e)}\n');
  html=html.slice(0,a)+exec+html.slice(b);
 }
 // Normaliza somente linhas vazias do modo executivo modificado, inclusive em fontes já integradas.
 const ea=html.indexOf('function openExec(){'),eb=html.indexOf('function closeExec(){',ea);
 html=html.slice(0,ea)+html.slice(ea,eb).replace(/\n[ \t]+\n/g,'\n\n')+html.slice(eb);
 return html;
}
module.exports={corrigir};
