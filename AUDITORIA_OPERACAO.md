# Fase 5 — Operação: Envios, Estoque e Projeção

Implementação de 01/11/2026, sobre d9cb4ca3847b1de62918fc747856bc4d42942db7. Ordem aprovada preservada: Envios, Estoque, Projeção. Full continua no Gerencial e Forecast continua macro, em Resultados. Referência visual: Metas. Guia no topo, contexto, indicadores legíveis, sinais visíveis, abertura por registro, gráficos ampliáveis e critérios extensos opcionais. Nenhuma demanda ou tratativa duplicada.

## Projeto e sequência executada

1. Conferir fontes e contratos, antes da revisão estética: contagens de envios, posição física e vendas finalizadas não representam a mesma grandeza.
2. Unificar os filtros de Envios; preservar preenchimento, modelo de planilha, prévia e gravação versionada.
3. Reorganizar Estoque por ponto/SKU, distinguindo CD, Full, ausência, duplicidade e cadastro pai; corrigir o transporte dos campos existentes na origem.
4. Reconstruir a leitura de Projeção com uma consulta agregada única e premissas explícitas; conservar a referência do algoritmo anterior para comparação.
5. Validar modelos, SQL, permissões, integração, formulários, CSV, gráficos, temas, responsividade e falhas; instalar com guardas, backup e correspondência do pacote publicado.

## Envios — o que foi corrigido

| Achado | Implementação e decisão apoiada |
|---|---|
| Cartões somavam toda a base enquanto detalhes/gráficos aplicavam filtros. | Um modelo alimenta cartões, quatro gráficos e abertura por operação, respeitando datas, ponto, empresa e marketplace. Busca da tabela é identificada como refinamento local. |
| Janela sem registros retornava silenciosamente aos últimos dados. | Vazio permanece vazio. Último dia registrado é um modo explícito, escopado à operação, com sua própria data; pode ficar fora do intervalo do cabeçalho. Ampliação do gráfico repete esse contexto efetivo. |
| Dias ausentes se confundiam com zero, e volume maior parecia sucesso. | Zero informado permanece zero. Ausência de dia/modalidade é declarada; contagem não é pedido único nem unidade vendida. Variação é conferência, sem nota de desempenho. |
| Duração da referência dependia de observações, não do calendário. | Intervalo anterior de mesma duração em dias corridos, ou comparação explícita do cabeçalho. Último dia compara o dia anterior com registro, com regra e datas visíveis. Sem base não há percentual fictício. |
| Preenchimento e consulta estavam desconectados. | Operação abre os dias que formam o total, com exportação e edição pelo formulário existente. Modelo Excel, importação com prévia, preservação das linhas ausentes e confirmação versionada do servidor foram conservados. |

Indicadores: total registrado, Coleta, Flex e Full. O cartão informa quantidade de linhas e dias registrados no intervalo. Modalidade desconhecida impede apresentar o total completo como conhecido. Chave duplicada dia/empresa/marketplace e contagem inválida ficam fora dos totais e em abertura própria, sem excluir dados da origem. A referência informa seus dias registrados; diferenças entre bases esparsas não comprovam evolução do fluxo.

O destaque de variação é triagem: até 14 dias anteriores registrados, média mínima 5, diferença absoluta mínima 10 e relativa mínima 40%. Não se trata de SLA nem meta. O ponto associado à operação pelo cabeçalho não comprova a origem física de cada pacote, pois Envios não contém SKU/pedido.

## Estoque — posição antes de recomendação

| Pergunta | Leitura disponível e limite |
|---|---|
| O que precisa ser conferido primeiro? | Quantidade de posições ausentes, chaves repetidas, cadastro pai sem consolidação e saldo negativo. Saldo negativo não prova sozinho oversell. |
| Onde o CD está sem saldo ou abaixo da referência? | CD zero e cobertura CD inferior à referência escolhida, separados. Estoque Full não compensa automaticamente falta no CD. |
| Qual posição Full é conhecida? | `fullML`, separado do saldo Full do Olist. Campo ausente não vira zero. |
| A cobertura usa o canal certo? | `cobCD` informado; na ausência, aproximação por `disponível CD / (vendaDia × un90dCD / un90d)`, quando válida. Cobertura agregada antiga fica no detalhe. Negativo, duplicidade, pai não consolidado e ausência não recebem cobertura calculada. Sem giro CD é identificado. |
| Há o mesmo SKU vendendo em outros pontos? | Agregado de vendas finalizadas no intervalo, com abertura SKU/ponto, receita e margem registrada. Não autoriza transferência e não comprova estoque intercambiável. |

Referências padrão de 15/120 dias continuam disponíveis como parâmetros locais de leitura, ajustáveis. Não representam política universal de compra, estoque saudável ou capital parado. Não se estima valor imobilizado sem custo de aquisição e contexto de abastecimento.

Ponto físico tem seletor próprio. Empresa e marketplace do cabeçalho ficam guardados e inativos nesta leitura consolidada. O período do cabeçalho afeta somente as vendas de apoio, não transforma a posição atual em posição histórica. O histórico de apoio pode ser consultado sem carregar o detalhe inteiro das vendas. O usuário com acesso somente a Estoque não consulta esse apoio nem Projeção.

### Correção do contrato de origem

A importação local preferia `Por_Produto`; a sincronização online usava `Estoque` e descartava campos já existentes de CD, Full e produto-pai. O mesmo normalizador passa a atender API, importação local e próxima sincronização regular. Prefere `Por_Produto` não vazia, com fallback para `Estoque`, sem somar ambas. Preserva `fullML`, giros e coberturas por canal, nível, variações e lista explícita de SKUs vinculados, distinguindo ausência de zero.

Essa mudança apenas transporta campos existentes na fonte na próxima carga normal. Nenhuma coleta Tiny, Mercado Livre, execução de db-sync, revisão financeira ou reprocessamento histórico foi disparado nesta fase. Campos que cargas antigas converteram em zero ou eliminaram não podem ser recuperados pelo design. O horário `datasets.atualizado` é sincronização, não prova de coleta individual; se a data da posição não vem da origem, permanece não informada.

## Projeção — cenário físico conferível

A tela responde quanto o histórico finalizado implicaria em demanda para um horizonte escolhido, por SKU e ponto. Antes, cartões usavam uma base agregada enquanto a tabela dependia do detalhe ainda não carregado, misturava pontos e status, mantinha cache ao trocar de operação e aplicava tendência de faturamento automaticamente sobre unidades.

Agora há uma consulta SQL agregada em uma única instrução: SKU/ponto, dia/ponto, marketplace/ponto e metadados usam o mesmo recorte e snapshot da consulta. Não retorna IDs de pedidos nem as linhas completas. Usa apenas `venda` e `venda_com_troca`, datas exatas e ponto opcional; Temu conserva base percentual líquida. A margem é a registrada nas vendas, não lucro final depois dos custos adicionais da apuração.

**Demanda por SKU/ponto = teto(unidades / divisor × horizonte × (1 + segurança/100) × fator).** O cálculo usa precisão integral; só arredonda uma vez, ao final, para unidade inteira. Padrão: horizonte 45 dias, segurança 20%, fator 1. Quantidade ausente ou negativa em qualquer linha do grupo, SKU ausente ou divisor inválido impedem demanda válida daquele grupo.

- **Dias com registro por ponto:** divisor de cada SKU é o número de datas com venda finalizada no respectivo ponto. Conserva a ideia de média observada, sem presumir coleta diária completa.
- **Dias corridos:** divisor é a duração inclusiva do intervalo. É uma hipótese alternativa para comparar cenários; dias sem registro podem ser ausência de venda ou coleta.
- Segurança, horizonte e fator são hipóteses locais editáveis, sem criar compra, gravar meta ou alterar estoque. Fator padrão 1 elimina o ajuste automático de unidades pela tendência monetária.
- O algoritmo anterior de 45 dias/20%/tendência da receita e arredondamentos intermediários permanece no detalhe e nas colunas completas como referência, recalculado sobre a base corrigida. Não é reprodução exata de uma foto antiga nem pedido oficial.
- A posição vinculada serve para conferência. Não se subtraem automaticamente CD, Full, reservas ou trânsito. Vínculo exige ponto e SKU únicos ou lista explícita de variações. Uma posição de produto-pai compartilhada não é repetida como saldo livre de cada filho.
- Série diária usa calendário real, com lacunas sem fabricar zero. Regressão é descritiva, sobre distâncias reais entre datas; não altera a demanda e não extrapola após a última observação. Valores e ampliação permanecem disponíveis.
- Ranking mostra até 15 SKU/ponto no filtro, com volume registrado e demanda do horizonte identificados como janelas diferentes. Composição por canal fica antes do arredondamento por SKU; grupo inválido torna a estimativa por canal indisponível.

Cache é por usuário/permissões, ponto e intervalo, com validade curta e atualização explícita. Falha retira resultados anteriores e oferece nova tentativa; não usa dados locais como substituto silencioso da API. Online exige `estoque.ver` e `vendas.ver` para Projeção. O alcance macro do estoque já permitido aos perfis foi preservado, sem concessões novas ou mudança na carteira gerencial.

## Validação e limites da entrega

121 testes automatizados aprovados: 96 anteriores e 25 novos. Cobrem filtros, vazio/zero/ausência, duplicatas, referências, CD/Full, produto-pai, vínculo único, denominadores, arredondamento, tendência, SQL/local, Temu, R$ 85,01 em dois itens, entrada SQL literal, JSON inválido, permissões, conflito de versão 409 e execução real do trecho do worker. Integração idempotente, compilação dos scripts e pacote gerado conferidos.

Navegador e APIs foram exercitados exclusivamente com dados e usuários fictícios em SQLite isolado, sem worker ou serviços de coleta:

- Envios no intervalo 01–28/10: 555 no grupo antes do lançamento de teste; Bsan Shop/Mercado Livre 189, com cartões e tabela conciliados. Registro fictício de 3 envios confirmado pelo servidor elevou esse recorte a 192. Exportação/reimportação apresentou seis linhas sem alteração e nenhuma escrita adicional. Modelo Excel continuou disponível.
- Estoque: 11 posições; negativo, ausência, pai e duplicata separados; zero CD com Full 100 não foi convertido em disponibilidade CD. Texto com aparência de HTML/fórmula foi tratado como texto e protegido no CSV. Filtros, abertura, referências e exportação preservaram campos e alcance.
- Projeção: 369 unidades, oito grupos SKU/ponto, 14 dias observados. Cenário padrão: 1.424 unidades. Horizonte 10, segurança 0 e dias corridos: 133 unidades. Seleção Powerfull: 42 registradas, média 1,50 e demanda 15. Produto-pai compartilhado identificado no detalhe, sem descontar seu saldo repetidamente.
- Intervalo 01–02/09 sem vendas permaneceu sem cenário, sem reutilizar outubro. Gráfico ampliado e tabela de valores conferidos. Falha controlada 503 removeu os resultados e a nova tentativa recuperou a consulta.
- Gestor com `vendas.ver=false` manteve Estoque, sem Projeção nem apoio de vendas. Coordenação com `envios.lancar=false` consultou Envios sem lançamento/importação/edição. Permissões também são exigidas no servidor.
- Temas claro/escuro e 390 px conferidos, sem transbordamento horizontal da página; tabelas têm rolagem própria. Nenhum erro JavaScript no fluxo verificado.

A conferência gerencial dos dados reais continua reservada ao usuário. Esta fase melhora a leitura e corrige bases demonstravelmente inconsistentes; não certifica coleta completa, conciliação de estoque físico, compra líquida nem SLA de expedição. Não altera comissão fechada, custos históricos ou conciliação financeira.

## Indicadores recomendados para evolução posterior

| Indicador | Decisão apoiada | Dependência antes de implementar |
|---|---|---|
| Cobertura de preenchimento de envios | Separar dia sem movimento de contagem pendente | Calendário operacional por operação e confirmação explícita de dia encerrado/zero; não derivar somente da ausência de linha. |
| Atraso de expedição / SLA | Identificar pacotes que exigem ação | Vínculo pedido/pacote, prazo prometido e evento de despacho; contagens diárias não bastam. |
| Compra líquida sugerida | Planejar reposição sem duplicar estoque compartilhado | Prazo e lote do fornecedor, unidade de compra, posição por canal datada, compromissos e trânsito conciliados. |
| Erro e viés do cenário | Escolher método de projeção conforme produto/ponto | Fotos históricas dos cenários e realizado posterior comparável, com cobertura de coleta. |

Esses candidatos não foram apresentados como disponíveis. Fase 6 permanece pendente de autorização específica.
