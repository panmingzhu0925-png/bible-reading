'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {build}=require('./build-topics.cjs'),api=require('./app.js'),topics=build(),today='2026-10-19';
let passed=0;const check=(name,run)=>{run();passed++;console.log('PASS: '+name);};
const money=topics.find(t=>t.id==='money'),parenting=topics.find(t=>t.id==='parenting');
check('Two independent 30-day topics, compiled data and Scripture sources are complete',()=>{
  assert.deepEqual(topics.map(t=>t.id),['money','parenting']);
  const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'data.js'),'utf8'),context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.window.BIBLE_TOPICS)),topics);
  assert.equal(parenting.days.filter(d=>d.category==='父母教导').length,9);
  assert.equal(parenting.days.filter(d=>d.category==='家庭应用').length,21);
  for(let i=1;i<=30;i++)assert.equal(parenting.stages.filter(s=>i>=s.start&&i<=s.end).length,1);
  for(const day of parenting.days){assert.ok(day.focus&&day.action&&day.question&&day.refs.length);assert.equal(day.scripture,day.refs.map(r=>r.label).join('；'));}
});
check('All 30 original money readings, titles and questions stay byte-for-byte identical in value',()=>{
  // Baseline independently extracted from reviewed v18 publication blobs.
  const original=money.days.map(d=>({s:d.scripture,t:d.title,q:d.question}));
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(original)).digest('hex'),'c21ad671abe7f18552e1493418ca4aded8920131db893d534a0f20e30426a117');
});
check('Existing money progress and reading notes survive migration without modifying the input',()=>{
  const old={startDate:today,days:{9:{done:{old:true},note:'原读经笔记',extra:'keep'}},money:{current:9,days:{9:{done:true,note:'原金钱笔记'}},extra:'keep'},custom:'keep'};
  const original=JSON.stringify(old),state=api.normalizeState(old,today);
  assert.equal(JSON.stringify(old),original);assert.deepEqual(state.money,old.money);assert.deepEqual(state.days,old.days);assert.equal(state.custom,'keep');
  assert.equal(api.progress(state,'money',30).done,1);assert.equal(api.progress(state,'parenting',30).done,0);
});
check('Old backups and malformed daily indices cannot break the reading calendar',()=>{
  for(const raw of [null,[],2,{}, {money:{current:99}}, {money:{days:null}}, {topics:{parenting:{current:-3,days:[]}}}]){
    const state=api.normalizeState(raw,today);assert.ok(state.days&&state.money.days&&state.topics.parenting.days);
    for(const id of ['money','parenting'])assert.ok(Number.isInteger(api.getTopicState(state,id).current));
  }
  const state=api.normalizeState({startDate:'2026-02-30',days:{banana:{note:'bad'},365:{note:'bad'},'-1':{note:'bad'},'01':{note:'bad'},364:{note:'keep'}},money:{current:3.9,days:{30:{done:true},29:{done:true,note:'末日'}}}},today);
  assert.deepEqual(Object.keys(state.days),['364']);assert.equal(state.startDate,today);assert.equal(state.money.current,3);assert.equal(api.progress(state,'money',30).done,1);
  for(const bad of [null,[],true,'bad',{unrelated:'file'}])assert.throws(()=>api.normalizeBackup(bad,today),/backup/);
});
check('Completion, current day and notes stay separate and survive backup round trips',()=>{
  const state=api.normalizeState({},today);state.money.current=9;state.topics.parenting.current=14;state.activeTopic='parenting';
  Object.assign(api.dayState(state,'money',9),{done:true,note:'理财思考'});Object.assign(api.dayState(state,'parenting',14),{done:true,note:'亲子反思'});
  const restored=api.normalizeBackup(JSON.parse(JSON.stringify(state)),today);
  assert.equal(restored.money.current,9);assert.equal(restored.topics.parenting.current,14);assert.equal(restored.activeTopic,'parenting');
  assert.equal(restored.money.days[9].note,'理财思考');assert.equal(restored.topics.parenting.days[14].note,'亲子反思');
  api.dayState(restored,'parenting',14).done=false;assert.equal(api.progress(restored,'money',30).done,1);assert.equal(api.progress(restored,'parenting',30).done,0);
});
function fakeDocument(){
  const nodes=new Map();return {getElementById(id){if(!nodes.has(id))nodes.set(id,{style:{},value:'',hidden:false,handlers:{},scrollIntoView(){},addEventListener(type,fn){this.handlers[type]=fn;}});return nodes.get(id);}};
}
check('Topic picker, daily navigation and typing use the selected topic and retain old money notes',()=>{
  const previous=global.document,document=global.document=fakeDocument();
  try{
    let state=api.normalizeState({money:{current:9,days:{9:{done:true,note:'原金钱笔记'}}}},today),saves=0,selected;
    const ui=api.mount({topics,getState:()=>state,save:()=>saves++,onSelect:id=>selected=id}),$=id=>document.getElementById(id);
    const event=dataset=>({target:{closest:()=>({dataset})}});
    ui.render();assert.equal($('topicDayNo').textContent,10);assert.equal($('topicNote').value,'原金钱笔记');
    $('topicChoices').handlers.click(event({topic:'parenting'}));assert.equal(selected,'parenting');assert.equal($('topicDayNo').textContent,1);
    $('topicNote').value='只属于亲子第1天';$('topicNote').handlers.input();$('topicCompleteBtn').handlers.click();
    $('topicOverview').handlers.click(event({topicDay:'14'}));assert.equal($('topicDayNo').textContent,15);assert.equal($('topicNote').value,'');
    $('topicChoices').handlers.click(event({topic:'money'}));assert.equal($('topicDayNo').textContent,10);assert.equal($('topicNote').value,'原金钱笔记');assert.equal($('topicActionCard').hidden,true);
    $('topicChoices').handlers.click(event({topic:'parenting'}));assert.equal($('topicDayNo').textContent,15);assert.equal($('topicActionCard').hidden,false);
    state=api.normalizeState(JSON.parse(JSON.stringify(state)),today);ui.render();assert.equal($('topicDayNo').textContent,15);assert.equal(state.topics.parenting.days[0].note,'只属于亲子第1天');
    $('topicOverview').handlers.click(event({topicDay:'29'}));assert.equal($('topicNextBtn').disabled,true);$('topicNextBtn').handlers.click();assert.equal($('topicDayNo').textContent,30);
    assert.ok(saves>=7);
  }finally{global.document=previous;}
});
check('Actual import handler rejects unrelated JSON without saving and restores old/new backups',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),start=html.indexOf('importFile.onchange=e=>{'),end=html.indexOf('resetBtn.onclick=',start);
  assert.ok(start>0&&end>start);let saves=0;
  const initial=api.normalizeState({money:{current:7,days:{7:{note:'保留记录',done:true}}}},today);
  const context={initial,importFile:{},FileReader:class{readAsText(file){this.result=file.text;this.onload();}},normalizeAppState:(raw,importing)=>importing?api.normalizeBackup(raw,today):api.normalizeState(raw,today),save:()=>saves++,render:()=>{},alert:()=>{}};
  vm.createContext(context);vm.runInContext('let state=initial,currentIndex=0;\n'+html.slice(start,end),context);
  const input={value:'same.json',files:[{text:'{"unrelated":true}'}]};context.importFile.onchange({target:input});assert.equal(saves,0);assert.equal(input.value,'');assert.equal(vm.runInContext('state.money.days[7].note',context),'保留记录');
  const replacement=api.normalizeState({activeTopic:'parenting',money:{current:3,days:{3:{note:'理财备份',done:true}}},topics:{parenting:{current:6,days:{6:{note:'亲子备份',done:true}}}}},today);
  input.value='same.json';input.files=[{text:JSON.stringify(replacement)}];context.importFile.onchange({target:input});assert.equal(saves,1);assert.equal(input.value,'');assert.equal(vm.runInContext('state.topics.parenting.days[6].note',context),'亲子备份');
});
console.log(`\n${passed} topic and progress compatibility checks passed.`);
