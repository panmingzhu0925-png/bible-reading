'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {layout} = require('./compact-layout.js');
let passed = 0;
const EPS = 1e-7;
function test(name, run) { run(); passed++; console.log('PASS: ' + name); }
const near = (a, b) => assert.ok(Math.abs(a - b) < EPS, a + ' != ' + b);
function runTree(nodes, direction = 'TB', extras = {}) {
  return layout({rootId: 'root', children: id => nodes[id].children || [], box: id => nodes[id], direction, siblingGap: 14, generationGap: 22, ...extras});
}
function labelRect(point, box) {
  return {left: point.x - box.width / 2, right: point.x + box.width / 2, top: point.y - box.height - 4, bottom: point.y - 4};
}
function validate(nodes, result, direction, preferred = {}, checkCentres = true) {
  const ids = [], depths = new Map();
  function visit(id, depth) { ids.push(id); depths.set(id, depth); (nodes[id].children || []).forEach(child => visit(child, depth + 1)); }
  visit('root', 0);
  assert.deepEqual([...result.positions.keys()], ids, 'Every visible input node must occur exactly once in preorder');
  for (const id of ids) {
    const p = result.positions.get(id), rect = labelRect(p, nodes[id]);
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
    assert.ok(rect.left >= 14 - EPS && rect.top >= 14 - EPS, 'A label is clipped at the leading margin');
    assert.ok(rect.right <= result.width - 14 + EPS && p.y + 4 <= result.height - 14 + EPS, 'A label/circle is clipped at the trailing margin');
    const kids = nodes[id].children || [], axis = direction === 'TB' ? 'x' : 'y';
    if (kids.length && checkCentres) near(p[axis], kids.includes(preferred[id]) ? result.positions.get(preferred[id])[axis] : (result.positions.get(kids[0])[axis] + result.positions.get(kids[kids.length - 1])[axis]) / 2);
    for (let i = 1; i < kids.length; i++) assert.ok(result.positions.get(kids[i])[axis] > result.positions.get(kids[i - 1])[axis], 'Sibling order changed');
  }
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = labelRect(result.positions.get(ids[i]), nodes[ids[i]]), b = labelRect(result.positions.get(ids[j]), nodes[ids[j]]);
    const overlap = Math.min(a.right, b.right) - Math.max(a.left, b.left) > EPS && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > EPS;
    assert.equal(overlap, false, 'Overlapping labels: ' + ids[i] + ' / ' + ids[j]);
    if (depths.get(ids[i]) === depths.get(ids[j])) {
      const axis = direction === 'TB' ? 'y' : 'x';
      near(result.positions.get(ids[i])[axis], result.positions.get(ids[j])[axis]);
    }
  }
}

test('Single node retains a 14 px margin around its label and circle, TB and LR', () => {
  for (const direction of ['TB', 'LR']) {
    const nodes = {root: {width: 80, height: 36}}, result = runTree(nodes, direction);
    validate(nodes, result, direction); near(result.width, 108); near(result.height, 72);
    near(result.positions.get('root').x, 54); near(result.positions.get('root').y, 54);
  }
});
test('TB packs heterogeneous sibling widths instead of reserving the longest width for all', () => {
  const nodes = {root: {width: 70, height: 36, children: ['short', 'wife', 'mother']}, short: {width: 28, height: 32}, wife: {width: 210, height: 36}, mother: {width: 70, height: 50}};
  const result = runTree(nodes); validate(nodes, result, 'TB');
  const [a, b, c] = ['short', 'wife', 'mother'].map(id => result.positions.get(id));
  near(b.x - a.x, 28 / 2 + 210 / 2 + 14);
  near(c.x - b.x, 210 / 2 + 70 / 2 + 14);
  near(a.y - result.positions.get('root').y, 50 + 4 + 22);
  assert.ok(result.width < 3 * (210 + 14) * 0.65, 'Short labels should materially reduce total width');
});
test('LR uses actual label heights for breadth and per-generation width for depth', () => {
  const nodes = {root: {width: 210, height: 36, children: ['a', 'b']}, a: {width: 28, height: 50, children: ['leaf']}, b: {width: 80, height: 32}, leaf: {width: 120, height: 36}};
  const result = runTree(nodes, 'LR'); validate(nodes, result, 'LR');
  near(result.positions.get('b').y - result.positions.get('a').y, 4 + 32 + 4 + 14);
  near(result.positions.get('a').x - result.positions.get('root').x, 210 / 2 + 80 / 2 + 22);
  near(result.positions.get('leaf').x - result.positions.get('a').x, 80 / 2 + 120 / 2 + 22);
});
test('Contour packing interleaves unused space in uneven subtrees without label collisions', () => {
  const nodes = {root: {width: 40, height: 32, children: ['a', 'b']}, a: {width: 300, height: 32, children: ['a1']}, a1: {width: 20, height: 32, children: ['a2']}, a2: {width: 300, height: 32}, b: {width: 20, height: 32, children: ['b1']}, b1: {width: 300, height: 32, children: ['b2']}, b2: {width: 20, height: 32}};
  const result = runTree(nodes); validate(nodes, result, 'TB');
  const subtreeRect = id => {
    const rects = []; function visit(node) { rects.push(labelRect(result.positions.get(node), nodes[node])); (nodes[node].children || []).forEach(visit); } visit(id);
    return {left: Math.min(...rects.map(r => r.left)), right: Math.max(...rects.map(r => r.right))};
  };
  const a = subtreeRect('a'), b = subtreeRect('b');
  assert.ok(b.left < a.right, 'Independent subtree bounding boxes should overlap horizontally where their rows have space');
  assert.ok(result.width < 300 * 2 + 14 + 28 - 80, 'Contour packing should beat summing subtree rectangles');
});
test('A collapsed node is a leaf when the children callback omits its descendants', () => {
  const nodes = {root: {width: 90, height: 36, children: ['folded', 'open']}, folded: {width: 140, height: 36, children: ['hidden']}, hidden: {width: 900, height: 300}, open: {width: 40, height: 32}};
  const visible = {...nodes, folded: {...nodes.folded, children: []}};
  for (const direction of ['TB', 'LR']) {
    const result = runTree(nodes, direction, {children: id => id === 'folded' ? [] : nodes[id].children || []});
    validate(visible, result, direction); assert.equal(result.positions.has('hidden'), false);
  }
});
test('Children with tiny or zero-sized labels still reserve their circle footprint', () => {
  const nodes = {root: {width: 0, height: 0, children: ['a', 'b']}, a: {width: 0, height: 0}, b: {width: 2, height: 0}};
  for (const direction of ['TB', 'LR']) {
    const result = runTree(nodes, direction); validate(nodes, result, direction);
    const axis = direction === 'TB' ? 'x' : 'y'; near(result.positions.get('b')[axis] - result.positions.get('a')[axis], 8 + 14);
  }
});
test('A deterministic mix of 240 irregular trees keeps all labels distinct in both orientations', () => {
  let state = 76543;
  const rand = max => { state = (state * 1664525 + 1013904223) >>> 0; return state % max; };
  for (let trial = 0; trial < 240; trial++) {
    const nodes = {root: {width: 24 + rand(210), height: 28 + rand(32), children: []}}, ids = ['root'];
    const count = 3 + rand(90);
    for (let i = 1; i < count; i++) {
      const id = 'n' + i, parent = ids[rand(ids.length)]; nodes[id] = {width: 24 + rand(210), height: 28 + rand(32), children: []}; nodes[parent].children.push(id); ids.push(id);
    }
    for (const direction of ['TB', 'LR']) validate(nodes, runTree(nodes, direction), direction);
  }
});
test('Preferred visible children align a multigeneration main path in TB and LR', () => {
  const nodes = {root: {width: 70, height: 36, children: ['left', 'main', 'right']}, left: {width: 40, height: 32}, main: {width: 160, height: 50, children: ['a', 'next', 'b']}, right: {width: 230, height: 36}, a: {width: 90, height: 32}, next: {width: 60, height: 50}, b: {width: 30, height: 32}};
  const preferred = {root: 'main', main: 'next'};
  for (const direction of ['TB', 'LR']) {
    const result = runTree(nodes, direction, {preferredChild: id => preferred[id]}); validate(nodes, result, direction, preferred);
    const axis = direction === 'TB' ? 'x' : 'y';
    near(result.positions.get('root')[axis], result.positions.get('main')[axis]);
    near(result.positions.get('main')[axis], result.positions.get('next')[axis]);
  }
});
test('Biased first/last child roots retain nonintersecting contours in 100 irregular trees', () => {
  let state = 6789;
  const rand = max => { state = (state * 1664525 + 1013904223) >>> 0; return state % max; };
  for (let trial = 0; trial < 100; trial++) {
    const nodes = {root: {width: 30 + rand(220), height: 28 + rand(40), children: []}}, ids = ['root'];
    for (let i = 1; i < 65; i++) {
      const id = 'n' + i, parent = ids[rand(ids.length)]; nodes[id] = {width: 30 + rand(220), height: 28 + rand(40), children: []}; nodes[parent].children.push(id); ids.push(id);
    }
    const preferred = Object.fromEntries(ids.filter(id => nodes[id].children.length).map((id, i) => [id, nodes[id].children[i % 2 ? 0 : nodes[id].children.length - 1]]));
    for (const direction of ['TB', 'LR']) {
      const result = runTree(nodes, direction, {preferredChild: id => preferred[id]}); validate(nodes, result, direction, preferred);
    }
  }
});
test('A hidden, absent or unspecified preferred child falls back to first/last visible midpoint', () => {
  const nodes = {root: {width: 80, height: 36, children: ['a', 'hidden', 'b']}, a: {width: 30, height: 32}, hidden: {width: 400, height: 100}, b: {width: 180, height: 50}};
  const visible = {...nodes, root: {...nodes.root, children: ['a', 'b']}};
  for (const direction of ['TB', 'LR']) for (const preference of ['hidden', 'absent', undefined]) {
    const result = runTree(nodes, direction, {children: id => visible[id].children || [], preferredChild: () => preference}); validate(visible, result, direction);
    const baseline = runTree(visible, direction);
    assert.deepEqual(result, baseline);
    assert.equal(result.positions.has('hidden'), false);
  }
});
function wideMainRowsFixture() {
  const nodes = {
    root: {width: 80, height: 36, children: ['left', 'main', 'right']},
    left: {width: 70, height: 50, children: []}, main: {width: 180, height: 50, children: ['side', 'end']}, right: {width: 80, height: 32, children: []},
    side: {width: 60, height: 50, children: []}, end: {width: 50, height: 50, children: []}
  };
  for (const [parent, count] of [['left', 12], ['right', 4], ['side', 5], ['end', 13]]) {
    for (let i = 0; i < count; i++) {
      const id = parent + i; nodes[parent].children.push(id); nodes[id] = {width: 40 + (i % 4) * 18, height: i % 3 ? 32 : 50};
    }
  }
  return {nodes, preferred: {root: 'main', main: 'end'}};
}
function rowsOf(nodes) {
  const rows = new Map();
  function visit(id, depth) { if (!rows.has(depth)) rows.set(depth, []); rows.get(depth).push(id); (nodes[id].children || []).forEach(child => visit(child, depth + 1)); }
  visit('root', 0); return rows;
}
test('Main rows put side parents next to the main axis, including its last row, in TB and LR', () => {
  const {nodes, preferred} = wideMainRowsFixture(), rows = rowsOf(nodes);
  for (const direction of ['TB', 'LR']) {
    const result = runTree(nodes, direction, {preferredChild: id => preferred[id], compactMainRows: true});
    validate(nodes, result, direction, preferred, false);
    const axis = direction === 'TB' ? 'x' : 'y';
    for (const id of ['main', 'end']) near(result.positions.get('root')[axis], result.positions.get(id)[axis]);
    const lo = id => direction === 'TB' ? -nodes[id].width / 2 : -nodes[id].height - 4;
    const hi = id => direction === 'TB' ? nodes[id].width / 2 : 4;
    for (const depth of [1, 2]) {
      const row = rows.get(depth);
      for (let i = 1; i < row.length; i++) {
        const a = row[i - 1], b = row[i];
        near(result.positions.get(b)[axis] + lo(b) - result.positions.get(a)[axis] - hi(a), 14);
      }
    }
    near(result.positions.get('main')[axis] + lo('main') - result.positions.get('left')[axis] - hi('left'), 14);
  }
});
test('Compacting main rows preserves every deeper coordinate relative to the main axis', () => {
  const {nodes, preferred} = wideMainRowsFixture(), rows = rowsOf(nodes);
  for (const direction of ['TB', 'LR']) {
    const options = {preferredChild: id => preferred[id]}, original = runTree(nodes, direction, options), compact = runTree(nodes, direction, {...options, compactMainRows: true});
    validate(nodes, compact, direction, preferred, false);
    for (const depth of [...rows.keys()].filter(depth => depth > 2)) for (const id of rows.get(depth)) for (const axis of ['x', 'y']) {
      near(compact.positions.get(id)[axis] - compact.positions.get('root')[axis], original.positions.get(id)[axis] - original.positions.get('root')[axis]);
    }
    const depthAxis = direction === 'TB' ? 'y' : 'x';
    for (const id of Object.keys(nodes)) near(compact.positions.get(id)[depthAxis] - compact.positions.get('root')[depthAxis], original.positions.get(id)[depthAxis] - original.positions.get('root')[depthAxis]);
  }
});
test('Main-row compaction preserves noncrossing edge order between each adjacent pair of generations', () => {
  const {nodes, preferred} = wideMainRowsFixture(), rows = rowsOf(nodes);
  for (const direction of ['TB', 'LR']) {
    const result = runTree(nodes, direction, {preferredChild: id => preferred[id], compactMainRows: true}), axis = direction === 'TB' ? 'x' : 'y';
    for (const row of rows.values()) {
      const edges = row.flatMap(parent => (nodes[parent].children || []).map(child => ({parent, child})));
      for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
        const a = edges[i], b = edges[j]; if (a.parent === b.parent) continue;
        const pa = result.positions.get(a.parent)[axis], pb = result.positions.get(b.parent)[axis], ca = result.positions.get(a.child)[axis], cb = result.positions.get(b.child)[axis];
        assert.ok(pa < pb && ca < cb, 'Global row order must be retained across different families');
        // A TB/LR tree curve uses identical depth controls within a generation.
        // Its breadth is this convex interpolation, so ordered endpoints cannot cross.
        for (let sample = 0; sample <= 40; sample++) {
          const t = sample / 40, u = 3 * t * t - 2 * t * t * t;
          assert.ok((1 - u) * pa + u * ca < (1 - u) * pb + u * cb);
        }
      }
    }
  }
});
test('Main-row compaction is opt-in and stops when the preferred child is hidden', () => {
  const {nodes, preferred} = wideMainRowsFixture();
  for (const direction of ['TB', 'LR']) {
    const options = {preferredChild: id => preferred[id]};
    assert.deepEqual(runTree(nodes, direction, options), runTree(nodes, direction, {...options, compactMainRows: false}));
    const hidden = {...nodes, root: {...nodes.root, children: ['left', 'right']}}, filtered = {children: id => hidden[id].children || [], preferredChild: id => preferred[id]};
    assert.deepEqual(runTree(nodes, direction, filtered), runTree(nodes, direction, {...filtered, compactMainRows: true}));
  }
});
test('Browser global and CommonJS expose the same DOM-independent API', () => {
  const context = {window: {}}; vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'compact-layout.js'), 'utf8'), context);
  assert.equal(typeof context.window.CompactTreeLayout.layout, 'function');
  const result = context.window.CompactTreeLayout.layout({rootId: 'one', children: () => [], box: () => ({width: 40, height: 20})});
  assert.equal(result.positions.size, 1); near(result.width, 68); near(result.height, 56);
});
test('Invalid dimensions, cycles, shared children and unsupported directions fail explicitly', () => {
  const base = {rootId: 'root', children: () => [], box: () => ({width: 40, height: 20})};
  assert.throws(() => layout({...base, box: () => ({width: NaN, height: 20})}), /Invalid label box/);
  assert.throws(() => layout({...base, children: () => ['root']}), /cycle/);
  assert.throws(() => layout({...base, children: id => id === 'root' ? ['a', 'a'] : []}), /Repeated/);
  assert.throws(() => layout({...base, direction: 'BT'}), /direction/);
  assert.throws(() => layout({...base, siblingGap: -1}), /siblingGap/);
  assert.throws(() => layout({...base, preferredChild: 'root'}), /preferredChild/);
  assert.throws(() => layout({...base, compactMainRows: 'true'}), /compactMainRows/);
});
console.log('\n' + passed + ' geometry checks passed (including 680 randomized orientation layouts).');
