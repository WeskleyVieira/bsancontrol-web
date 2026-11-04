# Bloco 5 — Produtos e Pós-venda

Implementação de 04/11/2026 sobre `469ab2c`, preservando o design e os contratos dos módulos existentes.

## Produtos

- Painel por ponto físico, Bsan ou Powerfull, com fichas cadastradas, logística conferida, logística para conferir e ausência de NCM. Os totais representam fichas do ponto, não unidades de estoque. Busca e filtros refinam a lista, com esse alcance explicado.
- Pessoas com acesso financeiro recebem também pendências de custo, revisão, composição e entradas de compra a vincular. Os indicadores abrem os respectivos filtros. Estoque não recebe esses campos no contrato da API, mesmo quando existem custos cadastrados.
- Filtro de todas as logísticas pendentes coincide com o indicador e exclui as conferidas. Composições desatualizadas têm abertura própria, sem misturar sua contagem com composição ainda pendente.
- Ficha, aprovação, vigência, matérias-primas/insumos, composições de embalagem, preparação, homologação e integração conservam seus fluxos. Aprovação pode ser feita por uma pessoa autorizada, sem dupla assinatura. Aprovar uma revisão não define sozinho sua vigência; a ficha conserva o histórico e as datas.
- O padrão de embalagens informado permanece exclusivo de Bsan. Não foi replicado para Powerfull, não foram presumidas quantidades de consumo e nenhuma composição foi homologada automaticamente.
- A listagem lê detalhes, última versão do custo e pendências em lote, preservando as listas explícitas de campos operacionais. No teste com 30 produtos, o serviço passou de um padrão de consultas por item para **6 consultas**, incluindo acesso, total e itens. Não há limite aplicado aos indicadores por causa da página.
- Assets da interface são servidos sem inicializar o banco privado. Acesso anônimo ou financeiro negado é verificado antes de abrir esse banco; o usuário é validado novamente depois da inicialização, conservando a checagem de sessão atual.
- Falha opcional do painel mantém o catálogo confirmado e permite tentar novamente. Falha da lista limpa itens antigos. Respostas de outro ponto não substituem a seleção atual.

## Pós-venda

- Indicadores de abertos, atrasados, retornos de hoje, sem responsável, histórico a conferir e encerrados. Ativos sem prazo têm abertura própria. A contagem usa o filtro inteiro, não somente os 30 registros da página.
- Cards dos primeiros oito atendimentos da página apresentam operação, responsável, prazo e próxima etapa sugerida. A sugestão decorre da situação do caso e não é uma tarefa criada ou mensagem enviada automaticamente.
- Filtros de retorno do dia e de ativos sem responsável ficam visíveis na página. Atribuição, prazo, situação e comentário continuam sendo registrados com histórico e controle de versão.
- Consulta opcional do pedido da própria tratativa na base de vendas sincronizada. O vínculo exige empresa, canal e identificador exato, preservando zeros à esquerda. A resposta contém somente data, SKU, título, situação e unidades; não contém preço, receita, custo, margem ou repasse.
- A consulta é autorizada pela loja do atendimento. Não oferece busca livre de vendas para o perfil Pós-venda nem amplia acesso a DRE ou Produtos. Não localizar um pedido na base não confirma sua inexistência; operação ou pedido ausentes exigem conferência.
- Até 50 linhas do pedido são mostradas, com indicação de limitação. Consulta não atualiza a plataforma e não encerra o atendimento. Estado do atendimento e situação da venda permanecem independentes.
- Prazos e projeção usam a mesma data de referência em São Paulo. Resolvidos, cancelados e histórico a conferir não viram atrasos ativos. Respostas de uma identidade anterior não são usadas na nova sessão.

## Validação e limites

- Regressão integrada: **436 testes aprovados**, sem falhas ou testes ignorados. Cópias privadas receberam as fontes com backup; scripts inline compilados, módulos novos únicos e aplicação do integrador idempotente. Corrigida a ausência do módulo e da política atualizada de Pós-venda nos dois HTML privados, sem regenerar as demais áreas.
- Testes de Produtos com SQLite isolado: separação de pontos, indicadores, filtros, leitura em lote, última versão do custo, dados legados, ausência de informações financeiras para estoque e aprovação individual autorizada.
- Testes de Pós-venda com SQLite isolado: lojas concedidas, prazos, relógio de São Paulo, filtro inteiro, contexto exato do pedido, limite de linhas e ausência de dados financeiros.
- Navegador com dados fictícios e perfis Direção, estoque, compradora e Pós-venda: fichas, cabeçalho, embalagens/preparação, filas, contexto, atualização de atendimento, histórico, falhas e troca rápida de ponto. Temas e largura de 390 px conferidos.
- PostgreSQL do Pipeline consultado somente com SELECT: o schema de Pós-venda estava disponível e os prazos foram conferidos. O schema de Produtos não estava nessa conexão; os testes de Produtos usaram exclusivamente banco isolado, sem inferir configuração ou conteúdo de outro ambiente. A consulta real não exportou registros comerciais nem alterou dados.
- Não houve importação de custos reais, nova coleta Tiny, criação de produtos no ERP, alteração de estoque, publicação de custo no Pipeline ou envio de mensagens. As atualizações de atendimento dos testes ocorreram apenas no banco fictício.

## Próxima etapa

Bloco 6: homologação integrada de navegação, filtros, permissões, desempenho e percursos entre as áreas. A conferência operacional com a equipe dos números oficiais, vínculos, medidas, materiais e fotografias de apuração permanece distinta da validação técnica.

Retorno técnico: reverter somente esta entrega sobre `469ab2c`, sem migração nova de schema; preservar as demais atualizações do projeto e os dados de negócio.
