# Gerencial — bloco 1: classificação e navegação

Implementação de 08/11/2026, sobre `005f6ee`. Branch: `codex/gerencial-bloco1`.

## Entrega

- Diagnóstico e Anúncios partem dos mesmos itens e da mesma composição de margem usada no Raio-X. A agenda mantém suas prioridades, mas o prejuízo é decidido pelo Pós-Ads; Pré-Ads explica a causa.
- Os dois casos da auditoria entram na fila de prejuízo: laço −R$ 19,72 e cortador −R$ 9,51, total −R$ 29,23. A orientação distingue perda anterior à publicidade de contribuição que fica negativa após publicidade.
- Grupo vazio permanece selecionado e apresenta mensagem própria. O clique no card limpa a busca anterior e não volta silenciosamente para Todas as ações.
- Diagnóstico e Anúncios aguardam a apuração financeira antes de desenhar contagens e classificações. O quadro financeiro conserva seu estado de erro e o botão de repetição.
- Sem comparação no cabeçalho resulta em ausência de referência entre períodos. Quando selecionada, as datas são identificadas; ausência de item na referência continua ausente. A referência histórica de erosão continua sendo um critério próprio, distinto da comparação entre períodos.
- TikTok conserva publicidade e afiliados já no líquido; a lista de sinais também reutiliza o Pós-Ads calculado, sem um segundo desconto. A Temu conserva base líquida para margem e receita para TACOS.
- Receita sem base percentual não vira estrela; prejuízo monetário continua identificado mesmo quando o percentual não é calculável. Uma fila de conferência da base evita rótulo saudável sem denominador.

## Validação

497 testes passaram, incluindo 9 regressões novas: casos reais da auditoria reproduzidos com valores sintéticos, composição anúncio/SKU e centavos, TikTok, Ads ausente/zero, Temu, receita sem denominador, piso/maturação e referência ausente.

Homologação no navegador com o frontend real e respostas fictícias locais, sem acesso ao banco de produção:

- Antes da apuração aparecem o andamento e a classificação pendente; não aparecem cards com zero definitivo.
- Grupo Ads comendo a margem vazio permanece `adscome`, com zero itens e mensagem explícita.
- Diagnóstico e Anúncios exibem os mesmos dois itens negativos e −R$ 29,23.
- Comparação desligada e período anterior escolhido mostram os estados e datas corretos.

HTML integrado com scripts válidos e integração idempotente. A entrega altera apresentação/derivação de leitura; não modifica banco, preços, custos, metas, bônus, anúncios ou permissões.

## Fontes e continuidade

Fontes canônicas: `T:/Meu Drive/Business Intelligence/Grupo Bsan/1 - Gestão de Dados/Pipeline/visual/gerencial.js` e `gerencial-modelo.js`. A geração inclui a entrega e mantém as sete bases privadas no HTML local; o pacote online conserva os dados vazios, recebidos somente pela API autenticada.

O espelho do Pipeline estava anterior à entrega já publicada `0f7f40d` de Acompanhamento. A sincronização preserva essa entrega existente na próxima geração; não acrescenta uma nova alteração funcional ao Acompanhamento nesta versão.

## Próximos blocos

Agenda visual por grupos, identidade SKU/ID simultânea, ordem das colunas, evolução de Curva ABC, cores e ligação visível com tratativas seguem no plano seguinte. O layout atual foi preservado neste bloco.

## Reversão

Se a classificação, o filtro de grupo ou o carregamento falharem na conferência publicada, reverter o commit desta entrega e restaurar as fontes correspondentes do backup local. Nenhuma migração ou reversão de dados é necessária. O ambiente sintético de homologação não é uma nova base operacional.
