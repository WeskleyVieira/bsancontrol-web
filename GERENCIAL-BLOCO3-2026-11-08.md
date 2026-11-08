# Gerencial — bloco 3: leitura da tabela de Anúncios

Implementação de 08/11/2026 sobre `568203a`, branch `codex/gerencial-bloco3`.

## Entrega

- A leitura essencial segue: Anúncio/SKU → Situação → Curva ABC → Unidades → Faturamento → Preço/un → Custo/un → Pré-Ads → Investimento Ads → TACOS → Pós-Ads → Pós-Ads/un. As 12 colunas continuam disponíveis; publicidade e resultado após publicidade permanecem essenciais.
- Identificação traz título, ID e SKU, com cópia explícita por código, inclusive códigos numéricos, minúsculos e com zeros à esquerda. Mais de dois códigos ficam numa expansão identificada, sem truncar o código. A primeira coluna e o cabeçalho permanecem fixos durante a rolagem interna da tabela.
- Por anúncio, todos os SKUs vinculados aparecem. Por SKU, todos os anúncios vinculados aparecem; o título não direciona silenciosamente ao primeiro anúncio de um produto com múltiplos IDs. Não se transforma SKU em ID de anúncio quando esse campo falta na origem.
- Situação passa para a segunda coluna. A cobertura fica numa indicação separada, com o texto completo no título de ajuda, evitando a repetição de “estimado” na mesma célula. Rateio não é apresentado como gasto identificado por venda.
- Valores e percentuais de margem negativa recebem vermelho; demais faixas conservam os cortes existentes de 10% e 20%. Publicidade e TACOS não recebem verde apenas por serem números positivos. As cores usam os tokens dos temas claro e escuro.
- “Relevância A/B/C” passa a “Curva ABC · A/B/C”; a coluna também se chama Curva ABC e permite ordenação. A fórmula e os cortes da curva permanecem iguais.
- As três colunas adicionais ficam ao final da visão completa. Busca, situação/curva, ordenação, paginação, CSV, detalhe, Raio-X e recorte recebido do Diagnóstico permanecem ativos. O percentual Pré-Ads no CSV usa a composição canônica, inclusive para canais com publicidade no líquido.
- A composição financeira do topo fica num resumo expansível também em Anúncios, mantendo Pré-Ads, publicidade e Pós-Ads visíveis na linha de resumo. Cards da operação e da curva permanecem disponíveis.

## Validação

515 testes aprovados, incluindo 8 casos novos: identidade de variações, SKU sem anúncio, múltiplos anúncios de um SKU, preservação de códigos/textos, faixas e ausência nas cores, cobertura estimada, pendência/zero informado e rateio único entre variações.

Frontend real com respostas sintéticas locais: 12 colunas essenciais e 15 completas; mudança de colunas conserva busca e filtro; cópia preserva minúsculas e zeros iniciais; CSV contém somente o item filtrado; anúncio com quatro SKUs permite expandir e copiar cada código; SKU com dois anúncios exibe ambos os IDs; Raio-X abre em pop-up. Prejuízos conservam −R$ 19,72 e −R$ 9,51, com total de −R$ 29,23 e valor/percentual no mesmo vermelho. Temas claro/escuro e tela de 390 px conferidos; rolagem horizontal restrita à tabela, sem transbordamento da página. HTML com scripts válidos e integração idempotente.

## Escopo seguinte

Este bloco reorganiza a leitura e a identificação. Evolução de posição, altas/estabilidades/quedas e comparação de Curva ABC com a referência serão tratadas no bloco seguinte. Não foram alterados custos, preços, metas, comissão, classificação financeira, permissões nem tarefas publicadas.
