# Grupo Bsan — Vendas da operação e Metas

## Correções

- A abertura de custos/envio era aplicada uma vez e o cache guardava apenas `ok`. Ao recarregar o DETALHE, as novas linhas perdiam os campos e o cache impedia sua reaplicação. O índice da operação agora é reaplicado nas novas linhas e invalidado por identidade, versão da base ou prazo de cache. Consultas simultâneas compartilham a leitura; resposta da sessão anterior é descartada.
- A API compacta omitira zeros, enquanto a tabela passou a interpretar campo ausente como indisponível. O contrato mantém os zeros compactos e agora explicita `null` para fonte sem valor. O enriquecimento distingue zero conhecido de ausência. Preço, comissão, desconto/cupom, envio e componentes também aparecem no detalhe da linha quando disponíveis. Campo ausente não é preenchido por estimativa.
- Falha da abertura deixa aviso e botão de nova tentativa, sem provocar consultas repetidas em cada renderização. O acesso continua por operação/carteira; a base macro não passa a transportar todos os componentes de todas as vendas.
- A meta **Ads e afiliados** passou a se chamar **Gastos com publicidade**. Identificadores, cálculos, objetivos e valores de remuneração foram preservados.
- Os cards mensais tinham valores, mas os gráficos diário/acumulado exigiam uma série completa e conciliada. Quando essa série falta, o painel agora apresenta **comparação mensal entre valor informado e orçamento/teto**, com período e limitação explícitos. Não mostra um plano diário sozinho como se houvesse leitura realizada. As opções Diário/Acumulado continuam para séries completas; o TACOS acumulado usa somas de gasto e faturamento, nunca a soma de percentuais diários.
- A abertura das fontes conserva os dias de Product Ads que chegaram, separados do indicador completo. Afiliados mensais não são distribuídos pelos dias; comissões congeladas não são reconstituídas artificialmente.

## Origem dos dados

Na conferência de outubro, a operação Amazon tinha valor mensal de publicidade e nenhuma linha Amazon no dataset diário. O coletor/importador disponível não fornece essa abertura diária. A alteração da interface aproveita o total mensal existente e explicita a lacuna; não cria uma nova coleta Amazon Ads nem afirma cobertura diária que a fonte não tem. Onde existem Product Ads diários e faltam afiliados diários, os componentes permanecem separados.

O pedido Amazon indicado foi conferido no PostgreSQL somente com SELECT: a origem de liquidação possui envio, preço cheio e comissão; o desconto está informado como zero. A API e o enriquecimento corrigidos conservaram esses dados mesmo após substituir as linhas. A evidência privada registra as verificações, sem exportar valores ou itens do pedido para este repositório.

## Validação

- **459 testes aprovados**, sem falhas ou ignorados. As 18 novas regressões cobrem reaplicação, chaves de pedido/SKU/dia/canal, zero/null, falha/nova tentativa, concorrência, troca de identidade, versão da base, comparação mensal, fonte ausente e preservação da série diária completa.
- Navegador com banco fictício: Todas as colunas, detalhe, recarga de linhas, falha/retry da abertura, metas de publicidade e TACOS com e sem série diária, temas claro/escuro e largura de 390 px. Nenhum erro JavaScript nesses percursos.
- Integração idempotente e compilação dos scripts inline. Fontes e gerador recebem os auxiliares para não perder a correção na próxima compilação.
- Sem alterações de vendas, custos oficiais, metas cadastradas, comissão congelada ou estoque. Não foram executadas coletas externas nem enviadas mensagens.

Retorno técnico: reverter somente esta entrega sobre `972a133`, preservando dados e demais módulos. Não há migração de banco nesta correção.
