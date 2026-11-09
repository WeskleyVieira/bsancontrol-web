# Forecast macro de produtos e ampliação dos gráficos

Resultados → Forecast passa a oferecer **Operações** (cenário macro existente) e **Produtos (SKU)**. A nova lente reúne as vendas do mesmo código de SKU entre as operações selecionadas antes de calcular seu ritmo e a projeção. Códigos diferentes não são unidos pelo título, e SKU não é convertido em ID de anúncio.

## Uso

- Ponto, empresa, marketplace e intervalo de vendas seguem o cabeçalho.
- “Operações na soma” permite combinar contas dentro desse escopo, inclusive selecionar nenhuma sem retornar silenciosamente a todas.
- Indicadores: faturamento ou unidades; projeção até o fim do mês do corte, próximos 7 ou 30 dias.
- Cards: realizado, esperado até a data, projeção com faixa manual, distância dos comparáveis, volume/faturamento complementar e margem Pós-Ads realizada.
- Filtros por situação e busca; cards de produto; acompanhamento diário/acumulado; exportação da seleção.
- “Acompanhar projeção” abre o SKU com realizado, esperado, necessidade diária, método e participação de cada operação, incluindo sua margem realizada quando disponível.
- O esperado usa, por padrão, o mesmo recorte do mês anterior, alinhado ao corte do realizado. É possível usar o mês anterior completo, intervalo imediatamente anterior ou comparação personalizada do cabeçalho.

## Regras preservadas

O corte é comum à seleção e não inclui o dia atual como encerrado. Data de último registro não certifica coleta completa. Itens sem referência permanecem nos totais, mas não recebem uma meta zero nem melhoram artificialmente o comparativo. Os cards de distância e o gráfico comparativo usam os mesmos itens com referência. Produtos que só venderam na referência continuam disponíveis para análise.

A média diária é a base inicial. A seleção automática de método compara erros em três cortes históricos quando há dados suficientes. A faixa manual não é intervalo de confiança. Não se extrapola lucro; Pós-Ads/TACOS preservam a apuração e o rateio existentes. Ruptura, promoções e mudança de Ads não são previstas automaticamente. A projeção do SKU agregado pode diferir da soma das projeções separadas por ID, pois o método é aplicado após consolidar o SKU.

## API e desempenho

`GET /api/resultados/forecast-produtos` agrega por dia, ponto, empresa, marketplace e SKU, somente vendas finalizadas do intervalo atual e da referência. Não carrega a tabela completa de vendas no navegador. Limita a janela atual a 180 dias, a referência a 366 dias e o retorno a 100 mil grupos; solicita um recorte menor acima disso. Cache de 60 segundos por sessão/escopo/referência, cancelamento e proteção contra respostas antigas. Busca e seleção local não geram uma chamada por produto.

O endpoint exige `vendas.ver` e somente GET, seguindo a permissão macro já existente. Estoque, compradora e pós-venda continuam sem acesso a essa consulta. Nenhuma migração, mudança de permissões, escrita de custos/metas/campanhas ou modificação de dados comerciais.

Para o detalhamento de margem, `porPonto=1` preserva a dimensão ponto no agrupamento dos produtos; o comportamento padrão das demais telas permanece igual. A alocação mensal de publicidade continua anterior aos filtros de ponto/SKU.

## Ampliar e Tela cheia

O visualizador geral e os visualizadores próprios de Metas e Comissão usavam `requestFullscreen()` em um `dialog`, elemento vedado pelo padrão [Fullscreen](https://fullscreen.spec.whatwg.org/#dom-element-requestfullscreen). O novo controlador solicita fullscreen ao documento e mantém uma alternativa por CSS quando o navegador não oferece ou bloqueia a API. O botão restaura o tamanho, sincroniza a saída nativa e libera o estado ao fechar, inclusive durante uma solicitação pendente; não encerra uma tela cheia externa já ativa.

Gráficos em pop-ups de produto/Raio-X também recebem Ampliar. Os visualizadores próprios de Metas/Comissão continuam com seus controles, evitando duplicidade. O gráfico retorna à origem com o fechamento e a navegação/foco é preservada.

## Validação

- Suíte completa: 639 testes, incluindo homologação HTTP com seis perfis, validação do endpoint, filtros, identidade exata de SKU, referência, cortes, receita/unidades e composição por ponto.
- Testes do controlador: suporte nativo, navegador sem suporte, rejeição, restauração, saída nativa, tela cheia externa e fechamento durante pedido pendente.
- Integração HTML idempotente e compilação de todos os scripts.
- Homologação visual em base fictícia: SKU-A soma R$ 540 + R$ 720 = R$ 1.260; ao retirar a segunda operação, passa a R$ 540. Projeção, esperado, gráfico e margem acompanham a seleção. Faturamento/unidades, horizonte, ponto, pop-up, gráfico diário/acumulado, ampliar e restauração conferidos.
- Layout responsivo conferido a 390 × 844, sem transbordamento horizontal do conteúdo.

As capturas e o registro da conferência final de publicação ficam no diretório local de evidências da execução. A precisão futura depende da qualidade e da continuidade das fontes, não apenas dos testes de software.
