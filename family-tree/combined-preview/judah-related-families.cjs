'use strict';

const clone=value=>JSON.parse(JSON.stringify(value));
const northernRoots=new Set([
  'nebat_jeroboam','ahijah_baasha','zimri_israel','omri_israel',
  'nimshi_jehu','jabesh_shallum','gadi_menahem','remaliah_pekah','elah_hoshea'
]);
const titles={
  hammath_kenite:'基尼人哈末与文士家族',
  nahash_abigail_father:'拿辖与亚比该父家',
  jether_ishmaelite:'益帖与亚玛撒父家',
  ammihud_geshur:'基述王达买家族',
  ahithophel_gilonite:'亚希多弗与拔示巴父家',
  nebat_jeroboam:'北国耶罗波安家族',
  ahijah_baasha:'北国巴沙家族',
  zimri_israel:'北国君王心利',
  omri_israel:'北国暗利与亚哈家族',
  ethbaal_sidonians:'西顿王谒巴力与耶洗别父家',
  nimshi_jehu:'北国耶户家族',
  jabesh_shallum:'北国沙龙家族',
  gadi_menahem:'北国米拿现家族',
  remaliah_pekah:'北国比加家族',
  elah_hoshea:'北国何细亚家族'
};

// These are separate views of the same archive records. Neither unknown tribal
// ancestry nor a political association is converted into a Judah parent edge.
function applyJudahRelatedFamilies(source){
  const db=clone(source);
  if(db.rootId!=='judah')throw new Error('犹大关联家族拆分只适用于犹大资料。');
  const roots=db.nodes.filter(n=>n.relatedFamilyRoot||
    (n.lineageKind==='context'&&n.treeParentId==='judah'));
  const originalParent=new Map(db.nodes.map(n=>[n.id,n.treeParentId]));
  const families=roots.map(root=>{
    const ids=new Set([root.id]);
    let changed=true;
    while(changed){
      changed=false;
      for(const n of db.nodes){
        // The father's family takes priority over a diagram-only family link.
        // No mother-child traversal: a queen's Judah children stay in Judah.
        const parent=n.fatherId||originalParent.get(n.id);
        if(ids.has(parent)&&!ids.has(n.id)){ids.add(n.id);changed=true;}
      }
    }
    const members=db.nodes.filter(n=>ids.has(n.id));
    return {
      rootId:root.id,
      title:titles[root.id]||root.name+'父家',
      category:northernRoots.has(root.id)?'northern-kingdom':
        root.id==='hammath_kenite'?'kenite-family':'associated-family',
      nodeIds:members.map(n=>n.id),
      refs:[...new Set(members.flatMap(n=>n.refs||[]))],
      note:(root.notes?root.notes+' ':'')+
        '本家单独展示，不连作犹大的儿子；未记支派不等于证明非犹大支派。与犹大家属的婚姻、母系关系及原经文档案保留。'
    };
  });
  for(const root of roots){
    delete root.treeParentId;
    root.relatedFamilyRoot=true;
    root.lineageLabel='相关家族 · 单独展示';
    root.relation='相关家族起点';
  }

  const amasa=db.nodes.find(n=>n.id==='amasa_jether');
  if(amasa){
    if(!db.relations.some(r=>r.type==='mother-child'&&
      r.source==='abigail_david_sister'&&r.target===amasa.id)){
      throw new Error('亚玛撒母系例外缺少既有经文母子关系。');
    }
    amasa.treeParentId='abigail_david_sister';
    amasa.lineageKind='maternal';
    amasa.lineageLabel='亚比该之子 · 母系亲属';
  }
  db.relatedFamilies=families;
  const scopeNote='关联外家与北国王朝已单独展示，不作为犹大的后裔分支；直接婚配、生母标注和原始经文关系保留。父系未接续不等于非犹大支派。';
  if(!db.scope.includes(scopeNote))db.scope=db.scope+' '+scopeNote;
  db.previewNote='犹大家属与主线在本图查看；关联外家、基尼人家族及北国王朝可另选家族查看。妻名、生母与母系亲属按经文保留；约瑟不是耶稣生父。';
  return db;
}

module.exports={applyJudahRelatedFamilies};
