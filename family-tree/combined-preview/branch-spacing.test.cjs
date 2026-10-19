'use strict';
const assert=require('node:assert/strict');
const {layout}=require('./compact-layout.js');
const {buildData}=require('./build-tree-data.cjs');
const {model}=require('./diagnose-branch-layout.cjs');
const EPS=1e-6,data=buildData();let passed=0;
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<EPS,`${message}: ${a} != ${b}`);
function test(name,run){run();passed++;console.log('PASS: '+name);}
function scene(key,rootId,direction='TB'){
  const db={...data[key],rootId:rootId||data[key].rootId},m=model(db),axis=direction==='TB'?'x':'y',major=new Set(['noah','abraham','isaac']);
  if(m.children(db.rootId).length<=6)major.add(db.rootId);
  const branchGap=(parent,left,right)=>major.has(parent)&&(m.children(left).length||m.children(right).length)?direction==='TB'?56:34:14;
  const result=layout({rootId:db.rootId,children:m.children,box:m.box,direction,siblingGap:14,generationGap:direction==='TB'?56:34,compactMainRows:false,preferredChild:m.preferredChild,branchGap});
  const lo=id=>direction==='TB'?-m.box(id).width/2:-m.box(id).height-4;
  const hi=id=>direction==='TB'?m.box(id).width/2:4;
  const breadth=id=>result.positions.get(id)[axis];
  function contours(root){const rows=[];function visit(id,depth){if(!rows[depth])rows[depth]={left:Infinity,right:-Infinity};rows[depth].left=Math.min(rows[depth].left,breadth(id)+lo(id));rows[depth].right=Math.max(rows[depth].right,breadth(id)+hi(id));m.children(id).forEach(c=>visit(c,depth+1));}visit(root,0);return rows;}
  return {...m,db,axis,major,branchGap,result,lo,hi,breadth,contours};
}
test('Noah, Ham, Shem and Japheth keep their own descendants below their family roots',()=>{
  for(const direction of ['TB','LR']){
    const s=scene('noah-abraham',undefined,direction);
    for(const id of s.result.positions.keys()){
      const children=s.children(id);if(!children.length)continue;
      const main=s.preferredChild(id),expected=children.includes(main)?s.breadth(main):(s.breadth(children[0])+s.breadth(children[children.length-1]))/2;
      near(s.breadth(id),expected,id+' must not be moved independently of descendants');
    }
  }
});
test('Expanded major families reserve 56 px TB / 34 px LR between all shared-depth contours',()=>{
  for(const direction of ['TB','LR'])for(const [key,root]of [['noah-abraham',undefined],['abraham-jacob',undefined],['abraham-jacob','isaac']]){
    const s=scene(key,root,direction);
    for(const id of s.result.positions.keys()){
      const children=s.children(id);
      for(let i=1;i<children.length;i++){
        const a=children[i-1],b=children[i],ac=s.contours(a),bc=s.contours(b),gap=s.branchGap(id,a,b);
        for(let depth=0;depth<Math.min(ac.length,bc.length);depth++)assert.ok(bc[depth].left-ac[depth].right>=gap-EPS,`${key}/${id}: ${a}/${b} contour gap at depth ${depth} must be ${gap}`);
      }
    }
  }
});
test('Main lineage stays aligned after complete expanded branches are separated',()=>{
  for(const direction of ['TB','LR'])for(const [key,root]of [['noah-abraham',undefined],['abraham-jacob',undefined],['abraham-jacob','isaac']]){
    const s=scene(key,root,direction);
    let id=s.db.rootId,steps=0;
    while(id){const next=s.preferredChild(id);if(!next)break;near(s.breadth(id),s.breadth(next),key+'/'+id+' main lineage');id=next;steps++;}
    assert.ok(steps>=1,'Real fixture must contain a main lineage');
  }
});
test('Leaf-only siblings stay compact instead of receiving the major-family space',()=>{
  for(const direction of ['TB','LR'])for(const [key,root]of [['noah-abraham',undefined],['abraham-jacob',undefined],['abraham-jacob','isaac']]){
    const s=scene(key,root,direction);let checked=0;
    for(const id of s.result.positions.keys()){
      const children=s.children(id);if(children.length<2||children.some(c=>s.children(c).length))continue;
      for(let i=1;i<children.length;i++){
        const a=children[i-1],b=children[i];near(s.breadth(b)+s.lo(b)-s.breadth(a)-s.hi(a),14,key+'/'+id+' leaf spacing');checked++;
      }
    }
    assert.ok(checked>0,'Real fixture must contain compact leaf siblings');
  }
});
console.log(`\n${passed} real-data family spacing checks passed.`);
