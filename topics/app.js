(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BibleTopics=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
  const dayKey=(key,length)=>/^(0|[1-9]\d*)$/.test(key)&&Number(key)<length;
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function normalizeProgress(raw){
    const value=object(raw)?raw:{},days={};
    for(const [key,day]of Object.entries(object(value.days)?value.days:{})){
      if(dayKey(key,30)&&object(day))days[key]={...day,done:day.done===true,note:typeof day.note==='string'?day.note:''};
    }
    const current=Number(value.current);
    return {...value,current:Number.isFinite(current)?Math.max(0,Math.min(29,Math.trunc(current))):0,days};
  }
  function normalizeState(raw,today,topicIds=['money','parenting']){
    const state=object(raw)?{...raw}:{},days={};
    for(const [key,day]of Object.entries(object(state.days)?state.days:{})){
      if(dayKey(key,365)&&object(day))days[key]={...day,done:object(day.done)?{...day.done}:{},note:typeof day.note==='string'?day.note:''};
    }
    state.days=days;
    const date=typeof state.startDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(state.startDate)?new Date(state.startDate+'T00:00:00'):null;
    const formatted=date&&Number.isFinite(date.getTime())?String(date.getFullYear()).padStart(4,'0')+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0'):'';
    if(formatted!==state.startDate)state.startDate=today;
    // Keep the original money location for existing devices and exported files.
    state.money=normalizeProgress(state.money);
    state.topics=object(state.topics)?{...state.topics}:{};
    for(const id of topicIds)if(id!=='money')state.topics[id]=normalizeProgress(state.topics[id]);
    if(!topicIds.includes(state.activeTopic))state.activeTopic=topicIds.includes('money')?'money':topicIds[0];
    return state;
  }
  function normalizeBackup(raw,today,topicIds){
    if(!object(raw)||!['startDate','days','money','topics'].some(key=>Object.prototype.hasOwnProperty.call(raw,key)))throw new TypeError('Invalid progress backup');
    return normalizeState(raw,today,topicIds);
  }
  function getTopicState(state,id){
    if(id==='money')return state.money||(state.money=normalizeProgress());
    if(!object(state.topics))state.topics={};
    return state.topics[id]||(state.topics[id]=normalizeProgress());
  }
  function dayState(state,id,index){
    const topic=getTopicState(state,id);
    return topic.days[index]||(topic.days[index]={done:false,note:''});
  }
  function progress(state,id,length){
    const topic=getTopicState(state,id);let done=0;
    for(let i=0;i<length;i++)if(topic.days[i]?.done===true)done++;
    return {done,percent:Math.round(done/length*100)};
  }
  function mount({topics,getState,save,onSelect}){
    const $=id=>document.getElementById(id),error=$('topicError');
    if(!Array.isArray(topics)||!topics.length){error.hidden=false;return {render(){}};}
    const byId=new Map(topics.map(topic=>[topic.id,topic]));
    function selected(){const state=getState();return byId.get(state.activeTopic)||topics[0];}
    function render(){
      const state=getState(),topic=selected(),record=getTopicState(state,topic.id);
      record.current=Math.max(0,Math.min(topic.days.length-1,record.current));
      const i=record.current,item=topic.days[i],day=dayState(state,topic.id,i),status=progress(state,topic.id,topic.days.length);
      $('topicChoices').innerHTML=topics.map(t=>{const p=progress(state,t.id,t.days.length);return `<button class="topicChoice" data-topic="${escape(t.id)}" aria-pressed="${t.id===topic.id}"><strong>${escape(t.title)}</strong><span>${t.days.length}天 · 已完成 ${p.done} 天</span></button>`;}).join('');
      $('topicTitle').textContent=`${topic.days.length}天 · ${topic.title}`;
      $('topicSummary').textContent=topic.summary;
      const stage=topic.stages?.find(stage=>i+1>=stage.start&&i+1<=stage.end);
      $('topicStage').hidden=!stage;$('topicStage').textContent=stage?`第${stage.start}–${stage.end}天 · ${stage.title}`:'';
      $('topicGuide').hidden=!topic.intro;$('topicIntro').textContent=topic.intro||'';$('topicSourceNote').textContent=topic.sourceNote||'';
      $('topicTheme').textContent=`第 ${i+1} 天 · ${item.title}`;
      $('topicDayNo').textContent=i+1;$('topicLength').textContent=topic.days.length;
      $('topicProgressBar').style.width=status.percent+'%';$('topicProgressText').textContent=status.percent+'%';$('topicDoneDays').textContent=status.done;
      $('topicScripture').innerHTML=item.refs?.length?item.refs.map(ref=>`<a href="${escape(ref.url)}" target="_blank" rel="noopener noreferrer">${escape(ref.label)}</a>`).join(' · '):escape(item.scripture);
      $('topicCategory').hidden=!item.category;$('topicCategory').textContent=item.category==='家庭应用'?'家庭应用 · 将本段教导带入亲子生活':item.category==='父母教导'?'经文中的父母与家庭教导':'';
      $('topicFocus').hidden=!item.focus;$('topicFocus').textContent=item.focus||'';
      $('topicQuestion').textContent=item.question;
      $('topicActionCard').hidden=!item.action;$('topicAction').textContent=item.action||'';
      $('topicNote').value=day.note;$('topicNote').placeholder=topic.notePrompt||'';
      $('topicCompleteBtn').textContent=day.done?'✓ 今天已完成':'标记今天完成';
      $('topicPrevBtn').disabled=i===0;$('topicNextBtn').disabled=i===topic.days.length-1;
      $('topicOverview').innerHTML=topic.days.map((d,j)=>`<button class="month topicDay${j===i?' active':''}" data-topic-day="${j}"${j===i?' aria-current="step"':''}><strong>${record.days[j]?.done?'✓ ':''}第${j+1}天 · ${escape(d.title)}</strong><span>${escape(d.scripture)}</span></button>`).join('');
    }
    $('topicChoices').addEventListener('click',event=>{
      const button=event.target.closest('[data-topic]');if(!button||!byId.has(button.dataset.topic))return;
      getState().activeTopic=button.dataset.topic;onSelect?.(button.dataset.topic);save();render();
    });
    $('topicOverview').addEventListener('click',event=>{
      const button=event.target.closest('[data-topic-day]');if(!button)return;
      getTopicState(getState(),selected().id).current=Number(button.dataset.topicDay);save();render();$('topicTitle').scrollIntoView({block:'start'});
    });
    $('topicNote').addEventListener('input',()=>{const topic=selected(),state=getState();dayState(state,topic.id,getTopicState(state,topic.id).current).note=$('topicNote').value;save();});
    $('topicCompleteBtn').addEventListener('click',()=>{const topic=selected(),state=getState(),day=dayState(state,topic.id,getTopicState(state,topic.id).current);day.done=!day.done;save();render();});
    function move(delta){const topic=selected(),record=getTopicState(getState(),topic.id);record.current=Math.max(0,Math.min(topic.days.length-1,record.current+delta));save();render();$('topicTitle').scrollIntoView({block:'start'});}
    $('topicPrevBtn').addEventListener('click',()=>move(-1));$('topicNextBtn').addEventListener('click',()=>move(1));
    return {render};
  }
  return {normalizeState,normalizeBackup,getTopicState,dayState,progress,mount};
});
