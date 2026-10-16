(() => {
  'use strict';
  const params=new URLSearchParams(location.search);
  if(params.get('embed')==='1')document.documentElement.classList.add('embedded');
  const pages=[{key:'adam-noah',title:'亚当 → 挪亚',heading:'亚当 — 挪亚',subtitle:'创世记 4–5 章家谱 · 该隐与塞特两支',legend:'通往挪亚',overview:['adam','cain','seth']},{key:'noah-abraham',title:'挪亚 → 亚伯拉罕',heading:'挪亚 — 亚伯拉罕',subtitle:'三支后代 · 拿鹤与哈兰之家',legend:'通往亚伯拉罕',overview:['noah','shem','ham','japheth']},{key:'abraham-jacob',title:'亚伯拉罕 → 雅各',heading:'亚伯拉罕 — 雅各',subtitle:'亚伯拉罕各支 · 以撒、以扫与雅各之家',legend:'通往雅各',overview:['abraham','isaac','ishmael','esau']}];
  const page=pages.find(p=>p.key===params.get('tree'))||pages[0];
  const treeKey=page.key;
  const db=window.BIBLE_FAMILY_TREES?.[treeKey];
  if(!db || !window.echarts){document.getElementById('chart').innerHTML='<p class="error">家谱资料暂时无法加载，请联网后刷新。</p>';return;}
  const rootId=db.rootId||'noah';
  const byId = new Map(db.nodes.map(n => [n.id, n]));
  const children = new Map(db.nodes.map(n => [n.id, []]));
  db.nodes.forEach(n => { if (n.fatherId) children.get(n.fatherId).push(n.id); });
  const mainPath = new Set(db.mainPath);
  const women = new Set(['sarai', 'milcah', 'iscah',...db.nodes.filter(n=>n.gender==='female').map(n=>n.id)]);
  const treeIds=new Set();
  function collectTree(id){treeIds.add(id);children.get(id).forEach(collectTree);}
  collectTree(rootId);
  const relatedOnly=db.nodes.filter(n=>!treeIds.has(n.id));
  function partnersOf(id){return db.relations.filter(r=>['spouse','concubine'].includes(r.type)&&(r.source===id||r.target===id)).map(r=>({person:byId.get(r.source===id?r.target:r.source),role:r.type==='concubine'?'妾':'妻'})).filter(p=>women.has(p.person.id)&&!women.has(id));}
  const partnerText=p=>`${labelName(p.person)}（${p.role}）`;
  const expanded = new Set(db.nodes.map(n=>n.id));
  let selected = rootId, direction = matchMedia('(max-width:600px)').matches ? 'TB' : 'LR', scale = 1, tx = 0, ty = 0, width = 1000, height = 700;
  let labelScale=1;
  let frame={left:80,right:80,top:80,bottom:30};
  let visibleIds = [], lastMode = 'all';
  const viewport = document.getElementById('viewport');
  const stage = document.getElementById('stage');
  const detail = document.getElementById('details');
  const isAdam=treeKey==='adam-noah';
  document.title=page.title+' · 圣经阅读';
  document.getElementById('treeTitle').textContent=page.heading;
  document.getElementById('treeSubtitle').textContent=page.subtitle;
  document.getElementById('mainLegend').textContent=page.legend;
  document.getElementById('overview').textContent='支系概览';
  document.getElementById('groupLegend').hidden=!db.nodes.some(n=>n.kind==='group');
  document.getElementById('scopeCount').textContent=`依据《圣经》和合本，收录 ${db.nodes.length} 个条目。母亲与婚姻见人物详情。`;
  document.getElementById('chart').setAttribute('aria-label',page.title+'家谱，可点击姓名查看经文出处');
  document.getElementById('orientation').value=direction;
  const chart = echarts.init(document.getElementById('chart'), null, {renderer:'svg'});
  const labelFont=getComputedStyle(document.getElementById('chart')).fontFamily;
  const measureContext=document.createElement('canvas').getContext('2d');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const displayName = n => n.id === 'abraham' ? '亚伯兰（亚伯拉罕）' : n.id === 'sarai' ? '撒莱（撒拉）' : n.name;
  const nameCounts=new Map();db.nodes.forEach(n=>nameCounts.set(n.name,(nameCounts.get(n.name)||0)+1));
  const labelName = n => n.id==='abraham'?'亚伯拉罕':nameCounts.get(n.name)>1?`${n.name} · ${n.fatherId?byId.get(n.fatherId).name:'亲属'}之下`:n.name;
  const books={'创世记':['genesis','创'],'出埃及记':['exodus','出'],'民数记':['numbers','民'],'申命记':['deuteronomy','申'],'约书亚记':['joshua','书'],'路得记':['ruth','得'],'撒母耳记上':['1_samuel','撒上'],'撒母耳记下':['2_samuel','撒下'],'列王纪上':['1_kings','王上'],'列王纪下':['2_kings','王下'],'历代志上':['1_chronicles','代上'],'历代志下':['2_chronicles','代下'],'马太福音':['matthew','太'],'路加福音':['luke','路'],'希伯来书':['hebrews','来']};
  const refShort = s => String(s||'').replace(/^[^\d]+/,book=>books[book]?.[1]||book);
  function refLink(ref) {
    const match=/^([^\d]+)(\d+)/.exec(ref), book=match&&books[match[1]];
    if(!book)return `<span class="ref">${esc(refShort(ref))}</span>`;
    return `<a class="ref" href="https://cnbible.com/cus/${book[0]}/${Number(match[2])}.htm" target="_blank" rel="noopener noreferrer" title="打开本章经文">${esc(refShort(ref))}</a>`;
  }
  const refLinks = refs => `<div class="refs">${(refs || []).map(refLink).join('')}</div>`;
  const personButton = (id, text) => `<button class="person-link" data-person="${id}">${esc(text || displayName(byId.get(id)))}</button>`;
  function relationLabel(r,id){if(r.type==='mother-child')return r.source===id?(women.has(r.target)?'女儿':byId.get(r.target).gender==='unknown'?'子女':'儿子'):'母亲';if(r.type==='concubine')return r.source===id?'妾':'婚姻关系';return r.relation;}
  function treeURL(tree,personId){const url=new URL('./index.html',location.href);url.searchParams.set('tree',tree);if(personId)url.searchParams.set('person',personId);if(params.get('embed')==='1')url.searchParams.set('embed','1');return url.href;}
  document.getElementById('pageNav').innerHTML=pages.map(p=>`<a href="${esc(treeURL(p.key))}"${p.key===treeKey?' aria-current="page"':''}>${esc(p.title)}</a>`).join('');
  function ancestors(id) { const list=[]; while(id){list.unshift(id); id=byId.get(id).fatherId;} return list; }
  function descendants(id) { return children.get(id).reduce((sum,c) => sum+1+descendants(c),0); }
  function ordered(id) {
    const cs=[...children.get(id)], main=cs.find(c=>mainPath.has(c));
    if(!main)return cs;
    const sides=cs.filter(c=>c!==main);
    // Keep the red line near the centre instead of pushing it to one edge.
    sides.splice(Math.floor(cs.length/2),0,main);return sides;
  }
  function showDetails(id, openMobile = true) {
    const n = byId.get(id); selected = id;
    const parent = n.fatherId && byId.get(n.fatherId);
    const otherRelations = db.relations.filter(r => r.source===id || r.target===id);
    let connection = id===rootId?'本段家谱的起点':esc(n.originNote||'本段单列的亲属，父家信息以所附经文为准');
    if(parent) connection = n.kind === 'group' ? `${personButton(parent.id)} → ${esc(n.relation)}（族源联系）` : `${personButton(parent.id)}的${esc(n.relation)}`;
    detail.innerHTML = `<button class="close-detail" aria-label="关闭人物详情">×</button><div class="eyebrow">${mainPath.has(id)?'主线人物':!treeIds.has(id)?'关联亲属':'支系记录'}</div><h2>${esc(displayName(n))}${n.kind==='group'?'<span class="kind">族群</span>':''}</h2><div class="connection">${connection}</div>${refLinks(n.refs)}${(n.relation||'').includes('合读')?'<p class="selected-fact">此父女关系根据不同章节合读，详见下方说明。</p>':''}<div class="selection-path">${ancestors(id).map(i=>esc(byId.get(i).name)).join(' › ')}</div>`;
    detail.scrollTop=0;
    if (otherRelations.length) detail.innerHTML += `<h3>亲属关系</h3>${otherRelations.map(r=>`<div class="event"><p>${esc(relationLabel(r,id))}：${personButton(r.source===id?r.target:r.source)}</p>${refLinks(r.refs)}${r.notes?`<p class="note">${esc(r.notes)}</p>`:''}</div>`).join('')}`;
    if(n.crossPageLinks?.length)detail.innerHTML+=`<div class="cross-page">${n.crossPageLinks.map(link=>`<a href="${esc(treeURL(link.tree,link.personId))}">${esc(link.label)} ↗</a>`).join('')}</div>`;
    if(n.events?.length) detail.innerHTML += `<h3>经文记载</h3>${n.events.map(e=>`<div class="event"><p>${esc(e.text)}</p>${refLinks(e.refs)}</div>`).join('')}`;
    if(children.get(id).length) {
      detail.innerHTML += `<h3>${n.kind==='group'?'相关族群':'本图所列下一代 / 族群支系'} · ${children.get(id).length} 项</h3><div class="children">${ordered(id).map(c=>`<button data-person="${c}">${esc(byId.get(c).name)}${byId.get(c).kind==='group'?' ◇':''}</button>`).join('')}</div><button class="toggle" data-toggle="${id}">${expanded.has(id)?'收起':'展开'}后代（共 ${descendants(id)} 项）</button>`;
    }
    if(n.notes) detail.innerHTML += `<p class="note">${esc(n.notes)}</p>`;
    if (!n.events?.length) detail.innerHTML += '<p class="note">本段仅有家谱或族源记载，没有补写经文未记载的生平。</p>';
    if(openMobile) detail.classList.add('open');
  }
  function measure(id, depth=0) {
    visibleIds.push(id);
    const cs=expanded.has(id)?ordered(id):[];
    if(!cs.length) return {leaves:1, depth};
    const sub=cs.map(c=>measure(c,depth+1));
    return {leaves:sub.reduce((a,s)=>a+s.leaves,0),depth:Math.max(...sub.map(s=>s.depth))};
  }
  function labelContent(id){
    const n=byId.get(id);
    const mothers=db.relations.filter(r=>r.type==='mother-child'&&r.target===id).map(r=>byId.get(r.source).name);
    return {name:labelName(n),ref:refShort(n.refs[0])+(n.kind==='group'?' · 族群':''),mother:mothers.length?'母：'+mothers.join(' / '):'',partners:partnersOf(id),closed:children.get(id).length&&!expanded.has(id)};
  }
  function textWidth(text,size,weight=400){
    if(!measureContext)return [...text].reduce((sum,c)=>sum+(c.charCodeAt(0)>255?size:size*.6),0);
    measureContext.font=`${weight} ${size}px ${labelFont}`;
    return measureContext.measureText(text).width;
  }
  function labelSpace(){
    let w=0,h=0;
    for(const id of visibleIds){
      const content=labelContent(id), more=content.closed?textWidth(` ＋${descendants(id)}`,10):0;
      const spouseLines=content.partners.map(partnerText);
      w=Math.max(w,textWidth(content.name,14,mainPath.has(id)?600:400)+more,textWidth(content.ref,10),textWidth(content.mother,10),...spouseLines.map(s=>textWidth(s,11)));
      h=Math.max(h,18+14+(content.mother?14:0)+spouseLines.length*16);
    }
    return {width:Math.ceil(w)+10,height:h+6};
  }
  function branchSlots(){
    const leaves=visibleIds.filter(id=>!expanded.has(id)||!children.get(id).length);
    if(leaves.length<2)return 2;
    // ECharts gives cousins twice the separation of siblings. Include that
    // space before normalising the canvas so sibling labels stay apart.
    let slots=byId.get(leaves[0]).fatherId===byId.get(leaves[leaves.length-1]).fatherId?1:2;
    for(let i=1;i<leaves.length;i++)slots+=byId.get(leaves[i]).fatherId===byId.get(leaves[i-1]).fatherId?1:2;
    return slots;
  }
  function tree(id) {
    const n=byId.get(id), cs=ordered(id), closed=cs.length&&!expanded.has(id), primary=mainPath.has(id), female=women.has(id);
    const color = female?'#477aae':primary?'#b64c40':'#6e8577';
    const kind = n.kind==='group';
    const {name:nodeName,ref:nodeRef,mother,partners}=labelContent(id);
    return {id,name:n.name,collapsed:!!closed,children:cs.map(tree),symbol:kind?'diamond':'circle',symbolSize:primary?8:7,
      itemStyle:{color:closed?color:'#fff',borderColor:color,borderWidth:id===selected?3:1.6},
      lineStyle:{color:primary?'#b64c40':female?'#7296b6':kind?'#a4b3a8':'#bfcbc1',width:primary?2:1.1,type:kind?'dashed':'solid'},
      label:{
        color,fontFamily:labelFont,fontSize:14/labelScale,lineHeight:18/labelScale,
        position:direction==='LR'?'top':'right',distance:8/labelScale,
        align:direction==='LR'?'center':'left',verticalAlign:direction==='LR'?'bottom':'middle',
        backgroundColor:'#fff',padding:[3/labelScale,5/labelScale],borderRadius:3/labelScale,
        formatter:()=>`{name|${nodeName}}${closed?` {more|＋${descendants(id)}}`:''}\n{ref|${nodeRef}}${mother?'\n{ref|'+mother+'}':''}${partners.map(p=>'\n{wife|'+partnerText(p)+'}').join('')}`,
        rich:{
          name:{fontSize:14/labelScale,fontWeight:primary?600:400,lineHeight:18/labelScale},
          ref:{fontSize:10/labelScale,color:'#8a978c',lineHeight:14/labelScale},
          wife:{fontSize:11/labelScale,color:'#477aae',lineHeight:16/labelScale},
          more:{fontSize:10/labelScale,color:'#8c9a8c',lineHeight:14/labelScale}
        }
      }
    };
  }
  function transform() {
    stage.style.transform=`translate(${tx}px,${ty}px) scale(${scale})`;
    document.getElementById('zoomLabel').textContent=Math.round(scale*100)+'%';
  }
  function drawLabels() {
    // Clear the previous tree view before replacing branches. ECharts 5's
    // removal diff can otherwise retain edges from collapsed parent nodes.
    chart.clear();
    chart.setOption({animation:false,tooltip:{show:false},series:[{type:'tree',data:[tree(rootId)],orient:direction,
      ...frame,
      edgeShape:'curve',edgeForkPosition:'50%',initialTreeDepth:-1,expandAndCollapse:false,roam:false,
      emphasis:{focus:'none'},animationDuration:0,animationDurationUpdate:0,silent:false,
      lineStyle:{curveness:.5}}]}, {notMerge:true});
    decorateNodes();
  }
  function decorateNodes() {
    const textNodes=[...document.querySelectorAll('#chart svg text')];
    for(const id of visibleIds) {
      const text=textNodes.find(t=>!t.hasAttribute('data-person')&&t.textContent===labelName(byId.get(id)));
      if(text) {
        text.setAttribute('data-person',id);text.setAttribute('role','button');text.setAttribute('tabindex','0');text.setAttribute('aria-label',`查看${displayName(byId.get(id))}的经文与亲属`);
        if(children.get(id).length&&!expanded.has(id)){
          const start=textNodes.indexOf(text), more=textNodes.slice(start+1,start+4).find(t=>t.textContent===`＋${descendants(id)}`);
          if(more){more.setAttribute('data-expand',id);more.setAttribute('role','button');more.setAttribute('tabindex','0');more.setAttribute('aria-label',`展开${displayName(byId.get(id))}的后代`);more.style.cursor='pointer';}
        }
      }
    }
    for(const id of visibleIds)for(const p of partnersOf(id)){const text=textNodes.find(t=>!t.hasAttribute('data-spouse')&&t.textContent===partnerText(p));if(text){text.setAttribute('data-spouse',p.person.id);text.setAttribute('role','button');text.setAttribute('tabindex','0');text.setAttribute('aria-label',`查看${p.person.name}的经文与亲属`);}}
  }
  function render(fit=false) {
    if(viewport.clientWidth===0||viewport.clientHeight===0)return;
    visibleIds=[]; const size=measure(rootId);
    const label=labelSpace(),slots=branchSlots();
    const margins=direction==='LR'
      ?{left:label.width/2+24,right:label.width/2+24,top:label.height+24,bottom:32}
      :{left:28,right:label.width+32,top:label.height/2+24,bottom:label.height/2+24};
    const nominalWidth=direction==='LR'
      ?margins.left+Math.max(1,size.depth)*(label.width+44)+margins.right
      :margins.left+slots*(label.width+28)+margins.right;
    const nominalHeight=direction==='LR'
      ?margins.top+slots*(label.height+24)+margins.bottom
      :margins.top+Math.max(1,size.depth)*(label.height+44)+margins.bottom;
    if(fit) {
      const r=viewport.getBoundingClientRect();
      scale=Math.max(.5,Math.min(1.15,(r.width-32)/nominalWidth,(r.height-24)/nominalHeight));
      labelScale=scale;
    }
    // Font sizes and every spacing dimension use the same scale. Fitting or
    // changing orientation must never squeeze generations underneath labels.
    width=Math.ceil(nominalWidth/labelScale);
    height=Math.ceil(nominalHeight/labelScale);
    frame=Object.fromEntries(Object.entries(margins).map(([key,value])=>[key,value/labelScale]));
    stage.style.width=width+'px';stage.style.height=height+'px';chart.clear();chart.resize({width,height});
    if(fit){
      const r=viewport.getBoundingClientRect();
      tx=direction==='TB'?(r.width-width*scale)/2:Math.max(12,(r.width-width*scale)/2);
      ty=Math.max(12,(r.height-height*scale)/2);
    }
    drawLabels();transform();
    document.getElementById('count').textContent=`显示 ${visibleIds.length} / ${treeIds.size} 条目${relatedOnly.length?` · 另有 ${relatedOnly.length} 位关联亲属`:''}`;
    ['mainline','overview','all'].forEach(mode=>document.getElementById(mode).classList.toggle('active',mode===lastMode));
    if(fit)focusNode(selected);
  }
  function reveal(id) { ancestors(id).slice(0,-1).forEach(p=>expanded.add(p)); }
  function focusNode(id) {
    // SVG text is used only to keep the selected visible label in the viewport.
    requestAnimationFrame(()=>{
      const text=document.querySelector(`#chart svg text[data-person="${id}"], #chart svg text[data-spouse="${id}"]`)||document.querySelector(`#chart svg text[data-person="${rootId}"]`);
      if(!text) return;
      const texts=[...document.querySelectorAll('#chart svg text')],start=texts.indexOf(text);
      let parts=[text];
      if(text.hasAttribute('data-person')){const next=texts.findIndex((t,i)=>i>start&&t.hasAttribute('data-person'));parts=texts.slice(start,next<0?texts.length:next);}
      const boxes=parts.map(t=>t.getBoundingClientRect());
      const r={left:Math.min(...boxes.map(b=>b.left)),right:Math.max(...boxes.map(b=>b.right)),top:Math.min(...boxes.map(b=>b.top)),bottom:Math.max(...boxes.map(b=>b.bottom))};
      r.width=r.right-r.left;r.height=r.bottom-r.top;
      const v=viewport.getBoundingClientRect();
      if(r.left<v.left+15 || r.right>v.right-15)tx+=v.left+v.width*.42-(r.left+r.width/2);
      if(r.top<v.top+15 || r.bottom>v.bottom-15)ty+=v.top+v.height*.5-(r.top+r.height/2);
      transform();
    });
  }
  function select(id, focus=false) {
    const anchor=treeIds.has(id)?id:db.relations.filter(r=>['spouse','concubine'].includes(r.type)&&(r.source===id||r.target===id)).map(r=>r.source===id?r.target:r.source).find(p=>treeIds.has(p));
    if(anchor)reveal(anchor);showDetails(id);lastMode='';render(false);if(focus)focusNode(id);
  }
  function toggle(id,openMobile=true) {
    if(expanded.has(id))expanded.delete(id);else expanded.add(id);
    lastMode='';render(false);showDetails(id,openMobile);if(!openMobile)detail.classList.remove('open');focusNode(id);
  }
  chart.on('click',p=>{if(p.data?.id)select(p.data.id);});
  chart.on('finished',decorateNodes);
  document.getElementById('chart').addEventListener('click',e=>{const b=e.target.closest('[data-expand]'),s=e.target.closest('[data-spouse]');if(b||s){e.stopImmediatePropagation();e.preventDefault();if(b)toggle(b.dataset.expand,false);else select(s.dataset.spouse);}},true);
  document.getElementById('chart').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){if(e.target.dataset.expand){e.preventDefault();toggle(e.target.dataset.expand,false);}else if(e.target.dataset.spouse){e.preventDefault();select(e.target.dataset.spouse);}else if(e.target.dataset.person){e.preventDefault();select(e.target.dataset.person);}}});
  detail.addEventListener('click',e=>{const p=e.target.closest('[data-person]'), t=e.target.closest('[data-toggle]');if(p)select(p.dataset.person,true);if(t)toggle(t.dataset.toggle);if(e.target.closest('.close-detail'))detail.classList.remove('open');});
  ['mainline','overview','all'].forEach(mode=>document.getElementById(mode).addEventListener('click',()=>{
    expanded.clear();
    if(mode==='mainline')db.mainPath.forEach(id=>expanded.add(id));
    if(mode==='overview')page.overview.forEach(id=>expanded.add(id));
    if(mode==='all')db.nodes.forEach(n=>expanded.add(n.id));
    lastMode=mode;render(true);detail.classList.remove('open');
  }));
  document.getElementById('orientation').addEventListener('change',e=>{direction=e.target.value;render(true);});
  document.getElementById('fit').addEventListener('click',()=>render(true));
  function zoom(factor,x=viewport.clientWidth/2,y=viewport.clientHeight/2) {
    const before=scale;scale=Math.min(2.6,Math.max(.35,scale*factor));
    tx=x-(x-tx)*scale/before;ty=y-(y-ty)*scale/before;
    transform();
  }
  document.getElementById('plus').addEventListener('click',()=>zoom(1.2));
  document.getElementById('minus').addEventListener('click',()=>zoom(1/1.2));
  viewport.addEventListener('wheel',e=>{e.preventDefault();const r=viewport.getBoundingClientRect();zoom(Math.exp(-e.deltaY*.0014),e.clientX-r.left,e.clientY-r.top);},{passive:false});
  const pointers=new Map(); let gesture=null,suppressClick=false;
  function pointerDistance(){const p=[...pointers.values()];return p.length===2?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0;}
  viewport.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});gesture={x:e.clientX,y:e.clientY,tx,ty,distance:pointerDistance(),scale};suppressClick=false;});
  viewport.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId)||!gesture)return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===2&&gesture.distance){const r=viewport.getBoundingClientRect(),ps=[...pointers.values()];zoom((gesture.scale*pointerDistance()/gesture.distance)/scale,(ps[0].x+ps[1].x)/2-r.left,(ps[0].y+ps[1].y)/2-r.top);suppressClick=true;}
    else if(pointers.size===1){const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(Math.hypot(dx,dy)>4||suppressClick){suppressClick=true;tx=gesture.tx+dx;ty=gesture.ty+dy;transform();viewport.classList.add('dragging');}}
  });
  const endPointer=e=>{pointers.delete(e.pointerId);if(!pointers.size){gesture=null;viewport.classList.remove('dragging');}else if(pointers.size===1){const p=[...pointers.values()][0];gesture={x:p.x,y:p.y,tx,ty,distance:0,scale};}};
  window.addEventListener('pointerup',endPointer);window.addEventListener('pointercancel',endPointer);
  viewport.addEventListener('click',e=>{if(suppressClick){e.stopImmediatePropagation();e.preventDefault();suppressClick=false;}},true);
  const search=document.getElementById('search'), results=document.getElementById('results');
  search.addEventListener('input',()=>{
    const q=search.value.trim();if(!q){results.innerHTML='';return;}
    const found=db.nodes.filter(n=>displayName(n).includes(q)||(n.aliases||[]).some(alias=>alias.includes(q)));
    results.innerHTML=found.length?found.map(n=>`<button data-person="${n.id}">${esc(displayName(n))}<small>${n.fatherId?esc(byId.get(n.fatherId).name)+(n.kind==='group'?'支系':'之下'):n.id===rootId?'起点':'关联亲属'} · ${esc(refShort(n.refs[0]))}</small></button>`).join(''):'<p>本段没有此姓名，可换用人物别名或切换家谱分段。</p>';
  });
  results.addEventListener('click',e=>{const b=e.target.closest('[data-person]');if(b){select(b.dataset.person,true);search.value='';results.innerHTML='';}});
  document.addEventListener('click',e=>{if(!e.target.closest('.search'))results.innerHTML='';});
  search.addEventListener('keydown',e=>{if(e.key==='Escape'){results.innerHTML='';search.value='';}});
  const sourcePanel=document.getElementById('sources');
  sourcePanel.innerHTML=`<button class="close-sources" type="button">关闭说明 ×</button><strong>收录范围</strong><p>${esc(db.scope)}</p><p>夫妻、妻妾以蓝字旁列，点击姓名可看详情；“母：”标明经文所记的母亲。◇ 与虚线表示族群支系或族源，不表示亲生子女。未具名人物如有收录会明确标注，重复姓名保留独立档案。${isAdam?'两个以诺、两个拉麦分别建档，拿玛没有被认定为挪亚之妻。':''} 关系有合读、异名或范围限定时，均在人物详情中说明。</p>${db.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`).join('')}`;
  sourcePanel.querySelector('.close-sources').onclick=()=>{sourcePanel.hidden=true;};
  document.getElementById('sourcesToggle').addEventListener('click',()=>{sourcePanel.hidden=!sourcePanel.hidden;if(!sourcePanel.hidden)sourcePanel.scrollIntoView({behavior:'smooth',block:'nearest'});});
  let resizeTimer,lastSize='';
  if('ResizeObserver' in window)new ResizeObserver(()=>{const size=viewport.clientWidth+':'+viewport.clientHeight;if(size===lastSize)return;lastSize=size;render(true);}).observe(viewport);
  else window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>render(true),150);});
  const focusIds=treeKey==='abraham-jacob'?['abraham','ishmael','isaac','esau','jacob']:treeKey==='noah-abraham'?['noah','terah','nahor_brother','haran_person','laban']:[];
  const quickFocus=document.getElementById('quickFocus');
  if(focusIds.length){quickFocus.hidden=false;quickFocus.innerHTML='<span>定位</span>'+focusIds.filter(id=>byId.has(id)).map(id=>`<button data-focus="${id}">${esc(labelName(byId.get(id)))}</button>`).join('');quickFocus.addEventListener('click',e=>{const b=e.target.closest('[data-focus]');if(b)select(b.dataset.focus,true);});}
  const initialId=byId.has(params.get('person'))?params.get('person'):rootId;
  showDetails(initialId,false);render(true);if(initialId!==rootId)focusNode(initialId);
  if(window.parent!==window)window.parent.postMessage({type:'bible-family-tree',tree:treeKey,person:params.get('person')||''},location.origin);
  if('serviceWorker' in navigator)navigator.serviceWorker.register('../sw.js').catch(()=>{});
})();
