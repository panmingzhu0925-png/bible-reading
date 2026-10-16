const fs=require('node:fs');
const path=require('node:path');
const data={};
for(const key of ['adam-noah','noah-abraham','abraham-jacob']){
  data[key]=JSON.parse(fs.readFileSync(path.join(__dirname,'data',key+'.json'),'utf8'));
  if(key==='noah-abraham')data[key].rootId='noah';
}
fs.writeFileSync(path.join(__dirname,'data.js'),'window.BIBLE_FAMILY_TREES='+JSON.stringify(data).replace(/</g,'\\u003c')+';\n');
console.log('已生成三份家谱数据。');
