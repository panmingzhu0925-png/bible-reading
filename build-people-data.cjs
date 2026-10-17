'use strict';
const fs=require('node:fs');
const people=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'people-data.json'),'utf8'));
if(new Set(people.map(p=>p.id)).size!==people.length)throw new Error('人物标识重复');
for(const p of people)if(!p.id||!p.name||!p.refs?.length)throw new Error('缺少姓名或经文：'+p.id);
fs.writeFileSync(require('node:path').join(__dirname,'people-data.js'),'window.BIBLE_PEOPLE='+JSON.stringify(people).replace(/</g,'\\u003c')+';\n');
console.log(people.length+'份人物导读已生成');
