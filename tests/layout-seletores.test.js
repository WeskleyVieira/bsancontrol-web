const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('o seletor nativo preserva a interação e libera uma única atualização ao fechar', () => {
  const events = new Map();
  const frames = [];
  const timers = [];
  const window = {};
  let open = true;
  let updates = 0;
  const document = {
    addEventListener: (name, handler) => events.set(name, handler),
    querySelector: selector => selector === 'select:open' && open,
  };
  const source = fs.readFileSync(path.join(__dirname, '../layout/studio-composition.js'), 'utf8');
  vm.runInNewContext(source, { window, document, CSS: { supports: () => true },
    requestAnimationFrame: callback => frames.push(callback),
    setTimeout: callback => timers.push(callback),
  });
  const schedule = window.BCReviewStudio.presentationUpdates(() => updates++, '.studio-ui');
  const select = { closest: selector => selector === 'select', matches: selector => selector === 'select' };
  const label = { closest: selector => selector === 'label' && { control: select } };
  events.get('click')({ target: select });
  events.get('click')({ target: label });
  assert.equal(frames.length, 0);

  schedule(); // Dados chegaram enquanto a lista estava aberta.
  frames.shift()();
  assert.equal(updates, 0);
  schedule();
  assert.equal(frames.length, 0);
  open = false; // Esc fecha a lista sem emitir change.
  timers.shift()();
  assert.equal(updates, 1);

  events.get('change')({ target: select });
  schedule();
  assert.equal(frames.length, 1);
  frames.shift()();
  assert.equal(updates, 2);
});

test('cliques de leitura e rascunhos de período não recompõem os cards', () => {
  const events = new Map(), frames = [], window = {};
  let updates = 0;
  const document = { addEventListener: (name, fn) => events.set(name, fn), querySelector: () => null };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../layout/studio-composition.js'), 'utf8'), {
    window, document, CSS: { supports: () => true },
    requestAnimationFrame: fn => frames.push(fn), setTimeout: () => {},
  });
  const schedule = window.BCReviewStudio.presentationUpdates(() => updates++, '.studio-ui');
  // Texto, margem do card e espaço entre widgets não são comandos.
  const surface = { closest: () => null };
  for (let i = 0; i < 3; i++) events.get('click')({ target: surface });
  assert.equal(frames.length, 0);
  // Datas e comparações são rascunhos até o usuário aplicar.
  const period = { closest: selector => selector === '#bc-range-menu' };
  events.get('click')({ target: period });
  events.get('change')({ target: period });
  assert.equal(frames.length, 0);
  // Comandos nativos e novas respostas de dados continuam atualizando a apresentação.
  const action = { closest: selector => selector.startsWith('button,') };
  events.get('click')({ target: action });
  assert.equal(frames.length, 1);
  frames.shift()();
  assert.equal(updates, 1);
  schedule();
  frames.shift()();
  assert.equal(updates, 2);
});
