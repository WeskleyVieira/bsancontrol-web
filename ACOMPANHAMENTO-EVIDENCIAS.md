# Acompanhamento — evidências de Promoções e Ads

03/11/2026 · Fase 3 de 5.

## O que mudou

Promoções e Ads passam a apresentar a orientação e a leitura da fonte na própria tarefa, além das etapas de trabalho entregues anteriormente. A consulta complementa somente demandas já autorizadas pelo endpoint e reutiliza as tabelas dos coletores atuais.

### Promoções

- Orientação do plano, campanhas ativas e elegíveis, motivo e data da leitura disponível.
- Preço atual da leitura, preço de lista e preço informado no registro apresentados separadamente.
- Cenário sugerido identificado como simulação: preço, margem pré-Ads e margem pós-Ads. `preco_promo`, `mc_promo` e `mc_pos_ads` da fonte descrevem o cenário; não confirmam uma oferta aplicada.
- Margem estimada no preço atual identificada como pré-Ads, sem substituir a medição do efeito da ação.
- Revalidação visível com data, veredito, motivo e correção indicada. O detalhe também mostra a margem e o piso usados naquela conferência, quando disponíveis.
- Filtro de conferência: dentro/fora da regra, estratégia, sem revalidação, leitura anterior ao registro, sem ação ou sem leitura relacionada.

### Ads

- Nível campanha ou anúncio. Campanha sem SKU continua sendo uma demanda válida de campanha.
- Orientação extraída do trecho `O QUE FAZER` quando presente. A ausência desse trecho usa orientação pelo tipo, sem inventar nome de campanha, alvo ou passo perdido em texto truncado.
- Campanha relacionada, ROAS-alvo lido e recomendado, gasto, receita atribuída e margens pré/pós-Ads.
- Janela dos valores do plano separada da competência mensal da demanda. Uma janela acumulada não é apresentada como valor exclusivo daquele mês.
- Filtro por campanha, anúncio, ausência de leitura ou leitura anterior ao registro.
- Gasto e receita de campanhas e anúncios não são somados entre níveis.

## Fontes, datas e limites

O servidor relaciona empresa + anúncio em Promoções e empresa + nível + chave em Ads, usando a última data disponível da conta. Se o item não estiver nessa leitura, não substitui por uma leitura antiga nem interpreta a ausência como resolução. Campanhas com chave normalizada ambígua exigem revisão do vínculo.

As fotografias dos planos têm data diária, sem horário. Leitura do mesmo dia da ação não comprova qual ocorreu primeiro. Revalidação, checagem de preço e medição mantêm seus próprios horários e os critérios de validade existentes.

O texto guardado na demanda é chamado de apontamento do plano: alguns motores o atualizam, portanto ele não é apresentado como diagnóstico original imutável. O texto disponível pode ter sido abreviado na geração da demanda; a interface informa essa possibilidade.

Falha, fonte ausente ou campo opcional indisponível preservam a demanda e seus registros. A interface informa a limitação e não apresenta valores ausentes como zero. Outros canais permanecem identificados quando não possuem essa fonte automática.

## Gestão e exportação

Cada seção ganhou um resumo específico de registro/regra/resultado ou de campanhas/anúncios/cobertura. As datas por operação ficam disponíveis em uma abertura própria. Os resumos usam a carteira; busca, etapa e os novos filtros refinam a lista. Trocar a etapa conserva a busca e o filtro da lista; abrir uma carteira ou trocar a seção limpa os filtros que não pertencem a ela.

O CSV inclui situação da fonte, data da leitura, última data da conta, nível/campanha/janela de Ads, orientação, preços e métricas disponíveis. Dados de registro, conferência e medição continuam separados. As imagens aproveitam os cartões enriquecidos sem enviar conteúdo automaticamente a terceiros.

## Validação e publicação

- 246 testes automatizados aprovados, incluindo os contratos de leitura, escopo, estados, precisão, datas e lotes acima de 200 itens.
- Navegador Edge com usuários e dados fictícios: Promoções, filtros, cenário versus preço atual/informado, motivo da divergência, falta de leitura, campanha sem SKU, ROAS e janela, zero/negativo, detalhe, CSV, falha/recuperação de fonte, segurança de texto, tema claro, celular e escopo do Gestor.
- Regressão das jornadas de gestão da fase 1 e preservação das regras de etapa da fase 2.
- Falta da tabela de Ads simulada somente no banco fictício: a API manteve resposta válida, demandas e leitura de Promoções.
- Compatibilidade das colunas e vínculo das leituras conferidos com consultas somente de leitura no banco de produção.

Sem alteração de esquema de produção, permissões, dados comerciais, coletores ou execução de ações no marketplace. O build local foi preparado para incluir o novo módulo de consulta.

## Próximas fases

4. Continuidade entre competências, pendências anteriores, reincidência e revisão das medidas econômicas.
5. Homologação operacional do conjunto e encerramento do plano.
