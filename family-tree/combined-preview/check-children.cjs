#!/usr/bin/env node
"use strict";
// Run: node family-tree/combined-preview/check-children.cjs
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),assert=require("node:assert/strict");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"abraham-jacob-children.json"),"utf8"));
const sourcePath=path.join(__dirname,"..","data","abraham-jacob.json");
const originalBytes=fs.readFileSync(sourcePath),original=JSON.parse(originalBytes.toString("utf8"));
const nodes=data.nodes,byId=new Map(nodes.map(n=>[n.id,n]));
const get=id=>{assert.ok(byId.has(id),"缺少节点："+id);return byId.get(id);};
const children=id=>nodes.filter(n=>n.fatherId===id).map(n=>n.id).sort();
const maternal=id=>data.relations.filter(r=>r.type==="mother-child"&&r.source===id).map(r=>r.target).sort();
const same=(actual,expected)=>assert.deepEqual([...actual].sort(),[...expected].sort());
const sons=["reuben","simeon","levi","judah","dan","naphtali","gad","asher","issachar","zebulun","joseph_patriarch","benjamin"];
const mothers={leah:["reuben","simeon","levi","judah","issachar","zebulun","dinah"],bilhah:["dan","naphtali"],zilpah:["gad","asher"],rachel:["joseph_patriarch","benjamin"],asenath:["manasseh","ephraim"]};
let passed=0,failed=0;
function check(label,fn){try{fn();passed++;console.log("PASS: "+label);}catch(e){failed++;console.error("FAIL: "+label+" — "+e.message);}}
const chapters={16:16,17:27,21:34,25:34,28:22,29:35,30:43,35:29,36:43,41:57,48:22,49:33};
function refsValid(refs){
 assert.ok(Array.isArray(refs)&&refs.length);
 for(const ref of refs){
  const m=/^(创世记|申命记|约书亚记)(\d+):(\d+)(?:[–-](\d+))?$/.exec(ref);assert.ok(m,"出处格式："+ref);
  const chapter=Number(m[2]),first=Number(m[3]),last=Number(m[4]||m[3]);
  const max=m[1]==="创世记"?chapters[chapter]:m[1]==="申命记"&&chapter===10?22:m[1]==="约书亚记"&&chapter===14?15:0;
  assert.ok(max,"未知章："+ref);assert.ok(first>0&&last>=first&&last<=max,"节号越界："+ref);
 }
}
check("76条记录、44条关系，稳定ID唯一",()=>{
 assert.equal(nodes.length,76);assert.equal(byId.size,76);assert.equal(data.relations.length,44);
 assert.equal(nodes.filter(n=>n.kind==="person").length,73);assert.equal(nodes.filter(n=>n.kind==="group").length,3);
});
check("原60项全部保留，姓名父系类别与已有经文事实未更改",()=>{
 assert.equal(original.nodes.length,60);
 for(const old of original.nodes){
  const n=get(old.id);for(const key of ["name","fatherId","kind","gender","relation"])assert.deepEqual(n[key],old[key],old.id+" "+key);
  for(const ref of old.refs)assert.ok(n.refs.includes(ref));
  for(const event of old.events)assert.ok(n.events.some(e=>JSON.stringify(e)===JSON.stringify(event)));
 }
 for(const old of original.relations)assert.ok(data.relations.some(r=>JSON.stringify(r)===JSON.stringify(old)));
});
check("父级/关系端点与经文出处有效，父母合并无有向环",()=>{
 const graph=new Map(nodes.map(n=>[n.id,[]])),seen=new Set();
 for(const n of nodes){refsValid(n.refs);for(const e of n.events)refsValid(e.refs);if(n.fatherId!==null){get(n.fatherId);assert.notEqual(n.fatherId,n.id);graph.get(n.fatherId).push(n.id);}}
 for(const r of data.relations){
  get(r.source);get(r.target);refsValid(r.refs);assert.notEqual(r.source,r.target);
  const key=[r.type,r.source,r.target].join(":");assert.ok(!seen.has(key));seen.add(key);
  if(r.type==="mother-child"){assert.equal(get(r.source).gender,"female");graph.get(r.source).push(r.target);}
 }
 for(const item of data.tribeExplanation)refsValid(item.refs);
 const colors=new Map();function visit(id){assert.notEqual(colors.get(id),1,"亲子环："+id);if(colors.get(id)===2)return;colors.set(id,1);graph.get(id).forEach(visit);colors.set(id,2);}nodes.forEach(n=>visit(n.id));
});
check("十二子与底拿完整，十二子序号1至12不把底拿算入",()=>{
 same(children("jacob"),[...sons,"dinah"]);
 sons.forEach((id,index)=>{assert.equal(get(id).sonOrder,index+1);assert.equal(get(id).tribeOrigin,true);assert.equal(get(id).gender,"male");});
 same(nodes.filter(n=>n.tribeOrigin===true).map(n=>n.id),sons);
 assert.equal(get("dinah").gender,"female");assert.equal(get("dinah").tribeOrigin,false);assert.equal(get("dinah").sonOrder,undefined);
 assert.equal(get("dinah").relation,"女儿");assert.equal(get("benjamin").aliases.includes("便俄尼"),true);
});
check("四母分组：利亚六子一女、辟拉二、悉帕二、拉结二",()=>{
 for(const [mother,ids]of Object.entries(mothers))same(maternal(mother),ids);
 for(const child of [...sons,"dinah"]){
  const edges=data.relations.filter(r=>r.type==="mother-child"&&r.target===child);assert.equal(edges.length,1,"生母重复："+child);
  assert.equal(edges[0].relation,child==="dinah"?"母女":"母子");
 }
 assert.ok(!maternal("rachel").includes("dan"));assert.ok(!maternal("rachel").includes("naphtali"));
 assert.ok(!maternal("leah").includes("gad"));assert.ok(!maternal("leah").includes("asher"));
});
check("约瑟与亚西纳及两子正确，不改成雅各的亲生二子",()=>{
 assert.equal(get("asenath").fatherId,null);assert.equal(get("asenath").gender,"female");
 assert.ok(get("asenath").originNote.includes("波提非拉"));
 assert.ok(data.relations.some(r=>r.type==="spouse"&&r.source==="joseph_patriarch"&&r.target==="asenath"));
 same(children("joseph_patriarch"),["manasseh","ephraim"]);
 assert.equal(get("manasseh").relation,"长子");assert.equal(get("ephraim").relation,"次子");
 assert.equal(get("manasseh").fatherId,"joseph_patriarch");assert.equal(get("ephraim").fatherId,"joseph_patriarch");
 same(maternal("asenath"),["manasseh","ephraim"]);
});
check("以扫三妻五子十孙保留，不臆补其孙子的生母",()=>{
 same(children("esau"),["eliphaz_esau","reuel_esau","jeush_esau","jalam_esau","korah_esau"]);
 same(children("eliphaz_esau"),["teman_eliphaz","omar_eliphaz","zepho_eliphaz","gatam_eliphaz","kenaz_eliphaz","amalek_eliphaz"]);
 same(children("reuel_esau"),["nahath_reuel","zerah_reuel","shammah_reuel","mizzah_reuel"]);
 same(maternal("adah_esau"),["eliphaz_esau"]);same(maternal("basemath_esau"),["reuel_esau"]);
 same(maternal("oholibamah_esau"),["jeush_esau","jalam_esau","korah_esau"]);same(maternal("timna_eliphaz"),["amalek_eliphaz"]);
 const grandchildren=[...children("eliphaz_esau"),...children("reuel_esau")];
 for(const id of grandchildren.filter(id=>id!=="amalek_eliphaz"))assert.equal(data.relations.filter(r=>r.type==="mother-child"&&r.target===id).length,0);
 assert.ok(get("adah_esau").notes.includes("创26:34"));assert.ok(get("basemath_esau").notes.includes("玛哈拉"));
});
check("主线不延长，64项父系可达及数量元数据一致",()=>{
 assert.deepEqual(data.mainPath,["abraham","isaac","jacob"]);assert.equal(data.rootId,"abraham");
 const reached=new Set(["abraham"]);let changed=true;while(changed){changed=false;for(const n of nodes)if(reached.has(n.fatherId)&&!reached.has(n.id)){reached.add(n.id);changed=true;}}
 same([...reached],data.treeNodeIds);assert.equal(reached.size,64);assert.equal(new Set(data.treeNodeIds).size,64);
 assert.equal(nodes.filter(n=>n.fatherId!==null).length,63);
 const expected={nodes:76,personRecords:73,groupRecords:3,treeNodes:64,spouseOnly:12,parentEdges:63,crossRelations:44,spouseRelations:9,concubineRelations:4,motherChildRelations:31,jacobChildrenInThisStage:13,jacobNamedSons:12,jacobNamedDaughters:1,josephNamedSons:2,esauExplicitGrandsons:10};
 for(const[key,value]of Object.entries(expected))assert.equal(data.counts[key],value,key);
});
check("旧的雅各无子女/留待下一段限定已清除，支派解释有原文出处",()=>{
 for(const n of nodes)assert.ok(!/不展开雅各|其子女将在下一段|十二子、底拿和孙辈将在下一段/.test(n.notes),n.id);
 assert.ok(!/不展开雅各|本阶段不展开|耶稣/.test(data.scope));
 assert.ok(data.tribeExplanation.some(t=>t.refs.includes("创世记49:28")));
 assert.ok(data.tribeExplanation.some(t=>t.refs.includes("创世记48:5–6")));
 assert.ok(data.tribeExplanation.some(t=>t.refs.includes("申命记10:8–9")&&t.refs.includes("约书亚记14:3–4")));
 assert.ok(get("benjamin").notes.includes("不据35:26"));
});
check("原60项源JSON的SHA-256保持原样",()=>{
 const hash=crypto.createHash("sha256").update(originalBytes).digest("hex");
 assert.equal(hash,"b89d1ea2733c9b211ede652d876f26ee529878d6dff39e8c0b4c809c178028e6");
});
console.log("\n校验结果："+passed+"项通过，"+failed+"项失败。");
console.log("76条记录（73人物、3族群）；雅各12子+底拿，约瑟2子为下一代。");
process.exitCode=failed?1:0;

