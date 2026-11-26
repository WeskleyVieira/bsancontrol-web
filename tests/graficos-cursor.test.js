const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../visual/areas.js'), 'utf8');
const cursor = vm.runInNewContext(source.slice(source.indexOf('const bcChartPointer='), source.indexOf('function bcVisualTypeStart()')) + 'bcChartPointer');

test('as barras horizontais usam a linha da operação para escolher o índice', () => {
  const options = { indexAxis: 'y', interaction: { mode: 'index' } };
  cursor.beforeUpdate({ options });
  assert.equal(options.interaction.axis, 'y');
});

test('mouse e toque são convertidos para o mesmo ponto do gráfico com zoom', () => {
  const rect = { left: 80, top: 30, width: 800, height: 200 };
  const chart = { width: 1000, height: 250, canvas: { getBoundingClientRect: () => rect }, isPointInArea: () => true };
  const point = { clientX: 480, clientY: 150 };
  for (const native of [point, { touches: [point] }]) {
    const args = { event: { native, x: 400, y: 120 } };
    cursor.beforeEvent(chart, args);
    assert.equal(args.event.x, 500);
    assert.equal(args.event.y, 150);
  }
});
