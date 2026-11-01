# Usuários e acessos — Grupo Bsan

Administração disponível no menu da conta, exclusivamente à Direção. A página usa lista pesquisável e filtros de perfil, situação e carteira. Gerenciar abre Dados, Acessos e Histórico em painel lateral; no celular, ocupa a tela com ações de salvar sempre visíveis. Em Dados → Organização do cadastro, arquivar retira o usuário da lista padrão e encerra seu acesso. O filtro Arquivados permite restaurar; a restauração mantém o acesso desativado até uma reativação explícita.

Exclusão definitiva exige digitar o login, versão atual e conferência transacional no servidor. Só é permitida sem acesso observado e sem vínculos de autoria, carteira, comissão, ações de administração ou FKs. Identidades anteriores das edições também entram na conferência. Cadastros iniciais mantidos pelo db-sync são arquiváveis, para impedir que uma exclusão seja recriada na próxima sincronização. Falhas de consulta e referências novas não liberam exclusão. Não há exclusão automática ou em lote.

`usuarios-ciclo.js` fornece as verificações. `usuario_ciclo` guarda o arquivamento e a evidência de acesso a partir desta versão (não inventa acessos retroativos). `usuario_exclusoes` guarda somente o ID retirado, o ID do autor e o momento, para impedir reutilização e manter um registro mínimo da ação. A conta, credenciais e metadados administrativos do alvo são removidos; dados de negócio nunca são apagados por este fluxo. As duas tabelas são privadas da API, com RLS e sem privilégios públicos. A própria conta e a última Direção ativa permanecem protegidas.

## Contrato de acesso

`acessos.js` é compartilhado pelo servidor e pela interface. O perfil define o limite; o JSON individual guarda somente restrições. DRE e administração permanecem exclusivas da Direção; carteiras e alcance macro seguem as regras existentes. Leitura inclui exportações existentes, sem prometer impedir cópias de dados que o usuário já pode consultar.

| Recurso | Conteúdo / ações |
|---|---|
| Dados de vendas e resultados | Resultados, Vendas, Raio-X e Forecast compartilham a base |
| Gestão das operações | Panorama, Vendas da operação, Diagnóstico, Anúncios, Publicidade e Metas; exige vendas |
| Estoque e planejamento | Estoque, Projeção e dados de Full; Full exige também gestão e vendas |
| Envios | Consulta separada de lançamento/importação |
| Acompanhamento | Consulta separada do registro de tratativas; consultas auxiliares dão suporte à análise da tarefa |
| Comissão | Consulta no escopo atual; lançamento somente à Direção |
| DRE | Consulta e lançamento separados, ambos limitados à Direção |

As rotas são autorizadas antes do cache. Extras removem os datasets privados e versões de escrita sem permissão. Quando Metas está disponível e Comissão está bloqueada, os campos de bônus/teto saem das estruturas compartilhadas de metas. O cache macro continua compartilhado entre leitores autorizados; extras compartilham cache apenas com mesmo escopo e permissões efetivas. `/api/sessao` não é cacheado e lê o estado atual no banco.

## Persistência e credenciais

`usuarios.js` fornece operações transacionais por ID. Edição usa versão otimista e valida unicidade do login e vínculo da carteira. A Direção não pode desativar/destituir a própria conta nem remover a última Direção ativa. A autorização do ator é relida dentro da transação; concorrência de administração é serializada e, no Postgres, protegida por lock da tabela de usuários.

Novos usuários e redefinições recebem uma senha temporária individual exibida somente na resposta dessa ação. A troca é obrigatória antes de consultar dados. A senha temporária não é gravada no histórico, no armazenamento do navegador ou na lista. Senhas novas têm mínimo de oito caracteres; hashes continuam usando scrypt. Alterações de login, perfil, carteira ou situação revogam as sessões anteriores. Redefinição e troca de senha também incrementam a revogação.

O esquema é aditivo: `usuario_acesso` e `usuario_eventos`, sem atualizar contas existentes. A inicialização é idempotente. No Postgres, `usuarios` e as duas novas tabelas têm RLS ativado e privilégios públicos/anon/authenticated revogados; a API continua usando a conexão proprietária no servidor, sem depender de Supabase Auth. Não se deve criar políticas públicas para contornar bloqueios. O histórico registra autor, momento e campos alterados desde a implantação; não inventa registros retroativos.

## Integração e verificação

`visual/usuarios.js` e `visual/usuarios.css` são aplicados por `visual/integrar.js`, junto do contrato compartilhado. O loader é definido antes da inicialização do módulo de usuários; a administração antiga é removida pelo gerador. O Pipeline copia `usuarios.js`, `acessos.js` e os novos assets ao pacote. O filtro de navegação mantém Full no Gerencial e Forecast em Resultados.

Verificação: `node --test tests/usuarios.test.js`; testes HTTP do servidor real em banco SQLite só com contas fictícias; teste Postgres em namespace próprio revertido por transação; conferência de RLS/grants; navegação no navegador, cadastro inválido, versão, dados e permissões por perfil, salvamento/restrição, histórico, desativação e restauração; temas e largura de 390 px. O teste Postgres não altera contas reais.

Em regressão visual, manter o backend de autenticação e reverter apenas a interface. Um backend anterior não reconhece a revogação e a troca obrigatória de senhas individuais. Não restaurar senhas, apagar histórico ou reabrir privilégios públicos como procedimento de rollback.
