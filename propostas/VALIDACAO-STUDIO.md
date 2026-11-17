# Validação da prévia Studio v3 · 17/11/2026

## Entrega visual

| Requisito | Implementação |
|---|---|
| Páginas recompostas | Perfis próprios para os 39 destinos; KPIs essenciais, grade de gráficos/prioridades e aprofundamento. Cadastros conservam seus fluxos. |
| Cards objetivos | Valor e variação preservados; explicações sob demanda; ressalvas de parcial/estimado e percentuais de margem mantidos. |
| Biblioteca visual | Painel lateral, miniaturas, finalidade, busca, seleção e restauração da composição sugerida. |
| Composição pessoal | Arraste ou setas, cinco larguras e visibilidade; por usuário/página neste navegador. |
| Tabelas | Contagem de linhas carregadas, colunas disponíveis ao perfil, densidade, ampliação, tela cheia e ações originais. |
| Macro e micro | Ações nativas de operação/produto/anúncio mais links nos KPIs e retorno com contexto. |

## Conferência no navegador

Os 39 destinos do catálogo nativo foram abertos, incluindo os dez fluxos do aplicativo real de Produtos. A conferência foi adaptativa: foram corrigidos os conflitos entre as grades legadas e a nova composição, os controles duplicados do iframe e a visibilidade ao mudar de seção. Não se usa uma contagem de caixas como prova de cobertura de todas as variantes dinâmicas.

Percursos exercitados nesta revisão:

- Panorama → vendas da operação → voltar: empresa Bsan Shop, Mercado Livre e 01/11 a 16/11 preservados.
- Anúncios: troca anúncio/SKU; agregado identifica dois anúncios e não recebe um MLB único; Raio-X abre e retorna à tabela.
- Forecast macro: operações e produtos/SKU disponíveis; projeção por produto mantém realizado, esperado e abertura por operação.
- Metas: faturamento e TACOS, dia selecionado, acumulado, teto/orçamento e gráfico diário/acumulado preservados.
- Produtos: Catálogo, Pendências, Entradas, Materiais, Embalagens, Preparação, Homologação, Apuração, Atualização e Integração. Formulário nativo de material e biblioteca visual abertos; painéis ocultos não vazam ao trocar de seção.
- Biblioteca: adicionar TACOS, mudar para um terço e subir na ordem; seleção, largura e ordem confirmadas após recarregar. Restauração do padrão conferida.
- Tabela de anúncios: ocultar Preço/un e mudar densidade; ambos confirmados após recarregar. Ampliação, tela cheia e retorno ao mesmo elemento conferidos.
- Gráfico de Metas: ampliação nativa, aumento efetivo das dimensões na tela cheia e fechamento conferidos.
- Tema claro/escuro; menu móvel e KPIs em duas colunas em 390 × 844, sem transbordamento horizontal da página. Viewport temporário restaurado.
- Abertura final limpa no endereço da entrega, sem erros de console capturados nessa sessão.

Imagens de dados fictícios: [Página inicial](studio-panorama-final.jpg), [Biblioteca](studio-widgets-final.jpg).

## Verificação automática

27 testes aprovados: 6 da adaptação integral, 2 de preferências, 4 da composição Studio, 6 de movimento/identidade e 9 do protótipo legado. A adaptação conserva 1.524 funções nomeadas e todos os IDs estáticos originais. Estes números representam funções e contratos estáticos, não quantidade de indicadores ou homologação integral de produção.

## Limites explícitos

O teste visual usa dados fictícios e serviços em memória. Não homologa dados reais, pagamentos, coletores, permissões de produção ou todos os estados possíveis de cada formulário. Preferências são locais por identidade simulada. O ciclo de cálculo nativo permanece; não foi comprovada economia de consultas por ocultar widgets. IA e sincronização de preferências no servidor são etapas futuras.

Nenhuma implantação no painel publicado foi realizada.

## Complemento: movimento, marca, escala e PNG

- Formação sequencial de barras, bolhas e fatias; linha revelada da esquerda para a direita. Reprodução manual observada no Diário (bolhas), Curva (fatias) e Panorama (barras/linha). Geometrias positivas/negativas, raios compartilhados, arcos e contexto do canvas são restaurados nos testes. A animação nativa é desativada para não competir com a progressão e para respeitar movimento reduzido.
- Bsan Shop e Jowcase selecionadas em Preferências; persistência após recarga, estado Sem animação e comunicação com os dez fluxos de Produtos conferidos. As duas identidades preservam A/B/C verde/âmbar/vermelho. Pontos negativos com cores próprias não são substituídos pela marca.
- Curva: cards e etiquetas conferidos por estilo computado e Pareto/participação por observação visual. Linha acumulada com cor distinta das barras.
- Período: painel de atalhos com 430 px CSS; mês completo escolhido sem mudar a consulta até Aplicar. Intervalo personalizado preserva os calendários nativos. Em 390 × 844 não transborda a página; viewport restaurado após o teste.
- Varredura de fontes nos 29 destinos do documento principal e nos dez fluxos do iframe. Corrigidos os valores de operações, receita de canal, agenda, estoque/envios/projeção e Comissão. Os sete destinos afetados foram revistos com Todas as análises: nenhum texto visível acima de 28 px e nenhuma rolagem horizontal da página. KPIs nativos de Comissão permanecem visíveis e classificáveis.
- Botões de imagem disponíveis em Tarefas, Promoções, Ads, Alinhamentos e Pendências. Tarefas/Promoções/Ads reutilizam o relatório executivo e o modelo nativos, conservando competência, carteira temporal e seleção própria. A captura não depende dos widgets visíveis. Alinhamentos/Pendências usam a captura do recorte da seção.
- PNG de Tarefas gerado, baixado e inspecionado visualmente; cópia confirmada no navegador. Promoções e Ads gerados e copiados. Alinhamentos e Pendências gerados em PNG e copiados; resumo/detalhamento de Tarefas alternados e copiados. O navegador pode negar a área de transferência; a interface orienta usar Baixar PNG nesse caso. Copiar imagem é a ação principal; Baixar PNG continua disponível ao lado. Nenhuma mensagem é enviada ao WhatsApp.
- As bibliotecas de imagem são versões fixas servidas localmente e só são carregadas no primeiro uso. O relatório nativo usa fontes de sistema na imagem da prévia para não consultar fontes externas. Dados fictícios são identificados no rodapé.

Os exemplos reais anexados pelo usuário foram usados somente para entender a composição diária; não foram copiados para o repositório. A captura publicada como evidência usa a base fictícia da prévia.

Evidências deste complemento: [Identidade e escala](studio-identidade-final.jpg), [Período compacto](studio-periodo-final.jpg), [Copiar/Baixar](studio-relatorio-final.jpg) e [PNG executivo fictício](studio-acompanhamento-exemplo.png).

Correção complementar: margens automáticas dos modais restauradas após o reset legado. Imagem para o grupo, Preferências e gráfico ampliado conferidos centralizados horizontal e verticalmente no viewport. Biblioteca visual mantém o painel lateral. Evidência de imagem atualizada em studio-relatorio-final.jpg.
