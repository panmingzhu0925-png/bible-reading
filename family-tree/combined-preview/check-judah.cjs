'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const db = JSON.parse(fs.readFileSync(path.join(__dirname, 'judah-jesus.json'), 'utf8'));
const byId = new Map(db.nodes.map(n => [n.id, n]));
const treeIds = new Set(db.treeNodeIds);
const children = id => db.nodes.filter(n => treeIds.has(n.id) && n.fatherId === id).map(n => n.id);
const relation = (source, target, type) => db.relations.find(r => r.source === source && r.target === target && r.type === type);
let passed = 0;
function check(label, fn) { fn(); passed += 1; console.log('PASS ' + label); }

check('57 records / 47 tree nodes / 10 related records, unique IDs', () => {
  assert.equal(db.nodes.length, 57);
  assert.equal(byId.size, 57);
  assert.equal(db.treeNodeIds.length, 47);
  assert.equal(treeIds.size, 47);
  assert.equal(db.nodes.filter(n => !treeIds.has(n.id)).length, 10);
  for (const id of treeIds) assert(byId.has(id), id);
  for (const n of db.nodes) {
    assert(n.name && n.kind === 'person' && ['male', 'female'].includes(n.gender), n.id);
    assert(Array.isArray(n.refs) && n.refs.length > 0, n.id);
    assert(Array.isArray(n.events), n.id);
    if (n.fatherId) assert(byId.has(n.fatherId), n.id + ' parent');
  }
});

check('all 47 tree nodes reachable with no cycles; related women and previous husbands stay outside', () => {
  assert.equal(db.rootId, 'judah');
  assert.equal(byId.get('judah').fatherId, null);
  assert.equal(byId.get('judah').originFatherId, 'jacob');
  const seen = new Set();
  function visit(id, ancestors = new Set()) {
    assert(!ancestors.has(id), 'cycle at ' + id);
    seen.add(id);
    for (const child of children(id)) visit(child, new Set([...ancestors, id]));
  }
  visit(db.rootId);
  assert.equal(seen.size, treeIds.size);
  for (const id of ['jacob', 'leah', 'tamar', 'judah_wife_shua_daughter', 'rahab', 'ruth', 'bathsheba', 'mary', 'mahlon', 'uriah_hittite']) assert(!treeIds.has(id), id);
});

const main = ['judah', 'perez', 'hezron_perez', 'ram', 'amminadab', 'nahshon', 'salmon', 'boaz', 'obed', 'jesse', 'david', 'solomon', 'rehoboam', 'abijah_king', 'asa', 'jehoshaphat', 'jehoram_judah', 'ahaziah_judah', 'joash_judah', 'amaziah', 'uzziah', 'jotham', 'ahaz', 'hezekiah', 'manasseh_king', 'amon', 'josiah', 'jehoiakim', 'jeconiah', 'shealtiel', 'zerubbabel', 'abiud', 'eliakim_matthew', 'azor', 'zadok_matthew', 'achim', 'eliud', 'eleazar_matthew', 'matthan', 'jacob_matthew', 'joseph_husband_mary', 'jesus'];
check('42-position main line runs from Judah through David and Joseph to Jesus', () => {
  assert.deepEqual(db.mainPath, main);
  for (let i = 1; i < main.length; i++) assert.equal(byId.get(main[i]).fatherId, main[i - 1], main[i]);
  assert.deepEqual(db.quickFocus, ['judah', 'david', 'solomon', 'jeconiah', 'joseph_husband_mary', 'jesus']);
});

check('Matthew sequence stays intact after removing the four explicitly restored generations', () => {
  const omitted = ['ahaziah_judah', 'joash_judah', 'amaziah', 'jehoiakim'];
  assert.deepEqual(db.nodes.filter(n => n.matthewOmitted).map(n => n.id), omitted);
  for (const id of omitted) {
    assert.equal(byId.get(id).treeNote, '太1省略本代');
    assert(byId.get(id).refs.some(r => r.startsWith('历代志上3:')));
  }
  const listed = main.filter(id => !omitted.includes(id));
  assert.equal(listed.length, 38);
  assert.deepEqual(listed.slice(13, 20), ['abijah_king', 'asa', 'jehoshaphat', 'jehoram_judah', 'uzziah', 'jotham', 'ahaz']);
  assert.deepEqual(listed.slice(23, 27), ['josiah', 'jeconiah', 'shealtiel', 'zerubbabel']);
  assert.equal(byId.get('uzziah').fatherId, 'amaziah');
  assert.equal(byId.get('jeconiah').fatherId, 'jehoiakim');
});

check('all five sons of Judah and both sons of Perez are retained', () => {
  assert.deepEqual(children('judah').sort(), ['er_judah', 'onan_judah', 'shelah_judah', 'perez', 'zerah_judah'].sort());
  assert.deepEqual(children('perez').sort(), ['hezron_perez', 'hamul_perez'].sort());
  assert(byId.get('er_judah').treeNote.includes('已死'));
  assert(byId.get('onan_judah').treeNote.includes('已死'));
});

check('Judah mothers and Tamar relationship are based on Genesis 38', () => {
  assert(relation('leah', 'judah', 'mother-child'));
  for (const id of ['er_judah', 'onan_judah', 'shelah_judah']) assert(relation('judah_wife_shua_daughter', id, 'mother-child'));
  for (const id of ['perez', 'zerah_judah']) assert(relation('tamar', id, 'mother-child'));
  assert(relation('judah', 'judah_wife_shua_daughter', 'spouse'));
  assert(relation('er_judah', 'tamar', 'spouse'));
  for (const id of ['judah', 'onan_judah', 'shelah_judah']) assert(!relation(id, 'tamar', 'spouse'));
  assert(byId.get('judah_wife_shua_daughter').isUnnamed);
  assert.equal(byId.get('judah_wife_shua_daughter').graphLabel, '书亚之女');
});

check('Matthew five women have the stated maternal links; Rahab marriage is not invented', () => {
  for (const [mom, child] of [['tamar', 'perez'], ['rahab', 'boaz'], ['ruth', 'obed'], ['bathsheba', 'solomon'], ['mary', 'jesus']]) assert(relation(mom, child, 'mother-child'));
  assert(!db.relations.some(r => r.type === 'spouse' && (r.source === 'rahab' || r.target === 'rahab')));
  assert.equal(byId.get('boaz').fatherId, 'salmon');
  assert.equal(byId.get('obed').fatherId, 'boaz');
  assert.equal(byId.get('solomon').fatherId, 'david');
});

check('Ruth and Bathsheba previous marriages do not create wrong fathers', () => {
  assert(relation('mahlon', 'ruth', 'spouse').note.includes('已死'));
  assert(relation('boaz', 'ruth', 'spouse'));
  assert(relation('uriah_hittite', 'bathsheba', 'spouse').note.includes('死后'));
  assert(relation('david', 'bathsheba', 'spouse'));
  assert.notEqual(byId.get('obed').fatherId, 'mahlon');
  assert.notEqual(byId.get('solomon').fatherId, 'uriah_hittite');
  assert(byId.get('solomon').notes.includes('不是撒下12章先前夭折'));
});

check('Zerubbabel divergence is explicit and not converted to a proven biological father', () => {
  const n = byId.get('zerubbabel');
  assert.equal(n.fatherId, 'shealtiel');
  assert.equal(n.lineageKind, 'genealogy');
  assert(n.refs.includes('历代志上3:17–19'));
  assert(n.notes.includes('毗大雅'));
  assert(n.notes.includes('不擅自断定'));
  assert(!byId.has('pedaiah'));
  assert(byId.get('abiud').notes.includes('不能无经文依据'));
});

check('Matthew-only later positions are genealogical links with source references', () => {
  const ids = main.slice(main.indexOf('zerubbabel'), main.indexOf('jesus'));
  assert.equal(ids.length, 11);
  for (const id of ids) {
    const n = byId.get(id);
    assert.equal(n.lineageKind, 'genealogy', id);
    assert(n.lineageLabel && n.relation.includes('谱系'), id);
    assert(n.refs.some(r => r.startsWith('马太福音1:')), id);
  }
});

check('Joseph connection is explicitly non-biological; Mary remains the named biological mother', () => {
  const n = byId.get('jesus');
  assert.equal(n.lineageKind, 'household');
  assert.equal(n.fatherId, 'joseph_husband_mary');
  assert(n.relation.includes('非生父') && n.lineageLabel.includes('非生父'));
  assert(relation('mary', 'jesus', 'mother-child'));
  assert(relation('joseph_husband_mary', 'mary', 'spouse'));
  assert(!db.relations.some(r => r.source === 'joseph_husband_mary' && r.target === 'jesus'));
  assert.equal(byId.get('mary').fatherId, null);
  assert(!byId.has('heli'));
});

check('same-name people and documented aliases do not merge unrelated characters', () => {
  assert.equal(byId.get('jacob_matthew').fatherId, 'matthan');
  assert.notEqual('jacob_matthew', db.nodes.find(n => n.id === 'jacob').id);
  assert.equal(byId.get('manasseh_king').fatherId, 'hezekiah');
  assert(!byId.has('manasseh') && !byId.has('joseph_patriarch'));
  assert(byId.get('ram').aliases.includes('兰'));
  assert(byId.get('hezron_perez').aliases.includes('希斯仑'));
  assert(byId.get('uzziah').aliases.includes('乌西亚') && byId.get('uzziah').aliases.includes('亚撒利雅'));
  assert(byId.get('jeconiah').aliases.includes('约雅斤'));
  assert(byId.get('zadok_matthew').notes.includes('不与大卫时期'));
});

check('17 source-backed relations have valid endpoints and no duplicate edges', () => {
  assert.equal(db.relations.length, 17);
  const seen = new Set();
  for (const r of db.relations) {
    assert(byId.has(r.source) && byId.has(r.target));
    assert(r.source !== r.target && Array.isArray(r.refs) && r.refs.length);
    const key = [r.source, r.target, r.type].join('/');
    assert(!seen.has(key), key); seen.add(key);
    if (r.type === 'mother-child') assert.equal(byId.get(r.source).gender, 'female');
    else assert.equal(r.type, 'spouse');
  }
  assert.equal(db.relations.filter(r => r.type === 'mother-child').length, 10);
  assert.equal(db.relations.filter(r => r.type === 'spouse').length, 7);
});

check('references have valid book/chapter/verse ranges and all scope cautions are exposed', () => {
  const verses = {
    '创世记': {25:34,28:22,29:35,30:43,35:29,38:30,46:34,49:33},
    '约书亚记': {15:63}, '路得记': {1:22,4:22},
    '撒母耳记下': {11:27,12:31}, '列王纪下': {15:38,24:20},
    '历代志上': {2:55,3:24}, '耶利米书': {22:30}, '马太福音': {1:25}, '路加福音': {3:38}
  };
  function validate(ref) {
    const m = /^([^0-9]+)([0-9]+):([0-9]+)(?:[–-]([0-9]+))?$/.exec(ref);
    assert(m, ref);
    const max = verses[m[1]]?.[Number(m[2])];
    assert(max, ref);
    const first = Number(m[3]), last = Number(m[4] || m[3]);
    assert(first >= 1 && last >= first && last <= max, ref);
  }
  for (const n of db.nodes) {
    n.refs.forEach(validate);
    n.events.flatMap(e => e.refs).forEach(validate);
    if (n.tribeInfo) [...n.tribeInfo.ancestralRefs, ...n.tribeInfo.landRefs].forEach(validate);
  }
  db.relations.flatMap(r => r.refs).forEach(validate);
  db.lineageExplanation.flatMap(e => e.refs).forEach(validate);
  assert.equal(db.lineageExplanation.length, 4);
  assert(db.scope.includes('其他十一支派') && db.scope.includes('不是犹大支派所有后裔'));
  assert(db.lineageExplanation.some(e => e.text.includes('十四代')));
  assert(db.lineageExplanation.some(e => e.text.includes('路3没有直接称')));
  assert(db.sources.every(s => s.title && /^https:\/\//.test(s.url)));
});

console.log('\n' + passed + ' checks passed; 0 failures.');
