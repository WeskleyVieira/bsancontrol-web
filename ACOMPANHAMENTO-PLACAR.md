# Acompanhamento — recuperação do painel visual

03/11/2026.

Os cards gerenciais e a composição de imagem existentes foram substituídos por tabelas durante a revisão dos fluxos. Esta entrega recupera sua função de leitura rápida e incentivo à execução, mantendo o design atual do BsanControl.

## Base recuperada

A implementação foi comparada com o código anterior preservado no HTML e no histórico do Git: `ac2DirHero`, `ac2DirScore`, `AC2_SEM`, `ac2Fotos` e a composição de resumo mais momento dos gestores. Os prints enviados identificaram a versão visual esperada. A estrutura funcional foi adaptada aos componentes, tokens de cores, tipografia, espaçamento e temas atuais; os estilos antigos não foram reativados.

## Painel

- **Direção:** seis cards de resumo, progresso por tipo e Momento de cada gestor. Registro e efeito têm barras/selos separados, com quantidades e percentuais. Pendências, revisões, retornos e conclusões possuem atalhos para a fila correspondente.
- **Coordenação:** Mesa de cobrança em cards por responsável, com progresso, atrasos, revisões, retornos, próxima demanda prioritária e cópia da cobrança. A agenda de retornos continua disponível. A tabela permanece como abertura adicional.
- **Gestor:** progresso por tipo e operação, selos e próximo marco de registro. Abrir operação e registrar ações continuam usando o fluxo e as permissões existentes.
- **Régua anterior:** abaixo de 70% Crítico; de 70% a menos de 90% Atenção; de 90% a menos de 100% Bom; 100% Ideal. O selo usa a fração exata, não o percentual arredondado. A meta seguinte mostra quantas ações faltam registrar e considera saltos de faixa em carteiras pequenas.
- **Efeito medido:** Resolvido, Progrediu ou Justificado entre medições conclusivas posteriores à ação. Sem medição fica aguardando. Progresso, confirmação e conclusão continuam separados. Observação e fora da régua ficam fora do denominador ativo.
- Matriz e resultados detalhados continuam acessíveis em **Abrir matriz e resultados em tabela**. Os cards são a leitura principal.

O antigo total chamado “dinheiro parado” reunia referências de bases diferentes. A leitura financeira mantém sua abertura própria, com natureza e janela identificadas. O resumo visual inclui retornos vencidos e quantidade de conclusões medidas.

## Imagem para o grupo

O botão **Imagem para o grupo** gera um painel único da seção selecionada — Tarefas, Promoções ou Ads — e do nível aberto. Inclui resumo, tipos e gestores/operações, em composição de 1.400 px com resolução dupla. A quantidade de colunas acompanha o número de gestores. Usa o tema escolhido e os mesmos componentes visuais da página.

O recorte de ponto, responsável, operação, tipo, período e carteira temporal é preservado. A referência é capturada ao clicar para não mudar se a navegação ocorrer durante a geração. O painel identifica o recorte e o horário brasileiro. A busca e a situação da lista continuam refinando somente a fila, conforme indicado na imagem.

O PNG pode ser copiado ou baixado. **Imagem detalhada** conserva a exportação dos quadros e da visão aberta, incluindo o limite informado para listas. Não há envio automático ao grupo.

## Validação

- **299 testes automatizados aprovados**, incluindo nove contratos de selos, faixas exatas, registro/efeito/conclusão, dados ausentes ou antigos, carteiras, operações e prioridade da Coordenação.
- Edge com dados e contas fictícias: três seções; três níveis; cards e totais confrontados com a carteira; filtros; clique e retorno à fila; matriz detalhada; agenda; exportação detalhada; sete PNGs de grupo; tema claro/escuro e celular sem transbordamento.
- Regressão de evidências de Promoções/Ads, continuidade e leitura econômica. A fila mantém o carregamento sem esperar cálculos de vendas; gerar o painel visual não solicita a leitura econômica.
- Nenhuma alteração de dados comerciais, esquema, permissões, prazos, coleta ou medição. Selos e marcos são derivados da carteira atual.
