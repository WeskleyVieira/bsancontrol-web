# Cobertura da prévia integral · 17/11/2026

## O que foi migrado para a prévia

Todas as telas da navegação original receberam a nova estrutura lateral, contexto, densidade e apresentação. A revisão deixou de recriar indicadores em versões resumidas: executa o próprio HTML original e os módulos originais de Produtos. Análises condicionais continuam sendo abertas pelos filtros e detalhes originais. A classificação de um indicador e seus valores continuam sob responsabilidade do modelo original.

Fonte conferida: `T:/Meu Drive/Business Intelligence/Grupo Bsan/BsanControl.html`, SHA-256 `a1a4f12bd5faa2cc19053d178f5425a581ea6fae2005887ec4736666482ed5bd`. Essa cópia do HTML não foi incluída no Git. A comparação de código preserva **1.524 declarações de funções nomeadas**, incluindo internas, e todos os IDs estáticos. Não são 1.524 indicadores; a prova é de preservação do código, complementada pela navegação visual.

O adaptador troca os 20 conjuntos de dados embutidos por exemplos fictícios; fornece identidade local e inicialização de Produtos; permite aos formulários de gestão consultar o servidor temporário e desativa somente a verificação de hash financeiro contra dados que já foram substituídos. Não modifica o HTML publicado. O serviço de Produtos usa o código original com SQLite `:memory:`. As demais APIs são contratos locais demonstrativos, sem equivalência declarada com a homologação do backend oficial.

## Mapa conferido no navegador

As 39 rotas abaixo abriram com o título correspondente, sem mensagem de erro no painel. A evidência resumida está em [cobertura-integral.json](cobertura-integral.json). Os módulos indicados são as fontes da estrutura executada; o HTML gerado conserva também seus componentes legados e recursos comuns.

| Área | Aba | Rota na prévia | Fontes originais principais |
|---|---|---|---|
| Resultados | Visão Geral | `resultados/overview` | resultados, resumos, margens |
| Resultados | Diário | `resultados/diario` | resultados, placar, margens |
| Resultados | Marketplaces | `resultados/marketplaces` | resultados, resumos |
| Resultados | Curva ABC | `resultados/abc` | resultados, margens |
| Resultados | Forecast | `resultados/forecast` | resultados, forecast-produtos |
| Vendas | Vendas | `vendas/vendas` | vendas |
| Vendas | Raio-X | `vendas/raiox` | vendas, vendas-raiox, margens-ui |
| Gerencial | Panorama | `gerencial/panorama` | gerencial, resumos, margens-ui |
| Gerencial | Vendas da operação | `gerencial/ger-vendas` | gerencial, vendas |
| Gerencial | Diagnóstico | `gerencial/diag` | gerencial, diagnóstico |
| Gerencial | Anúncios | `gerencial/produtos` | gerencial, margens-ui |
| Gerencial | Forecast | `gerencial/previsao` | forecast-anuncios |
| Gerencial | Publicidade | `gerencial/ads` | gerencial, publicidade |
| Gerencial | Metas | `gerencial/metas` | metas, metas-publicidade |
| Gerencial | Full | `gerencial/full` | gerencial, Full |
| Operação | Envios | `operacao/envios` | operacao |
| Operação | Estoque | `operacao/estoque` | operacao |
| Operação | Projeção | `operacao/projecao` | operacao |
| Produtos | Catálogo | `cadastro-produtos/cadastro-catalog` | app, costing-ui, effective-ui |
| Produtos | Pendências de custo | `cadastro-produtos/cadastro-tasks` | app, costing-ui |
| Produtos | Entradas de compra | `cadastro-produtos/cadastro-entries` | app, costing-ui |
| Produtos | Materiais | `cadastro-produtos/cadastro-materials` | app, packaging-ui |
| Produtos | Embalagens | `cadastro-produtos/cadastro-pack` | packaging-ui |
| Produtos | Preparação de embalagens | `cadastro-produtos/cadastro-prep` | operational-packaging-ui |
| Produtos | Homologação | `cadastro-produtos/cadastro-review` | review-ui |
| Produtos | Apuração de custos | `cadastro-produtos/cadastro-sales` | sales-ui |
| Produtos | Atualização | `cadastro-produtos/cadastro-sync` | app |
| Produtos | Integração | `cadastro-produtos/cadastro-publication` | publication-ui |
| Pós-venda | Atendimentos | `pos-venda/pv-fila` | pos-venda |
| Acompanhamento | Tarefas | `acompanhamento/tarefas` | acompanhamento, acompanhamento-fluxos |
| Acompanhamento | Promoções | `acompanhamento/promos` | acompanhamento, acompanhamento-fluxos |
| Acompanhamento | Ads | `acompanhamento/ac-ads` | acompanhamento, acompanhamento-fluxos |
| Acompanhamento | Alinhamentos | `acompanhamento/alinhamentos` | alinhamentos |
| Acompanhamento | Pendências | `acompanhamento/pendencias` | pendencias |
| Financeiro | DRE | `financeiro/dre` | financeiro, financeiro-leitura |
| Financeiro | Comissão | `financeiro/comissao` | comissão original, financeiro-leitura |
| Financeiro | Fechamento | `financeiro/gestao-fechamento` | gestão original |
| Financeiro | Custos | `financeiro/gestao-custos` | gestão original |
| Financeiro | Carteiras | `financeiro/gestao-carteiras` | gestão original |

O item “Anúncios · em breve” do Acompanhamento não é uma tela funcional na fonte e permanece desabilitado. As visões internas de Tarefas, carteiras, casos, referências econômicas, imagem para o grupo, detalhes de anúncios e demais diálogos continuam nos componentes originais; não foram contadas como novas abas para inflar o inventário.

## Percursos adicionais conferidos

- Metas: seleção de faturamento, TACOS e gastos com publicidade; leitura diária e acumulada; dia selecionado, posição do mês e gráfico de acompanhamento.
- Anúncios: tabela completa, ranking no `#`, variação frente à referência, SKU e ID copiáveis; abertura do Raio-X do mesmo produto em outras operações e gráfico de unidades/margem.
- Personalização: retirar um bloco, sair e voltar à aba e restaurá-lo pela biblioteca. Foi corrigida a atribuição de IDs quando o renderizador original recria seus elementos.
- Ampliação: mover a tabela original para o diálogo, ativar tela cheia e devolver à origem; repetir com o gráfico do Panorama, conservando sua instância Chart.
- Produtos: dez destinos distintos; Materiais, Embalagens e Preparação com registros fictícios; abertura do formulário e histórico de material. As linhas de registros não são tratadas como widgets removíveis.
- Perfis simulados de Direção, Coordenação e Gestor: abertura da navegação e contexto. Não substitui testes de autorização de usuários reais.
- Apresentação móvel: menu lateral, contexto e módulo de Produtos em 390 × 844, sem transbordamento horizontal da página nessa conferência. Tabelas extensas conservam rolagem dentro do próprio quadro.

## Testes e limites da conclusão

Comando: `node --test propostas/integral.test.cjs propostas/workspace.test.cjs`. Passaram seis testes da revisão integral e nove de regressão do protótipo histórico. A revisão integral verifica preservação das funções e IDs, compilação dos scripts transformados, substituição dos conjuntos de dados, contratos financeiros das amostras, apresentação dos gráficos sem alterar valores/escalas/callbacks e servidor isolado com serviço real de Produtos em memória. Fechar e reabrir uma competência de demonstração também foi verificado no adaptador local.

Essa evidência confirma a estrutura completa disponível para revisão visual. Não certifica cada combinação de filtros, cada regra de negócio, importação de arquivos reais, autorização oficial, integrações externas, pagamentos ou toda a jornada operacional em produção. As ações dependentes desses serviços mantêm seus controles originais, mas operam sobre contratos e registros temporários de demonstração.

A personalização desta versão não comprova economia de consultas ou processamento. A implantação e a otimização do carregamento dependem da aprovação visual e da integração descrita em [CARREGAMENTO.md](CARREGAMENTO.md).
