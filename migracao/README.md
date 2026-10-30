# Integração visual — Grupo Bsan

Esta branch integra cabeçalho, filtros, formulários de Envios/DRE/Comissão, importação de Envios, leitura da Comissão e gravação com versão. Base: `c33e2e774859d803fc8ba6e50cd9dba32fd89126`. Não constitui a migração visual de todas as demais páginas.

## Validação em 30/10/2026

- 76 testes automatizados aprovados: navegação, escopo, preservação das funções financeiras, formulários, importação, versão dos dados, fotografia fechada, leitura da Comissão e integração regenerável.
- Sete cenários adicionais executados no Postgres real, por meio do `dbx.js` do projeto, com duas conexões: contrato de tabela e TLS, perfis/versão obrigatória, criação concorrente, atualização concorrente com recuperação, atualização externa entre leitura e UPDATE, fotografia de agosto e gravação idêntica.
- DDL e DML do ensaio restritos a um schema privado com nome aleatório, já removido. Não houve escrita em lançamentos, vendas, usuários ou fotografias oficiais. O banco oficial foi consultado somente para metadados e para copiar a comissão para o ensaio.
- Duas execuções do gerador produziram o mesmo HTML. O código resultante corresponde ao painel validado, com diferenças apenas de comentários. O guard existente continua recusando a perda de código adicional do destino.
- Nenhuma credencial, configuração de conexão ou cópia dos dados de vendas entra nesta branch. O HTML online mantém login normal e não contém a identidade do laboratório.

## Instalação como unidade

Publicar `acompanhamento.html`, `api.js` e `datasets-versionados.js` juntos. Não mudar as variáveis de ambiente, o certificado, o login ou os perfis. Não há migração de esquema oficial nem reprocessamento de vendas/comissões.

A API exige a versão lida pelo formulário. Página antiga sem versão recebe 428 e não grava. Conflito recebe 409; a página nova mantém o preenchimento, relê os dados e pede nova conferência. Após a atualização, sessões antigas precisam recarregar a página. A ausência de versão não deve ser contornada no servidor.

Depois da publicação, verificar login e escopo dos três perfis, filtros/competência, entrada/importação com confirmação, distinção entre fotografia fechada e apuração e preservação dos dados ao atualizar a base. Não usar lançamentos oficiais fictícios para testar gravação.

## Fonte regenerável do Drive

`BsanControl.patch` contém somente alterações de código e interface, sem embeds de vendas. Foi gerado contra a fonte vigente em 30/10/2026. Antes de aplicar, conferir o diff contra a fonte do dia: atualizações de vendas podem ter ocorrido desde a preparação. Usar checagem do patch antes de qualquer escrita; não forçar uma aplicação que falhe.

O `build-online.js` deste diretório substitui o gerador no Pipeline somente junto com a fonte integrada. `api.js` e `datasets-versionados.js` da raiz também precisam estar no Pipeline. O gerador agora copia `vendas-pagina.js` e `datasets-versionados.js`, além das dependências anteriores. Ele mantém as proteções contra embeds públicos e perda de código.

A correção já publicada da abertura Shopee foi portada para a fonte: cupom já deduzido é informativo, sem insinuar nova dedução. Fórmulas e valores não foram alterados.

As cópias completas da fonte, com os dados locais, permanecem fora do Git no diretório privado de auditoria. Não substituí-las sobre uma fonte que tenha sido atualizada em segundo plano; gerar novamente a integração a partir da fonte vigente.

## Reversão

Reverter o commit de integração e republicar página e API juntas. Não restaurar backup do banco e não reprocessar mês fechado: o formato dos datasets permanece o mesmo. Para a fonte local, reverter somente o código do patch após conferir a versão vigente; não restaurar um HTML antigo inteiro sobre dados atualizados.

Interromper a publicação se houver falha de login/perfil, arquivo exigido ausente, HTTP 500 na gravação, alteração da fotografia fechada ou diferença de valores fora da precisão publicada. Um 409 em conflito real é o comportamento esperado, não motivo para desativar a proteção.
