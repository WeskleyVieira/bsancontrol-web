# Bloco 3 — Operação, 04/11/2026

Retoma a leitura visual de Envios, Estoque e Projeção, mantendo o design atual e os contratos existentes. A comparação com os renderizadores anteriores e `AUDITORIA_OPERACAO.md` orientou a preservação do lançamento de Envios, dos detalhes e das premissas do planejamento. O Full continua em Gerencial; Operação ganhou uma consulta logística integrada.

## Entrega

- **Envios:** cards por operação com Coleta, Flex e Full, participação das modalidades e diferença contra a referência; abrir os dias conserva o formulário de edição existente, importação e controle de versão. Os cartões mostram até 8 operações na ordem/filtro escolhido, com todas as operações na tabela paginada. Gráficos reorganizados em grade responsiva com ampliação.
- **Estoque:** visão dos pontos físicos, contagens de posições por situação e fila visual de conferência. Negativos vêm primeiro, depois posições desconhecidas, falta de saldo e cobertura baixa. Registros duplicados e produto-pai não são apresentados nos cards como disponibilidade confirmada. Contagens são de registros, não totais únicos de produtos nem soma de saldo entre contas.
- **Projeção:** cards de produtos com unidades do histórico, média, demanda bruta e vínculo da posição; premissas continuam ajustáveis. Grupos inválidos deixam o resultado explicitamente parcial. Falha da consulta de estoque mantém a demanda e deixa o vínculo desconhecido. O Raio-X abre no popup, no ponto do produto, com análise Pós-Ads e comparação entre operações autorizadas.
- **Full:** consulta sob demanda por operação, com aptas, recebidas em processamento e ainda a caminho separados. Detalhes mostram necessidade e alocação já existentes para cada horizonte. Exportação logística filtrada. O atalho ao planejamento existente aparece somente para operações da carteira autorizada do gestor.
- **Desempenho e contexto:** vendas de apoio e relação Full são consultadas sob demanda; cache limitado a 16 consultas por identidade com validade de 60 segundos; respostas antigas não substituem o ponto atual. Seleção física inicial acompanha o cabeçalho; filtro local e cards de ponto também atualizam essa seleção.

## Regras conservadas

- CD, reservas, Full e caminho não são somados como estoque livre. A demanda não se transforma em compra líquida nem envio. O processamento recebido participa da posição de planejamento da origem; não é renomeado como apto para venda.
- A distribuição do CD entre contas já vem da relação Full. Não é recalculada nem aplicada por esta tela. Posições Full repetidas deixam os totais sem confirmação, evitando somar um mesmo inventário duas vezes.
- Geração, sincronização e data individual de posição são informações diferentes. A relação pode estar desatualizada; consultar a tela não roda a coleta da plataforma. Campos ausentes permanecem ausentes. A interface não reconstrói falhas que a própria fonte tenha gravado como zero.
- Vendas e vínculos passam a respeitar a identidade exata do SKU, sem fundir maiúsculas e minúsculas. O identificador original é conservado nas novas leituras de estoque. Letras já normalizadas em cargas antigas não podem ser recuperadas; nesses casos, um vínculo exato pode exigir correção da origem.
- O novo `GET /api/operacao/full` exige consulta de Estoque e Gestão e envia somente campos logísticos permitidos. Não expõe margem, TACOS, custos ou objetos completos da relação. As permissões dos perfis Estoque e Pós-venda não foram ampliadas. Apoio financeiro legado é identificado como Pré-Ads; a decisão de rentabilidade deve usar o Raio-X Pós-Ads.

## Validação

- 384 testes automatizados aprovados, incluindo os 370 anteriores e 14 novos testes de separação de ponto, SKU exato, demanda parcial, sanitização, ausência, duplicidade, horizontes e permissões.
- Navegador isolado com dados fictícios: Envios, Estoque, Projeção, popup Pós-Ads, Full, CSV, troca rápida de Bsan para Powerfull, falhas opcionais e acesso do gestor; temas claro/escuro, largura de 390 px, sem erro JavaScript ou transbordamento horizontal. Gráficos de 695 × 300 px no cenário desktop verificado.
- PostgreSQL real consultado somente em leitura: unidades da projeção conciliadas com as vendas; posições por ponto conferidas; seis contas Full sanitizadas. Nenhum dado comercial exportado, coleta executada ou saldo alterado.
- HTML e fontes precisam permanecer sincronizados no repositório público, Pipeline canônico e espelho local; integração idempotente e compilação verificadas antes da publicação.

## Validação operacional restante

Conferir com a equipe os vínculos de SKU, as posições compartilhadas, a atualização das fontes e as referências de cobertura por ponto. Testar uma contagem de Envios no fluxo habitual e revisar a relação Full antes de preparar qualquer envio. A homologação automatizada não substitui essa conferência física.
