# Resultados e operação — leitura visual e hierarquia

Sobre db2d468, 08/11/2026. A Shein volta ao gráfico pela composição central que reconhece as contas sem Ads, preservando quantidade e faturamento conhecidos. Operações inelegíveis para as coordenadas continuam fora da bolha, com os nomes e o motivo de ausência identificados; valores pendentes não viram zero.

Nomes não usam mais o descarte automático de colisões do plugin de rótulos. Em telas amplas, são posicionados nas laterais com linhas de ligação e espaçamento vertical. Em telas estreitas ou sem espaço suficiente, números identificadores têm correspondência numa lista completa de contas, aberta automaticamente na primeira ocorrência. Esses números não são posições do placar. A lista também oferece acesso ao Panorama.

Canvas usa densidade de pelo menos 2x e texto de tamanho definido, preservando o gráfico vivo ao ampliar. Tooltip informa Pré-Ads em reais e percentual, além de Pós-Ads, publicidade, volume e ticket.

O índice ponderado é apresentado como Pontos (0–100), com arredondamento aplicado à pontuação e ao ranking: empates nos pontos exibidos têm a mesma posição. Pesos, normalização, tratamento da origem e cálculos financeiros preservados; precisão anterior fica disponível internamente como scoreExact. CSV exporta pontos inteiros.

Validação: 580 testes passam; sete scripts inline compilam; integração idempotente. Inspeção no frontend real com respostas sintéticas: pontos inteiros, 14 contas identificadas (incluindo Shein), ampliação nítida, lista numérica em 620px, soma do SKU CORTADOR em duas operações, margens/TACOS coloridos, Top 10 e detalhes, e resumo do Panorama após carregamento assíncrono. Reversão pelo revert desta entrega e regeneração do HTML.

## Marketplaces, Curva ABC e Forecast
- Gráficos de canais usam diário em até 62 dias, semanal em até 186 dias e mensal acima disso, com escolha manual. Um único intervalo vira barras comparativas. Meses selecionados parcialmente são marcados.
- Top 10 é carregado automaticamente, em cards visíveis, com operação, SKU copiável, faturamento, Pós-Ads e quantidade. Filtros de operação/indicador recalculam os cards já carregados; Detalhar e Raio-X abrem informação aprofundada.
- Curva A/B/C padronizada. ABC começa pela soma dos SKUs do escopo e oferece visão por operação e seleção múltipla das operações que compõem o denominador, respeitando os filtros e acessos do cabeçalho. Consolidar texto igual de SKU não comprova equivalência cadastral; os componentes permanecem no detalhe.
- Tabela da Curva colore margem e TACOS. Regra global do TACOS realizado: <3% verde, 3–<5% âmbar, ≥5% vermelho; desconhecido neutro. Metas/tetos preservam a condição de referência. Aplica-se a cards, tabelas e textos de indicador; barras de publicidade em percentual seguem a mesma régua.
- Forecast separa pontos parciais em âmbar dos totais mensais em azul. As parcelas não são ligadas à curva de totais nem usadas no treinamento. Texto explica cenário central e hipóteses manuais. Fórmulas e premissas do cenário permanecem preservadas.

- Cabeçalhos de tabelas recebem altura, alinhamento central vertical, espaçamento e borda padronizados, com separação visível e camada correta da coluna fixa de ações das vendas.
- Raio-X soma Faturamento e Unidades aos quatro cards de composição. Barras de quantidade são desenhadas primeiro; Pré-Ads e Pós-Ads ficam por cima. Séries coincidentes podem ser isoladas pela legenda; não são deslocadas artificialmente.

## Panorama e identidade das séries
- Oito cards em duas linhas: Faturamento, Pedidos identificados, Unidades, Ticket; Pré-Ads, Publicidade, TACOS, Pós-Ads. A composição detalhada permanece recolhida abaixo. Carregamento, falhas e cobertura do cálculo central continuam visíveis ao abrir.
- Gráficos mistos usam faturamento azul, Pós-Ads verde e Pré-Ads cinza tracejado. Linhas são desenhadas após as barras. Paletas por operação/categoria e cores semânticas do TACOS são preservadas. Valores negativos continuam destacados nos pontos quando aplicável.
- Percentuais de margem realizados seguem <10% vermelho, 10–<20% âmbar e ≥20% verde, com ausência neutra. A cor da série identifica a métrica; a cor dos valores identifica a faixa.
- Donuts e barras não recebem contorno roxo genérico. Títulos acessíveis e de ampliação priorizam o próprio gráfico.

## Limites
- Sem gravação de vendas, custos, tarefas, metas ou usuários. Sem alteração das regras de cálculo, limites de metas, publicidade ou afiliados. Pontos são um índice ponderado gerencial, não avaliação individual do gestor.
- Carga por SKU e acesso continuam limitados ao escopo autorizado. Nenhuma operação é aberta por fora dos filtros ou permissões.
- Validar a nomenclatura e o uso cotidiano com a equipe continua necessário; esta entrega corrige a apresentação e mantém as fontes e tratativas existentes.

## Referência de Anúncios e Diagnóstico
- A comparação interna deixou de depender do interruptor global: usa `_gerAnterior` quando não há comparação escolhida, mantendo o mesmo calendário do Panorama e da janela de carga. Mês completo compara com mês anterior completo; intervalo parcial compara com o anterior de mesma duração. A referência aparece no contexto.
- Ranking permanece por faturamento da operação inteira, antes dos filtros; ↑, ↓ e = comparam posições. Tração mantém as regras existentes (crescimento >40% com atual >R$200 e referência positiva; queda >30% com referência >R$200), separada da posição relativa.
- Filtros de tração ficam visíveis mesmo com zero; a agenda oferece dois acessos diretos. Zero não desaparece e falta de referência não é estabilidade.
- Anúncios mostra todos os itens por padrão. Seleção opcional de 50, 100 ou 250 itens permite dividir listas maiores; totais, filtros e CSV continuam usando a lista inteira.
- Regressão executa o contexto real sem comparação global e confirma altas/baixas no ranking e sinais de tração; referência personalizada tem prioridade. Frontend sintético confirmou 3 altas, 2 quedas, 1 empate, 1 sem referência, três itens perdendo tração e um ganhando, com abertura dos grupos.

## Conferência em produção
- Outubro/Grupo: faturamento R$603.450,04, Pré-Ads R$129.072,91, publicidade R$25.983,68 e Pós-Ads R$103.089,23. Shein: 479 unidades, faturamento R$14.907,68, Pré-Ads/Pós-Ads R$3.219,08.
- Magalu outubro reconhecido sem Ads; novembro permanece pendente de fonte de publicidade, sem presumir gasto zero. DRE apresenta Mês e um único controle de competência por padrão. Top 10 carregou dez cards reais. Forecast separou o ponto parcial de novembro (01–06) da linha de totais mensais.
- Pesseguinho/ML em outubro: 112 itens na lista única; contra setembro, 15 sobem, 38 caem, 2 mantêm e 57 ficam sem vendas na referência. O Diagnóstico recupera 8 ganhando tração e 16 perdendo tração.
- O código legado comparava Curva ABC atual versus anterior (A/B/C) para suas setas. Não armazenava uma disputa diária de posições numéricas dentro do mês. O novo movimento numérico compara posições entre os dois períodos explicitados na tela; uma leitura diária acumulada precisaria de modo próprio.
- Células compostas TACOS / teto colorem somente o percentual realizado. O teto mantém sua apresentação como referência.
