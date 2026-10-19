'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {mergeExpansion}=require('./build-tree-data.cjs');
const {applyJudahRelatedFamilies}=require('./judah-related-families.cjs');
const read=file=>JSON.parse(fs.readFileSync(path.join(__dirname,file),'utf8'));
// Build the original merged data independently of the production hook.
const before=mergeExpansion(read('judah-jesus.json'),read('tribe-expansions/judah.json'),'judah-jesus');
const frozen=JSON.stringify(before);
const after=applyJudahRelatedFamilies(before);
const idx=new Map(after.nodes.map(n=>[n.id,n]));
let passed=0;
function check(name,run){run();passed++;console.log('PASS: '+name);}
const graphParent=n=>n.relatedOnly?null:n.treeParentId||n.fatherId;
function reached(db){
  const ids=new Set([db.rootId]);let changed=true;
  while(changed){changed=false;for(const n of db.nodes)if(ids.has(graphParent(n))&&!ids.has(n.id)){ids.add(n.id);changed=true;}}
  return ids;
}
check('输入未改写；全体档案、真实父亲、引用与原关系完整保留',()=>{
  assert.equal(JSON.stringify(before),frozen);
  assert.equal(after.nodes.length,360);
  assert.deepEqual(after.nodes.map(n=>n.id),before.nodes.map(n=>n.id));
  assert.deepEqual(after.relations,before.relations);
  assert.deepEqual(after.sources,before.sources);
  for(const n of before.nodes){assert.equal(idx.get(n.id).fatherId,n.fatherId,n.id);assert.deepEqual(idx.get(n.id).refs,n.refs,n.id);}
});
check('23个关联根仅断开犹大归类边，不删档案或设置relatedOnly',()=>{
  assert.equal(after.relatedFamilies.length,23);
  for(const f of after.relatedFamilies){const n=idx.get(f.rootId);assert.equal(n.treeParentId,undefined,f.rootId);assert.ok(n.relatedFamilyRoot);assert.equal(n.relatedOnly,before.nodes.find(x=>x.id===n.id).relatedOnly);assert.ok(f.title&&f.category&&f.note&&f.refs.length);assert.equal(f.nodeIds[0]===f.rootId||f.nodeIds.includes(f.rootId),true);}
});
check('主图266位、42位主线全保留，北国家族不再挂在犹大下',()=>{
  const ids=reached(after);assert.equal(ids.size,266);assert.deepEqual(after.mainPath,before.mainPath);assert.equal(after.mainPath.length,42);
  for(const id of after.mainPath)assert.ok(ids.has(id),id);
  for(const f of after.relatedFamilies)assert.ok(!ids.has(f.rootId),f.rootId);
  for(const id of ['jeroboam_i','baasha_israel','ahab_israel','jehu_israel','hoshea_israel'])assert.ok(!ids.has(id),id);
});
check('外家成员取父系优先，拿辖女儿保留本家而不改主图姐妹位置',()=>{
  const f=after.relatedFamilies.find(f=>f.rootId==='nahash_abigail_father');
  assert.ok(f.nodeIds.includes('abigail_david_sister'));
  assert.equal(idx.get('abigail_david_sister').treeParentId,'jesse');
  assert.equal(idx.get('abigail_david_sister').fatherId,'nahash_abigail_father');
  assert.ok(!f.nodeIds.includes('amasa_jether'));
});
check('母系亚玛撒仍有益帖生父，母子出处存在且两种树父系无环',()=>{
  const n=idx.get('amasa_jether');assert.equal(n.fatherId,'jether_ishmaelite');assert.equal(n.treeParentId,'abigail_david_sister');assert.equal(n.lineageKind,'maternal');assert.ok(n.lineageLabel);
  assert.ok(after.relations.some(r=>r.type==='mother-child'&&r.source===n.treeParentId&&r.target===n.id));
  assert.ok(reached(after).has(n.id));
  assert.ok(after.relatedFamilies.find(f=>f.rootId==='jether_ishmaelite').nodeIds.includes(n.id));
  for(const field of ['fatherId','diagram'])for(const node of after.nodes){const seen=new Set();let id=node.id;while(id){assert.ok(!seen.has(id),field+':'+id);seen.add(id);const current=idx.get(id);assert.ok(current);id=field==='diagram'?graphParent(current):current.fatherId;}}
});
check('11位王室妻母仍能标注，外家不沿母系递归复制犹大后代',()=>{
  const ids=['maacah_david','bathsheba','azubah_asa','jerusha','abi_hezekiah','meshullemeth','jedidah','zebidah','nehushta','hamutal','athaliah'];
  const main=reached(after);
  for(const id of ids){assert.ok(idx.has(id));assert.ok(!main.has(id));assert.ok(after.relations.some(r=>r.type==='mother-child'&&r.source===id&&main.has(r.target)),id);}
  for(const [root,forbidden] of [['ammihud_geshur','absalom_david'],['ahithophel_gilonite','solomon'],['omri_israel','ahaziah_judah'],['shilhi_azubah','jehoshaphat']])assert.ok(!after.relatedFamilies.find(f=>f.rootId===root).nodeIds.includes(forbidden),root);
});
check('群体保持群体，婚入者与母系亲属不因出身被整支误删',()=>{
  const ids=reached(after);
  for(const id of ['jarha_egyptian','sheshan_daughter','zeruiah_david_sister','abigail_david_sister','joab_zeruiah'])assert.ok(ids.has(id),id);
  assert.equal(idx.get('hammath_scribal_families').kind,'group');
  assert.ok(after.relatedFamilies.find(f=>f.rootId==='hammath_kenite').nodeIds.includes('hammath_scribal_families'));
  for(const id of ['jadai_judah','kenaz_othniel','jephunneh_caleb','elimelech_ruth','nabal_carmelite'])assert.ok(ids.has(id),id);
});
check('重复应用不重复家族、不丢成员或说明',()=>{
  assert.deepEqual(applyJudahRelatedFamilies(after),after);
});
check('缺少已有母子经文关系时停止，不静默制造母系线',()=>{
  const broken=JSON.parse(frozen);broken.relations=broken.relations.filter(r=>!(r.type==='mother-child'&&r.source==='abigail_david_sister'&&r.target==='amasa_jether'));
  assert.throws(()=>applyJudahRelatedFamilies(broken),/缺少既有经文母子关系/);
});
console.log('\n'+passed+'组犹大关联家族拆分检查通过。');
