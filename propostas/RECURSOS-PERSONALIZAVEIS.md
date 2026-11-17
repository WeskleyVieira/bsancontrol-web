# Recursos da proposta personalizável

Inventário de apresentação conferido no HTML e nos módulos visuais do BsanControl em 17/11/2026. Os 175 blocos abaixo são composições de interface, não 175 indicadores financeiros independentes. Cada aba tem uma entrada essencial e uma biblioteca de análises.

Os dados e as decisões são demonstrativos. Cálculos, regras completas de diagnóstico, consultas, formulários, permissões, importações e publicação precisam ser integrados e homologados contra a aplicação original; este inventário não certifica paridade funcional.

## r-geral

O resultado do grupo primeiro; aprofunde onde houver uma decisão.

Fonte: `visual/resultados.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Resultado consolidado | Essencial | kpis |
| Onde concentrar atenção | Essencial | priorities |
| Evolução do resultado | Essencial | line |
| Contribuição de cada operação | Personalizar | bars |
| Todas as operações | Personalizar | table |
| Bases e comparação | Personalizar | quality |

Controles originais: Indicador, Diário / acumulado.

Ações originais: Comparar empresas e marketplaces.

## r-diario

Entenda o resultado do período, a evolução e quem exige atenção.

Fonte: `visual/resultados.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Vendas e margem do período | Essencial | kpis |
| Placar de contas | Essencial | rank |
| Mudanças que exigem atenção | Personalizar | priorities |
| Relação entre as contas | Personalizar | bubble |
| Contribuição para a variação | Personalizar | bars |
| Tendência e composição diária | Personalizar | line |
| Evolução antes e depois | Personalizar | table |
| Pesos e fontes do placar | Personalizar | weights |

Controles originais: Janela do Diário, Referência, Indicador do ranking, Busca.

Ações originais: Exportar placar.

## r-canais

Compare canais e encontre produtos relevantes sem abrir uma tabela extensa.

Fonte: `visual/resultados.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Resultado por marketplace | Essencial | channelCards |
| Top 10 produtos | Essencial | productCards |
| Evolução do faturamento por canal | Personalizar | line |
| Margem Pós-Ads por canal | Personalizar | line |
| Tabela dos canais | Personalizar | table |

Controles originais: Agrupamento temporal, Ordenar Top 10.

Ações originais: Exportar canais.

## r-abc

Classifique o mesmo SKU no conjunto escolhido, com o denominador da curva sempre visível.

Fonte: `visual/resultados.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Participação das curvas | Essencial | abcKpis |
| Produtos para analisar | Essencial | abcTable |
| Pareto dos produtos | Personalizar | pareto |
| Participação por curva | Personalizar | donut |
| Matriz de faturamento, unidades e contribuição | Personalizar | matrix |
| Concentração e parâmetros da curva | Personalizar | quality |

Controles originais: Operações na soma, Critério da curva, Curva, Prioridade, Busca, Cortes A / B.

Ações originais: Exportar curva.

## r-forecast

Acompanhe o cenário da empresa e o mesmo SKU somado entre operações.

Fonte: `visual/resultados.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Histórico e cenário macro | Essencial | projection |
| Realizado, esperado e projeção | Essencial | forecastKpis |
| Produtos para acompanhar | Essencial | forecastCards |
| Acompanhamento e projeção dos produtos | Personalizar | projection |
| Participação das operações no SKU | Personalizar | table |
| Método, referência e qualidade | Personalizar | quality |
| Histórico de metas e atingimento | Personalizar | table |

Controles originais: Lente: empresa / produtos, SKU, Operações na soma, Indicador, Método, Horizonte, Referência, Crescimento esperado, Faixa de cenário.

Ações originais: Exportar cenário.

## v-lista

Consulte vendas e cada etapa do resultado, com ID e SKU copiáveis.

Fonte: `visual/vendas.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Vendas no período | Essencial | kpis |
| Linhas de venda | Essencial | salesTable |
| Composição e cobertura | Personalizar | quality |

Controles originais: Status, Empresa, Marketplace, Modalidade, Busca, Margem negativa.

Ações originais: Exportar vendas.

## g-vendas

Veja as vendas da operação selecionada, do pedido à margem.

Fonte: `visual/vendas.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Vendas no período | Essencial | kpis |
| Linhas de venda | Essencial | salesTable |
| Composição e cobertura | Personalizar | quality |

Controles originais: Status, Modalidade, Busca, Margem negativa.

Ações originais: Exportar vendas.

## v-raiox

Investigue o SKU e compare suas operações sem perder o volume de vendas.

Fonte: `visual/vendas-raiox.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Resultado do SKU | Essencial | kpis |
| Vendas e margem após publicidade | Essencial | mixed |
| Mesmo SKU nas demais operações | Personalizar | table |
| Anúncios que compõem o SKU | Personalizar | table |
| Composição do custo e origem da margem | Personalizar | costBridge |
| Histórico do SKU | Personalizar | line |

Controles originais: SKU, Diário / acumulado, Margem em R$ / %.

Ações originais: Abrir forecast do SKU.

## panorama

Comece pelas vendas e pelo resultado da operação; aprofunde publicidade quando necessário.

Fonte: `visual/gerencial.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Visão geral da operação | Essencial | kpis |
| Faturamento e margem por dia | Essencial | mixed |
| Prioridades da operação | Essencial | priorities |
| Etapas do resultado | Personalizar | kpis |
| Produtos com maior contribuição | Personalizar | productCards |
| Origem e composição da margem | Personalizar | costBridge |
| Base e referência de comparação | Personalizar | quality |

Controles originais: Indicador, Diário / acumulado.

Ações originais: Escolher referência.

## diagnostico

Agenda do gestor: cada grupo aponta uma investigação e uma tratativa própria.

Fonte: `visual/gerencial.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Agenda por situação | Essencial | diagnostics |
| Itens do grupo selecionado | Essencial | diagnosticTable |
| Evolução do grupo | Personalizar | line |
| Critérios dos rótulos e referência | Personalizar | rules |

Controles originais: Situação, Anúncio / SKU, Busca, Referência.

Ações originais: Abrir grupo em Anúncios, Exportar grupo.

## anuncios

Leia identificação e posição, volume, resultado e publicidade nessa ordem.

Fonte: `visual/gerencial.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Vendas e resultado dos itens | Essencial | kpis |
| Resultado por anúncio ou SKU | Essencial | adTable |
| Evolução na operação | Personalizar | rankKpis |
| Curvas e saúde da margem | Personalizar | abcKpis |
| Origem do Pós-Ads e do rateio | Personalizar | quality |

Controles originais: Anúncio / SKU, Situação, Curva, Evolução, Busca, Colunas, Itens por página.

Ações originais: Exportar filtro, Escolher referência.

## g-forecast

Acompanhe anúncios ou SKUs: quem está abaixo, no ritmo ou acima do esperado.

Fonte: `visual/forecast-anuncios.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Realizado, esperado e projeção | Essencial | forecastKpis |
| Produtos para acompanhar | Essencial | forecastCards |
| Acompanhamento e projeção dos produtos | Personalizar | projection |
| Participação das operações no SKU | Personalizar | table |
| Método, referência e qualidade | Personalizar | quality |

Controles originais: Anúncio / SKU, Indicador, Referência, Horizonte, Método, Crescimento esperado, Faixa de cenário, Situação, Busca.

Ações originais: Exportar forecast.

## publicidade

Mídia e afiliados têm métricas próprias; a soma aparece onde faz sentido.

Fonte: `visual/publicidade.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Mídia de campanha | Essencial | adsKpis |
| Acompanhamento diário da mídia | Essencial | adsDaily |
| Afiliados | Essencial | affiliate |
| Publicidade total sobre vendas | Personalizar | combined |
| Campanhas e anúncios | Personalizar | adCampaigns |
| Conciliação dos afiliados e fontes | Personalizar | quality |
| Posição acumulada e limites | Personalizar | goals |

Controles originais: Mídia / afiliados / conjunto, Campanha, Anúncio / SKU, Busca.

Ações originais: Abrir metas.

## g-metas

Acompanhe rota diária, posição acumulada e objetivo de cada competência.

Fonte: `visual/metas-publicidade.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Realizado frente às metas | Essencial | goalKpis |
| Acompanhamento diário e rota esperada | Essencial | goalDaily |
| Posição acumulada | Essencial | goalAccumulated |
| Metas por operação | Personalizar | table |
| Histórico de atingimento | Personalizar | line |
| Origem, duplicidades e apuração | Personalizar | quality |

Controles originais: Competência, Operação, Indicador da meta, Diário / acumulado.

Ações originais: Consultar comissão.

## g-full

Decida reposição, trate rupturas e acompanhe o envio para Full.

Fonte: `visual/operacao.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Estoque e fluxo Full | Essencial | stockKpis |
| Prioridades de reposição | Essencial | stockTable |
| Cobertura e envelhecimento | Personalizar | bars |
| Cenário de reposição | Personalizar | projection |
| Vínculos e qualidade das fontes | Personalizar | quality |

Controles originais: Horizonte, Segurança, Situação, Busca.

Ações originais: Exportar reposição.

## o-envios

Acompanhe modalidades e cobertura de registro por operação.

Fonte: `visual/operacao.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Volume por modalidade | Essencial | shippingKpis |
| Envios por operação | Essencial | shippingTable |
| Evolução dos envios | Personalizar | line |
| Cobertura e dias sem registro | Personalizar | quality |

Controles originais: Modalidade, Ponto, Busca.

Ações originais: Exportar envios.

## o-estoque

Veja o estoque por ponto, separando saldo físico e canais logísticos.

Fonte: `visual/operacao.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Posição de estoque | Essencial | stockKpis |
| Estoque e cobertura por SKU | Essencial | stockTable |
| Distribuição por ponto | Personalizar | bars |
| Saldos negativos e vínculos | Personalizar | quality |

Controles originais: Situação, Ponto, Busca, Colunas.

Ações originais: Exportar estoque.

## o-projecao

Planeje demanda e necessidade com base, horizonte e estoque identificados.

Fonte: `visual/operacao.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Demanda e necessidade | Essencial | stockKpis |
| Cenário de demanda | Essencial | projection |
| Projeção por SKU | Personalizar | stockTable |
| Participação dos canais | Personalizar | bars |
| Histórico e qualidade da projeção | Personalizar | quality |

Controles originais: Base do ritmo, Horizonte, Fator do cenário, Dias de segurança, Busca.

Ações originais: Exportar necessidade.

## p-catalogo

Identidade do produto, estrutura e vínculos com o ERP em um só lugar.

Fonte: `produtos/web/app.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Saúde do catálogo | Essencial | catalogKpis |
| Catálogo de produtos | Essencial | catalogTable |
| Identidade, estrutura e ERP | Personalizar | table |

Controles originais: Busca, Tipo, Situação, Ponto, Colunas.

Ações originais: Exportar catálogo, Ver detalhe do produto.

## p-pendencias

Priorize custos ausentes, divergentes e versões que exigem revisão.

Fonte: `produtos/web/costing-ui.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Pendências de custo | Essencial | catalogKpis |
| Fila de revisão de custos | Essencial | table |
| Origem e vigência | Personalizar | table |

Controles originais: Motivo, Situação, Busca.

Ações originais: Abrir homologação.

## p-entradas

Revise entradas de compra e a composição do custo de aquisição.

Fonte: `produtos/web/costing-ui.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Entradas em revisão | Essencial | catalogKpis |
| Entradas de compra | Essencial | table |
| Histórico de versões da entrada | Personalizar | table |

Controles originais: Fornecedor, Situação, Competência, Busca.

Ações originais: Revisar entrada.

## p-materiais

Controle insumos e sua participação no custo das embalagens.

Fonte: `produtos/web/packaging-ui.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Materiais e referências | Essencial | catalogKpis |
| Materiais | Essencial | table |
| Uso em embalagens | Personalizar | table |

Controles originais: Unidade, Situação, Busca.

Ações originais: Revisar material.

## p-embalagens

Monte a composição e confira o custo por embalagem.

Fonte: `produtos/web/packaging-ui.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Composição de embalagens | Essencial | catalogKpis |
| Embalagens cadastradas | Essencial | table |
| Componentes da embalagem | Personalizar | table |

Controles originais: Tipo, Situação, Busca.

Ações originais: Ver composição.

## p-preparacao

Acompanhe preparação e consumo de embalagens por lote.

Fonte: `produtos/web/operational-packaging-ui.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Preparação operacional | Essencial | catalogKpis |
| Lotes de preparação | Essencial | table |
| Materiais consumidos no lote | Personalizar | table |

Controles originais: Situação, Responsável, Busca.

Ações originais: Ver lote.

## p-homologacao

Compare versões, divergências e bloqueios antes da aprovação.

Fonte: `produtos/web/review-ui.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Revisões para homologação | Essencial | catalogKpis |
| Comparação de versões | Essencial | table |
| Evidências e histórico de revisão | Personalizar | timeline |

Controles originais: Situação, Responsável, Busca.

Ações originais: Revisar versão.

## p-apuracao

Confira o custo aplicado às vendas conforme a vigência.

Fonte: `produtos/web/sales-ui.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Cobertura da apuração | Essencial | catalogKpis |
| Custo aplicado às vendas | Essencial | table |
| Vigência e conciliação | Personalizar | quality |

Controles originais: Competência, Situação, Busca.

Ações originais: Conferir custo da venda.

## p-atualizacao

Revise alterações calculadas antes de preparar uma publicação.

Fonte: `produtos/web/effective-ui.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Alterações de custo | Essencial | catalogKpis |
| Atualização e vigência | Essencial | table |
| Histórico das versões | Personalizar | timeline |

Controles originais: Situação, Vigência, Busca.

Ações originais: Revisar alterações.

## p-integracao

Confira o que será associado ou publicado no ERP e as pendências.

Fonte: `produtos/web/publication-ui.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Prontidão da integração | Essencial | catalogKpis |
| Conferência de publicação | Essencial | table |
| Eventos de integração | Personalizar | timeline |

Controles originais: ERP, Situação, Busca.

Ações originais: Conferir publicação.

## pv-fila

Trate atendimentos com produto, pedido, responsável e retorno.

Fonte: `visual/pos-venda.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Situação dos atendimentos | Essencial | workflowKpis |
| Fila de atendimentos | Essencial | workflow |
| Histórico e evidências | Personalizar | timeline |

Controles originais: Motivo, Situação, Responsável, Busca.

Ações originais: Abrir atendimento.

## a-tarefas

Agenda de decisão e retorno, com leituras próprias para Direção, Coordenação e Gestor.

Fonte: `visual/acompanhamento.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Pendências e retornos | Essencial | workflowKpis |
| Fila de ações | Essencial | workflow |
| Comparar carteiras | Personalizar | table |
| Casos e continuidade | Personalizar | timeline |
| Referências econômicas | Personalizar | economy |

Controles originais: Visão do papel, Situação, Responsável, Tratativa, Busca.

Ações originais: Imagem para o grupo, Imagem detalhada.

## a-promocoes

Acompanhe estratégia promocional, erosão de margem e retorno esperado.

Fonte: `visual/acompanhamento.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Pendências e retornos | Essencial | workflowKpis |
| Fila de ações | Essencial | workflow |
| Promoções em acompanhamento | Personalizar | table |
| Casos e continuidade | Personalizar | timeline |
| Referências econômicas | Personalizar | economy |

Controles originais: Situação, Responsável, Busca.

Ações originais: Ver promoção.

## a-ads

Acompanhe decisões de publicidade e o retorno da tratativa.

Fonte: `visual/acompanhamento.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Pendências e retornos | Essencial | workflowKpis |
| Fila de ações | Essencial | workflow |
| Evidências da publicidade | Personalizar | table |
| Casos e continuidade | Personalizar | timeline |
| Referências econômicas | Personalizar | economy |

Controles originais: Situação, Responsável, Busca.

Ações originais: Ver plano de Ads.

## a-alinhamentos

Registre decisão, responsável e retorno de cada alinhamento.

Fonte: `visual/alinhamentos.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Alinhamentos e prazos | Essencial | workflowKpis |
| Alinhamentos | Essencial | workflow |
| Histórico das decisões | Personalizar | timeline |

Controles originais: Situação, Responsável, Busca.

Ações originais: Ver alinhamento.

## a-pendencias

Resolva dependências com responsabilidade e prazo claros.

Fonte: `visual/pendencias.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Pendências em aberto | Essencial | workflowKpis |
| Pendências | Essencial | workflow |
| Histórico e evidências | Personalizar | timeline |

Controles originais: Situação, Responsável, Busca.

Ações originais: Ver pendência.

## f-dre

Veja o resultado da competência e abra a composição quando precisar.

Fonte: `visual/financeiro.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Resultado e cobertura da competência | Essencial | financeKpis |
| Resultado por empresa | Essencial | companyCards |
| Da receita ao saldo após estrutura | Personalizar | waterfall |
| Competências em perspectiva | Personalizar | line |
| DRE detalhada | Personalizar | table |
| Custos diretos, compartilhados e rateio | Personalizar | table |
| Investimentos e repasse | Personalizar | table |
| Devoluções e eventos de apuração | Personalizar | table |
| Fontes, cobertura e fechamento | Personalizar | quality |

Controles originais: Competência, Comparar competências, Período personalizado.

Ações originais: Registrar custos, Importar pacote de custos.

## f-comissao

Confira a composição publicada e a situação da apuração, separadas da rentabilidade atual.

Fonte: `visual/financeiro-leitura.js`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Comissão publicada | Essencial | commissionKpis |
| Comissão por operação | Essencial | table |
| Composição oficial da comissão | Personalizar | table |
| Pós-Ads atual das vendas | Personalizar | kpis |
| Histórico da apuração | Personalizar | timeline |

Controles originais: Competência, Operação, Situação.

Ações originais: Conferir Pós-Ads atual.

## f-fechamento

Confira pendências e a fotografia de cada competência antes de fechar.

Fonte: `BsanControl.html`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Situação do fechamento | Essencial | commissionKpis |
| Conferência do fechamento | Essencial | table |
| Fotografia e versões | Personalizar | table |
| Histórico do fechamento | Personalizar | timeline |

Controles originais: Competência, Situação.

Ações originais: Conferir competência.

## f-custos

Consulte custos cadastrados, competência e critério de distribuição.

Fonte: `BsanControl.html`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Custos por competência | Essencial | financeKpis |
| Custos cadastrados | Essencial | table |
| Distribuição por empresa | Personalizar | bars |
| Origem e conferência de pacotes | Personalizar | quality |

Controles originais: Competência, Empresa, Tipo custo, Busca.

Ações originais: Registrar custo, Importar pacote.

## f-carteiras

Consulte a composição das carteiras e a responsabilidade das operações.

Fonte: `BsanControl.html`.

| Recurso | Entrada | Tipo |
|---|---|---|
| Composição das carteiras | Essencial | workflowKpis |
| Carteiras e operações | Essencial | table |
| Histórico de vínculos | Personalizar | timeline |

Controles originais: Ponto, Responsável, Situação.

Ações originais: Conferir carteira.
