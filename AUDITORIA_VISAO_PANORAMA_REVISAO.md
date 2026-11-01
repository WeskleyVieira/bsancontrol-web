# Visão Geral e Panorama — revisão da auditoria

Situação: implementação autorizada pelo usuário e validada tecnicamente em 01/11/2026. Base examinada: commit `cabbb1e99f7483ced12a44e3030f2caf4eb2fcfb`. A aceitação gerencial dos dados oficiais permanece com o usuário.

## Fase autorizada — entregas e critérios de conclusão

| Passo | Entrega concreta | Como conferir |
|---|---|---|
| 1. Orientação e hierarquia | Como ler no topo das duas páginas; síntese visível imediatamente após os indicadores; operações antes dos gráficos na Visão Geral; apoio mensal separado. | Sinais não dependem de expandir um bloco no fim da página. Ajuda abre no topo, sem perder o contexto. |
| 2. Pré-diagnóstico do recorte | Evolução conjunta de faturamento e margem; maior redução e maior avanço de margem entre operações comparáveis; margem negativa registrada e maior contribuição atual. | Mesma base dos cartões e tabela. Operação sem referência não recebe crescimento fictício sobre zero. Melhora ainda negativa continua indicada. Sem cortes universais de margem, taxas ou concentração. |
| 3. Panorama da conta | Referência com regra e datas; composição da margem antes/depois do Ads; dependência dos principais anúncios/SKUs; cobertura de IDs para pedidos e ticket; limites da publicidade. | Zero, ausência, rateio e pesos diários são distintos. Ticket usa receita de linhas com ID e pedidos únicos. Não ocorre desconto adicional de afiliados já no líquido. |
| 4. Validação e publicação | Testes dos modelos, recortes com dados fictícios, navegação por carteira, temas, celular, gráficos ampliados e estado vazio. Integração idempotente, backup e conferência da publicação. | Sem nova carga de detalhe na Visão Geral, sem alteração de permissões ou reprocessamento financeiro. Demais áreas preservadas. Revisão do usuário permanece pendente após a entrega. |

Indicadores novos são derivados de bases já carregadas. Os sinais ajudam a escolher onde investigar; não substituem metas da operação, não atribuem causas sem evidência e não criam demandas automaticamente.

**Conferência adicional da implementação:** a API atual de `/api/dataset` já limita `fat`, `mc`, custos e unidades às vendas finalizadas. O achado anterior sobre margem agregada em todas as movimentações aplica-se a bases legadas/offline e não descreve esse contrato atual da API. A implementação conserva os valores financeiros e declara a origem, sem somar `mcMetas` à margem das vendas. `mcMetas` tem outra regra e continua em suas áreas.

## Correção de escopo

O usuário esclareceu que esperava receber toda a auditoria e as sugestões de Visão Geral e Panorama antes de avançar para outras áreas. A implementação técnica e seus testes não encerram a avaliação da leitura gerencial. A sequência retorna a essas duas páginas; a etapa seguinte não é a prioridade atual.

A intenção anterior de antecipar os valores reduziu a visibilidade de informações que orientam sua interpretação. O guia de leitura e a síntese de sinais têm funções distintas: o primeiro ajuda a entender a tela; a segunda integra a leitura principal do resultado.

## Achados confirmados no código

| Prioridade | Achado | Consequência para o gestor | Proposta |
|---|---|---|---|
| Alta | Na Visão Geral, diagnóstico e destaques ficam em `details` fechado depois da evolução, composição e tabela de operações. No Panorama, os alertas também ficam em `details` fechado. | O gestor precisa percorrer os dados antes de encontrar a síntese que deveria orientar sua leitura. | Síntese visível logo após os indicadores principais. Recolher a evidência extensa, mantendo o sinal e seu alcance à vista. |
| Média | O guia Como ler foi levado para o fim; no Panorama há ordenação CSS explícita para isso. | A ajuda é encontrada depois da tentativa de interpretar os dados. | Acesso permanente junto do título, com abertura local, sem ocupar um bloco extenso antes dos números. |
| Alta | `renderDiagnosis` conserva `META_MARGEM = 15` e o texto “A régua é uma só”. Há ainda cortes de líquido/faturamento de 65%, margem de empresa de 10% e tendências de -15%/+10%. | Regras gerais podem virar diagnóstico de uma operação cujo modelo, meta, maturidade ou base de cálculo é diferente. | Usar objetivos específicos quando existirem, comparações identificadas e descrição factual quando não houver referência validada. Sem classificar automaticamente como bom/ruim só por um corte genérico. |
| Alta | O diagnóstico usa `by(rows,...)` e `tot.fat` bruto; cartões/gráficos da Visão Geral usam `fatDe`/`fatMetas` quando disponíveis. | Percentual, liderança e tendência do diagnóstico podem não conciliar com a leitura principal, sobretudo quando existem outros status. | Definir o alcance de cada medida e compartilhar o mesmo modelo de dados entre sinal, indicador e gráfico correspondentes. Validar separadamente o efeito de devoluções e ajustes. |
| Alta | Há margens com alcances diferentes: Visão Geral agrega movimentações; Panorama usa vendas finalizadas e desconta Ads adicional. A base percentual da Temu também merece explicitação nas comparações. | Mesma palavra ou cor pode sugerir que valores de etapas e denominadores diferentes são diretamente equivalentes. | Nomear a etapa do resultado e mostrar sua composição. Decidir a política de comparação antes de impor um percentual único. Não reescrever regras históricas silenciosamente. |
| Alta | O diagnóstico associa líquido/faturamento abaixo de 65% a taxas de plataforma elevadas. | Diferenças de modelo, markup, créditos e outros componentes podem ser interpretados como comissão excessiva. | Mostrar a diferença registrada e aprofundar sua composição por canal; atribuir uma causa somente quando a abertura da fonte a comprovar. |
| Média | Produto campeão vem da base mensal consolidada de SKU, enquanto a página admite empresa, canal e intervalo exato. | Um destaque pode ser atribuído ao recorte que o gestor selecionou, embora pertença a outro alcance. | Separar e nomear o destaque consolidado ou usar uma fonte que suporte os filtros. Não misturá-lo à síntese principal do recorte. |
| Média | Panorama chama a participação dos cinco maiores anúncios de risco quando chega a 60%; chama uma queda de relevante a partir de -20%. | Concentração ou oscilação podem receber um julgamento sem considerar tamanho da carteira, sazonalidade ou estágio da operação. | Apresentar dependência e variação como fatos; qualificar atenção com objetivo, histórico comparável e contexto. |
| Média | Comparação automática do Panorama pode usar o intervalo anterior de mesma duração ou um mês anterior completo, dependendo do recorte. | O usuário pode supor comparação entre os mesmos dias dos meses ou entre meses encerrados. | Explicitar a regra e as datas junto das diferenças e permitir escolher a referência. Não comparar mês parcial com mês completo como se fossem equivalentes. |
| Alta | A identificação de Ads diário verifica a existência de registros no mês, sem comprovar a cobertura de todo o intervalo. A atualização exibida vem da carga de extras, não de uma coleta individual de cada fonte. | Série parcial e atualização recente de outra base podem transmitir uma certeza maior do que a disponível. | Distinguir diário, rateado e cobertura não comprovada. Exibir datas por fonte quando houver metadados confiáveis; caso contrário, declarar a limitação. |
| Média | `nped = peds.size || v.length`: com alguns pedidos sem ID, usa os IDs conhecidos; sem nenhum, usa linhas. Ticket divide toda a receita pelo resultado dessa contagem. | Linhas podem aparecer como pedidos e falta parcial de identificação pode distorcer o ticket. | Mostrar pedidos identificados e cobertura; calcular ticket do conjunto identificável ou indicar indisponibilidade. Não tratar uma linha como pedido por padrão. |
| Média | Existem expressões como Canal mais rentável, prejuízo e ausência de alertas que extrapolam uma medida parcial. | Margem registrada pode ser entendida como lucro final, ou falta de sinal como garantia de saúde da operação. | Usar nomes específicos: margem negativa registrada, contribuição para a margem e nenhum sinal identificado nos dados disponíveis. |

Esses achados são de estrutura e lógica de apresentação. Esta revisão não afirma que todos produziram divergência em um número oficial específico; isso exige conferir o recorte e as fontes reais. Também não redefine automaticamente o tratamento econômico de devoluções, cancelamentos ou custos da conta.

## Organização proposta — Visão Geral

1. Título, grupo/empresa/canal/período e acesso Como ler. Atualização curta, com alcance declarado.
2. Indicadores principais do resultado, com a etapa da margem e a referência de comparação identificadas.
3. Leitura do período, visível: o que melhorou, o que pede investigação e onde o impacto está concentrado.
4. Operações que explicam o resultado: abertura prioritária e acesso ao Panorama, preservando o recorte e as permissões. A tabela completa continua disponível.
5. Evolução diária e composição entre empresas/canais, para comprovar e explorar a síntese.
6. Metas mensais em contexto próprio, com competência e operações cobertas explícitas. O peso e a posição desse bloco devem acompanhar a finalidade escolhida para a página; não se presume que o faturamento de um intervalo longo seja comparável a uma meta de um único mês.
7. Tendência estatística, metodologia detalhada e destaques de alcance consolidado em consulta complementar.

## Organização proposta — Panorama

1. Operação, período, fonte/referência de comparação e acesso Como ler.
2. Resultado principal: faturamento, etapa da margem e percentual com base declarada.
3. Pré-diagnóstico visível da conta: sinais relevantes e limitações capazes de mudar a interpretação dos números.
4. Composição da margem das vendas até a margem após Ads apurado, com indicação de cobertura e rateio. Custos da apuração final continuam em suas áreas.
5. Evolução e composição das vendas, incluindo envio e publicidade conforme as fontes disponíveis.
6. Pedidos, unidades, ticket e detalhe de apoio, com cobertura de identificação. A posição desses indicadores pode subir se a decisão principal do gestor exigir volume/ticket.

Essa ordem é uma proposta de leitura para as duas páginas examinadas, não uma regra fixa para todas as áreas do BsanControl.

## Como apresentar o pré-diagnóstico

Cada sinal deve mostrar: o fato observado, o valor/variação, a operação afetada, o período e o aprofundamento disponível. Quando a fonte ou a referência não permitir concluir, a limitação deve acompanhar o sinal.

Exemplos de redação e conteúdo, sem valores oficiais:

- Faturamento aumentou, mas a margem em reais caiu. Abrir as operações que mais contribuíram para essa diferença.
- Uma operação concentra a maior parte da redução de margem no recorte comparável. Abrir seu Panorama.
- Há anúncios com margem negativa registrada. Explorar os anúncios e os itens que a compõem; não prometer recuperação desse valor.
- A operação depende de poucos anúncios para vender. Mostrar a participação e seu histórico, sem chamar concentração de problema automaticamente.
- A margem após Ads está sujeita à cobertura parcial da publicidade. Conferir a origem antes de concluir sobre o desempenho.

Mostrar também avanços e contribuições positivas, sem confundir melhora de um resultado ainda negativo com operação já saudável. Evitar uma lista extensa de alertas com o mesmo peso visual. Sinal resumido fica visível; explicação e evidências podem ser abertas.

O fluxo mantém a divisão de responsabilidades: Visão Geral apresenta o quadro do grupo/recorte; Panorama sintetiza a conta; Diagnóstico aprofunda causas; Acompanhamento registra demandas e execução. Um atalho para investigar não deve criar automaticamente uma tratativa duplicada.

## Indicadores candidatos e implementação possível

| Proposta | Pergunta apoiada | Dados e cuidados |
|---|---|---|
| Evolução conjunta de faturamento e margem em reais | O crescimento está trazendo mais margem registrada? | Derivável dos agregados e da comparação já carregados, após alinhar a mesma etapa do resultado e recortes comparáveis. |
| Contribuição das operações para a variação da margem | Onde se explica a maior parte do ganho ou da redução? | Diferença de margem por operação, na mesma definição. Operação sem referência disponível não pode receber comparação fictícia com zero. |
| Efeito do Ads na margem | Quanto da margem das vendas permanece após o Ads adicional apurado? | A composição já existe no Panorama; melhorar sua leitura e declarar cobertura. Não descontar novamente custos já incluídos no líquido. |
| Dependência dos principais anúncios | Quanto do resultado depende de poucos produtos/anúncios? | Dados de anúncios no detalhe da operação; mostrar participação nas vendas e na margem. O contexto determina se a concentração merece atenção. |
| Cobertura e atualização das fontes | Quais conclusões ainda são preliminares? | Parte dos sinais é derivável das bases atuais, mas coleta por fonte, fechamento e cobertura completa exigem metadados confiáveis. Não inventar horários ou completude. |

## Sequência da implementação autorizada

1. Relatório e ordem de leitura apresentados; implementação autorizada pelo usuário.
2. Guia no topo e pré-diagnósticos visíveis após os cartões. Operações antes dos gráficos na Visão Geral. Explicação da margem antes dos gráficos no Panorama.
3. Sinais ligados ao modelo dos indicadores, sem cortes universais. Valores financeiros mantidos; a etapa e o denominador são declarados. No modo executivo da Visão Geral, meta universal de 15% e classificação genérica por margem foram retiradas; diferença bruto/líquido não é apresentada como taxa comprovada.
4. Evolução conjunta de faturamento/margem, avanços/reduções por operação comparável, dependência dos principais itens e cobertura dos pedidos. Receita identificada soma centavos antes do cálculo de ticket. Ads mensal continua usando a distribuição vigente, com limites visíveis.
5. Conferidos fluxo macro → Panorama → vendas/Diagnóstico/Publicidade/Metas, carteira, ausência de referência, temas, celular e ampliação dos gráficos. Não avançar para outras páginas antes de tratar a revisão do usuário.

## Validação e limites da entrega

- **54 testes automatizados aprovados:** 46 anteriores e oito novos casos de referência por operação, bases equivalentes, evolução ainda negativa, IDs/ticket, concentração, métodos de Ads e modo executivo. Integração idempotente e scripts compilados.
- **Dados fictícios no navegador:** grupo de seis operações; crescimento de faturamento com redução de margem em uma conta; conta com margem negativa; carteira do Gestor limitada a duas operações para aprofundamento. Guia primeiro no conteúdo e sinais fora de qualquer bloco recolhido.
- **Panorama:** Amazon com margem das vendas zero e Ads de R$ 200,00 conserva -R$ 200,00 e -3,22%; Temu conserva 15,00% sobre líquido. Ads ausente não é zero confirmado. Referência de 2025 ausente deixa variações indisponíveis.
- **Pedidos:** cenário fictício com 127 de 129 linhas identificadas mostra 71 pedidos e ticket de R$ 368,24, excluindo receita sem ID; comparação de pedidos/ticket é omitida quando a identificação é parcial.
- **Leitura e interação:** temas claro/escuro, largura de 390 px sem transbordamento da página, rolagem interna da tabela, gráfico ampliado e tabela de valores formatada em reais. Nenhum erro de console nos fluxos conferidos. Teste de abertura da Visão Geral não disparou `/api/detalhe`.
- **Preservação:** cálculos financeiros, históricos fechados, coleta, permissões e backend não são reprocessados. Comparações continuam dependendo dos registros carregados; existência de um registro de Ads não comprova cobertura completa. Sem metadados confiáveis, a coleta individual por fonte permanece não informada.
- A revisão visual e técnica não certifica a conciliação dos dados reais de todas as operações. A conferência gerencial do usuário permanece pendente.

## Referências de código

- `visual/resumos.js`: `overviewMount`, `overview`, `panorama`, `syncNote`.
- `visual/resumos.css`: posicionamento de `.bc-reading-guide` no Panorama.
- `visual/resumos-modelo.js`: `overview`, `coberturaAds`, `depoisAds`.
- `acompanhamento.html`: `renderOverview`, `renderDiagnosis`, `_gerAgrega`, alertas de `renderGerencial`.
