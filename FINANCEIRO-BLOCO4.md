# Bloco 4 — Metas, Comissão e DRE

Entrega de 04/11/2026, iniciada sobre `da0321c` e integrada à atualização de Alinhamentos `beae07e`. Preserva o design atual, o fluxo anterior útil e as regras oficiais de metas, bônus e fechamento. Referências: renderizadores existentes de Metas e Comissão, `AUDITORIA_FINANCEIRO.md`, composição de margem do bloco 1 e integração do Forecast do bloco 2.

## Entrega e uso

| Área | Entrega | Uso |
|---|---|---|
| Metas | Cards por operação com realizado, objetivo, percentual atingido, falta e margem publicada. Projeção existente separada do objetivo. | Abrir metas da operação leva à visão mensal e ao detalhe. Rota diária, histórico, planejamento, indicadores e regras existentes permanecem disponíveis. |
| Metas com duplicidade | Cadastro repetido deixa o consolidado e as projeções sem confirmação, com identificação da operação. | Conferir a origem em Comissão ou selecionar uma operação sem duplicidade; nenhum registro é removido. |
| Comissão | Cards de bônus registrado, margem, pontuação e pendências; fotografia fechada distinguida de mês passado. | Abrir a composição oficial mantém seus valores, regras, fontes e histórico. O bônus não é recalculado pela apresentação. |
| Pós-Ads atual | Popup de consulta em Metas, Comissão e DRE, sob demanda e com autorização de Vendas. | Comparar a leitura atual das vendas com a apuração publicada, mantendo a competência e a operação. Na DRE, usa todas as competências da seleção. |
| DRE | Seis indicadores: saldo/resultado, após investimentos conhecidos, investimentos adicionais, margem disponível, estrutura e equilíbrio do cenário. Cards de empresas e competências, com negativos destacados em vermelho. | Começar pelo saldo e cobertura; conferir investimentos e estrutura; aprofundar a empresa ou abrir os custos distribuídos. |
| DRE sem posição | Mês sem entrada financeira mantém traço e lacuna no gráfico, distinto de saldo zero informado. | Não reutiliza resultado de outra competência nem representa ausência como mês equilibrado. |
| Integração | Comparação opcional indisponível não apaga o resultado atual confirmado; falha da fonte atual limpa os cards e permite nova tentativa. | Atalhos preservam competência e permissões. Respostas de consulta antiga não substituem a empresa selecionada. |

## Regras de leitura

- O popup usa a composição gerencial de vendas com margem com teto, identificada na janela: Pré-Ads → publicidade → Pós-Ads. Essa composição pode diferir da margem real disponível da DRE e da fotografia de remuneração, por atualização, custos, eventos e regras de apuração. Os valores não são equiparados nem usados para recalcular bônus.
- A margem da DRE após investimentos conhecidos já considera os adicionais da fonte, incluindo Ads, excesso de afiliados cadastrados e lives; não é uma margem Pré-Ads. Pode ser parcial quando falta fonte. Ads e afiliados já incorporados ao repasse não recebem novo desconto.
- Empresa e ponto recebem a estrutura cadastrada. Marketplace isolado mantém contribuição antes da estrutura, sem receber integralmente custos empresariais. Ausência, parcialidade e fechamento continuam estados diferentes.
- A soma de investimentos conserva o máximo entre anúncio e campanha e a identificação original de afiliados/CVAF. Créditos, zero registrado, fonte ausente, ordem de soma e precisão são preservados.
- As permissões de DRE, Comissão, Vendas e carteira não foram ampliadas. Popups financeiros são encerrados quando muda a identidade da sessão.
- Meses passados não confirmam congelamento ou pagamento. Objetivos, percentuais, pesos, teto, bônus, comissões fechadas, rateios oficiais e cadastros financeiros não são alterados por esta entrega.

## Desempenho

A consulta anterior transferia o histórico completo de anúncios para a DRE. O servidor agora compacta os campos utilizados por competência, operação e identificação de afiliados, somando os investimentos em JavaScript na ordem da origem. A interface recebe somente as competências pedidas. Não se usa uma nova soma SQL de precisão diferente.

As fontes têm cache de até 30 segundos por conexão, com conferência de seus horários de atualização em toda consulta. Mudança de versão invalida a fonte; cargas simultâneas compartilham a leitura; falhas não ficam presas no cache. Os lançamentos versionados já garantem avanço do horário de atualização, inclusive entre gravações próximas. Vendas continuam consultadas no recorte atual. O cache da interface é limitado a 16 consultas por identidade.

Na amostra PostgreSQL somente de leitura, os dados de mídia entregues à interface passaram de aproximadamente 6,67 MB para 1,99 KB, redução de 99,97%, com a composição total e a mídia por operação preservadas. É uma medição de volume, não garantia de tempo fixo de carregamento.

## Validação

- 411 testes automatizados aprovados, incluindo a integração dos quatro testes de Alinhamentos e 23 novos de objetivos, ausência/zero, fotografia, duplicidade, precisão, conservação de mídia, cache e invalidação de fontes.
- PostgreSQL real consultado somente em leitura: composição, empresas e competências conciliadas; comparação com as fontes originais confirmou os mesmos valores financeiros e de investimentos por operação. Nenhum dado comercial foi exportado nos relatórios de teste.
- Navegador isolado com dados fictícios: Metas, Comissão, DRE, popup Pós-Ads, detalhes oficiais, seleção de operação, competência ausente, CSV, falhas, identidade e troca rápida de empresa. Temas claro/escuro e 390 px, sem erro JavaScript ou transbordamento persistente.
- Gestor conserva a própria carteira e não recebe acesso à DRE. As consultas não baixam o DETALHE completo.
- Compilação e integração idempotente; backups e sincronização no Pipeline canônico, no espelho local e no pacote publicado.

## Continuidade

A validação gerencial dos números, objetivos e fotografias oficiais permanece com a equipe. Divergência de base deve ser investigada sem modificar remuneração fechada. A entrega não executa coleta, reprocessamento, pagamento ou fechamento.

Próximo bloco previsto: **5 — Produtos e Pós-venda**, para conferir pendências, responsáveis, custos/embalagens, atendimentos, indicadores e acessos. O bloco 6 reúne a homologação operacional do conjunto.

Retorno técnico, se necessário: reverter somente as alterações financeiras sobre `beae07e`, preservando Alinhamentos e sem migração de banco; restaurar os trechos correspondentes das fontes privadas pelos backups desta execução.
