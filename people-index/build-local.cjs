'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const {buildData}=require('../family-tree/combined-preview/build-tree-data.cjs');
const bios=JSON.parse(fs.readFileSync(path.join(root,'people-data.json'),'utf8'));
const records=bios.map(p=>({id:'bio:'+p.id,name:p.name,kind:'bio',type:'person',testament:p.testament,context:p.era,refs:p.refs,summary:p.summary,notes:p.note||'',url:'../index.html?person='+encodeURIComponent(p.id)+'#pagePeople'}));
for(const [key,db]of Object.entries(buildData()))for(const p of db.nodes){
 records.push({id:'tree:'+key+':'+p.id,name:p.name,kind:'tree',type:p.kind,isUnnamed:!!p.isUnnamed,context:db.title,refs:p.refs,summary:p.relation||'',notes:p.notes||'',url:'../family-tree/index.html?tree='+encodeURIComponent(key)+'&person='+encodeURIComponent(p.id)});
}
const result={metadata:{biographies:bios.length,treeViews:17,treeRecords:records.length-bios.length,note:'家谱按页面保留记录，包含跨页重复、未具名角色和群体；这些数目不是独立具名人物总数。'},records};
fs.writeFileSync(path.join(__dirname,'local-data.js'),'window.BIBLE_LOCAL_PERSON_INDEX='+JSON.stringify(result).replace(/</g,'\\u003c')+';\n');
console.log(JSON.stringify(result.metadata));
