'use strict';

// Run from any directory: node family-tree/check-abraham-jacob.cjs
// Expected relationships below are independently specified from the cited
// Genesis passages; they are not generated from the data under test.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const read = name => JSON.parse(fs.readFileSync(path.join(__dirname, 'data', name), 'utf8'));
const db = read('abraham-jacob.json');
const previous = read('noah-abraham.json');
const nodes = new Map(db.nodes.map(n => [n.id, n]));
const previousIds = new Set(previous.nodes.map(n => n.id));
const sorted = values => [...values].sort();
const childrenOf = id => db.nodes.filter(n => n.fatherId === id);
const expectedChildren = (father, ids) => assert.deepEqual(
  sorted(childrenOf(father).map(n => n.id)), sorted(ids), `${father}: children do not match Scripture`
);

assert.equal(nodes.size, db.nodes.length, 'Duplicate node IDs');
assert.equal(db.rootId, 'abraham');
assert.deepEqual(db.mainPath, ['abraham', 'isaac', 'jacob']);
for (const n of db.nodes) {
  assert.ok(['person', 'group'].includes(n.kind), `${n.id}: unexpected kind`);
  assert.ok(n.refs.length, `${n.id}: no Scripture reference`);
  if (n.fatherId) assert.ok(nodes.has(n.fatherId), `${n.id}: missing father`);
  const seen = new Set();
  for (let id = n.id; id; id = nodes.get(id).fatherId) {
    assert.ok(!seen.has(id), `${n.id}: parent cycle at ${id}`);
    seen.add(id);
  }
}
const refPattern = /^创世记\d+:\d+(?:[–-]\d+)?$/;
const allRefs = [
  ...db.nodes.flatMap(n => [...n.refs, ...n.events.flatMap(e => e.refs)]),
  ...db.relations.flatMap(r => r.refs)
];
for (const ref of allRefs) assert.match(ref, refPattern, `Reference must use full Chinese book name: ${ref}`);
for (const r of db.relations) {
  assert.ok(nodes.has(r.source) && nodes.has(r.target), `Missing relation endpoint: ${r.source}/${r.target}`);
  assert.ok(r.refs.length, `${r.source}/${r.target}: relationship lacks reference`);
}

// Genesis 16:15, 21:2–3, 25:2–4.
expectedChildren('abraham', ['ishmael', 'isaac', 'zimran', 'jokshan', 'medan', 'midian', 'ishbak', 'shuah']);
expectedChildren('jokshan', ['sheba_jokshan', 'dedan_jokshan']);
expectedChildren('dedan_jokshan', ['asshurim_dedan', 'letushim_dedan', 'leummim_dedan']);
expectedChildren('midian', ['ephah_midian', 'epher_midian', 'hanoch_midian', 'abida_midian', 'eldaah_midian']);
for (const n of childrenOf('dedan_jokshan')) assert.equal(n.kind, 'group', `${n.id}: clan represented as individual son`);
assert.equal(db.nodes.filter(n => n.kind === 'group').length, 3);

// Genesis 25:13–16 uses 哈大 in this Chinese Union Version.
const twelve = [
  ['nebaioth_ishmael', '尼拜约'], ['kedar_ishmael', '基达'],
  ['adbeel_ishmael', '亚德别'], ['mibsam_ishmael', '米比衫'],
  ['mishma_ishmael', '米施玛'], ['dumah_ishmael', '度玛'],
  ['massa_ishmael', '玛撒'], ['hadad_ishmael', '哈大'],
  ['tema_ishmael', '提玛'], ['jetur_ishmael', '伊突'],
  ['naphish_ishmael', '拿非施'], ['kedemah_ishmael', '基底玛']
];
assert.deepEqual(sorted(childrenOf('ishmael').filter(n => n.gender === 'male').map(n => n.id)), sorted(twelve.map(([id]) => id)));
for (const [id, name] of twelve) assert.equal(nodes.get(id).name, name, `${id}: spelling differs from Genesis 25`);
// The daughter is explicitly identified in Genesis 36:3, beyond the 12 sons.
assert.deepEqual(sorted(childrenOf('ishmael').filter(n => n.gender === 'female').map(n => n.id)), ['basemath_esau']);
assert.equal(nodes.get('basemath_esau').fatherId, 'ishmael');

// Genesis 25:24–26 and 36:4–14, without inferring unnamed mothers.
expectedChildren('isaac', ['esau', 'jacob']);
expectedChildren('esau', ['eliphaz_esau', 'reuel_esau', 'jeush_esau', 'jalam_esau', 'korah_esau']);
expectedChildren('eliphaz_esau', ['teman_eliphaz', 'omar_eliphaz', 'zepho_eliphaz', 'gatam_eliphaz', 'kenaz_eliphaz', 'amalek_eliphaz']);
expectedChildren('reuel_esau', ['nahath_reuel', 'zerah_reuel', 'shammah_reuel', 'mizzah_reuel']);
assert.equal(childrenOf('eliphaz_esau').length + childrenOf('reuel_esau').length, 10);
assert.ok(nodes.get('eliphaz_esau').notes.includes('可拉'), 'Genesis 36:16 chief-name ambiguity must remain documented');
assert.ok(nodes.get('esau').notes.includes('26:34') && nodes.get('esau').notes.includes('28:9'), 'Esau wife-name differences must remain documented');
assert.ok(!nodes.get('basemath_esau').aliases?.includes('玛哈拉'), 'Do not assert an unqualified Mahalath/Basemath identification');

const expectedMothers = new Map([
  ['sarai', ['isaac']], ['hagar', ['ishmael']],
  ['keturah', ['zimran', 'jokshan', 'medan', 'midian', 'ishbak', 'shuah']],
  ['rebecca', ['esau', 'jacob']], ['adah_esau', ['eliphaz_esau']],
  ['basemath_esau', ['reuel_esau']],
  ['oholibamah_esau', ['jeush_esau', 'jalam_esau', 'korah_esau']],
  ['timna_eliphaz', ['amalek_eliphaz']]
]);
const maternal = db.relations.filter(r => r.type === 'mother-child');
assert.equal(maternal.length, 16);
assert.deepEqual(sorted(new Set(maternal.map(r => r.source))), sorted(expectedMothers.keys()));
const maternalTargets = new Set();
for (const [mother, children] of expectedMothers) {
  assert.equal(nodes.get(mother).gender, 'female');
  assert.deepEqual(sorted(maternal.filter(r => r.source === mother).map(r => r.target)), sorted(children), `${mother}: wrong maternal connections`);
}
for (const r of maternal) {
  assert.ok(!maternalTargets.has(r.target), `${r.target}: conflicting recorded mothers`);
  maternalTargets.add(r.target);
}

const expectedUnions = [
  ['abraham', 'sarai', 'spouse'], ['abraham', 'hagar', 'concubine'],
  ['abraham', 'keturah', 'spouse'], ['isaac', 'rebecca', 'spouse'],
  ['jacob', 'leah', 'spouse'], ['jacob', 'rachel', 'spouse'],
  ['jacob', 'bilhah', 'concubine'], ['jacob', 'zilpah', 'concubine'],
  ['esau', 'adah_esau', 'spouse'], ['esau', 'basemath_esau', 'spouse'],
  ['esau', 'oholibamah_esau', 'spouse'], ['eliphaz_esau', 'timna_eliphaz', 'concubine']
];
const unions = db.relations.filter(r => ['spouse', 'concubine'].includes(r.type));
assert.deepEqual(sorted(unions.map(r => [r.source, r.target, r.type].join('/'))), sorted(expectedUnions.map(r => r.join('/'))));
for (const r of unions) {
  assert.notEqual(nodes.get(r.target).fatherId, r.source, `${r.target}: spouse represented as husband's daughter`);
  assert.notEqual(nodes.get(r.source).fatherId, r.target, `${r.source}: spouse represented as partner's child`);
}
for (const r of maternal) assert.ok(unions.some(u => u.source === nodes.get(r.target).fatherId && u.target === r.source), `${r.target}: maternal relationship inconsistent with stated parents`);

// Latest approved scope: Jacob is the endpoint, while Esau side branches remain.
expectedChildren('jacob', []);
for (const id of ['reuben', 'simeon', 'levi', 'judah', 'dan', 'naphtali', 'gad', 'asher', 'issachar', 'zebulun', 'dinah', 'joseph_patriarch', 'benjamin', 'pharez', 'hamul', 'jesus']) {
  assert.ok(!nodes.has(id), `Out-of-stage descendant found: ${id}`);
}
for (const [id, target] of [['sarai', 'sarai'], ['rebecca', 'rebecca'], ['leah', 'leah'], ['rachel', 'rachel']]) {
  const links = nodes.get(id).crossPageLinks || [];
  assert.ok(links.some(l => l.tree === 'noah-abraham' && l.personId === target), `${id}: missing previous-page link`);
  for (const link of links) assert.ok(previousIds.has(link.personId), `${id}: previous-page person does not exist`);
}

const reached = [];
function visit(id) { reached.push(id); childrenOf(id).forEach(n => visit(n.id)); }
visit(db.rootId);
assert.deepEqual(sorted(db.treeNodeIds), sorted(reached));
const derived = {
  nodes: db.nodes.length,
  personRecords: db.nodes.filter(n => n.kind === 'person').length,
  groupRecords: db.nodes.filter(n => n.kind === 'group').length,
  treeNodes: reached.length,
  spouseOnly: db.nodes.filter(n => !reached.includes(n.id)).length,
  parentEdges: db.nodes.filter(n => n.fatherId).length,
  crossRelations: db.relations.length,
  spouseRelations: unions.filter(r => r.type === 'spouse').length,
  concubineRelations: unions.filter(r => r.type === 'concubine').length,
  motherChildRelations: maternal.length,
  mainPathNodes: db.mainPath.length,
  abrahamNamedSons: childrenOf('abraham').filter(n => n.gender === 'male').length,
  ishmaelNamedSons: childrenOf('ishmael').filter(n => n.gender === 'male').length,
  esauNamedSons: childrenOf('esau').filter(n => n.gender === 'male').length,
  esauExplicitGrandsons: childrenOf('eliphaz_esau').length + childrenOf('reuel_esau').length,
  jacobChildrenInThisStage: childrenOf('jacob').length
};
for (const [name, value] of Object.entries(derived)) assert.equal(db.counts[name], value, `Count mismatch: ${name}`);
assert.equal(derived.nodes, 60);
assert.equal(derived.personRecords, 57);
assert.equal(derived.treeNodes, 49);
assert.equal(derived.spouseOnly, 11);

console.log('PASS: Abraham 8 sons; Keturah branches; Ishmael 12 sons and named daughter.');
console.log('PASS: Esau 5 sons / 10 explicit grandsons; 16 accurate maternal relationships.');
console.log('PASS: 8 spouse / 4 concubine relationships; partners are not parent/child.');
console.log('PASS: Main line ends at Jacob; no Jacob descendants; previous-page links resolve.');
console.log('PASS: IDs, endpoints, acyclic parents, full-book references and counts.');
console.log(JSON.stringify(derived));
