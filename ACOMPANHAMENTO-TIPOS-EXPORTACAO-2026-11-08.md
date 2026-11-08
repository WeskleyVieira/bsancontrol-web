# Acompanhamento — tipos de tratativa e ações de imagem

Correção sobre a4631e9, em 08/11/2026.

- Removida a categoria visual Queima / sem giro. Queima de margem e Baixo giro / peso morto têm filtros, cards, cores e instruções independentes. Casos e continuidade também distingue esses tipos no vínculo e mostra o tipo na tabela. Tipo explicitamente misto na origem aparece como Revisar tipo na origem, sem adivinhar a classificação.
- Preservados IDs, tipos da origem, registros, medições, responsáveis, prazos informados e regras padrão anteriormente aplicadas. Sem migração de dados nem alteração do gerador de tarefas. O Diagnóstico já mantém queima histórica e peso morto em grupos distintos; a classificação visual de baixo giro não comprova volume zero nem autoriza exclusão.
- Imagem para o grupo e Imagem detalhada são ações de exportação, com aparência neutra e separação visual das visões selecionadas. Ambos exibem estado de geração e abrem prévia para copiar/baixar, sem envio automático.
- Imagem para o grupo: resumo visual com indicadores, tipos e responsáveis da carteira. Imagem detalhada: quadros da visão aberta; havendo fila, até 10 demandas, com CSV para a lista completa.
- Comparar carteiras: compara responsáveis, operações ou competência anterior por registro, atraso, retorno e resultado medido. Casos e continuidade: reúne demandas relacionadas por entidade, operação e tipo, preservando competências e histórico. Referências econômicas: separa margem mensal dos anúncios, referências comparáveis do plano e efeito observado por caso; não equivale a lucro recuperado.

Validação: regressões de tipos, filtros, contagens, continuidade, prazos e preservação da origem; frontend real com respostas sintéticas para tipos e estados dos botões. Reversão por revert deste commit e regeneração do HTML.

## DRE — escolha de competência

Mês é o padrão: um único seletor altera início e fim da consulta para a mesma competência. Intervalo de competências habilita os seletores inicial/final, mantendo meses completos e correção de ordem já existente. Atalhos para uma competência voltam ao modo mensal. O período compartilhado permanece preservado; fontes, cálculo, escopo e comparação anterior não mudam. Em mudança do cabeçalho, o modo mensal usa o mês final e o modo intervalo conserva a abrangência mensal do cabeçalho.
