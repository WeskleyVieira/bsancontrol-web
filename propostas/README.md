# Prévia integral recomposta do BsanControl · Studio v3

Prévia navegável para revisão visual antes de integrar ao painel publicado. Oito áreas e 39 destinos nativos, com dados fictícios, modelos e formulários originais. O item nativo “Anúncios · em breve” do Acompanhamento continua desabilitado.

**Abrir:** [Prévia integral](http://127.0.0.1:59833/?revisao=integral#gerencial/panorama).

- Resumo essencial no início, gráficos e prioridades em uma grade de 12 colunas.
- Cards com valor, comparação e explicações no ícone de informação; estimativas permanecem identificadas.
- **Adicionar widgets** abre a biblioteca lateral: miniatura, finalidade, seleção, ordem por arraste/setas e cinco larguras.
- **Todas as análises** revela os recursos da leitura atual; **Visão essencial** retorna à seleção sugerida. A biblioteca também restaura a composição inicial.
- Tabelas com seleção de colunas disponíveis ao perfil, densidade, ampliação e ações nativas de detalhe/exportação. Colunas financeiras não são removidas por falta ou zero de dados.
- Links dos indicadores e ações nativas abrem vendas, operação, anúncio ou SKU; voltar à origem preserva o recorte.
- Claro inicial, escuro opcional, menu retrátil, ferramentas na base e escala no controle Visual. Preferências por identidade/página neste navegador; ainda sem sincronização entre dispositivos.

## Movimento, identidade e fotografias do acompanhamento

- **Preferências → Identidade visual:** Bsan Shop (ciano `#00B1EB`, lavanda `#B186FF`) ou Jowcase (azul `#2871FA`, violeta `#6717CD`). A escolha fica salva por identidade neste navegador. Controles usam tons derivados para leitura; marcas dos canais e sinais de desempenho conservam sua função.
- **Animação dos gráficos:** formação progressiva com três ritmos: Lenta (4,2 s), Média (2,4 s) e Rápida (1,1 s). A opção Sem animação mostra o gráfico pronto. O botão ↻ reproduz novamente. A preferência de movimento reduzido do dispositivo é respeitada. Valores, escalas e cálculos não mudam.
- **Curva A/B/C:** verde, âmbar e vermelho em cards, Pareto, participação e etiquetas; a linha acumulada tem cor distinta das barras. TACOS mantém a régua financeira própria.
- **Período:** datas e atalho em uma linha; painel compacto com atalhos, mês completo e intervalo personalizado. A consulta só muda após Aplicar.
- **Acompanhamento → Imagem para o grupo:** em Tarefas, Promoções e Ads, reutiliza o relatório executivo nativo: seis indicadores, progresso por tipo, momento de cada gestor, competência e carteira temporal. Não depende dos widgets visíveis. Alinhamentos e Pendências também têm captura do recorte atual. A prévia permite **Copiar imagem** ou **Baixar PNG**; não envia ao WhatsApp. Bibliotecas servidas localmente, carregadas apenas ao gerar.
- **Escala:** valores e títulos dos componentes antigos são normalizados; a ampliação mantém leitura maior. A revisão inclui os dez fluxos reais de Produtos e os KPIs de Comissão.

Os dez fluxos de Produtos usam o aplicativo e o serviço originais, com SQLite somente em memória. Cadastros e ações demonstrativas desaparecem ao reiniciar o servidor. O HTML original é lido em memória de `T:/Meu Drive/Business Intelligence/Grupo Bsan/BsanControl.html`; os dados privados são substituídos. Nem o HTML gerado nem os arquivos de SAIDA são copiados para o Git.

## Executar

Requer Node 24 com SQLite e acesso ao HTML original. `BSAN_REVIEW_SOURCE` permite indicar outra cópia. Na raiz do repositório:

```powershell
npm ci --prefix propostas
node propostas/preview.cjs
```

O servidor escuta apenas em `127.0.0.1:59833`. `PROPOSTA_PORT` permite mudar a porta. Abrir um HTML avulso não inicia a aplicação integral.

## Validação

```powershell
node --test propostas/integral.test.cjs propostas/integral-preferences.test.cjs propostas/studio.test.cjs propostas/experience.test.cjs propostas/workspace.test.cjs
```

27 testes aprovados: seis da adaptação integral, dois de preferências, quatro da composição Studio, seis de movimento/identidade e nove do protótipo anterior. A paridade compara 1.524 funções nomeadas nativas, inclusive internas, byte a byte, além de todos os IDs estáticos. **Funções e blocos não são contagem de indicadores.** Os testes antigos de 175 blocos não provam cobertura da versão integral.

[VALIDACAO-STUDIO.md](VALIDACAO-STUDIO.md) registra os percursos e limites; [COBERTURA-INTEGRAL.md](COBERTURA-INTEGRAL.md) e [cobertura-integral.json](cobertura-integral.json) registram os 39 destinos nativos. [DIRETRIZES-REDESENHO.md](DIRETRIZES-REDESENHO.md) contém as decisões de experiência.

## Limites

Esta entrega é a implementação visual na prévia. Dados, perfis e gravações são demonstrativos; permissões oficiais, integrações externas, coletores, pagamentos e fechamento real não foram homologados. A integração de produção e a persistência oficial no servidor são uma etapa posterior à revisão do usuário.

Os renderizadores nativos ainda podem calcular análises ocultas. Não há ganho de consultas ou tempo de carregamento declarado. Ver [CARREGAMENTO.md](CARREGAMENTO.md). IA não foi implementada.

Somente `propostas/` foi alterado. As correções de ponto/casa, filtros do gestor e coleta Tiny não foram modificadas. O branch da proposta permanece separado do painel publicado.

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
