# Grupo Bsan — Bloco 6: homologação integrada

Entrega técnica de 04/11/2026 sobre `f210b1f` (bloco 5). O aceite operacional da equipe continua pendente; este documento não declara conferência dos números oficiais nem ativação de custos novos.

## Encerramento dos blocos

| Bloco | Entrega | Situação |
| --- | --- | --- |
| 1 | Composição Pré-Ads, publicidade e Pós-Ads; comparação do SKU no Raio-X | Implementado; regressões preservadas |
| 2 | Resultados: Visão Geral, Diário, Marketplaces, ABC e Forecast | Implementado; navegação, cards, filtros e popups conferidos |
| 3 | Operação: Envios, Estoque e Projeção; separação CD/Full | Implementado; consulta e cenários conferidos |
| 4 | Financeiro: Metas, Comissão e DRE | Implementado; apuração publicada separada da leitura atual |
| 5 | Produtos por ponto e fila central de Pós-venda | Implementado; perfis e fluxos fictícios conferidos |
| 6 | Homologação integrada, regressões e roteiro de aceite | Validação técnica concluída; aceite operacional pendente |

## Conferências realizadas

- **441 testes automatizados aprovados**, sem falhas ou ignorados. Incluem cinco regressões da troca concorrente de sessão adicionadas neste bloco.
- Navegador Edge/Playwright contra servidor local isolado, com bancos e usuários fictícios. A seleção real de agosto, setembro e outubro retorna meses completos; a passagem entre oito visões mantém ponto, empresa, marketplace e datas. Competências de DRE, janela própria do Diário, posição de estoque e fila de Pós-venda conservam seus alcances explicitados.
- Resultados: seis indicadores e contas na Visão Geral, Top 10 e TACOS nos Marketplaces, ABC com Pareto/matriz e Raio-X, Forecast e horizontes/placar do Diário. Nenhuma consulta exige download integral de DETALHE nesses percursos.
- Vendas: indicadores, situações, título/CTP essenciais, paginação, busca, detalhe, Raio-X e retorno preservando seleção. Exportação fictícia integral com **142 registros**, distinta da página de **50**. O Pós-Ads permanece na leitura principal; a margem registrada antes do Ads adicional fica explicitamente identificada na composição de apoio.
- Gerencial: TACOS nas colunas essenciais; popup Raio-X compara o mesmo SKU em outras operações, com período próprio, sem sair da análise. Comparação macro autorizada não concede tratativas ou apuração fora da carteira. Gráficos de Panorama limitados a 260/300 px no teste e ampliáveis em popup.
- Acompanhamento: seis cards, selos e progresso por gestor; imagens de Tarefas, Promoções e Ads geradas da subaba selecionada. A imagem não foi enviada a nenhum grupo. Coordenação mantém Mesa de cobrança, agenda e abertura dos atrasos; gestor conserva a própria fila. Alinhamentos e Pendências continuam acessíveis.
- Operação: estoque não aguarda projeção de vendas, Full operacional não expõe custos/TACOS, cenário não altera estoque e falha de posição não vira saldo zero. Metas, Comissão e DRE conservam seus valores publicados e detalhamentos; mês ausente aparece sem valor.
- Produtos: Bsan/Powerfull separados, resumo integral do ponto e consulta em lote; estoque sem campos financeiros. Embalagens/preparação continuam separadas. Falha opcional do resumo preserva a lista confirmada; falha da lista a limpa; resposta antiga não substitui o ponto atual.
- Pós-venda: lojas concedidas, prazos, responsável, atualização/histórico em banco fictício e contexto do próprio pedido sem valores financeiros. Perfil próprio continua sem acesso a Vendas, DRE, Acompanhamento ou catálogo de Produtos.
- Temas claro/escuro e largura de 390 px conferidos nos percursos dos blocos e na navegação integrada. As evidências de desempenho são locais com dados fictícios, não uma promessa de latência do Render ou das APIs externas.
- Endpoints protegidos devolveram 401 sem sessão; estoque, compradora e Pós-venda receberam 403 nas APIs gerais de vendas/financeiro. Outro ponto e outra loja foram bloqueados. Arquivos de configuração e bancos de teste não são servidos pelo HTTP.

## Correção encontrada na homologação

Uma resposta 401 atrasada de uma consulta iniciada na sessão anterior apagava a sessão recém-aberta. A consulta global agora encerra somente o token que a iniciou, se ele ainda for o corrente. O erro foi reproduzido antes da correção e o cenário passou no navegador depois. Expiração do token corrente continua limpando a sessão e pedindo login. O integrador aplica a mesma correção nas recompilações; o teste verifica também renovação do token e idempotência.

## Limites da validação

- O bloco 5 foi confirmado online pelo hash do HTML e do asset de Produtos, além de bloqueios anônimos. Este bloco acrescenta a proteção da sessão; sua publicação é conferida pelo mesmo processo.
- O PostgreSQL do Pipeline foi consultado somente para leitura no bloco 5: schema de Pós-venda e prazos conferidos. Não houve caso real elegível para validar o contexto de pedido. O schema de Produtos não estava nessa conexão; não foi presumida a configuração de outro banco. A operação autenticada de Produtos no ambiente online ainda deve ser conferida com a sessão da equipe e a conexão destinada ao módulo.
- Não foram alterados produtos/estoque no Tiny, importados custos oficiais, ativadas vigências reais, publicados custos no Pipeline, recalculadas apurações fechadas ou enviadas mensagens. Os testes de escrita ficaram restritos ao atendimento fictício do bloco 5.
- Nenhum teste técnico substitui o aceite da equipe sobre códigos, medidas, custos, números e decisões comerciais.

## Roteiro de aceite operacional

Registrar para cada item: responsável, data, ponto/loja, referência conferida, resultado e evidência. Estados: **pendente**, **aprovado** ou **ajuste necessário**. Não incluir senhas, tokens nem dados pessoais nas evidências compartilhadas.

| Responsável | Conferência no ambiente oficial | Resultado esperado | Estado inicial |
| --- | --- | --- | --- |
| Direção/TI | Entrar em Produtos no online com usuário autorizado e conferir conexão, concessões e atualização de cada ponto | Catálogo Bsan e Powerfull disponível no banco destinado ao módulo; falhas explícitas | Pendente |
| Estoque | Abrir fichas já vindas da Olist/Tiny; conferir SKU, NCM, peso e medidas de produto/embalagem | Sem duplicar ficha; dados operacionais corretos e sem custo ou vendas visíveis | Pendente |
| Compradora/Direção | Conferir amostra de custos da Precifique, componentes e pendências | Ausência de custo sinalizada; não tratada como custo zero | Pendente |
| Compradora/Direção autorizada | Preparar e aprovar uma revisão, depois definir sua vigência por data | Uma pessoa autorizada aprova; histórico preservado; aprovação e início da vigência distintos | Pendente |
| Compradora/Estoque | Conferir insumos, composições, quantidades/unidades e códigos CM, CP, CG, SFE, CI, SS/SM/SF/KIT | Cada código identifica embalagem real; padrão informado somente Bsan; ambiguidades resolvidas antes da homologação | Pendente |
| Direção/TI | Comparar amostra de vendas antes e depois da data de um custo em simulação controlada | Custo correto pela data, preservando histórico e decisões sobre apurações fechadas | Pendente |
| Gestores/Coordenação | Conferir anúncios, TACOS e Raio-X do mesmo SKU; cobrar uma pendência e combinar retorno | Comparação macro compreensível; ação e acompanhamento limitados à carteira responsável | Pendente |
| Coordenação | Conferir Tarefas, Promoções e Ads, selos e imagem da subaba | Cards e imagem reproduzem a seleção; registro separado de resultado medido | Pendente |
| Pós-venda | Escolher atendimento da loja concedida, conferir pedido, responsável, prazo e próxima ação | Contexto correto e histórico íntegro; ausência na base não encerra o caso | Pendente |
| Direção | Conciliar uma competência de Metas, Comissão e DRE com a referência oficial | Leitura atual separada da apuração publicada; diferenças explicadas | Pendente |
| Direção/TI | Autorizar e executar separadamente a ativação de cargas/publicações oficiais que ainda estejam em preparação | Aprovação sobre amostra e efeito concreto; cópia/retorno definidos antes da ativação | Pendente |

## Retorno e continuidade

Sem migração de schema neste bloco. Para retorno técnico, reverter somente a proteção de sessão e seus testes/documentação, preservando o bloco 5 e outras entregas. Não restaurar bancos ou snapshots por causa de uma reversão visual. O próximo trabalho é executar o aceite acima e tratar os ajustes encontrados, sem reabrir a modernização já concluída nem presumir a publicação dos custos oficiais.
