# Homologação do layout do BsanControl

A fase 1 integra a apresentação aprovada em `30170e9` ao painel web a partir de `0fb14e4`. A API entrega a apresentação nova quando `AUTH_REQUIRED=1` e `BSAN_LAYOUT_STUDIO=1`. A configuração padrão entrega o painel anterior. O modo incorporado de Produtos acompanha a apresentação do painel.

## Abrir novamente

Com Node 24 e as dependências instaladas, execute `npm run homologar:layout` e abra [o painel de homologação](http://127.0.0.1:59837/). O terminal informa a conta e a senha locais. Se a porta estiver ocupada, `npm run homologar:layout -- 59838` inicia outra instância.

Cada execução cria dois arquivos SQLite temporários com dados fictícios, habilita o login nativo e atende apenas nesta máquina. Há contas de Direção, Coordenação, Gestor, Compradora, Estoque e Pós-venda. As preferências de aparência e composição são locais ao navegador e à conta. As consultas e as permissões vêm do painel nativo.

## Conferência da integração

- Os 39 destinos disponíveis para a Direção foram abertos pelo menu no Chrome com janelas de 1450 × 900 e 390 × 844. Os dez fluxos de Produtos foram conferidos após o módulo carregar as permissões do ponto.
- Os seis perfis entraram pelo formulário de login. A suíte HTTP verifica carteira, filtros de ponto e restrições dos perfis operacionais.
- Troca de tema, paleta Jowcase e animação desativada persistiram após recarregar. Um link para Materiais abriu novamente o fluxo autorizado depois de carregar as permissões de Produtos.
- Na Visão Geral foram exercitados os controles de ampliar gráfico, ampliar tabela e tela cheia. Em Tarefas, o relatório do recorte foi copiado como imagem PNG e baixado como arquivo PNG.
- A suíte do painel roda com `node --test "tests/*.test.js"`.

A comparação de totais com a operação real e a validação com contas de uso diário pertencem à fase seguinte.

## Fase 2 · Reconciliação com a base publicada

Em 19/11/2026, o painel de referência em `0fb14e4` e o novo layout em `7f7fcf1` foram executados em instâncias locais autenticadas. Uma transação PostgreSQL de leitura repetível forneceu a mesma fotografia para as duas bases SQLite independentes. A última venda publicada nessa fotografia tinha data de 18/11/2026. Contas locais reproduziram o perfil, a referência de carteira e as restrições de três usuários ativos. As senhas e os tokens de produção ficaram na origem.

| Área | Recortes e resultados conferidos no navegador |
| --- | --- |
| Forecast por SKU | De 01 a 18/11, consolidado, operação e pontos autorizados. Foram conferidos realizado, esperado, projeção, unidades, margem apurada, os primeiros 12 produtos e a composição por operação do primeiro SKU. |
| Metas | Outubro e novembro de 2026, na mesma operação. Comparação dos cinco objetivos, valores, referências e saldos. |
| Comissão | Outubro e novembro. Comparação de bônus registrado, operações com registro, operações para conferir e detalhe de uma operação selecionada. |
| Acompanhamento | Carteiras de Tarefas, Promoções e Ads, seus indicadores e quadros de gestores. Alinhamentos e Pendências foram comparados para cada ponto autorizado nos recortes testados. |

Coincidiram 78 conjuntos de resultados entre as interfaces, 27 para Direção, 27 para Coordenação e 24 para Gestor. Outros 74 controles passaram, incluindo somas de faturamento e unidades nas vendas finalizadas, composição do SKU, metas publicadas, bônus por operação e consistência entre demandas registradas e pendentes. A suíte do painel passou nos 653 testes. O demonstrativo com valores reais foi entregue localmente.

A fase 2 cobre a leitura dos quatro módulos acima. O piloto com as contas habituais da equipe e a decisão de publicação seguem como marcos posteriores.
