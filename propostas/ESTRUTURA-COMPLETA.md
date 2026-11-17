# Estrutura completa para revisão do BsanControl

> Histórico do protótipo anterior. A versão atual usa as telas originais completas e está documentada em [COBERTURA-INTEGRAL.md](COBERTURA-INTEGRAL.md) e [README.md](README.md). A relação de oito áreas e 39 destinos foi conservada; os blocos recriados descritos neste documento foram substituídos pelos renderizadores originais.

Esta versão amplia a proposta inicial do Panorama para uma prévia visual navegável da plataforma. Ela contém oito áreas e 39 abas demonstrativas. Não modifica as telas publicadas, APIs, dados, permissões ou regras oficiais. Os conteúdos são amostras fictícias para avaliar organização, densidade, identificação, filtros e transições; não equivalem à implementação de todos os fluxos de produção.

## Navegação

O menu lateral mostra permanentemente as áreas principais. A área ativa expande suas abas. O cabeçalho mantém o caminho atual; o botão **Mapa** abre todas as áreas e abas em uma única visão clicável.

- **Resultados:** Visão Geral, Diário, Marketplaces, Curva ABC, Forecast.
- **Vendas:** Vendas, Raio-X.
- **Gerencial:** Panorama, Vendas da operação, Diagnóstico, Anúncios, Forecast, Publicidade, Metas, Full.
- **Operação:** Envios, Estoque, Projeção.
- **Produtos:** Catálogo, Pendências de custo, Entradas de compra, Materiais, Embalagens, Preparação de embalagens, Homologação, Apuração de custos, Atualização, Integração.
- **Pós-venda:** Atendimentos.
- **Acompanhamento:** Tarefas, Promoções, Ads, Alinhamentos, Pendências. Tarefas oferece Fila de tarefas, Comparar carteiras, Casos e continuidade e Referências econômicas.
- **Financeiro:** DRE, Comissão, Fechamento, Custos, Carteiras.

Os itens planejados, mas ainda desabilitados na produção, não são apresentados como funcionalidades entregues. A prévia financeira permite avaliar os cinco destinos juntos, mesmo onde hoje aparecem como navegação interna da DRE.

## Contexto e filtros

- Ponto, empresa, marketplace e período são compartilhados entre as áreas e permanecem visíveis.
- Buscas, situação, lente anúncio/SKU e paginação pertencem a cada aba. Ao voltar, a prévia restaura esse estado; uma busca em Anúncios não restringe silenciosamente o Panorama.
- A competência financeira é própria. Trocar o mês da DRE não altera o período global das vendas.
- Cadastros de Produtos e posição física do estoque não usam o período global como data de existência do cadastro ou saldo.
- Os casos de Pós-venda e Acompanhamento têm situação, responsável e retorno próprios. Uma mudança no status da venda não encerra um atendimento automaticamente.
- O perfil da prévia simula Direção, Coordenação e Gestor. Na simulação de Gestor, o ponto é Bsan; as telas exclusivas da Direção não ficam disponíveis. A autorização real, inclusive concessões por ponto e por usuário, será preservada na integração e não é alterada pelo seletor da proposta.

## Percursos para revisão

1. Resultados → operação → Panorama → Diagnóstico → produto.
2. Acompanhamento → caso → Anúncios ou Raio-X → Voltar à origem.
3. Anúncios → busca e lente SKU → Panorama → voltar a Anúncios, preservando a busca apenas nessa aba.
4. Financeiro → DRE → competência → Custos ou Fechamento, preservando o período global.
5. Produtos → cadastro → custo/homologação → apuração, identificando as etapas sem executar aprovações reais.
6. Operação → estoque → projeção → conferência da posição.
7. Pós-venda → atendimento → investigação da venda/produto.

## Limites e validação

Amostras, cálculos de cenário, estados e responsáveis são fictícios. Botões de conferência abrem detalhes demonstrativos; a simulação de retorno não grava tratativa oficial. Nenhum fechamento, pagamento, aprovação de custo ou concessão de acesso é executado.

Verificados no navegador: abertura das 39 abas; continuidade entre tarefa, anúncio e Raio-X; busca por aba; contexto compartilhado; competência independente; simulação de perfil; histórico Voltar; ampliação das tabelas; e comportamento em celular. Scripts compilados e invariantes do modelo de demonstração conferidas.

A revisão agora deve considerar o conjunto da navegação e das telas. A implantação depende de uma etapa posterior de integração e homologação com os dados e permissões reais.
