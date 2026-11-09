# Vendas da operação — ID do anúncio

A identificação do anúncio estava disponível na linha de origem e na busca, mas não tinha coluna na tabela. ID do anúncio agora aparece após SKU nas colunas essenciais e completas, com cópia por clique/teclado, ordenação textual e exportação no CSV do filtro inteiro.

O valor utiliza exclusivamente `anuncio` da própria venda; SKU e pedido permanecem independentes. Ausência fica em branco. Texto é escapado na tabela e protegido contra fórmulas no CSV; IDs não são convertidos em números. Custos, modalidades, valores e filtros permanecem nas mesmas fontes.

Validação: 584 testes passam. Regressões verificam anúncio distinto do SKU, escape de HTML e alinhamento entre cabeçalho/células do CSV, incluindo ID longo. Integração idempotente e sete scripts compilados. Frontend real em homologação confirmou coluna visível nas duas visões, atributo de cópia com o ID exato e ordenação ascendente.
