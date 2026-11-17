# Prévia integral do BsanControl · 17/11/2026

**Redesenho em andamento:** os requisitos de experiência estão em [DIRETRIZES-REDESENHO.md](DIRETRIZES-REDESENHO.md). A cobertura funcional abaixo não significa que a composição de todas as páginas tenha sido redesenhada. Nesta revisão, o cabeçalho ganhou busca e ações compactas; o menu lateral é retrátil; tema e preferências são lembrados por identidade. Mapa, escala e perfil simulado ficam em **Preferências e ferramentas**.

A versão atual aplica a nova navegação e apresentação à **estrutura original inteira**, em vez de substituir telas por composições demonstrativas. Usa o catálogo de navegação nativo: oito áreas e 39 destinos funcionais. O item original “Anúncios · em breve” de Acompanhamento continua desabilitado.

O HTML original é lido em memória de `T:/Meu Drive/Business Intelligence/Grupo Bsan/BsanControl.html`. Os conjuntos de dados são substituídos por exemplos fictícios. Renderizadores, modelos de negócio, filtros, tabelas, gráficos, detalhes e formulários continuam sendo os originais. Os módulos web e o serviço de Produtos também são os originais, com banco SQLite exclusivamente em memória.

**Abrir:** `http://127.0.0.1:59833/?revisao=integral#gerencial/panorama`. O botão **Mapa** reúne toda a estrutura. O menu lateral expande as abas da área ativa. **Todos os recursos** mostra os blocos da leitura; **Essencial** e **Personalizar** permitem escolher a apresentação, com preferências por aba e perfil neste navegador. Algumas análises aparecem depois de selecionar um produto, um filtro ou um detalhe, seguindo o fluxo original. Formulários de cadastro mantêm seus registros e campos completos.

O padrão inclui densidade ajustável pelo controle Visual original, tema claro/escuro, tabelas compactas, cores sem bordas espessas nos gráficos e ampliação de blocos sem clonar seus controles. Tabelas e gráficos conservam também seus visualizadores nativos. A personalização altera a apresentação; não modifica denominadores, valores, linhas de produtos ou regras financeiras.

## Executar

Requer Node 24 com SQLite e acesso ao HTML original acima. A variável `BSAN_REVIEW_SOURCE` permite indicar outra cópia desse HTML. A partir da raiz do repositório:

```powershell
npm ci --prefix propostas
node propostas/preview.cjs
```

O servidor escuta somente em `127.0.0.1:59833`. `PROPOSTA_PORT` permite outra porta. Abrir o arquivo HTML diretamente não inicia esta versão. O HTML gerado original e os dados de SAIDA não são copiados para o Git.

## Cobertura e validação

Veja [COBERTURA-INTEGRAL.md](COBERTURA-INTEGRAL.md) para as 39 rotas e o método de conferência. Os testes comparam as 1.524 funções nomeadas originais, inclusive internas, byte a byte; esse número representa funções, não indicadores. Todos os IDs estáticos originais permanecem presentes. Foram verificados navegação pelas 39 abas, Metas diário/acumulado, Raio-X, formulários de Produtos, preferências ao trocar de aba, ampliação e apresentação móvel.

```powershell
node --test propostas/integral.test.cjs propostas/integral-preferences.test.cjs propostas/workspace.test.cjs
```

Resultado: 17 testes passaram, sendo seis da revisão integral, dois de persistência/isolamento de preferências e nove de regressão do protótipo anterior. Os testes antigos de 175 blocos não são utilizados como prova de cobertura desta versão.

## Limites da revisão

Esta é a migração da **estrutura para a prévia**, sem implantação em produção. Os valores são fictícios; perfis e ações usam adaptadores locais. Cadastros, tratativas e fechamento de demonstração não alteram registros reais e desaparecem ao reiniciar o servidor. Pagamentos, credenciais, integrações externas e coletores reais não são executados nem homologados aqui. As permissões oficiais precisarão ser verificadas na integração com o servidor de produção.

A prioridade desta versão é a fidelidade das telas. Ocultar um bloco não garante que o modelo original deixe de calculá-lo. Não há promessa de redução de consultas ou tempo de carregamento: a divisão de consultas e o carregamento sob demanda em produção estão descritos em [CARREGAMENTO.md](CARREGAMENTO.md).

Somente `propostas/` foi alterado. As correções de ponto/casa, filtros do gestor e coletor Tiny não foram modificadas. O branch da proposta permanece separado da plataforma publicada.

## Histórico do protótipo anterior

As descrições abaixo referem-se ao protótipo substituído, mantido para rastreabilidade. Seus 175 blocos recriados e os limites então registrados não descrevem o servidor integral atual.

# Proposta anterior de experiência: BsanControl personalizável

## Versão atual · 17/11/2026

A prévia contém oito áreas, 39 abas e 175 blocos de apresentação catalogados a partir do HTML e dos módulos visuais do BsanControl. Os blocos são composições de indicadores, gráficos, tabelas e leituras; não são 175 métricas financeiras independentes. O inventário está em [RECURSOS-PERSONALIZAVEIS.md](RECURSOS-PERSONALIZAVEIS.md).

Cada aba abre com uma visão essencial. **Personalizar** permite adicionar, retirar, ordenar e mudar a largura dos blocos, com preferência salva por aba e perfil simulado neste navegador. **Todas as análises** mostra o conjunto da aba. **Ver recursos originais** apresenta a correspondência com as fontes, filtros e ações originais. As tabelas preservam as colunas e têm CSV, ampliação e tela cheia; o mesmo elemento é movido para o diálogo e devolvido ao fechar.

O carregamento é real nesta prévia: recursos removidos não são montados; recursos fora da área visível aguardam a rolagem. As oito famílias de dados fictícios têm consultas distintas, compartilhadas pelos blocos do mesmo contexto. Trocas de aba cancelam consultas pendentes. Ponto, empresa, canal, período, competência, perfil, critério ABC e operações escolhidas compõem a chave da consulta. Erros não exibem valores do contexto anterior.

**Limites:** a prévia redesenha a apresentação, não é uma cópia funcional homologada da plataforma. Formulários, importação, aprovação, permissões reais e publicação não foram integrados. Os métodos de projeção, regras de diagnóstico e custos são cenários demonstrativos; a integração deve reutilizar os modelos originais e validar paridade. Alguns controles e ações originais estão documentados no inventário e não executam seu fluxo completo aqui. O ganho de desempenho em produção ainda precisa ser medido após dividir as consultas reais; nenhum percentual de melhora foi estimado.

Não há leitura de SAIDA, banco, credenciais, contas de teste ou API de produção. Os valores da interface e das imagens são fictícios. Nenhum dado do Drive é incluído no Git. Apenas arquivos em `propostas/` foram alterados.

Execute `node propostas/preview.cjs` e abra a URL de loopback exibida. O servidor publica somente arquivos explícitos e consultas GET de dados fictícios. Esta versão usa módulos e consultas locais e precisa desse servidor; abrir o HTML diretamente pelo sistema de arquivos não oferece a experiência completa.

Testes: `node --test propostas/workspace.test.cjs`. Cobrem os 175 renderizadores, totais e identidades, ausência de Ads, limites exatos de cor, seleção de operações/critério ABC, preferências e isolamento do servidor. Validação no navegador: abas das oito áreas, adição/persistência de blocos, tabela e gráfico ampliados, tela cheia, restauração e menu/personalização no celular de 390 × 844 sem transbordamento horizontal da página.

## Histórico da proposta inicial

Protótipo para avaliar a organização visual antes de integrar uma mudança ao BsanControl. Inspirado na estrutura do Shopeers indicado pelo usuário, com identidade e regras próprias do BsanControl.

Todos os dados são fictícios e ficam dentro do HTML. Não há chamadas à API, leitura de configurações, autenticação ou gravação na operação. As telas de apoio demonstram o percurso de investigação, sem substituir os módulos de produção.

Execute `node propostas/preview.cjs` e abra a URL local exibida. A cópia para a área de transferência depende das permissões do navegador.

Percursos para avaliar:

1. Reconhecer faturamento, volume, contribuição e margem no Panorama.
2. Comparar evolução diária ou acumulada com a referência explícita.
3. Abrir uma prioridade no Diagnóstico e investigar seu produto.
4. Trocar Anúncio por SKU e conferir a soma de anúncios do mesmo SKU, sem atribuir um ID único ao agregado.
5. Conferir todas as etapas em Anúncios, ampliar a tabela e abrir detalhes.

Régua de margem: `<10%` vermelho; `10% a <20%` âmbar; `≥20%` verde. Régua de TACOS: `<3%` verde; `3% a <5%` âmbar; `≥5%` vermelho. Queima de margem e Sem giro permanecem distintos.

Esta proposta é mantida em branch próprio. Não altera o HTML publicado, cálculos ou permissões do BsanControl.

Validação: scripts compilados; nove cenários com totais e agregação consistentes; navegação Panorama → prioridade → produto; lentes de anúncio/SKU; cópia de código; CSV do filtro; paginação; ampliação da tabela e do gráfico; tema claro/escuro; celular 390 × 844 sem rolagem horizontal da página. Prévia salva em panorama-desktop.jpg.

Referência visual indicada pelo usuário: https://dribbble.com/shots/26628350-Shopeers-AI-Powered-B2B-eCommerce-Analytics-Dashboard

## Atualização: estrutura completa

A proposta agora tem oito áreas e 39 abas demonstrativas. O menu lateral expande as abas da área ativa. O botão Mapa reúne todos os destinos em uma visão clicável. Veja ESTRUTURA-COMPLETA.md para o inventário, os percursos e os limites desta prévia.

Verificados: abertura das 39 abas no navegador; 36 combinações de ponto, marketplace e período; agregação por SKU; contexto compartilhado; busca por aba; competência financeira independente; simulação de perfil; ida e volta entre tarefa, anúncio e Raio-X; ampliação; e menu no celular.

Imagens de revisão: estrutura-completa.jpg e acompanhamento-completo.jpg. A interface publicada não foi alterada.
