(() => {
  'use strict';
  const params=new URLSearchParams(location.search);
  if(params.get('embed')==='1')document.documentElement.classList.add('embedded');
  const treeKey=params.get('tree')==='noah-abraham'?'noah-abraham':'adam-noah';
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
  const spouseOnly=db.nodes.filter(n=>!treeIds.has(n.id));
  function spousesOf(id){return db.relations.filter(r=>r.type==='spouse'&&(r.source===id||r.target===id)).map(r=>byId.get(r.source===id?r.target:r.source));}
  function sideSpouses(id){return spousesOf(id).filter(n=>!treeIds.has(n.id));}
  const expanded = new Set(db.mainPath);
  let selected = rootId, direction = matchMedia('(max-width:600px)').matches ? 'TB' : 'LR', scale = 1, tx = 0, ty = 0, width = 1000, height = 700;
  let labelScale=1;
  let visibleIds = [], lastMode = 'mainline';
  const viewport = document.getElementById('viewport');
  const stage = document.getElementById('stage');
  const detail = document.getElementById('details');
  const isAdam=treeKey==='adam-noah';
  document.title=(isAdam?'亚当到挪亚':'挪亚到亚伯拉罕')+' · 圣经阅读';
  document.getElementById('treeTitle').textContent=isAdam?'亚当 — 挪亚':'挪亚 — 亚伯拉罕';
  document.getElementById('treeSubtitle').textContent=isAdam?'创世记 4–5 章家谱 · 该隐与塞特两支':'创世记 10–11 章家谱 · 三支后代与他拉之家';
  document.getElementById('mainLegend').textContent=isAdam?'通往挪亚':'通往亚伯拉罕';
  document.getElementById('overview').textContent=isAdam?'两支概览':'三支概览';
  document.getElementById('groupLegend').hidden=!db.nodes.some(n=>n.kind==='group');
  document.getElementById('scopeCount').textContent=isAdam?`依据《圣经》和合本，收录 ${db.nodes.length} 位具名人物，蓝字旁列配偶。`:`依据《圣经》和合本，收录 ${db.nodes.length} 个条目（人物与族群）。`;
  document.getElementById('chart').setAttribute('aria-label',isAdam?'亚当到挪亚的家谱，可点击姓名查看经文出处':'挪亚到亚伯拉罕的家谱，可点击姓名查看经文出处');
  document.getElementById('orientation').value=direction;
  const chart = echarts.init(document.getElementById('chart'), null, {renderer:'svg'});
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const displayName = n => n.id === 'abraham' ? '亚伯兰（亚伯拉罕）' : n.id === 'sarai' ? '撒莱（撒拉）' : n.name;
  const labelName = n => n.id === 'abraham' ? '亚伯拉罕' : n.name;
  const refShort = s => s.replace('创世记','创');
  function refLink(ref) {
    const chapter = /创世记(\d+)/.exec(ref);
    return `<a class="ref" href="https://cnbible.com/cus/genesis/${chapter ? chapter[1] : 10}.htm" target="_blank" rel="noopener noreferrer" title="打开本章经文">${esc(refShort(ref))}</a>`;
  }
  const refLinks = refs => `<div class="refs">${(refs || []).map(refLink).join('')}</div>`;
  const personButton = (id, text) => `<button class="person-link" data-person="${id}">${esc(text || displayName(byId.get(id)))}</button>`;
  function relationLabel(r,id){if(r.type==='mother-child')return r.source===id?(women.has(r.target)?'女儿':'儿子'):'母亲';return r.relation;}
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
    let connection = id===rootId?'本段家谱的起点':'父系未在本段具名，作为配偶与母亲单列';
    if(parent) connection = n.kind === 'group' ? `${personButton(parent.id)} → ${esc(n.relation)}（族源联系）` : `${personButton(parent.id)}的${esc(n.relation)}`;
    detail.innerHTML = `<button class="close-detail" aria-label="关闭人物详情">×</button><div class="eyebrow">${mainPath.has(id)?'主线人物':!treeIds.has(id)?'配偶人物':'支系记录'}</div><h2>${esc(displayName(n))}${n.kind==='group'?'<span class="kind">族群</span>':''}</h2><div class="connection">${connection}</div>${refLinks(n.refs)}${n.relation.includes('合读')?'<p class="selected-fact">此父女关系根据不同章节合读，详见下方说明。</p>':''}<div class="selection-path">${ancestors(id).map(i=>esc(byId.get(i).name)).join(' › ')}</div>`;
    detail.scrollTop=0;
    if (otherRelations.length) detail.innerHTML += `<h3>亲属关系</h3>${otherRelations.map(r=>`<div class="event"><p>${esc(relationLabel(r,id))}：${personButton(r.source===id?r.target:r.source)}</p>${refLinks(r.refs)}${r.notes?`<p class="note">${esc(r.notes)}</p>`:''}</div>`).join('')}`;
    if(n.events.length) detail.innerHTML += `<h3>经文记载</h3>${n.events.map(e=>`<div class="event"><p>${esc(e.text)}</p>${refLinks(e.refs)}</div>`).join('')}`;
    if(children.get(id).length) {
      detail.innerHTML += `<h3>${n.kind==='group'?'相关族群':'本图所列下一代 / 族群支系'} · ${children.get(id).length} 项</h3><div class="children">${ordered(id).map(c=>`<button data-person="${c}">${esc(byId.get(c).name)}${byId.get(c).kind==='group'?' ◇':''}</button>`).join('')}</div><button class="toggle" data-toggle="${id}">${expanded.has(id)?'收起':'展开'}后代（共 ${descendants(id)} 项）</button>`;
    }
    if(n.notes) detail.innerHTML += `<p class="note">${esc(n.notes)}</p>`;
    if (!n.events.length) detail.innerHTML += '<p class="note">本段仅有家谱或族源记载，没有补写经文未记载的生平。</p>';
    if(openMobile) detail.classList.add('open');
  }
  function measure(id, depth=0) {
    visibleIds.push(id);
    const cs=expanded.has(id)?ordered(id):[];
    if(!cs.length) return {leaves:1, depth};
    const sub=cs.map(c=>measure(c,depth+1));
    return {leaves:sub.reduce((a,s)=>a+s.leaves,0),depth:Math.max(...sub.map(s=>s.depth))};
  }
  function tree(id) {
    const n=byId.get(id), cs=ordered(id), closed=cs.length&&!expanded.has(id), primary=mainPath.has(id), female=women.has(id);
    const color = female?'#477aae':primary?'#b64c40':'#6e8577';
    const kind = n.kind==='group';
    const nodeName = labelName(n), nodeRef = id==='sarai'?'创11:27 / 20:12':refShort(n.refs[0]), partners=sideSpouses(id);
    return {id,name:n.name,collapsed:!!closed,children:cs.map(tree),symbol:kind?'diamond':'circle',symbolSize:primary?8:7,
      itemStyle:{color:closed?color:'#fff',borderColor:color,borderWidth:id===selected?3:1.6},
      lineStyle:{color:primary?'#b64c40':female?'#7296b6':kind?'#a4b3a8':'#bfcbc1',width:primary?2:1.1,type:kind?'dashed':'solid'},
      label:{color,fontSize:14/labelScale,lineHeight:18/labelScale,position:'right',distance:6/labelScale,align:'left',verticalAlign:'middle',formatter:()=>`{name|${nodeName}}${closed?` {more|＋${descendants(id)}}`:''}\n{ref|${nodeRef}${kind?' · 族群':''}}${partners.length?'\n{wife|配偶：}'+partners.map(p=>`{wife|${p.name}}`).join('{wife| / }'):''}`,rich:{name:{fontSize:14/labelScale,fontWeight:primary?600:400,lineHeight:18/labelScale},ref:{fontSize:10/labelScale,color:'#8a978c',lineHeight:14/labelScale},wife:{fontSize:11/labelScale,color:'#477aae',lineHeight:16/labelScale},more:{fontSize:10/labelScale,color:'#8c9a8c',lineHeight:14/labelScale}}}
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
      left:direction==='LR'?30:75,right:direction==='LR'?160:115,top:isAdam?70:45,bottom:35,
      edgeShape:'curve',edgeForkPosition:'50%',initialTreeDepth:-1,expandAndCollapse:false,roam:false,
      emphasis:{focus:'none'},animationDuration:0,animationDurationUpdate:0,silent:false,
      lineStyle:{curveness:.5},label:{position:'right'},leaves:{label:{position:'right'}}}]}, {notMerge:true});
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
    for(const n of spouseOnly){const text=textNodes.find(t=>t.textContent===n.name);if(text){text.setAttribute('data-spouse',n.id);text.setAttribute('role','button');text.setAttribute('tabindex','0');text.setAttribute('aria-label',`查看${n.name}的经文与亲属`);}}
  }
  function render(fit=false) {
    if(viewport.clientWidth===0||viewport.clientHeight===0)return;
    visibleIds=[]; const size=measure(rootId);
    width=direction==='LR'? Math.max(820,(size.depth+1)*114+190):Math.max(620,size.leaves*116+190);
    height=direction==='LR'?Math.max(350,size.leaves*(isAdam?96:67)+70):Math.max(450,(size.depth+1)*(isAdam?78:65)+70);
    stage.style.width=width+'px'; stage.style.height=height+'px'; chart.clear();chart.resize({width,height});
    if(fit) {
      const r=viewport.getBoundingClientRect();
      // Extremely large views remain pannable so the names stay readable.
      scale=Math.max(.5,Math.min(1.15,(r.width-32)/width,(r.height-24)/height));
      labelScale=scale;
      tx=direction==='TB'?(r.width-width*scale)/2:Math.max(12,(r.width-width*scale)/2);
      ty=Math.max(12,(r.height-height*scale)/2);
    }
    drawLabels();transform();
    document.getElementById('count').textContent=`显示 ${visibleIds.length} / ${treeIds.size} ${isAdam?'位家谱人物':'条目'}${spouseOnly.length?` · 另有 ${spouseOnly.length} 位配偶资料`:''}`;
    ['mainline','overview','all'].forEach(mode=>document.getElementById(mode).classList.toggle('active',mode===lastMode));
  }
  function reveal(id) { ancestors(id).slice(0,-1).forEach(p=>expanded.add(p)); }
  function focusNode(id) {
    // SVG text is used only to keep the selected visible label in the viewport.
    requestAnimationFrame(()=>{
      const text=document.querySelector(`#chart svg text[data-person="${id}"]`);
      if(!text) return;
      const r=text.getBoundingClientRect(), v=viewport.getBoundingClientRect();
      if(r.left<v.left+15 || r.right>v.right-15 || r.top<v.top+15 || r.bottom>v.bottom-15) {
        tx+=v.left+v.width*.42-(r.left+r.width/2);ty+=v.top+v.height*.5-(r.top+r.height/2);transform();
      }
    });
  }
  function select(id, focus=false) {if(!treeIds.has(id)){showDetails(id);return;}reveal(id);showDetails(id);lastMode='';render(false);if(focus)focusNode(id); }
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
    if(mode==='overview')(isAdam?['adam','cain','seth']:['noah','shem','ham','japheth']).forEach(id=>expanded.add(id));
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
    const found=db.nodes.filter(n=>displayName(n).includes(q));
    results.innerHTML=found.length?found.map(n=>`<button data-person="${n.id}">${esc(displayName(n))}<small>${n.fatherId?esc(byId.get(n.fatherId).name)+(n.kind==='group'?'支系':'之下'):n.id===rootId?'起点':'配偶档案'} · ${esc(refShort(n.refs[0]))}</small></button>`).join(''):`<p>本段没有此姓名，可尝试“${isAdam?'以诺”“拉麦':'拿鹤”“亚伯拉罕'}”。</p>`;
  });
  results.addEventListener('click',e=>{const b=e.target.closest('[data-person]');if(b){select(b.dataset.person,true);search.value='';results.innerHTML='';}});
  document.addEventListener('click',e=>{if(!e.target.closest('.search'))results.innerHTML='';});
  search.addEventListener('keydown',e=>{if(e.key==='Escape'){results.innerHTML='';search.value='';}});
  const sourcePanel=document.getElementById('sources');
  sourcePanel.innerHTML=`<button class="close-sources" type="button">关闭说明 ×</button><strong>收录范围</strong><p>${esc(db.scope)}</p><p>${isAdam?'夏娃、亚大、洗拉以蓝字旁列配偶，没有接成丈夫的子女。母亲关系在详情中展示；犹八与拿玛的母亲归属按上下文合读并附限定。两个以诺、两个拉麦各有独立档案，拿玛不是经文具名的挪亚之妻。':'◇ 与虚线表示族群支系或族源，不表示亲生子女。撒莱与他拉的父女关系根据创世记11:27及20:12合读。夫妻关系在详情单列，不接成父子线。'} 未具名儿女不补造姓名；重复姓名以父亲及经文区分。本段并非整本圣经全部人物。</p>${db.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`).join('')}`;
  sourcePanel.querySelector('.close-sources').onclick=()=>{sourcePanel.hidden=true;};
  document.getElementById('sourcesToggle').addEventListener('click',()=>{sourcePanel.hidden=!sourcePanel.hidden;if(!sourcePanel.hidden)sourcePanel.scrollIntoView({behavior:'smooth',block:'nearest'});});
  let resizeTimer,lastSize='';
  if('ResizeObserver' in window)new ResizeObserver(()=>{const size=viewport.clientWidth+':'+viewport.clientHeight;if(size===lastSize)return;lastSize=size;render(true);}).observe(viewport);
  else window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>render(true),150);});
  showDetails(rootId,false);render(true);
  if('serviceWorker' in navigator)navigator.serviceWorker.register('../sw.js').catch(()=>{});
})();
