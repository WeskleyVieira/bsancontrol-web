'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

for (const flag of [undefined, '0', '1']) {
  const enabled = flag !== '0';
  test('integração HTTP do layout com a opção ' + (flag ?? 'padrão'), async t => {
    const dir = mkdtempSync(path.join(tmpdir(), 'bsan-layout-http-'));
    const env = {
      ...process.env, AUTH_REQUIRED: '1',
      BSAN_DB: 'sqlite', SQLITE_FILE: path.join(dir, 'painel.db'), PORT: '0',
      BC_QA_NO_WORKER: '1', PRODUTOS_ENABLED: '1', PRODUTOS_SYNC_ENABLED: '0',
      PRODUTOS_DB_FILE: path.join(dir, 'produtos.db'), JWT_SECRET: require('node:crypto').randomBytes(32).toString('hex')
    };
    if (flag === undefined) delete env.BSAN_LAYOUT_STUDIO;
    else env.BSAN_LAYOUT_STUDIO = flag;
    // A API escreve a porta configurada no log. Reserve uma porta de loopback antes de iniciá-la.
    const socket = require('node:net').createServer().listen(0, '127.0.0.1');
    await once(socket, 'listening');
    env.PORT = String(socket.address().port);
    await new Promise(resolve => socket.close(resolve));
    const api = spawn(process.execPath, ['api.js'], {
      cwd: path.resolve(__dirname, '..'), env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']
    });
    t.after(async () => {
      if (api.exitCode === null && api.signalCode === null) {
        const ended = once(api, 'exit');
        api.kill();
        await ended;
      }
      rmSync(dir, { recursive: true, force: true });
    });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('API local indisponível')), 10000);
      api.stdout.on('data', chunk => {
        if (chunk.toString().includes('BsanControl 2.0 API')) {
          clearTimeout(timer);
          resolve();
        }
      });
      api.once('exit', code => { clearTimeout(timer); reject(Error('API encerrou com código ' + code)); });
    });
    const request = url => fetch('http://127.0.0.1:' + env.PORT + url);
    for (const url of ['/', '/acompanhamento.html']) {
      const html = await (await request(url)).text();
      assert.equal(html.includes('src="/layout/boot.js"'), enabled);
      assert.equal(html.includes('/layout/typography.css'), enabled);
      assert.equal(html.includes('/revisao/bootstrap.js'), false);
    }
    const font = await request('/layout/inter-latin-wght-normal.woff2');
    assert.equal(font.status, enabled ? 200 : 404);
    if (enabled) {
      assert.equal(font.headers.get('Content-Type'), 'font/woff2');
      assert.equal(Buffer.from(await font.arrayBuffer()).toString('ascii', 0, 4), 'wOF2');
    }
    const direct = await (await request('/produtos')).text();
    assert.equal(direct.includes('/layout/'), false);
    const embedded = await request('/produtos?embedded=1');
    assert.match(embedded.headers.get('Content-Security-Policy'), /script-src 'self'/);
    const product = await embedded.text();
    assert.equal(product.includes('/layout/typography.css'), enabled);
    assert.equal(product.includes('/layout/integral-products.js'), enabled);
    for (const asset of ['boot.js', 'studio.css', 'typography.css', 'vendor/html-to-image.js', 'vendor/html2canvas.js']) {
      assert.equal((await request('/layout/' + asset)).status, enabled ? 200 : 404, asset);
    }
    assert.equal((await request('/api/sessao')).status, 401);
  });
}
