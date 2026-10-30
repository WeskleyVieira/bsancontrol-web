# Padrão visual das áreas — Grupo Bsan

Cobertura: 13 áreas principais e oito sub-abas do Gerencial. Metas e Comissão mantêm os componentes já aprovados. As demais áreas usam os mesmos fundamentos de superfícies, tipografia, controles, tabelas e cor de estado.

`areas.css` define o padrão e os ajustes próprios de cada área. `areas.js` aplica o tratamento aos componentes criados pelos renderizadores existentes e oferece ampliação dos gráficos, incluindo tabela de valores. O módulo não chama APIs nem grava, filtra ou recalcula dados de negócio.

`integrar.js` aplica o padrão ao HTML de forma idempotente. No Pipeline, os três arquivos ficam em `visual/`, e `build-online.js` reaplica o integrador antes de gerar a página. Assim, uma atualização normal não desfaz a migração. Os mesmos arquivos são copiados ao pacote online para manutenção.

Foram preservados os IDs, handlers, filtros, páginas de resultados, exportações, permissões, autenticação, fórmulas e pesos. A formatação monetária comum mantém centavos e não abrevia os valores em K/M; percentuais de apresentação ganharam duas casas onde eram reduzidos a zero ou uma. As quantidades continuam sendo quantidades. Não há recálculo ou revisão histórica.

Os guias de leitura têm alcance próprio: posição atual de estoque, intervalo de vendas, dia do Diário, horizonte futuro e competência de Metas/Comissão permanecem distintos. Tabelas extensas rolam internamente. A ampliação é exclusiva de gráficos; cartões de valores conservam seu tamanho na página.

Validação técnica: 91 testes automatizados aprovados, passagem no navegador pelas áreas e sub-abas, modos internos selecionados, temas claro/escuro, largura de 390 pixels, ampliação e retorno do gráfico. A revisão gerencial geral de filtros, Envios e entregas foi adiada pelo usuário para depois da migração visual completa. Esta documentação não a declara realizada.

Para atualizar o estilo, manter as fontes do Pipeline e deste diretório correspondentes, regenerar e conferir os testes e o diff antes de publicar. O gerador continua abortando se a escrita apagaria código adicional do destino. A fonte completa com vendas e os backups locais não fazem parte do repositório público.
