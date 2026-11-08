# Gerencial — bloco 2: Diagnóstico como agenda visual

Implementação de 08/11/2026 sobre `236ab4c`, branch `codex/gerencial-bloco2`.

## Entrega

- Quatro frentes: Corrigir perdas, Proteger resultados, Explorar oportunidades e Monitorar evolução. Uma frente visível por vez, com cards coloridos, contagem, critério e até dois itens de prévia. Títulos de grupos não recebem links automáticos de anúncios.
- Grupos: margem sangrando, Ads comendo margem, correção de margem, peso morto, estrelas, queima histórica, para impulsionar, possíveis estrelas, maturação, altas/quedas, devoluções e conferências de publicidade/base. Os grupos de relatório de Ads distinguem queima estimada, ausência de receita atribuída e espaço para escalar.
- Abrir grupo apresenta somente sua lista, com busca, ordenação, paginação de 50 itens, exportação, detalhes e Raio-X quando houver SKU. Voltar retorna o foco ao botão do grupo. Grupo vazio permanece selecionado.
- Altas/quedas sem comparação válida mostram pendência, com atalho para escolher a referência. Ausência de relatório por anúncio permanece pendente. No TikTok, a publicidade já incluída no líquido leva à conferência das cobranças por SKU, sem uma segunda estimativa de desconto.
- Ver este grupo em Anúncios aplica os mesmos IDs de origem à tabela e ao CSV. O recorte é identificado e pode ser limpo; trocar operação, ponto, datas, referência, sessão ou agrupar por SKU encerra o recorte. Os cards de Anúncios permanecem identificados como panorama da operação.
- A composição Pré-Ads → publicidade → Pós-Ads fica num resumo expansível no Diagnóstico. A composição completa permanece disponível; Anúncios e Panorama conservam sua apresentação.
- Devoluções usam movimentos classificados como `devolvida` no intervalo, agregando unidades por anúncio/SKU. Não se calcula uma taxa por safra de vendas a partir de períodos diferentes.
- As contagens das frentes representam grupos com itens, sem somar anúncios repetidos entre sinais e ações. A agenda não cria tarefas ou altera custos, metas, comissão, preços, investimento ou permissões.

## Validação

507 testes passaram, incluindo 10 regressões novas: frentes/grupos, vazio versus indisponível, sinais sobrepostos, publicidade ausente, publicidade já no líquido, critérios do relatório, devoluções, identidade exata no recorte, prioridade da perda Pós-Ads e preservação das listas de origem.

Frontend real em homologação local com respostas sintéticas: dois prejuízos de −R$ 19,72 e −R$ 9,51 somam −R$ 29,23; navegação mantém os dois IDs em Anúncios; grupo vazio não troca de seleção; retorno restaura o foco; comparação ativa apresenta R$ 500 → R$ 1.000 (+100%) no grupo Ganhando tração. Verificação responsiva a 390 px sem transbordamento horizontal da página. HTML integrado com scripts válidos e aplicação idempotente.

## Limites e próximo bloco

Este bloco recupera a navegação de Diagnóstico. Não reorganiza as colunas de Anúncios, não acrescenta evolução de posição na Curva ABC e não altera o modelo das tarefas publicadas. Esses ajustes seguem nos blocos posteriores. Novos rótulos como “novo trator” exigem critério próprio validado; não foram inventados nesta etapa.
