# Fase 7 — DRE e integração financeira

Revisão de 01/11/2026 sobre d6397b4e446be5f24d41535667096125a8eac7f6. Esta é a fase 7 da auditoria de páginas, distinta da auditoria anterior do Pipeline realizada com o Cursor. Referência visual: Metas. A implementação altera a leitura derivada e a navegação; não recalcula comissão, remuneração ou fotografia fechada.

## Projeto de implementação

| Entrega | Pergunta atendida | Implementação e conferência |
|---|---|---|
| Login | Onde estou preenchendo? | Contorno lilás único, borda neutra e sem sombra azul. Rótulos associados aos campos; teclado preservado. |
| Competências da DRE | Qual mês e qual escopo estou lendo? | Meses completos, empresa, canal e ponto explícitos. O intervalo das outras páginas fica guardado. Até 36 competências por consulta. |
| Resultado e composição | Quanto sobrou e quais valores formam o saldo? | Indicadores, pendências visíveis, composição com sinais, cascata, evolução mensal e abertura por empresa. |
| Custos e fontes | O que foi atribuído e o que ainda falta? | Detalhe dos diretos/compartilhados, rateio em centavos, investimentos e devoluções em aberturas próprias. |
| Integração | Por que DRE, Metas e Comissão podem diferir? | Definições e atalhos mantendo competência/operação; ausência não troca silenciosamente o mês. |
| Administração e acesso | Quem pode consultar e registrar? | DRE exclusiva do recurso da Direção; lançamentos respeitam restrições individuais. Administração conserva seus fluxos de edição, histórico, arquivo e exclusão com proteção. |
| Validação e entrega | O pacote conserva as fontes e funciona? | Testes de cálculo/consulta/acesso, navegador com dados fictícios, SQL PostgreSQL somente leitura, backup e instalação guardada. |

## Achados e mudanças

| Antes | Depois e implicação |
|---|---|
| Foco azul no input e contorno roxo global. | Um contorno lilás com borda neutra. Foco permanece perceptível por teclado e mouse. |
| Vendas de parte do mês recebiam custos da competência inteira sem destaque suficiente. | A DRE consulta competências completas com datas próprias visíveis. Não combina poucos dias de venda com custo mensal como se fossem comparáveis. |
| Custos de uma empresa sem vendas podiam sumir porque a lista de empresas vinha só das vendas. | A união inclui vendas, custos diretos, participantes do rateio, investimentos e serviço. Custo sem venda continua no saldo. |
| Ponto físico e marketplace não tinham tratamento equivalente nas vendas e despesas. | Direto e pool respeitam o ponto; empresa usa sua atribuição. Canal sem rateio de estrutura mostra contribuição antes da estrutura, sem imputar a despesa inteira da empresa. |
| Seletor interno podia manter uma lista antiga quando mudavam os nomes, mas não a quantidade de empresas. | O contexto usa o seletor comum; a tabela deriva das chaves atuais, não do número de opções anterior. |
| Margem real ausente virava zero no agregado; a tabela de canais usava margem com teto. | Consulta própria informa presença da real e usa origem apenas como fallback declarado. Margem, composição e abertura compartilham a mesma definição. |
| A diferença residual era chamada de frete/motoboy e bruto menos líquido era chamado de tarifa. | Rótulos de conciliação: diferença entre faturamento/líquido e demais ajustes até a margem. Sem classificar automaticamente componentes desconhecidos. |
| Valores negativos podiam aparecer positivos por `abs`; o gráfico de composição circular não representava créditos/prejuízo adequadamente. | Sinais preservados, descontos negativos como créditos, tabela e cascata conciliáveis. Evolução mensal substitui a rosca; nenhum componente desaparece. |
| Ads de visões distintas e afiliados já no líquido podiam receber novo desconto. | Máximo entre anúncio/campanha por operação/mês; reserva manual de Ads identificada; afiliados incorporados não são subtraídos outra vez. TikTok mantém Ads do repasse. |
| Rateio multiplicado independentemente podia perder centavo; pool sem mapa podia desaparecer. | Maiores restos distribuem centavos uma única vez. Pool inválido fica sem atribuição no Grupo, com pendência, sem inventar distribuição empresarial. |
| Resultado e equilíbrio podiam parecer completos sem custos ou cobertura de mídia. | Saldo parcial continua legível; resultado com cobertura e equilíbrio ficam indisponíveis quando faltam as fontes necessárias. Não certificam fechamento. |
| Cabeçalho e Metas podiam usar o último mês disponível quando o solicitado não existia. | A competência explícita é preservada. Metas e Comissão mostram ausência nesse mês, sem apresentar outubro sob o cabeçalho de novembro. |
| Histórico da Comissão podia somar duplicidade que o placar atual já recusava. | Duplicidade ou bônus ausente deixam o total histórico indisponível; registros publicados não são editados. |
| Lançamento era autorizado na interface primordialmente pelo perfil. | A autorização existente também é conferida pelo recurso individual antes de abrir/salvar. O servidor continua sendo a autoridade. |

## Definições da DRE gerencial

Fonte de vendas: agregado por competência, empresa, canal e ponto. Somente situações `venda` e `venda_com_troca` compõem as vendas finalizadas. Eventos de devolução ficam separados, com sua margem registrada; não são taxa por coorte e não são misturados automaticamente ao resultado finalizado. Isso mantém a base das vendas distinta de apurações de comissão que possam incluir eventos e custos diferentes.

Campos `_n` NUMERIC têm prioridade; o legado é reserva com normalização textual explícita de ausência. Margem real zero informado permanece zero. Real ausente usa margem de origem com contagem visível; campos financeiros ausentes impedem tratar o resultado como completo. O agregado local antigo não consegue reconstruir a presença ou a provisoriedade perdidas anteriormente e declara esse limite.

| Indicador | Definição | Decisão e limite |
|---|---|---|
| Margem real disponível | Real informada nas finalizadas; margem de origem somente onde falta a real. | Entender a contribuição registrada antes de investimentos adicionais e estrutura. Não é lucro contábil ou caixa recebido. |
| Investimentos adicionais | Ads da competência fora do repasse + excesso de afiliados cadastrados sobre o identificado no líquido + lives cadastradas. | Conferir despesas adicionais sem repetir o componente já incorporado. Cadastro manual e cobrança/venda podem ter datas/naturezas distintas; exigem conciliação. |
| Estrutura cadastrada | Custos diretos + compartilhados atribuídos + custo do serviço quando incluído. | Explicar a estrutura informada, inclusive sem venda. Ausência de lançamento não comprova custo zero. |
| Saldo disponível/parcial | Margem disponível − investimentos adicionais − estrutura atribuída. | Mostrar o que a base disponível implica, mesmo com pendências. Não substitui o resultado conciliado do fechamento. |
| Resultado após custos cadastrados | Mesmo saldo, quando há posição financeira e cobertura das verificações de margem, campos, mídia, competências e rateio. | Não cria certificação de completude da coleta nem fecha o mês. Líquido provisório continua sinalizado. |
| Equilíbrio do cenário | Estrutura ÷ (margem após investimentos / faturamento), somente com base positiva e verificações de cobertura atendidas. | Cenário de mix/taxa constantes. Ads e estrutura não são necessariamente fixos; não é meta, previsão ou autorização para escalar. |
| Comparação anterior | Igual número de competências imediatamente anteriores, com as mesmas definições e filtros. | Ver diferença absoluta sem tratar falta de resultado como zero. Não elimina mudanças de mix, carteira ou cobertura. |

Os percentuais da DRE são participações no faturamento, com essa base declarada. Não são a margem sobre líquido da Temu no Panorama nem a margem da remuneração. Exibição monetária com centavos, cálculo sem arredondamento antecipado das taxas e ausência exibida como traço. Não há classificação universal de 10%/20% ou nota de gestor.

### Mídia

Anúncios e campanhas são duas visões: usa-se o maior total mensal entre elas, excluindo linhas identificadas como afiliados/CVAF. Sem ambas, o cadastro de Ads no pacote é reserva explícita. Sem fonte, gasto zero não é confirmado. TikTok não recebe novo desconto do Ads já retirado no repasse. O valor identificado de afiliados no líquido é preservado; apenas excesso cadastrado entra como adicional, com observação de conciliação. Nenhuma cobrança de billing é declarada liquidada por esta regra.

Entre pontos, o gasto da operação é distribuído pela receita positiva de cada ponto no mês completo, com conservação dos centavos. Sem venda, o gasto permanece no Grupo; eventual ponto obtido do cadastro é identificado como atribuição a conferir e não confirma resultado completo. A fonte não fornece uma abertura física do gasto. Não se usa divisão simples pelo número de dias em consulta parcial.

### Estrutura e serviço

Diretos usam empresa e ponto da linha. Compartilhado usa o mapa vigente do ponto e somente rateio fechando exatamente 100% dentro da tolerância numérica do modelo. O cadastro não tem vigência histórica; não se reconstrói uma foto antiga a partir desse mapa. Rateio que não fecha mantém o pool sem atribuição no Grupo e bloqueia resultado completo, inclusive no recorte empresarial afetado.

Box Wyl entra separadamente como serviço: receita cadastrada menos custos. Sem ponto/canal na fonte, participa apenas do Grupo sem esses filtros; empresa selecionada limita o serviço à própria Box Wyl. Sem venda de marketplace, o serviço continua consultável no Grupo. A implementação não inventa vínculo físico ou rateio de estrutura por canal.

## Integração e acessos

- Metas: objetivo e realizado da apuração da competência; a régua diária continua própria. Sem cadastro no mês explícito, mostra ausência e retira o gráfico anterior. Mês encerrado no calendário fica distinto de comissão congelada.
- Comissão: fotografia/registro da remuneração. Bônus não significa pagamento; origem divergente continua separada. A nova DRE não altera os valores, os pesos ou o fechamento desse relatório.
- DRE: leitura gerencial atual das competências, custos e margem disponíveis; não precisa coincidir com a base do bônus. Os atalhos preservam empresa, canal e competência e respeitam os recursos autorizados.
- Administração: mantidos busca, perfil, situação, carteira, dados/acessos/histórico, desativação, arquivo e exclusão protegida. Conferidos o menu da Direção e os recursos indisponíveis à Coordenação. Nenhuma conta real foi modificada e nenhuma permissão ampliada.
- Rota nova `GET /api/financeiro/dre`: exige `dre.ver`, exclusivo do perfil de Direção. POST não é autorizado. Pode funcionar para uma Direção com Vendas restrita e DRE permitida, sem depender de baixar `/api/detalhe`. Gestor e Coordenação continuam sem DRE nem pacote de custos.
- Registrar/importar usa os formulários e o servidor versionado existentes. Prévia, validação, conflito, gravação, pacote inteiro e proteção de comissão fechada permanecem. Nesta revisão do navegador foram conferidos abertura, validação impeditiva e cancelamento; não houve gravação financeira real.

## Validação e evidências

194 testes automatizados aprovados: 161 anteriores e 33 novos. Cobrem conservação de R$ 85,01 em rateio, custos sem venda, escopo físico/empresarial/canal, mídia incorporada, ausência/zero, real ausente, negativo, devolução separada, Box Wyl, SQL/local, datas e entradas literais, somente leitura, permissões, competência preservada e histórico de bônus duplicado.

API e navegador foram exercitados com usuários/dados exclusivamente fictícios, em SQLite isolado e sem worker externo. Outubro do Grupo: faturamento R$ 77.757,51 incluindo serviço de R$ 200,00; estrutura R$ 1.485,01; investimentos R$ 1.300,00; saldo disponível R$ 10.592,91. A falta de cobertura de Ads de uma operação deixou o resultado completo indisponível, sem esconder o saldo parcial. Bsan Shop: estrutura R$ 1.042,51 e saldo R$ 6.801,69. Jowcase: estrutura R$ 42,50 e resultado após os custos cadastrados R$ 1.450,22. Valores de homologação, sem aplicação aos dados oficiais.

Conferidos: fonte e scope da composição, gráfico ampliado e valores, CSV com campo desconhecido vazio e centavos, comparação anterior, mês sem dados, atalho DRE → Comissão → Metas em novembro sem substituir por outubro, validação do lançamento, importação sem arquivo bloqueada, menu/limites da Administração, Gestor sem DRE e somente comissão da carteira, e Direção com Vendas restrita consultando DRE autorizada. Falha 503 retira os números antigos; nova tentativa recupera. Temas claro/escuro e 390 px sem transbordamento horizontal da página, com tabelas de rolagem própria. Login com rótulos associados e foco de um só acento.

A consulta SQL foi executada também no PostgreSQL do BsanControl em intervalo vazio do ano 1000, retornando somente contagem zero. Nenhum valor financeiro real foi retornado, sem DDL, DML ou mudança de schema/autenticação. A instalação compara núcleo e sete bases incorporadas, permitindo apenas a correção guardada da competência no cabeçalho, módulos visuais e contrato de consulta. Builder e pacote validado devem corresponder.

## Pendências e evoluções recomendadas

1. Conferência gerencial dos dados oficiais, filtros, envios e entregas pelo usuário, conforme combinado. Validação técnica não substitui essa aceitação.
2. Vigência e fotografia de rateio/estrutura por competência. O cadastro atual não permite reconstituir custos históricos com segurança.
3. Marcadores explícitos de conclusão da coleta, conciliação de mídia/afiliados e fechamento da DRE. Horário de carga e mês passado não bastam.
4. Conciliação entre margem da base de vendas, movimentos de devolução/extrato e composição oficial de apuração. A DRE atual declara resíduos, sem inventar suas categorias.
5. Política de estrutura por marketplace, caso se deseje resultado completo por canal. Até ser definida, a tela mostra contribuição antes da estrutura.

Essas evoluções são propostas, não dados já existentes ou novas regras aplicadas retroativamente. Esta fase não executa coleta, reprocessamento, fechamento, pagamento, alteração de bônus ou concessão de acesso.
