# Homologação integrada — 09/11/2026

## Resultado e alcance

Homologação técnica aprovada com ressalvas de dados. Percursos reais no site publicado com Diretor Teste, Coordenador Teste e Gestor Teste (carteira Marcos), sem gravar ações, custos ou atendimentos oficiais. Os formulários foram abertos e cancelados. As gravações e recusas da API foram testadas em bancos SQLite novos, com dados e seis usuários fictícios.

Isto não substitui o aceite operacional da equipe, a conferência física dos produtos/embalagens, a aprovação dos custos ou a conciliação financeira. É uma amostragem dos fluxos críticos; não é certificação de cada lançamento de todos os meses.

Base do ensaio: `c24c307`. Não houve migração, concessão de acesso, reset de senha, alteração de campanhas/metas/comissões, publicação de custos ou reprocessamento histórico.

## Percursos em produção

| Perfil | Verificação | Resultado observado |
|---|---|---|
| Direção | Diagnóstico → grupo Margem sangrando → Anúncios → Análise do produto → tratativas | Dois itens e perda total de R$ 29,23 preservados. Cortador: Pré-Ads R$ 4,35, publicidade R$ 13,86, Pós-Ads −R$ 9,51. Tratativa existente encontrada sem criar outra. |
| Direção | Raio-X em diálogo | Abre no contexto, mantém SKU/período, mostra volume, faturamento e margens. Comparação macro autorizada disponível; ausência de venda do SKU nas demais operações identificada, sem preencher com zero. |
| Direção | Produtos: Bsan → Powerfull | Iframe online carregou e trocou o ponto corretamente. Bsan: 9.857 cadastros; Powerfull: 2.715. Empresa/marketplace não são usados como catálogo físico. |
| Direção | Pós-venda | 1.115 registros históricos carregados, todos A conferir; nenhum atendimento ativo confirmado. Não interpretar isso como inexistência de pendências dos clientes. |
| Direção | Acompanhamento e imagem para o grupo | Seleção Powerfull: 11 demandas ativas, 1 registrada, 10 atrasadas. Prévia gerada em 2.800 × 2.600 com cartões da seleção; nenhum envio automático. |
| Direção | DRE | Mês como consulta padrão, intervalo de competências disponível. Estrutura/fontes pendentes mantêm o resultado parcial. |
| Coordenação | Mesa de cobrança → todos os retornos → abrir retorno → registrar nova ação | Compromisso de 20/11, ação anterior, demanda e formulário coerentes. Formulário cancelado sem gravação. Navegação oferece Comissão, sem DRE/administração. |
| Gestor | Carteira, Anúncios e agrupamento SKU | Gerencial oferece Powerfull Imports/ML e Shopee. Na amostra ML: 74 anúncios, 70 SKUs; SKU com 3 anúncios agregado sem ID arbitrário. Ranking: 20 subidas, 17 quedas e 4 posições mantidas, com referência explícita. TACOS nas essenciais. |
| Gestor | Vendas da operação: essenciais e todas as colunas | ID do anúncio copiável, SKU, pedido e envio presentes. Abertura de tarifa, frete, receita de envio e líquido populada onde há fonte; células vazias preservam as colunas. |
| Gestor | Acompanhamento próprio e Queima | Carteira Marcos com 6 demandas. Grupo Queima abre 3 demandas próprias e instrução específica, separado de sem giro. Formulário abre e foi cancelado. |
| Direção | Magazine Luiza, novembro, 01–06/11 | Faturamento R$ 977,83, 8 unidades, Pré-Ads R$ 299,77. Publicidade/TACOS/Pós-Ads pendentes por falta de fonte, sem concluir gasto zero. |

Não foi encontrado bloqueio funcional nos percursos concluídos. O período efetivamente consultado foi 01–06/11; a data de consulta/carga não prova atualização de vendas até 09/11.

## API real em base isolada

Novo `tests/homologacao-http.test.js` inicia `api.js` com autenticação, sem configuração/conexão de produção e com banco temporário fictício. Confere:

- Login real de direção, coordenação, gestor, estoque, compradora e pós-venda; consulta anônima negada.
- Gestor recebe sua fila e não registra ação em demanda de outra carteira.
- Registro válido e data de retorno persistem exclusivamente na demanda fictícia permitida.
- DRE e administração negadas a gestor/coordenação; administração permitida à direção.
- Estoque, compradora e pós-venda não recebem vendas, detalhe, margem, publicidade, exportação ou tarefas gerenciais.
- Carteira gerencial e comparação macro autorizada conservam escopos distintos e cálculo Pós-Ads coerente.
- Restrição administrativa nova bloqueia a ação imediatamente e não bloqueia outra sessão autorizada.

Suíte completa: **596 testes passaram, zero falhas, zero ignorados**. A abertura dos formulários em produção e a gravação HTTP isolada foram verificações distintas; não houve teste de gravação oficial de ponta a ponta.

## Correção pequena encontrada durante o ensaio

Na Publicidade sem relatório, o resumo da tabela mostrava R$ 0,00 e o automatismo de links transformava a mensagem “Nenhum item…” em busca no marketplace. Ajustado para investimento sem valor quando a lista está vazia e para ignorar células de aviso que abrangem várias colunas. Não muda apuração ou cobertura dos indicadores.

A exportação de imagem gerou a prévia, mas o componente externo registrou avisos ao acessar a folha de fontes do Google por restrição de origem. Ressalva técnica não bloqueante: a imagem foi renderizada; isso não foi descrito como console sem erros. Não se alterou CORS nem a política de segurança para silenciar o aviso.

## Pendências operacionais reais

- **Produtos:** validar logística, códigos e composições com o estoque e custos com os aprovadores. Na leitura Bsan, 9.351 cadastros sem NCM, 4.712 sem custo e 78 custos para revisão; Powerfull, 1.762 sem NCM, 1.270 sem custo e 800 para revisão. São sinais da carga atual, não autorização para preenchimento automático ou ativação de custos no Pipeline.
- **Pós-venda:** classificar os 1.115 históricos A conferir, identificando operação, situação, responsável e próximo prazo. A fila não pode ser considerada saneada só porque a página carregou.
- **Magalu:** fornecer o relatório de publicidade de novembro ou confirmar expressamente um intervalo realmente sem gasto. Não presumir que o zero confirmado de outubro vale em novembro.
- **Aceite humano:** direção/coordenação/gestores e estoque precisam experimentar os fluxos com suas rotinas. Não foi feita uma auditoria visual exaustiva de todos os tamanhos de tela nem conciliação de cada venda histórica.

## Magalu: o que está faltando e como regularizar

Operação: **Jowcase · Magazine Luiza** (`magalu_jowcase`). Vendas são coletadas pela API, mas a implementação atual de Ads lê **arquivos CSV exportados do Magalu Ads** em `modulos/ads.js:260`; não existe uma etapa de coleta Magalu Ads por API no atualizador examinado.

Entrada da competência de novembro:

`T:\Meu Drive\Business Intelligence\Grupo Bsan\1 - Gestão de Dados\Downloads\Magazine Luiza\Magazine Luiza - Jowcase\2026-11\`

| Exportação esperada | O que habilita |
|---|---|
| `report-CAMPAIGNS_TOTAL-*.csv` | Investimento/resultado mensal por campanha. Usar **Consumo**, gasto efetivo; não saldo, recarga ou orçamento. |
| `report-CAMPAIGNS_DAILY-*.csv` | Gasto e receita atribuída por data para acompanhamento diário e acumulado. |
| `report-PRODUCTS_DAILY-*.csv` | Abertura por SKU e dia, necessária para análise de publicidade do produto com vínculo direto. Também é alternativa para série diária se faltar o DAILY de campanhas. |

Preferir os três relatórios da mesma conta e do mesmo recorte: 01/11 até o último dia disponível; quando o mês terminar, exportar o mês completo. Não somar TOTAL + DAILY + PRODUCTS como três despesas: são aberturas do mesmo gasto.

Foram encontrados arquivos de julho e agosto, nenhum de novembro, na pasta da operação. No banco consultado, `ads`, `adsCamp` e `adsDia` também não contêm Magalu em novembro. Outubro permanece sem gasto por declaração específica já confirmada pelo usuário. Histórico de publicidade existe em julho/agosto.

Depois de obter os CSVs: conferir conta, datas internas e competência; comparar Consumo total com a soma diária e a abertura por produto, explicando eventuais diferenças de atribuição; preparar a carga de Ads somente da competência; conferir Pré-Ads − publicidade = Pós-Ads e publicidade ÷ faturamento = TACOS no mesmo recorte; então publicar a carga validada. Não foi executada carga financeira nesta homologação.

Somente o TOTAL já ajuda a leitura mensal, mas não comprova gasto diário nem vínculo exato ao SKU. Não criar uma curva diária fictícia a partir do total. Não executar o atualizador completo apenas para importar esses CSVs, pois ele contém outras etapas operacionais.

Evidências locais sem credenciais: pasta `homologacao-20261109` em `C:\Users\weskl\.codex\visualizations\2026\10\23\01a16af3-f9ea-7910-b412-0f2974475d0c`. Logs da suíte em `C:\Users\weskl\.codex\.tmp\homologacao-20261109\testes-finais.log`.
