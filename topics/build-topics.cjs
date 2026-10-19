'use strict';
const fs=require('node:fs'),path=require('node:path');
const {parseScripture}=require('./reading-links.cjs');
const files=['money-30-days.json','parenting-30-days.json'];
function build(){
  return files.map(file=>{
    const topic=JSON.parse(fs.readFileSync(path.join(__dirname,file),'utf8'));
    if(!/^[a-z][a-z0-9-]*$/.test(topic.id)||!topic.title||!topic.summary||topic.days?.length!==30)throw new Error('Invalid topic: '+file);
    topic.days.forEach((day,i)=>{
      for(const key of ['scripture','title','question'])if(typeof day[key]!=='string'||!day[key].trim())throw new Error(`${file} day ${i+1}: missing ${key}`);
      if(topic.id==='parenting'){
        for(const key of ['focus','action','category'])if(typeof day[key]!=='string'||!day[key].trim())throw new Error(`${file} day ${i+1}: missing ${key}`);
        if(!['父母教导','家庭应用'].includes(day.category)||!day.refs?.length)throw new Error(`${file} day ${i+1}: category or references missing`);
        for(const ref of day.refs)if(!ref.label||!/^https:\/\/cnbible\.com\/cus\/[a-z0-9_]+\/\d+\.htm$/.test(ref.url))throw new Error(`${file} day ${i+1}: invalid Scripture reference`);
      }
    });
    return {...topic,days:topic.days.map((day,i)=>{
      const readers=parseScripture(day.scripture,day.refs);
      if(!readers.length)throw new Error(`${file} day ${i+1}: unsupported Scripture link`);
      return {...day,readers};
    })};
  });
}
if(require.main===module){const data=build();fs.writeFileSync(path.join(__dirname,'data.js'),'window.BIBLE_TOPICS='+JSON.stringify(data).replace(/</g,'\\u003c')+';\n');console.log('Generated '+data.length+' topics / '+data.reduce((n,t)=>n+t.days.length,0)+' readings.');}
module.exports={build};
