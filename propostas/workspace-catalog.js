/* Inventário de apresentação. Valores e ações nesta prévia são demonstrativos. */
(function(root,factory){const value=factory();if(typeof module==='object')module.exports=value;else root.BsanWorkspaceCatalog=value;})(typeof window==='object'?window:this,function(){
 'use strict';
 const pages={},sources={
  result:'visual/resultados.js',manager:'visual/gerencial.js',margin:'visual/margens-ui.js',
  sales:'visual/vendas.js',rx:'visual/vendas-raiox.js',ads:'visual/publicidade.js',
  goals:'visual/metas-publicidade.js',forecast:'visual/forecast-anuncios.js',macro:'visual/forecast-produtos.js',
  operations:'visual/operacao.js',tasks:'visual/acompanhamento.js',align:'visual/alinhamentos.js',
  pending:'visual/pendencias.js',finance:'visual/financeiro.js',reading:'visual/financeiro-leitura.js',
  post:'visual/pos-venda.js',catalog:'produtos/web/app.js',cost:'produtos/web/costing-ui.js',
  effective:'produtos/web/effective-ui.js',review:'produtos/web/review-ui.js',saleCost:'produtos/web/sales-ui.js',
  pack:'produtos/web/packaging-ui.js',prepare:'produtos/web/operational-packaging-ui.js',publish:'produtos/web/publication-ui.js',
  base:'BsanControl.html'
 };
 function page(id,copy,source,widgets,filters=[],actions=[]){
  pages[id]={id,copy,source:sources[source],filters,actions,widgets:widgets.map((w,i)=>({
   id:id+'-'+w[0],title:w[1],kind:w[2],dependency:({stock:'stock',catalog:'catalog',flow:'workflow',finance:'finance',ads:'ads',goals:'goals'}[w[3]]||w[3]||'commerce'),
   fields:(w[4]||'').split('|').filter(Boolean),copy:w[5]||'',essential:w[6]??i<2,wide:w[7]??true,
   source:sources[source],origin:w[8]||'',
  }))};
 }
 const saleFields='#|ID do anúncio|SKU|Título|Situação|Unidades|Faturamento|Preço/un|Custo/un|Pré-Ads|Pré-Ads (%)|Publicidade|TACOS|Pós-Ads|Pós-Ads (%)';
 const marginCopy='Pós-Ads é contribuição após publicidade; despesas fixas são apuradas na DRE. Ausência de fonte não vira gasto zero.';
 const forecastWidgets=[
  ['ritmo','Realizado, esperado e projeção','forecastKpis','commerce','','O esperado repete o ritmo diário do próprio produto na referência. A projeção usa o ritmo observado, separadamente da margem realizada.',true],
  ['produtos','Produtos para acompanhar','forecastCards','commerce','','Abaixo, no ritmo, acima ou sem referência. Abra um SKU para ver suas operações.',true],
  ['evolucao','Acompanhamento e projeção dos produtos','projection','daily','','Realizado até o corte; projeção após o corte. A faixa é uma hipótese de cenário, não um intervalo de confiança.',false],
  ['operacoes','Participação das operações no SKU','table','commerce','Operação|SKU|Faturamento|Unidades|Referência|Pós-Ads|Pós-Ads (%)','Mesmo SKU somado antes da projeção; não atribuir um ID único ao agregado.',false],
  ['metodo','Método, referência e qualidade','quality','commerce','','Dias corridos, meses normalizados, histórico curto e datas sem registros explícitos. Sem histórico comparável, o esperado permanece indisponível.',false],
 ];
 page('r-geral','O resultado do grupo primeiro; aprofunde onde houver uma decisão.','result',[
  ['resumo','Resultado consolidado','kpis','commerce','Faturamento|Pedidos|Unidades|Pós-Ads',marginCopy,true],
  ['atencao','Onde concentrar atenção','priorities','commerce','','Margem, queima e perda de tração seguem tratativas distintas.',true,false],
  ['evolucao','Evolução do resultado','line','daily','','Diário ou acumulado, com a referência explícita.',true,false],
  ['contribuicao','Contribuição de cada operação','bars','commerce','Pós-Ads','Valores negativos continuam visíveis.',false],
  ['contas','Todas as operações','table','commerce','Operação|Faturamento|Pré-Ads|Publicidade|Pós-Ads|Pós-Ads (%)|TACOS|Unidades','Cada etapa financeira permanece disponível.',false],
  ['base','Bases e comparação','quality','commerce','','Origem, período, regra da margem e cobertura de Ads.',false],
 ],['Indicador','Diário / acumulado'],['Comparar empresas e marketplaces']);
 page('r-diario','Entenda o resultado do período, a evolução e quem exige atenção.','result',[
  ['resumo','Vendas e margem do período','kpis','commerce','Faturamento|Pedidos|Unidades|Ticket|Pré-Ads|Publicidade|Pós-Ads|Pós-Ads (%)','Leitura comercial e financeira no mesmo contexto.',true],
  ['placar','Placar de contas','rank','commerce','Posição|Operação|Pontos|Faturamento|Pré-Ads|Pós-Ads|Pós-Ads (%)|Pedidos|Unidades|Ticket','Pontuação inteira na apresentação; o cálculo conserva precisão para ordenar.',true],
  ['mudancas','Mudanças que exigem atenção','priorities','commerce','','Compare venda, margem e volume.',false,false],
  ['relacao','Relação entre as contas','bubble','commerce','','Eixo X: faturamento. Eixo Y: Pós-Ads (%). Bolha: unidades. Identificação sem linhas cruzando.',false],
  ['impacto','Contribuição para a variação','bars','commerce','Variação','Qual operação explica o aumento ou a queda frente à referência.',false,false],
  ['tendencia','Tendência e composição diária','line','daily','','Faturamento em barras e margem percentual em linha, com cores e eixos distintos.',false],
  ['antes','Evolução antes e depois','table','commerce','Operação|Referência|Faturamento|Variação|Pré-Ads|Pós-Ads','Comparação das mesmas contas.',false],
  ['pesos','Pesos e fontes do placar','weights','commerce','','Pesos são simulados nesta proposta. Alterá-los recalcula somente esta prévia.',false],
 ],['Janela do Diário','Referência','Indicador do ranking','Busca'],['Exportar placar']);
 page('r-canais','Compare canais e encontre produtos relevantes sem abrir uma tabela extensa.','result',[
  ['canais','Resultado por marketplace','channelCards','commerce','','Faturamento, unidades, Pré-Ads, Pós-Ads e margem.',true],
  ['top','Top 10 produtos','productCards','commerce','','Cards resumidos; Detalhar abre a composição e o Raio-X.',true],
  ['fat','Evolução do faturamento por canal','line','daily','Faturamento','Períodos curtos usam dias; períodos longos podem usar meses.',false,false],
  ['margem','Margem Pós-Ads por canal','line','daily','Margem','Percentuais calculados sobre a base de cada canal.',false,false],
  ['tabela','Tabela dos canais','table','commerce','Marketplace|Faturamento|Unidades|Pré-Ads|Pré-Ads (%)|Publicidade|TACOS|Pós-Ads|Pós-Ads (%)','Todas as etapas financeiras.',false],
 ],['Agrupamento temporal','Ordenar Top 10'],['Exportar canais']);
 page('r-abc','Classifique o mesmo SKU no conjunto escolhido, com o denominador da curva sempre visível.','result',[
  ['curvas','Participação das curvas','abcKpis','commerce','','Curva A, Curva B, Curva C e Sem curva positiva.',true],
  ['produtos','Produtos para analisar','abcTable','commerce',saleFields,'Geral soma operações por SKU. Individual e seleção de operações recalculam a curva no conjunto escolhido.',true],
  ['pareto','Pareto dos produtos','pareto','commerce','','Barras: critério por produto. Linha: participação acumulada de todos os itens.',false,false],
  ['participacao','Participação por curva','donut','commerce','','Somente valores positivos entram no denominador. Pendentes e negativos permanecem na lista.',false,false],
  ['matriz','Matriz de faturamento, unidades e contribuição','matrix','commerce','','Três curvas independentes, sem confundir volume com rentabilidade.',false],
  ['concentracao','Concentração e parâmetros da curva','quality','commerce','','Cortes A/B e referência de margem. Busca não altera o denominador da classificação.',false],
 ],['Operações na soma','Critério da curva','Curva','Prioridade','Busca','Cortes A / B'],['Exportar curva']);
 page('r-forecast','Acompanhe o cenário da empresa e o mesmo SKU somado entre operações.','result',[
  ['macro','Histórico e cenário macro','projection','daily','','Mês em andamento separado dos meses encerrados; futuro começa após o corte.',true],
  ...forecastWidgets,
  ['historico','Histórico de metas e atingimento','table','goals','Competência|Operação|Meta|Realizado|Atingimento','Cobertura e operações sem meta ficam explícitas.',false],
 ],['Lente: empresa / produtos','SKU','Operações na soma','Indicador','Método','Horizonte','Referência','Crescimento esperado','Faixa de cenário'],['Exportar cenário']);
 page('v-lista','Consulte vendas e cada etapa do resultado, com ID e SKU copiáveis.','sales',[
  ['resumo','Vendas no período','kpis','commerce','Faturamento|Pedidos|Unidades|Pós-Ads','Somente vendas finalizadas no cenário.',true],
  ['vendas','Linhas de venda','salesTable','commerce','Data|Operação|Pedido|ID do anúncio|SKU|Título|Qtd|Valor venda|Custo plataforma|Líquido|Imposto|CTP|MC (R$)|MC (%)|Status','Todas as colunas continuam acessíveis; zeros sem utilidade visual ficam vazios.',true],
  ['fontes','Composição e cobertura','quality','commerce','',marginCopy,false],
 ],['Status','Empresa','Marketplace','Modalidade','Busca','Margem negativa'],['Exportar vendas']);
 page('g-vendas','Veja as vendas da operação selecionada, do pedido à margem.','sales',pages['v-lista'].widgets.map(w=>[w.id.split('-').pop(),w.title,w.kind,w.dependency,w.fields.join('|'),w.copy,w.essential,w.wide]),['Status','Modalidade','Busca','Margem negativa'],['Exportar vendas']);
 page('v-raiox','Investigue o SKU e compare suas operações sem perder o volume de vendas.','rx',[
  ['resumo','Resultado do SKU','kpis','commerce','Faturamento|Unidades|Pedidos|Pré-Ads|Publicidade|TACOS|Pós-Ads|Pós-Ads (%)',marginCopy,true],
  ['evolucao','Vendas e margem após publicidade','mixed','daily','','Barras atrás das linhas; Pré-Ads e Pós-Ads identificados com cor e traço próprios.',true],
  ['operacoes','Mesmo SKU nas demais operações','table','commerce','Operação|SKU|Faturamento|Unidades|Preço/un|Custo/un|Pré-Ads|Pré-Ads (%)|Publicidade|TACOS|Pós-Ads|Pós-Ads (%)','Comparação no mesmo período e sobre a mesma composição.',false],
  ['anuncios','Anúncios que compõem o SKU','table','commerce',saleFields,'Um SKU pode reunir vários IDs.',false],
  ['custos','Composição do custo e origem da margem','costBridge','commerce','','CTP e estágios da venda, sem confundir margem com lucro final.',false],
  ['historico','Histórico do SKU','line','daily','','Leitura diária ou acumulada.',false],
 ],['SKU','Diário / acumulado','Margem em R$ / %'],['Abrir forecast do SKU']);
 page('panorama','Comece pelas vendas e pelo resultado da operação; aprofunde publicidade quando necessário.','manager',[
  ['resumo','Visão geral da operação','kpis','commerce','Faturamento|Pedidos|Unidades|Pós-Ads','Volume e faturamento antes da análise de publicidade.',true],
  ['evolucao','Faturamento e margem por dia','mixed','daily','','Faturamento em azul, margem em verde; eixos identificados.',true,false],
  ['agenda','Prioridades da operação','priorities','commerce','','Abra uma tratativa do Diagnóstico.',true,false],
  ['etapas','Etapas do resultado','kpis','commerce','Pré-Ads|Publicidade|TACOS|Pós-Ads (%)',marginCopy,false],
  ['top','Produtos com maior contribuição','productCards','commerce','','Cards com faturamento, volume e margem.',false],
  ['composicao','Origem e composição da margem','costBridge','commerce','',marginCopy,false],
  ['contexto','Base e referência de comparação','quality','commerce','','Referência indicada pelo período, sem comparação inventada.',false],
 ],['Indicador','Diário / acumulado'],['Escolher referência']);
 page('diagnostico','Agenda do gestor: cada grupo aponta uma investigação e uma tratativa própria.','manager',[
  ['agenda','Agenda por situação','diagnostics','commerce','','Queima, Sem giro, Perdendo tração e Ganhando tração permanecem separados.',true],
  ['itens','Itens do grupo selecionado','diagnosticTable','commerce',saleFields,'Colunas adicionais são próprias da situação: perda de margem, tração ou eficiência do Ads.',true],
  ['evolucao','Evolução do grupo','line','daily','','Compare ritmo e margem dos itens filtrados.',false],
  ['criterios','Critérios dos rótulos e referência','rules','commerce','','Estrelas, margem sangrando, correção de margem, queima, tração, novos tratores, Ads, peso morto, impulsionar e possíveis estrelas.',false],
 ],['Situação','Anúncio / SKU','Busca','Referência'],['Abrir grupo em Anúncios','Exportar grupo']);
 page('anuncios','Leia identificação e posição, volume, resultado e publicidade nessa ordem.','manager',[
  ['resumo','Vendas e resultado dos itens','kpis','commerce','Faturamento|Unidades|Pós-Ads|Itens negativos','Faturamento e volume continuam à vista.',true],
  ['itens','Resultado por anúncio ou SKU','adTable','commerce',saleFields,'Símbolo ao lado do número em #. “Variação vs. referência” substitui delta. ID não representa um SKU agregado.',true],
  ['ranking','Evolução na operação','rankKpis','commerce','','Subiram, caíram e mantiveram posição; ranking por faturamento antes dos filtros.',false],
  ['saude','Curvas e saúde da margem','abcKpis','commerce','','Margem: <10% vermelho, 10% a <20% âmbar, ≥20% verde.',false],
  ['composicao','Origem do Pós-Ads e do rateio','quality','commerce','','Rateio mensal é uma estimativa de distribuição do gasto; não gasto identificado por pedido.',false],
 ],['Anúncio / SKU','Situação','Curva','Evolução','Busca','Colunas','Itens por página'],['Exportar filtro','Escolher referência']);
 page('g-forecast','Acompanhe anúncios ou SKUs: quem está abaixo, no ritmo ou acima do esperado.','forecast',forecastWidgets,['Anúncio / SKU','Indicador','Referência','Horizonte','Método','Crescimento esperado','Faixa de cenário','Situação','Busca'],['Exportar forecast']);
 page('publicidade','Mídia e afiliados têm métricas próprias; a soma aparece onde faz sentido.','ads',[
  ['midia','Mídia de campanha','adsKpis','ads','Investimento|TACOS|Receita atribuída|ACOS|ROAS|Orçamento','TACOS da mídia exclui afiliados.',true],
  ['diario','Acompanhamento diário da mídia','adsDaily','ads','','Gasto, receita atribuída e eficiência da campanha.',true,false],
  ['afiliados','Afiliados','affiliate','ads','Comissão afiliados|Receita afiliados|Taxa afiliados|Orçamento afiliados','Comissão reportada, faturamento atribuído e conciliação da fonte; ausência de abertura diária não vira zero.',true,false],
  ['soma','Publicidade total sobre vendas','combined','ads','','Soma mídia + afiliados apenas com a mesma base e cobertura explícita.',false],
  ['campanhas','Campanhas e anúncios','adCampaigns','ads','Campanha|ID do anúncio|SKU|Status|Investimento|Receita atribuída|ACOS|ROAS|Orçamento diário|ROAS alvo|Impressões|Cliques|CTR|CPC|CVR|Vendas atribuídas|Perda orçamento|Perda ranking','Abertura por campanha, anúncio ou SKU.',false],
  ['conciliacao','Conciliação dos afiliados e fontes','quality','ads','','Registrado, reportado, já no líquido e cobertura diária.',false],
  ['acumulado','Posição acumulada e limites','goals','goals','','Teto de TACOS e limite de gasto preservados, com diário e acumulado.',false],
 ],['Mídia / afiliados / conjunto','Campanha','Anúncio / SKU','Busca'],['Abrir metas']);
 page('g-metas','Acompanhe rota diária, posição acumulada e objetivo de cada competência.','goals',[
  ['resumo','Realizado frente às metas','goalKpis','goals','','Faturamento, contribuição, gasto com publicidade e teto de TACOS.',true],
  ['diario','Acompanhamento diário e rota esperada','goalDaily','goals','','Receita, margem, publicidade ou TACOS, com a meta do indicador escolhido.',true],
  ['acumulado','Posição acumulada','goalAccumulated','goals','','Realizado até a data, esperado, teto e distância. Fonte diária incompleta não certifica o acumulado completo.',true],
  ['operacoes','Metas por operação','table','goals','Operação|Competência|Indicador|Meta|Realizado|Atingimento|Situação','Metas operacionais atuais e fotografia da comissão têm leituras distintas.',false],
  ['historico','Histórico de atingimento','line','goals','','Competências, indicadores e fontes.',false],
  ['origem','Origem, duplicidades e apuração','quality','goals','','Metas não são congeladas pelo fechamento da comissão.',false],
 ],['Competência','Operação','Indicador da meta','Diário / acumulado'],['Consultar comissão']);
 page('g-full','Decida reposição, trate rupturas e acompanhe o envio para Full.','operations',[
  ['resumo','Estoque e fluxo Full','stockKpis','stock','Disponível Full|Em processamento|A caminho|Risco de ruptura','CD, Full e em trânsito são quantidades distintas.',true],
  ['prioridades','Prioridades de reposição','stockTable','stock','SKU|Disponível Full|Venda/dia|Cobertura Full|A caminho|Em processamento|Necessidade|Sugestão envio|Alocado|Diferença|Situação','Sem vínculo de estoque não recebe saldo presumido.',true],
  ['cobertura','Cobertura e envelhecimento','bars','stock','Cobertura Full','Ruptura, baixo giro e estoque antigo.',false],
  ['simulacao','Cenário de reposição','projection','stock','','Horizonte 7/15/30/60 dias e segurança explícitos.',false],
  ['fontes','Vínculos e qualidade das fontes','quality','stock','','Data do estoque não comprova coleta completa.',false],
 ],['Horizonte','Segurança','Situação','Busca'],['Exportar reposição']);
 page('o-envios','Acompanhe modalidades e cobertura de registro por operação.','operations',[
  ['resumo','Volume por modalidade','shippingKpis','stock','Coleta|Flex|Full|Sem modalidade','Canal sem fonte de modalidade não é classificado por suposição.',true],
  ['operacoes','Envios por operação','shippingTable','stock','Operação|Modalidade|Quantidade|Dias registrados|Dias esperados|Referência|Variação|Cobertura','Ausência de modalidade fica identificada, sem desaparecer com a operação.',true],
  ['evolucao','Evolução dos envios','line','stock','','Dias selecionados e referência.',false],
  ['cobertura','Cobertura e dias sem registro','quality','stock','','Separe zero confirmado de informação ausente.',false],
 ],['Modalidade','Ponto','Busca'],['Exportar envios']);
 page('o-estoque','Veja o estoque por ponto, separando saldo físico e canais logísticos.','operations',[
  ['resumo','Posição de estoque','stockKpis','stock','Saldo CD|Disponível Full|Sem saldo|Vínculos pendentes','Uma fonte ausente não comprova estoque zero.',true],
  ['itens','Estoque e cobertura por SKU','stockTable','stock','SKU|Ponto|Saldo CD|Disponível Full|A caminho|Venda/dia|Cobertura CD|Situação|Origem|Atualização','Estoque físico único; não replicar o CD ao somar marketplaces.',true],
  ['pontos','Distribuição por ponto','bars','stock','Saldo CD','Posição por ponto, antes da sugestão de compra.',false],
  ['qualidade','Saldos negativos e vínculos','quality','stock','','Sem saldo, negativo, desconhecido, baixo e alto são estados distintos.',false],
 ],['Situação','Ponto','Busca','Colunas'],['Exportar estoque']);
 page('o-projecao','Planeje demanda e necessidade com base, horizonte e estoque identificados.','operations',[
  ['resumo','Demanda e necessidade','stockKpis','stock','Unidades realizadas|Demanda projetada|Necessidade|Vínculos pendentes','Sem estoque vinculado, necessidade não é tratada como compra confirmada.',true],
  ['cenarios','Cenário de demanda','projection','stock','','Base observada ou dias corridos, fator de cenário e segurança.',true],
  ['produtos','Projeção por SKU','stockTable','stock','SKU|Unidades realizadas|Venda/dia|Demanda projetada|Saldo CD|Disponível Full|A caminho|Necessidade|Sugestão compra|Situação','Demanda bruta e arredondada permanecem distinguíveis.',false],
  ['canais','Participação dos canais','bars','commerce','Unidades','O mesmo SKU no conjunto selecionado.',false],
  ['origem','Histórico e qualidade da projeção','quality','stock','','Dias sem registro, janela anterior e vínculos.',false],
 ],['Base do ritmo','Horizonte','Fator do cenário','Dias de segurança','Busca'],['Exportar necessidade']);
 page('p-catalogo','Identidade do produto, estrutura e vínculos com o ERP em um só lugar.','catalog',[
  ['resumo','Saúde do catálogo','catalogKpis','catalog','Produtos|Sem custo|Sem NCM|Vínculos pendentes','Identidade por SKU; título não une produtos distintos.',true],
  ['catalogo','Catálogo de produtos','catalogTable','catalog','SKU|Título|GTIN|NCM|Tipo|Estrutura|ERP|Custo vigente|Situação','Variações, componentes, logística e associações no detalhe.',true],
  ['vinculos','Identidade, estrutura e ERP','table','catalog','SKU|GTIN|NCM|Componentes|ERP|Vínculo|Atualização','Comparação dos vínculos e versões.',false],
 ],['Busca','Tipo','Situação','Ponto','Colunas'],['Exportar catálogo','Ver detalhe do produto']);
 page('p-pendencias','Priorize custos ausentes, divergentes e versões que exigem revisão.','cost',[
  ['resumo','Pendências de custo','catalogKpis','catalog','Sem custo|Divergências|Em revisão|Vínculos pendentes','Pendência não é custo zero.',true],
  ['fila','Fila de revisão de custos','table','catalog','SKU|Título|Motivo|Custo atual|Custo proposto|Diferença|Responsável|Situação','Abra a origem antes de encaminhar para homologação.',true],
  ['origem','Origem e vigência','table','catalog','SKU|Origem|Competência|Vigência|Versão|Situação','Custo deve respeitar vigência.',false],
 ],['Motivo','Situação','Busca'],['Abrir homologação']);
 page('p-entradas','Revise entradas de compra e a composição do custo de aquisição.','cost',[
  ['resumo','Entradas em revisão','catalogKpis','catalog','Entradas|Em revisão|Aprovadas|Divergências','Aprovação nesta prévia não grava uma compra.',true],
  ['compras','Entradas de compra','table','catalog','Documento|Fornecedor|Data|SKU|Quantidade|Compra unitária|Frete|Imposto|Outros custos|Custo proposto|Versão|Situação','Composição por entrada, sem substituir pela lista de vendas.',true],
  ['historico','Histórico de versões da entrada','table','catalog','Documento|Versão|Responsável|Atualização|Situação','Rastreabilidade da formação do custo.',false],
 ],['Fornecedor','Situação','Competência','Busca'],['Revisar entrada']);
 page('p-materiais','Controle insumos e sua participação no custo das embalagens.','pack',[
  ['resumo','Materiais e referências','catalogKpis','catalog','Materiais|Sem custo|Em revisão|Divergências','Unidade de compra e unidade de consumo explícitas.',true],
  ['materiais','Materiais','table','catalog','Material|Unidade compra|Unidade consumo|Conversão|Custo unitário|Fornecedor|Vigência|Situação','Papel, plástico, fita e outros insumos; não anúncios.',true],
  ['uso','Uso em embalagens','table','catalog','Material|Embalagem|Quantidade consumo|Custo aplicado|Versão','Composição rastreável.',false],
 ],['Unidade','Situação','Busca'],['Revisar material']);
 page('p-embalagens','Monte a composição e confira o custo por embalagem.','pack',[
  ['resumo','Composição de embalagens','catalogKpis','catalog','Embalagens|Sem custo|Em revisão|Divergências','Cada composição tem versão e vigência.',true],
  ['embalagens','Embalagens cadastradas','table','catalog','Embalagem|Tipo|Dimensões|Materiais|Quantidade consumo|Custo materiais|Custo preparo|Custo total|Versão|Situação','Abra os materiais e quantidades que formam o custo.',true],
  ['componentes','Componentes da embalagem','table','catalog','Embalagem|Material|Quantidade consumo|Custo unitário|Custo aplicado','Custo aplicado = quantidade × custo de consumo.',false],
 ],['Tipo','Situação','Busca'],['Ver composição']);
 page('p-preparacao','Acompanhe preparação e consumo de embalagens por lote.','prepare',[
  ['resumo','Preparação operacional','catalogKpis','catalog','Lotes|A preparar|Em preparo|Concluídos','Fluxo operacional separado do cadastro da composição.',true],
  ['lotes','Lotes de preparação','table','catalog','Lote|Embalagem|Quantidade|Consumo previsto|Consumo realizado|Responsável|Data|Situação','Consumo previsto e realizado não são confundidos.',true],
  ['consumo','Materiais consumidos no lote','table','catalog','Lote|Material|Quantidade consumo|Custo aplicado|Responsável','Rastreio por lote.',false],
 ],['Situação','Responsável','Busca'],['Ver lote']);
 page('p-homologacao','Compare versões, divergências e bloqueios antes da aprovação.','review',[
  ['resumo','Revisões para homologação','catalogKpis','catalog','Em revisão|Divergências|Bloqueios|Aprovadas','Botões de revisão demonstram o percurso; não publicam custos.',true],
  ['comparacao','Comparação de versões','table','catalog','SKU|Versão atual|Versão proposta|Custo atual|Custo proposto|Diferença|Bloqueio|Responsável|Situação','Aprovar exige resolver divergências e preservar vigência.',true],
  ['evidencias','Evidências e histórico de revisão','timeline','workflow','','Origem da alteração, conferência e justificativa.',false],
 ],['Situação','Responsável','Busca'],['Revisar versão']);
 page('p-apuracao','Confira o custo aplicado às vendas conforme a vigência.','saleCost',[
  ['resumo','Cobertura da apuração','catalogKpis','catalog','Vendas apuradas|Sem custo|Divergências|Em revisão','Margem e custo respeitam a data da venda.',true],
  ['apuracao','Custo aplicado às vendas','table','catalog','Data|Pedido|SKU|Quantidade|Versão custo|Compra unitária|Embalagem|Custo preparo|CTP|Custo aplicado|Situação','Custo por venda e composição, sem reescrever dados históricos automaticamente.',true],
  ['regras','Vigência e conciliação','quality','catalog','','Versão válida, fonte e vendas sem custo.',false],
 ],['Competência','Situação','Busca'],['Conferir custo da venda']);
 page('p-atualizacao','Revise alterações calculadas antes de preparar uma publicação.','effective',[
  ['resumo','Alterações de custo','catalogKpis','catalog','Produtos|Em revisão|Aprovadas|Bloqueios','Valores vigentes e propostos separados.',true],
  ['alteracoes','Atualização e vigência','table','catalog','SKU|Custo atual|Custo proposto|Diferença|Vigência|Versão|Origem|Situação','Não publica ou reprocessa a operação nesta proposta.',true],
  ['historico','Histórico das versões','timeline','workflow','','Responsável, mudança e vigência.',false],
 ],['Situação','Vigência','Busca'],['Revisar alterações']);
 page('p-integracao','Confira o que será associado ou publicado no ERP e as pendências.','publish',[
  ['resumo','Prontidão da integração','catalogKpis','catalog','Vinculados|Vínculos pendentes|Bloqueios|Aprovadas','Conexão e permissões reais não são alteradas na prévia.',true],
  ['publicacao','Conferência de publicação','table','catalog','SKU|ERP|Vínculo|Versão|Custo atual|Custo proposto|Última publicação|Bloqueio|Situação','A publicação exige a versão aprovada e a permissão original.',true],
  ['eventos','Eventos de integração','timeline','workflow','','Tentativa, retorno, divergência e confirmação.',false],
 ],['ERP','Situação','Busca'],['Conferir publicação']);
 page('pv-fila','Trate atendimentos com produto, pedido, responsável e retorno.','post',[
  ['resumo','Situação dos atendimentos','workflowKpis','workflow','Abertos|Atrasados|Aguardando retorno|Concluídos','Tempo e responsabilidade visíveis.',true],
  ['fila','Fila de atendimentos','workflow','workflow','Pedido|SKU|Motivo|Responsável|Prazo|Situação','Abra o caso para histórico, evidências e providências.',true],
  ['historico','Histórico e evidências','timeline','workflow','','Continuidade do atendimento.',false],
 ],['Motivo','Situação','Responsável','Busca'],['Abrir atendimento']);
 const taskCommon=[
  ['resumo','Pendências e retornos','workflowKpis','workflow','Abertos|Atrasados|Aguardando retorno|Concluídos','Ponto, carteira e responsável preservados.',true],
  ['fila','Fila de ações','workflow','workflow','Operação|SKU|Tratativa|Responsável|Prazo|Situação','Queima de margem e Sem giro são ações independentes.',true],
  ['carteiras','Comparar carteiras','table','workflow','Carteira|Responsável|Abertos|Atrasados|Concluídos|Retorno previsto','Carga, responsabilidade e progresso por carteira.',false],
  ['casos','Casos e continuidade','timeline','workflow','','Evidência → decisão → plano → retorno. Um histórico por caso.',false],
  ['economia','Referências econômicas','economy','workflow','','Valor em atenção orienta prioridade; não comprova ganho recuperado ou resultado realizado.',false],
 ];
 page('a-tarefas','Agenda de decisão e retorno, com leituras próprias para Direção, Coordenação e Gestor.','tasks',taskCommon,['Visão do papel','Situação','Responsável','Tratativa','Busca'],['Imagem para o grupo','Imagem detalhada']);
 page('a-promocoes','Acompanhe estratégia promocional, erosão de margem e retorno esperado.','tasks',[
  ...taskCommon.slice(0,2),['promocoes','Promoções em acompanhamento','table','workflow','Operação|SKU|Preço antes|Preço proposto|Margem antes|Margem proposta|Estratégia|Responsável|Prazo|Situação','Explique a estratégia de queima; não misturar com Sem giro.',false],...taskCommon.slice(3)
 ],['Situação','Responsável','Busca'],['Ver promoção']);
 page('a-ads','Acompanhe decisões de publicidade e o retorno da tratativa.','tasks',[
  ...taskCommon.slice(0,2),['eficiencia','Evidências da publicidade','table','ads','Operação|SKU|Investimento|TACOS|ACOS|ROAS|Pós-Ads|Situação','A tarefa conversa com os indicadores sem alterar a campanha.',false],...taskCommon.slice(3)
 ],['Situação','Responsável','Busca'],['Ver plano de Ads']);
 page('a-alinhamentos','Registre decisão, responsável e retorno de cada alinhamento.','align',[
  ['resumo','Alinhamentos e prazos','workflowKpis','workflow','Abertos|Atrasados|Aguardando retorno|Concluídos','Decisão com continuidade.',true],
  ['lista','Alinhamentos','workflow','workflow','Operação|Assunto|Decisão|Responsável|Prazo|Situação','Abra o histórico antes de concluir.',true],
  ['historico','Histórico das decisões','timeline','workflow','','Decisões e retornos preservados no caso.',false],
 ],['Situação','Responsável','Busca'],['Ver alinhamento']);
 page('a-pendencias','Resolva dependências com responsabilidade e prazo claros.','pending',[
  ['resumo','Pendências em aberto','workflowKpis','workflow','Abertos|Atrasados|Aguardando retorno|Concluídos','Pendência e bloqueio distintos.',true],
  ['lista','Pendências','workflow','workflow','Operação|Assunto|Dependência|Responsável|Prazo|Situação','Origem, evidência e retorno.',true],
  ['historico','Histórico e evidências','timeline','workflow','','Acompanhe a continuidade.',false],
 ],['Situação','Responsável','Busca'],['Ver pendência']);
 page('f-dre','Veja o resultado da competência e abra a composição quando precisar.','finance',[
  ['resumo','Resultado e cobertura da competência','financeKpis','finance','Saldo parcial disponível|Após investimentos conhecidos|Estrutura cadastrada|Equilíbrio do cenário','Saldo parcial não certifica fechamento ou caixa.',true],
  ['empresas','Resultado por empresa','companyCards','finance','','Custos de empresas sem vendas continuam participando.',true],
  ['ponte','Da receita ao saldo após estrutura','waterfall','finance','','Receita → custos e impostos → margem → investimentos adicionais → estrutura → saldo.',false],
  ['mensal','Competências em perspectiva','line','finance','','Mês ausente não vira resultado zero.',false],
  ['composicao','DRE detalhada','table','finance','Competência|Empresa|Faturamento|Custo plataforma|Imposto|CTP|Margem real|Investimentos adicionais|Estrutura|Saldo disponível|Cobertura','Bases de cada marketplace preservadas.',false],
  ['rateio','Custos diretos, compartilhados e rateio','table','finance','Competência|Empresa|Descrição|Tipo custo|Valor|Critério rateio|Valor atribuído','Marketplace isolado mostra contribuição antes da estrutura.',false],
  ['investimentos','Investimentos e repasse','table','finance','Operação|Publicidade|Afiliados|Lives|Já no líquido|Investimento adicional','Não descontar novamente o que está incorporado ao líquido.',false],
  ['eventos','Devoluções e eventos de apuração','table','finance','Data|Operação|Pedido|Evento|Valor|Tratamento','Eventos separados das vendas finalizadas.',false],
  ['fontes','Fontes, cobertura e fechamento','quality','finance','','Carga recente não certifica fechamento.',false],
 ],['Competência','Comparar competências','Período personalizado'],['Registrar custos','Importar pacote de custos']);
 page('f-comissao','Confira a composição publicada e a situação da apuração, separadas da rentabilidade atual.','reading',[
  ['resumo','Comissão publicada','commissionKpis','finance','Bônus registrado|Em apuração|Fotografias fechadas|Pendências','Bônus registrado não comprova pagamento.',true],
  ['operacoes','Comissão por operação','table','finance','Operação|Competência|Margem publicada|Metas atingidas|Bônus registrado|Situação|Pendências','Fotografia fechada não congela a leitura das metas operacionais.',true],
  ['composicao','Composição oficial da comissão','table','finance','Operação|Indicador|Peso|Meta|Realizado publicado|Atingimento|Bônus registrado','Preserva os valores publicados.',false],
  ['atual','Pós-Ads atual das vendas','kpis','commerce','Faturamento|Pré-Ads|Publicidade|Pós-Ads','Leitura atual separada da fotografia da comissão.',false],
  ['historico','Histórico da apuração','timeline','finance','','Versões, fechamento e pendências.',false],
 ],['Competência','Operação','Situação'],['Conferir Pós-Ads atual']);
 page('f-fechamento','Confira pendências e a fotografia de cada competência antes de fechar.','base',[
  ['resumo','Situação do fechamento','commissionKpis','finance','Em apuração|Fotografias fechadas|Pendências|Divergências','O calendário não fecha automaticamente a competência.',true],
  ['conferencia','Conferência do fechamento','table','finance','Operação|Competência|Vendas conferidas|Publicidade conferida|Custos conferidos|Pendências|Situação','Bloqueios explícitos antes da confirmação.',true],
  ['fotografia','Fotografia e versões','table','finance','Competência|Versão|Responsável|Atualização|Margem publicada|Bônus registrado|Situação','Snapshot distinto da consulta atual.',false],
  ['historico','Histórico do fechamento','timeline','finance','','Responsável, conferência e reabertura.',false],
 ],['Competência','Situação'],['Conferir competência']);
 page('f-custos','Consulte custos cadastrados, competência e critério de distribuição.','base',[
  ['resumo','Custos por competência','financeKpis','finance','Estrutura cadastrada|Custos diretos|Custos compartilhados|Pendências','Ausência de lançamento não confirma custo zero.',true],
  ['lancamentos','Custos cadastrados','table','finance','Competência|Empresa|Descrição|Tipo custo|Valor|Critério rateio|Origem|Situação','Custos e importação mantêm sua trilha de conferência.',true],
  ['distribuicao','Distribuição por empresa','bars','finance','Valor atribuído','Custos diretos e compartilhados.',false],
  ['fontes','Origem e conferência de pacotes','quality','finance','','Campos e duplicidades antes da importação.',false],
 ],['Competência','Empresa','Tipo custo','Busca'],['Registrar custo','Importar pacote']);
 page('f-carteiras','Consulte a composição das carteiras e a responsabilidade das operações.','base',[
  ['resumo','Composição das carteiras','workflowKpis','workflow','Carteiras|Operações|Responsáveis|Vínculos pendentes','Vínculo e vigência respeitam o ponto.',true],
  ['carteiras','Carteiras e operações','table','workflow','Carteira|Ponto|Operação|Responsável|Vigência|Situação','Perfil e restrição reais continuam na aplicação original.',true],
  ['historico','Histórico de vínculos','timeline','workflow','','Alterações de responsabilidade e vigência.',false],
 ],['Ponto','Responsável','Situação'],['Conferir carteira']);
 const kinds=[...new Set(Object.values(pages).flatMap(p=>p.widgets.map(w=>w.kind)))];
 return{version:3,pages,sources,kinds,sourceRoot:'Grupo Bsan/1 - Gestão de Dados/Pipeline',notice:'Dados fictícios. Mapa de apresentação revisável; não certifica equivalência funcional com a aplicação publicada.'};
});
