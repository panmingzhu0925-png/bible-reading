'use strict';
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
let source=read('index.html').replace('<link rel="stylesheet" href="./style.css">','<style>'+read('../app.css')+read('style.css').replace(/@import[^;]+;/,'')+'</style>');
for(const [url,file] of [['../vendor/echarts.min.js','../vendor/echarts.min.js'],['./tree-data.js','tree-data.js'],['./compact-layout.js','compact-layout.js'],['./app.js','app.js']])source=source.replace(`<script src="${url}" defer></script>`,'<script>'+read(file).replace(/<\/script/gi,'<\\/script')+'</script>');
fs.writeFileSync(path.join(__dirname,'家谱结合预览.html'),source);
console.log('已导出人物树配偶与生母标注预览；图表、数据与样式已内嵌。');
