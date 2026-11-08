# Gerencial — bloco 5: análise e ligação com tratativas

Implementação de 08/11/2026 sobre `fa32738`, branch `codex/gerencial-bloco5`.

## Entrega

- Detalhar abre Análise do produto: orientação por evidências, composição Pré-Ads → publicidade → Pós-Ads e consulta às tratativas existentes. Composição completa, cadastro e referências continuam disponíveis em expansões. O cabeçalho de fechamento permanece visível e uma nova abertura começa no topo.
- A orientação distingue perda já presente antes de Ads, perda após publicidade, pressão de publicidade sobre margem positiva, margem baixa, queima histórica, queda de vendas e crescimento com recuo do percentual Pré-Ads. Produtos sem vendas ou sem fonte suficiente não recebem recomendação de escala. A lista do Diagnóstico usa a mesma orientação, evitando instruções contraditórias.
- Expansão permanece condicional à revisão de estoque, oferta, mídia e metas. A leitura não executa pausa, altera orçamento ou cria tarefas. Rateio e alta de posição com queda de faturamento ficam explícitos.
- A consulta de tratativas usa o endpoint leve existente, dentro do acesso autorizado. Conta demandas do recorte, sem registro/para revisar e com registro, distinguindo registro de conclusão medida. Separa Tarefas, Promoções e Ads e mostra até cinco pendências prioritárias. Considera seleção mensal + pendências anteriores disponíveis, com observação e fora da régua identificados separadamente.
- O vínculo exige empresa, canal e códigos exatos; ponto selecionado é respeitado. Por anúncio, inclui os SKUs sem ID vinculados ao anúncio, mas não outro anúncio explícito do mesmo SKU. Por SKU, inclui os anúncios desse produto. Campanhas sem vínculo específico não entram por mera coincidência de SKU/título. Ausência de identidade não amplia a consulta.
- Abrir no Acompanhamento aplica esse vínculo à carteira, contadores, fila e exportação. Ele permanece durante o carregamento; não depende de busca textual nem desaparece na primeira entrada. O banner identifica a origem, permite remover o filtro e voltar à análise anterior. Troca de sessão, ponto ou operação limpa a origem incompatível.
- A leitura é compartilhada entre prévia e fila, com cache de até 60 segundos por sessão e permissões, deduplicação e atualização explícita. Falha não vira fila vazia nem mantém contagens antigas na prévia; resposta antiga não substitui leitura de outra sessão. Nenhuma consulta é disparada para cada linha da tabela.
- Registrar ação continua no formulário existente do Acompanhamento, com permissões, confirmação do servidor e histórico preservados. Não foi acrescentado endpoint ou fluxo de gravação automática.

## Validação

551 testes passaram, incluindo 18 novos: prioridades da orientação, perda pré/pós, fonte ausente, movimento relativo, queima histórica, normalização e vínculo exato, empresa/canal/ponto, outro anúncio e campanha, seleção + pendência anterior, registro distinto de medição, cache/deduplicação, expiração, falha/repetição e respostas substituídas/de outra sessão.

No frontend real com respostas sintéticas: produto em prejuízo após Ads mostra Pré-Ads R$ 4,35, publicidade R$ 13,86 e Pós-Ads −R$ 9,51. A prévia encontra duas tarefas (incluindo pendência anterior só por SKU), uma promoção com registro e uma tratativa de Ads. Exclui outro anúncio do mesmo SKU, substring, outra empresa/ponto, futuro e campanha. A fila abre com as duas tarefas corretas; o formulário de registro permanece manual e foi cancelado sem salvar. Retorno conserva a busca de Anúncios. Prévia e primeira entrada na fila usaram uma única consulta leve. Falha HTTP 503 removeu as contagens e ofereceu repetição; recuperação e fila de Ads com um item foram conferidas. Tela de 390 px sem transbordamento horizontal da página.

HTML com scripts válidos e integração idempotente. Sem migração, publicação de custos, alterações de metas/comissão, concessão de acesso ou gravação de demanda/tratativa real.

## Próximo bloco

Homologação integrada com perfis de gestor, coordenação e direção: conferir navegação, filtros, estados vazios/erro, tempos de consulta e permissões no conjunto. O aceite operacional da equipe continua sendo uma etapa de uso, sem confundir a entrega técnica com validação dos números oficiais.
