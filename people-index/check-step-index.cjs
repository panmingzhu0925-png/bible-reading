'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const path=require('node:path');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'stepbible-data.json'),'utf8'));
const {metadata,books,records}=data;
const byBook=new Map(books.map(b=>[b.code,b]));
assert.equal(books.length,66,'66 canonical book mapping');
assert.equal(new Set(records.map(r=>r.id)).size,records.length,'Individual source identifiers must stay distinct');
assert.equal(metadata.count,2995);
assert.equal(records.length,2995);
assert.equal(metadata.sourcePersonRecords,3129);
assert.equal(metadata.sourceHumanRecords,3054);
assert.equal(metadata.excludedHumanRecords,59);
assert.equal(metadata.excludedGroups,75);
assert.equal(metadata.excludedCategories['PLACE+PERSON / Place'],10);
assert.equal(metadata.referenceCount,records.reduce((n,r)=>n+r.refs.length,0));
const blocked=['fatherId','motherId','parents','offspring','partners','summary','description','brief','article','notes'];
for(const record of records){
 assert.equal(record.type,'person');
 assert.ok(['male','female'].includes(record.gender));
 assert.ok(record.name&&record.englishName&&record.uStrong&&record.sourceKey);
 assert.ok(record.refs.length>0);
 assert.ok(!/^Unnamed#|^(father|husband|wife|a_wife|daughter|motherInLaw|sister|son)_of_/.test(record.name),record.name+' anonymous record leaked');
 for(const field of blocked)assert.ok(!Object.hasOwn(record,field),'No unreviewed descriptions / relationships: '+field);
 const seen=new Set();
 for(const ref of record.refs){
  assert.ok(byBook.has(ref.book));assert.ok(Number.isInteger(ref.chapter)&&ref.chapter>=1&&ref.chapter<=byBook.get(ref.book).chapters);
  assert.ok(Number.isInteger(ref.verse)&&ref.verse>=0&&ref.verse<=176&&(ref.verse!==0||ref.book==='Psa'));
  const key=[ref.book,ref.chapter,ref.verse].join('.');assert.ok(!seen.has(key),'Duplicate reference');seen.add(key);
 }
}
const aaron=records.find(r=>r.id==='step-H0175');
assert.ok(aaron.refs.some(r=>r.book==='Exo'&&r.chapter===4&&r.verse===14));
assert.ok(aaron.refs.some(r=>r.book==='Heb'&&r.chapter===5&&r.verse===4),'Hebrew / Greek forms unified without losing NT refs');
const joshua=records.find(r=>r.id==='step-H3091G');
assert.ok(joshua.refs.some(r=>r.book==='Num'&&r.chapter===13&&r.verse===8));
assert.ok(joshua.refs.some(r=>r.book==='Num'&&r.chapter===13&&r.verse===16),'Comma-list reference preserved');
const jesus=records.find(r=>r.id==='step-G2424G');
assert.ok(jesus.refs.some(r=>r.book==='Mat'&&r.chapter===1&&r.verse===21));
assert.ok(!jesus.aliases.includes('Christian'),'Group form must not become an individual alias');
assert.ok(!records.some(r=>r.name==='Salome'&&r.sourceKey.startsWith('Salome@Mat.14.6')),'Unnamed daughter is not retroactively named from external history');
assert.ok(records.filter(r=>r.name==='Mary').length>1,'Same-named women retained as source-distinct records');
assert.ok(records.find(r=>r.id==='step-G1216').identityNote.includes('未明说'),'An explicit warning must accompany the known Demetrius source merge');
assert.ok(records.some(r=>r.refs.some(ref=>ref.book==='Psa'&&ref.verse===0)),'Psalm superscriptions retained explicitly');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'data.js'),'utf8'),context);
assert.equal(JSON.stringify(context.window.BIBLE_PERSON_INDEX),JSON.stringify(data),'Browser data matches audited JSON');
console.log('STEPBible 索引检查通过：66卷映射、2995个人标识、匿名/群体边界、异名与重复节号、浏览器数据一致。');
