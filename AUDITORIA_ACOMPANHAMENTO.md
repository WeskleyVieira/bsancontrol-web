# Fase 4 — Acompanhamento

Autorizada em 01/11/2026. Base c947d9f069dbe4b4b5ee3099856255269dfbeb2e. Padrão visual: Metas e as fases 1–3. Escopo: Tarefas, Promoções e Ads, com carteira, histórico, registro, consulta e integração com o Gerencial. Anúncios em breve continua indisponível.

## Inventário e perguntas

| Área | Pergunta e decisão | Recursos de origem e evolução |
|---|---|---|
| Direção | Onde há pendência e que carteira precisa de aprofundamento? | Resumo, matriz por responsável/tipo, comparação, abertura do gestor e imagens. A comparação passa a explicitar ativas, sem registro, atrasadas, revisão, registro/prazo com denominadores e resultados separados. Volume isolado não vira nota individual. |
| Coordenação | Quem deve agir e o que precisa de retorno? | Fila por atraso, 24h e recobrança; filtros por tipo, gestor e operação; cópia de cobrança. Atalhos abrem a situação correspondente e a lista declara os filtros locais. |
| Gestor | Qual demanda tratar e qual foi o último retorno? | Fila própria, operações da carteira, abertura da conta, Raio-X, ação/causa/observação, novo preço e data de retorno. O contexto acompanha o formulário e a gravação é confirmada pelo servidor. |
| Promoções | O apontamento ainda corresponde à última leitura e o registro foi conferido? | Tipo, causa original, última leitura de promoção, checagem de preço, validação, histórico de comando e medição. Cada data/alcance permanece separado. Reaplicação desativada conforme origem. |
| Ads | Qual ação foi indicada e em qual nível? | Tarefas reais de campanha e anúncio já existem; registro, prazo, causa e medição preservados. O plano é a fonte da indicação; registrar não executa pausa, mudança de ROAS ou orçamento. |

## Achados e correções

1. **Fila substituta após erro ou vazio.** `ac2Open` tratava HTTP 200 com [] como falha e também substituía erro da API por `ac2BuildDemandas`, com referência fixa de 15%. No online, resposta vazia válida permanece vazia; falha retira os indicadores e oferece nova consulta. Cálculo derivado permanece somente no arquivo aberto via file:, explicitamente local e sem registro oficial.
2. **Competência inacessível no cabeçalho.** Acompanhamento usava meses de `getR`, mas ocultava o período como se fosse somente posição de estoque. O período volta a ficar disponível e explica que seleciona competências inteiras. Prazos continuam sendo avaliados agora; não é fotografia histórica do fechamento.
3. **Registro confundido com execução e resolução.** Separem-se ação informada, conferência do plano/preço e medição observada. O histórico completo agora pode ser consultado pela mesma autorização de leitura da demanda. Gravar mantém os registros anteriores.
4. **Medição anterior a nova ação.** O último resultado do banco podia alimentar o placar mesmo após outra ação. Resumo e revisão exigem data de medição comparável à última ação. Sem data, parcial, pausado, sem venda e ausência de leitura não viram sucesso/fracasso conclusivo.
5. **Dinheiro recuperável e nota universal.** A referência do plano tem bases diferentes por tipo e pode representar cenários sobrepostos. Não é somada como perda nem recuperação garantida. Índice referência × atraso permanece apenas como ordenação. Resolução, progresso e justificativa ficam separados; não há selo crítico/ideal universal para gestores.
6. **Precisão e segurança de leitura.** Percentuais têm duas casas (199/200 = 99,50%); vazio não vira 0%. Textos entram por textContent. CSV conserva duas casas, sinal e proteção de fórmulas. Busca, responsável, operação, tipo e situação são combináveis; paginação de 25 não limita o arquivo do filtro inteiro.
7. **Gravação parcial e demanda inexistente.** O POST antigo podia inserir sem demanda para Direção/Coordenação e gravava registro e estado separadamente. Agora verifica a existência/escopo, valida os campos, usa horário do servidor e transação. O espelhamento existente é agendado depois, sem mudar seu contrato. Histórico respeita carteira e permissão de consulta; escrita respeita a permissão já existente.

## Estrutura implementada

Como ler no topo → seleção de visão e atualização → contexto/fonte → quatro indicadores → Por onde começar → fila ou comparação → critérios complementares.

Detalhe da demanda: apontamento original, datas/prazo, última leitura da promoção quando houver, conferência de preço, revalidação, medição após a ação, último registro, sequência completa, anúncio externo validado, Raio-X e abertura da conta/histórico. Cadastro, fonte e percentuais não são confundidos com objetivo oficial.

Histórico de vendas por SKU conserva receita, líquido, imposto, CTP e margem disponível. A composição e a simulação de preço utilizam o motor de origem, com premissas declaradas; o preço médio do agregado não é apresentado como distribuição real de vendas. Quando o detalhe das vendas estiver carregado, as linhas são abertas como evidência. Não há alteração de preço ou custo nas plataformas.

Diagnóstico e abertura de Anúncios podem localizar demandas existentes da operação/item. Não há criação de demandas por clicar em um indicador nem segunda fila em Metas. Competência anterior pode ser consultada na comparação apenas quando há referência disponível; não se presume zero para ausência.

## Definições dos indicadores

| Indicador | Fórmula / fonte | Ausência e limite |
|---|---|---|
| Sem registro | Demandas ativas sem ação/estado de registro, da API de demandas | Estado fora e observação excluídos. Ausência de registro não prova ausência de trabalho realizado fora do sistema. |
| Atrasadas | Sem registro e criado_em + prazo_dias menor que agora | Sem criação não inventa atraso. Prazo do plano; se ausente, fallback legado por tipo indicado no detalhe. |
| Revisar ação | Registro presente e retorno vencido, divergência atual ou medição que pede conferência | Validação e preço precisam ser posteriores ao último registro; não declara causa ou fracasso universal. |
| Aguardando medição | Registro presente sem desfecho conclusivo atual | Medição antiga ou sem data comparável não valida nova ação. |
| Registro | Registradas / ativas | Denominador exposto; vazio indisponível. |
| No prazo | Primeiro registro com reação conhecida dentro do prazo / registros com reação conhecida | Usa MIN(reacao_h) de origem; não atribui o horário da última ação ao primeiro atendimento. |
| Resultado | Contagens separadas de resolvido, progresso, justificado e desfavorável | Medições posteriores à última ação; não prova causalidade ou retorno financeiro. |

Atualização: consulta ao abrir, com reaproveitamento de até 60 segundos por sessão, e botão Atualizar fila. Horário da consulta é diferente da coleta/execução da plataforma. Período, empresa, canal e carteira seguem o cabeçalho e o acesso vigente.

## Plano de validação e entrega

- Modelos: prazos, ausência, futuro, competência, medição antiga, referência, retorno e precisão.
- Banco: histórico completo, escopo, leitura sem escrita, validação, hora do servidor e rollback da gravação parcial.
- Navegador em banco fictício: três sub-abas, resumo, filas, filtros, paginação, comparação, CSV, imagens, detalhe, histórico, formulário, falha/recuperação, vazio, leitura restrita, temas e celular.
- Instalação com backup e guardas de concorrência; sete bases incorporadas preservadas, nenhuma coleta ou reprocessamento. Conferir pacote publicado e autenticação.

Esta fase não certifica o gerador dos planos nem a conciliação financeira. Os critérios legados de origem são identificados, sem impor nova régua à remuneração, aos fechamentos ou às metas. Conferência gerencial dos dados reais permanece pendente.

## Validação realizada

96 testes aprovados: 76 anteriores e 20 novos. Incluem referência de R$ 85,01, 199/200 = 99,50%, prazo ausente/futuro/zero, datas de medição, observação/fora da régua, denominadores, validação e rollback; registros simultâneos conservam cada ação.

API isolada: histórico sem sessão 401; outra carteira 403; usuário com restrição de escrita recebe 403 e conserva consulta; descrição inválida 400; três POST simultâneos confirmam três registros completos. Banco usado exclusivamente fictício, sem worker externo.

No navegador: registro fictício remove pendência sem declarar resolução, horário vem do servidor e histórico anterior permanece; medição antiga é marcada como anterior. Competência de setembro sem plano disponível não é substituída por cálculo local. HTTP 503 retira indicadores e oferece recuperação; HTTP 200 com [] conserva vazio. Comparação de responsáveis/operações, promoções com última leitura e comando histórico, Ads por campanha/anúncio, CSV com 40 demandas embora a página mostre 25, imagem gerada, carteira do Gestor e Coordenação somente leitura conferidos. Gerencial abre a fila da operação sem criar demanda.

Tema claro/escuro, largura de 390 px com página de 385 px de conteúdo e diálogo de 385 px sem transbordamento; guia primeiro no conteúdo. Nenhum erro de JavaScript nos fluxos finais. Erro HTTP fictício de consulta foi provocado e tratado. Conferência de valores reais permanece com o usuário.
