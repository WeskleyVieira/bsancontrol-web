# Fase 3 — Diagnóstico, Anúncios, Publicidade e Full

Registro histórico. A recuperação do fluxo visual e operacional em 04/11/2026, mantendo o design atual, está em [GERENCIAL-RESTAURACAO.md](GERENCIAL-RESTAURACAO.md). Situações, composição e agenda foram recuperadas com fontes e limites explícitos; TACOS voltou à leitura essencial e Raio-X passou a abrir em pop-up.

Autorizada pelo usuário em 01/11/2026. Base: ccb970a22eac6f34431127731663103163e3e035. Referência visual: Metas e a revisão de Visão Geral/Panorama.

## Correção da etapa de Vendas

Vendas, Raio-X e Vendas da operação receberam auditoria funcional de filtros, margens, fontes, status, CSV, paginação e carteira, com 12 testes específicos e validação no navegador. Porém, a regra `.ds-active-* .bc-reading-guide { order:99 }` colocou os três guias no fim. A revisão visual ficou inconsistente com o padrão agora aprovado. Esta fase devolve os guias ao topo e confere as três páginas; a auditoria técnica anterior não é apresentada como aceitação gerencial concluída.

## Entregas por página

| Página | Pergunta gerencial | Implementação |
|---|---|---|
| Diagnóstico | Onde investigar e qual evidência sustenta a prioridade? | Síntese visível, lista ordenável por impacto registrado, evolução comparável por item, margem negativa antes/depois do Ads e limitações de vínculo. Cenário de margem digitado pelo gestor separado de objetivo oficial; sem promessa de recuperação ou pausa automática. Devoluções tratadas como movimentações do recorte, sem falsa taxa por coorte. |
| Anúncios | Quais itens compõem o resultado e como custo/mídia alteram a margem? | Visões por anúncio/SKU, busca, filtros, ordenação, abertura e CSV do filtro. Margem/unidade, contribuição e mídia com alcance explícito. Classificação ABC conserva o critério de origem; faixa percentual não equivale a saúde nem autorização para escalar/despublicar. Ads de um anúncio repartido entre SKUs sem duplicar gasto. |
| Publicidade | Quanto foi investido, que receita foi atribuída e que parte é estimativa? | Separa relatório de mídia, Ads alocado na margem e afiliados já no líquido. ACOS/ROAS com denominadores presentes, estimativa de contribuição com fórmula visível, tabela por anúncio/campanha e diário com cobertura. TikTok conserva mídia no líquido, sem segunda dedução. CSV nomeia estimativas e preserva zero/ausência. |
| Full | O que preparar, o que falta e qual posição de estoque sustenta a sugestão? | Posição/data da relação visíveis, resumo operacional, navegação entre envio/não repor/parado/antigo/desempenho/pendências e controles antes dos gráficos complementares. Horizonte, Olist, busca, CSV e ampliação preservados. Risco de ruptura não é estoque zerado confirmado; simulações e custos previstos não são cobranças liquidadas. |

## Achados confirmados

- Diagnóstico associa margens abaixo de 10% e acima de 20% a vereditos universais, apresenta distância até 20% como lucro escapando e sugere escalada/pausa sem demonstrar todas as condições. Essas leituras devem ser referências explicitadas ou cenários, não objetivos oficiais inferidos.
- O cálculo de devoluções usa `A.linhas`, já restrita a vendas finalizadas por `_gerAgrega`. Assim não mede as devoluções da operação e não sustenta a taxa mostrada.
- Publicidade estima contribuição como receita atribuída × margem média − investimento. Mesmo com vínculo de anúncio, essa conta continua sendo estimativa, e não lucro causal confirmado nem valor recuperável.
- O caminho com apenas registros de afiliados pode subtrair novamente uma comissão já incluída no líquido. A nova leitura separa as fontes e impede a segunda dedução.
- Ads por SKU pode repetir integralmente o gasto de um anúncio em mais de um agrupamento. A nova apresentação aloca uma única vez e informa o rateio.
- Receita atribuída à publicidade, vendas marcadas como Ads, investimento do relatório e Ads alocado no Panorama têm alcances distintos. A tela deve nomeá-los e mostrar diferenças, sem forçar igualdade artificial.
- Full combina posição da relação e giro da âncora com o período do cabeçalho. O usuário precisa saber qual filtro afeta cada leitura. Em ruptura inclui estoque que pode acabar em sete dias, não apenas estoque já zerado.

## Processo e critérios de conclusão

1. Corrigir os três guias de Vendas e conferir busca, detalhe, Raio-X e exportação preservados.
2. Construir modelos de leitura testáveis para grupos, vínculos de Ads, cenários, fontes e posição Full, reutilizando as regras financeiras de origem.
3. Aplicar hierarquia e componentes comuns: guia no topo, contexto, indicadores, leitura orientadora, controles, evidências e apoio. Cor discreta acompanha o fato; não substitui explicação.
4. Validar com dados fictícios: margens negativas, referência ausente, devolução de outro período, Ads sem vínculo, afiliados sem mídia paga, campanha sem anúncio, TikTok, Full sem posição e cobertura parcial. Conferir carteira, temas, celular, CSV e ampliação.
5. Instalar com backup e guardas de concorrência, preservar as sete bases, regenerar e conferir o pacote publicado. A aceitação gerencial com dados reais continua pendente.

Não há coleta de marketplace, reprocessamento financeiro, alteração de bônus, fechamento ou concessão de acesso nesta fase. Não se cria uma nova fila de demandas: Acompanhamento continua sendo o lugar de registrar e executar tratativas.

## Resultado implementado

- Diagnóstico mostra margem negativa após Ads vinculado, redução/avanço comparável e movimentações devolvidas. A coluna O que conferir distingue margem já negativa antes da mídia, efeito do Ads vinculado e queda de margem com crescimento de faturamento, sem decretar uma causa. A referência simulada é aplicada por botão próprio, pode ser limpa e não grava metas.
- Os antigos rótulos universais Estrela, Escalar, Peso morto e Lucro escapando foram substituídos por evidências, filtros e cenário explícito. ABC e a referência histórica do modelo permanecem consultáveis, sem representar objetivo oficial ou julgamento automático de saúde.
- Anúncios aloca Ads uma única vez entre SKUs e informa a distribuição. Um anúncio com vários SKUs permite abrir o Raio-X de cada SKU na evidência. A busca considera os SKUs agrupados. CTP ausente permanece indisponível; zero informado continua zero. Os resumos da operação e os totais do filtro são identificados separadamente.
- As evidências têm páginas de 50 linhas, enquanto o CSV exporta o filtro inteiro. Títulos são texto na tela e fórmulas são neutralizadas no CSV; valores monetários negativos conservam sinal e duas casas.
- Publicidade separa investimento/atribuição do relatório, Ads alocado na margem e afiliados no líquido/relatório/abertura diária. Relatório ausente não é zero confirmado. TACOS registrado fica indisponível quando falta registro de Ads e conserva o aviso de cobertura. A estimativa por campanha/anúncio mostra sua referência de margem e não recebe o nome de lucro ou desperdício recuperável.
- TikTok exibe cobranças por SKU com faturamento, Ads, afiliados e margem registrada. Mídia e afiliados já no líquido não são subtraídos outra vez. O relatório de campanha fica como conferência, separado da margem das vendas.
- Full mantém reposição, não repor, parado, antigo, desempenho e pendências. Data/âncora e sugestão vêm antes das decisões. Estoque sem posição não recebe prazo de ruptura. O CSV do galpão conserva todas as prioridades do horizonte; busca e tipo visual não limitam esse arquivo, e isso fica escrito junto do fluxo. Os gráficos têm títulos próprios e ampliação; unidades estimadas não são arredondadas antes de calcular a participação percentual.

## Evidências de validação

**76 testes aprovados:** 55 anteriores e 21 específicos do novo modelo/integração. Incluem R$ 85,01 em dois SKUs, gasto alocado uma única vez, fonte só de afiliados, TikTok, Temu, custo ausente, receita sem identificador, referência sem registros, páginas que não truncam exportação e simulação sem mudar a margem.

Conferência no navegador com usuários e dados fictícios em banco isolado:

- Vendas, Raio-X e Vendas da operação: Como ler primeiro no conteúdo, com ordem visual -1; fluxo e fontes anteriores mantidos.
- Diagnóstico: conta com R$ 10.808,00 de faturamento, margem -R$ 194,88 e redução comparável de R$ 1.534,73; evidência, orientação e filtro coerentes. Uma devolução de outra operação é contada na base de movimentações. Cenário de 20% aplicado e limpo sem alterar margem ou objetivo oficial.
- Anúncios: três SKUs do mesmo anúncio repartem R$ 1.000,00 em R$ 823,60, R$ 88,97 e R$ 87,43. CSV baixado e conferido; valor e percentuais com duas casas. Texto contendo HTML exibido como texto. Temu conserva 15,00% sobre líquido.
- Publicidade: relatório por campanha de R$ 1.100,00 separado da alocação de R$ 1.000,00 vinculada aos itens e de R$ 50,00 sem vínculo no relatório por anúncio. Afiliados sem Ads pago não fabricam investimento zero. No TikTok, R$ 10,00 de Ads e R$ 5,00 de afiliados já no líquido conservam margem registrada de R$ 20,00, sem nova dedução.
- Full: horizonte altera sugestão; posição ausente indicada; coluna do período utiliza a chave normalizada de SKU quando falta a chave pré-calculada. Conferidas as leituras de não repor, antigo, desempenho e pendências, além da reposição. Gráficos ampliados com tabela de valores.
- Carteira do Gestor fictício limitada a Bsan Shop/ML e Shopee; DRE ausente. Temas claro/escuro e largura de 390 px conferidos, com rolagem interna da tabela e sem transbordamento da página. Nenhum erro de console nos fluxos conferidos.

## Limites

A conciliação financeira oficial e a coleta das plataformas não foram certificadas por esta auditoria visual/funcional. O relatório mensal, a distribuição para margem, o diário e a cobrança podem ter alcances e cortes diferentes. Sem metadados confiáveis não se afirma completude ou liquidação. A cobertura de valores ausentes que já foram convertidos em zero pela origem não pode ser reconstruída pela interface.

Full usa a relação recebida e seus critérios; não recalcula capacidade concedida pelo marketplace, não confirma nota futura e não cria envio. A leitura histórica depende da janela carregada. As referências de negócio e os modelos externos permanecem nas fontes de origem; somente a apresentação/derivação de leitura desta fase foi revisada. Conferência gerencial dos dados reais permanece pendente.

Conferência final do inventário: mantidos ROAS diário (com denominador ausente distinto de zero), participações de faturamento/margem/unidades nas colunas completas e no CSV, status/visitas das campanhas e referências de cadastro/primeira venda disponível no detalhe. Esses campos não são convertidos em um veredito automático de saúde.
