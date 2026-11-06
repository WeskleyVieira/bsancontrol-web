# Grupo Bsan — Mídia paga, Afiliados e Consolidado

Implementação dos seis blocos, 06/11/2026. O módulo conserva o design do BsanControl e os fluxos existentes de Gerencial. A validação operacional com a equipe é distinta da homologação técnica.

| Bloco | Entrega |
| --- | --- |
| 1 — Contratos | TACOS de mídia = somente Ads/faturamento. Publicidade total sobre vendas = (Ads + um estado/origem de afiliados)/faturamento. Estimativa, cobrança e liquidação são alternativas; ausência não vira zero. |
| 2 — Modelo e consulta | `publicidade-leitura-modelo.js` e `GET /api/publicidade/resumo`: agregação de vendas, carteira e ponto no servidor, fontes independentes, metadados, série diária/acumulada e precisão em centavos. |
| 3 — Publicidade | Mídia paga, Afiliados e Consolidado com cards, curva diária/acumulada, orçamento/teto, fontes e fotografias anteriores. Campanhas/anúncios, pesquisa, filtros, CSV e ações continuam na Mídia paga. |
| 4 — Metas | Gastos com publicidade e TACOS consolidados continuam na Rota e histórico. A abertura “Analisar mídia paga e afiliados separadamente” acrescenta metas próprias. Objetivos atuais, pesos e bônus permanecem intactos. |
| 5 — Cruzamentos | O Consolidado reaproveita a composição Pré-Ads → Ads apurado → Pós-Ads. Componentes incorporados ao líquido não sofrem segunda dedução. Estimativa mensal de afiliados não é descontada novamente sem conciliação. |
| 6 — Homologação | Testes de cálculo, fontes alternativas, permissões e revisão concorrente; navegação fictícia, falhas de API e descarte de resposta antiga; conferência real somente com SELECT e comparação dos objetivos/bônus de agosto a novembro. |

## Origem e precedência

- Mídia: cobranças das vendas no TikTok; nos demais canais, `adsDia`. Sem diário, mês inteiro usa `adsCamp`, depois `ads`, depois a mídia específica disponível na apuração mensal. `Ads_real` não é reinterpretado como gasto exclusivo de mídia.
- Anúncios e campanhas são aberturas alternativas. Não somar as duas nem somar suas receitas atribuídas ao faturamento. O detalhe legado conserva o pró-rata identificado; não se torna uma despesa adicional aos cards.
- Afiliados: cobrança registrada no líquido, diário conciliado vinculado à data de venda, cobrança mensal conciliada vinculada às vendas, estimativa mensal ou relatório atribuído identificado. Dataset independente e metadado embutido em `COMISSAO_DET` não somam a mesma estimativa duas vezes.
- Uma fonte mensal só entra inteira quando a janela contém o mês inteiro. Não ratear estimativa de afiliados pelos dias. Faltas em dias anteriores interrompem o acumulado; o card mensal continua independente.
- O faturamento operacional usa as vendas finalizadas atuais. A fotografia mensal histórica pode estar arredondada ou ter sido produzida antes de alterações de situação/valor. A conferência apresenta ambos os denominadores e percentuais, sem compensação silenciosa.
- Relatório sem identificação de ponto de operação presente em múltiplos pontos não é atribuído integralmente a um deles. A leitura registra a pendência.

## Metas próprias e autorização

`POST /api/publicidade/metas`, exclusivo de Direção com Gestão habilitada, grava orçamento de mídia, teto de TACOS de mídia em percentual e orçamento de afiliados. Valores iniciais são vazios, sem copiar o orçamento consolidado. Recurso operacional separado da remuneração.

Persistência no dataset `publicidadeMetas`: versão global e revisões imutáveis por empresa, marketplace e competência, autor e data do servidor. O salvamento compara a versão/JSON anterior atomicamente com `RETURNING`; alteração concorrente retorna 409. Campo vazio remove a meta vigente em nova revisão, preservando as anteriores. Não há migração destrutiva ou edição de `comissao`/`comissaoDet`.

A leitura exige Gestão e intersecta a carteira do gestor no SQL e nas fontes. Estoque, compradora e Pós-venda não acessam estes endpoints. O dataset global de revisões não sai por Extras. O cache visual expira em 60 segundos, depende da identidade, carteira, geração, período e seleção; atualização explícita/salvamento invalida o cache. Consultas antigas são abortadas/descartadas e gráficos anteriores são destruídos.

## Validação e operação

- O teste de referência conserva entradas fixas e demonstra a diferença entre TACOS de mídia e percentual consolidado. A leitura real atual é verificada à parte; não se exige que uma fotografia antiga seja idêntica à base atualizada.
- A equipe percorre Gerencial → Publicidade → três visões e confere o mesmo período. Em Metas, mantém os dois indicadores na Rota; usa a abertura separada para analisar componentes e definir novos limites.
- Sem dados diários Amazon, manter o mensal identificado. Sem diário de afiliados conciliado, não fabricar curva consolidada. São dependências das fontes, não indicadores zerados.
- Homologação usa usuários e bancos fictícios. Conferência real permite somente SELECT; não grava metas oficiais, campanhas, pagamentos, estoque ou remuneração.
- Retorno: restaurar o commit anterior de aplicação e HTML. O dataset de novas metas pode permanecer preservado, sem efeito na comissão e sem precisar restaurar banco. Investigar se houver erro de autorização, total não explicável ou falha de navegação.

Não foram definidos valores comerciais para as novas metas. A Direção pode defini-los no editor. Integrações futuras por criador/pedido e novas coletas dependem de fontes adequadas e não são necessárias para esta separação.
