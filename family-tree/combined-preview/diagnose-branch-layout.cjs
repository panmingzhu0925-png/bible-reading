'use strict';
// Geometry-only audit. Label widths are conservative character estimates;
// final browser verification must use the rendered SVG's measured rectangles.
const {buildData}=require('./build-tree-data.cjs');
const {layout}=require('./compact-layout.js');
const data=buildData();
const width=(s,size)=>[...String(s||'')].reduce((n,c)=>n+(c.charCodeAt(0)>255?size:size*.6),0);
function model(db){
  const byId=new Map(db.nodes.map(n=>[n.id,n]));
  const nameCounts=new Map();db.nodes.forEach(n=>nameCounts.set(n.name,(nameCounts.get(n.name)||0)+1));
  const labelName=n=>n.graphLabel||(n.id==='abraham'?'亚伯拉罕':nameCounts.get(n.name)>1?`${n.name} · ${n.fatherId?byId.get(n.fatherId).name:'亲属'}之下`:n.name);
  const main=new Set(db.mainPath),kids=new Map(db.nodes.map(n=>[n.id,[]]));
  for(const n of db.nodes){const parent=n.relatedOnly?null:n.treeParentId||n.fatherId;if(parent)kids.get(parent).push(n.id);}
  const women=new Set(db.nodes.filter(n=>n.gender==='female').map(n=>n.id));
  const mothers=new Map(db.relations.filter(r=>r.type==='mother-child').map(r=>[r.target,r.source]));
  const partners=id=>db.relations.filter(r=>['spouse','concubine'].includes(r.type)&&(r.source===id||r.target===id)).map(r=>({id:r.source===id?r.target:r.source,role:r.type==='concubine'?'妾':'妻'})).filter(p=>women.has(p.id)&&!women.has(id));
  const inMiddle=(items,item)=>{if(!item)return items;const others=items.filter(i=>i!==item);others.splice(Math.floor(items.length/2),0,item);return others;};
  const children=id=>{
    const items=[...kids.get(id)],primary=items.find(i=>main.has(i)),ps=partners(id);
    if(ps.length<=1)return inMiddle(items,primary);
    const order=new Map(ps.map((p,i)=>[p.id,i])),groups=new Map();
    items.sort((a,b)=>(order.get(mothers.get(a))??99)-(order.get(mothers.get(b))??99));
    for(const id of items){const m=mothers.get(id)||'';if(!groups.has(m))groups.set(m,[]);groups.get(m).push(id);}
    const families=[...groups.values()],mf=families.find(f=>f.includes(primary));
    return inMiddle(families,mf).flatMap(f=>inMiddle(f,f.includes(primary)?primary:null));
  };
  const box=id=>{
    const n=byId.get(id),ps=partners(id),mother=mothers.get(id),siblings=n.fatherId?kids.get(n.fatherId).filter(i=>byId.get(i).fatherId===n.fatherId):[],fps=n.fatherId?partners(n.fatherId):[];
    const dm=new Set(siblings.map(i=>mothers.get(i)).filter(Boolean));
    const showMother=mother&&(n.lineageKind==='household'||fps.length!==1||fps[0].id!==mother||dm.size>1||siblings.some(i=>!mothers.has(i)));
    const unknown=!mother&&n.kind!=='group'&&n.fatherId&&(fps.length>1||siblings.some(i=>mothers.has(i)));
    const motherLine=showMother?'母：'+labelName(byId.get(mother)):unknown?'母：经文未记名':'';
    const name=labelName(n),spouse=ps.length===1?' — '+labelName(byId.get(ps[0].id))+'（'+ps[0].role+'）':'';
    // English book substitution does not affect branch ownership diagnostics.
    const ref=String(n.refs[0]||'').replace(/^[^\d]+/,'创')+(n.kind==='group'?' · 族群':'')+(n.treeNote?' · '+n.treeNote:'');
    return {width:Math.ceil(Math.max(width(name,14)+width(spouse,12),width(ref,10),width(n.tribeInfo?.ancestralLabel,10),width(n.lineageLabel,10),width(n.treeInterpretation,10),width(motherLine,11)))+12,height:38+(n.tribeInfo?14:0)+(n.lineageLabel?14:0)+(n.treeInterpretation?14:0)+(motherLine?16:0)};
  };
  return {byId,children,box,preferredChild:id=>main.has(id)?children(id).find(i=>main.has(i)):null};
}
function audit(db,compactMainRows){
  const m=model(db),result=layout({rootId:db.rootId,children:m.children,box:m.box,direction:'TB',siblingGap:14,generationGap:56,compactMainRows,preferredChild:m.preferredChild});
  const rects=new Map([...result.positions].map(([id,p])=>{const b=m.box(id);return[id,{left:p.x-b.width/2,right:p.x+b.width/2,top:p.y-b.height-4,bottom:p.y-4}];}));
  const hits=[];
  for(const [parent,a]of result.positions)for(const child of m.children(parent)){
    const b=result.positions.get(child),mid=(a.y+b.y)/2;
    for(const [other,r]of rects){
      if(other===parent||other===child||r.bottom<a.y||r.top>b.y)continue;
      for(let sample=1;sample<400;sample++){
        const t=sample/400,s=1-t,x=s*s*s*a.x+3*s*s*t*a.x+3*s*t*t*b.x+t*t*t*b.x;
        const y=s*s*s*a.y+3*s*s*t*mid+3*s*t*t*mid+t*t*t*b.y;
        if(x>r.left&&x<r.right&&y>r.top&&y<r.bottom){hits.push({edge:m.byId.get(parent).name+'→'+m.byId.get(child).name,other:m.byId.get(other).name});break;}
      }
    }
  }
  const children=m.children(db.rootId).map(id=>{
    const descendants=[];function visit(n){descendants.push(n);m.children(n).forEach(visit);}visit(id);
    const left=Math.min(...descendants.map(n=>rects.get(n).left)),right=Math.max(...descendants.map(n=>rects.get(n).right));
    return {id,name:m.byId.get(id).name,rootX:Math.round(result.positions.get(id).x),left:Math.round(left),right:Math.round(right),nodes:descendants.length};
  });
  // Historical comparison of curve routing only. Production v17 uses the
  // orthogonal edges audited by branch-routes.test.cjs instead of these curves.
  return {route:'legacy-curve-diagnostic',mode:compactMainRows?'legacy-row-only-compaction':'contour-whole-subtree',width:Math.round(result.width),height:Math.round(result.height),unrelatedLabelHits:hits.length,examples:hits.slice(0,10),branches:children};
}
if(require.main===module)for(const key of ['noah-abraham','abraham-jacob']){
  console.log(JSON.stringify({tree:key,results:[audit(data[key],true),audit(data[key],false)]},null,2));
}
module.exports={model,audit};
