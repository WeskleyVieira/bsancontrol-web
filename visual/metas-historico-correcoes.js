'use strict';
function corrigirHistoricoMetas(html){
 function patch(before,after){if(html.includes(before)){if(html.split(before).length!==2)throw Error('Contrato de histórico ambíguo: '+before.slice(0,60));html=html.replace(before,after);}else if(!html.includes(after))throw Error('Contrato de histórico mudou: '+before.slice(0,60));}
 function section(name,next,edit){const a=html.indexOf('function '+name+'('),b=html.indexOf('function '+next+'(',a);if(a<0||b<0)throw Error('Seção histórica ausente: '+name);html=html.slice(0,a)+edit(html.slice(a,b))+html.slice(b);}
 // Congelamento protege o bônus publicado. A conciliação mede a base diária.
 patch('const concilia=!congelado&&','const concilia=');
 patch('const podeProjetar=selMes&&!fechado&&!futuro','const podeProjetar=selMes&&!congelado&&!fechado&&!futuro');
 patch('const ok=M.ops.length>0&&M.ops.every(o=>o.concilia)&&!M.congelado;','const ok=M.ops.length>0&&M.ops.every(o=>o.concilia);');
 patch('const serieValida=!o.congelado&&cobertura&&concilia','const serieValida=cobertura&&concilia');
 patch("const motivo=o.congelado?'Comissão congelada sem fotografia diária.':!cobertura?","const motivo=!cobertura?");
 section('_metPainelHTML','_metAdsFontesHTML',s=>{const before="return h+'</div></section>';",after="return h+'</div>'+(M.ops.some(o=>o.congelado)?'<p class=\"met-nota\">Histórico reconstruído com a base atual. A comissão publicada permanece congelada; atualizações posteriores podem gerar diferenças em relação à apuração.</p>':'')+'</section>';";return s.includes(after)?s:s.replace(before,after);});
 patch('adsCamp:base&&adsReportValid?daCamp:null};',"adsCamp:base&&adsReportValid?daCamp:null,tacosCamp:base&&adsReportValid&&fa>0?daCamp/fa:null};");
 patch('adsCamp:base&&adsReportValid?adsCamp:null};',"adsCamp:base&&adsReportValid?adsCamp:null,tacosCamp:base&&adsReportValid&&fatAds>0?adsCamp/fatAds:null};");
 patch("parcial=k==='ads'&&realizado===null&&R.adsReportValid,exibido=parcial?real.adsCamp:realizado;","parcial=['ads','tacos'].includes(k)&&realizado===null&&R.adsReportValid,exibido=parcial?real[k==='tacos'?'tacosCamp':'adsCamp']:realizado;");
 patch("nomeReal=c.parcial?'Ads de campanha, sem afiliados':acumulado?","nomeReal=c.parcial?(k==='tacos'?'TACOS de campanha, sem afiliados':'Ads de campanha, sem afiliados'):acumulado?");
 patch("M.congelado?'Este mês tem uma fotografia de comissão congelada, sem uma série diária dessa fotografia. O resultado mensal continua na visão mensal.'","M.congelado?'A comissão está congelada. A base diária selecionada ainda não foi conciliada; confira as fontes. A apuração mensal permanece preservada.'");
 const before=" if(k==='ads'&&!R.adsValid&&R.adsReportValid)datasets.push({...serie('Ads de campanha (sem afiliados)',R.rows.map(r=>r[rk].adsCamp),colors[2]),...(diario?{type:'bar',borderWidth:0}:{})});",after=" if(['ads','tacos'].includes(k)&&!R.adsValid&&R.adsReportValid){datasets=datasets.filter((d,i)=>i!==1);datasets.push({...serie(k==='tacos'?'TACOS de campanha (sem afiliados)':'Ads de campanha (sem afiliados)',R.rows.map(r=>{const v=r[rk][k==='tacos'?'tacosCamp':'adsCamp'];return v==null?null:v*factor;}),colors[2]),...(diario?{type:'bar',borderWidth:0}:{})});}";
 patch(before,after);
 section('_metDemonstrativoHTML','_metRotaHTML',s=>{const before="const info=_MET_METRICAS[k],acumulado=_MET_TABLE_MODE==='acumulado',",after="const info=_MET_METRICAS[k],parcial=['ads','tacos'].includes(k)&&!R.adsValid&&R.adsReportValid,field=parcial?(k==='tacos'?'tacosCamp':'adsCamp'):k,acumulado=_MET_TABLE_MODE==='acumulado',";if(!s.includes(after))s=s.replace(before,after);s=s.replace("const a=(acumulado?row.acumReal:row.real)[k],","const a=(acumulado?row.acumReal:row.real)[field],").replace("a===null||p===null?'—':delta(a-p)","a===null||p===null||parcial?'—':delta(a-p)").replace("E(info.nome)+' · '+(acumulado?","E(info.nome)+(parcial?' · campanha sem afiliados':'')+' · '+(acumulado?");return s;});
 return html;
}
module.exports={corrigirHistoricoMetas};
