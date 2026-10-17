#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {buildData,tribePages,subtreeIds}=require('./build-tree-data.cjs');
const read=file=>JSON.parse(fs.readFileSync(path.join(__dirname,file),'utf8'));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,file))).digest('hex');
const originals=['../data/adam-noah.json','../data/noah-abraham.json','abraham-jacob-children.json','jacob-tribes.json'];
const before=Object.fromEntries(originals.map(f=>[f,hash(f)]));
// Validate the original split independently from the later, additive expansions.
const data=buildData({includeExpansions:false}),source=read('jacob-tribes.json');
const sourceMap=new Map(source.nodes.map(n=>[n.id,n]));
const sameIds=(a,b)=>assert.deepEqual([...a].sort(),[...b].sort());
let passed=0,failed=0;
const check=(name,run)=>{try{run();passed++;console.log('PASS: '+name);}catch(e){failed++;console.error('FAIL: '+name+' — '+e.message);}};
const splitKeys=['jacob-tribes',...tribePages.filter(p=>p.rootId!=='judah').map(p=>p.key)];

check('原三段数据内容完整保留，原始80人JSON未被修改',()=>{
  for(const[key,file]of [['adam-noah',originals[0]],['noah-abraham',originals[1]],['abraham-jacob',originals[2]]])assert.deepEqual(data[key],read(file));
  for(const file of originals)assert.equal(hash(file),before[file]);
  assert.equal(source.nodes.length,80);assert.equal(source.treeNodeIds.length,72);
});

check('十二支派选项各有独立key；总览十二子链接逐项对应',()=>{
  assert.equal(tribePages.length,12);assert.equal(new Set(tribePages.map(p=>p.key)).size,12);
  assert.equal(tribePages.find(p=>p.rootId==='judah').key,'judah-jesus');
  assert.equal(tribePages.find(p=>p.rootId==='joseph_patriarch').key,'tribe-joseph');
  for(const page of tribePages){
    const node=data['jacob-tribes'].nodes.find(n=>n.id===page.rootId);
    assert.ok(node.crossPageLinks.some(l=>l.tree===page.key&&l.personId===page.rootId));
  }
});

check('总览仅14个父系节点，保留十二子、底拿和四母的全部母子关系',()=>{
  const d=data['jacob-tribes'];
  assert.equal(d.rootId,'jacob');
  sameIds(d.treeNodeIds,['jacob',...tribePages.map(p=>p.rootId),'dinah']);
  sameIds(d.nodes.filter(n=>n.fatherId==='jacob').map(n=>n.id),[...tribePages.map(p=>p.rootId),'dinah']);
  assert.equal(d.nodes.filter(n=>n.tribeOrigin).length,12);
  assert.equal(d.nodes.find(n=>n.id==='dinah').tribeOrigin,false);
  assert.equal(d.tribeMapping.length,12);
  for(const original of source.relations.filter(r=>r.type==='mother-child'&&['jacob',...tribePages.map(p=>p.rootId),'dinah'].includes(r.target)))assert.ok(d.relations.some(r=>JSON.stringify(r)===JSON.stringify(original)));
  assert.equal(d.relations.filter(r=>r.type==='mother-child').length,13);
  assert.equal(d.nodes.find(n=>n.id==='jacob').notes.includes('80'),false);
});

check('11个普通分支完整保留创46全部原始后代，父系除分段根外不改变',()=>{
  for(const page of tribePages.filter(p=>p.rootId!=='judah')){
    const d=data[page.key],ids=subtreeIds(source,page.rootId);
    assert.equal(d.rootId,page.rootId);sameIds(d.treeNodeIds,ids);assert.deepEqual(d.mainPath,[page.rootId]);
    assert.equal(d.nodes.find(n=>n.id===page.rootId).fatherId,null);
    for(const node of d.nodes.filter(n=>ids.has(n.id)&&n.id!==page.rootId)){
      assert.equal(node.fatherId,sourceMap.get(node.id).fatherId);
      assert.deepEqual(node.refs,sourceMap.get(node.id).refs);
      assert.equal(node.notes,sourceMap.get(node.id).notes);
    }
    assert.ok(!d.tribeMapping);
    assert.equal(d.nodes.filter(n=>n.tribeOrigin).length,1);
  }
});

check('分支根保留雅各父亲身份、生母与返回总览链接，不引入其他十一兄弟',()=>{
  for(const page of tribePages.filter(p=>p.rootId!=='judah')){
    const d=data[page.key],root=d.nodes.find(n=>n.id===page.rootId),jacob=d.nodes.find(n=>n.id==='jacob');
    assert.equal(root.originFatherId,'jacob');assert.ok(root.originNote.startsWith('雅各与'));
    assert.equal(jacob.fatherId,null);assert.ok(!d.treeNodeIds.includes('jacob'));
    assert.ok(root.crossPageLinks.some(l=>l.tree==='jacob-tribes'&&l.personId===page.rootId));
    assert.ok(jacob.crossPageLinks.some(l=>l.tree==='jacob-tribes'&&l.personId==='jacob'));
    assert.equal(d.nodes.filter(n=>n.fatherId==='jacob').length,0);
    for(const other of tribePages.filter(p=>p.rootId!==page.rootId))assert.ok(!d.nodes.some(n=>n.id===other.rootId));
    const mother=source.relations.find(r=>r.type==='mother-child'&&r.target===page.rootId);
    assert.ok(d.relations.some(r=>JSON.stringify(r)===JSON.stringify(mother)));
  }
});

check('关联亲属只引入本图所需一层配偶、生母与雅各，不沿妻妾递归加入外家',()=>{
  for(const page of tribePages.filter(p=>p.rootId!=='judah')){
    const d=data[page.key],tree=subtreeIds(source,page.rootId),expected=new Set([...tree,'jacob']);
    for(const relation of source.relations){
      if(relation.type==='mother-child'&&tree.has(relation.target))expected.add(relation.source);
      if(['spouse','concubine'].includes(relation.type)){
        if(tree.has(relation.source))expected.add(relation.target);
        if(tree.has(relation.target))expected.add(relation.source);
      }
    }
    sameIds(d.nodes.map(n=>n.id),expected);
  }
});

check('所有分库ID唯一、父亲与关系端点有效、父系无环且可达集等于treeNodeIds',()=>{
  for(const key of splitKeys){
    const d=data[key],nodes=new Map(d.nodes.map(n=>[n.id,n]));
    assert.equal(nodes.size,d.nodes.length);
    for(const n of d.nodes){
      assert.ok(n.fatherId===null||nodes.has(n.fatherId),key+': invalid father '+n.id);
      if(n.originFatherId)assert.ok(nodes.has(n.originFatherId));
      const seen=new Set([n.id]);let p=n.fatherId;
      while(p){assert.ok(!seen.has(p),key+': cycle '+n.id);seen.add(p);p=nodes.get(p).fatherId;}
    }
    for(const r of d.relations){assert.ok(nodes.has(r.source));assert.ok(nodes.has(r.target));}
    sameIds(subtreeIds(d,d.rootId),d.treeNodeIds);
  }
});

check('截取后的关系与原始关系逐条一致，所有在本库的关系都未遗漏',()=>{
  for(const key of splitKeys){
    const d=data[key],ids=new Set(d.nodes.map(n=>n.id));
    assert.deepEqual(d.relations,source.relations.filter(r=>ids.has(r.source)&&ids.has(r.target)));
  }
});

check('约瑟仍生玛拿西、以法莲，利未城邑与郊野、便雅悯异文完整保留',()=>{
  const d=data['tribe-joseph'];
  sameIds(d.nodes.filter(n=>n.fatherId==='joseph_patriarch').map(n=>n.id),['manasseh','ephraim']);
  assert.ok(d.nodes.some(n=>n.id==='asenath'));
  for(const id of ['joseph_patriarch','manasseh','ephraim'])assert.deepEqual(d.nodes.find(n=>n.id===id).tribeInfo,sourceMap.get(id).tribeInfo);
  assert.ok(data['tribe-levi'].nodes.find(n=>n.id==='levi').tribeInfo.landLabel.includes('郊野'));
  for(const id of ['ard_benjamin','naaman_benjamin'])assert.equal(data['tribe-benjamin'].nodes.find(n=>n.id===id).notes,sourceMap.get(id).notes);
});

check('总览及11分支计数随截取数据重算，无沿用80人72节点统计',()=>{
  for(const key of splitKeys){
    const d=data[key],c=d.counts,ids=new Set(d.treeNodeIds);
    assert.equal(c.nodes,d.nodes.length);assert.equal(c.personRecords,d.nodes.length);assert.equal(c.treeNodes,ids.size);
    assert.equal(c.relatedOnly,d.nodes.length-ids.size);assert.equal(c.parentEdges,ids.size-1);
    assert.equal(c.crossRelations,d.relations.length);assert.equal(c.mainPathNodes,1);
    assert.equal(c.tribeMappingEntries,(d.tribeMapping||[]).length);
    assert.equal(c.tribeInfoEntries,d.nodes.filter(n=>n.tribeInfo).length);
    assert.ok(c.nodes<80);assert.ok(c.treeNodes<72);
  }
});

if(data['judah-jesus'])check('犹大独立资料已载入且总览主线跳转目标存在',()=>{
  assert.deepEqual(data['judah-jesus'],read('judah-jesus.json'));
  assert.equal(data['judah-jesus'].rootId,'judah');
  assert.ok(data['judah-jesus'].nodes.some(n=>n.id==='judah'));
});
else console.log('INFO: 犹大→耶稣JSON尚未就绪，单独资料校验暂不运行。');

console.log(`\n${passed}通过，${failed}失败。`);
if(failed)process.exitCode=1;
