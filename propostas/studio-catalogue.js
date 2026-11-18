(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BCStudioCatalogue=factory();})(typeof window==='object'?window:this,function(){'use strict';
 const definitions=[
 ['resultados/overview','Receita, volume e contribuição das operações.','dashboard','faturamento|unidades|pedidos|pos-ads','evolucao|trajetoria|contribuicao|atencao|operacoes'],
 ['resultados/diario','Compare o desempenho do dia e encontre as contas que exigem atenção.','dashboard','faturamento|unidades|pedidos|pos-ads','placar|ritmo|posicao|evolucao'],
 ['resultados/marketplaces','Compare canais, rentabilidade e os produtos que sustentam o resultado.','dashboard','faturamento|unidades|pedidos|pos-ads','faturamento por canal|margem|top|produtos'],
 ['resultados/abc','Identifique os produtos que concentram o resultado do recorte.','dashboard','faturamento|pos-ads|unidades|itens','pareto|participacao|produtos para analisar'],
 ['resultados/forecast','Acompanhe a rota das operações e dos produtos até o fechamento.','dashboard','realizado|projecao|esperado|rota','projecao|historico|cenario|produtos|rota'],
 ['vendas/vendas','Consulte as vendas e investigue cada etapa do resultado.','list','faturamento|unidades|pedidos|pos-ads|margem','vendas'],
 ['vendas/raiox','Compare o mesmo SKU entre operações e aprofunde seu desempenho.','detail','faturamento|unidades|pedidos|pos-ads','vendas e margem|operacoes|situacoes'],
 ['gerencial/panorama','Resultado, evolução e prioridades da operação.','dashboard','faturamento|unidades|pedidos|pos-ads','faturamento e margem|leitura da operacao|modalidade'],
 ['gerencial/ger-vendas','Confira as vendas da operação, do anúncio à composição financeira.','list','faturamento|unidades|pedidos|pos-ads|margem','vendas'],
 ['gerencial/diag','Uma agenda de prioridades para investigar e tratar a operação.','dashboard','itens|faturamento|margem|prioridade','agenda|prioridades|queima|tracao|diagnostico'],
 ['gerencial/produtos','Acompanhe anúncio ou SKU, posição e contribuição para a operação.','list','faturamento|itens com vendas|pos-ads|margem negativa','evolucao|resultado por anuncio|resultado por sku'],
 ['gerencial/previsao','Compare o realizado e a projeção de cada anúncio ou SKU com o esperado.','dashboard','realizado|projecao|esperado|rota','rota|projecao|anuncios|sku|acompanhamento'],
 ['gerencial/ads','Leia mídia e afiliados com suas métricas e composições próprias.','dashboard','investimento|publicidade|receita|tacos','evolucao|campanhas|anuncios|midia'],
 ['gerencial/metas','Acompanhe o objetivo, o ritmo e a posição acumulada do mês.','dashboard','hoje|semana|posicao|objetivo','resumo dos objetivos|historico|hoje|operacoes'],
 ['gerencial/full','Antecipe reposições e confira os itens que exigem ação no Full.','dashboard','itens|unidades|reposicao|estoque','necessidade|reposicao|itens|full'],
 ['operacao/envios','Acompanhe volume e modalidades de envio no período.','dashboard','envios|unidades|coleta|flex','evolucao|modalidade|envios'],
 ['operacao/estoque','Confira disponibilidade, cobertura e prioridades do estoque.','dashboard','disponivel|estoque|itens|cobertura','prioridades|estoque|cobertura'],
 ['operacao/projecao','Relacione o ritmo de saída à disponibilidade e à necessidade de reposição.','dashboard','estoque|necessidade|cobertura|itens','projecao|reposicao|cobertura'],
 ['cadastro-produtos/cadastro-catalog','Cadastro do ponto, qualidade das fichas e pendências.','form','cadastros|logistica conferida|logistica para conferir|custo','catalogo'],
 ['cadastro-produtos/cadastro-tasks','Complete os custos e confira as pendências do cadastro.','form','custo|pendencias','pendencias'],
 ['cadastro-produtos/cadastro-entries','Registre compras e acompanhe a composição dos custos.','form','','entradas'],
 ['cadastro-produtos/cadastro-materials','Materiais, unidades de compra e histórico de custos.','form','','materiais'],
 ['cadastro-produtos/cadastro-pack','Composições de embalagem e seus custos de referência.','form','','embalagem'],
 ['cadastro-produtos/cadastro-prep','Fichas de preparo, insumos e consumos usados pela equipe.','form','','preparacao'],
 ['cadastro-produtos/cadastro-review','Confira a qualidade dos custos antes de homologar uma versão.','form','','conferencia|versoes'],
 ['cadastro-produtos/cadastro-sales','Consulte a apuração dos custos na data de cada venda.','form','','apuracao'],
 ['cadastro-produtos/cadastro-sync','Confira a atualização e a cobertura do catálogo por conta.','form','','atualizacao|cobertura'],
 ['cadastro-produtos/cadastro-publication','Acompanhe a preparação e a integração dos dados.','form','','integracao'],
 ['pos-venda/pv-fila','Priorize atendimentos e acompanhe prazo, responsável e continuidade.','list','abertos|atrasados|hoje|aguardando','atendimentos|fila|prioridade'],
 ['acompanhamento/tarefas','Veja o que precisa de ação, quem acompanha e o próximo retorno.','dashboard','demandas|pendentes|atrasadas|resolvidas','prioridades|fila|tarefas|responsaveis'],
 ['acompanhamento/promos','Acompanhe a execução e o efeito das promoções na operação.','dashboard','demandas|pendentes|atrasadas|resolvidas','promocoes|prioridades|fila'],
 ['acompanhamento/ac-ads','Acompanhe as decisões e os retornos das tratativas de publicidade.','dashboard','demandas|pendentes|atrasadas|resolvidas','publicidade|prioridades|fila'],
 ['acompanhamento/alinhamentos','Pedidos, evidências e próximos retornos entre os responsáveis.','list','a fazer|recobrar|acompanhamento|concluidas','alinhamentos'],
 ['acompanhamento/pendencias','Confira as pendências das fontes e a responsabilidade pelo retorno.','list','no painel|sem total|leitura','pendencias'],
 ['financeiro/dre','Leia contribuição, investimentos e estrutura por competência.','dashboard','resultado|saldo parcial|margem real|estrutura','resultado por empresa|competencias|evolucao|saldo'],
 ['financeiro/comissao','Consulte a apuração publicada e sua composição por operação.','dashboard','bonus|comissao|operacoes|margem','comissao por operacao|composicao|apuracao'],
 ['financeiro/gestao-fechamento','Confira a competência e acompanhe o fechamento das operações.','form','','fechamento'],
 ['financeiro/gestao-custos','Cadastre, confira e acompanhe os custos da competência.','form','','custos'],
 ['financeiro/gestao-carteiras','Organize as carteiras e consulte o histórico dos responsáveis.','form','','carteiras']
 ];
 const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
 const profiles=Object.fromEntries(definitions.map(([route,purpose,flow,metrics,essential])=>[route,{route,purpose,flow,metrics:metrics.split('|').filter(Boolean),essential:essential.split('|').filter(Boolean)}]));
 const sizes={compact:3,third:4,half:6,wide:8,full:12};
 function profile(route){return profiles[route]||{route,purpose:'Acompanhe o resultado e aprofunde a análise.',flow:'dashboard',metrics:[],essential:[]};}
 function rank(item,p){if(item.sequence!=null)return item.sequence;if(item.kind==='kpi'){const title=normalize(item.title).replace(/^margem /,''),n=p.metrics.findIndex(k=>title===k||title.startsWith(k+' ')||title.startsWith(k+' ·'));return n<0?9:n;}if(item.kind==='form')return 10;if(item.kind==='chart')return 20;if(item.kind==='signal')return 21;if(item.kind==='list')return 23;if(item.kind==='table')return 30;return 40;}
 function defaultSize(item){if(item.layoutSize)return item.layoutSize;if(item.kind==='kpi')return'compact';if(['table','form','empty','help','embed'].includes(item.kind)||normalize(item.title)==='prioridades do recorte'||normalize(item.title)==='operacoes e objetivos do mes')return'full';if(/modalidade|participacao/.test(normalize(item.title)))return'third';if(/relacao entre|pareto|historico|rota|faturamento e margem/.test(normalize(item.title)))return'wide';return'half';}
 function defaults(items,p){const ranked=items.slice().sort((a,b)=>rank(a,p)-rank(b,p)),counts={},kpiKeys=new Set();let essentialKpis=0;return ranked.map(item=>{if(item.n?.id==='ac4-continuity-summary')return{...item,size:'full',essential:false};counts[item.kind]=(counts[item.kind]||0)+1;const title=normalize(item.title).replace(/^margem /,''),key=title.match(/^(faturamento|unidades|pedidos|pos-ads|pre-ads)/)?.[0]||title;const firstKpi=item.kind==='kpi'&&!kpiKeys.has(key)&&essentialKpis<4;if(firstKpi){kpiKeys.add(key);essentialKpis++;}const chosen=item.kind!=='kpi'&&item.kind!=='help'&&p.essential.some(k=>normalize(item.title).includes(k));return{...item,size:defaultSize(item),essential:item.required||firstKpi||item.kind==='signal'||item.kind==='chart'&&counts.chart<=2||item.kind==='table'&&counts.table===1||item.kind==='list'&&counts.list===1||chosen&&counts[item.kind]<=4};});}
 return{profiles,profile,normalize,rank,sizes,defaults,defaultSize};
});
