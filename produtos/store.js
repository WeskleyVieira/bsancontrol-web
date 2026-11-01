"use strict";
const fs = require('node:fs');
const path = require('node:path');
const SCHEMA = `
CREATE TABLE IF NOT EXISTS prd_migracoes (versao INTEGER PRIMARY KEY, aplicada_em TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS prd_produtos (
 id TEXT PRIMARY KEY, ponto TEXT NOT NULL CHECK(ponto IN ('Bsan','Powerfull')), sku TEXT NOT NULL, sku_chave TEXT NOT NULL,
 nome TEXT NOT NULL, tipo TEXT NOT NULL, situacao TEXT NOT NULL, data_original TEXT, ncm TEXT, marca TEXT, categoria TEXT,
 altura_cm REAL, largura_cm REAL, comprimento_cm REAL, peso_kg REAL, criado_em TEXT NOT NULL, atualizado_em TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_prd_sku ON prd_produtos(ponto,sku_chave);
CREATE TABLE IF NOT EXISTS prd_erp (
 conta TEXT NOT NULL, erp_id TEXT NOT NULL, produto_id TEXT NOT NULL REFERENCES prd_produtos(id),
 fonte TEXT NOT NULL, visto_em TEXT NOT NULL, PRIMARY KEY(conta,erp_id));
CREATE TABLE IF NOT EXISTS prd_detalhes (
 produto_id TEXT PRIMARY KEY REFERENCES prd_produtos(id), dados TEXT NOT NULL, fonte TEXT NOT NULL, importado_em TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS prd_custos (
 id TEXT PRIMARY KEY, produto_id TEXT NOT NULL REFERENCES prd_produtos(id), versao INTEGER NOT NULL,
 produto_centavos BIGINT, embalagem_centavos BIGINT, total_centavos BIGINT,
 estado TEXT NOT NULL CHECK(estado IN ('importado','rascunho','aprovado','rejeitado')),
 fonte TEXT NOT NULL, fonte_chave TEXT UNIQUE, observacao TEXT NOT NULL, autor_id TEXT NOT NULL,
 criado_em TEXT NOT NULL, aprovado_por TEXT, aprovado_em TEXT, UNIQUE(produto_id,versao));
CREATE TABLE IF NOT EXISTS prd_entradas (
 id TEXT PRIMARY KEY, ponto TEXT NOT NULL, sku TEXT NOT NULL, sku_chave TEXT NOT NULL, nome TEXT NOT NULL,
 produto_centavos BIGINT, embalagem_centavos BIGINT, total_centavos BIGINT, data_original TEXT,
 produto_id TEXT REFERENCES prd_produtos(id), estado TEXT NOT NULL CHECK(estado IN ('aguardando_vinculo','vinculada')),
 fonte TEXT NOT NULL, fonte_chave TEXT UNIQUE, observacao TEXT NOT NULL, autor_id TEXT NOT NULL, criado_em TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_prd_entrada_sku ON prd_entradas(ponto,sku_chave);
CREATE TABLE IF NOT EXISTS prd_pendencias (
 id TEXT PRIMARY KEY, produto_id TEXT NOT NULL REFERENCES prd_produtos(id), tipo TEXT NOT NULL,
 responsavel TEXT NOT NULL, estado TEXT NOT NULL CHECK(estado IN ('aberta','resolvida')),
 detalhe TEXT NOT NULL, criado_em TEXT NOT NULL, atualizado_em TEXT NOT NULL, UNIQUE(produto_id,tipo));
CREATE TABLE IF NOT EXISTS prd_eventos (
 id TEXT PRIMARY KEY, produto_id TEXT REFERENCES prd_produtos(id), ator_id TEXT NOT NULL, acao TEXT NOT NULL,
 dados TEXT NOT NULL, criado_em TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS prd_acessos (
 usuario_id TEXT NOT NULL, ponto TEXT NOT NULL CHECK(ponto IN ('Bsan','Powerfull')),
 operacional INTEGER NOT NULL CHECK(operacional IN (0,1)), custo_ler INTEGER NOT NULL CHECK(custo_ler IN (0,1)),
 custo_editar INTEGER NOT NULL CHECK(custo_editar IN (0,1)), custo_aprovar INTEGER NOT NULL CHECK(custo_aprovar IN (0,1)),
 PRIMARY KEY(usuario_id,ponto));
CREATE TABLE IF NOT EXISTS prd_sincronizacoes (
 id TEXT PRIMARY KEY, fonte TEXT NOT NULL, hash TEXT NOT NULL, iniciado_em TEXT NOT NULL,
 concluido_em TEXT NOT NULL, quantidade INTEGER NOT NULL, UNIQUE(fonte,hash));
CREATE TABLE IF NOT EXISTS prd_integracoes (
 chave TEXT PRIMARY KEY, estado TEXT NOT NULL, ultima_tentativa TEXT NOT NULL, ultimo_sucesso TEXT,
 referencia TEXT, detalhe TEXT NOT NULL, dados TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS prd_logistica (
 produto_id TEXT PRIMARY KEY REFERENCES prd_produtos(id), assinatura TEXT NOT NULL, versao INTEGER NOT NULL,
 unidade_dimensao TEXT NOT NULL, unidade_peso TEXT NOT NULL, observacao TEXT NOT NULL, ator_id TEXT NOT NULL, conferido_em TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS prd_equivalencias (
 produto_a TEXT NOT NULL REFERENCES prd_produtos(id), produto_b TEXT NOT NULL REFERENCES prd_produtos(id),
 estado TEXT NOT NULL CHECK(estado IN ('mesmo_produto','distintos','revogada')), versao INTEGER NOT NULL, assinatura_a TEXT NOT NULL, assinatura_b TEXT NOT NULL,
 observacao TEXT NOT NULL, ator_id TEXT NOT NULL, atualizado_em TEXT NOT NULL, PRIMARY KEY(produto_a,produto_b), CHECK(produto_a<produto_b));
CREATE TABLE IF NOT EXISTS prd_materiais (
 id TEXT PRIMARY KEY, ponto TEXT NOT NULL CHECK(ponto IN ('Bsan','Powerfull')), codigo TEXT NOT NULL, codigo_chave TEXT NOT NULL,
 nome TEXT NOT NULL, tipo TEXT NOT NULL CHECK(tipo IN ('produto','insumo','embalagem')), criado_em TEXT NOT NULL, UNIQUE(ponto,codigo_chave));
CREATE TABLE IF NOT EXISTS prd_material_versoes (
 id TEXT PRIMARY KEY, material_id TEXT NOT NULL REFERENCES prd_materiais(id), versao INTEGER NOT NULL,
 unidade TEXT NOT NULL, quantidade_base TEXT NOT NULL, custo_micro BIGINT, gratuito INTEGER NOT NULL,
 observacao TEXT NOT NULL, autor_id TEXT NOT NULL, criado_em TEXT NOT NULL, UNIQUE(material_id,versao));
CREATE TABLE IF NOT EXISTS prd_composicoes (
 id TEXT PRIMARY KEY, produto_id TEXT NOT NULL REFERENCES prd_produtos(id), versao INTEGER NOT NULL,
 linhas TEXT NOT NULL, snapshot TEXT NOT NULL, estado TEXT NOT NULL, custo_id TEXT UNIQUE REFERENCES prd_custos(id),
 observacao TEXT NOT NULL, autor_id TEXT NOT NULL, criado_em TEXT NOT NULL, UNIQUE(produto_id,versao));
CREATE TABLE IF NOT EXISTS prd_conferencias_custo (
 id TEXT PRIMARY KEY, ponto TEXT NOT NULL CHECK(ponto IN ('Bsan','Powerfull')), versao INTEGER NOT NULL,
 conteudo TEXT NOT NULL, sha256 TEXT NOT NULL, observacao TEXT NOT NULL, autor_id TEXT NOT NULL, criado_em TEXT NOT NULL,
 UNIQUE(ponto,versao));
CREATE TABLE IF NOT EXISTS prd_vigencias_custo (
 id TEXT PRIMARY KEY, produto_id TEXT NOT NULL REFERENCES prd_produtos(id), versao INTEGER NOT NULL,
 conteudo TEXT NOT NULL, sha256 TEXT NOT NULL, autor_id TEXT NOT NULL, criado_em TEXT NOT NULL,
 UNIQUE(produto_id,versao));
CREATE TABLE IF NOT EXISTS prd_apuracoes_custo (
 id TEXT PRIMARY KEY, ponto TEXT NOT NULL CHECK(ponto IN ('Bsan','Powerfull')), operacao TEXT NOT NULL, versao INTEGER NOT NULL,
 conteudo TEXT NOT NULL, sha256 TEXT NOT NULL, autor_id TEXT NOT NULL, criado_em TEXT NOT NULL,
 UNIQUE(ponto,operacao,versao));
CREATE TABLE IF NOT EXISTS prd_embalagens (
 id TEXT PRIMARY KEY, ponto TEXT NOT NULL CHECK(ponto IN ('Bsan','Powerfull')), codigo TEXT NOT NULL, codigo_chave TEXT NOT NULL,
 nome TEXT NOT NULL, familia TEXT NOT NULL, tamanho TEXT NOT NULL, criado_em TEXT NOT NULL, UNIQUE(ponto,codigo_chave));
CREATE TABLE IF NOT EXISTS prd_embalagem_versoes (
 id TEXT PRIMARY KEY, embalagem_id TEXT NOT NULL REFERENCES prd_embalagens(id), versao INTEGER NOT NULL, snapshot TEXT NOT NULL,
 estado TEXT NOT NULL CHECK(estado IN ('rascunho','aprovado')), observacao TEXT NOT NULL, autor_id TEXT NOT NULL, criado_em TEXT NOT NULL,
 aprovado_por TEXT, aprovado_em TEXT, UNIQUE(embalagem_id,versao));
CREATE TABLE IF NOT EXISTS prd_fichas_embalagem (
 id TEXT PRIMARY KEY, ponto TEXT NOT NULL CHECK(ponto IN ('Bsan','Powerfull')), codigo TEXT NOT NULL, codigo_chave TEXT NOT NULL,
 nome TEXT NOT NULL, familia TEXT NOT NULL, tamanho TEXT NOT NULL, criado_em TEXT NOT NULL, UNIQUE(ponto,codigo_chave));
CREATE TABLE IF NOT EXISTS prd_ficha_embalagem_versoes (
 id TEXT PRIMARY KEY, ficha_id TEXT NOT NULL REFERENCES prd_fichas_embalagem(id), versao INTEGER NOT NULL, snapshot TEXT NOT NULL,
 observacao TEXT NOT NULL, autor_id TEXT NOT NULL, criado_em TEXT NOT NULL, UNIQUE(ficha_id,versao));
INSERT INTO prd_migracoes(versao,aplicada_em) VALUES(1,'2026-10-24') ON CONFLICT(versao) DO NOTHING;
INSERT INTO prd_migracoes(versao,aplicada_em) VALUES(2,'2026-10-24') ON CONFLICT(versao) DO NOTHING;
CREATE TABLE IF NOT EXISTS prd_consumidores (ponto TEXT NOT NULL,sku TEXT NOT NULL,produto_id TEXT NOT NULL REFERENCES prd_produtos(id),assinatura TEXT NOT NULL,versao INTEGER NOT NULL,autor_id TEXT NOT NULL,criado_em TEXT NOT NULL,PRIMARY KEY(ponto,sku));
CREATE TABLE IF NOT EXISTS prd_publicacoes (id TEXT PRIMARY KEY,ponto TEXT NOT NULL,versao INTEGER NOT NULL,conteudo TEXT NOT NULL,sha256 TEXT NOT NULL,autor_id TEXT NOT NULL,criado_em TEXT NOT NULL,UNIQUE(ponto,versao));
`;
async function openStore({ sqliteFile, connectionString, pool: suppliedPool } = {}) {
  let raw, pool, driver;
  if (connectionString || suppliedPool) {
    if (sqliteFile) throw new Error('Escolha um único banco para Produtos.');
    if (suppliedPool) pool = suppliedPool;
    else { let pg;try{pg=require('pg');}catch{pg=require(path.join(require('node:os').homedir(),'.bsancontrol','deps','node_modules','pg'));}pool=new pg.Pool({connectionString,max:3,ssl:{rejectUnauthorized:true,ca:fs.readFileSync(path.join(__dirname,'../supabase-ca.pem'),'utf8')}}); }
    const placeholders = sql => { let n = 0; return sql.replace(/\?/g, () => '$' + (++n)); };
    const clientDriver = client => ({
      all: async (sql, args = []) => (await client.query(placeholders(sql), args)).rows,
      get: async (sql, args = []) => (await client.query(placeholders(sql), args)).rows[0] || null,
      run: async (sql, args = []) => client.query(placeholders(sql), args),
      exec: sql => client.query(sql)
    });
    driver = clientDriver(pool);
    // Explicit private schema; no reliance on public default grants or RLS claims from the legacy JWT.
    const qualify = sql => sql.replace(/\b(prd_(?:migracoes|produtos|erp|detalhes|custos|entradas|pendencias|eventos|acessos|sincronizacoes|integracoes|logistica|equivalencias|materiais|material_versoes|composicoes|conferencias_custo|vigencias_custo|apuracoes_custo|embalagens|embalagem_versoes|fichas_embalagem|ficha_embalagem_versoes|consumidores|publicacoes))\b/g, 'bsan_produtos.$1');
    const wrap = d => ({ kind: 'postgres', all: (s,a) => d.all(qualify(s),a), get: (s,a) => d.get(qualify(s),a), run: (s,a) => d.run(qualify(s),a), exec: s => d.exec(qualify(s)) });
    driver = wrap(driver);
    driver.transaction = async fn => {
      const client = await pool.connect();
      try { await client.query('BEGIN'); const r = await fn(wrap(clientDriver(client))); await client.query('COMMIT'); return r; }
      catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    };
    let installed=0;
    try{installed=Number((await pool.query('SELECT MAX(versao) AS v FROM bsan_produtos.prd_migracoes')).rows[0]?.v||0);}catch(e){if(!['42P01','3F000'].includes(e.code))throw e;}
    if(installed>=12){
      const check=(await pool.query("SELECT count(DISTINCT c.oid)::int AS n,bool_and(c.relrowsecurity) AS safe,coalesce(bool_or(has_table_privilege(r.oid,c.oid,'SELECT,INSERT,UPDATE,DELETE')),false) AS exposed FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_roles r ON r.rolname IN ('anon','authenticated') WHERE n.nspname='bsan_produtos' AND c.relkind='r'")).rows[0];
      if(Number(check.n)!==25||!check.safe||check.exposed)throw Error('A configuração privada do banco Produtos precisa ser conferida.');
    }else{
    await pool.query('CREATE SCHEMA IF NOT EXISTS bsan_produtos; REVOKE ALL ON SCHEMA bsan_produtos FROM PUBLIC;');
    await driver.exec(SCHEMA);
    for (const table of ['migracoes','produtos','erp','detalhes','custos','entradas','pendencias','eventos','acessos','sincronizacoes','integracoes','logistica','equivalencias','materiais','material_versoes','composicoes','conferencias_custo','vigencias_custo','apuracoes_custo','embalagens','embalagem_versoes','fichas_embalagem','ficha_embalagem_versoes','consumidores','publicacoes'])
      await pool.query(`ALTER TABLE bsan_produtos.prd_${table} ENABLE ROW LEVEL SECURITY;`);
    await pool.query('REVOKE ALL ON ALL TABLES IN SCHEMA bsan_produtos FROM PUBLIC;');
    await pool.query(`DO $$ BEGIN
      IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
        REVOKE ALL ON SCHEMA bsan_produtos FROM anon; REVOKE ALL ON ALL TABLES IN SCHEMA bsan_produtos FROM anon;
      END IF;
      IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
        REVOKE ALL ON SCHEMA bsan_produtos FROM authenticated; REVOKE ALL ON ALL TABLES IN SCHEMA bsan_produtos FROM authenticated;
      END IF;
      END $$;`);
    }
    driver.close = async () => { if (!suppliedPool) await pool.end(); };
    driver.kind = 'postgres';
  } else {
    if (!sqliteFile) throw new Error('Informe um arquivo isolado para o banco de Produtos.');
    if (sqliteFile !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(sqliteFile)), { recursive: true });
    const { DatabaseSync } = require('node:sqlite'); raw = new DatabaseSync(sqliteFile);
    raw.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
    driver = {
      all: async (s,a=[]) => raw.prepare(s).all(...a), get: async (s,a=[]) => raw.prepare(s).get(...a) || null,
      run: async (s,a=[]) => raw.prepare(s).run(...a), exec: async s => raw.exec(s),
      transaction: async fn => { raw.exec('BEGIN IMMEDIATE'); try { const r = await fn(driver); raw.exec('COMMIT'); return r; } catch(e) { raw.exec('ROLLBACK'); throw e; } },
      close: async () => raw.close(), kind: 'sqlite'
    };
    await driver.exec(SCHEMA);
  }
  await driver.transaction(async tx=>{
    if(!await tx.get('SELECT versao FROM prd_migracoes WHERE versao=3')){
      await tx.exec('ALTER TABLE prd_produtos ADD COLUMN gtin TEXT; ALTER TABLE prd_produtos ADD COLUMN tipo_variacao TEXT;');
      await tx.run('INSERT INTO prd_migracoes(versao,aplicada_em) VALUES(3,?)',[new Date().toISOString()]);
    }
    if(!await tx.get('SELECT versao FROM prd_migracoes WHERE versao=4')){
      await tx.exec('ALTER TABLE prd_acessos ADD COLUMN versao INTEGER NOT NULL DEFAULT 1;');
      await tx.run('INSERT INTO prd_migracoes(versao,aplicada_em) VALUES(4,?)',[new Date().toISOString()]);
    }
    if(!await tx.get('SELECT versao FROM prd_migracoes WHERE versao=5')){
      await tx.exec("ALTER TABLE prd_produtos ADD COLUMN logistica_estado TEXT NOT NULL DEFAULT 'nao_informada'; ALTER TABLE prd_produtos ADD COLUMN diametro_cm REAL; ALTER TABLE prd_produtos ADD COLUMN peso_liquido_kg REAL; ALTER TABLE prd_produtos ADD COLUMN embalagem_tipo INTEGER; ALTER TABLE prd_produtos ADD COLUMN embalagem_descricao TEXT;");
      await tx.run('INSERT INTO prd_migracoes(versao,aplicada_em) VALUES(5,?)',[new Date().toISOString()]);
    }
    if(!await tx.get('SELECT versao FROM prd_migracoes WHERE versao=6')){
      await tx.exec('ALTER TABLE prd_produtos ADD COLUMN custo_recalcular INTEGER NOT NULL DEFAULT 0;');
      await tx.run('INSERT INTO prd_migracoes(versao,aplicada_em) VALUES(6,?)',[new Date().toISOString()]);
    }
    await tx.run('INSERT INTO prd_migracoes(versao,aplicada_em) VALUES(7,?) ON CONFLICT(versao) DO NOTHING',[new Date().toISOString()]);
    await tx.run('INSERT INTO prd_migracoes(versao,aplicada_em) VALUES(8,?) ON CONFLICT(versao) DO NOTHING',[new Date().toISOString()]);
    await tx.run('INSERT INTO prd_migracoes(versao,aplicada_em) VALUES(9,?) ON CONFLICT(versao) DO NOTHING',[new Date().toISOString()]);
    await tx.run('INSERT INTO prd_migracoes(versao,aplicada_em) VALUES(10,?) ON CONFLICT(versao) DO NOTHING',[new Date().toISOString()]);
    await tx.run('INSERT INTO prd_migracoes(versao,aplicada_em) VALUES(11,?) ON CONFLICT(versao) DO NOTHING',[new Date().toISOString()]);
    await tx.run('INSERT INTO prd_migracoes(versao,aplicada_em) VALUES(12,?) ON CONFLICT(versao) DO NOTHING',[new Date().toISOString()]);
  });
  // Serialize all service operations, including reads, so one request never joins another request's transaction.
  let queue = Promise.resolve();
  driver.exclusive = fn => { const next = queue.then(() => fn(driver)); queue = next.catch(() => {}); return next; };
  return driver;
}
module.exports = { openStore, SCHEMA };
