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
