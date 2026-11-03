const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {corrigir}=require('./resumos-correcoes');
const {corrigirVendas}=require('./vendas-correcoes');
const {corrigirOperacao}=require('./operacao-correcoes');
const {corrigirFinanceiro}=require('./financeiro-correcoes');
const css=['areas.css','comparacao.css','resumos.css','vendas.css','gerencial.css','acompanhamento.css','operacao.css','resultados.css','financeiro.css','produtos.css','pos-venda.css','gestao.css','atalhos.css'].map(f=>fs.readFileSync(path.join(__dirname,f),'utf8').replace(/\r\n/g,'\n')).join('\n'),js=['areas.js','comparacao.js','resumos-modelo.js','resumos.js','../vendas-indicadores.js','vendas.js','gerencial-modelo.js','gerencial.js','acompanhamento-modelo.js','acompanhamento-historico.js','acompanhamento-cobranca.js','acompanhamento-carregamento.js','acompanhamento.js','../operacao-dados.js','operacao-modelo.js','operacao.js','resultados-modelo.js','resultados.js','financeiro-modelo.js','financeiro.js','produtos.js','pos-venda.js','gestao.js','atalhos.js'].map(f=>fs.readFileSync(path.join(__dirname,f),'utf8').replace(/\r\n/g,'\n')).join('\n');new vm.Script(js);
function presentation(html){
 html=html.replace('placeholder="mín. 6 caracteres"','placeholder="mín. 8 caracteres"').replace('if(nova.length<6)','if(nova.length<8)').replace('A nova senha precisa de ao menos 6 caracteres.','A nova senha precisa de ao menos 8 caracteres.');
 // O estado do repasse fica junto do líquido, sem substituir a situação da venda.
 html=html.replace(/<span style="color:#facc15" title="(?:valor provisório — ainda não liquidado pela plataforma|provisório)">●<\/span>/g,'<small class="bc-settlement-tag" title="Valor provisório; pode mudar após a liquidação pela plataforma.">Em liquidação</small>');
 html=html.replace("${(provis(r.fonte)&&(r.stat==='venda'||!r.stat))?'<span style=\"color:#facc15;font-weight:600;font-size:11px;\" title=\"Ainda em liquidação. A próxima coleta troca só o que a plataforma de fato cobrou.\">Em liquidação</span>':statBadge(r.stat)}","${statBadge(r.stat)}");
 const companies=/^const EMP_C=\{[^\n]*\};/m;if(!companies.test(html))throw Error('Paleta de empresas mudou');html=html.replace(companies,line=>line.replace(/('Bsan Shop':)'#[a-f\d]{6}'/i,"$1'#ac83e8'").replace(/('Jowcase':)'#[a-f\d]{6}'/i,"$1'#63cddd'").replace(/('Pesseguinho Store':)'#[a-f\d]{6}'/i,"$1'#efb293'"));
 html=html.replace("card('Bsan','Bsan','#00c2a8')","card('Bsan','Bsan',EMP_C['Bsan Shop'])");
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
function users(html){
 const userCss=fs.readFileSync(path.join(__dirname,'usuarios.css'),'utf8').replace(/\r\n/g,'\n'),policy=fs.readFileSync(path.join(__dirname,'../acessos.js'),'utf8').replace(/\r\n/g,'\n'),ui=fs.readFileSync(path.join(__dirname,'usuarios.js'),'utf8').replace(/\r\n/g,'\n');new vm.Script(policy);new vm.Script(ui);
 const style='<style id="bc-users-visual">'+userCss+'</style>';html=html.includes('id="bc-users-visual"')?html.replace(/<style id="bc-users-visual">[\s\S]*?<\/style>/,()=>style):html.replace('</head>',style+'</head>');
 html=html.replace(/<script id="bc-users-(?:policy|module)">[\s\S]*?<\/script>\n?/g,'');
 return html.replace(/\s*<\/body>/,'\n<script id="bc-users-policy">'+policy+'</script>\n<script id="bc-users-module">'+ui+'</script>\n</body>');
}
function apply(html){html=corrigirFinanceiro(corrigirOperacao(html));html=presentation(corrigirVendas(corrigir(html.replace(/\r\n/g,'\n'))));const style='<style id="bc-areas-visual">'+css+'</style>';html=html.includes('id="bc-areas-visual"')?html.replace(/<style id="bc-areas-visual">[\s\S]*?<\/style>/,()=>style):html.replace('</head>',style+'</head>');const marker='<!-- ===== BsanControl ONLINE';const module='<script id="bc-areas-module">'+js+'</script>\n';if(html.includes('id="bc-areas-module"'))html=html.replace(/<script id="bc-areas-module">[\s\S]*?<\/script>\n?/,()=>module);else if(html.includes(marker))html=html.replace(marker,module+marker);else html=html.replace('</body>',module+'</body>');return users(html.replace(/(?:\r?\n){2,}(?=<script id="bc-areas-module">)/g,'\n').replace(/(?:\r?\n)+(?=<!-- ===== BsanControl ONLINE)/g,'\n\n')); }

module.exports={apply,presentation};
