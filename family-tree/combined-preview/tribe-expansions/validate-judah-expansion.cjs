const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'judah-jesus.json'), 'utf8'));
const exp = JSON.parse(fs.readFileSync(path.join(__dirname, 'judah.json'), 'utf8'));
const all = new Map(base.nodes.map(n => [n.id, n]));
for (const n of exp.nodes) all.set(n.id, n);
let passed = 0;
function check(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
const rels = [...base.relations, ...exp.relations];
const kids = id => [...all.values()].filter(n => n.fatherId === id).map(n => n.id).sort();
const equalKids = (id, expected) => assert.deepEqual(kids(id), expected.split(' ').sort());
const mother = (m, child) => assert(rels.some(r => r.type === 'mother-child' && r.source === m && r.target === child));

check('扩展字段齐全，唯一 ID，未新增无经文人物', () => {
  assert.equal(new Set(exp.nodes.map(n => n.id)).size, exp.nodes.length);
  for (const n of exp.nodes) {
    assert(n.id && n.name && ['person', 'group'].includes(n.kind));
    assert(Array.isArray(n.refs) && n.refs.length);
    assert(Array.isArray(n.events) && typeof n.notes === 'string');
    for (const r of n.refs) assert(/^[\u4e00-\u9fff]+\d+:\d+(?:–\d+)?$/.test(r), `${n.id}: ${r}`);
  }
});
check('所有实际父节点、排版父节点与关联目标存在', () => {
  for (const n of all.values()) {
    if (n.fatherId) assert(all.has(n.fatherId), `${n.id}: father ${n.fatherId}`);
    if (n.treeParentId) {
      assert(all.has(n.treeParentId), `${n.id}: treeParent ${n.treeParentId}`);
      assert(n.lineageKind && n.lineageLabel, `${n.id}: 关联线没有类型说明`);
    }
  }
  for (const r of rels) {
    assert(all.has(r.source) && all.has(r.target), `${r.source}->${r.target}`);
    assert(r.refs.length);
  }
});
check('真实父系与排版父系均无循环', () => {
  for (const n of all.values()) for (const mode of ['fatherId', 'tree']) {
    const seen = new Set(); let cur = n;
    while (cur) {
      assert(!seen.has(cur.id), `${n.id}: ${mode} cycle`); seen.add(cur.id);
      const next = mode === 'tree' ? (cur.treeParentId || cur.fatherId) : cur.fatherId;
      cur = next ? all.get(next) : null;
    }
  }
});
check('原太1主线 42 人父系、谱系及非生父标记完全保留', () => {
  assert.equal(base.mainPath.length, 42);
  assert.equal(exp.mainPath, undefined);
  for (const id of base.mainPath) {
    const before = base.nodes.find(n => n.id === id), after = all.get(id);
    assert.equal(after.fatherId, before.fatherId, id);
    assert.equal(after.lineageKind, before.lineageKind, id);
    assert.equal(after.lineageLabel, before.lineageLabel, id);
  }
  assert.equal(all.get('jesus').lineageKind, 'household');
});
check('犹大五子、示拉与谢拉旁支不混名', () => {
  equalKids('judah', 'er_judah onan_judah shelah_judah perez zerah_judah');
  equalKids('zerah_judah', 'zimri_zerah ethan_zerah heman_zerah calcol_zerah dara_zerah zabdi_zerah');
  assert.equal(all.get('achan_carmi').fatherId, 'carmi_zabdi');
  assert.equal(all.get('carmi_zabdi').fatherId, 'zabdi_zerah');
  assert.notEqual('er_shelah', 'er_judah');
  assert(!rels.some(r => r.type === 'spouse' && r.source === 'judah' && r.target === 'tamar'));
});
check('耶拉篾、示珊与女婿关系不造父系', () => {
  equalKids('jerahmeel_hezron', 'ram_jerahmeel bunah_jerahmeel oren_jerahmeel ozem_jerahmeel ahijah_jerahmeel onam_jerahmeel');
  assert.equal(all.get('jarha_egyptian').fatherId, null);
  assert.equal(all.get('jarha_egyptian').treeParentId, 'sheshan_ishi');
  assert.equal(all.get('jarha_egyptian').lineageKind, 'family');
  mother('sheshan_daughter', 'attai_jarha');
  assert.notEqual('ahlai_sheshan', 'sheshan_daughter');
});
check('两位迦勒、三位基纳斯与妻妾母系独立', () => {
  assert.equal(all.get('caleb_hezron').fatherId, 'hezron_perez');
  assert.equal(all.get('caleb_jephunneh').fatherId, 'jephunneh_caleb');
  mother('azubah_caleb', 'jesher_caleb'); mother('ephrath_caleb', 'hur_caleb');
  mother('ephah_caleb', 'haran_caleb'); mother('maacah_caleb', 'sheber_caleb');
  assert.equal(all.get('bezalel_uri').fatherId, 'uri_hur');
  assert.equal(all.get('hammath_kenite').lineageKind, 'context');
  assert(!all.get('hammath_kenite').lineageLabel.includes('犹大支派'));
  assert.equal(all.get('jadai_judah').fatherId, null);
});
check('亚施户两妻各自孩子准确', () => {
  for (const id of ['ahuzzam_ashhur', 'hepher_ashhur', 'temeni_ashhur', 'haahashtari_ashhur']) mother('naarah_ashhur', id);
  for (const id of ['zereth_ashhur', 'zohar_ashhur', 'ethnan_ashhur']) mother('helah_ashhur', id);
});
check('路得前后婚姻、拿俄米生母身份准确', () => {
  equalKids('elimelech_ruth', 'mahlon chilion_ruth');
  mother('naomi', 'mahlon'); mother('naomi', 'chilion_ruth'); mother('ruth', 'obed');
  assert(!rels.some(r => r.type === 'mother-child' && r.source === 'naomi' && r.target === 'obed'));
});
check('大卫姐妹、外甥的母系排版不造生父', () => {
  for (const id of ['abishai_zeruiah', 'joab_zeruiah', 'asahel_zeruiah']) {
    assert.equal(all.get(id).fatherId, null);
    assert.equal(all.get(id).treeParentId, 'zeruiah_david_sister');
    assert.equal(all.get(id).lineageKind, 'maternal'); mother('zeruiah_david_sister', id);
  }
  assert.equal(all.get('abigail_david_sister').fatherId, 'nahash_abigail_father');
  assert.equal(all.get('amasa_jether').fatherId, 'jether_ishmaelite'); mother('abigail_david_sister', 'amasa_jether');
});
check('代上3大卫十九子与女儿及另见耶利摩全部列名', () => {
  equalKids('david', 'amnon_david chileab_david absalom_david adonijah_david shephatiah_david ithream_david shimea_david shobab_david nathan_david solomon ibhar_david elishama_david_first eliphelet_david_first nogah_david nepheg_david japhia_david elishama_david_second eliada_david eliphelet_david_second tamar_david jerimoth_david');
  for (const id of ['shimea_david', 'shobab_david', 'nathan_david', 'solomon']) mother('bathsheba', id);
  assert(!rels.some(r => r.type === 'mother-child' && r.source === 'bathsheba' && r.target === 'ibhar_david'));
  assert(!rels.some(r => r.type === 'mother-child' && r.source === 'michal_david'));
});
check('王室母系、祖母玛迦、两位西底家不混', () => {
  mother('maacah_rehoboam', 'abijah_king');
  assert(!rels.some(r => r.type === 'mother-child' && r.source === 'maacah_rehoboam' && r.target === 'asa'));
  mother('athaliah', 'ahaziah_judah');
  assert(!rels.some(r => r.type === 'mother-child' && r.source === 'jezebel' && r.target === 'athaliah'));
  assert.equal(all.get('zedekiah_josiah').fatherId, 'josiah');
  assert.equal(all.get('zedekiah_jehoiakim').fatherId, 'jehoiakim');
  mother('hamutal', 'shallum_josiah'); mother('hamutal', 'zedekiah_josiah');
});
check('代上3异表不改太1、米书兰五子依和合本、未定各家不硬串', () => {
  assert.equal(all.get('zerubbabel').fatherId, 'shealtiel');
  assert(rels.some(r => r.source === 'pedaiah_jeconiah' && r.target === 'zerubbabel' && r.type === 'father-child'));
  equalKids('meshullam_zerubbabel', 'hashubah_meshullam ohel_meshullam berechiah_meshullam hasadiah_meshullam jushabhesed_meshullam');
  for (const id of ['rephaiah_postexile', 'arnan_postexile', 'obadiah_postexile', 'shecaniah_postexile']) assert.equal(all.get(id).fatherId, null);
  equalKids('shemaiah_shecaniah', 'hattush_shemaiah igal_shemaiah bariah_shemaiah neariah_shemaiah shaphat_shemaiah');
});
check('北国不同王朝绝不以继位冒充父子', () => {
  for (const id of ['nebat_jeroboam', 'ahijah_baasha', 'zimri_israel', 'omri_israel', 'nimshi_jehu', 'jabesh_shallum', 'gadi_menahem', 'remaliah_pekah', 'elah_hoshea']) {
    assert.equal(all.get(id).fatherId, null); assert.equal(all.get(id).lineageKind, 'context');
  }
  assert.equal(all.get('ahab_israel').fatherId, 'omri_israel');
  assert.equal(all.get('jehu_israel').fatherId, 'jehoshaphat_jehu_father');
  assert.equal(all.get('baasha_israel').fatherId, 'ahijah_baasha');
  assert.equal(all.get('jehoash_israel').fatherId, 'jehoahaz_israel');
});
check('母亲均为人物女性，族群不用真实父系伪作具名儿子', () => {
  for (const r of rels.filter(r => r.type === 'mother-child')) assert.equal(all.get(r.source).gender, 'female');
  for (const n of exp.nodes.filter(n => n.kind === 'group')) assert.equal(n.fatherId, null);
});
check('原图覆盖、差异与来源审计存在', () => {
  assert(exp.imageCoverage.length >= 12 && exp.sources.length >= 40);
  assert(exp.imageCoverage.some(c => c.section.includes('路3') && c.status === 'uncertain'));
  for (const c of exp.imageCoverage) assert(c.note && c.refs.length && ['covered', 'corrected', 'uncertain'].includes(c.status));
});
console.log(`\n${passed} checks passed; ${exp.nodes.length} expansion records, ${all.size} merged records, ${exp.relations.length} added relations.`);
