# Forecast dos anúncios — 09/11/2026

## Entrega

Nova seção **Gerencial → Forecast**, da operação selecionada, com lentes **Por ID do anúncio** e **Por SKU**. Anúncios mantém a função de análise do realizado. A correção anterior `d85b360` reuniu número e movimento na coluna # e substituiu Δ por Variação, com as datas da referência no texto de apoio ao passar o mouse.

O Forecast usa cards e gráficos, sem acrescentar colunas à tabela de Anúncios:

- Realizado até o corte, esperado até a mesma data, projeção até o horizonte, distância para o esperado, volume/faturamento e margem Pós-Ads **realizada**.
- Filtros visuais Todos, Abaixo do esperado, No ritmo, Acima e Sem referência. A régua de rota é uma convenção operacional: abaixo de −5%, faixa inclusiva de −5% a +5%, acima de +5%. Não representa significância estatística.
- Gráfico Diário/Acumulado: realizado azul, esperado âmbar e projeção ciano tracejada, com faixa de cenário. Gráfico geral compara somente os mesmos itens com referência, identificando a cobertura; produtos novos continuam nos totais gerais e nos cards.
- Cards dos produtos com realizado, esperado, projeção, progresso, qualidade da base, margem Pós-Ads e TACOS realizados. A cor de rota descreve vendas; rentabilidade mantém sua régua própria. Margem: <10% vermelho, 10–20% âmbar, ≥20% verde. TACOS: <3% verde, 3–5% âmbar, ≥5% vermelho.
- Acompanhar projeção abre um diálogo com os KPIs do item, gráfico, faixa e média diária necessária para alcançar o esperado. Raio-X permanece disponível sem sair da análise.
- Busca por título/ID/SKU, mostrar mais cards e CSV de toda a seleção, com datas, método, referência e parâmetros do cenário. Textos exportados usam a proteção contra fórmulas já existente.

## Esperado, realizado e previsão

O esperado é uma referência do próprio anúncio/SKU, na mesma operação. Por padrão usa o mesmo recorte do mês anterior: 01–06/11 contra 01–06/10. O seletor também oferece mês anterior completo (base mensal fixa), intervalo imediatamente anterior e a comparação do cabeçalho. Esta última exige comparação ativa; não inventa datas se estiver desativada. Referência sobreposta ou posterior ao início da janela atual é rejeitada como benchmark de previsão.

Esperado diário = vendas da referência ÷ dias corridos da referência, com ajuste opcional de crescimento. Esperado no horizonte = esperado diário × dias do recorte até o fim projetado. Durações diferentes são normalizadas: trata-se de repetir um ritmo, não de impor um objetivo absoluto de faturamento igual ao total do mês anterior. Objetivos/metas oficiais e publicidade/afiliados permanecem nos módulos existentes.

O realizado cobre somente vendas finalizadas identificadas. A projeção começa após o corte comum, limitado pela data disponível, pelo fim selecionado e pelo dia anterior a hoje. Não é usado um corte diferente para cada produto, o que esconderia produtos que pararam de vender. O corte não certifica fechamento da coleta. Dias posteriores ao corte podem já ter ocorrido no calendário: continuam projetados até a fonte ser atualizada.

Horizontes: fim do mês do corte, 7 dias ou 30 dias após ele. Um recorte que termina no último dia do mês informa que não há dias a projetar nesse horizonte. Janela de vendas limitada a 180 dias para manter o histórico de referência dentro da carga gerencial disponível; referências explícitas seguem a janela carregada pelo cabeçalho.

## Método e qualificação

- Média diária do recorte; média dos últimos 7 dias; média por dia da semana sobre até 28 dias.
- Automático: com 35 dias, compara média do recorte e média recente em três origens históricas de 7 dias, treinando somente com dados anteriores a cada corte. Com 49 dias, inclui dia da semana na comparação das mesmas origens. Escolhe menor erro absoluto médio; empate favorece método mais simples. Com menos histórico, usa média diária e indica a limitação.
- Diálogo mostra média, mediana, dias com vendas, método, MAE e WAPE dos testes quando disponíveis. WAPE não é calculado com denominador realizado zero. O erro retrospectivo não é apresentado como precisão futura garantida.
- Faixa inferior/superior: hipótese manual de ±20% por padrão sobre a **parte projetada**, sem reescrever o realizado; configurável de 0 a 100%. Não é intervalo probabilístico de confiança.
- Vendas esparsas, base curta, valores inválidos e datas sem registros da operação recebem sinais próprios. Datas sem registros da operação permanecem lacunas no diário; a média por dias corridos é explicitamente condicional à cobertura da coleta.
- Produtos sem histórico não recebem objetivo zero. Itens vendidos apenas na referência permanecem visíveis para revisão. Novos itens ficam fora do denominador da comparação agregada de rota, evitando um avanço artificial.
- Cancelamentos e devoluções não entram como vendas finalizadas. Registros sem identidade ficam fora dos grupos, com quantidade/receita excluída informadas. ID faltante não é preenchido com SKU. SKU soma todos os anúncios identificados, conserva a lista de origens e não escolhe MLB arbitrário.

Referência metodológica: [Forecasting: Principles and Practice, capítulo 5](https://otexts.com/fpp3/toolbox.html), métodos de referência e avaliação por origem móvel. Os parâmetros ±5% de rota e ±20% de cenário são escolhas operacionais desta implementação, não recomendações estatísticas daquele livro.

## Limites preservados

Sazonalidade anual, promoções, ruptura, feriados e mudanças de preço/Ads não são modelados automaticamente. Estoque disponível não é restrição de capacidade da previsão. A página não prevê lucro final, não altera preços/campanhas e não cria tarefas ou metas. Margem e TACOS são leituras realizadas da mesma composição já existente, incluindo rateios identificados. Não se projetam custos desconhecidos como zero.

A implementação reutiliza o detalhe gerencial carregado e uma apuração de margem em lote, com identidade de sessão/carteira/ponto. Não há uma chamada de rede por produto. Busca e filtros reutilizam o modelo calculado; o painel de apuração de margem é mantido durante redesenhos para evitar consultas repetidas por digitação. Não há tabela, migração ou endpoint novo; restrições e acessos existentes são preservados. As edições preexistentes em Produtos não fazem parte da entrega.

## Validação

619 testes passaram, incluindo 23 de Forecast: calendário/leap year, normalização, corte temporal, horizonte, faixa futura, ID/SKU, identidade ausente, operação, novos/sem vendas, referência inválida/desativada, tolerância, valores inválidos, lacunas, reconciliação de gráfico/totais, métodos, origem móvel, erro com zeros, unidades e imutabilidade das entradas.

Frontend real em API/SQLite exclusivamente fictícios, como gestor: cinco IDs viraram quatro SKUs, conservando R$ 2.640 realizados, R$ 13.200 de projeção e R$ 453 de Pós-Ads realizado. Grupo com dois IDs tornou-se um SKU sem MLB arbitrário. Filtro abaixo do esperado por SKU/unidades: 54 unidades realizadas, 117 projetadas em horizonte de 7 dias e 208 esperadas. Diálogo, Diário/Acumulado, CSV e comparação desativada conferidos. Console sem erros nesses percursos. Em 390 px: página sem transbordamento horizontal; viewport restaurado após teste.

HTML com scripts válidos, hook de navegação presente e integração idempotente. Carga oficial, custos, comissões, metas, tarefas, permissões e campanhas não foram alterados. Evidências em `C:\Users\weskl\.codex\visualizations\2026\10\23\01a16af3-f9ea-7910-b412-0f2974475d0c\forecast-anuncios-20261109`.
