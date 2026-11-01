# Fase 6 — Resultados: Diário, Marketplaces, Curva ABC e Forecast

Revisão de 01/11/2026 sobre d7d5c8377f44f73cded4fcb865c5369a5a9fb4f1. Esta é a fase 6 da auditoria de páginas, distinta das fases anteriores de auditoria do Pipeline conduzidas com o Cursor. A referência visual continua sendo Metas. Forecast permanece macro em Resultados; Projeção permanece física em Operação e Full continua no Gerencial.

## Projeto e processo de implementação

| Passo | Entrega | Critério de conferência |
|---|---|---|
| 1. Fontes e contratos | Distinguir vendas finalizadas, linhas, pedidos identificados, mídia alocada, margem registrada/real e apuração final. | Numerador, denominador, período e presença disponíveis no modelo; ausência não recebe percentual fictício. |
| 2. Consulta agregada | Resumo por operação/dia e SKUs efetivos por empresa/canal, com datas exatas. | SQL/local conciliados; sem IDs de pedidos ou detalhe completo na resposta. |
| 3. Leitura e fluxo | Guia no topo, alcance, controles, indicadores, sinais visíveis e aprofundamento. | Mesmo recorte em cartões, tabelas, gráficos e exportação; detalhes opcionais não escondem o pré-diagnóstico. |
| 4. Métodos e referências | Cortes da ABC, índice relativo opcional e métodos do Forecast declarados. | Nada é chamado de regra universal de desempenho, lucro final ou garantia de previsão. |
| 5. Validação e entrega | Testes de cálculo, permissões, navegação, exportação, temas, responsividade e falhas. | Instalação com backup/guardas; bases incorporadas e núcleo financeiro preservados; pacote publicado correspondente. |

## Diário

Pergunta central: o que está registrado no dia ou janela escolhida e como se compara à referência? A leitura deve permitir abrir a conta que explica o resultado, sem duplicar demandas ou tratativas.

| Achado anterior | Correção |
|---|---|
| `ped` do agregado contava linhas e era apresentado como pedidos, influenciando o ticket e a nota. | Pedidos identificados distintos por empresa/canal no intervalo; ticket usa somente a receita das linhas com pedido identificado. Linhas sem ID são declaradas. Agregado local antigo sem identificação não produz pedidos ou ticket fictícios. |
| Dia com volume inferior à mediana podia receber “em andamento”; o último dia “fechado” dependia dessa hipótese. | A consulta escolhe o último registro de venda da seleção, sem certificar fechamento por volume. A fonte não informa encerramento diário. Hoje recebe apenas a observação de que ainda pode ser atualizado. |
| Referência ausente era substituída por zero e podia gerar “novo”, conquista ou posição no ranking. | Ausência fica distinta de zero. Variação percentual com denominador zero fica indisponível; diferença absoluta continua possível quando ambos os valores são conhecidos. Operações presentes só na referência também aparecem com ausência atual. |
| Margem percentual agregada não respeitava a base particular da Temu. | Soma a base percentual dos canais: receita nos demais, líquido na Temu. Antes/depois de mídia usam a mesma base, sem média simples de percentuais. Diferenças de taxas são pontos percentuais. |
| Nota e metas locais podiam parecer avaliação universal do gestor. | Contribuição e evolução são a leitura principal. Índice relativo e referência de variação ficam opcionais e explicitamente distintos de avaliação de colaborador e meta oficial. |

Fluxo: alcance e datas → quatro indicadores principais → sinais → valores e referência → operações → contribuição/evolução, série diária e relação faturamento/margem. Dia, semana e mês continuam disponíveis em contexto; mês, trimestre, semestre e ano podem ser lidos até o dia de referência. Intervalos personalizados são escolhidos em calendário com faixa visual. As quantidades de dias e o divisor da referência ficam declarados; períodos de durações diferentes não são apresentados como equivalentes.

O dia próprio do Diário não modifica o intervalo compartilhado das outras páginas. Referências do dia: anterior, mesmo dia da semana anterior ou média dos sete dias corridos anteriores. A média divide valores e quantidades por sete; ticket e taxas permanecem razões da base de referência, não médias simples de taxas diárias.

Índice relativo opcional: cada indicador é normalizado pelo maior valor positivo da seleção, com negativos limitados a zero, e os pesos formam a média. Mantém a ideia anterior como ferramenta configurável; não mede eficiência, causalidade ou desempenho individual. Indicador ausente com peso ativo impede uma nota conhecida. Referência de variação não aprova automaticamente bases ausentes, zeradas ou negativas.

## Marketplaces

Pergunta central: como os canais compõem faturamento e margem no recorte, e quais contas/produtos explicam essa composição?

| Achado anterior | Correção |
|---|---|
| Gráficos mensais voltavam a buscar o mês inteiro, mesmo com consulta por poucos dias; sem meses no intervalo havia fallback para os últimos meses. | Cada mês contém exclusivamente os dias selecionados. Sem série permanece sem série, sem preencher com outro período. |
| Só quatro canais recebiam cartões, com leitura resumida e valores abreviados. | Totais legíveis do recorte e tabela de todos os canais, com participação, contribuição e abertura das operações. Valores monetários têm centavos. |
| Temu usava líquido no cartão, mas faturamento em algumas séries e variações percentuais. | Mesma base percentual no resumo, canal, evolução e comparação. |
| Top 10 dependia do detalhe que a navegação não carregava. | Consulta agregada sob pedido, com SKUs efetivos da empresa/canal, sem abrir Vendas nem baixar todas as linhas. |

Cartões mostram faturamento, margem registrada, margem/base e unidades finalizadas. Participação não equivale a rentabilidade. Colunas completas adicionam pedidos identificados, ticket e margem após mídia; a abertura permite ir ao Panorama dentro da carteira autorizada, preservando o período. Comparação de períodos fica separada das séries mensais, para não misturar mês inteiro com fração de mês.

Ranking por operação conserva faturamento, volume, margem registrada e margem real disponível com rótulos distintos. Ausência de margem real usa a origem e declara o fallback. Nenhuma dessas margens recebe o nome de lucro final.

## Curva ABC

Pergunta central: em quais itens se concentra a participação positiva de faturamento, volume ou margem real disponível? Pareto, tabela e matriz precisam compartilhar os mesmos itens.

| Achado anterior | Correção |
|---|---|
| Base mensal por canal era multiplicada pela participação da empresa para estimar seus SKUs. Até unidades podiam virar frações por rateio. | Consulta efetiva por empresa, canal e SKU no intervalo exato, respeitando também o ponto. Sem inventar composição da empresa a partir do canal. |
| Dados mensais e acumulados eram usados como alternativa à janela diária e o proxy podia ser gravado no estado mensal. | Classificação principal não usa fallback mensal/acumulado nem cria proxy. A referência anterior continua consultável separadamente, identificando suas limitações de competência e segregação. |
| Um primeiro item com mais de 80%/95% podia cair em B/C; empates eram partidos pela ordem. | Classificação usa o acumulado anterior ao item; o item que cruza o corte fica na faixa iniciada antes dele. Empates permanecem juntos. Classes podem ultrapassar os cortes de referência. |
| Zero e margem negativa ficavam na classe C e cores/categorias pareciam diagnóstico automático. | Classe N separa valores não positivos/ausentes. Negativos continuam visíveis. A/B/C indica concentração; não é saúde, autorização de escala ou recomendação de cortar produto. |

Padrão: SKU por operação. O consolidado por código é opcional e declara que códigos iguais não comprovam equivalência cadastral entre empresas. SKU ausente fica fora da classificação, com quantidade de grupos e receita afetada visíveis.

Critérios: faturamento, unidades ou margem real disponível. A margem real, quando ausente, usa a margem de origem com contagem de linhas afetadas, inclusive respeitando o marcador explícito de ausência do arquivo local. Zero real informado continua zero. A curva de margem considera a soma positiva para participação; negativos não são apagados do resultado do item.

Cortes locais padrão 80% e 95%, ajustáveis com `0 < A < B < 100`. Fórmula da classe: acumulado anterior/carga positiva total, com tratamento conjunto de empates. Busca e filtro não recalculam o denominador. Pareto mostra até 30 itens, com acumulado sobre todos os itens. A matriz mantém a ordem Faturamento · Unidades · Margem e os 27 códigos positivos; itens com N em algum critério têm abertura própria. Código é descrição de concentração, sem categoria automática de desempenho.

Preservados: três critérios, Pareto, composição por classe, matriz, seleção de grupo, busca, ordenação, paginação, colunas completas, detalhe, Raio-X autorizado e exportação. Referência mensal anterior abre até 100 linhas na tela e exporta o conjunto, sem aplicar rateio de empresa nem fingir recorte diário.

## Forecast macro

Pergunta central: que cenário o histórico selecionado implica, com quais meses, método e hipóteses? Não confundir margem de vendas, apuração final e meta de lucro.

| Achado anterior | Correção |
|---|---|
| Tendência lia `ROWS` com filtros diferentes dos realizados e podia ignorar ponto/contexto do cabeçalho. | Histórico e cenário vêm do mesmo agregado com escopo declarado. |
| Regressão usava observações consecutivas no ajuste e distância de calendário na projeção. Meses ausentes deformavam a inclinação. | Ajuste e projeção usam a mesma distância real entre meses. Lacunas ficam sem valor. |
| Mês era chamado completo/fechado por posição da última venda; falha de histórico podia apenas apagar o gráfico. | Meses inteiros na janela e já passados no calendário são candidatos, sem certificação de coleta. Usuário confere e exclui meses. Histórico insuficiente é explícito e não vira cenário zero. |
| Margem das vendas aparecia como lucro e era comparada à meta de lucro final; havia percentual fixo de empresa e valores arredondados. | Margem registrada/após mídia mantém sua definição. Meta de lucro e resultado apurado da fonte oficial ficam separados. Sem régua universal de 20% e sem arredondamento antecipado. |

Histórico padrão: últimos 12 meses até o fim do recorte compartilhado. Alternativas: próprio intervalo do cabeçalho, seis meses, 24 meses ou personalizado. Datas próprias do histórico ficam no topo; o intervalo compartilhado é guardado. Ampliar o histórico do Forecast não modifica as outras páginas nem carrega o detalhe completo. Comparação geral entre períodos fica guardada nas outras análises; aqui se comparam métodos e cenários declarados.

Métodos: tendência linear ou média dos meses selecionados. Tendência exige pelo menos dois meses usados; média exige um. A escolha de meses fica aberta durante os ajustes. A quantidade de dias registrados é exibida, sem presumir coleta completa. Horizonte de três/seis/12 meses. Faixa manual de variação entre 0% e 100% é hipótese, não intervalo de confiança. Faturamento/unidades que cruzem zero são limitados a zero, com valor bruto da regressão no CSV; margem negativa permanece negativa.

Preservados e reorganizados: evolução, cenário futuro, histórico mensal/trimestral/semestral/anual, comparação de mesmo mês entre anos, metas e atingimento de faturamento e objetivos por operação com abertura no Gerencial. Não existe meta de volume inventada. Histórico das metas de faturamento considera somente as operações com objetivo em cada competência; se faltar registro de uma delas, realizado comparável e atingimento ficam indisponíveis. Comparação com meta mensal identifica quando o realizado contém só parte do mês.

A antiga extrapolação de lucro pela simples divisão de dias e o confronto de margem das vendas com alvo de lucro final foram substituídos por fontes separadas. O quadro de objetivos mostra meta de faturamento, faturamento da apuração, meta de lucro derivada de faturamento-alvo × margem-alvo, resultado apurado da fonte, margem final/meta e TACOS/teto. Não recalcula bônus, custos ou fechamento. Competência da apuração é explícita e não muda silenciosamente quando está sem dados.

## Mídia, contratos e atualização

Resumo usa vendas finalizadas (`venda` e `venda_com_troca`), com eventos de devolução separados. Devolução no período não gera taxa por coorte. Pedidos distintos são contados no banco por empresa/canal dentro da janela; linhas sem identificação são contabilizadas e sua receita não aumenta o ticket dos pedidos identificados.

Mídia conserva o maior total mensal entre anúncio e campanha, sem somar essas visões. Afiliados no líquido não são descontados outra vez. No TikTok, os componentes de Ads/afiliados já informados no líquido são somados de volta apenas na leitura anterior à mídia. A mídia adicional dos demais canais é alocada por pesos diários; na ausência, pelo faturamento do mês. Os valores diários são alocações de total mensal, não promessa de gasto real daquele dia. Dia com venda sem peso na série diária fica com cobertura incompleta mesmo quando há total mensal; o rateio zero naquele dia não é certificado como gasto real zero.

O denominador do rateio usa a competência inteira, mesmo numa consulta de poucos dias. Quando há filtro de ponto, a mídia da operação é distribuída pela participação de receita do ponto; com pesos diários, usa também a participação no faturamento daquele dia. A fonte de Ads não informa ponto físico. Mídia registrada num dia sem venda não desaparece do período. Quando só há mídia, o gasto é conhecido, mas faturamento e margem ausentes não aparecem como zero confirmado. Sem pesos ou receita para atribuição, o vínculo pendente é declarado. A mídia não vira custo de outro ponto por absorção integral do orçamento da conta.

Novas rotas somente de leitura: `/api/resultados/resumo` e `/api/resultados/skus`, ambas exigindo `vendas.ver`. Resumo aceita até 16 faixas válidas e devolve agregados, sem IDs de pedidos. Faixas e série mensal necessária ao rateio são lidas na mesma instrução SQL. Filtros são parametrizados. Cache do cliente é curto, por sessão/permissões, contexto e janela, com atualização explícita. Erro retira valores antigos, bloqueia sua exportação e permite tentar novamente; não usa um fallback local silencioso para a API.

O alcance macro de Resultados já autorizado aos perfis foi preservado. Aprofundamento gerencial continua na carteira do gestor; objetivos/comissão respeitam os dados disponíveis ao perfil. DRE continua exclusiva da Direção. Não houve concessão de acesso, job de coleta, migração de esquema, reprocessamento financeiro ou mudança nas fotos de fechamento.

## Validação

161 testes automatizados aprovados: 121 anteriores e 40 novos. Incluem pedidos de R$ 85,01 em dois itens, identificação ausente, pedidos iguais em operações distintas, recorte exato, Temu, mídia mensal/diária, ponto físico, dia sem venda, ausência/zero, SQL/local, entrada literal em filtros, datas inválidas, ABC/cortes/empates/negativos/matriz, margem real ausente, distância mensal, meses excluídos, cenário negativo, objetivos com carteira parcial e permissões.

Navegador e API do BsanControl foram exercitados com usuários e dados exclusivamente fictícios em SQLite isolado, sem worker externo:

- Dia 30/10: R$ 95,01, três itens/unidades, um pedido identificado e uma linha sem ID. Ticket identificado R$ 85,01; os dois itens do mesmo pedido não contam como dois pedidos.
- Outubro no grupo: faturamento R$ 77.557,51, margem registrada R$ 11.429,32 e 374 unidades. Bsan Shop/Mercado Livre: R$ 27.802,51; tabela, ranking e abertura no Panorama mantiveram o recorte. Panorama confirmou R$ 4.811,40 após o Ads adicional da fixture.
- Curva por empresa apresentou seus SKUs efetivos. Item de margem real -R$ 11,00 ficou em N, visível na matriz/detalhe/CSV. Seleção de código da matriz, busca, critérios e colunas conferidos. Título com aparência de HTML/fórmula foi exibido como texto e protegido no CSV.
- Forecast de Jowcase: 11 meses usados com junho ausente. Primeiro mês da tendência: R$ 7.098,88; média: R$ 2.335,93. Retirar outubro deixou dez meses e mudou o cenário. Os ajustes preservaram a abertura do painel de seleção. Metas de faturamento de setembro/outubro mostraram 88,43% e 91,15%, sem serem confundidas com a margem das vendas.
- Calendário personalizado selecionou três dias com faixa visual e aplicou o intervalo; consulta sem registros permaneceu sem valores. Média de sete dias, gráficos ampliados e tabela de valores, comparação entre anos e CSVs conferidos.
- API: Direção, Coordenação e Gestor permitidos; restrição individual de vendas retornou 403; sem sessão retornou 401; faixas inválidas retornaram 400. Conciliação SQL/local por empresa/canal e ponto aprovada. O caminho macro não acionou `/api/detalhe`; o detalhe só foi solicitado depois do aprofundamento explícito no Gerencial.
- Gestor viu os resultados macro, com abertura de conta fora da carteira desabilitada. Abertura permitida fechou o diálogo e levou ao Panorama sem perder as datas. DRE não apareceu nesse perfil.
- Falha controlada 503 retirou a consulta antiga; nova tentativa recuperou os resultados. Claro/escuro e 390 px conferidos nas quatro páginas, com rolagem própria nas tabelas e sem transbordamento horizontal da página. Um erro do gráfico de dispersão com pontos nulos foi corrigido; o fluxo final foi conferido sem erros JavaScript.

A compatibilidade SQL também foi validada no PostgreSQL 17 do projeto BsanControl/Supabase: inspeção somente de tipos e execução das duas consultas no intervalo vazio do ano 1000, sem retornar valores financeiros reais e sem DDL/DML. Os campos legados são REAL e os campos `_n` são NUMERIC; a normalização de ausência usa conversão textual explícita antes de NULLIF, compatível com ambos e mantendo `_n` como prioridade. Referências consultadas: [conexão Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres) e [notas da versão 17.11](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes). Não foram alterados extensões, índices, autenticação, políticas ou grants.

Integração idempotente, compilação e pacote correspondente conferidos. Dados incorporados, cálculos financeiros e fontes que não fazem parte desta fase são preservados na instalação. A conferência gerencial dos dados oficiais e a aceitação do usuário continuam pendentes.

## Evoluções recomendadas, sem declarar dados inexistentes

| Evolução | Decisão apoiada | Dependência |
|---|---|---|
| Encerramento e cobertura de coleta diária por operação | Distinguir dia sem venda de coleta/preenchimento pendente. | Marcador de conclusão e calendário operacional, não mediana de volume. |
| Erro e viés do Forecast ao longo do tempo | Escolher método e horizonte mais adequados. | Fotos dos cenários preservadas e realizado posterior comparável. A faixa manual não substitui essa avaliação. |
| Taxa de devolução por coorte | Entender a qualidade das vendas de cada período. | Vínculo entre venda original, todos os itens e eventos posteriores. Não dividir eventos desconexos por vendas atuais. |
| Cenário de lucro final | Planejar resultado depois de toda a estrutura de custos. | Modelo explícito de custos variáveis/fixos, mídia, devoluções e conciliação da apuração. Margem de venda não basta. |

Próxima fase do plano: Financeiro → DRE e revisão de integração de Metas, Comissão e Administração. Não foi iniciada automaticamente nesta entrega.
