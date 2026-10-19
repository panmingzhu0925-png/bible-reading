'use strict';
const assert=require('node:assert/strict');
const {scene:familyScene,fixtures,data}=require('./branch-spacing.test.cjs');
const EPS=1e-6;let passed=0;
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<EPS,`${message}: ${a} != ${b}`);
function test(name,run){run();passed++;console.log('PASS: '+name);}
const scene=(keyOrDb,direction='TB',collapsed=[])=>familyScene(keyOrDb,undefined,direction,collapsed);
function labelRect(point,box){return {left:point.x-box.width/2,right:point.x+box.width/2,top:point.y-box.height-4,bottom:point.y-4};}
function segmentHitsInterior(a,b,r){
  if(Math.abs(a[0]-b[0])<EPS)return a[0]>r.left+EPS&&a[0]<r.right-EPS&&Math.max(Math.min(a[1],b[1]),r.top)<Math.min(Math.max(a[1],b[1]),r.bottom)-EPS;
  if(Math.abs(a[1]-b[1])<EPS)return a[1]>r.top+EPS&&a[1]<r.bottom-EPS&&Math.max(Math.min(a[0],b[0]),r.left)<Math.min(Math.max(a[0],b[0]),r.right)-EPS;
  throw new Error('Tree routes must contain orthogonal segments only');
}
function segmentsMeet(a,b,c,d){
  const av=Math.abs(a[0]-b[0])<EPS,cv=Math.abs(c[0]-d[0])<EPS;
  if(av&&cv)return Math.abs(a[0]-c[0])<EPS&&Math.max(Math.min(a[1],b[1]),Math.min(c[1],d[1]))<=Math.min(Math.max(a[1],b[1]),Math.max(c[1],d[1]))+EPS;
  if(!av&&!cv)return Math.abs(a[1]-c[1])<EPS&&Math.max(Math.min(a[0],b[0]),Math.min(c[0],d[0]))<=Math.min(Math.max(a[0],b[0]),Math.max(c[0],d[0]))+EPS;
  if(!av)return segmentsMeet(c,d,a,b);
  return a[0]>=Math.min(c[0],d[0])-EPS&&a[0]<=Math.max(c[0],d[0])+EPS&&c[1]>=Math.min(a[1],b[1])-EPS&&c[1]<=Math.max(a[1],b[1])+EPS;
}
function validateRoutes(key,direction,s){
  const {result}=s,visible=new Set(result.positions.keys());
  assert.ok(Array.isArray(result.edges),'layout must return routed edges');
  assert.equal(result.edges.length,visible.size-1,key+' must return exactly one edge per non-root visible node');
  const expected=new Set([...visible].flatMap(parent=>s.children(parent).map(child=>parent+'\0'+child))),seen=new Set();
  const rects=new Map([...result.positions].map(([id,p])=>[id,labelRect(p,s.box(id))]));
  const labels=[...rects];
  for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){
    const [a,ar]=labels[i],[b,br]=labels[j];
    const width=Math.min(ar.right,br.right)-Math.max(ar.left,br.left),height=Math.min(ar.bottom,br.bottom)-Math.max(ar.top,br.top);
    assert.ok(width<=EPS||height<=EPS,`${key}/${direction}: label boxes ${a} and ${b} must not overlap`);
  }
  for(const edge of result.edges){
    const identity=edge.parentId+'\0'+edge.childId;
    assert.ok(expected.has(identity),key+' routed edge is not in the visible tree: '+identity);
    assert.ok(!seen.has(identity),key+' duplicate edge: '+identity);seen.add(identity);
    assert.ok(visible.has(edge.parentId)&&visible.has(edge.childId),'No routed endpoint may refer to a hidden node');
    assert.equal(edge.points.length,4,key+' must route through one generation fork');
    for(const point of edge.points){assert.equal(point.length,2);assert.ok(point.every(Number.isFinite),'All route coordinates must be finite');assert.ok(point[0]>=0&&point[0]<=result.width&&point[1]>=0&&point[1]<=result.height,'Route must stay inside the stage');}
    const parent=result.positions.get(edge.parentId),child=result.positions.get(edge.childId),start=edge.points[0],end=edge.points[3],pb=s.box(edge.parentId),cb=s.box(edge.childId);
    if(direction==='TB'){
      near(start[0],parent.x,key+' outgoing stem must belong to its parent');
      near(start[1],parent.y+4,key+' outgoing stem starts at parent circle');
      near(end[0],child.x,key+' incoming stem must belong to its child');
      assert.ok(end[1]<=child.y-cb.height-4+EPS&&end[1]>=child.y-cb.height-8-EPS,key+' incoming stem must stop just above its own child label');
      assert.ok(edge.points[1][1]>=start[1]-EPS&&edge.points[1][1]<=end[1]+EPS,key+' fork must be in the generation gap');
    }else{
      assert.ok(start[0]>=parent.x+pb.width/2-EPS&&start[0]<=parent.x+pb.width/2+4+EPS,key+' LR edge starts just to the right of parent label');
      near(start[1],parent.y-pb.height/2-4,key+' LR stem uses parent label centre');
      assert.ok(end[0]<=child.x-cb.width/2+EPS&&end[0]>=child.x-cb.width/2-4-EPS,key+' LR edge stops just to the left of child label');
      near(end[1],child.y-cb.height/2-4,key+' LR stem uses child label centre');
      assert.ok(edge.points[1][0]>=start[0]-EPS&&edge.points[1][0]<=end[0]+EPS,key+' LR fork must be between generations');
    }
    for(let i=1;i<edge.points.length;i++){
      const a=edge.points[i-1],b=edge.points[i];
      assert.ok(Math.abs(a[0]-b[0])<EPS||Math.abs(a[1]-b[1])<EPS,'Only orthogonal segments are permitted');
      for(const [other,r]of rects){
        if(other===edge.parentId||other===edge.childId)continue;
        assert.equal(segmentHitsInterior(a,b,r),false,`${key}/${direction}: ${edge.parentId}→${edge.childId} segment ${i} crosses ${other}'s label`);
      }
    }
  }
  assert.deepEqual(seen,expected,'Every visible parent-child relation must receive its own complete route');
  for(let i=0;i<result.edges.length;i++)for(let j=i+1;j<result.edges.length;j++){
    const a=result.edges[i],b=result.edges[j];if(a.parentId===b.parentId)continue;
    for(let ai=1;ai<a.points.length;ai++)for(let bi=1;bi<b.points.length;bi++){
      assert.equal(segmentsMeet(a.points[ai-1],a.points[ai],b.points[bi-1],b.points[bi]),false,`${key}/${direction}: unrelated parent routes ${a.parentId}→${a.childId} and ${b.parentId}→${b.childId} must not touch or cross`);
    }
  }
}
function runTests(){
test('All 17 genealogy views and 23 related families have isolated orthogonal routes and non-overlapping labels in TB and LR',()=>{
  assert.equal(Object.keys(data).length,17,'Audit scope must include every current genealogy view');
  assert.equal(fixtures.filter(f=>f.family).length,23,'Audit scope must include every isolated related family');
  for(const {key,db}of fixtures)for(const direction of ['TB','LR']){
    const s=scene(db,direction);validateRoutes(key,direction,s);
    assert.deepEqual(new Set(s.result.positions.keys()),new Set(db.treeNodeIds),key+' must show its complete intended family only');
  }
});
test('Collapsing Noah, patriarchal and other tribal branches removes hidden routes without dangling endpoints or collisions',()=>{
  for(const [key,folded]of [['noah-abraham',['ham']],['noah-abraham',['ham','japheth']],['abraham-jacob',['isaac']],['abraham-jacob',['jacob']],['tribe-levi',['kohath_levi']],['tribe-joseph',['manasseh']],['tribe-benjamin',['bela_benjamin']],['judah-jesus',['david']]])for(const direction of ['TB','LR']){
    const s=scene(key,direction,folded);validateRoutes(key,direction,s);
    for(const id of folded){assert.ok(s.result.positions.has(id),'Collapsed root itself must remain visible');for(const child of s.children(id))assert.fail('Collapsed visible children must be absent: '+child);}
    assert.ok(s.result.positions.size<data[key].treeNodeIds.length,'Fixture must actually hide descendants');
  }
});
test('Every view collapses to one family root and expands back to its exact parent-child routes',()=>{
  for(const {key,db}of fixtures)for(const direction of ['TB','LR']){
    const collapsed=scene(db,direction,[db.rootId]);validateRoutes(key,direction,collapsed);
    assert.equal(collapsed.result.positions.size,1);assert.deepEqual(collapsed.result.edges,[]);
    const reopened=scene(db,direction);validateRoutes(key,direction,reopened);
    assert.deepEqual(new Set(reopened.result.positions.keys()),new Set(db.treeNodeIds));
  }
});
console.log(`\n${passed} real-data route audit groups passed (17 views + 23 related families, TB/LR, and collapse/reopen states).`);
}
if(require.main===module)runTests();
module.exports={scene,labelRect,segmentHitsInterior,segmentsMeet,validateRoutes,runTests};
