# Vendas e Raio-X — recuperação do fluxo no design atual

Entrega de 04/11/2026, base ddc043f. Continuação autorizada enquanto o usuário experimenta o Gerencial. Referência funcional: código anterior de `renderVendas` e `renderRaioX` preservado no HTML e histórico anterior à auditoria cabbb1e. O padrão visual continua sendo o tema atual do BsanControl.

## O que voltou e o que foi corrigido

| Área | Situação encontrada | Resultado |
|---|---|---|
| Vendas | Cards de situação neutralizados; título e CTP escondidos na visão essencial. | Cards com cores de situação, título e CTP essenciais, seis indicadores com pedidos identificados e ticket. Em telas largas, indicadores em uma linha; demais larguras mantêm leitura adaptada. |
| Margens e pendências | Leitura de margem negativa pouco acionável e apoio sempre exibido mesmo zerado. | Negativos destacados; atalho para as finalizadas negativas. Apoio de margem negativa/provisoriedade aparece quando há ocorrência ou origem ausente. Métodos continuam disponíveis. |
| Exportação | No online, o botão exportava apenas as 50 linhas da página. | Exportar página e Exportar filtro separados. O filtro completo respeita ponto, conta, canal, busca, status, margem negativa, SKU exato e ordenação. Há cancelamento e mensagem de conclusão/erro. |
| Detalhe | Fundo do diálogo dependia de um token inexistente; aprofundamento completo pouco acessível. | Fundo opaco no tema atual, abertura do Raio-X completo e preservação do pop-up do Gerencial para a carteira autorizada. |
| Raio-X | Preço/custo perderam cards próprios; operações viraram tabela e alertas foram substituídos por texto técnico. | Seis cards, leitura do produto, gráfico diário/mensal configurável, resumo mensal em barras e cards de volume/margem por operação. |
| Consulta do SKU | Dependia de baixar todas as vendas do período em `DETALHE`. | Consulta agregada somente do SKU e busca de até 20 sugestões por SKU/nome. O Raio-X principal online deixa de solicitar `DETALHE`; Gerencial mantém seu carregamento existente. |
| Navegação | Aprofundar mudava a tela sem preservar toda a análise. | Voltar às vendas restaura filtros, página, ordem e datas. Operação no Raio-X abre vendas do SKU exato, com indicação removível e retorno à análise. |
| Falhas e mudanças | Página fora do intervalo podia aparentar ausência de vendas; sugestões podiam interromper uma consulta explícita. | Página inválida retorna à primeira página válida. Consulta explícita cancela sugestões pendentes. Resposta atrasada não substitui outro SKU; falhas retiram valores antigos e permitem nova tentativa. |

## Definições e acessos

Vendas e Vendas da operação conservam a margem com teto. Pedidos são identificadores distintos por empresa/canal/pedido nas finalizadas; ticket utiliza somente receita de linhas identificadas. A ausência de ID é declarada. Nem quantidade de linhas nem quantidade de unidades substitui pedidos.

O Raio-X principal permite escolher margem real disponível ou margem com teto. Falta de margem real usa a margem de origem com aviso; custo médio indisponível não vira custo zero confirmado. Os valores são os registrados nas vendas, sem afirmar que sejam o custo atual da Precifique ou uma fotografia histórica certificada. A base percentual continua sendo líquido na Temu e receita nos demais canais.

A evolução compara somente dois meses consecutivos inteiros contidos na seleção e com registros na fonte. Não se compara automaticamente mês parcial a mês inteiro, nem se declara estabilidade pela ausência de alertas. Devoluções são movimentações do intervalo; não se reinstala uma taxa de qualidade por coorte sem o vínculo necessário.

A leitura principal e a exportação continuam no alcance macro já autorizado por `vendas.ver`, inclusive ao gestor. O pop-up de Gerencial continua exigindo Gestão e restringindo o gestor à carteira no servidor. Estoque, Compradora e Pós-venda não recebem estas novas rotas de vendas. Nenhuma concessão, fechamento, custo cadastral, regra de bônus ou demanda foi alterada.

## Implementação

- `vendas-raiox.js`: catálogo e agregados diários por SKU/operação/situação, com as duas margens e presença de custo/margem real. Pedidos identificados apurados separadamente com a mesma seleção.
- `visual/vendas-raiox.js`: Raio-X principal, leitura local equivalente no modo arquivo, catálogo, controles e navegação de retorno. Cache curto por sessão/filtros/geração, cancelamento e guarda contra respostas antigas.
- `vendas-pagina.js` e `vendas-indicadores.js`: SKU exato, pedidos/ticket, CTP ausente e modelo compartilhado para resumo/CSV/agregados.
- `vendas-exportacao.js`: CSV por lotes de 1.000. Postgres usa cursor em transação somente de leitura com snapshot repetível; SQLite abre conexão separada somente de leitura. O servidor não concentra toda a base na memória. Desconexão, erro e cancelamento interrompem o fluxo; exportação incompleta não é apresentada como arquivo concluído. Prazo total de três minutos e limite de 30 segundos por consulta Postgres.
- Campos e cabeçalhos financeiros do CSV preservados, com centavos, negativos numéricos e fórmula em texto neutralizada. Ausência de base percentual fica vazia. Os 50 registros da página e o filtro integral têm botões e arquivos distintos.

O integrador inclui o novo módulo após `vendas.js`. O Pipeline deve copiar os dois novos arquivos de backend e o módulo visual, além das fontes atualizadas. As fontes privadas e seus embeds recebem as alterações com backup e guardas; bases comerciais não são publicadas.

## Validação

**325 testes aprovados**, incluindo 13 novos casos de SQL, catálogo literal, ponto/conta/canal/período, SKU exato, real/teto, Temu, origem ausente, pedidos, CSV, cursor, cancelamento e acesso. O teste de exportação com 1.200 linhas inclui alteração concorrente e confirma que o snapshot não incorpora a nova linha no meio do arquivo.

No navegador, com banco fictício isolado: título/CTP essenciais, cards, paginação, filtro integral de 142 linhas contra página de 50, detalhe, Raio-X completo, volta à busca/ordem/página, margens e gráficos configuráveis, SKU exato, catálogo por nome, temas claro/escuro e 390 px. A passagem Vendas → Raio-X não solicitou `DETALHE`.

Cenários adicionais: erro em Vendas e no SKU, exportação bloqueada durante falha, repetição, cancelamento sem download parcial, resposta atrasada, página fora do intervalo e modo arquivo. Regressão das sete sub-abas do Gerencial e de seu pop-up também passou. Sem erros JavaScript nos fluxos conferidos.

Contrato confirmado no PostgreSQL real apenas em leitura: catálogo, agregados do SKU, resumo, pedidos e exportação com cursor. Medição pontual encadeada: 405 ms para o recorte de um dia/uma operação usado na conferência; não é garantia para qualquer intervalo ou conexão. Nenhum dado comercial foi exportado no relatório de validação.

Aceitação operacional e conciliação financeira das plataformas continuam dependendo do uso e conferência da equipe. Esta entrega recupera o fluxo e seus recursos sem reprocessar as fontes comerciais.
