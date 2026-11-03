# Acompanhamento — revisão final e validação com a equipe

03/11/2026 · Fase 5 · Revisão técnica concluída; aceite operacional pendente.

O foco escolhido foi cobrar pendências e retornos dos gestores. A revisão final mantém a matriz da Direção, a cobrança da Coordenação e a execução do Gestor, acrescentando a agenda e corrigindo a comparação mensal.

## O que ficou pronto

- **Retornos dos gestores**, na visão Coordenação: vencidos, hoje ainda no prazo, próximos sete dias após hoje e todos os retornos abertos. A agenda segue a carteira temporal, responsável, operação, tipo e cabeçalho. Permite abrir o retorno, consultar histórico, paginar e exportar a lista completa do filtro.
- Data explícita vence ao fim do dia brasileiro. Espera sem data mantém a regra existente de três dias. Concluídas, observação e fora da régua não entram; registros sem data ou com data inválida são contabilizados separadamente. O motor de medição e as permissões permanecem.
- **Cobrança copiada** separa retornos vencidos, primeira ação atrasada, outras revisões e primeiras ações a registrar, sem repetir uma demanda entre grupos. Inclui competência, ponto, empresa, canal, SKU/anúncio, última ação, data de retorno, próximo passo e ID para localização. Informa a carteira temporal e a data da leitura. O texto é copiado para revisão; não é enviado automaticamente.
- **Comparação mensal corrigida:** backlog ou histórico não pode ser rotulado como se fosse o plano do mês. Para comparar competências, há uma ação explícita que usa somente os planos mensais e conserva responsável, operação e tipo. O CSV da comparação por carteira identifica modalidade temporal e competências realmente incluídas. O CSV da fila também identifica ponto e modalidade temporal.
- **Voltar** conserva busca e página dos casos e a seleção da agenda. O guia dentro da página explica o uso da cobrança e dos retornos.

## Rotina sugerida para a cobrança

1. Abra **Coordenação**, selecione ponto/responsável/operação e use **Seleção + pendências anteriores** para consultar também os compromissos antigos.
2. Confira o quadro por gestor e a agenda de **Retornos vencidos**. Abra o registro antes de cobrar novamente; use **Hoje** e **Próximos 7 dias** para preparar os próximos acompanhamentos.
3. Use **Copiar cobrança** e revise o texto. O resumo cobra execução ou revisão; medição em andamento sem retorno vencido e conclusões não entram como atraso de execução.
4. O gestor registra o que fez, descreve o retorno e informa a próxima revisão quando houver. Registrar continua sem alterar anúncio, campanha ou promoção no marketplace.
5. Atualize a fila. Confira a nova data e o histórico. Uma nova ação pode voltar para conferência/medição; ela não apaga os registros anteriores nem comprova resolução financeira.

## Plano e evidências de teste

| Área | Método | Critério de aprovação | Resultado técnico |
|---|---|---|---|
| Carteira e cobrança | Modelo + Edge | Mesma seleção nos cartões, quadro, agenda, texto e CSV; cada pendência em um grupo | Aprovado |
| Retornos | Modelo + Edge | Vencidos/hoje/sete dias corretos, fuso brasileiro, regra de espera e exclusões preservadas | Aprovado |
| Registro e histórico | Transações + HTTP/Edge | Nova ação preserva sequência e medição anterior; falha não grava nem perde formulário | Aprovado |
| Passagem Coordenação → Gestor | Dois contextos no Edge | Coordenação consulta, Gestor registra, atualização muda a agenda e conserva histórico | Aprovado |
| Comparação mensal | Modelo + reprodução/Edge | Conjunto de vários meses não aparece sob rótulo de um mês; troca explícita preserva carteira | Aprovado |
| Permissões | Modelo + HTTP/Edge | Perfil e restrições da sessão continuam aplicados; histórico de outra carteira é rejeitado | Aprovado |
| Fontes e economia | Contratos + regressão Edge | Promoções/Ads, continuidade e referências econômicas mantêm suas bases e distinção entre zero/ausência | Aprovado |
| Exportação e recuperação | Edge | CSV integral do filtro, imagem da página exibida, celular/tema claro e falha/recuperação sem ampliar seleção | Aprovado |

Foram aprovados **282 testes automatizados**, incluindo 11 novos contratos de cobrança, agenda e comparação. As jornadas de navegador das fases 1 a 4 foram verificadas junto com a jornada final de cobrança. A meta foi cobrir todos os cenários críticos listados; não foi medida porcentagem de cobertura de linhas.

Os testes de gravação usam exclusivamente banco, contas e demandas fictícias isoladas. Não houve alteração de dados comerciais, permissões reais, esquema de produção ou coletores. A validação técnica não constitui aceite da equipe.

## Conferência que falta com a equipe

Escolher exemplos reais e marcar o resultado durante uma rodada curta. A comparação com a origem deve ser feita na mesma atualização da fila.

| Caso real a escolher | O que confirmar | Aceite |
|---|---|---|
| Uma primeira ação atrasada | Responsável, competência e prazo correspondem ao combinado | Pendente da equipe |
| Um retorno vencido | Último registro e data fazem sentido; texto de cobrança orienta a ação correta | Pendente da equipe |
| Uma pendência de mês anterior | Aparece na carteira combinada, preserva o mês e não vira entrega duplicada | Pendente da equipe |
| Um retorno cumprido pelo gestor | Nova ação aparece no histórico e a próxima data está correta após atualizar | Pendente da equipe |
| Uma conclusão medida | Sai da cobrança e da agenda, mantendo o histórico consultável | Pendente da equipe |
| Um exemplo de Promoções e outro de Ads | Fonte, conferência, prazo de retorno e medição representam o trabalho esperado | Pendente da equipe |

Registrar ajustes de regra ou de linguagem encontrados nessa rodada. O encerramento operacional depende dessa conferência; a implementação e a revisão técnica das cinco fases estão disponíveis.
