const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const css=fs.readFileSync(path.join(__dirname,'areas.css'),'utf8').replace(/\r\n/g,'\n'),js=fs.readFileSync(path.join(__dirname,'areas.js'),'utf8').replace(/\r\n/g,'\n');new vm.Script(js);
function presentation(html){
 const money=/^const brl =v=>[^\n]*;/m;if(!money.test(html))throw Error('Formato monetário mudou');html=html.replace(money,"const brl =v=>v==null||v===''||!Number.isFinite(Number(v))?'—':Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:2});");
 const compact=/^const brlK=v=>\{[\s\S]*?\n\};/m;if(!compact.test(html)&&!html.includes('const brlK=v=>brl(v);'))throw Error('Formato compacto mudou');html=html.replace(compact,'const brlK=v=>brl(v);');
 const percent=/^const pct =\(n,d\)=>[^\n]*;/m;if(!percent.test(html))throw Error('Formato percentual mudou');html=html.replace(percent,"const pct =(n,d)=>d===0?'—':(n/d*100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';");
 html=html.replace("dec=(dec==null?1:dec); const t=p.toFixed(dec)+'%';","dec=Math.max(2,dec==null?2:dec); const t=p.toLocaleString('pt-BR',{minimumFractionDigits:dec,maximumFractionDigits:dec})+'%';");
 html=html.replace(/^const AC2_BRL  =[^\n]*;/m,'const AC2_BRL  = v=>brl(v);').replace(/^const AC2_BRLk =[^\n]*;/m,'const AC2_BRLk = v=>brl(v);');
 // Somente concatenações de exibição com unidade percentual, nunca valores usados no cálculo.
 html=html.replace(/\.toFixed\((?:0|1)\)(?:\.replace\(['"]\.['"],\s*['"],['"]\))?(?=\s*\+\s*['"](?:%|pp| p\.p\.)|\}%)/g,".toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})");
 html=html.replace("s:brl(Math.round(tot.qtd/d))+' un/dia'","s:Math.round(tot.qtd/d).toLocaleString('pt-BR')+' un/dia'");
 return html;
}
function apply(html){html=presentation(html);const style='<style id="bc-areas-visual">'+css+'</style>';html=html.includes('id="bc-areas-visual"')?html.replace(/<style id="bc-areas-visual">[\s\S]*?<\/style>/,()=>style):html.replace('</head>',style+'</head>');const marker='<!-- ===== BsanControl ONLINE';const module='<script id="bc-areas-module">'+js+'</script>\n';if(html.includes('id="bc-areas-module"'))html=html.replace(/<script id="bc-areas-module">[\s\S]*?<\/script>\n?/,()=>module);else if(html.includes(marker))html=html.replace(marker,module+marker);else html=html.replace('</body>',module+'</body>');return html.replace(/(?:\r?\n){2,}(?=<script id="bc-areas-module">)/g,'\n').replace(/(?:\r?\n)+(?=<!-- ===== BsanControl ONLINE)/g,'\n\n');}

module.exports={apply,presentation};
