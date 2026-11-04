# Bloco 2 — recuperação e aprimoramento de Resultados

Entrega de 04/11/2026, sobre `2b6c267`. Conserva o design atual, os filtros compartilhados e a composição de margem do bloco 1. A referência funcional incluiu os renderizadores anteriores preservados no histórico/código, a auditoria anterior e o Diário já restaurado.

## Etapas e entregas

| Etapa | Implementação | Situação técnica |
|---|---|---|
| 2.1 — Fontes e contratos | Vendas efetivas por SKU, contribuição Pós-Ads do mesmo rateio do Raio-X, identidade exata do código e parâmetros financeiros explícitos. | Concluída |
| 2.2 — Visão Geral | Seis indicadores coerentes, referência automática, meta mensal de faturamento, participação interativa dos canais, perdas/avanços/quedas e cards de cada operação. | Concluída |
| 2.3 — Marketplaces | Cards por canal, contas em pop-up, evolução, comparação por operação e Top 10 ordenável por faturamento, contribuição Pós-Ads ou unidades. | Concluída |
| 2.4 — Curva ABC | Pareto e matriz dos mesmos SKUs, Pós-Ads como critério adicional, 27 códigos Faturamento/Unidades/Pós-Ads, prioridades, detalhe, Raio-X, filtros e CSV. | Concluída |
| 2.5 — Forecast | Ritmo do mês, realizado, estimativa, objetivo comparável e necessidade por dia; simulador, histórico, seleção de meses e métodos preservados. | Concluída |
| 2.6 — Regressão e entrega | Diário, permissões, erros, respostas antigas, temas, 390 px, exportação, PostgreSQL, idempotência, backups e espelhamento. | Concluída antes da publicação |

## Como usar

**Visão Geral:** começar por faturamento e Pós-Ads; conferir a referência indicada; abrir o canal, a maior perda ou uma operação. Comparar conta abre a composição atual/referência em pop-up. O filtro da lista de contas preserva os totais do recorte. A faixa de meta mensal indica as operações com objetivo e abre o ritmo do mês no Forecast.

**Marketplaces:** comparar participação, Pós-Ads e TACOS. Ver contas do canal abre a leitura das contas no mesmo período. O ranking é carregado sob demanda e compartilha a consulta de SKUs com a ABC. Cada operação apresenta até dez produtos; o usuário escolhe faturamento, contribuição ou unidades. Raio-X abre a comparação do mesmo SKU entre operações, mantendo a leitura macro já autorizada.

**Curva ABC:** escolher critério e agrupamento. A classe mede concentração; a contribuição Pós-Ads apoia a investigação de rentabilidade. Cards filtram produtos de classe A em prejuízo, Ads que torna a contribuição negativa ou fontes pendentes. A matriz usa Faturamento · Unidades · Pós-Ads; N significa ausência de valor positivo ou indisponibilidade. Busca e filtros não recalculam o denominador. Limpar filtros restaura a lista; detalhe e Raio-X abrem o produto. O CSV contém o filtro inteiro, publicidade, margens e cobertura. A margem real disponível permanece uma referência separada, identificada como anterior ao Ads adicional.

**Forecast:** conferir a referência do ritmo mensal, o realizado e a meta de faturamento das operações que possuem objetivo. A estimativa de fim do mês usa dias corridos até a última referência de venda finalizada disponível, sem presumir encerramento da coleta. Meses passados apresentam o resultado disponível, sem previsão retroativa nem cobrança por dias já passados. Método, histórico e meses usados continuam ajustáveis no simulador; alterar hipóteses não muda as outras análises nem a meta oficial.

## Regras e limites

- Pré/Pós-Ads, publicidade e TACOS conservam as definições do bloco 1. TikTok não recebe segundo desconto. A margem percentual usa faturamento, com líquido na Temu; TACOS usa faturamento, sem somar afiliados.
- O rateio de publicidade é identificado como estimativa gerencial. Fonte ausente não vira gasto zero ou margem saudável. Publicidade sem venda no recorte continua na contribuição conhecida do SKU, sem inventar volume vendido.
- Ranking/ABC usam códigos exatos, preservando maiúsculas e minúsculas. Consolidação por código é opcional e não certifica equivalência cadastral entre empresas.
- A referência automática usa o mês anterior completo para mês completo; nos demais casos, o intervalo anterior de mesma duração. Referência escolhida no cabeçalho prevalece. Valores ausentes não recebem variação fictícia.
- Metas são comparadas somente nas operações com objetivo. Ausência de uma operação ou conflito de objetivos impede atingir um percentual inventado. Duplicatas iguais contam uma vez; alvo zero não produz divisão infinita.
- Estatística, meta, margem das vendas e lucro final continuam distintos. Cortes e referência de margem da ABC são parâmetros locais de análise, sem editar objetivos oficiais.

## Validação

- **369 testes automatizados**, incluindo 23 casos novos de composição, referências, SKUs, matriz, portfólio, ritmo, metas, falhas e concordância SQL/local.
- PostgreSQL somente de leitura: ranking e ABC conciliados com o Raio-X em contribuição, publicidade e percentual do SKU; execução de referência em aproximadamente 1,6 segundo. Nenhum dado comercial exportado nos relatórios de teste.
- Homologação isolada com dados fictícios: Visão Geral, Marketplaces, ABC, Forecast e Diário; temas claro/escuro; 390 px; ranking sob demanda; acesso macro do gestor; sessão ausente; pop-up; filtros e CSV.
- Falha de fonte limpa os valores anteriores e permite nova tentativa. Troca rápida de empresa ignora a resposta antiga. Valores monetários permanecem em uma linha e botões legíveis.
- Nenhuma consulta de DETALHE completo durante esses fluxos. Cache por sessão/escopo, limitado a 24 consultas; os SKUs são compartilhados entre ranking e ABC.
- Integração de HTML compilada e idempotente. Metas oficiais, bônus, DRE, estoque, cadastros, campanhas e tarefas não recebem alterações comerciais.

## Publicação e retorno

Executar a publicação somente após testes, homologação e conferência das fontes espelhadas. Verificar o hash do HTML servido e os bloqueios anônimos. Retorno de versão, se necessário: reverter a entrega sobre a base `2b6c267`, sem migração de banco. Backups das fontes privadas ficam no diretório de execução do bloco 2.

O aceite operacional da equipe permanece separado da validação técnica. Próximo bloco previsto: Operação, com Envios, Estoque, Projeção e integração do Full.
