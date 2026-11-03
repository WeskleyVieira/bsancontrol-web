# Acompanhamento — restauração gerencial

03/11/2026 · Fase 1: níveis de gestão e contexto da carteira.

A apresentação anterior reunia Direção, Coordenação e Gestor em uma fila semelhante. Selecionar responsável ou operação na lista não recalculava os cartões. Esta entrega recupera os instrumentos de gestão sobre os contratos atuais de leitura, registro, histórico e medição.

## Comportamento entregue

- **Direção:** matriz tipo × gestor, execução registrada, registro no prazo e resultados separados; abertura da carteira por célula.
- **Coordenação:** cobrança por responsável, atrasos, vencimentos em 24h, revisões, atraso mais antigo, demanda prioritária e cópia da cobrança.
- **Gestor:** carteira → operações → tarefas, com retorno à visão anterior preservando o contexto.
- Responsável, operação e tipo formam o contexto dos cartões, quadros, comparações e exportações da carteira. Cabeçalho e permissões continuam delimitando esse universo.
- Busca e situação são filtros explícitos apenas da lista. Os contadores de Tarefas, Promoções e Ads respeitam responsável e operação; o filtro de tipo pertence à seção aberta.
- Seleção sem demandas permanece vazia; não há ampliação silenciosa do contexto.
- Atalhos de prazo e resultado abrem o conjunto contado. Uma resolução medida pode coexistir com revisão posterior, sem apagar nenhum desses fatos.
- Imagem inclui os quadros gerenciais da seleção. Na fila, a imagem identifica o limite de dez demandas; o CSV conserva a lista completa.
- Matriz e cobrança ficam logo após os cartões. Detalhes gerais de alertas e critérios permanecem expansíveis.

## Validação

- 223 testes automatizados aprovados, incluindo 26 de Acompanhamento.
- Edge com contas e dados fictícios: três níveis, Tarefas/Promoções/Ads, entrada pelo Gerencial com SKU/operação, filtros, recorte vazio por ponto, retorno de navegação, cobrança, CSV, comparação sem referência, geração de imagem, tema claro/celular, consulta vazia, erro e recuperação.
- Perfil Gestor sem seletor de outra carteira; consulta ao histórico de outra pessoa rejeitada no servidor.
- Nenhuma alteração de esquema, demanda, registro, coleta ou execução em marketplace faz parte da entrega.

## Continuação do plano

1. Concluído neste bloco: restauração dos níveis gerenciais e correção do contexto.
2. Próximo: organizar visualmente as etapas de execução, retorno, conferência, medição e conclusão; revisar prazos por domínio.
3. Depois: enriquecer Promoções e Ads com orientações, campanhas e evidências próximas da tarefa.
4. Depois: continuidade entre competências e revisão das medidas econômicas/comparação.
5. Encerramento: homologação operacional do conjunto e liberação das etapas restantes.

Os motores atuais de conferência e medição permanecem. Registro não comprova aplicação no marketplace; conferência não equivale a resolução financeira.
