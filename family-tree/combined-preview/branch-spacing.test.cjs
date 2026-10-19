'use strict';
const assert=require('node:assert/strict');
const {layout}=require('./compact-layout.js');
const {buildData}=require('./build-tree-data.cjs');
const {model}=require('./diagnose-branch-layout.cjs');
const EPS=1e-6,data=buildData();let passed=0;
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<EPS,`${message}: ${a} != ${b}`);
function test(name,run){run();passed++;console.log('PASS: '+name);}

// Match the viewer's related-family isolation while retaining the full archive
// for spouse/mother labels. A family can have biological parents outside it.
function relatedDb(source,family){
  const ids=new Set(family.nodeIds);
  return {...source,rootId:family.rootId,mainPath:[family.rootId],treeNodeIds:[...family.nodeIds],nodes:source.nodes.map(n=>{
    const copy={...n};
    if(!ids.has(n.id)){copy.relatedOnly=true;return copy;}
    delete copy.relatedOnly;
    if(n.id===family.rootId){delete copy.treeParentId;return copy;}
    if(ids.has(n.fatherId)){
      delete copy.treeParentId;
      if(n.lineageKind==='maternal'){delete copy.lineageKind;delete copy.lineageLabel;}
    }
    return copy;
  })};
}
const fixtures=[...Object.entries(data).map(([key,db])=>({key,db})),
  ...(data['judah-jesus'].relatedFamilies||[]).map(family=>({key:'judah-related/'+family.rootId,db:relatedDb(data['judah-jesus'],family),family}))];

function scene(keyOrDb,rootId,direction='TB',collapsed=[]){
  const source=typeof keyOrDb==='string'?data[keyOrDb]:keyOrDb;
  const db={...source,rootId:rootId||source.rootId},m=model(db),axis=direction==='TB'?'x':'y',folded=new Set(collapsed);
  const allChildren=new Map(db.nodes.map(n=>[n.id,m.children(n.id)]));
  const children=id=>folded.has(id)?[]:allChildren.get(id);
  const preferredChild=id=>children(id).includes(m.preferredChild(id))?m.preferredChild(id):null;
  const branchGap=(_parent,left,right)=>(children(left).length||children(right).length)?direction==='TB'?56:34:14;
  const boxes=new Map();
  function descendantCount(id){return allChildren.get(id).reduce((sum,child)=>sum+1+descendantCount(child),0);}
  const box=id=>{
    if(!boxes.has(id)){
      const measured=m.box(id),hidden=folded.has(id)?descendantCount(id):0;
      // Closed-node badges also consume space. Diagnostic text widths are
      // conservative; real-font SVG rectangles are checked in the browser.
      const badge=hidden?[...` ＋${hidden}`].reduce((sum,c)=>sum+(c.charCodeAt(0)>255?10:6),0):0;
      boxes.set(id,{...measured,width:measured.width+badge});
    }
    return boxes.get(id);
  };
  const result=layout({rootId:db.rootId,children,box,direction,siblingGap:14,generationGap:direction==='TB'?56:34,compactMainRows:false,preferredChild,branchGap});
  const lo=id=>direction==='TB'?-box(id).width/2:-box(id).height-4;
  const hi=id=>direction==='TB'?box(id).width/2:4;
  const breadth=id=>result.positions.get(id)[axis];
  function contours(root){const rows=[];function visit(id,depth){if(!rows[depth])rows[depth]={left:Infinity,right:-Infinity};rows[depth].left=Math.min(rows[depth].left,breadth(id)+lo(id));rows[depth].right=Math.max(rows[depth].right,breadth(id)+hi(id));children(id).forEach(c=>visit(c,depth+1));}visit(root,0);return rows;}
  return {...m,db,axis,children,allChildren,preferredChild,branchGap,box,result,lo,hi,breadth,contours};
}
function eachScene(run){for(const fixture of fixtures)for(const direction of ['TB','LR'])run(fixture,scene(fixture.db,undefined,direction),direction);}
function runTests(){
test('The audit includes all 17 genealogy views and all 23 isolated related families',()=>{
  assert.equal(Object.keys(data).length,17);assert.equal(fixtures.filter(f=>f.family).length,23);
  eachScene((fixture,s)=>assert.deepEqual(new Set(s.result.positions.keys()),new Set(fixture.db.treeNodeIds),fixture.key+' exact visible family membership'));
});
test('Every father stays over his own descendant family, including non-main branches of every tribe',()=>{
  eachScene((fixture,s)=>{
    for(const id of s.result.positions.keys()){
      const children=s.children(id);if(!children.length)continue;
      const main=s.preferredChild(id),expected=main?s.breadth(main):(s.breadth(children[0])+s.breadth(children[children.length-1]))/2;
      near(s.breadth(id),expected,fixture.key+'/'+id+' family-root alignment');
    }
  });
});
test('Every expanded family reserves 56 px TB / 34 px LR between shared-depth contours',()=>{
  let nonMajorParents=0;
  eachScene((fixture,s,direction)=>{
    for(const id of s.result.positions.keys()){
      const children=s.children(id);
      for(let i=1;i<children.length;i++){
        const a=children[i-1],b=children[i],ac=s.contours(a),bc=s.contours(b),expanded=s.children(a).length||s.children(b).length,gap=expanded?(direction==='TB'?56:34):14;
        if(expanded&&!['noah','abraham','isaac',s.db.rootId].includes(id))nonMajorParents++;
        for(let depth=0;depth<Math.min(ac.length,bc.length);depth++)assert.ok(bc[depth].left-ac[depth].right>=gap-EPS,`${fixture.key}/${id}: ${a}/${b} contour gap at depth ${depth} must be ${gap}`);
      }
    }
  });
  assert.ok(nonMajorParents>100,'Regression must cover descendants beyond the former special parent/root IDs');
});
test('Every available main-line parent and child remain aligned across all genealogy views',()=>{
  let links=0;
  eachScene((fixture,s)=>{
    for(const id of s.result.positions.keys()){
      const next=s.preferredChild(id);if(!next)continue;
      near(s.breadth(id),s.breadth(next),fixture.key+'/'+id+' main lineage');links++;
    }
  });
  assert.ok(links>100,'Real fixtures must include extended main lineages');
});
test('Leaf-only sibling rows stay at 14 px across every family instead of inheriting expanded-family spacing',()=>{
  let checked=0;
  eachScene((fixture,s)=>{
    for(const id of s.result.positions.keys()){
      const children=s.children(id);if(children.length<2||children.some(c=>s.children(c).length))continue;
      for(let i=1;i<children.length;i++){
        const a=children[i-1],b=children[i];near(s.breadth(b)+s.lo(b)-s.breadth(a)-s.hi(a),14,fixture.key+'/'+id+' leaf spacing');checked++;
      }
    }
  });
  assert.ok(checked>100,'Real fixtures must include compact leaf rows throughout the tribes');
});
test('Collapsed families regain compact root spacing, including the other tribes',()=>{
  for(const [key,parent]of [['noah-abraham','noah'],['abraham-jacob','isaac'],['tribe-levi','kohath_levi'],['tribe-joseph','joseph_patriarch']])for(const direction of ['TB','LR']){
    const unfolded=scene(key,undefined,direction),folded=unfolded.children(parent);
    const s=scene(key,undefined,direction,folded),children=s.children(parent);
    assert.ok(children.length>=2&&children.every(c=>!s.children(c).length),key+' fixture must expose only collapsed family roots');
    for(let i=1;i<children.length;i++)near(s.breadth(children[i])+s.lo(children[i])-s.breadth(children[i-1])-s.hi(children[i-1]),14,key+'/'+parent+' collapsed-family spacing');
  }
});
console.log(`\n${passed} real-data family spacing checks passed (17 views + 23 related families, TB/LR).`);
}
if(require.main===module)runTests();
module.exports={scene,fixtures,data,relatedDb,runTests};
