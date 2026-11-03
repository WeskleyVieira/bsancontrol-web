# Acompanhamento — continuidade e referências econômicas

03/11/2026 · Fase 4 de 5.

## Carteira temporal

O período do cabeçalho continua escolhendo as competências dos planos. A seleção padrão conserva o comportamento anterior. As situações, prazos e fontes são avaliados na leitura atual; selecionar outubro não reconstrói o estado do sistema no fechamento de outubro.

- **Plano da seleção:** demandas pertencentes aos meses selecionados.
- **Pendências anteriores:** demandas ativas ainda não concluídas, anteriores ao primeiro mês selecionado.
- **Seleção + pendências anteriores:** os dois conjuntos, sem transferir nenhuma demanda de mês.
- **Histórico até a seleção:** todos os planos disponíveis até o último mês selecionado, incluindo observação, fora da régua e conclusões.

Ponto, empresa, marketplace, responsável, operação, tipo e permissões delimitam a consulta antes de relacionar os registros. Competências posteriores à referência ficam fora. Registros sem competência reconhecível não entram na seleção e são sinalizados. O limite inicial de histórico da página foi preservado.

## Demanda, caso e nova ocorrência

A demanda é o registro de um plano mensal. O caso agrupa demandas com o mesmo ponto, empresa, canal, tipo e entidade identificada. Anúncio e SKU são níveis diferentes; SKU só é usado quando não há anúncio. Campanhas Ads exigem a chave explícita do plano e não são inferidas pelo título. Sem identificação suficiente, cada demanda permanece separada.

Uma nova ocorrência só é reconhecida quando todas as ocorrências do episódio anterior têm resolução ou justificativa medida, conferências exigidas atuais e datas anteriores ou iguais ao nascimento da seguinte. Sem essas evidências, o vínculo fica como continuidade a conferir. Mais de uma demanda da mesma identidade na mesma competência torna o vínculo ambíguo e impede o reconhecimento automático de nova ocorrência.

Nenhum vínculo altera demanda, gestor, registro, conclusão ou prazo na origem. A trajetória abre os registros autorizados de cada competência. É uma interpretação das evidências atuais, sem criar um novo cadastro persistido de casos.

Os indicadores de execução continuam contando **demandas**. A faixa de continuidade conta **casos**, com e sem pendência ativa. Uma conclusão recente não esconde demanda antiga ainda ativa do mesmo caso. O quadro por carteira informa casos compartilhados; eles não entram como conclusões exclusivas de cada responsável. Responsável da demanda não comprova autoria individual da ação.

## Referências econômicas

Três blocos conservam as respectivas bases:

1. **Margem registrada nos anúncios acompanhados:** leitura mensal de `vendas`, apenas `venda` e `venda_com_troca`, por empresa, canal, ponto, anúncio e competência. Soma `mc_comissao_n` e `receita_n`, com fallback para as colunas legadas quando ausentes. O mesmo anúncio/mês entra uma vez, mesmo relacionado a várias demandas. Ausência, inconsistência e linhas sem valores ficam explícitas; zero conhecido é preservado. Fontes identificadas como estimadas/provisórias são contadas. Não é o resultado da operação inteira nem lucro final, e não incorpora devoluções nesse bloco.
2. **Referências do plano:** distância estimada até a meta mensal, referência de perdas em devoluções, exposição de Promoções ou corte/gasto Ads. Totais são permitidos apenas na mesma natureza, janela, tipo e ponto; entidades repetidas na mesma base ficam excluídas até conferência. Promoções com janela móvel de 30 dias sem corte registrado não são somadas. Ads separa campanha, anúncio e janela. A oportunidade de baixar ROAS não vira valor monetário zero.
3. **Efeito observado por caso:** última ação com data identificável e sua medição posterior. Datas ausentes, empate de horário, medição antiga ou campos ausentes impedem abertura comparável. A margem registrada por dia é expressa em reais/dia; devoluções usam taxa e variação em pontos percentuais. Não soma `recuperado`, não soma janelas sobrepostas e não comprova causalidade.

Há CSVs distintos para casos, margem mensal, referências do plano e efeitos observados. A prévia dos efeitos limita-se a 25 casos e seu CSV contém todos; a lista de casos tem paginação e exportação integral da busca. As imagens incluem a visão aberta e preservam a seleção.

## Validação e publicação

- 271 testes automatizados aprovados, incluindo 25 novos contratos de continuidade e economia.
- Edge com dados fictícios: quatro carteiras temporais, corte futuro, backlog e retorno, demanda recente concluída com pendência antiga, recorrência comprovada versus vínculo incerto, duplicidade, trajetória, paginação, exportações, margem negativa, Promoções sem soma, imagens, tema claro, celular, falha e recuperação de consulta e escopo do Gestor.
- Regressão dos níveis Direção/Coordenação/Gestor, matriz, cobrança, filtros, entrada pelo Gerencial, comparação, imagens e evidências de Promoções/Ads.
- Contrato de agregação conferido em PostgreSQL com consulta somente de leitura. Consultas usam apenas os vínculos de demandas já autorizadas, em lotes parametrizados.
- Sem migração de esquema, alteração de permissões, gravação comercial ou execução em marketplace. Homologação usa banco e usuários fictícios isolados.

## Etapa restante

Fase 5: homologação operacional do conjunto com exemplos escolhidos pela equipe e ajustes finais de uso. Validar na rotina a cobrança, os tipos, prazos, vínculos ambíguos e leituras econômicas. A validação automática desta entrega não substitui essa conferência operacional.
