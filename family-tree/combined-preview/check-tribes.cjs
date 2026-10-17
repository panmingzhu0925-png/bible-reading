#!/usr/bin/env node
"use strict";
// Run: node family-tree/combined-preview/check-tribes.cjs
// Read-only data and source-integrity validation.
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),assert=require("node:assert/strict");
const d=JSON.parse(fs.readFileSync(path.join(__dirname,"jacob-tribes.json"),"utf8"));
const nodes=d.nodes,byId=new Map(nodes.map(n=>[n.id,n]));
const get=id=>{assert.ok(byId.has(id),"缺少节点："+id);return byId.get(id);};
const children=id=>nodes.filter(n=>n.fatherId===id).map(n=>n.id).sort();
const maternal=id=>d.relations.filter(r=>r.type==="mother-child"&&r.source===id).map(r=>r.target).sort();
const same=(a,b)=>assert.deepEqual([...a].sort(),[...b].sort());
const partner=id=>d.relations.filter(r=>["spouse","concubine"].includes(r.type)&&(r.source===id||r.target===id)).map(r=>r.source===id?r.target:r.source).sort();
const sons=["reuben","simeon","levi","judah","dan","naphtali","gad","asher","issachar","zebulun","joseph_patriarch","benjamin"];
const mothers=["leah","leah","leah","leah","bilhah","bilhah","zilpah","zilpah","leah","leah","rachel","rachel"];
const expectedFamilies={
 jacob:[...sons,"dinah"],
 reuben:["hanoch_reuben","pallu_reuben","hezron_reuben","carmi_reuben"],
 simeon:["jemuel_simeon","jamin_simeon","ohad_simeon","jachin_simeon","zohar_simeon","shaul_simeon"],
 levi:["gershon_levi","kohath_levi","merari_levi"],
 judah:["er_judah","onan_judah","shelah_judah","perez","zerah_judah"],
 perez:["hezron_perez","hamul_perez"],
 issachar:["tola_issachar","puah_issachar","job_issachar","shimron_issachar"],
 zebulun:["sered_zebulun","elon_zebulun","jahleel_zebulun"],
 gad:["ziphion_gad","haggi_gad","shuni_gad","ezbon_gad","eri_gad","arodi_gad","areli_gad"],
 asher:["imnah_asher","ishvah_asher","ishvi_asher","beriah_asher","serah_asher"],
 beriah_asher:["heber_beriah","malchiel_beriah"],
 joseph_patriarch:["manasseh","ephraim"],
 benjamin:["bela_benjamin","becher_benjamin","ashbel_benjamin","gera_benjamin","naaman_benjamin","ehi_benjamin","rosh_benjamin","muppim_benjamin","huppim_benjamin","ard_benjamin"],
 dan:["hushim_dan"],
 naphtali:["jahzeel_naphtali","guni_naphtali","jezer_naphtali","shillem_naphtali"]
};
const maxima={
 "创世记":{25:34,28:22,29:35,30:43,35:29,38:30,41:57,46:34,48:22,49:33},
 "民数记":{1:54,26:65},"申命记":{10:22},
 "约书亚记":{13:33,14:15,15:63,16:10,17:18,18:28,19:51,21:45}
};
function refsValid(refs,owner){
 assert.ok(Array.isArray(refs)&&refs.length,"缺少出处："+owner);
 for(const ref of refs){
  const m=/^(创世记|民数记|申命记|约书亚记)(\d+):(\d+)(?:[–-](\d+))?$/.exec(ref);assert.ok(m,"出处格式："+ref);
  const chapter=Number(m[2]),first=Number(m[3]),last=Number(m[4]||m[3]),max=maxima[m[1]]?.[chapter];
  assert.ok(max,"章数核对表未覆盖："+ref);assert.ok(first>=1&&last>=first&&last<=max,"节号越界："+ref);
 }
}
let passed=0,failed=0;
function check(label,fn){try{fn();passed++;console.log("PASS: "+label);}catch(e){failed++;console.error("FAIL: "+label+" — "+e.message);}}
check("80个人物ID唯一，节点字段与经文出处有效",()=>{
 assert.equal(nodes.length,80);assert.equal(byId.size,80);
 for(const n of nodes){assert.ok(/^[a-z0-9_]+$/.test(n.id));assert.ok(n.name);assert.equal(n.kind,"person");assert.ok(["male","female"].includes(n.gender));assert.ok(n.fatherId===null||typeof n.fatherId==="string");assert.equal(typeof n.notes,"string");assert.ok(Array.isArray(n.events));refsValid(n.refs,n.id);for(const e of n.events){assert.ok(e.text);refsValid(e.refs,n.id+"事件");}}
});
check("根为雅各，主线1人，72项父系可达与8个关联档案",()=>{
 assert.equal(d.rootId,"jacob");assert.deepEqual(d.mainPath,["jacob"]);assert.equal(get("jacob").fatherId,null);
 const reached=new Set(["jacob"]);let changed=true;while(changed){changed=false;for(const n of nodes)if(reached.has(n.fatherId)&&!reached.has(n.id)){reached.add(n.id);changed=true;}}
 same([...reached],d.treeNodeIds);assert.equal(new Set(d.treeNodeIds).size,72);assert.equal(reached.size,72);
 same(nodes.filter(n=>!reached.has(n.id)).map(n=>n.id),["leah","rachel","bilhah","zilpah","asenath","tamar","judah_wife_shua_daughter","shaul_simeon_mother"]);
});
check("创46全部选定家庭名单逐名完整",()=>{
 for(const[father,ids]of Object.entries(expectedFamilies))same(children(father),ids);
 assert.equal(get("serah_asher").gender,"female");assert.equal(get("serah_asher").relation,"女儿");
 assert.equal(get("dinah").gender,"female");assert.equal(get("dinah").tribeOrigin,false);
});
check("原21个稳定人物沿用，四母与约瑟家庭关系保留",()=>{
 const source=JSON.parse(fs.readFileSync(path.join(__dirname,"abraham-jacob-children.json"),"utf8"));
 const selected=new Set(["jacob",...sons,"dinah","leah","rachel","bilhah","zilpah","asenath","manasseh","ephraim"]);
 assert.equal(selected.size,21);
 for(const old of source.nodes.filter(n=>selected.has(n.id))){const n=get(old.id);assert.equal(n.name,old.name);assert.equal(n.gender,old.gender);if(n.id!=="jacob")assert.equal(n.fatherId,old.fatherId);}
 for(const old of source.relations.filter(r=>selected.has(r.source)&&selected.has(r.target)))assert.ok(d.relations.some(r=>JSON.stringify(r)===JSON.stringify(old)));
});
check("十二子顺序、生母映射与13个具名儿女一致",()=>{
 assert.equal(d.tribeMapping.length,12);
 sons.forEach((id,i)=>{assert.equal(get(id).sonOrder,i+1);assert.equal(get(id).tribeOrigin,true);assert.deepEqual(d.tribeMapping[i],{personId:id,motherId:mothers[i]});assert.ok(d.relations.some(r=>r.type==="mother-child"&&r.source===mothers[i]&&r.target===id));});
 same(maternal("leah"),["reuben","simeon","levi","judah","issachar","zebulun","dinah"]);
 same(maternal("bilhah"),["dan","naphtali"]);same(maternal("zilpah"),["gad","asher"]);same(maternal("rachel"),["joseph_patriarch","benjamin"]);
});
check("14项支派说明字段、出处及利未/约瑟特别安排齐全",()=>{
 same(nodes.filter(n=>n.tribeInfo).map(n=>n.id),[...sons,"manasseh","ephraim"]);
 for(const n of nodes.filter(n=>n.tribeInfo)){const t=n.tribeInfo;assert.ok(t.ancestralLabel);refsValid(t.ancestralRefs,n.id+"先祖");assert.ok(["territory","levitical-cities","joseph-two-tribes"].includes(t.landMode));assert.ok(t.landLabel);assert.ok(t.note);refsValid(t.landRefs,n.id+"分地");}
 assert.equal(get("levi").tribeInfo.landMode,"levitical-cities");assert.ok(get("levi").tribeInfo.landLabel.includes("城邑"));assert.ok(get("levi").tribeInfo.landLabel.includes("郊野"));
 assert.equal(get("joseph_patriarch").tribeInfo.landMode,"joseph-two-tribes");same(get("joseph_patriarch").tribeInfo.landBranches,["manasseh","ephraim"]);
 assert.equal(get("manasseh").fatherId,"joseph_patriarch");assert.equal(get("ephraim").fatherId,"joseph_patriarch");
 assert.ok(get("manasseh").tribeInfo.landLabel.includes("河东")&&get("manasseh").tribeInfo.landLabel.includes("河西"));
 for(const t of d.tribeExplanation)refsValid(t.refs,"支派概述");
});
check("犹大两个生母来源明确，他玛不是犹大的妻子",()=>{
 same(maternal("judah_wife_shua_daughter"),["er_judah","onan_judah","shelah_judah"]);
 same(maternal("tamar"),["perez","zerah_judah"]);
 assert.ok(partner("judah").includes("judah_wife_shua_daughter"));assert.ok(!partner("judah").includes("tamar"));
 same(partner("tamar"),["er_judah"]);assert.ok(!partner("onan_judah").includes("tamar"));assert.ok(!partner("shelah_judah").includes("tamar"));
});
check("两个未具名女性只用角色名，短标签不变为专名",()=>{
 const wife=get("judah_wife_shua_daughter"),mother=get("shaul_simeon_mother");
 for(const n of[wife,mother]){assert.equal(n.isUnnamed,true);assert.ok(n.name.includes("未具名"));assert.ok(n.notes.includes("未具名"));assert.equal(n.fatherId,null);}
 assert.equal(wife.graphLabel,"书亚之女");assert.equal(mother.graphLabel,"迦南女子");assert.notEqual(wife.name,"书亚");
 same(maternal("shaul_simeon_mother"),["shaul_simeon"]);same(partner("shaul_simeon_mother"),[]);
});
check("珥、俄南保留已故标签，不当同行下埃及者",()=>{
 for(const id of["er_judah","onan_judah"]){assert.equal(get(id).treeNote,"已死于迦南");assert.ok(get(id).events.some(e=>e.refs.includes("创世记46:12")&&e.text.includes("已死")));}
 assert.ok(d.scope.includes("不能当作"));assert.ok(d.scope.includes("同行下埃及"));
});
check("创46和民26异记只注释，不静默改接便雅悯代次",()=>{
 for(const id of["ard_benjamin","naaman_benjamin"]){assert.equal(get(id).fatherId,"benjamin");assert.equal(get(id).relation,"子孙（按创46列名）");assert.ok(get(id).refs.includes("民数记26:40"));assert.ok(get(id).notes.includes("比拉"));}
 same(children("bela_benjamin"),[]);
 for(const id of["jemuel_simeon","zohar_simeon","ohad_simeon","job_issachar","ziphion_gad","ezbon_gad","arodi_gad","ishvah_asher","hushim_dan"])assert.ok(get(id).refs.some(r=>r.startsWith("民数记26:")));
 assert.ok(!byId.has("nemuel_simeon"));assert.ok(!byId.has("jashub_issachar"));assert.ok(!byId.has("shuham_dan"));
});
check("同名希斯伦、以伦和扫罗等没有跨家系混并",()=>{
 assert.notEqual(get("hezron_reuben").id,get("hezron_perez").id);assert.equal(get("hezron_reuben").fatherId,"reuben");assert.equal(get("hezron_perez").fatherId,"perez");
 assert.equal(get("elon_zebulun").fatherId,"zebulun");assert.ok(!byId.has("elon_hittite"));
 assert.equal(get("shaul_simeon").fatherId,"simeon");assert.ok(!byId.has("saul_king"));
 assert.ok(!byId.has("moses"));assert.ok(!byId.has("aaron"));
});
check("28关系端点/母亲方向有效，所有父母边无自指或环",()=>{
 assert.equal(d.relations.length,28);const graph=new Map(nodes.map(n=>[n.id,[]])),seen=new Set();
 for(const n of nodes)if(n.fatherId!==null){get(n.fatherId);assert.notEqual(n.fatherId,n.id);graph.get(n.fatherId).push(n.id);}
 for(const r of d.relations){get(r.source);get(r.target);assert.notEqual(r.source,r.target);refsValid(r.refs,r.type);const key=[r.type,r.source,r.target].join(":");assert.ok(!seen.has(key));seen.add(key);assert.ok(["spouse","concubine","mother-child"].includes(r.type));if(r.type==="mother-child"){assert.equal(get(r.source).gender,"female");assert.equal(r.relation,get(r.target).gender==="female"?"母女":"母子");graph.get(r.source).push(r.target);}else{assert.notEqual(get(r.source).fatherId,r.target);assert.notEqual(get(r.target).fatherId,r.source);}}
 const state=new Map();function visit(id){assert.notEqual(state.get(id),1,"亲子环："+id);if(state.get(id)===2)return;state.set(id,1);graph.get(id).forEach(visit);state.set(id,2);}nodes.forEach(n=>visit(n.id));
});
check("资料数量与来源链接元数据一致",()=>{
 const expected={nodes:80,personRecords:80,groupRecords:0,treeNodes:72,relatedOnly:8,parentEdges:71,crossRelations:28,spouseRelations:5,concubineRelations:2,motherChildRelations:21,mainPathNodes:1,jacobNamedSons:12,jacobNamedDaughters:1,genesis46AdditionalNamedDescendants:56,unnamedRoleRecords:2,tribeMappingEntries:12,tribeInfoEntries:14};
 for(const[k,v]of Object.entries(expected))assert.equal(d.counts[k],v,k);
 assert.equal(nodes.filter(n=>n.fatherId!==null).length,71);assert.equal(d.relations.filter(r=>r.type==="mother-child").length,21);
 for(const s of d.sources){assert.ok(s.title);assert.equal(new URL(s.url).protocol,"https:");}
});
check("原76条预览源资料保持不变",()=>{
 const bytes=fs.readFileSync(path.join(__dirname,"abraham-jacob-children.json"));
 assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"),"22abbba7c0f71ae5f15c46b98b5a552c519a61adcfe167d639b33e8b542ed810");
});
console.log("\n校验结果："+passed+"项通过，"+failed+"项失败。");
console.log("80个人物档案含2位未具名角色、已故者及配偶，不能视为创46的同行人数。");
console.log("父系固定创46；民26与后世分地仅作另层说明，不扩摩西、亚伦与后世全谱。");
process.exitCode=failed?1:0;

