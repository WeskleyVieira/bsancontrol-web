# Anúncios — posição compacta, visão por SKU e cores

Correção sobre 4dd35d1, em 08/11/2026.

- Primeira coluna # mostra somente a posição por faturamento no universo da operação, calculada antes dos filtros e independente da Curva ABC. Empates mantêm posições iguais. Na visão sem vendas atuais o número se refere à referência.
- Movimento junto ao título: ↑ verde, ↓ vermelho, = azul. Tooltip e nome acessível informam posição anterior → atual e quantidade de posições. Ausência de referência não vira estabilidade; sem comparação ativa não há seta.
- SKU: uma linha soma as vendas dos anúncios do mesmo SKU na operação/período. Identidade copiável é o SKU, sem MLB principal ou link do título para um anúncio arbitrário. Quantidade de anúncios na linha e lista de IDs copiáveis no detalhamento preservam a origem. Por anúncio continuam ID e SKUs vinculados. CSV por SKU deixa ID individual vazio e lista IDs componentes em campo próprio.
- Cores dos valores de margem na tabela e análise: <10% vermelho; ≥10% e <20% âmbar; ≥20% verde. Perda monetária continua vermelha e informação ausente é neutra. Sem mudança de fórmulas, fontes financeiras ou classificações de trabalho.
- Botões Detalhar e Raio-X permanecem na identificação do produto; ordenação pela coluna # é acessível. Estilos mantêm largura compacta também em telas pequenas.

Validação: testes existentes de identidade, composição financeira, ranking e cores; frontend real em homologação sintética, com comparação de alta/queda/estabilidade e dois anúncios consolidados em um SKU (9 unidades, faturamento R$ 312,32, publicidade R$ 13,86 e Pós-Ads R$ 30,49). Sem gravação de tarefas ou alteração de dados oficiais. Reversão: reverter este commit de apresentação e regenerar o HTML.
