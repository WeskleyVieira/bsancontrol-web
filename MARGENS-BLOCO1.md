# Bloco 1 — margens e comparação do mesmo SKU

Implementação de 04/11/2026. Conserva o design atual e os fluxos operacionais do Grupo Bsan.

## Entrega

- Raio-X do Gerencial abre o mesmo SKU em todas as operações do ponto, incluindo outras carteiras para quem já pode ler Vendas. Permite restringir a conta ou ampliar para o grupo, mantendo as datas da janela independentes do cabeçalho.
- Composição principal: Pós-Ads em R$ e %, Pré-Ads, publicidade e TACOS. Operações mostram unidades, preço médio, CTP por unidade e contribuição por unidade. Gráfico permite dia/mês, margem em R$/%, com Pré e Pós lado a lado.
- Anúncios usa a mesma composição por SKU/anúncio, mantém TACOS nas essenciais e dá destaque ao Pós-Ads. Faltas de fonte viram pendência no Diagnóstico, sem promover o item como estrela ou candidato a escalar.
- Panorama, Publicidade, Visão Geral e Vendas recebem a composição principal. Vendas respeita busca, SKU exato, status e filtro de margem negativa no resumo do filtro inteiro.
- Diário e Marketplaces recebem o mesmo rateio no servidor. Marketplaces apresenta Pós-Ads nas colunas essenciais. Fonte ausente deixa margem e nota dependentes de Ads indisponíveis, preservando faturamento, pedidos, tarefas e demais informações.
- Raio-X principal conserva vendas, custos, margem real/teto e situações na abertura auxiliar. Sua leitura principal passa a ser o Pós-Ads.

## Definições

Pré-Ads = contribuição registrada + Ads já descontado no líquido. Pós-Ads = contribuição registrada − Ads adicional. No TikTok, o Ads informado no líquido é recomposto somente para exibir o Pré-Ads; não recebe segundo desconto. Afiliados permanecem no líquido nos dois lados da composição. TACOS = publicidade ÷ faturamento, sem somar afiliados. A margem usa faturamento nos demais canais e líquido na Temu, diferença explicitada no comparativo.

O gasto mensal usa o maior total entre anúncio e campanha, sem somar fontes que representam a mesma cobrança. Anúncios são vinculados pelas chaves do marketplace; múltiplos SKUs/pontos compartilham o gasto pela receita do mês completo. A diferença e os gastos sem vínculo são rateados pela receita. Sem receita, usa unidades ou divisão igual. O rateio conserva centavos. Datas utilizam os pesos diários da campanha/operação, quando disponíveis; caso contrário, a receita mensal. Busca por pedido e filtro de margem negativa recebem a fração de Ads correspondente às linhas do produto no mês. Isso é estimativa gerencial, não gasto identificado por pedido nem medida causal de retorno.

Fonte ausente difere de zero registrado. Publicidade sem vendas para atribuir a SKU/ponto/data gera aviso e impede concluir o Pós-Ads. Créditos no relatório mensal exigem revisão; créditos já discriminados no líquido são conservados. CTP ausente não vira custo zero. A fonte real disponível continua com fallback declarado; não passa a significar lucro final.

## Validação

- 346 testes automatizados: composição, conservação, recortes, filtros, permissões, regressões das áreas existentes e idempotência da integração.
- Navegação com dados fictícios isolados: gestor, comparação entre carteiras, abertura por operação, temas claro/escuro, 390 px, gráfico, troca rápida de SKU, falha/repetição de consulta e bloqueio anônimo.
- Consulta PostgreSQL somente de leitura: nova composição e Diário concordam em contribuição e publicidade no recorte verificado. Nenhum dado comercial foi exportado nos relatórios de teste.
- Backup e espelhamento das fontes canônicas e locais, sem sobrepor divergências de outras funcionalidades.

## Limites e continuidade

O rateio é identificado como estimativa; a cobertura da fonte não certifica conciliação, liquidação ou fechamento. Comparativos devem considerar volume, preço, custo, canal e base percentual. A validação operacional com a equipe continua necessária.

Metas, bônus, DRE, registros de tarefas, preços, custos de cadastro, orçamento e campanhas não são alterados por esta entrega. A comparação auxiliar antiga do Panorama não gera variação Pós-Ads sem referência recomposta; a evolução da leitura de Resultados e das referências entra no bloco 2. Rankings de ABC baseados na margem registrada continuam identificados como essa base até a revisão visual/funcional dessa fase.

Próximo bloco: restaurar e aprimorar Resultados (Visão Geral, Marketplaces, ABC e Forecast), preservando o Diário, o novo design e a composição de margem definida aqui.
