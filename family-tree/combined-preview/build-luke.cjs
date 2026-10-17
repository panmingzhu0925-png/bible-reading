'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=JSON.parse(fs.readFileSync(path.join(__dirname,'judah-jesus.json'),'utf8'));
const clone=value=>JSON.parse(JSON.stringify(value));
const old=new Map(base.nodes.map(n=>[n.id,n]));
// Each verse supplies the next parents while Luke reads from child to ancestor.
// These names and boundaries were checked against the Chinese Union Version.
const parentsByVerse=[
  [23,'约瑟|希里'],[24,'玛塔|利未|麦基|雅拿|约瑟'],
  [25,'玛他提亚|亚摩斯|拿鸿|以斯利|拿该'],[26,'玛押|玛他提亚|西美|约瑟|犹大'],
  [27,'约亚拿|利撒|所罗巴伯|撒拉铁|尼利|麦基'],[28,'亚底|哥桑|以摩当|珥|约细'],
  [29,'以利以谢|约令|玛塔|利未'],[30,'西缅|犹大|约瑟|约南|以利亚敬'],
  [31,'米利亚|买南|玛达他|拿单|大卫'],[32,'耶西|俄备得|波阿斯|撒门|拿顺'],
  [33,'亚米拿达|亚兰|希斯仑|法勒斯|犹大']
];
const common=base.mainPath.slice(0,base.mainPath.indexOf('david')+1);
const commonNames=new Map(common.map(id=>[old.get(id).name,id]));
commonNames.set('希斯仑','hezron_perez');
const entries=[{id:'jesus',name:'耶稣',verse:23}],edges=[];
let child=entries[0];
for(const[verse,text]of parentsByVerse)for(const name of text.split('|')){
  const id=name==='拿单'?'nathan_david':name==='大卫'||entries.some(n=>n.name==='大卫')?commonNames.get(name):name==='所罗巴伯'?'zerubbabel':name==='撒拉铁'?'shealtiel':entries.length===1?'joseph_husband_mary':'luke_'+String(entries.length).padStart(2,'0');
  assert.ok(id,'未识别路3共同祖先：'+name);
  const parent={id,name,verse};entries.push(parent);edges.push({child:child.id,parent:id,verse});child=parent;
}
assert.equal(entries.length,53);assert.equal(entries.at(-1).id,'judah');
const namesCount=new Map();for(const n of entries)namesCount.set(n.name,(namesCount.get(n.name)||0)+1);
const nodes=entries.map((entry,i)=>{
  const n=old.has(entry.id)?clone(old.get(entry.id)):{id:entry.id,name:entry.name,kind:'person',gender:'male',events:[],notes:''};
  if(n.name!==entry.name){n.aliases=[...new Set([...(n.aliases||[]),n.name])];n.name=entry.name;}
  const edge=edges.find(e=>e.child===entry.id);
  n.fatherId=edge?.parent||null;n.relation=i===entries.length-1?'本段起点':'谱系列名（按路加福音3章）';
  n.refs=[...new Set([`路加福音3:${edge?.verse||33}`,...(n.refs||[])])];
  delete n.treeNote;delete n.lineageKind;delete n.lineageLabel;
  if(namesCount.get(entry.name)>1)n.graphLabel=entry.name+' · 路3:'+entry.verse;
  if(i>0&&i<entries.findIndex(e=>e.id==='david')){n.lineageKind='genealogy';n.lineageLabel='路3谱系列名';}
  n.notes=(n.notes?n.notes+' ':'')+'本页按路加福音3:23–33的次序单独列记，不把与马太福音不同的谱位强行解释成同一条直接生父链。';
  if(entry.id==='joseph_husband_mary'){n.lineageLabel='路3列在希里之下';n.notes+=' 路3将约瑟列于希里之下，太1列于雅各之下；希里与马利亚的父女关系作为常见释经解释另注，不作经文明记。';}
  if(entry.name==='希里')n.notes+=' 本段经文未直接称希里是马利亚的父亲。';
  if(entry.id==='shealtiel')n.notes+=' 路3置于尼利之下，太1置于耶哥尼雅之下；分别保留文本名单，不自行补立嗣或生父结论。';
  if(entry.id==='zerubbabel')n.notes+=' 路3后接利撒，太1后接亚比玉；代上3又另列其家族，不将各表静默合并。';
  if(entry.id==='nathan_david'){n.refs.push('历代志上3:5');n.notes+=' 此拿单是大卫之子，与先知拿单分开。';}
  if(entry.id==='jesus'){n.lineageKind='household';n.lineageLabel='依人看来 · 约瑟非生父';n.relation='家谱承接（非生父）';}
  if(entry.id==='judah')n.crossPageLinks=[{tree:'jacob-tribes',personId:'judah',label:'返回十二支派总览'}];
  if(['judah','david','joseph_husband_mary','jesus'].includes(entry.id))n.crossPageLinks=[...(n.crossPageLinks||[]),{tree:'judah-jesus',personId:entry.id,label:'对照马太主线与犹大旁支'}];
  return n;
});
for(const id of ['leah','tamar','rahab','ruth','bathsheba','mary','judah_wife_shua_daughter','jacob','mahlon','uriah_hittite']){const n=clone(old.get(id));assert.ok(n);n.relatedOnly=true;nodes.push(n);}
const ids=new Set(nodes.map(n=>n.id));
const relations=base.relations.filter(r=>ids.has(r.source)&&ids.has(r.target)).map(clone);
relations.push({source:'bathsheba',target:'nathan_david',type:'mother-child',relation:'母子',refs:['历代志上3:5']});
const data={title:'犹大至耶稣：路加家谱独立对照',version:'2026-10-17',translation:'简体中文和合本',rootId:'judah',mainPath:entries.map(n=>n.id).reverse(),quickFocus:['judah','david','nathan_david','zerubbabel','joseph_husband_mary','jesus'],treeNodeIds:entries.map(n=>n.id).reverse(),nodes,relations,
subtitle:'《路加福音》3:23–33 · 大卫之子拿单一线',previewNote:'本页单列路加的拿单支路；马利亚母系的常见解释另列说明，解释连接用虚线，约瑟至耶稣也不表示生父。',
scope:'从犹大至大卫采用路3:32–33共同名单，再经拿单接至约瑟、耶稣，按祖先在上调整阅读方向。只列本段家谱及必要母亲、妻子档案，不在本页复制犹大其他旁支。与太1、代上3的差异分别保留，马利亚母系解释与经文明记关系分别注明。',
lineageExplanation:[{text:'路3经大卫之子拿单，太1经所罗门；两条名单分开查看。将路3理解为马利亚母系的常见解释另有说明，希里与马利亚之间用解释虚线区别于经文明记关系。',refs:['路加福音3:23–31','马太福音1:6–16']},{text:'路3说耶稣依人看来是约瑟的儿子；约瑟列于希里之下。太1称约瑟为马利亚的丈夫，并称耶稣从马利亚生。',refs:['路加福音3:23','马太福音1:16–25']},{text:'路3将撒拉铁列于尼利之下，太1将其列于耶哥尼雅之下；所罗巴伯以下的利撒与亚比玉名单也不同。这里保留各文献名单，不强行证明某一种生父、收养或婚姻解释。',refs:['路加福音3:27','马太福音1:12–13','历代志上3:17–19']}],
sources:[{title:'路加福音3：简体中文和合本',url:'https://cnbible.com/cus/luke/3.htm'},{title:'马太福音1：另谱对照',url:'https://cnbible.com/cus/matthew/1.htm'},{title:'历代志上3：大卫诸子及后代',url:'https://cnbible.com/cus/1_chronicles/3.htm'}],
imageCoverage:[{section:'正面黄色路加家谱：犹大至耶稣',status:'corrected',note:'名单按路3独立列出；原图中的马利亚母系解释另以虚线说明，不冒作经文明记关系。',refs:['路加福音3:23–33','马太福音1:16–25']}]};
assert.equal(ids.size,nodes.length);assert.equal(nodes.filter(n=>!n.relatedOnly).length,53);
for(const n of nodes){if(n.fatherId)assert.ok(ids.has(n.fatherId));}
fs.writeFileSync(path.join(__dirname,'judah-luke.json'),JSON.stringify(data,null,2)+'\n');
console.log('路加独立对照：'+nodes.length+'档案，53谱位；与太1分开，约瑟非生父。');
