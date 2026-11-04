# Auditoria por página — Grupo Bsan

Recuperações posteriores ao retorno da equipe: [Gerencial, 04/11/2026](GERENCIAL-RESTAURACAO.md) e [Vendas/Raio-X, 04/11/2026](VENDAS-RESTAURACAO.md). Esses relatórios registram a restauração do fluxo anterior no design atual e complementam o histórico abaixo.

A migração do tema comum foi concluída anteriormente. Este plano acompanha a revisão aprofundada de leitura, fluxo e funcionamento de cada página. Aplicar o tema não significa concluir a auditoria de uma página. A referência visual é Metas, incluindo tipografia, espaços, hierarquia dos valores, estados discretos e ampliação exclusiva dos gráficos.

Prioridade atual: fase 7 — Financeiro e integração, autorizada e implementada em 01/11/2026, detalhada em AUDITORIA_FINANCEIRO.md. DRE por competência, fontes, composição, ausência e acessos revisados; integração de Metas, Comissão e Administração conferida. As sete fases têm entregas técnicas; a aceitação gerencial dos dados oficiais pelo usuário permanece pendente.

## Diretriz de evolução aprovada pelo usuário

O BsanControl deve apoiar a leitura integrada de todos os pontos do Grupo Bsan e a tomada de decisão para desenvolver empresas, operações, setores, colaboradores e gestores. O modelo atual é revisável: a auditoria pode recomendar novos indicadores, simplificar ou substituir leituras existentes e propor mudanças de estrutura quando houver benefício demonstrável. Preservar recursos e cálculos durante uma migração não os transforma em regras universais e imutáveis.

Cada proposta deve apresentar a pergunta atendida, a decisão apoiada, o público e o alcance, a definição e fórmula, a origem e cobertura dos dados, a frequência de atualização, o comportamento sem dados e um exemplo visual ou fluxo de implementação. Diferenciar indicador disponível, indicador derivável com a base existente e indicador dependente de nova coleta. Não apresentar como realizado o que é estimativa nem como zero o que está ausente.

Metas, referências e cores de desempenho devem considerar o modelo de negócio, o canal, a maturidade da operação, o período e os fatores sob controle de cada responsável. Comparações de colaboradores e gestores devem explicitar carteira, recursos disponíveis e contexto; volume isolado não comprova eficiência ou desempenho individual. Novos indicadores devem contribuir para uma decisão identificável, com aprofundamento na área apropriada, sem duplicar demandas e tratativas em várias páginas.

Mudanças na definição de resultado, remuneração, fechamento ou série histórica devem declarar impacto, diferença em relação à regra vigente e estratégia de transição. Propor e demonstrar uma mudança é distinto de aplicá-la retroativamente. As restrições de acesso existentes continuam válidas até uma alteração expressamente autorizada.

Candidatos para a etapa 2, ainda sujeitos à auditoria das fontes: margem por pedido; participação e valor da margem negativa; cancelamentos e devoluções com separação entre receita afetada e perda efetiva; cobertura da liquidação para distinguir valores provisórios de confirmados. Apresentar a utilidade e a implementação possível antes de tratá-los como indicadores aprovados.

## Sequência e situação

| Etapa | Páginas e modos incluídos | Situação |
|---|---|---|
| 1 | Resultados → Visão Geral; Gerencial → Panorama | Revisão de hierarquia e critérios implementada e validada tecnicamente em 01/11/2026. Conferência gerencial do usuário pendente. |
| 2 | Vendas; Raio-X; Gerencial → Vendas da operação | Auditoria funcional implementada; guias devolvidos ao topo e conferidos nas três telas em 01/11/2026. Revisão do gestor pendente. |
| 3 | Gerencial → Diagnóstico, Anúncios, Publicidade, Full | Implementados e validados tecnicamente em 01/11/2026. Relatório, critérios e limites em AUDITORIA_GERENCIAL.md. Revisão gerencial pendente. |
| 4 | Acompanhamento → Tarefas, Promoções, Ads | Implementados e validados tecnicamente em 01/11/2026. Histórico escopado e registro atômico; revisão gerencial pendente. Anúncios em breve continua indisponível. |
| 5 | Operação → Envios, Estoque, Projeção | Implementados e validados tecnicamente em 01/11/2026. Fontes e fórmulas declaradas; conferência gerencial pendente. |
| 6 | Resultados → Diário, Marketplaces, Curva ABC, Forecast | Implementados e validados tecnicamente em 01/11/2026. Forecast macro, contratos, critérios e limites em AUDITORIA_RESULTADOS.md. Revisão gerencial pendente. |
| 7 | Financeiro → DRE; revisão de integração de Metas, Comissão e Administração de usuários | Implementada e validada tecnicamente em 01/11/2026. Relatório em AUDITORIA_FINANCEIRO.md. Metas, Comissão e Administração mantêm suas entregas próprias; integração e consistência conferidas. Revisão gerencial pendente. |

Cabeçalho, seletores em cascata, período, menus, formulários de lançamento, importações e comparação serão conferidos dentro dos fluxos em que aparecem. Permissões continuam nos limites do perfil: DRE exclusiva da Direção; comissão e carteira conforme a autorização existente.

## Método por página

1. Inventariar indicadores, gráficos, tabelas, filtros, ações e exportações existentes antes da alteração.
2. Verificar a pergunta gerencial atendida, alcance de cada base, atualização, período e fórmulas já utilizadas. Identificar duplicação com outras áreas.
3. Corrigir hierarquia, linguagem, contraste, tamanho, estados vazios e navegação, preservando recursos e fontes. Divergências de cálculo recebem evidência específica.
4. Conferir valores antes/depois com o mesmo recorte; testar filtros, ações, referências sem registros, permissões, temas, telas estreitas e ampliação dos gráficos.
5. Registrar alterações e limitações, instalar com backup, regenerar e verificar a versão publicada. Revisão técnica e aceitação gerencial permanecem distintas.

## Etapa 1 — Visão Geral e Panorama

A Visão Geral responde quanto as vendas produziram no recorte e quais operações compõem o resultado. Panorama responde como está uma conta e qual o efeito do Ads adicional apurado. Demandas e tratativas continuam em Acompanhamento e nas áreas próprias do Gerencial.

| Achado anterior | Correção |
|---|---|
| Cartão usava `fatDe(agg(...))`, enquanto gráficos agrupavam `fat` bruto. | Composição por empresa, canal, dia e tendência usa a mesma base finalizada do cartão. Se houver base legada sem `fatMetas`, todo o recorte conserva o fallback bruto e recebe explicação. |
| Meta mensal se misturava ao intervalo e seu atalho abria Forecast. | Bloco mensal separado, realizado restrito às operações com objetivo e exibição condicionada à cobertura mensal carregada. Atalho abre Gerencial → Metas. |
| Não havia abertura clara do consolidado para uma conta. | Tabela de operações com busca, ordenação e filtro de margem negativa; Abrir Panorama mantém as datas e respeita a carteira autorizada. |
| Variação com referência zero aparentava 0%; comparação automática do Panorama não declarava as datas. | Referência e datas explícitas; ausência não produz variação; base zero permite diferença absoluta, sem percentual fictício. |
| Margem das vendas zero com Ads gerava valor negativo em reais, mas percentual de 0%. | Percentual divide a margem após Ads pela base vigente. Temu mantém sua base líquida, inclusive na série diária. Não há mudança no valor da margem apurada. |
| Cache de Ads se mantinha com arrays novos de mesmo tamanho. | Invalidação considera também a identidade das bases recebidas. Mantidas as regras de máximo entre anúncio/campanha, exclusão de afiliados e do Ads já no líquido. |
| Ausência de gasto atual era tratada como falha de coleta; total negativo de um canal virava afirmação sobre cada venda. | Cobertura e limites declarados sem inferências indevidas. Sinais principais ficam visíveis após os indicadores. Métodos e evidências extensas têm abertura opcional. |
| Excesso de informação sem distinguir vendas de resultado final. | Guia no topo; indicadores, pré-diagnóstico, operações e gráficos em sequência. Metas mensais e apoio consolidado de SKU ficam separados. Margem registrada não recebe o nome de lucro final. |

Cinco gráficos da Visão Geral preservados, incluindo controles de tendência, ampliação e tabela de valores. Rankings de SKU continuam baseados na fonte mensal consolidada, com alcance explicitado. Não passam a representar um recorte por empresa que a fonte não oferece. A média móvel é identificada como até sete pontos, sem presumir sete dias consecutivos.

## Evidências e limites da etapa 1

Revisão de 01/11/2026: 55 testes automatizados aprovados (46 anteriores e nove novos). A síntese deriva da mesma base dos indicadores; variação por operação não presume zero quando falta referência. Panorama identifica a regra da comparação, a base percentual Temu e a distribuição do Ads mensal. Pedidos e ticket usam IDs e receita identificada, sem substituir pedidos por linhas. A carga não comprova completude do Ads diário e o horário dos extras não é apresentado como coleta individual. O modo executivo da Visão Geral deixa de aplicar meta universal de 15% e não chama toda diferença entre bruto/líquido de taxa. Gráficos ampliados exibem valores monetários com duas casas, sem resíduos de ponto flutuante. Relatório completo e critérios: `AUDITORIA_VISAO_PANORAMA_REVISAO.md`.

- 34 testes automatizados aprovados: nove novos casos de resumo, sete da comparação e 18 de usuários/acessos. Incluem cache real de Ads, composição conciliada, percentuais, ausência/zero, metas e idempotência do integrador.
- Homologação usa apenas usuários e vendas fictícios em banco isolado. Antes/depois no mesmo recorte: Bsan Shop/Amazon, faturamento R$ 6.202,00, margem das vendas R$ 0,00 e Ads R$ 200,00; margem após Ads permanece -R$ 200,00 e percentual passa de 0,00% a -3,22%. Temu mantém 15,00% sobre líquido, também no gráfico diário.
- Conferidos no navegador: consolidado de seis operações (R$ 72.345,00), busca e filtro, abertura da conta sem perder o período, atalho para Gerencial → Metas, referência de agosto ausente, intervalo sem vendas, gráficos ampliados com tabela de valores, redimensionamento dos gráficos recolhidos e controles de tendência. Perfil Gestor aprofunda somente as duas operações da carteira fictícia; outras operações macro conservam a leitura autorizada, com atalho gerencial desabilitado.
- Temas claro/escuro e largura de 390 px conferidos. Página sem transbordamento horizontal, números inteiros na largura dos cartões e rolagem interna das tabelas. Nenhum erro de console no fluxo verificado.
- Dados reais, fotos de fechamento, regras de bônus, conciliação financeira e APIs de coleta não são reprocessados. Não há alteração de backend ou concessão de acesso.
- A sincronização exibida vem da informação disponível na carga de extras, distinta da data da última venda do recorte. Quando não informada, a tela declara a ausência desse horário.
- Ausência de registro de Ads não confirma gasto zero. Série diária disponível fornece pesos; sem ela, conserva-se o rateio mensal vigente. A auditoria das fontes de Publicidade e Afiliados está na etapa 3.
- A homologação técnica não substitui a conferência gerencial dos dados oficiais, filtros, envios e entregas que o usuário reservou para sua revisão.

Módulos: `visual/resumos-modelo.js`, `visual/resumos-correcoes.js`, `visual/resumos.js` e `visual/resumos.css`. Integração idempotente em `visual/integrar.js`; Pipeline copia os quatro assets e registra a janela carregada no loader para distinguir recorte de competência mensal.

## Etapa 2 — Vendas, Vendas da operação e Raio-X

Vendas permite consultar e conferir itens no filtro inteiro, preservando a paginação no banco. Vendas da operação apresenta o mesmo tipo de leitura dentro da conta e da carteira autorizada, com a abertura de custos própria do canal. Raio-X aprofunda um SKU entre as empresas, canais e datas selecionados, usando a margem real disponível na base e declarando quando utiliza a margem de origem por falta dessa informação.

### Indicadores e decisões

| Leitura | Definição e origem | Uso e limite |
|---|---|---|
| Faturamento, margem com teto, percentual e unidades finalizadas | Agregação das linhas com status `venda` ou `venda_com_troca`, respeitando os mesmos filtros da tabela. No online, o servidor agrega o filtro inteiro, sem limitar às 50 linhas da página. | Conferir o resultado registrado antes dos custos adicionais da apuração. Não substitui lucro final ou bônus. |
| Margem média por unidade | Margem das finalizadas / quantidade dessas linhas. | Média contextual do mix consultado, mais útil ao aprofundar um SKU. Não é uma régua universal entre produtos de unidades diferentes. |
| Margem negativa dos itens | Soma da margem das linhas finalizadas abaixo de zero, quantidade e participação nas finalizadas do filtro. | Localizar itens para investigação. Não equivale a pedido inteiro com prejuízo nem a dinheiro garantidamente recuperável. |
| Provisoriedade e ausência de origem | Marcador de provisoriedade da fonte, inclusive com acentos; quantidade de linhas e soma de líquido provisório. Fonte ausente contabilizada separadamente. | Saber quanto da leitura ainda pode mudar. Ausência de marcador não comprova liquidação ou recebimento. |
| Margem real e cobertura no Raio-X | Usa a margem real quando informada; quando ausente, conserva a margem de origem e identifica o total como disponível/misto, com quantidade de linhas afetadas. | Evitar apresentar zero como margem real conhecida. O detalhe online recebe apenas um sinal booleano de presença, derivado da coluna já consultada; não recebe abertura de custos adicional. |
| Situações e devoluções do SKU | Linhas, unidades, receita e margem registradas por situação dentro do intervalo. | Devolução no recorte pode pertencer a venda de outro período. Substitui a antiga taxa/veredito automático como medida de qualidade do produto. |

O percentual respeita `mcBase`: receita nos demais canais e líquido na Temu. No Raio-X, o resumo passa a respeitar a mesma base usada na tabela por canal. Não se aplica uma classificação universal de 10%/20% nestas leituras. A margem com teto de Vendas e a margem real do Raio-X mantêm nomes distintos; não devem ser comparadas como definições idênticas. A Visão Geral conserva sua leitura de margem sobre faturamento, identificada como tal.

Margem por pedido completo e taxa de devolução por coorte ficam como propostas dependentes de vínculo e cobertura adequados de todos os itens, vendas e devoluções do pedido. Contar linhas como pedidos ou dividir eventos de períodos diferentes produziria uma leitura enganosa; nenhum desses indicadores foi declarado disponível nesta etapa.

### Fluxos e correções

- Colunas essenciais ou completas, ordenação por botões acessíveis e detalhe por item no começo da linha, disponível durante a rolagem horizontal. O detalhe preserva o link externo de venda quando aplicável e abre o Raio-X mantendo o período e o escopo.
- Filtros ativos declarados junto da consulta. Alterar busca, empresa, canal, ponto, datas ou status reinicia a página; a mudança de página mantém o resumo completo.
- Online: Exportar página CSV identifica o alcance real de 50 linhas. Local e Vendas da operação: Exportar filtro CSV baixa as linhas do filtro completo. Campos financeiros existentes e proteção contra fórmulas preservados; percentual com duas casas; custo de plataforma da operação conserva o sinal exibido na tela. Custos sem abertura ficam vazios no CSV, enquanto zero informado continua zero.
- A abertura distingue custo zero de campo não informado, dentro da presença que a fonte disponibiliza. Não recupera informação de ausência que já tenha sido convertida em zero pela coleta anterior.
- Títulos, situações e modalidades de envio entram como texto escapado. A situação da venda continua separada de sua provisoriedade financeira.
- Falha de consulta retira os indicadores anteriores, bloqueia a exportação e oferece Tentar novamente. Vazio não fabrica percentual de 0%.
- Raio-X preserva preço médio, custo médio unitário, pedidos identificados, evolução mensal e contribuição por operação. O custo é o registrado na base, sem atribuir uma foto histórica da Precifique que não existe. A evolução mensal passa a gráfico ampliável com tabela de valores. Meses parciais não recebem automaticamente os antigos vereditos de alta/queda ou estabilidade.
- Corrigido o atalho Panorama → Ver vendas da operação, que usava o identificador anterior da navegação agrupada.

### Verificação e implementação

Revisão de 01/11/2026: removida a ordenação CSS `order:99` que levava o Como ler ao fim nas três páginas. O guia agora é o primeiro elemento e tem ordem visual -1. Confirmados no navegador Vendas, Raio-X e Vendas da operação. A auditoria funcional anterior foi preservada; a posição inadequada do guia foi uma inconsistência da revisão visual, não uma mudança de fonte ou fórmula financeira.

46 testes automatizados aprovados: 12 específicos desta etapa e 34 anteriores. Incluem conciliação entre SQL e modelo local, filtros literais com `%`/`_`, paginação, base Temu, margem real ausente, R$ 85,01 em dois itens, precisão/sinal/ausência no CSV, escape de campos e idempotência dos ajustes de origem.

API e navegador foram conferidos somente com usuários e dados fictícios em banco isolado: 202 linhas em cinco páginas, 199 finalizadas, faturamento R$ 77.232,50 e margem com teto R$ 13.069,92. A soma das páginas concilia com o resumo no mesmo filtro. A fixture sem API reproduziu os mesmos totais e exportou 203 linhas no CSV (cabeçalho + 202 registros). Conferidos busca, status, margem negativa, colunas, ordenação, detalhe, Raio-X, ampliação e carteiras da Direção/Gestor, além de claro/escuro e largura de 390 px. Falha de rede controlada e recuperação também conferidas. A conferência gerencial dos dados oficiais permanece pendente.

Módulo de definições `vendas-indicadores.js`, compartilhado com o servidor; agregação SQL em `vendas-pagina.js`; apresentação em `visual/vendas.js` e `visual/vendas.css`; ajustes guardados/idempotentes em `visual/vendas-correcoes.js`. O Pipeline deve copiar esses arquivos, reaplicar `visual/integrar.js` e preservar o ajuste de navegação em `visual/resumos.js`.

As alterações de API são de consulta e contrato de leitura, sem migração de banco, concessão de acesso, coleta de plataformas, reprocessamento, mudança de fotos fechadas ou cálculo de bônus. Vendas continua paginada no servidor e o detalhe permanece carregado sob demanda. Atualizações da base seguem o mecanismo de sincronização/invalidação existente; esta etapa não cria uma foto financeira imutável de consultas feitas durante uma atualização.

## Etapa 3 — Diagnóstico, Anúncios, Publicidade e Full

Implementação descrita em `AUDITORIA_GERENCIAL.md`. Modelo derivado em `visual/gerencial-modelo.js`, apresentação em `visual/gerencial.js` e `visual/gerencial.css`. O Diagnóstico lista evidências e o que conferir; Anúncios conserva abertura por anúncio/SKU, curva, custo, margem, busca, ordenação, CSV e Raio-X; Publicidade separa atribuição, estimativas e fontes de afiliados; Full conserva as seis leituras e explicita a posição, o horizonte e o alcance do CSV.

76 testes automatizados aprovados (55 anteriores e 21 novos). Os novos testes cobrem separação de afiliados antes do agrupamento, rateio sem duplicação por SKU e com conservação dos centavos, ausência/zero, referência, devoluções fora da base finalizada, cenário, margem Temu, TikTok, fonte sem ID, Full e exportação. Conferidos também temas, celular, carteira e gráficos ampliados com dados exclusivamente fictícios. Nenhuma coleta, fechamento, reprocessamento ou concessão de acesso é feito pela nova apresentação.

## Etapa 4 — Acompanhamento

Relatório e critérios em AUDITORIA_ACOMPANHAMENTO.md. Fonte oficial diferenciada de cálculo local; erro e vazio não geram demandas substitutas. Como ler no topo; prioridades visíveis; competência selecionável; fila por situação/tipo/operação/responsável; comparação contextual sem nota universal; registro, conferência e medição separados. Resultado anterior à última ação não conta como confirmação atual. Referências monetárias de tipos diferentes não são somadas como recuperação garantida.

96 testes aprovados (76 anteriores e 20 novos), além de API e navegador com usuários/dados fictícios. Conferidos registro e recarga, histórico completo, restrição de escrita, carteira, CSV do filtro completo, imagens, falha/vazio/recuperação, comparação, promoções, Ads, calendário, temas e 390 px. Histórico novo usa a autorização de consulta vigente; POST verifica demanda, valida campos e salva registro/estado em transação com hora do servidor. Nenhuma coleta, reprocessamento financeiro, mudança de metas/bônus ou execução em marketplace.
