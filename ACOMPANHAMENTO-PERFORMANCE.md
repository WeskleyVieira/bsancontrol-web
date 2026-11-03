# Acompanhamento — correção do carregamento lento

03/11/2026.

A abertura das tarefas aguardava também a agregação econômica de vendas de todos os anúncios acompanhados. A fila permanecia em consulta, dando a impressão de que as tarefas não existiam. O custo foi introduzido no enriquecimento econômico da fase 4 e não apareceu nos testes funcionais com a base fictícia pequena.

## Correção

- A interface solicita a fila com `GET /api/demandas?leitura=fila`: registros, etapas, conferências e fontes de Promoções/Ads continuam presentes, sem consultar vendas para calcular margem mensal.
- A margem mensal é solicitada ao abrir **Referências econômicas** ou usar **Consultar margem mensal** no detalhe. A consulta não bloqueia a navegação das tarefas nem da agenda. Enquanto aguarda, a visão informa o andamento e não apresenta valores zero.
- O complemento `GET /api/demandas?complemento=economia` retorna apenas ID e leitura econômica das demandas autorizadas. Preserva o recorte por gestor; ID e competência adicionais usam parâmetros. Não consulta novamente históricos, preço ou diagnóstico de Promoções.
- Solicitações simultâneas da mesma leitura são compartilhadas. A resposta é reutilizada na carga atual da fila. Atualizar a fila cancela/invalida a leitura anterior; resposta antiga ou de outra sessão não substitui a leitura atual. Falha econômica permite nova tentativa e mantém as tarefas disponíveis.
- A agregação substitui a longa lista de condições alternativas por uma tabela de vínculos parametrizados. Postgres usa lotes de até mil vínculos; SQLite conserva os lotes menores. Identidade de ponto/empresa/canal/anúncio/competência, normalização do anúncio, valores numéricos, zero, ausência, status de venda e deduplicação permanecem.
- A chamada sem parâmetros de `/api/demandas` conserva a resposta econômica completa, para compatibilidade com consumidores existentes.

## Medições

Consultas somente de leitura, contra o banco real, com 669 demandas:

| Medição | Tempo observado |
|---|---:|
| Carregamento anterior, incluindo economia | 74,82 s |
| Consulta básica na medição nova | 0,99 s |
| Complementos da fila sem economia | 0,84 s |
| Base + complementos necessários para a fila | aproximadamente 1,83 s |
| Chamada completa compatível, incluindo economia otimizada | 19,37 s |

Esses valores medem consultas e enriquecimento pelo processo de verificação, sem incluir inicialização do serviço Render, transferência da página inteira ou renderização no computador do usuário. A leitura econômica ainda pode demorar mais que a fila; ela passa a ser independente e sob demanda.

## Verificação

- **290 testes automatizados aprovados**, com contratos novos de carregamento sob demanda, chamadas concorrentes, cancelamento/invalidação, falha e repetição, lotes e escopo do complemento econômico.
- Comparação das duas agregações em uma única consulta/snapshot do banco: **129 grupos e nenhuma divergência**, incluindo todos os campos agregados desse recorte. Os valores comerciais não foram exportados para o repositório.
- Edge com dados e usuários fictícios: leitura econômica deliberadamente retida enquanto tarefas e agenda continuam utilizáveis; reutilização, atualização, erro e recuperação; detalhe sob demanda; escopo do Gestor. A abertura fictícia foi observada em 162 ms, sem tratar isso como previsão do tempo em produção.
- Regressão de Direção/Coordenação/Gestor, matriz e cobrança, contexto e navegação, Promoções/Ads, continuidade, economia, exportações, imagens, tema claro e celular, sem erros JavaScript.
- Nenhuma alteração de esquema, permissões, dados comerciais, coletores ou regras de prazo/medição. As cópias particulares e o build incluem os novos módulos.

Após a publicação, atualizar a página para carregar a versão otimizada. O botão **Atualizar fila** também renova a leitura econômica quando ela voltar a ser solicitada.
