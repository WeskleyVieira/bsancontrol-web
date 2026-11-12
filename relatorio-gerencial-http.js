'use strict';
// relatorio-gerencial-http.js — GET /api/relatorio-gerencial?emp=&mkt=&mes=AAAA-MM → o Excel do relatório gerencial de UMA operação.
// 12/11/2026. Botão "Baixar relatório do mês (Excel)" do Panorama (aba Gerencial). Só por mês (decisão do Weskley).
// Trava de carteira NO SERVIDOR: gestor só baixa operação dele (operacoes.gestor = gestor_ref); demais perfis precisam de gestao.ver.
// Um relatório por vez (o servidor é pequeno): pedido simultâneo recebe 429 e a tela pede para tentar de novo.
const R = require('./relatorio-gerencial'), A = require('./acessos');
let ocupado = false;
const J = (res, code, o) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(o)); };
async function enviar(req, res, dbx, user, q) {
  const emp = String(q.emp || '').trim(), mkt = String(q.mkt || '').trim(), mes = String(q.mes || '').trim();
  if (!emp || !mkt || !/^\d{4}-\d{2}$/.test(mes)) return J(res, 400, { ok: false, erro: 'Informe a operação e o mês (AAAA-MM).' });
  if (user) {
    if (user.perfil === 'gestor') {
      const o = await dbx.get('SELECT gestor FROM operacoes WHERE empresa=? AND marketplace=?', [emp, mkt]);
      if (!user.gestor_ref || !o || o.gestor !== user.gestor_ref) return J(res, 403, { ok: false, erro: 'Operação fora da sua carteira.' });
    } else if (!A.pode(user, 'gestao.ver')) return J(res, 403, { ok: false, erro: 'Seu acesso não permite baixar o relatório gerencial.' });
  }
  if (ocupado) return J(res, 429, { ok: false, erro: 'Outro relatório está sendo gerado. Tente de novo em alguns segundos.' });
  ocupado = true;
  try {
    const r = await R.gerarArquivo({ emp, mkt, mes });
    res.writeHead(200, { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${R.nomeArquivo(r)}"`, 'Cache-Control': 'no-store' });
    res.end(r.buffer);
  } catch (e) { J(res, 500, { ok: false, erro: 'Não foi possível gerar o relatório: ' + String(e.message || e).slice(0, 200) }); }
  finally { ocupado = false; }
}
module.exports = { enviar };
