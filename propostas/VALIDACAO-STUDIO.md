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

21 testes aprovados: 6 da adaptação integral, 2 de preferências, 4 da composição Studio e 9 do protótipo legado. A adaptação conserva 1.524 funções nomeadas e todos os IDs estáticos originais. Estes números representam funções e contratos estáticos, não quantidade de indicadores ou homologação integral de produção.

## Limites explícitos

O teste visual usa dados fictícios e serviços em memória. Não homologa dados reais, pagamentos, coletores, permissões de produção ou todos os estados possíveis de cada formulário. Preferências são locais por identidade simulada. O ciclo de cálculo nativo permanece; não foi comprovada economia de consultas por ocultar widgets. IA e sincronização de preferências no servidor são etapas futuras.

Nenhuma implantação no painel publicado foi realizada.
