'use strict';
// servico-tokens.js — TOKENS DE SERVIÇO SÓ DE LEITURA (24/11/2026, pedido do Otto — IA de operação do Weskley, roda no Grok).
//
// Por quê: o Otto lia o BsanControl pela tela (lento, trava o Render). Um token de serviço deixa ele chamar a API direto.
// Regras (decididas com o Weskley):
//   • o token pertence a um USUÁRIO do painel (ex.: "Otto – Direção") e herda o perfil e as RESTRIÇÕES dele (DRE, custos…);
//   • SÓ LEITURA: qualquer método que não seja GET é recusado na entrada, e as rotas de administração, Financeiro da Direção,
//     Pós-venda (dados de cliente) e Produtos ficam fora, mesmo em GET;
//   • revogável a qualquer momento (revogado_em) e morre junto se o usuário for desativado/revogado (revogacao do usuário);
//   • o banco guarda só o HASH (sha256) — o token em texto aparece UMA vez, na criação;
//   • cada uso fica registrado (tokens_servico_uso: rota, consulta, horário), guardado 90 dias.
const crypto = require('node:crypto');

const PREFIXO = 'bsk_';
const RETENCAO_DIAS = 90;
// rotas que um token de serviço nunca alcança, nem em GET
const BLOQUEADAS = [/^\/api\/admin\//, /^\/api\/gestao\//, /^\/api\/pos-venda(\/|$)/, /^\/api\/produtos(\/|$)/, /^\/api\/trocar-senha$/, /^\/api\/login$/, /^\/api\/cache\//];

const hash = t => crypto.createHash('sha256').update(String(t)).digest('hex');
const ehTokenServico = t => typeof t === 'string' && t.startsWith(PREFIXO);

function criarServicoTokens(db) {
  let pronto = null, ultimaLimpeza = 0;
  const marcados = new Map();   // token_id → último "ultimo_uso" gravado (não grava a cada chamada)

  async function schema() {
    if (!pronto) pronto = (async () => {
      await db.exec(`CREATE TABLE IF NOT EXISTS tokens_servico (id TEXT PRIMARY KEY, usuario_id BIGINT NOT NULL, nome TEXT NOT NULL,
        hash TEXT NOT NULL UNIQUE, final TEXT, revogacao INTEGER NOT NULL DEFAULT 0, criado_em TEXT NOT NULL, criado_por TEXT,
        expira_em TEXT, revogado_em TEXT, revogado_por TEXT, ultimo_uso TEXT)`);
      await db.exec(`CREATE TABLE IF NOT EXISTS tokens_servico_uso (id TEXT PRIMARY KEY, token_id TEXT NOT NULL, metodo TEXT, rota TEXT,
        consulta TEXT, permitido INTEGER, em TEXT NOT NULL)`);
      await db.exec('CREATE INDEX IF NOT EXISTS idx_tokens_servico_uso ON tokens_servico_uso(token_id, em)');
      if (db.IS_PG) for (const t of ['tokens_servico', 'tokens_servico_uso']) {
        await db.exec('ALTER TABLE ' + t + ' ENABLE ROW LEVEL SECURITY');
        await db.exec('REVOKE ALL ON TABLE ' + t + ' FROM PUBLIC');
      }
    })().catch(e => { pronto = null; throw e; });
    return pronto;
  }

  // cria um token p/ o usuário (pelo e-mail/login). Devolve o texto do token UMA vez.
  async function criar({ email, nome, dias = 90, criadoPor = 'linha de comando' }) {
    await schema();
    const u = await db.get('SELECT id, nome, perfil, ativo FROM usuarios WHERE LOWER(email)=?', [String(email || '').trim().toLowerCase()]);
    if (!u) throw new Error('usuário não encontrado: ' + email);
    if (!+u.ativo) throw new Error('usuário inativo: ' + email);
    // revogação vigente do usuário: o token morre se ela mudar (desativação/troca de perfil). Base nova ainda sem a tabela → 0.
    const m = await db.get('SELECT revogacao FROM usuario_acesso WHERE usuario_id=?', [u.id]).catch(() => null);
    const token = PREFIXO + crypto.randomBytes(32).toString('base64url');
    const id = crypto.randomUUID(), agora = new Date();
    const expira = dias > 0 ? new Date(agora.getTime() + dias * 864e5).toISOString() : null;
    await db.run('INSERT INTO tokens_servico(id,usuario_id,nome,hash,final,revogacao,criado_em,criado_por,expira_em) VALUES(?,?,?,?,?,?,?,?,?)',
      [id, u.id, String(nome || u.nome).slice(0, 80), hash(token), token.slice(-4), m ? +m.revogacao : 0, agora.toISOString(), criadoPor, expira]);
    return { id, token, usuario: u.nome, perfil: u.perfil, expira_em: expira };
  }

  async function listar() {
    await schema();
    return db.all(`SELECT t.id, t.nome, u.email, u.perfil, t.final, t.criado_em, t.expira_em, t.revogado_em, t.ultimo_uso,
      (SELECT COUNT(*) FROM tokens_servico_uso s WHERE s.token_id=t.id) AS usos FROM tokens_servico t LEFT JOIN usuarios u ON u.id=t.usuario_id ORDER BY t.criado_em DESC`);
  }

  async function revogar(id, por = 'linha de comando') {
    await schema();
    const r = await db.get('SELECT id, revogado_em FROM tokens_servico WHERE id=?', [String(id)]);
    if (!r) throw new Error('token não encontrado: ' + id);
    if (r.revogado_em) return { id, ja_revogado: r.revogado_em };
    await db.run('UPDATE tokens_servico SET revogado_em=?, revogado_por=? WHERE id=?', [new Date().toISOString(), por, String(id)]);
    return { id, revogado: true };
  }

  async function usos(id, limite = 50) {
    await schema();
    return db.all('SELECT metodo, rota, consulta, permitido, em FROM tokens_servico_uso WHERE token_id=? ORDER BY em DESC LIMIT ?', [String(id), limite]);
  }

  // token em texto → { tokenId, usuarioId, revogacao } se válido; null se não existe/revogado/vencido
  async function resolver(token) {
    if (!ehTokenServico(token)) return null;
    await schema();
    const r = await db.get('SELECT id, usuario_id, revogacao, expira_em, revogado_em FROM tokens_servico WHERE hash=?', [hash(token)]);
    if (!r || r.revogado_em) return null;
    if (r.expira_em && r.expira_em < new Date().toISOString()) return null;
    return { tokenId: r.id, usuarioId: +r.usuario_id, revogacao: +r.revogacao };
  }

  function permitido(metodo, rota) {
    if (String(metodo).toUpperCase() !== 'GET') return false;
    return !BLOQUEADAS.some(re => re.test(rota));
  }

  // registra o uso (não segura a resposta; falha de log não derruba a consulta)
  function registrar(tokenId, metodo, rota, consulta, ok) {
    const agora = new Date().toISOString();
    (async () => {
      await schema();
      await db.run('INSERT INTO tokens_servico_uso(id,token_id,metodo,rota,consulta,permitido,em) VALUES(?,?,?,?,?,?,?)',
        [crypto.randomUUID(), tokenId, metodo, rota, String(consulta || '').slice(0, 500), ok ? 1 : 0, agora]);
      const ult = marcados.get(tokenId) || 0;
      if (Date.now() - ult > 5 * 60e3) { marcados.set(tokenId, Date.now()); await db.run('UPDATE tokens_servico SET ultimo_uso=? WHERE id=?', [agora, tokenId]); }
      if (Date.now() - ultimaLimpeza > 24 * 36e5) {
        ultimaLimpeza = Date.now();
        await db.run('DELETE FROM tokens_servico_uso WHERE em < ?', [new Date(Date.now() - RETENCAO_DIAS * 864e5).toISOString()]);
      }
    })().catch(e => console.error('[tokens-servico] ' + e.message));
  }

  return { schema, criar, listar, revogar, usos, resolver, permitido, registrar };
}

module.exports = { criarServicoTokens, ehTokenServico, PREFIXO, BLOQUEADAS };
