'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { buildData } = require('./combined-preview/build-tree-data.cjs');
const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8');
let checks = 0;
const check = (name, run) => { run(); checks++; console.log('PASS: ' + name); };
const html = read('index.html');
const app = read('app.js');
const context = { window: {} };
vm.runInNewContext(read('tree-data.js'), context);
const data = JSON.parse(JSON.stringify(context.window.BIBLE_FAMILY_TREES));

check('正式 bundle 与 17 套来源完全一致', () => {
  assert.equal(Object.keys(data).length, 17);
  assert.deepEqual(data, buildData());
});
check('正式脚本可解析且页面依赖均位于当前项目', () => {
  for (const file of ['app.js', 'compact-layout.js', 'tree-data.js']) new vm.Script(read(file), { filename: file });
  for (const url of [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1])) {
    if (/^(?:https?:|#)/.test(url)) continue;
    const file = decodeURIComponent(url.split(/[?#]/)[0]);
    assert.ok(fs.existsSync(path.resolve(__dirname, file)), url);
  }
  assert.ok(read('style.css').startsWith("@import url('./app.css?v=17');"));
  assert.ok(!html.includes('combined-preview') && !html.includes('../../'));
});
check('竖向全展开、支派和双家谱导航与原图片入口保留', () => {
  assert.match(html, /value="TB" selected/);
  assert.match(html, /id="all" class="active"/);
  assert.match(app, /const expanded = new Set\(db.nodes.map\(n=>n.id\)\)/);
  assert.match(app, /direction = 'TB'/);
  for (const id of ['tribeNav', 'tribePicker', 'gospelNav', 'maternalGuide', 'branchScope']) assert.ok(html.includes(`id="${id}"`), id);
  assert.ok(html.includes('../genealogy-images.html'));
  assert.ok(html.includes('../index.html#pagePeople'));
  assert.ok(!html.includes('人物树预览'));
});
check('所有跨页入口均指向可解析的分段和人物', () => {
  for (const [key, db] of Object.entries(data)) for (const person of db.nodes) for (const link of person.crossPageLinks || []) {
    assert.ok(data[link.tree], key + ':' + person.id + ' → ' + link.tree);
    assert.ok(data[link.tree].nodes.some(n => n.id === link.personId), key + ':' + person.id + ' → ' + link.personId);
  }
});
check('主要家族整体展开，正交连线保留各自谱系样式', () => {
  assert.match(app, /compactMainRows:false/);
  assert.match(app, /branchGap:/);
  assert.match(app, /const edges=geometry.edges.map/);
  assert.match(app, /type:'polyline',silent:true/);
  assert.match(app, /lineDash:kind\|\|n.lineageKind/);
  assert.match(app, /\['noah','ham','shem','japheth',\.\.\.baseFocus\]/);
});
check('母系释经说明未改造成明文生父链', () => {
  for (const key of ['judah-jesus', 'judah-luke']) {
    const db = data[key];
    assert.equal(db.nodes.find(n => n.id === 'mary').fatherId, null);
    assert.equal(db.nodes.find(n => n.id === 'jesus').lineageKind, 'household');
    assert.ok(db.maryNathanGuide.boundary.includes('没有直接写出'));
    assert.ok(db.relations.some(r => r.type === 'mother-child' && r.source === 'mary' && r.target === 'jesus'));
  }
});
console.log(`\n${checks} 组正式查看器整合检查通过。`);
