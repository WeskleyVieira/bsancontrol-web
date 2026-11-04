# Gerencial — recuperação do fluxo no design atual

Entrega de 04/11/2026. Base: b66dfa6. A referência funcional é o código anterior preservado no HTML e no histórico do Gerencial, incluindo `_renderGerProdutos`, `_renderGerPublicidade`, as réguas de situação e os controles de operação. Os prints ajudaram a identificar o problema; o CSS antigo não foi reinstalado.

| Seção | Problema da revisão anterior | Resultado desta entrega |
|---|---|---|
| Panorama | Margem antes Ads pouco visível; pedidos, ticket e unidades separados no fim; donuts desalinhados por cabeçalhos de alturas diferentes. | Seis cards no topo: faturamento, margem antes Ads, Ads adicional, margem após Ads, pedidos com ticket e unidades. Percentuais junto das duas margens. Quadros dos donuts alinhados, com altura própria do gráfico. Composição detalhada recolhível. |
| Vendas da operação | Aprofundamento do SKU redirecionava a outra página. | Raio-X junto do detalhe da linha, preservando a análise. Busca, situação, abertura de custos, paginação e exportação existentes mantidas. |
| Diagnóstico | Resumo e tabela exigiam passos adicionais para explorar produtos. | Cards abrem a ação correspondente e a linha abre Raio-X. Prioridades e regras de ação existentes preservadas. |
| Anúncios | TACOS oculto nas colunas completas; composição, situação e sinais perderam força visual. | Relevância A/B/C e saúde em cards, selos de situação, filtros por situação/sinais, participação sob os valores, preço/custo/margem por unidade e TACOS essenciais. Raio-X e Detalhar junto do título, sem rolar até a última coluna. |
| Publicidade | Informações de fonte dominavam a leitura; faltavam a agenda de situações e a próxima análise. | Seis indicadores com TACOS e margem após Ads, cards de revisão por situação, orientação por linha e fontes recolhíveis. Orçamento, ROAS objetivo e perdas visíveis na leitura essencial das campanhas. Raio-X por anúncio/SKU vinculado. |
| Metas | Fluxo já preservado. | Navegação e controles conferidos; regras, pesos e bônus não alterados. |
| Full | Operação e relação já preservadas. | Reposição, horizontes e gráficos de apoio conferidos. Raio-X disponível junto do produto, sem alterar posição ou sugestão de envio. |

## Raio-X em pop-up

Abre sobre a página atual; fechar ou pressionar Escape retorna à mesma análise. Permite escolher SKU quando há variações vinculadas, início/fim, atalhos de 30/90/180 dias, operação atual ou operações autorizadas do ponto, evolução diária/mensal e faturamento/unidades.

O comparativo mostra a margem percentual do produto contra a margem agregada dos demais SKUs no mesmo período e escopo, posição por percentual, participação na margem, unidades e valores por operação. A referência exclui o próprio SKU e usa margem total / base total, sem média simples de percentuais. Temu conserva a base líquida. A leitura utiliza a margem registrada do Gerencial antes do Ads adicional; no TikTok, mídia e afiliados já estão no líquido. Não se apresenta esse comparativo como lucro final após todos os custos.

`GET /api/gerencial/raiox` faz duas consultas agregadas parametrizadas. Datas exatas, SKU obrigatório e janela máxima de três anos são validados. Exige Gestão; gestor é restringido às operações da carteira também no servidor. Comparação vazia não vira zero nem classificação de rentabilidade. Não entrega a base de outros produtos ao navegador. O modo arquivo usa os dados locais carregados e o mesmo modelo.

A janela não substitui `DETALHE`, datas compartilhadas, operação ou filtros de origem. Requisições substituídas são canceladas; resposta antiga não sobrescreve outro SKU. Falha limpa os resultados anteriores e oferece nova tentativa. Trata-se da base sincronizada do BsanControl, sem consulta instantânea ao marketplace.

## Regras preservadas

- Tema, tipografia, superfícies e tokens atuais; positivos e negativos continuam distintos.
- Situações recuperam faixas do modelo: prejuízo abaixo de zero, corrigir/peso morto abaixo de 10%, estável até 20%, estrela/escalar/nicho a partir de 20%, conforme relevância. São referências operacionais; Metas conserva os objetivos oficiais.
- Queima usa a regra histórica existente: relevância A/B, piso de margem 10%, queda superior a 5 p.p. contra a referência saudável.
- Ads rateado uma única vez entre SKUs; ausência de vínculo produz TACOS indisponível e não zero confirmado. Zero informado continua 0%. Afiliados já no líquido não recebem nova dedução.
- Publicidade mantém contribuição estimada identificada. Os cards orientam revisão; não pausam campanhas, alteram preço/orçamento nem prometem dinheiro recuperável.
- Nenhuma mudança de banco, concessão de acesso, lançamento comercial, fechamento ou geração de demandas nesta entrega.

## Validação

312 testes automatizados aprovados, incluindo 13 novos casos de datas, parâmetros, carteira, SKU exato, ponto, empresa/canal, Temu, referência ponderada pela base, ausência, faixas, sinais e autorização.

Homologação no navegador com banco fictício isolado: sete sub-abas, claro/escuro e 390 px, tamanho/alinhamento dos donuts, TACOS essencial/completo sem duplicação, filtros por situação, abertura e fechamento do Raio-X, mudanças independentes de período/alcance/granularidade, gestor e pedido forjado fora da carteira. Casos adicionais: múltiplos SKUs, erro/repetição, resposta atrasada, alavancas de campanha, Shopee/Temu/TikTok e abertura pelo Full. Sem erros JavaScript nos fluxos conferidos.

Contrato SQL conferido também no PostgreSQL real, somente em leitura, sem exportar dados comerciais. Medição pontual do backend: 154 ms para um dia/uma operação; não é promessa de tempo para qualquer janela ou conexão.

Aceitação operacional pela equipe continua sendo uma etapa de uso. Esta entrega não certifica a conciliação financeira das plataformas nem altera a coleta das fontes.

O Pipeline deve copiar `gerencial-raiox.js` na raiz e `visual/gerencial-raiox-ui.js`, além dos módulos atualizados e do contrato de acessos. O integrador inclui o pop-up depois de `gerencial.js`; a fonte local e os embeds são atualizados sem substituir as bases privadas.
