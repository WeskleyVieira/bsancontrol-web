# Diário — contas com vendas e motivo da posição pendente

O placar mantinha a união das contas atuais com as da referência. Isso colocava operações sem vendas atuais na lista principal. Além disso, qualquer comparação de posição indisponível era apresentada como “Sem referência”, inclusive quando havia dados anteriores e faltava publicidade para apurar a pontuação atual.

- Padrão: contas com vendas finalizadas no período atual. O controle Contas no placar permite incluir operações sem vendas no período, preservando os registros de referência e o histórico. Busca e este controle afetam tabela/CSV; cálculos, pontos, posições, totais e comparações continuam usando a seleção original.
- Posição por pontos distingue publicidade pendente, outros indicadores/pesos indisponíveis, referência ausente e referência com pontuação pendente. Posição anterior aparece separadamente quando conhecida. Pontos anteriores são identificados como pontos, não como posição.
- Uma conta com vendas e publicidade pendente permanece visível. Faturamento, Pré-Ads, pedidos e unidades não são ocultados; não se inventa publicidade zero nem Pós-Ads para completar o ranking.
- Variações distinguem Atual indisponível de Referência indisponível. CSV inclui situação e observação do placar, respeitando o mesmo filtro da tabela.

Validação: 588 testes passam; integração idempotente e sete scripts compilados. Regressões verificam Magalu pendente com referência preservada, contas somente na referência, motivos distintos e registros sem venda finalizada. Frontend real em homologação confirmou Magalu sem posição atual com posição anterior, Kwai/Temu ausentes no padrão e presentes na opção explícita. Não altera dados, pesos, fontes de publicidade ou regras financeiras.
