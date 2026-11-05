# Grupo Bsan — Histórico de Metas e fechamento da Comissão

## Causa

A leitura diária exigia simultaneamente conciliação dos valores e comissão não congelada. O fechamento impedia preencher as séries e a condição do consolidado bloqueava a rota inteira, inclusive faturamento. Novembro, sem fechamentos, continuava aparecendo. O bloqueio não representava ausência de vendas.

## Correção

- O congelamento preserva remuneração, situação e valores publicados da comissão. Não impede consultar o histórico diário conciliado em Metas. Objetivos continuam vinculados à competência; esta alteração não cadastra nem recalcula objetivos.
- As verificações de conciliação continuam ativas. Dados incompatíveis com a referência mensal não viram uma curva ajustada arbitrariamente. O mês corrente continua excluindo o último dia observado da leitura considerada completa.
- Histórico reconstruído pela base atual fica identificado, pois atualizações posteriores podem divergir da fotografia publicada. Lucro e margem diários mantêm a identificação de estimativa com rateio dos custos mensais. Nenhum histórico é apresentado como fotografia diária imutável do fechamento.
- Congelar a comissão não bloqueia Product Ads diário conciliado. Quando faltam afiliados diários, Gastos com publicidade e TACOS mantêm Diário/Acumulado do componente de campanha, com legenda parcial, valores no demonstrativo e desvio do indicador completo indisponível. TACOS acumulado usa gasto acumulado dividido pelo faturamento acumulado do mesmo recorte.
- Quando não existe uma série de campanha conciliada, a comparação mensal continua disponível; não foram criados gastos por dia a partir do total mensal. Isso ainda se aplica à carga Amazon sem abertura diária.
- O integrador normaliza quebras de linha e remove guardas legadas repetidas. A compilação permanece idempotente, também em CRLF.

## Verificação

Consulta somente de leitura ao PostgreSQL comparou 15 operações em cada competência. Históricos conciliados antes/depois: agosto **0/15 → 15/15**, setembro **2/15 → 15/15**, outubro **8/15 → 15/15** e novembro **15/15 → 15/15**. Foram comparados por operação objetivos, faturamento/margem mensais, progresso, teto e bônus: os valores permaneceram iguais. Fontes não foram alteradas.

**472 testes aprovados**, sem falhas ou ignorados. As 13 novas regressões cobrem meses fechados, bônus preservado, divergência de fonte, corte do mês corrente, ausência de projeção sobre comissão congelada, publicidade parcial e recompilação. Navegador com banco fictício testou o seletor de novembro/agosto/setembro/outubro, gráficos diários/acumulados, perfis, temas e 390 px. Nenhum erro JavaScript nesses percursos.

Sem mudanças de schema, reprocessamento de vendas, reabertura de comissão, alteração de pagamento ou coleta externa. Retorno técnico: reverter somente esta entrega sobre `ab24c2f`, preservando as demais alterações e os dados de negócio.
