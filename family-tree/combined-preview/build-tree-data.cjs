'use strict';
const fs=require('node:fs'),path=require('node:path');
const {applyJudahRelatedFamilies}=require('./judah-related-families.cjs');
const read=file=>JSON.parse(fs.readFileSync(path.join(__dirname,file),'utf8'));
const clone=value=>JSON.parse(JSON.stringify(value));
const tribePages=[
  ['reuben','流便'],['simeon','西缅'],['levi','利未'],['judah','犹大'],
  ['dan','但'],['naphtali','拿弗他利'],['gad','迦得'],['asher','亚设'],
  ['issachar','以萨迦'],['zebulun','西布伦'],['joseph_patriarch','约瑟'],['benjamin','便雅悯']
].map(([rootId,name])=>({rootId,name,key:rootId==='judah'?'judah-jesus':'tribe-'+(rootId==='joseph_patriarch'?'joseph':rootId)}));

function subtreeIds(source,rootId){
  const ids=new Set([rootId]);
  let changed=true;
  while(changed){
    changed=false;
    for(const node of source.nodes)if(ids.has(node.fatherId)&&!ids.has(node.id)){ids.add(node.id);changed=true;}
  }
  return ids;
}

function recount(db){
  const tree=new Set(db.treeNodeIds);
  db.counts={
    nodes:db.nodes.length,personRecords:db.nodes.filter(n=>n.kind==='person').length,
    groupRecords:db.nodes.filter(n=>n.kind==='group').length,
    treeNodes:tree.size,relatedOnly:db.nodes.length-tree.size,
    parentEdges:db.nodes.filter(n=>tree.has(n.id)&&tree.has(n.fatherId)).length,
    associationEdges:db.nodes.filter(n=>tree.has(n.id)&&n.treeParentId&&n.treeParentId!==n.fatherId).length,
    diagramEdges:tree.size-1,
    crossRelations:db.relations.length,
    spouseRelations:db.relations.filter(r=>r.type==='spouse').length,
    concubineRelations:db.relations.filter(r=>r.type==='concubine').length,
    motherChildRelations:db.relations.filter(r=>r.type==='mother-child').length,
    mainPathNodes:db.mainPath.length,
    unnamedRoleRecords:db.nodes.filter(n=>n.isUnnamed).length,
    tribeMappingEntries:(db.tribeMapping||[]).length,
    tribeInfoEntries:db.nodes.filter(n=>n.tribeInfo).length
  };
  if(db.rootId==='jacob')Object.assign(db.counts,{jacobNamedSons:12,jacobNamedDaughters:1});
  return db;
}

function mergeExpansion(base,extra,key){
  const db=clone(base),nodes=new Map(db.nodes.map(n=>[n.id,n]));
  for(const patch of extra.nodes||[]){
    const old=nodes.get(patch.id)||{};
    nodes.set(patch.id,{kind:'person',gender:'unknown',fatherId:null,events:[],notes:'',...old,...clone(patch),refs:[...new Set([...(patch.refs||[]),...(old.refs||[])])]});
  }
  db.nodes=[...nodes.values()];
  const root=nodes.get(db.rootId);root.fatherId=null;delete root.treeParentId;delete root.relatedOnly;
  const relationKey=r=>[r.type,r.source,r.target].join('|');
  const relations=new Map(db.relations.map(r=>[relationKey(r),r]));
  for(const patch of extra.relations||[]){const id=relationKey(patch),old=relations.get(id)||{};relations.set(id,{...old,...clone(patch),refs:[...new Set([...(patch.refs||[]),...(old.refs||[])])]});}
  db.relations=[...relations.values()];
  const sources=new Map(db.sources.map(s=>[s.url,s]));
  for(const source of extra.sources||[])sources.set(source.url,clone(source));
  db.sources=[...sources.values()];
  for(const field of ['mainPath','quickFocus','scope','subtitle','previewNote'])if(extra[field])db[field]=clone(extra[field]);
  db.lineageExplanation=[...(db.lineageExplanation||[]),...(extra.lineageExplanation||[])];
  db.imageCoverage=clone(extra.imageCoverage||[]);
  db.expansionApplied=true;
  db.subtitle=extra.subtitle||(key==='judah-jesus'?'犹大旁支与王室家庭 · 通往耶稣的家谱主线':'参照原图补充家谱与相关人物 · 逐人附经文出处');
  db.previewNote=extra.previewNote||(key==='judah-jesus'?'已补犹大旁支及王室家庭，主线通往耶稣。虚线性质见旁注；约瑟为马利亚的丈夫，非耶稣生父。':'按原图范围补充本支家谱与相关人物。虚线的支派归属或谱系差异见旁注，不表示直接父子。');
  root.notes=(root.notes||'').replace('，不继续展开更后世的祭司家谱。','。')+' 本页另按原图补入后代及相关人物；完整收录范围与未确定关系见来源说明。';
  db.treeParentIdExplanation='fatherId保留经文家谱中的父系；treeParentId用于经文母系连接或图面归类，必须有虚线和旁注说明性质，不证明直接父子或连续世代。人物详情的父系路径不纳入此归类边。';
  const reached=new Set([db.rootId]);let changed=true;
  while(changed){changed=false;for(const node of db.nodes){const parent=node.relatedOnly?null:node.treeParentId||node.fatherId;if(reached.has(parent)&&!reached.has(node.id)){reached.add(node.id);changed=true;}}}
  db.treeNodeIds=db.nodes.filter(n=>reached.has(n.id)).map(n=>n.id);
  return recount(db);
}

// Add only relatives needed by the selected tree. Do not recursively bring in
// every relative of a mother or wife: that would reconnect the other tribes.
function pickTree(source,treeIds,rootId,relatedIds=[]){
  const ids=new Set([...treeIds,...relatedIds]);
  for(const relation of source.relations){
    if(relation.type==='mother-child'&&treeIds.has(relation.target))ids.add(relation.source);
    if(['spouse','concubine'].includes(relation.type)){
      if(treeIds.has(relation.source))ids.add(relation.target);
      if(treeIds.has(relation.target))ids.add(relation.source);
    }
  }
  const db=clone(source);
  db.rootId=rootId;
  db.mainPath=[rootId];
  db.treeNodeIds=source.treeNodeIds.filter(id=>treeIds.has(id));
  db.nodes=source.nodes.filter(node=>ids.has(node.id)).map(node=>{
    const copy=clone(node);
    // These are separate graph roots, not a change to the biblical fatherhood.
    if(copy.id===rootId||!treeIds.has(copy.id)||!ids.has(copy.fatherId))copy.fatherId=null;
    return copy;
  });
  db.relations=source.relations.filter(r=>ids.has(r.source)&&ids.has(r.target)).map(clone);
  return db;
}

function overview(source){
  const ids=new Set(['jacob',...tribePages.map(p=>p.rootId),'dinah']);
  const db=pickTree(source,ids,'jacob');
  db.title='雅各十二子与十二支派总览';
  db.scope='本页只列雅各、十二个儿子和女儿底拿，另保留生母及图中必要的配偶档案。各支起初家族分开到独立支派页；犹大页继续沿圣经家谱到耶稣。底拿不计作第十三支派；约瑟仍是雅各的一个儿子，其玛拿西、以法莲两支见约瑟页。人物档案数不等于创46同行下埃及人数。';
  db.fatherIdExplanation='雅各为总览起点，只连接其十二子和女儿底拿；孙辈在各支派页展开，配偶及母亲不画作雅各子女。';
  for(const node of db.nodes){
    if(node.id==='jacob')node.notes='本页总览雅各的十二个儿子和女儿底拿，分别标明生母。选择一个儿子可进入该支派独立家族页；各支后裔的范围及经文差异在分支页说明。';
    const page=tribePages.find(p=>p.rootId===node.id);
    if(!page)continue;
    node.notes=node.notes.replace(/本页列其[^。]*。?/g,'').replace(/本页[^。]*起初家族。?/g,'');
    node.crossPageLinks=[...(node.crossPageLinks||[]),{tree:page.key,personId:node.id,label:page.rootId==='judah'?'查看犹大主线到耶稣':'单独查看'+page.name+'支派'}];
  }
  return recount(db);
}

function branch(source,page){
  const ids=subtreeIds(source,page.rootId);
  const db=pickTree(source,ids,page.rootId,['jacob']);
  const root=db.nodes.find(n=>n.id===page.rootId);
  const jacob=db.nodes.find(n=>n.id==='jacob');
  const mother=source.relations.find(r=>r.type==='mother-child'&&r.target===page.rootId);
  const motherName=source.nodes.find(n=>n.id===mother?.source)?.name;
  root.originNote='雅各'+(motherName?'与'+motherName:'')+'之子；本页以'+page.name+'为家族起点，上代父家见十二支派总览。';
  root.originFatherId='jacob';
  root.crossPageLinks=[...(root.crossPageLinks||[]),{tree:'jacob-tribes',personId:page.rootId,label:'返回雅各十二子与支派总览'}];
  root.notes=(root.notes?root.notes+' ':'')+root.originNote;
  jacob.notes='雅各是本页支派起点的父亲，仅作为关联上代档案保留；其十二子及女儿底拿的总览在独立页面中查看。';
  jacob.crossPageLinks=[...(jacob.crossPageLinks||[]),{tree:'jacob-tribes',personId:'jacob',label:'查看雅各全部儿女与支派总览'}];
  db.title=page.name+'支派与起初家族';
  db.scope='本页单列'+page.name+'一支：父系后代仍按创世记46章原始名单与代次展开，另收录本支必要的配偶和生母档案。'+(page.rootId==='joseph_patriarch'?'约瑟之子玛拿西、以法莲同时保留生父关系与分地两支说明。':'不把其余十一位兄弟或其后裔加入本图。')+'民数记26章与创46名单的差异保留在个人说明中，不能据此擅自补名或调整父子关系。这里是支派源头的家族切面，不是整个支派后世人物全集。';
  db.fatherIdExplanation='本图从'+page.name+'起，根的fatherId仅因分段设为空；其父为雅各、生母为'+motherName+'，由说明、母子关系和总览链接保留。其他树内父系关系不变；关联配偶的树外父家以经文和跨页链接说明，不保留无效父亲ID。';
  delete db.tribeMapping;
  return recount(db);
}

function buildData({includeExpansions=true}={}){
  const source=read('jacob-tribes.json');
  const data={
    'adam-noah':read('../data/adam-noah.json'),
    'noah-abraham':read('../data/noah-abraham.json'),
    'abraham-jacob':read('abraham-jacob-children.json'),
    'jacob-tribes':overview(source)
  };
  for(const page of tribePages)if(page.rootId!=='judah')data[page.key]=branch(source,page);
  const judahFile=path.join(__dirname,'judah-jesus.json');
  if(fs.existsSync(judahFile))data['judah-jesus']=read('judah-jesus.json');
  if(fs.existsSync(path.join(__dirname,'judah-luke.json')))data['judah-luke']=read('judah-luke.json');
  if(includeExpansions){
    for(const[key,file]of [['tribe-levi','tribe-expansions/levi.json'],['judah-jesus','tribe-expansions/judah.json']])if(data[key]&&fs.existsSync(path.join(__dirname,file)))data[key]=mergeExpansion(data[key],read(file),key);
    const othersFile='tribe-expansions/other-tribes.json';
    if(fs.existsSync(path.join(__dirname,othersFile)))for(const[key,extra]of Object.entries(read(othersFile).branches||{})){if(!data[key])throw new Error('未知支派扩展：'+key);data[key]=mergeExpansion(data[key],extra,key);}
    const guide=read('mary-nathan-note.json');
    const heliId=data['judah-luke']?.nodes.find(n=>n.name==='希里')?.id;
    for(const key of ['judah-jesus','judah-luke']){
      const db=data[key];if(!db)continue;
      db.maryNathanGuide={...clone(guide),heliId};
      for(const n of db.nodes){
        if(['mary','nathan_david',heliId].includes(n.id))n.interpretation=clone(guide);
        if(['joseph_husband_mary','jesus'].includes(n.id))n.treeInterpretation=guide.treeLabel;
        if(n.id==='jesus')n.notes=n.notes.replace('不能因此虚构马利亚父亲或把两线硬接为同一条。','常见母系解释另见说明；经文明记与释经解释分别展示。');
        if(n.id==='mary'){
          n.notes='耶稣的母亲、约瑟的妻子。常见的拿单支系母系解释见上方专节；圣经正文没有直接记她父亲的名字，因此保留经文明记与释经解释的区别。';
          n.crossPageLinks=[...(n.crossPageLinks||[]),{tree:'judah-luke',personId:'nathan_david',label:'查看拿单支路与马利亚母系解释'}];
        }
      }
      db.quickFocus=[...new Set([...(db.quickFocus||[]).filter(id=>id!=='jesus'),'mary','jesus'])];
      db.lineageExplanation.push({text:guide.summary+' '+guide.boundary,refs:clone(guide.refs)});
      db.sources.push(clone(guide.interpretationSource));
    }
    if(data['judah-jesus']){
      const separated=applyJudahRelatedFamilies(data['judah-jesus']);
      const reached=new Set([separated.rootId]);let changed=true;
      while(changed){changed=false;for(const n of separated.nodes){const parent=n.relatedOnly?null:n.treeParentId||n.fatherId;if(reached.has(parent)&&!reached.has(n.id)){reached.add(n.id);changed=true;}}}
      separated.treeNodeIds=separated.nodes.filter(n=>reached.has(n.id)).map(n=>n.id);
      data['judah-jesus']=recount(separated);
    }
  }
  return data;
}

if(require.main===module){
  const data=buildData();
  fs.writeFileSync(path.join(__dirname,'tree-data.js'),'window.BIBLE_FAMILY_TREES='+JSON.stringify(data).replace(/</g,'\\u003c')+';\n');
  console.log(Object.entries(data).map(([key,db])=>key+': '+db.nodes.length+'条，树内'+db.treeNodeIds.length+'条').join('\n'));
  if(!data['judah-jesus'])console.warn('犹大到耶稣资料尚未加入；其余支派已经生成。');
}
module.exports={buildData,tribePages,subtreeIds,mergeExpansion};
