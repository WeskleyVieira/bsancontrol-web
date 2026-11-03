# Acompanhamento — etapas da tratativa

03/11/2026 · Fase 2 de 5.

## Uso diário

A fila geral passa a separar cinco etapas. A fazer e Recobrar ficam abertas; as demais podem ser expandidas. Cada etapa mostra uma prévia de até cinco demandas e permite abrir a lista completa, com paginação. Busca e troca de etapa preservam o texto pesquisado e o contexto da carteira.

| Etapa | Critério | Próxima ação |
|---|---|---|
| A fazer | Demanda ativa sem registro | Executar e registrar |
| Recobrar / revisar | Retorno vencido, divergência de conferência ou medição que exige revisão | Conferir o motivo e registrar uma nova ação |
| Aguardando conferência | Existe registro; falta leitura atual de uma conferência suportada para aquela ação | Acompanhar a leitura da fonte e conferir eventuais dados ausentes |
| Em medição | Registro presente, sem divergência ou conferência exigida pendente; resultado ainda não encerrou a tratativa | Acompanhar o efeito ou o retorno do terceiro |
| Concluídas | Resolução ou justificativa medida após a última ação, sem conferência exigida pendente ou revisão | Consultar histórico; nova ação reabre a tratativa |

Observação e Fora da régua continuam separadas da fila ativa.

## Prazos e evidências

- O prazo da primeira ação permanece o da demanda, com a referência de origem indicada quando ausente.
- Qualquer nova ação pode ter uma data opcional de revisão/retorno, persistida no campo já existente. Esse campo não fixa a janela de medição.
- Retorno com data vence no fim daquele dia em São Paulo. Para uma ação de espera sem data, mantém-se a regra vigente de três dias a partir do registro.
- Progresso permanece em acompanhamento e pode ser recobrado quando o retorno vence. Uma resolução/justificativa efetiva, sem pendência de conferência, encerra a cobrança daquele retorno.
- Leitura parcial, pausa, falta de venda ou falta de leitura não encerram a tratativa. Não foi criado um prazo uniforme de sucesso ou fracasso.
- Conferência de preço é exigida nas ações de ajuste de preço do Mercado Livre; o prazo de atualização de 24h para divergência de preço foi preservado. A medição pode fornecer evidência de aplicação quando a fonte registra essa informação.
- Ações suportadas de promoção também passam pela revalidação da regra. `ok` ou `estrategia` não substituem o resultado financeiro. Um preço pode estar conferido e a regra da promoção ainda estar pendente, ou o inverso.
- Ads continua dependendo de seu motor de resultado. Outros canais e ações sem conferência automática suportada não recebem uma confirmação fictícia.
- Checagem dispensada não comprova aplicação: encaminha à revisão do vínculo da demanda, sem consolidar ou excluir tarefas. Continuidade entre competências permanece no escopo da fase 4.

## Interface e histórico

Os cartões mostram etapa, próximo passo, última ação, registro, conferência e medição. Retorno vencido aparece separado do prazo da primeira ação. O botão Histórico abre os registros completos; nova ação acrescenta um registro e não apaga a medição anterior. Uma leitura anterior à nova ação deixa de ser tratada como resultado atual.

Coordenação ganhou uma coluna própria de Retornos vencidos. A cópia da cobrança inclui apenas A fazer e Recobrar; concluídas, conferência e medição não são cobradas como pendência de execução. CSV mantém etapa, próximo passo, conferência, retorno calculado e indicação de retorno vencido.

As etapas são derivadas das evidências já disponíveis. Não há migração de esquema, fechamento manual fictício, execução em marketplace ou alteração dos coletores nesta entrega.

## Validação

- 235 testes automatizados aprovados, incluindo 38 de Acompanhamento.
- Edge com dados fictícios: cinco etapas; concluídas recolhidas; retorno vencido; progresso; justificativa medida; reabertura de concluída; histórico preservado; retorno em ação comum; falha de gravação e recuperação; CSV por etapa; cobrança sem concluídas; contexto, tema claro e celular.
- Regressão da fase 1: matriz, três níveis, Tarefas/Promoções/Ads, filtros, Gerencial, comparação, imagens, erros de consulta e permissões.
- Nenhuma gravação em dados reais foi usada nos testes.

## Próximo bloco

Fase 3: enriquecer Promoções e Ads com orientação, campanhas, preços, margens e evidências mais próximas da tarefa. A continuidade entre competências e as medidas econômicas seguem para a fase 4; a homologação operacional do conjunto é a fase 5.
