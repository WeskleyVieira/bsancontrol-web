'use strict';
const { mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { criarBaseLocal } = require('../tests/fixtures/painel-local');

const directory = mkdtempSync(path.join(tmpdir(), 'bsan-layout-'));
const port = process.argv[2] || '59837';
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw Error('Porta inválida.');
Object.assign(process.env, {
  PORT: port, BSAN_DB: 'sqlite', DATABASE_URL: '', PRODUTOS_DATABASE_URL: '',
  SQLITE_FILE: path.join(directory, 'painel.db'), PRODUTOS_DB_FILE: path.join(directory, 'produtos.db'),
  AUTH_REQUIRED: '1', BSAN_LAYOUT_STUDIO: '1', PRODUTOS_ENABLED: '1', PRODUTOS_SYNC_ENABLED: '0',
  BC_QA_NO_WORKER: '1', JWT_SECRET: randomBytes(32).toString('hex')
});
const { password } = criarBaseLocal(process.env.SQLITE_FILE);
console.log('Homologação local com dados fictícios · http://127.0.0.1:' + port);
console.log('Conta de teste: direcao@qa.local · Senha: ' + password);
require('../api');
