# Contrato para a integração do layout

A prévia demonstra o comportamento, mas não modifica consultas ou permissões do BsanControl publicado.

1. O catálogo descreve os recursos disponíveis; a preferência escolhe quais instanciar. Não carregar dados de um recurso apenas para mantê-lo escondido.
2. Autorizar cada consulta no servidor usando o usuário autenticado, ponto e carteira. O seletor de perfil da prévia não é autorização e não pode ser levado para produção como controle de acesso.
3. Consultas compatíveis podem compartilhar uma base por contexto. A chave deve incluir identidade e revisão das restrições, ponto, empresa, marketplace, datas, competência quando aplicável, operações selecionadas, regra de margem, agrupamento e revisão da fonte. Invalide no logout e nas mudanças de autorização ou dados.
4. Descartar resposta que chegue após a troca de contexto. Cancelar consultas sem consumidores, liberar gráficos e observadores ao retirar o bloco. A prévia cancela por geração da tela; a integração pode manter consumidores de consultas compartilhadas por referência.
5. Manter o denominador das curvas anterior à busca; recalcular somente quando o escopo ou o critério mudar. SKU agregado não tem ID único. Estoque físico compartilhado não pode ser somado por marketplace.
6. Não estimar fonte ausente como zero. Diferenciar não aplicável, zero confirmado, estimativa de rateio e pendência. Sem Ads confirmado, Pós-Ads conserva a contribuição Pré-Ads.
7. Usar os modelos financeiros e de forecast existentes. A apresentação da comissão fechada não congela metas operacionais. Publicidade de mídia, afiliados e soma têm definições distintas. Metas de gasto e TACOS mantêm diário e acumulado.
8. Preferências pertencem ao usuário autenticado em produção, com versão de catálogo e restauração segura. A prévia usa apenas aba e perfil simulado no armazenamento local. Não sincroniza dispositivos ou usuários reais.
9. Medir início da navegação até o primeiro resumo útil, consultas e bytes por família, tempo de consulta/renderização e abertura de um bloco adicional. Comparar o mesmo usuário, contexto e revisão de dados; não usar esta base fictícia como benchmark da produção.

Os modelos demonstrativos podem ser substituídos por adaptadores das fontes originais sem manter os valores, fórmulas simplificadas ou decisões simuladas desta proposta.
