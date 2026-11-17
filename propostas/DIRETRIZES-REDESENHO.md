# Diretrizes do redesenho BsanControl · 17/11/2026

Requisitos definidos pelo usuário após comparar a prévia com a referência Shopeers. Este documento substitui a interpretação de que manter todas as telas dentro de um novo menu já conclui o redesenho. A cobertura funcional e a qualidade da nova composição devem ser avaliadas separadamente.

## Requisitos estabelecidos

| Tema | Decisão | Critério para validar |
|---|---|---|
| Tema | Claro é o padrão; escuro é uma escolha pessoal. | Primeiro acesso claro; escolha preservada ao voltar. |
| Cabeçalho | Busca à esquerda; tema e conta à direita; notificações serão acrescentadas quando implementadas. | Preferências, contexto operacional e ferramentas administrativas não competem com as ações pessoais no topo. |
| Menu | Lateral retrátil, com ícones e identificação das áreas; Preferências na base. | Recolher libera espaço sem impedir acesso às abas; rodapé acessível mesmo com rolagem da navegação; estado lembrado; no celular usa gaveta. |
| Páginas | Composição própria para cada objetivo, com leitura inicial curta e aprofundamento disponível. | Resultados e desvios relevantes aparecem antes de textos extensos e controles secundários. |
| Personalização | Usuário escolhe recursos, ordem, densidade e organização da sua leitura. | Preferências pertencem à pessoa e à página; outro usuário não herda essas escolhas. |
| Persistência | Salvar automaticamente e oferecer restauração do padrão por página. | Voltar à ferramenta não exige repetir os ajustes; falha de salvamento é informada. |
| Macro e micro | Manter ligação entre agregado e detalhe. | Grupo → ponto → empresa → operação → produto/SKU ou anúncio, preservando período e referência de comparação. |
| IA | Segunda etapa, apoiada em dados e contratos do BsanControl. | Feedback e sugestões possuem escopo, fonte, período, evidência e tratamento de autorização. |

## Linguagem visual e organização das páginas

- Superfícies claras, bordas discretas, sombras contidas e escala consistente de fonte, espaçamento e ícones. Reduzir a interface inteira não substitui compor melhor as páginas.
- A leitura inicial deve responder o que aconteceu, como está frente ao esperado e onde agir. A grade combina indicadores, evolução e prioridades, conforme a função da aba.
- Título e período não precisam ser repetidos em cada bloco. Ajuda detalhada, procedência técnica e composição extensa ficam acessíveis em contextos próprios.
- Biblioteca de widgets deve apresentar miniatura, nome, finalidade e estado selecionado em painel lateral. O catálogo visual será composto por recurso, evitando listas genéricas de caixas de seleção.
- Tabelas mantêm colunas e etapas relevantes da análise. Personalização não pode eliminar dados, alterar denominadores nem misturar linhas de anúncios com agregados por SKU. Ampliar continua disponível.
- Filtros da análise pertencem ao contexto da página e precisam indicar seleção e comparação com clareza. Busca global inicialmente navega páginas e ferramentas; não promete pesquisa de dados que não implementa.
- Cores de margem e TACOS conservam as réguas definidas. Queima e Sem giro continuam distintos. Fonte ausente não vira zero. Rótulos de estimativa, rateio e zero confirmado continuam interpretáveis.

## Preferências pessoais

Na integração oficial, persistir no servidor pelo identificador do usuário autenticado, com versão do esquema e restauração segura. Usar armazenamento local como apoio e adaptação ao dispositivo, sem prometer sincronização quando o servidor não foi integrado.

Preferências gerais: tema, menu expandido/recolhido e densidade. Preferências por página: widgets visíveis, ordem, tamanhos quando disponíveis e organização da tabela. Filtros e seleção de operações devem ter uma política explícita por tela, para impedir mudanças silenciosas de escopo entre páginas. Configuração pessoal não altera metas, regras financeiras ou permissões. Recursos indisponíveis ao perfil continuam indisponíveis.

A prévia usa armazenamento local por identidade simulada. A migração de preferências do protótipo anterior é compatível com a identidade correspondente. Preferências pessoais não são um mecanismo de autorização.

## Preparação para a segunda etapa de IA

Reutilizar modelos e consultas, sem depender de ler números formatados da interface. Os contratos deverão carregar identificadores de entidades, ponto/carteira autorizados, filtros e datas, atualização das fontes, comparativo escolhido e sinalização de estimativa/ausência/zero.

Separar observação do dado, hipótese explicativa, recomendação e ajuste executado. Permitir rastrear a recomendação até o indicador de origem, registrar a decisão humana e acompanhar seu efeito na operação. IA não modifica silenciosamente metas, custos, campanhas ou registros oficiais. Isso é preparação de arquitetura; não há assistente implementado nesta etapa.

## Carregamento

O redesenho deverá separar a leitura essencial dos recursos adicionais no ciclo de carregamento e medir resultados reais. Ocultar com CSS não comprova economia de processamento ou consulta. A prévia integral ainda conserva o ciclo dos renderizadores originais; não há ganho de desempenho declarado. Ver [CARREGAMENTO.md](CARREGAMENTO.md).

## Estado da implementação nesta revisão

**Implementado na prévia Studio v3:** composição dos 39 destinos nativos, indicadores essenciais antes do aprofundamento, grade configurável, explicações dos cards sob demanda, biblioteca lateral com miniaturas/finalidade/seleção, ordem por arraste ou setas, cinco larguras, colunas e densidade das tabelas, ampliação e retorno ao contexto anterior. Os dez fluxos de Produtos usam os formulários e o serviço originais em memória, com a mesma biblioteca visual. Metas preserva objetivos, orçamento, TACOS, dia selecionado e acumulado; Forecast conserva as lentes de operações e produtos.

A composição usa CSS e os elementos reais: a árvore funcional, IDs, eventos e cálculos nativos permanecem. A visibilidade pessoal usa atributos próprios, sem alterar o `hidden` que os renderizadores usam para mudar de seção ou proteger campos. Preferências são salvas por identidade e página neste navegador.

**Etapas posteriores à revisão visual:** integração e homologação com o servidor oficial, sincronização de preferências entre dispositivos, divisão de consultas/carregamento sob demanda e IA. Nenhum desses itens é apresentado como já implantado. O painel publicado não foi alterado.

Ver [VALIDACAO-STUDIO.md](VALIDACAO-STUDIO.md) para o escopo e a evidência desta revisão.

## Complemento aprovado para a prévia: identidade e captura

Identidade visual selecionável entre Bsan Shop e Jowcase, preservando as cores semânticas de margem/TACOS. Curva A verde, B âmbar e C vermelho, com texto acompanhando a cor. Tema claro permanece inicial. Período compacto com abertura de controles completos sob demanda.

Movimento progressivo, sem laço contínuo: 4,2 segundos, reprodução manual e opção de desligar. Respeitar movimento reduzido do dispositivo e conservar a geometria final e os valores das séries.

As fotografias diárias de Tarefas, Promoções e Ads seguem os recortes exemplificados pelo usuário: resumo geral, progresso por tipo e quadro dos gestores. Reutilizar o gerador e os modelos nativos. Não confundir preferência de widgets com escopo do relatório; usar responsável, operação, competência e carteira temporal do Acompanhamento. Copiar imagem e Baixar PNG são saídas igualmente disponíveis, sem envio automático ao grupo. Alinhamentos e Pendências têm captura correspondente ao recorte da tela. A prévia identifica expressamente os dados fictícios nas imagens.
