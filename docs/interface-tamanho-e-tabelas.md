# Tamanho da interface e tabelas ampliadas

No cabeçalho, Visual permite ajustar toda a interface de 80% a 120%, em passos de 5%. O padrão é 90% no computador e 100% no celular. Há atalhos Compacto (85%), Equilibrado (90%) e Original (100%). A preferência é salva por usuário e por tipo de dispositivo neste navegador. Com armazenamento bloqueado, vale durante a sessão. Restaurar padrão retorna ao tamanho correspondente ao dispositivo.

Ampliar tabela abre a tabela da visão atual, com rolagem nos dois sentidos, cabeçalho fixo, tamanho próprio e Tela cheia. A tabela real é movimentada e restaurada ao fechar: ordenação, cópia de SKU/ID, detalhes e paginação continuam associados à origem. As colunas e os filtros escolhidos na tela são preservados; a ampliação não baixa todo o banco nem remove paginação. Uma troca de sessão ou escopo encerra o visor.

Produtos utiliza o mesmo componente, inclusive dentro do painel. Somente os três assets públicos necessários são adicionados à lista de arquivos permitidos. Não há novas APIs de dados, permissões ou alterações em cálculos, metas e réguas de cores.

Validação: suíte Node e navegação manual em base fictícia isolada. Conferidos persistência após recarregar, escala pelo teclado, duas páginas de Vendas, ordenação no Diário, fechamento/restauração, tela cheia de tabela e gráfico, Produtos incorporado e viewport de celular (390 × 844).
