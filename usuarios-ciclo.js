'use strict';

// Referências sem FK também existem no legado. Uma falha na conferência nunca libera exclusão.
function criarCiclo(db) {
  const ident = s => '"' + String(s).replace(/"/g, '""') + '"';
  async function schema(tx) {
    await tx.exec('CREATE TABLE IF NOT EXISTS usuario_ciclo (usuario_id BIGINT PRIMARY KEY REFERENCES usuarios(id), arquivado_em TEXT, ultimo_acesso TEXT)');
    // Só ID, autor e momento. Não retém nome, login, senha nem cópia do usuário excluído.
    await tx.exec('CREATE TABLE IF NOT EXISTS usuario_exclusoes (usuario_id BIGINT PRIMARY KEY, ator_id BIGINT NOT NULL, criado_em TEXT NOT NULL)');
  }
  async function estado(id, tx = db) { return await tx.get('SELECT * FROM usuario_ciclo WHERE usuario_id=?', [id]) || {}; }
  async function excluido(id, tx = db) { return !!await tx.get('SELECT 1 ok FROM usuario_exclusoes WHERE usuario_id=?', [id]); }
  async function marcar(tx, id) {
    await tx.run('INSERT INTO usuario_ciclo(usuario_id,ultimo_acesso) VALUES(?,?) ON CONFLICT(usuario_id) DO UPDATE SET ultimo_acesso=COALESCE(usuario_ciclo.ultimo_acesso,excluded.ultimo_acesso)', [id,new Date().toISOString()]);
  }
  async function tabelas(tx) {
    return db.IS_PG
      ? (await tx.all('SELECT table_name nome FROM information_schema.tables WHERE table_schema=current_schema() AND table_type=\'BASE TABLE\'' )).map(r=>r.nome)
      : (await tx.all("SELECT name nome FROM sqlite_master WHERE type='table'")).map(r=>r.nome);
  }
  async function vinculos(tx, u) {
    const motivos = [], tables = new Set(await tabelas(tx)), id = +u.id, state = await estado(id,tx);
    const aliases = new Set([u.nome,u.email,u.gestor_ref].filter(Boolean).map(s=>String(s).trim().toLowerCase()));
    const events = await tx.all('SELECT antes,depois FROM usuario_eventos WHERE usuario_id=?',[id]);
    for (const e of events) for (const value of [e.antes,e.depois]) if(value) {
      const data=JSON.parse(value);for(const k of ['nome','email','gestor_ref'])if(data[k])aliases.add(String(data[k]).trim().toLowerCase());
    }
    // O db-sync mantém estes cadastros iniciais. Arquivá-los preserva a chave e impede recriação.
    const automaticos=['weskley','coordenacao','ana.joao','david','hugo','larissa','marcos','maressa'].map(s=>s+'@grupobsan');
    if(automaticos.some(login=>aliases.has(login)))motivos.push('Este cadastro faz parte da sincronização inicial. Arquive para que ele não seja recriado.');
    if(state.ultimo_acesso)motivos.push('Esta conta já acessou o sistema.');
    if(await tx.get('SELECT 1 ok FROM usuario_eventos WHERE ator_id=? LIMIT 1',[id]))motivos.push('Há ações ou alterações de senha feitas por este usuário.');
    if(await tx.get('SELECT 1 ok FROM usuario_acesso WHERE atualizado_por=? AND usuario_id<>? LIMIT 1',[id,id]))motivos.push('Há alterações de acesso feitas por este usuário.');
    if(await tx.get('SELECT 1 ok FROM usuario_exclusoes WHERE ator_id=? LIMIT 1',[id]))motivos.push('Há exclusões registradas por este usuário.');
    const fold=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase(),values=new Set([...aliases].map(fold));
    for(const [table,col,label] of [['tratativas','gestor','Há tratativas vinculadas ao usuário ou à carteira.'],['comandos','pedido_por','Há comandos solicitados por este usuário.'],['tarefa_ajuste','por','Há ajustes de tarefas feitos por este usuário.']]) {
      if(tables.has(table)&&values.size){const refs=await tx.all('SELECT DISTINCT '+ident(col)+' valor FROM '+ident(table)+' WHERE '+ident(col)+' IS NOT NULL');if(refs.some(r=>values.has(fold(r.valor))))motivos.push(label);}
    }
    // Reconhece novas FKs e colunas de autoria, sem depender só da lista do legado.
    const own=new Set(['usuarios','usuario_acesso','usuario_eventos','usuario_ciclo','usuario_exclusoes']);
    let pgRefs=[];
    if(db.IS_PG){
      const fks=await tx.all("SELECT t.relname tabela,a.attname nome FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum=ANY(c.conkey) WHERE c.contype='f' AND c.confrelid='usuarios'::regclass AND n.nspname=current_schema()");
      const named=await tx.all("SELECT table_name tabela,column_name nome FROM information_schema.columns WHERE table_schema=current_schema() AND column_name IN ('usuario_id','user_id','autor_id','ator_id','criado_por','atualizado_por')");
      pgRefs=[...fks,...named];
    }
    for(const table of tables) if(!own.has(table)) {
      let columns;
      if(db.IS_PG) {
        columns=pgRefs.filter(c=>c.tabela===table).map(c=>c.nome);
      } else {
        const fks=await tx.all('PRAGMA foreign_key_list('+ident(table)+')');
        const named=await tx.all('PRAGMA table_info('+ident(table)+')');
        columns=[...fks.filter(c=>c.table==='usuarios').map(c=>c.from),...named.filter(c=>['usuario_id','user_id','autor_id','ator_id','criado_por','atualizado_por'].includes(c.name)).map(c=>c.name)];
      }
      for(const col of new Set(columns))if(await tx.get('SELECT 1 ok FROM '+ident(table)+' WHERE CAST('+ident(col)+' AS TEXT)=? LIMIT 1',[String(id)])){motivos.push('Há registros de autoria vinculados ao cadastro.');break;}
    }
    // Comissão histórica pertence à carteira, mesmo sem FK para a conta de acesso.
    if(tables.has('datasets')) {
      for(const row of await tx.all("SELECT json FROM datasets WHERE nome IN ('comissao','comissaoDet')")) {
        const data=JSON.parse(row.json||'[]');
        const visit=(v)=>{if(!v||typeof v!=='object')return false;if(Array.isArray(v))return v.some(visit);return Object.entries(v).some(([k,x])=>/^(gestor|nome|colaborador|responsavel)$/i.test(k)&&typeof x==='string'&&values.has(fold(x))||x&&typeof x==='object'&&visit(x));};
        if(visit(data)){motivos.push('Há registros de comissão vinculados à carteira.');break;}
      }
    }
    return [...new Set(motivos)];
  }
  return {schema,estado,excluido,marcar,vinculos};
}
module.exports={criarCiclo};
