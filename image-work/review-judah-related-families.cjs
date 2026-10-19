'use strict';
// Independent read-only review: use the viewer's actual view-copy expression.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const {buildData}=require(path.join(root,'family-tree/combined-preview/build-tree-data.cjs'));
const all=buildData(),sourceDb=all['judah-jesus'];
const app=fs.readFileSync(path.join(root,'family-tree/combined-preview/app.js'),'utf8');
const start=app.indexOf('  const db=isRelatedFamily?');
const end=app.indexOf('  const rootId=',start);
assert.ok(start>=0&&end>start,'actual view-copy expression found');
const expression=app.slice(start,end)+'\ndb';
const diagramParent=n=>n.relatedOnly?null:n.treeParentId||n.fatherId;
function reachable(db,rootId){
 const byId=new Map(db.nodes.map(n=>[n.id,n])),children=new Map(db.nodes.map(n=>[n.id,[]]));
 assert.equal(byId.size,db.nodes.length,'unique archive IDs');
 for(const n of db.nodes){for(const key of ['fatherId','treeParentId','originFatherId'])if(n[key])assert.ok(byId.has(n[key]),n.id+':'+key);const p=diagramParent(n);if(p)children.get(p).push(n.id);}
 for(const r of db.relations)assert.ok(byId.has(r.source)&&byId.has(r.target),'relation endpoints');
 for(const kind of ['father','diagram'])for(const n of db.nodes){let id=n.id;const seen=new Set();while(id){assert.ok(!seen.has(id),kind+' cycle '+id);seen.add(id);const p=byId.get(id);id=kind==='father'?p.fatherId:diagramParent(p);}}
 const ids=[];function visit(id){ids.push(id);children.get(id).forEach(visit);}visit(rootId);return ids;
}
const report=[];
assert.equal(sourceDb.nodes.length,360);assert.equal(sourceDb.relatedFamilies.length,23);
assert.equal(sourceDb.relatedFamilies.flatMap(f=>f.nodeIds).length,59);
const mainIds=reachable(sourceDb,sourceDb.rootId);
assert.equal(mainIds.length,266);assert.deepEqual([...mainIds].sort(),[...sourceDb.treeNodeIds].sort());
assert.equal(sourceDb.mainPath.length,42);
const byId=new Map(sourceDb.nodes.map(n=>[n.id,n]));
assert.equal(byId.get('abigail_david_sister').fatherId,'nahash_abigail_father');
assert.equal(byId.get('amasa_jether').fatherId,'jether_ishmaelite');
assert.equal(byId.get('amasa_jether').treeParentId,'abigail_david_sister');
assert.ok(mainIds.includes('amasa_jether'));
assert.ok(!mainIds.includes('nebat_jeroboam'));
const families=sourceDb.relatedFamilies;
const membership=new Map();
for(const family of families){
 assert.equal(new Set(family.nodeIds).size,family.nodeIds.length,'unique family nodes');
 for(const id of family.nodeIds){assert.ok(byId.has(id),'member known');assert.ok(!membership.has(id),'not in multiple father families: '+id);membership.set(id,family.rootId);}
 const ctx={sourceDb,relatedFamily:family,isRelatedFamily:true,relatedIds:new Set(family.nodeIds)};
 const view=vm.runInNewContext(expression,ctx);
 const ids=reachable(view,view.rootId);
 assert.deepEqual([...ids].sort(),[...family.nodeIds].sort(),family.rootId+' reach exact');
 assert.equal(view.nodes.length,360,'archive retained');
 for(const n of view.nodes){assert.equal(n.fatherId,byId.get(n.id).fatherId,'true father stable');assert.deepEqual(n.refs,byId.get(n.id).refs,'refs stable');}
 assert.equal(view.relations,sourceDb.relations,'relations retained');
 assert.ok(!ids.includes('judah'),'no artificial Judah parent');
 for(const id of ids){const p=diagramParent(view.nodes.find(n=>n.id===id));if(id===view.rootId)assert.ok(!p,'family root detached');else assert.ok(family.nodeIds.includes(p),'internal parent');}
 report.push({rootId:family.rootId,title:family.title,nodes:ids.length,passed:true});
}
for(const id of ['bathsheba','maacah_david','athaliah','jerusha','hamutal']){
 assert.ok(byId.has(id));assert.ok(sourceDb.relations.some(r=>r.type==='mother-child'&&r.source===id&&mainIds.includes(r.target)),id+' mother relation retained');
}
// Run the actual select function under each of the 24 view states, for every
// archive ID. Any redirect must settle in a different valid view and selecting
// the requested ID there must not redirect again.
const selectStart=app.indexOf('  function select(id, focus=false)');
const selectEnd=app.indexOf('  function toggle(',selectStart);
assert.ok(selectStart>=0&&selectEnd>selectStart);
const selectSource=app.slice(selectStart,selectEnd)+'\nselect';
const mainTreeIds=new Set(mainIds);
const familyForPerson=id=>families.find(f=>f.nodeIds.includes(id));
const mainAnchorFor=id=>sourceDb.relations.filter(r=>['spouse','concubine'].includes(r.type)&&(r.source===id||r.target===id)||r.type==='mother-child'&&r.source===id).map(r=>r.source===id?r.target:r.source).find(p=>mainTreeIds.has(p));
function selectInView(family,id){
 const db=family?vm.runInNewContext(expression,{sourceDb,relatedFamily:family,isRelatedFamily:true,relatedIds:new Set(family.nodeIds)}):sourceDb;
 const treeIds=new Set(reachable(db,db.rootId));
 const ctx={db,treeIds,mainTreeIds,mainAnchorFor,familyForPerson,isRelatedFamily:!!family,relatedFamily:family,treeKey:'judah-jesus',rootId:db.rootId,viewRoot:db.rootId,location:{href:null},treeURL:(tree,person,related)=>JSON.stringify({tree,person,related}),ancestors:id=>[db.rootId,id],updateScopeURL(){},reveal(){},showDetails(){},render(){},focusNode(){}};
 const select=vm.runInNewContext(selectSource,ctx);select(id,true);return ctx.location.href?JSON.parse(ctx.location.href):null;
}
let selectionChecks=0,redirectChecks=0;
for(const family of [null,...families])for(const n of sourceDb.nodes){
 const target=selectInView(family,n.id);selectionChecks++;
 if(target){
  assert.equal(target.person,n.id);assert.equal(target.tree,'judah-jesus');
  const nextFamily=target.related?families.find(f=>f.rootId===target.related):null;
  if(target.related)assert.ok(nextFamily,'valid redirect family');
  assert.notEqual(nextFamily?.rootId,family?.rootId,'no redirect to same family');
  assert.equal(selectInView(nextFamily,n.id),null,'no redirect loop: '+n.id);
  redirectChecks++;
 }
}
console.log(JSON.stringify({passed:true,views:Object.keys(all).length,archive:360,mainNodes:266,mainPath:42,families:23,familyMemberships:59,selectionChecks,redirectChecks,reviews:report},null,2));
