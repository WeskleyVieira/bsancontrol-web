'use strict';
function corrigirFullscreen(html){
 if(!html.includes("async function metTelaCheia(){const z=_MET_AMPLIADO;if(z)await BCFullscreen.toggle"))html=html.replace(/async function metTelaCheia\(\)\{[\s\S]*?\n\}/,"async function metTelaCheia(){const z=_MET_AMPLIADO;if(z)await BCFullscreen.toggle(z.dialog,document.getElementById('met-ampliado-tela'),()=>z.chart?.resize());}");
 html=html.replace("if(document.fullscreenElement===z.dialog)document.exitFullscreen?.().catch(()=>{});","BCFullscreen.release(z.dialog);");
 html=html.replace("document.getElementById('met-ampliado-tela').hidden=!document.fullscreenEnabled||_MET_TELA_CHEIA_BLOQUEADA;","document.getElementById('met-ampliado-tela').hidden=false;");
 html=html.replace(/document\.getElementById\('bc-com-fullscreen'\)\.onclick=async\(\)=>\{try\{[\s\S]*?catch\(_\)\{document\.getElementById\('bc-com-fullscreen'\)\.hidden=true;\}\};/,"document.getElementById('bc-com-fullscreen').onclick=()=>BCFullscreen.toggle(dialog,document.getElementById('bc-com-fullscreen'),()=>BCCom.zoom?.chart.resize());");
 html=html.replace("document.getElementById('bc-com-fullscreen').hidden=!document.fullscreenEnabled;","document.getElementById('bc-com-fullscreen').hidden=false;");
 html=html.replace("if(document.fullscreenElement===dialog)document.exitFullscreen?.().catch(()=>{});s.mark.replaceWith(s.area);","BCFullscreen.release(dialog);s.mark.replaceWith(s.area);");
 // O controlador compartilhado é a única origem do estado/rotulagem.
 html=html.replace(/ *document\.addEventListener\('fullscreenchange',\(\)=>\{[^\n]*?met-ampliado-tela[^\n]*?\}\);/g,'').replace('\n \n document.body.appendChild(dialog);return dialog;','\n\n document.body.appendChild(dialog);return dialog;');
 return html;
}
module.exports={corrigirFullscreen};
