# Gerencial — bloco 4: evolução entre períodos

Implementação de 08/11/2026 sobre `727f219`, branch `codex/gerencial-bloco4`.

## Entrega

- Posição interna por faturamento positivo da operação inteira, calculada antes da busca, do filtro financeiro ou do recorte recebido do Diagnóstico. Empates em centavos compartilham posição (1º, 1º, 3º). Não representa posição na busca do marketplace.
- Coluna essencial com posição atual, posição na referência, quantidade de itens em cada ranking e movimento de alta, queda ou posição mantida. A Curva ABC mostra referência → atual, conservando a fórmula acumulada de 80%/95% existente.
- Cards de alta/queda/mesma posição e itens sem vendas atuais abrem o recorte correspondente. O seletor Evolução dos itens também filtra mudança de Curva ABC, faturamento e ausência em uma das janelas. Os filtros financeiros continuam separados.
- Faturamento mostra variação monetária e percentual contra a referência, separada do movimento no ranking. É possível subir no ranking enquanto o faturamento cai. Percentual sem denominador positivo permanece indisponível.
- Sem comparação e referência sem vendas mostram estados próprios e atalho para escolher as datas; não geram estabilidade fictícia. Item sem venda de referência não é denominado lançamento.
- Sem vendas no atual apresenta os itens encontrados somente na referência, com ID/SKU, posição/Curva ABC anteriores e faturamento de referência. Custo, volume, receita e margem atuais permanecem ausentes. Detalhar explica a ausência; Raio-X continua disponível.
- Trocar operação, ponto, período, referência, sessão ou agrupamento encerra o filtro anterior de evolução. O recorte vindo do Diagnóstico conserva os IDs e entra sem filtro residual de movimento. A busca não renumera as posições.
- Janelas com tamanhos diferentes são identificadas. A comparação usa os totais dos intervalos, sem média diária implícita. O carregador passa a incluir também o fim da referência quando posterior ao período atual; a correção é aplicada pelo integrador na geração online e preserva o histórico existente.
- CSV preserva as colunas anteriores e acrescenta posições, movimento, Curva ABC anterior, faturamento anterior/variação e identificação de presença somente na referência. A visão de itens sem vendas exporta campos atuais vazios.
- A variação de margem já existente na visão completa continua explicitamente Pré-Ads. Compara a mesma etapa nas duas janelas, inclusive no TikTok, sem duplicar publicidade já incluída no líquido. O Pós-Ads atual permanece essencial; não se inventa um Pós-Ads anterior a partir da margem antes da publicidade. Não foram adicionadas requisições de apuração financeira histórica para calcular o ranking.

## Validação

532 testes passaram, incluindo 17 casos novos: empates, movimento contrário ao faturamento, ranking estável sob filtros, comparação ausente/vazia, item sem referência, item sem venda atual, mudança de curva independente da posição, zero/inválido, identidade anúncio/SKU, preservação de dados, Pré-Ads em canais com mídia no líquido, ausência de base e limites completos da consulta.

No frontend real com dados sintéticos: 3 altas, 2 quedas, 1 posição mantida, 1 item sem venda de referência e 1 sem venda atual. Produto com faturamento de R$ 400 → R$ 200 sobe de 3º → 2º; a busca mantém 2º de 7, com queda de 50% separada. CSV do item sem vendas contém somente a referência e campos atuais ausentes. Alteração da referência redefine o filtro de evolução; janelas de 6 e 31 dias são identificadas. Tela de 390 px sem transbordamento da página. HTML com scripts válidos e integração idempotente.

Não há alteração de metas, comissão, permissões, custos, preços ou tarefas publicadas. A evolução é uma leitura dos registros disponíveis, não prova de ruptura, pausa, lançamento ou encerramento de anúncio.
