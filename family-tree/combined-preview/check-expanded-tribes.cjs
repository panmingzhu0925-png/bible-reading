'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {buildData,tribePages}=require('./build-tree-data.cjs');
const data=buildData(),base=buildData({includeExpansions:false});
const read=file=>JSON.parse(fs.readFileSync(path.join(__dirname,file),'utf8'));
let passed=0;
function check(name,run){run();passed++;console.log('PASS: '+name);}
const graphParent=n=>n.relatedOnly?null:n.treeParentId||n.fatherId;
const keys=tribePages.map(p=>p.key);
check('三段旧资料和十二子总览不因扩展发生内容变化',()=>{
  for(const key of ['adam-noah','noah-abraham','abraham-jacob','jacob-tribes'])assert.deepEqual(data[key],base[key]);
});
check('十二支派均载入扩展、经文来源、原图核对说明',()=>{
  assert.equal(keys.length,12);for(const key of keys){const d=data[key];assert.ok(d.expansionApplied,key);assert.ok(d.nodes.length>base[key].nodes.length,key);assert.ok(d.imageCoverage.length,key);assert.ok(d.sources.every(s=>s.title&&/^https:/.test(s.url)),key);}
});
check('扩展节点唯一、字段和所有父系及图面端点可解析',()=>{
  for(const key of [...keys,'judah-luke']){const d=data[key],map=new Map(d.nodes.map(n=>[n.id,n]));assert.equal(map.size,d.nodes.length,key);for(const n of d.nodes){assert.ok(n.name);assert.ok(['person','group'].includes(n.kind));assert.ok(['male','female','unknown'].includes(n.gender));assert.ok(n.refs?.length);assert.ok(n.refs.every(r=>/^[^\d]+\d+(?::[\d、,–-]+)?$/.test(r)),key+':'+n.id);for(const field of ['fatherId','treeParentId','originFatherId'])if(n[field])assert.ok(map.has(n[field]),key+':'+n.id+':'+field);}for(const r of d.relations){assert.ok(map.has(r.source));assert.ok(map.has(r.target));assert.ok(r.refs?.length);}}
});
check('真实父系和图面两种路径无环；可达集与图面计数一致',()=>{
  for(const key of [...keys,'judah-luke']){const d=data[key],map=new Map(d.nodes.map(n=>[n.id,n]));for(const field of ['fatherId','diagram'])for(const n of d.nodes){const seen=new Set();let id=n.id;while(id){assert.ok(!seen.has(id),key+' '+field+' 环 '+id);seen.add(id);const node=map.get(id);id=field==='diagram'?graphParent(node):node.fatherId;}}
    const reached=new Set([d.rootId]);let changed=true;while(changed){changed=false;for(const n of d.nodes)if(reached.has(graphParent(n))&&!reached.has(n.id)){reached.add(n.id);changed=true;}}
    assert.deepEqual([...reached].sort(),[...d.treeNodeIds].sort(),key);
    assert.ok(d.nodes.filter(n=>n.relatedOnly).every(n=>!reached.has(n.id)),key);
    if(d.counts){assert.equal(d.counts.nodes,d.nodes.length);assert.equal(d.counts.treeNodes,reached.size);assert.equal(d.counts.relatedOnly,d.nodes.length-reached.size);}
  }
});
check('非父系连接必有旁注，母系连接必有相应母子经文关系',()=>{
  for(const key of keys){const d=data[key];for(const n of d.nodes.filter(n=>n.treeParentId&&!n.relatedOnly)){assert.ok(n.lineageKind&&n.lineageLabel,key+':'+n.id);if(n.lineageKind==='maternal')assert.ok(d.relations.some(r=>r.type==='mother-child'&&r.source===n.treeParentId&&r.target===n.id),key+':'+n.id);}}
});
check('创46原有每支父系不被后来的家谱静默改接',()=>{
  for(const key of keys){const before=new Map(base[key].nodes.map(n=>[n.id,n]));for(const n of data[key].nodes)if(before.has(n.id)&&before.get(n.id).fatherId)assert.equal(n.fatherId,before.get(n.id).fatherId,key+':'+n.id);}
});
check('太1主线42谱位、四处省代及约瑟非生父语义保持',()=>{
  const d=data['judah-jesus'],original=read('judah-jesus.json'),map=new Map(d.nodes.map(n=>[n.id,n]));assert.deepEqual(d.mainPath,original.mainPath);assert.equal(d.mainPath.length,42);for(const n of original.nodes.filter(n=>original.mainPath.includes(n.id)))for(const field of ['fatherId','lineageKind','lineageLabel','treeNote'])assert.equal(map.get(n.id)[field],n[field],n.id+':'+field);assert.ok(d.relations.some(r=>r.type==='mother-child'&&r.source==='mary'&&r.target==='jesus'));
});
check('路3独立53谱位，拿单一线不冒接马利亚父亲',()=>{
  const d=data['judah-luke'],map=new Map(d.nodes.map(n=>[n.id,n]));assert.equal(d.mainPath.length,53);assert.equal(d.mainPath[0],'judah');assert.equal(d.mainPath.at(-1),'jesus');assert.equal(map.get('nathan_david').fatherId,'david');assert.equal(map.get('joseph_husband_mary').lineageKind,'genealogy');assert.equal(map.get('jesus').lineageKind,'household');assert.equal(map.get('mary').fatherId,null);assert.ok(!d.mainPath.includes('solomon'));assert.equal(d.nodes.filter(n=>n.name==='希里').length,1);assert.equal(map.get(map.get('joseph_husband_mary').fatherId).name,'希里');
  // Independent text-order comparison with the previous, separately transcribed Luke list.
  const source=fs.readFileSync(path.join(__dirname,'../../genealogy-data.js'),'utf8'),text=/const reverseLuke='([^']+)'/.exec(source)[1].split('|');const toJudah=text.slice(0,text.indexOf('犹大',text.indexOf('大卫'))+1).map(s=>s==='耶稣基督'?'耶稣':s==='希斯仑'?'希斯仑':s);assert.deepEqual(d.mainPath.map(id=>map.get(id).name).reverse(),toJudah);
});
check('马利亚拿单支系解释附出处而不改写父系与经文母子关系',()=>{
  for(const key of ['judah-jesus','judah-luke']){const d=data[key],map=new Map(d.nodes.map(n=>[n.id,n]));assert.equal(map.get('mary').fatherId,null);assert.ok(map.get('mary').interpretation.boundary.includes('没有直接写出'));assert.ok(map.get('nathan_david').interpretation);assert.ok(map.get('jesus').treeInterpretation.includes('释经解释'));assert.equal(map.get('jesus').lineageKind,'household');assert.ok(d.relations.some(r=>r.type==='mother-child'&&r.source==='mary'&&r.target==='jesus'));assert.ok(!d.relations.some(r=>r.type==='father-child'&&r.target==='mary'));assert.ok(d.maryNathanGuide.refs.includes('路加福音3:23–31'));assert.ok(d.maryNathanGuide.interpretationSource.url.includes('gbc.org.tw'));assert.equal(data['judah-luke'].nodes.find(n=>n.id===d.maryNathanGuide.heliId).name,'希里');}
});
console.log('\n'+passed+'组整合检查通过。');
for(const key of keys){const d=data[key];console.log(key+': '+d.nodes.length+'档案 / '+d.treeNodeIds.length+'图面条目');}
