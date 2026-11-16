# Proposta de experiência: Panorama

Protótipo para avaliar a organização visual antes de integrar uma mudança ao BsanControl. Inspirado na estrutura do Shopeers indicado pelo usuário, com identidade e regras próprias do BsanControl.

Todos os dados são fictícios e ficam dentro do HTML. Não há chamadas à API, leitura de configurações, autenticação ou gravação na operação. As telas de apoio demonstram o percurso de investigação, sem substituir os módulos de produção.

Execute `node propostas/preview.cjs` e abra a URL local exibida. Também é possível abrir `panorama-shopeers.html` diretamente no navegador; a cópia para a área de transferência depende das permissões do navegador.

Percursos para avaliar:

1. Reconhecer faturamento, volume, contribuição e margem no Panorama.
2. Comparar evolução diária ou acumulada com a referência explícita.
3. Abrir uma prioridade no Diagnóstico e investigar seu produto.
4. Trocar Anúncio por SKU e conferir a soma de anúncios do mesmo SKU, sem atribuir um ID único ao agregado.
5. Conferir todas as etapas em Anúncios, ampliar a tabela e abrir detalhes.

Régua de margem: `<10%` vermelho; `10% a <20%` âmbar; `≥20%` verde. Régua de TACOS: `<3%` verde; `3% a <5%` âmbar; `≥5%` vermelho. Queima de margem e Sem giro permanecem distintos.

Esta proposta é mantida em branch próprio. Não altera o HTML publicado, cálculos ou permissões do BsanControl.

Validação: scripts compilados; nove cenários com totais e agregação consistentes; navegação Panorama → prioridade → produto; lentes de anúncio/SKU; cópia de código; CSV do filtro; paginação; ampliação da tabela e do gráfico; tema claro/escuro; celular 390 × 844 sem rolagem horizontal da página. Prévia salva em panorama-desktop.jpg.

Referência visual indicada pelo usuário: https://dribbble.com/shots/26628350-Shopeers-AI-Powered-B2B-eCommerce-Analytics-Dashboard
