# Padrão visual das áreas — Grupo Bsan

Cobertura: 13 áreas principais e oito sub-abas do Gerencial. Metas e Comissão mantêm os componentes já aprovados. As demais áreas usam os mesmos fundamentos de superfícies, tipografia, controles, tabelas e cor de estado.

`areas.css` define o padrão e os ajustes próprios de cada área. `areas.js` aplica o tratamento aos componentes criados pelos renderizadores existentes e oferece ampliação dos gráficos, incluindo tabela de valores. O módulo não chama APIs nem grava, filtra ou recalcula dados de negócio.

`integrar.js` aplica o padrão ao HTML de forma idempotente. No Pipeline, os três arquivos ficam em `visual/`, e `build-online.js` reaplica o integrador antes de gerar a página. Assim, uma atualização normal não desfaz a migração. Os mesmos arquivos são copiados ao pacote online para manutenção.

Foram preservados os IDs, handlers, filtros, páginas de resultados, exportações, permissões, autenticação, fórmulas e pesos. A formatação monetária comum mantém centavos e não abrevia os valores em K/M; percentuais de apresentação ganharam duas casas onde eram reduzidos a zero ou uma. As quantidades continuam sendo quantidades. Não há recálculo ou revisão histórica.

Os guias de leitura têm alcance próprio: posição atual de estoque, intervalo de vendas, dia do Diário, horizonte futuro e competência de Metas/Comissão permanecem distintos. Tabelas extensas rolam internamente. A ampliação é exclusiva de gráficos; cartões de valores conservam seu tamanho na página.

Validação técnica: 91 testes automatizados aprovados, passagem no navegador pelas áreas e sub-abas, modos internos selecionados, temas claro/escuro, largura de 390 pixels, ampliação e retorno do gráfico. A revisão gerencial geral de filtros, Envios e entregas foi adiada pelo usuário para depois da migração visual completa. Esta documentação não a declara realizada.

Para atualizar o estilo, manter as fontes do Pipeline e deste diretório correspondentes, regenerar e conferir os testes e o diff antes de publicar. O gerador continua abortando se a escrita apagaria código adicional do destino. A fonte completa com vendas e os backups locais não fazem parte do repositório público.

Identidade de empresas: Bsan Shop usa lilás `#ac83e8`, Jowcase ciano `#63cddd` e Pesseguinho Store pêssego `#efb293`. A paleta `EMP_C` é compartilhada com os gráficos. Nas colunas Empresa e Marketplace, os marcadores circulares dão lugar a etiquetas de texto neutro com fundo e borda suaves; empresa tem uma lateral colorida. O tratamento preserva os nós e nomes originais, reaplica após paginação e não altera as cores de estado ou a paleta dos marketplaces. Validado nos temas claro/escuro e ao trocar páginas da tabela de Vendas.

Liquidação: nas tabelas de Vendas e de vendas da operação, a etiqueta âmbar “Em liquidação” aparece abaixo do líquido usando a mesma regra de origem provisória já existente. O tooltip informa que o valor pode mudar após a liquidação. A coluna Status conserva a situação da venda (Venda, Cancelada etc.), sem repetir o estado do repasse. Não há nova classificação, alteração de cálculo ou coleta.

Tipografia compartilhada com Metas: Inter em todo o painel, seus controles, formulários, diálogos e gráficos. Corpo 14 px; apoio 13 px; legendas e metadados a partir de 12 px; títulos de seção 17 px e de conteúdo 22 px; rótulos dos indicadores 16 px e valores principais até 36 px (30 px em telas estreitas). A hierarquia própria do objetivo do dia em Metas é preservada. Pesos acima de 700 são normalizados; números usam alinhamento tabular. DM Mono fica restrita a elementos semânticos de código, SKUs, identificadores e números de pedido reconhecidos pelo cabeçalho das tabelas ou pelo link de venda, não a valores financeiros e resumos.

Os nós de texto não são reescritos na normalização tipográfica. O tratamento de tamanho e peso é memorizado por elemento e tamanho/peso inline; novos registros, diálogos e tabelas recebem o mesmo tratamento. O plugin `bcTypography` centraliza famílias e tamanhos mínimos de eixos, legendas, dicas e rótulos de todos os gráficos, inclusive Metas e Comissão. Fontes scriptáveis preservam argumentos, contexto e demais opções; callbacks de valores, séries e cálculos não mudam.

Leituras e escritas de estilo são feitas em lote para não recalcular o layout a cada célula de tabelas grandes. Grupos de quatro indicadores usam duas colunas em larguras intermediárias; números não são partidos no meio. O estado visual vazio dos gráficos é removido quando a instância recebe a série, inclusive após o carregamento assíncrono. Conferidos os modos padrão das 13 áreas e oito sub-abas, os três formulários de lançamento, os dois temas, a ampliação e retorno do gráfico e a largura de 390 px. Essa conferência visual não substitui a revisão gerencial de dados e entregas pelo usuário.
