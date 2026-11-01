# Auditoria por página — Grupo Bsan

A migração do tema comum foi concluída anteriormente. Este plano acompanha a revisão aprofundada de leitura, fluxo e funcionamento de cada página. Aplicar o tema não significa concluir a auditoria de uma página. A referência visual é Metas, incluindo tipografia, espaços, hierarquia dos valores, estados discretos e ampliação exclusiva dos gráficos.

## Sequência e situação

| Etapa | Páginas e modos incluídos | Situação |
|---|---|---|
| 1 | Resultados → Visão Geral; Gerencial → Panorama | Implementados e validados tecnicamente. Revisão do gestor pendente. |
| 2 | Vendas; Raio-X; Gerencial → Vendas da operação | Pendente. Próxima etapa. |
| 3 | Gerencial → Diagnóstico, Anúncios, Publicidade, Full | Pendente. |
| 4 | Acompanhamento → Tarefas, Promoções, Ads | Pendente. Anúncios conserva o estado em breve até existir implementação de origem. |
| 5 | Operação → Envios, Estoque, Projeção | Pendente. Ordem preservada. |
| 6 | Resultados → Diário, Marketplaces, Curva ABC, Forecast | Pendente. Forecast permanece na leitura macro. |
| 7 | Financeiro → DRE; revisão de integração de Metas, Comissão e Administração de usuários | Pendente. Metas, Comissão e Administração já têm entregas próprias; esta etapa revisa integração e consistência, sem declará-las novamente auditadas. |

Cabeçalho, seletores em cascata, período, menus, formulários de lançamento, importações e comparação serão conferidos dentro dos fluxos em que aparecem. Permissões continuam nos limites do perfil: DRE exclusiva da Direção; comissão e carteira conforme a autorização existente.

## Método por página

1. Inventariar indicadores, gráficos, tabelas, filtros, ações e exportações existentes antes da alteração.
2. Verificar a pergunta gerencial atendida, alcance de cada base, atualização, período e fórmulas já utilizadas. Identificar duplicação com outras áreas.
3. Corrigir hierarquia, linguagem, contraste, tamanho, estados vazios e navegação, preservando recursos e fontes. Divergências de cálculo recebem evidência específica.
4. Conferir valores antes/depois com o mesmo recorte; testar filtros, ações, referências sem registros, permissões, temas, telas estreitas e ampliação dos gráficos.
5. Registrar alterações e limitações, instalar com backup, regenerar e verificar a versão publicada. Revisão técnica e aceitação gerencial permanecem distintas.

## Etapa 1 — Visão Geral e Panorama

A Visão Geral responde quanto as vendas produziram no recorte e quais operações compõem o resultado. Panorama responde como está uma conta e qual o efeito do Ads adicional apurado. Demandas e tratativas continuam em Acompanhamento e nas áreas próprias do Gerencial.

| Achado anterior | Correção |
|---|---|
| Cartão usava `fatDe(agg(...))`, enquanto gráficos agrupavam `fat` bruto. | Composição por empresa, canal, dia e tendência usa a mesma base finalizada do cartão. Se houver base legada sem `fatMetas`, todo o recorte conserva o fallback bruto e recebe explicação. |
| Meta mensal se misturava ao intervalo e seu atalho abria Forecast. | Bloco mensal separado, realizado restrito às operações com objetivo e exibição condicionada à cobertura mensal carregada. Atalho abre Gerencial → Metas. |
| Não havia abertura clara do consolidado para uma conta. | Tabela de operações com busca, ordenação e filtro de margem negativa; Abrir Panorama mantém as datas e respeita a carteira autorizada. |
| Variação com referência zero aparentava 0%; comparação automática do Panorama não declarava as datas. | Referência e datas explícitas; ausência não produz variação; base zero permite diferença absoluta, sem percentual fictício. |
| Margem das vendas zero com Ads gerava valor negativo em reais, mas percentual de 0%. | Percentual divide a margem após Ads pela base vigente. Temu mantém sua base líquida, inclusive na série diária. Não há mudança no valor da margem apurada. |
| Cache de Ads se mantinha com arrays novos de mesmo tamanho. | Invalidação considera também a identidade das bases recebidas. Mantidas as regras de máximo entre anúncio/campanha, exclusão de afiliados e do Ads já no líquido. |
| Ausência de gasto atual era tratada como falha de coleta; total negativo de um canal virava afirmação sobre cada venda. | Cobertura e limites declarados sem inferências indevidas. Textos dinâmicos escapados. Sinais complementares ficam em abertura opcional. |
| Excesso de informação sem distinguir vendas de resultado final. | Indicadores principais primeiro; evolução diária, composição, operações e leituras complementares em sequência. Margem com teto não recebe o nome de lucro final. |

Cinco gráficos da Visão Geral preservados, incluindo controles de tendência, ampliação e tabela de valores. Rankings de SKU continuam baseados na fonte mensal consolidada, com alcance explicitado. Não passam a representar um recorte por empresa que a fonte não oferece. A média móvel é identificada como até sete pontos, sem presumir sete dias consecutivos.

## Evidências e limites da etapa 1

- 34 testes automatizados aprovados: nove novos casos de resumo, sete da comparação e 18 de usuários/acessos. Incluem cache real de Ads, composição conciliada, percentuais, ausência/zero, metas e idempotência do integrador.
- Homologação usa apenas usuários e vendas fictícios em banco isolado. Antes/depois no mesmo recorte: Bsan Shop/Amazon, faturamento R$ 6.202,00, margem das vendas R$ 0,00 e Ads R$ 200,00; margem após Ads permanece -R$ 200,00 e percentual passa de 0,00% a -3,22%. Temu mantém 15,00% sobre líquido, também no gráfico diário.
- Conferidos no navegador: consolidado de seis operações (R$ 72.345,00), busca e filtro, abertura da conta sem perder o período, atalho para Gerencial → Metas, referência de agosto ausente, intervalo sem vendas, gráficos ampliados com tabela de valores, redimensionamento dos gráficos recolhidos e controles de tendência. Perfil Gestor aprofunda somente as duas operações da carteira fictícia; outras operações macro conservam a leitura autorizada, com atalho gerencial desabilitado.
- Temas claro/escuro e largura de 390 px conferidos. Página sem transbordamento horizontal, números inteiros na largura dos cartões e rolagem interna das tabelas. Nenhum erro de console no fluxo verificado.
- Dados reais, fotos de fechamento, regras de bônus, conciliação financeira e APIs de coleta não são reprocessados. Não há alteração de backend ou concessão de acesso.
- A sincronização exibida vem da informação disponível na carga de extras, distinta da data da última venda do recorte. Quando não informada, a tela declara a ausência desse horário.
- Ausência de registro de Ads não confirma gasto zero. Série diária disponível fornece pesos; sem ela, conserva-se o rateio mensal vigente. A auditoria das fontes de Publicidade e Afiliados está na etapa 3.
- A homologação técnica não substitui a conferência gerencial dos dados oficiais, filtros, envios e entregas que o usuário reservou para sua revisão.

Módulos: `visual/resumos-modelo.js`, `visual/resumos-correcoes.js`, `visual/resumos.js` e `visual/resumos.css`. Integração idempotente em `visual/integrar.js`; Pipeline copia os quatro assets e registra a janela carregada no loader para distinguir recorte de competência mensal.
