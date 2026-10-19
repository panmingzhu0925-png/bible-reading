(() => {
  'use strict';
  const params=new URLSearchParams(location.search);
  if(params.get('embed')==='1')document.documentElement.classList.add('embedded');
  const tribePages=[
    ['reuben','流便'],['simeon','西缅'],['levi','利未'],['judah','犹大'],['dan','但'],['naphtali','拿弗他利'],['gad','迦得'],['asher','亚设'],['issachar','以萨迦'],['zebulun','西布伦'],['joseph_patriarch','约瑟'],['benjamin','便雅悯']
  ].map(([root,name])=>({key:root==='judah'?'judah-jesus':'tribe-'+(root==='joseph_patriarch'?'joseph':root),root,name,title:root==='judah'?'犹大 → 耶稣':name+'支派',heading:root==='judah'?'犹大 — 大卫 — 耶稣':name+'支派 · 家族源头',subtitle:root==='judah'?'《马太福音》1章主线 · 补列旧约省略世代':'《创世记》46章具名家族 · 支派与分地经文',legend:root==='judah'?'通往耶稣':'支派起点',overview:[root],focus:root==='judah'?null:root==='joseph_patriarch'?['joseph_patriarch','manasseh','ephraim']:[root],tribe:true}));
  const pages=[{key:'adam-noah',title:'亚当 → 挪亚',heading:'亚当 — 挪亚',subtitle:'创世记 4–5 章家谱 · 该隐与塞特两支',legend:'通往挪亚',overview:['adam','cain','seth']},{key:'noah-abraham',title:'挪亚 → 亚伯拉罕',heading:'挪亚 — 亚伯拉罕',subtitle:'三支后代 · 拿鹤与哈兰之家',legend:'通往亚伯拉罕',overview:['noah','shem','ham','japheth']},{key:'abraham-jacob',title:'亚伯拉罕 → 雅各一家',heading:'亚伯拉罕 — 雅各与十二子',subtitle:'以扫家族 · 雅各十二子与底拿 · 以法莲、玛拿西',legend:'通往雅各',overview:['abraham','isaac','ishmael','esau','jacob']},{key:'jacob-tribes',title:'十二支派总览',heading:'雅各十二子 — 十二支派',subtitle:'十二子与生母 · 各支派分开查看',legend:'家族起点',overview:['jacob'],overviewTitle:'十二子概览',focus:['jacob','judah','joseph_patriarch']},tribePages.find(p=>p.root==='judah')];
  const lukePage={...tribePages.find(p=>p.root==='judah'),key:'judah-luke',title:'犹大家谱 · 路加对照',heading:'犹大 — 耶稣（路加记载）'};
  const page=[...pages,...tribePages,lukePage].find(p=>p.key===params.get('tree'))||pages[2];
  const treeKey=page.key;
  const sourceDb=window.BIBLE_FAMILY_TREES?.[treeKey];
  if(!sourceDb || !window.echarts || !window.CompactTreeLayout){document.getElementById('chart').innerHTML='<p class="error">家谱资料暂时无法加载，请联网后刷新。</p>';return;}
  const relatedFamilies=sourceDb.relatedFamilies||[];
  const mainTreeIds=new Set(sourceDb.treeNodeIds);
  const familyForPerson=id=>relatedFamilies.find(f=>f.nodeIds.includes(id));
  const mainAnchorFor=id=>sourceDb.relations.filter(r=>['spouse','concubine'].includes(r.type)&&(r.source===id||r.target===id)||r.type==='mother-child'&&r.source===id).map(r=>r.source===id?r.target:r.source).find(p=>mainTreeIds.has(p));
  let relatedFamily=relatedFamilies.find(f=>f.rootId===params.get('related'));
  const requestedPerson=params.get('person');
  if(!relatedFamily&&requestedPerson&&!mainTreeIds.has(requestedPerson)&&!mainAnchorFor(requestedPerson))relatedFamily=familyForPerson(requestedPerson);
  const isRelatedFamily=!!relatedFamily;
  const familyCategoryLabels={'northern-kingdom':'北国以色列王族','kenite-family':'基尼人相关家族','associated-family':'婚姻与相关父家'};
  const relatedIds=new Set(relatedFamily?.nodeIds||[]);
  // Keep the complete archive for detail links. Only the chosen family's graph
  // is isolated; its father links retain the original Scripture identities.
  const db=isRelatedFamily?{...sourceDb,rootId:relatedFamily.rootId,mainPath:[relatedFamily.rootId],nodes:sourceDb.nodes.map(n=>{
    const copy={...n};
    if(!relatedIds.has(n.id)){copy.relatedOnly=true;return copy;}
    delete copy.relatedOnly;
    if(n.id===relatedFamily.rootId){delete copy.treeParentId;return copy;}
    if(relatedIds.has(n.fatherId)){
      delete copy.treeParentId;
      if(n.lineageKind==='maternal'){delete copy.lineageKind;delete copy.lineageLabel;}
    }
    return copy;
  })}:sourceDb;
  const rootId=db.rootId||'noah';
  const byId = new Map(db.nodes.map(n => [n.id, n]));
  const diagramParent=n=>n.relatedOnly?null:n.treeParentId||n.fatherId;
  const children = new Map(db.nodes.map(n => [n.id, []]));
  db.nodes.forEach(n => { const parent=diagramParent(n);if(parent)children.get(parent).push(n.id); });
  const mainPath = new Set(db.mainPath);
  const women = new Set(['sarai', 'milcah', 'iscah',...db.nodes.filter(n=>n.gender==='female').map(n=>n.id)]);
  const treeIds=new Set();
  function collectTree(id){treeIds.add(id);children.get(id).forEach(collectTree);}
  collectTree(rootId);
  let viewRoot=treeIds.has(params.get('family'))?params.get('family'):rootId;
  const relatedOnly=db.nodes.filter(n=>!treeIds.has(n.id));
  function partnersOf(id){return db.relations.filter(r=>['spouse','concubine'].includes(r.type)&&(r.source===id||r.target===id)).map(r=>({person:byId.get(r.source===id?r.target:r.source),role:r.type==='concubine'?'妾':'妻'})).filter(p=>women.has(p.person.id)&&!women.has(id));}
  const partnerText=p=>`${labelName(p.person)}（${p.role}）`;
  const mothersByChild=new Map(db.relations.filter(r=>r.type==='mother-child').map(r=>[r.target,r.source]));
  const expanded = new Set(db.nodes.map(n=>n.id));
  let selected = rootId, direction = 'TB', scale = 1, tx = 0, ty = 0, width = 1000, height = 700;
  let labelScale=1;
  let geometry=null;
  let visibleIds = [], lastMode = 'all';
  const viewport = document.getElementById('viewport');
  const stage = document.getElementById('stage');
  const detail = document.getElementById('details');
  const isAdam=treeKey==='adam-noah';
  const isTribes=treeKey==='jacob-tribes';
  const isJudah=treeKey==='judah-jesus';
  const hasLineage=db.nodes.some(n=>n.lineageKind);
  if(isTribes||page.tribe){document.documentElement.classList.add('tribes-page');document.querySelector('.preview-note').textContent=db.previewNote||(isJudah?'按《马太福音》1章展开，旧约补列的世代另有标记；虚线旁注明谱系差异。约瑟为马利亚的丈夫，非耶稣生父。':isTribes?'下方选择支派，单独查看各支家族。约瑟后裔列玛拿西、以法莲两支；利未人另得城邑与郊野。':'本页单列这一支的《创世记》46章家族。选择其他支派可切换；犹大支派已继续接到耶稣。');}
  document.title=(relatedFamily?relatedFamily.title:page.title)+' · 圣经人物家谱';
  document.getElementById('treeTitle').textContent=relatedFamily?relatedFamily.title:db.expansionApplied&&!isJudah?byId.get(rootId).name+'支派 — 家谱与人物':page.heading;
  document.getElementById('treeSubtitle').textContent=relatedFamily?(familyCategoryLabels[relatedFamily.category]||'相关家族')+' · 各家独立显示，点击姓名查看经文':db.subtitle||page.subtitle;
  document.getElementById('mainLegend').textContent=isRelatedFamily?'本家族起点':page.legend;
  document.getElementById('overview').textContent=page.overviewTitle||'支系概览';
  document.getElementById('groupLegend').hidden=!db.nodes.some(n=>n.kind==='group');
  document.getElementById('tribeLegend').hidden=!db.nodes.some(n=>n.tribeInfo);
  document.getElementById('lineageLegend').hidden=!hasLineage;
  if(hasLineage)document.getElementById('sourcesToggle').textContent='家谱差异与来源';
  document.getElementById('scopeCount').textContent=relatedFamily?`本家族 ${relatedFamily.nodeIds.length} 条图面记录，已与犹大家谱分开显示；点击姓名查看经文及相关亲属。`:`依据《圣经》和合本，收录 ${db.nodes.length} 个档案${relatedFamilies.length?`；${relatedFamilies.length}组相关家族单独查看`:''}。蓝字妻妾／母亲可点击；同胞按母亲分组。`;
  document.getElementById('chart').setAttribute('aria-label',(relatedFamily?relatedFamily.title:page.title)+'家谱，可点击姓名查看经文出处');
  document.getElementById('orientation').value=direction;
  // Run after ECharts 5.6.0's tree layout. Keep its tree renderer and events,
  // replacing uniform leaf slots with measured, compact family positions.
  echarts.registerLayout(1100,model=>{
    if(!geometry)return;
    model.eachSeriesByType('tree',series=>{
      if(series.id!=='genealogy-tree-preview')return;
      series.getData().tree.eachNode(node=>{
        const point=geometry.positions.get(node.getId());
        if(point)node.setLayout({x:point.x/labelScale,y:point.y/labelScale},true);
      });
    });
  });
  const chart = echarts.init(document.getElementById('chart'), null, {renderer:'svg'});
  const labelFont=getComputedStyle(document.getElementById('chart')).fontFamily;
  const measureContext=document.createElement('canvas').getContext('2d');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const displayName = n => n.id === 'abraham' ? '亚伯兰（亚伯拉罕）' : n.id === 'sarai' ? '撒莱（撒拉）' : n.name;
  const nameCounts=new Map();db.nodes.forEach(n=>nameCounts.set(n.name,(nameCounts.get(n.name)||0)+1));
  const labelName = n => n.graphLabel||(n.id==='abraham'?'亚伯拉罕':nameCounts.get(n.name)>1?`${n.name} · ${n.fatherId?byId.get(n.fatherId).name:'亲属'}之下`:n.name);
  const books={'创世记':['genesis','创'],'出埃及记':['exodus','出'],'利未记':['leviticus','利'],'民数记':['numbers','民'],'申命记':['deuteronomy','申'],'约书亚记':['joshua','书'],'士师记':['judges','士'],'路得记':['ruth','得'],'撒母耳记上':['1_samuel','撒上'],'撒母耳记下':['2_samuel','撒下'],'列王纪上':['1_kings','王上'],'列王纪下':['2_kings','王下'],'历代志上':['1_chronicles','代上'],'历代志下':['2_chronicles','代下'],'以斯拉记':['ezra','拉'],'尼希米记':['nehemiah','尼'],'以斯帖记':['esther','斯'],'诗篇':['psalms','诗'],'以赛亚书':['isaiah','赛'],'耶利米书':['jeremiah','耶'],'以西结书':['ezekiel','结'],'哈该书':['haggai','该'],'撒迦利亚书':['zechariah','亚'],'马太福音':['matthew','太'],'马可福音':['mark','可'],'路加福音':['luke','路'],'约翰福音':['john','约'],'使徒行传':['acts','徒'],'罗马书':['romans','罗'],'哥林多后书':['2_corinthians','林后'],'腓立比书':['philippians','腓'],'希伯来书':['hebrews','来']};
  const refShort = s => String(s||'').replace(/^[^\d]+/,book=>books[book]?.[1]||book);
  function refLink(ref) {
    const match=/^([^\d]+)(\d+)/.exec(ref), book=match&&books[match[1]];
    if(!book)return `<span class="ref">${esc(refShort(ref))}</span>`;
    return `<a class="ref" href="https://cnbible.com/cus/${book[0]}/${Number(match[2])}.htm" target="_blank" rel="noopener noreferrer" title="打开本章经文">${esc(refShort(ref))}</a>`;
  }
  const refLinks = refs => `<div class="refs">${(refs || []).map(refLink).join('')}</div>`;
  const personButton = (id, text) => `<button class="person-link" data-person="${id}">${esc(text || displayName(byId.get(id)))}</button>`;
  function relationLabel(r,id){if(['mother-child','father-child'].includes(r.type))return r.source===id?(women.has(r.target)?'女儿':byId.get(r.target).gender==='unknown'?'子女':'儿子'):r.type==='mother-child'?'母亲':'父亲';if(r.type==='concubine')return r.source===id?'妾':'婚姻关系';return r.relation;}
  function treeURL(tree,personId,relatedRoot){const url=new URL('./index.html',location.href);url.searchParams.set('tree',tree);if(personId)url.searchParams.set('person',personId);if(relatedRoot)url.searchParams.set('related',relatedRoot);if(params.get('embed')==='1')url.searchParams.set('embed','1');return url.href;}
  document.getElementById('pageNav').innerHTML=pages.map(p=>`<a href="${esc(treeURL(p.key))}"${p.key===treeKey?' aria-current="page"':''}>${esc(p.title)}</a>`).join('');
  const tribeNav=document.getElementById('tribeNav');
  tribeNav.hidden=!(isTribes||page.tribe);
  if(!tribeNav.hidden){
    const picker=document.getElementById('tribePicker');
    picker.innerHTML='<option value="jacob-tribes">十二支派总览</option>'+tribePages.map(p=>`<option value="${p.key}">${esc(p.root==='judah'?'犹大 · 到大卫、耶稣':p.root==='joseph_patriarch'?'约瑟 · 玛拿西与以法莲':p.name+'支派')}</option>`).join('');
    picker.value=treeKey==='judah-luke'?'judah-jesus':treeKey;
    picker.addEventListener('change',()=>{location.href=treeURL(picker.value);});
    document.getElementById('tribeOverview').href=treeURL('jacob-tribes');
  }
  const gospelNav=document.getElementById('gospelNav');
  gospelNav.hidden=page.root!=='judah'||isRelatedFamily;
  if(!gospelNav.hidden)gospelNav.innerHTML='<span>家谱对照</span>'+[['judah-jesus','马太主线与犹大旁支'],['judah-luke','路加 · 拿单一线']].map(([key,label])=>`<a href="${esc(treeURL(key))}"${key===treeKey?' aria-current="page"':''}>${label}</a>`).join('');
  const relatedNav=document.getElementById('relatedFamilyNav');
  relatedNav.hidden=!relatedFamilies.length;
  if(relatedFamilies.length){
    const mainLink=document.getElementById('judahFamilyLink');mainLink.href=treeURL(treeKey);if(!isRelatedFamily)mainLink.setAttribute('aria-current','page');
    const picker=document.getElementById('relatedFamilyPicker');
    picker.innerHTML='<option value="">选择相关家族…</option>'+[...new Set(relatedFamilies.map(f=>f.category))].map(category=>`<optgroup label="${esc(familyCategoryLabels[category]||category)}">${relatedFamilies.filter(f=>f.category===category).map(f=>`<option value="${f.rootId}">${esc(f.title)}</option>`).join('')}</optgroup>`).join('');
    picker.value=relatedFamily?.rootId||'';picker.addEventListener('change',()=>{location.href=treeURL(treeKey,undefined,picker.value);});
    if(isRelatedFamily){const url=new URL(location.href);url.searchParams.set('related',relatedFamily.rootId);history.replaceState({},'',url);document.querySelector('.preview-note').textContent='本家族单独展示；与犹大家属的婚姻及母系关系保留在人物详情，支派未明者仍注明未确定。';}
  }
  const maternalGuide=document.getElementById('maternalGuide');
  maternalGuide.hidden=!db.maryNathanGuide||isRelatedFamily;
  if(db.maryNathanGuide&&!isRelatedFamily){
    const g=db.maryNathanGuide;
    maternalGuide.querySelector('summary').textContent=g.title;
    maternalGuide.open=params.get('explain')==='mary';
    maternalGuide.querySelector('.maternal-guide-body').innerHTML=`<div class="maternal-path">${personButton('david')}<span>→</span>${personButton('nathan_david')}<span>→ … →</span><span class="interpretation-pair"><a href="${esc(treeURL('judah-luke',g.heliId))}">希里</a><span class="interpretation-edge"><span>⇢</span><small>${esc(g.edgeLabel)}</small></span>${personButton('mary')}</span><span>→</span>${personButton('jesus')}</div><p>${esc(g.summary)}</p><p class="note">${esc(g.boundary)}</p>${refLinks(g.refs)}<a class="interpretation-source" href="${esc(g.interpretationSource.url)}" target="_blank" rel="noopener noreferrer">${esc(g.interpretationSource.title)} ↗</a>`;
    maternalGuide.addEventListener('click',e=>{const button=e.target.closest('[data-person]');if(button)select(button.dataset.person,true);});
  }
  function ancestors(id,drawn=true) { const list=[]; while(id){list.unshift(id); const n=byId.get(id);id=drawn?diagramParent(n):n.fatherId;} return list; }
  function descendants(id) { return children.get(id).reduce((sum,c) => sum+1+descendants(c),0); }
  function withMainInMiddle(items,main){
    if(!main)return items;
    const sides=items.filter(item=>item!==main);
    sides.splice(Math.floor(items.length/2),0,main);return sides;
  }
  function ordered(id) {
    const cs=[...children.get(id)], main=cs.find(c=>mainPath.has(c));
    const partners=partnersOf(id);
    if(partners.length>1){
      const order=new Map(partners.map((p,i)=>[p.person.id,i])),groups=new Map();
      cs.sort((a,b)=>(order.get(mothersByChild.get(a))??99)-(order.get(mothersByChild.get(b))??99));
      for(const child of cs){const mother=mothersByChild.get(child)||'';if(!groups.has(mother))groups.set(mother,[]);groups.get(mother).push(child);}
      const families=[...groups.values()],mainFamily=families.find(family=>family.includes(main));
      // Keep children with their own mother while putting the main family
      // between the side families. Position is for reading, not birth order.
      return withMainInMiddle(families,mainFamily).flatMap(family=>withMainInMiddle(family,family.includes(main)?main:null));
    }
    return withMainInMiddle(cs,main);
  }
  function showDetails(id, openMobile = true) {
    const n = byId.get(id); selected = id;
    const parent = byId.get(n.fatherId||n.originFatherId);
    const otherRelations = db.relations.filter(r => r.source===id || r.target===id);
    const relationNotesSeen=new Set();
    const childRelation=/^(?:儿子|女儿|长子|次子|三子|幼子|子女)$/.test(n.relation)?n.relation:n.gender==='female'?'女儿':n.gender==='male'?'儿子':'子女';
    const relationNote=r=>{const note=r.notes||r.note;if(!note||relationNotesSeen.has(note))return '';relationNotesSeen.add(note);return `<p class="note">${esc(note)}</p>`;};
    let connection = n.originNote?esc(n.originNote):id===rootId?'本段家谱的起点':'本段单列的亲属，父家信息以所附经文为准';
    if(isRelatedFamily&&id===rootId)connection='本家族独立起点；与犹大家谱分开显示，具体联系见经文说明。';
    else if(parent) connection = n.originFatherId&&id===rootId?`${personButton(parent.id)}的${women.has(id)?'女儿':'儿子'} · 本段起点`:n.kind === 'group' ? `${personButton(parent.id)} → ${esc(n.relation)}（族源联系）` : n.lineageKind==='household'?`${personButton(parent.id)} → ${esc(displayName(n))}（家谱承接，非生父）`:n.lineageKind==='genealogy'?`${personButton(parent.id)} → ${esc(displayName(n))}（${esc(n.relation)}）`:`${personButton(parent.id)}的${esc(childRelation)}`;
    else if(n.lineageKind==='maternal'&&n.treeParentId)connection=`${personButton(n.treeParentId)}的${women.has(id)?'女儿':'儿子'}（母系连接）`;
    else if(n.treeParentId)connection=`${personButton(n.treeParentId)} → ${esc(displayName(n))}（${n.lineageKind==='tribal'?'支派／宗族归属':'经文关联'}，非直接父子）`;
    detail.innerHTML = `<button class="close-detail" aria-label="关闭人物详情">×</button><div class="eyebrow">${mainPath.has(id)?isRelatedFamily?'本家族起点':'主线人物':!treeIds.has(id)?'关联档案':'支系记录'}</div><h2>${esc(displayName(n))}${n.kind==='group'?'<span class="kind">族群</span>':''}</h2><div class="connection">${connection}</div>${refLinks(n.refs)}${n.lineageKind?`<p class="selected-fact">${esc(n.lineageLabel||n.relation)}</p>`:''}${(n.relation||'').includes('合读')?'<p class="selected-fact">此父女关系根据不同章节合读，详见下方说明。</p>':''}<div class="selection-path">${hasLineage?'经文家族路径：':''}${ancestors(id,false).map(i=>esc(byId.get(i).name)).join(' › ')}</div>`;
    const externalFamily=familyForPerson(id);
    if(externalFamily&&externalFamily.rootId!==relatedFamily?.rootId)detail.innerHTML+=`<div class="cross-page"><a href="${esc(treeURL(treeKey,id,externalFamily.rootId))}">单独查看${esc(externalFamily.title)} ↗</a></div>`;
    if(isRelatedFamily&&(mainTreeIds.has(id)||mainAnchorFor(id)))detail.innerHTML+=`<div class="cross-page"><a href="${esc(treeURL(treeKey,id))}">在犹大家谱查看 ↗</a></div>`;
    detail.scrollTop=0;
    if (otherRelations.length) detail.innerHTML += `<h3>亲属关系</h3>${otherRelations.map(r=>`<div class="event"><p>${esc(relationLabel(r,id))}：${personButton(r.source===id?r.target:r.source)}</p>${refLinks(r.refs)}${relationNote(r)}</div>`).join('')}`;
    if(n.tribeInfo){const t=n.tribeInfo;detail.innerHTML+=`<h3>支派与分地</h3><div class="event"><p class="tribe-label">${esc(t.ancestralLabel)}</p>${refLinks(t.ancestralRefs)}<p>${esc(t.landLabel)}</p>${refLinks(t.landRefs)}${t.note?`<p class="note">${esc(t.note)}</p>`:''}</div>`;}
    if(n.crossPageLinks?.length)detail.innerHTML+=`<div class="cross-page">${n.crossPageLinks.map(link=>`<a href="${esc(treeURL(link.tree,link.personId))}">${esc(link.label)} ↗</a>`).join('')}</div>`;
    if(n.interpretation){const g=n.interpretation;detail.innerHTML+=`<section class="interpretation-detail"><h3>拿单支系与马利亚（释经解释）</h3><p class="interpretation-path">${esc(g.path)}</p><p>${esc(g.summary)}</p>${refLinks(g.refs)}<p class="note">${esc(g.boundary)}</p><a class="interpretation-source" href="${esc(g.interpretationSource.url)}" target="_blank" rel="noopener noreferrer">${esc(g.interpretationSource.title)} ↗</a></section>`;}
    if(treeKey==='abraham-jacob'&&(id==='jacob'||n.tribeOrigin))detail.innerHTML+=`<div class="cross-page"><a href="${esc(treeURL('jacob-tribes',id))}">${id==='jacob'?'继续查看十二子与支派':'查看本支派与家族'} ↗</a></div>`;
    if(n.events?.length) detail.innerHTML += `<h3>经文记载</h3>${n.events.map(e=>`<div class="event"><p>${esc(e.text)}</p>${refLinks(e.refs)}</div>`).join('')}`;
    {
      const drawn=ordered(id),direct=[...drawn.filter(c=>byId.get(c).fatherId===id),...db.nodes.filter(c=>c.fatherId===id&&!drawn.includes(c.id)).map(c=>c.id)],maternal=drawn.filter(c=>byId.get(c).fatherId!==id&&byId.get(c).lineageKind==='maternal'),associated=drawn.filter(c=>byId.get(c).fatherId!==id&&byId.get(c).lineageKind!=='maternal');
      const buttons=ids=>`<div class="children">${ids.map(c=>`<button data-person="${c}">${esc(byId.get(c).name)}${byId.get(c).kind==='group'?' ◇':''}</button>`).join('')}</div>`;
      if(direct.length)detail.innerHTML+=`<h3>${n.kind==='group'?'相关族群':'本图所列下一代 / 族群支系'} · ${direct.length} 项</h3>${buttons(direct)}`;
      if(maternal.length)detail.innerHTML+=`<h3>经文明记的子女（母系） · ${maternal.length} 项</h3>${buttons(maternal)}`;
      if(associated.length)detail.innerHTML+=`<h3>其他家族与相关人物 · ${associated.length} 项</h3><p class="note">以下以虚线归入本页，连线性质见人物旁注；不能读作直接父子。</p>${buttons(associated)}`;
      if(drawn.length)detail.innerHTML+=`<button class="toggle" data-toggle="${id}">${expanded.has(id)?'收起':'展开'}${associated.length?'支系':'后代'}（共 ${descendants(id)} 项）</button>`;
      if(drawn.length&&treeIds.has(id)&&id!==viewRoot)detail.innerHTML+=`<button class="toggle focus-branch" data-scope="${id}">单看这支家谱</button>`;
    }
    if(n.notes) detail.innerHTML += `<p class="note">${esc(n.notes)}</p>`;
    if (!n.events?.length) detail.innerHTML += '<p class="note">本段仅有家谱或族源记载，没有补写经文未记载的生平。</p>';
    if(openMobile) detail.classList.add('open');
  }
  function labelContent(id){
    const n=byId.get(id);
    const mother=mothersByChild.get(id),ps=partnersOf(id),partners=ps.length===1?ps:[];
    const siblings=n.fatherId?children.get(n.fatherId).filter(c=>byId.get(c).fatherId===n.fatherId):[];
    const fatherPartners=n.fatherId?partnersOf(n.fatherId):[];
    const distinctMothers=new Set(siblings.map(child=>mothersByChild.get(child)).filter(Boolean));
    // A single named partner is already beside the father. Keep child-level
    // labels when the sources distinguish mothers or leave maternal gaps.
    const showMother=mother&&(id===viewRoot&&viewRoot!==rootId||n.lineageKind==='household'||fatherPartners.length!==1||fatherPartners[0].person.id!==mother||distinctMothers.size>1||siblings.some(c=>!mothersByChild.has(c)));
    const unknown=!mother&&n.kind!=='group'&&n.fatherId&&(fatherPartners.length>1||siblings.some(c=>mothersByChild.has(c)));
    return {name:labelName(n),tribe:n.tribeInfo?.ancestralLabel||'',lineage:n.lineageLabel||'',exegesis:n.treeInterpretation||'',ref:refShort(n.refs[0])+(n.kind==='group'?' · 族群':'')+(n.treeNote?' · '+n.treeNote:''),mother:showMother?labelName(byId.get(mother)):unknown?'经文未记名':'',motherId:mother,partners,closed:children.get(id).length&&!expanded.has(id)};
  }
  function textWidth(text,size,weight=400){
    if(!measureContext)return [...text].reduce((sum,c)=>sum+(c.charCodeAt(0)>255?size:size*.6),0);
    measureContext.font=`${weight} ${size}px ${labelFont}`;
    return measureContext.measureText(text).width;
  }
  function labelSize(id){
    const content=labelContent(id),more=content.closed?textWidth(` ＋${descendants(id)}`,10):0;
    const spouseLine=content.partners.length?' — '+partnerText(content.partners[0]):'';
    const w=Math.max(textWidth(content.name,14,mainPath.has(id)?600:400)+more+textWidth(spouseLine,12),textWidth(content.ref,10),textWidth(content.tribe,10),textWidth(content.lineage,10),textWidth(content.exegesis,10),textWidth(content.mother?'母：'+content.mother:'',11));
    return {width:Math.ceil(w)+12,height:18+14+(content.tribe?14:0)+(content.lineage?14:0)+(content.exegesis?14:0)+(content.mother?16:0)+6};
  }
  function tree(id) {
    const n=byId.get(id), cs=ordered(id), closed=cs.length&&!expanded.has(id), primary=mainPath.has(id), female=women.has(id);
    const color = female?'#477aae':primary?'#b64c40':'#6e8577';
    const kind = n.kind==='group';
    const {name:nodeName,ref:nodeRef,tribe,lineage,exegesis,mother,partners}=labelContent(id);
    return {id,name:n.name,collapsed:!!closed,children:cs.map(tree),symbol:kind?'diamond':'circle',symbolSize:(primary?8:7)/labelScale,
      itemStyle:{color:closed?color:'#fff',borderColor:color,borderWidth:id===selected?3:1.6},
      lineStyle:{opacity:0},
      label:{
        color,fontFamily:labelFont,fontSize:14/labelScale,lineHeight:18/labelScale,
        position:'top',distance:4/labelScale,
        align:'center',verticalAlign:'bottom',
        backgroundColor:'#fff',padding:[3/labelScale,5/labelScale],borderRadius:3/labelScale,
        formatter:()=>`{name|${nodeName}}${closed?` {more|＋${descendants(id)}}`:''}${partners.length?' {wife|— }{wife|'+partnerText(partners[0])+'}':''}${tribe?'\n{tribe|'+tribe+'}':''}\n{ref|${nodeRef}}${lineage?'\n{lineage|'+lineage+'}':''}${exegesis?'\n{exegesis|'+exegesis+'}':''}${mother?'\n{ref|母：}{mother|'+mother+'}':''}`,
        rich:{
          name:{fontSize:14/labelScale,fontWeight:primary?600:400,lineHeight:18/labelScale},
          ref:{fontSize:10/labelScale,color:'#8a978c',lineHeight:14/labelScale},
          wife:{fontSize:12/labelScale,color:'#477aae',lineHeight:18/labelScale},
          mother:{fontSize:11/labelScale,color:'#5681a1',lineHeight:16/labelScale},
          tribe:{fontSize:10/labelScale,color:'#9a713d',lineHeight:14/labelScale},
          lineage:{fontSize:10/labelScale,color:n.lineageKind==='maternal'?'#5681a1':'#916b3e',lineHeight:14/labelScale},
          exegesis:{fontSize:10/labelScale,color:'#856a38',lineHeight:14/labelScale},
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
    const edges=geometry.edges.map(edge=>{
      const n=byId.get(edge.childId),primary=mainPath.has(n.id),female=women.has(n.id),kind=n.kind==='group';
      return {id:'family-edge-'+edge.childId,type:'polyline',silent:true,z:0,
        shape:{points:edge.points.map(point=>point.map(value=>value/labelScale))},
        style:{fill:null,stroke:n.lineageKind==='maternal'?'#7296b6':n.lineageKind?'#a17a48':primary?'#b64c40':female?'#7296b6':kind?'#a4b3a8':'#bfcbc1',lineWidth:(primary?2:1.1)/labelScale,lineDash:kind||n.lineageKind?[5/labelScale,4/labelScale]:null}};
    });
    chart.setOption({animation:false,tooltip:{show:false},graphic:{elements:edges},series:[{id:'genealogy-tree-preview',type:'tree',data:[tree(viewRoot)],orient:direction,
      left:0,right:0,top:0,bottom:0,
      edgeShape:'curve',edgeForkPosition:'50%',initialTreeDepth:-1,expandAndCollapse:false,roam:false,
      emphasis:{focus:'none'},animationDuration:0,animationDurationUpdate:0,silent:false,
      lineStyle:{opacity:0}}]}, {notMerge:true});
    decorateNodes();
  }
  function decorateNodes() {
    const textNodes=[...document.querySelectorAll('#chart svg text')];
    // ECharts can emit "finished" more than once. Rebuild annotations and
    // identify the name font so a mother's repeated name is never a node.
    for(const text of textNodes){for(const attr of ['data-person','data-spouse','data-expand','role','tabindex','aria-label'])text.removeAttribute(attr);}
    for(const id of visibleIds) {
      const text=textNodes.find(t=>!t.hasAttribute('data-person')&&Math.abs(parseFloat(t.style.fontSize)-14/labelScale)<.1&&t.textContent===labelName(byId.get(id)));
      if(text) {
        text.setAttribute('data-person',id);text.setAttribute('role','button');text.setAttribute('tabindex','0');text.setAttribute('aria-label',`查看${displayName(byId.get(id))}的经文与亲属`);
        if(children.get(id).length&&!expanded.has(id)){
          const start=textNodes.indexOf(text), more=textNodes.slice(start+1,start+4).find(t=>t.textContent===`＋${descendants(id)}`);
          if(more){more.setAttribute('data-expand',id);more.setAttribute('role','button');more.setAttribute('tabindex','0');more.setAttribute('aria-label',`展开${displayName(byId.get(id))}的后代`);more.style.cursor='pointer';}
        }
      }
    }
    for(const id of visibleIds){
      const start=textNodes.findIndex(t=>t.getAttribute('data-person')===id);if(start<0)continue;
      const next=textNodes.findIndex((t,i)=>i>start&&t.hasAttribute('data-person')),segment=textNodes.slice(start,next<0?textNodes.length:next);
      for(const p of labelContent(id).partners){const text=segment.find(t=>t.textContent===partnerText(p));if(text)markRelative(text,p.person.id);}
      const content=labelContent(id),mother=content.motherId;if(mother&&content.mother){const text=segment.find(t=>t.textContent===content.mother);if(text)markRelative(text,mother);}
    }
  }
  function markRelative(text,id){text.setAttribute('data-spouse',id);text.setAttribute('role','button');text.setAttribute('tabindex','0');text.setAttribute('aria-label',`查看${displayName(byId.get(id))}的经文与亲属`);}
  function render(fit=false) {
    if(viewport.clientWidth===0||viewport.clientHeight===0)return;
    // Give every expanded family the same separation, including deeper
    // generations and independently selected related families. Leaf-only
    // siblings keep their compact gap so the whole chart stays manageable.
    const hasOpenChildren=id=>expanded.has(id)&&children.get(id).length>0;
    geometry=window.CompactTreeLayout.layout({rootId:viewRoot,children:id=>expanded.has(id)?ordered(id):[],box:labelSize,direction,siblingGap:14,generationGap:direction==='TB'?56:34,compactMainRows:false,
      branchGap:(_parent,left,right)=>(hasOpenChildren(left)||hasOpenChildren(right))?(direction==='TB'?56:34):14,
      preferredChild:id=>mainPath.has(id)?ordered(id).find(child=>mainPath.has(child)):null});
    visibleIds=[...geometry.positions.keys()];
    const nominalWidth=geometry.width,nominalHeight=geometry.height;
    if(fit) {
      const r=viewport.getBoundingClientRect();
      scale=Math.max(.5,Math.min(1.15,(r.width-32)/nominalWidth,(r.height-24)/nominalHeight));
      labelScale=scale;
    }
    // Keep the labels readable while using each label's own measured space.
    width=Math.ceil(nominalWidth/labelScale);
    height=Math.ceil(nominalHeight/labelScale);
    stage.style.width=width+'px';stage.style.height=height+'px';chart.clear();chart.resize({width,height});
    if(fit){
      const r=viewport.getBoundingClientRect();
      tx=direction==='TB'?(r.width-width*scale)/2:Math.max(12,(r.width-width*scale)/2);
      ty=Math.max(12,(r.height-height*scale)/2);
    }
    drawLabels();transform();
    document.getElementById('count').textContent=viewRoot===rootId?`显示 ${visibleIds.length} / ${treeIds.size} 条目${isRelatedFamily?' · 相关家族独立图':relatedOnly.length?` · 另有 ${relatedOnly.length} 条关联档案`:''}`:`当前支系 ${visibleIds.length} / ${descendants(viewRoot)+1} 条目 · 全图 ${treeIds.size} 条目`;
    const branchScope=document.getElementById('branchScope');branchScope.hidden=viewRoot===rootId;branchScope.querySelector('span').textContent='当前支系：'+displayName(byId.get(viewRoot));
    ['mainline','overview','all'].forEach(mode=>document.getElementById(mode).classList.toggle('active',mode===lastMode));
    if(fit)focusNode(selected,true);
  }
  function reveal(id) { ancestors(id).slice(0,-1).forEach(p=>expanded.add(p)); }
  function focusNode(id,center=false) {
    // SVG text is used only to keep the selected visible label in the viewport.
    requestAnimationFrame(()=>{
      const text=document.querySelector(`#chart svg text[data-person="${id}"]`)||document.querySelector(`#chart svg text[data-spouse="${id}"]`)||document.querySelector(`#chart svg text[data-person="${viewRoot}"]`);
      if(!text) return;
      const texts=[...document.querySelectorAll('#chart svg text')],start=texts.indexOf(text);
      let parts=[text];
      if(text.hasAttribute('data-person')){const next=texts.findIndex((t,i)=>i>start&&t.hasAttribute('data-person'));parts=texts.slice(start,next<0?texts.length:next);}
      const boxes=parts.map(t=>t.getBoundingClientRect());
      const r={left:Math.min(...boxes.map(b=>b.left)),right:Math.max(...boxes.map(b=>b.right)),top:Math.min(...boxes.map(b=>b.top)),bottom:Math.max(...boxes.map(b=>b.bottom))};
      r.width=r.right-r.left;r.height=r.bottom-r.top;
      const v=viewport.getBoundingClientRect();
      if(center||r.left<v.left+15||r.right>v.right-15)tx+=v.left+v.width*(direction==='TB' ? .5 : .42)-(r.left+r.width/2);
      if(center||r.top<v.top+15||r.bottom>v.bottom-15)ty+=v.top+v.height*(direction==='TB'&&children.get(id).length ? .32 : .5)-(r.top+r.height/2);
      transform();
    });
  }
  function select(id, focus=false) {
    const anchor=treeIds.has(id)?id:db.relations.filter(r=>['spouse','concubine'].includes(r.type)&&(r.source===id||r.target===id)||r.type==='mother-child'&&r.source===id).map(r=>r.source===id?r.target:r.source).find(p=>treeIds.has(p));
    if(!anchor){
      if(isRelatedFamily&&(mainTreeIds.has(id)||mainAnchorFor(id))){location.href=treeURL(treeKey,id);return;}
      const target=familyForPerson(id);if(target&&target.rootId!==relatedFamily?.rootId){location.href=treeURL(treeKey,id,target.rootId);return;}
    }
    if(anchor&&!ancestors(anchor).includes(viewRoot)){viewRoot=rootId;updateScopeURL();}
    if(anchor)reveal(anchor);showDetails(id);lastMode='';render(false);if(focus)focusNode(id,true);
  }
  function toggle(id,openMobile=true) {
    if(expanded.has(id))expanded.delete(id);else expanded.add(id);
    lastMode='';render(false);showDetails(id,openMobile);if(!openMobile)detail.classList.remove('open');focusNode(id);
  }
  chart.on('click',p=>{if(p.data?.id)select(p.data.id);});
  chart.on('finished',decorateNodes);
  document.getElementById('chart').addEventListener('click',e=>{const b=e.target.closest('[data-expand]'),s=e.target.closest('[data-spouse]');if(b||s){e.stopImmediatePropagation();e.preventDefault();if(b)toggle(b.dataset.expand,false);else select(s.dataset.spouse);}},true);
  document.getElementById('chart').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){if(e.target.dataset.expand){e.preventDefault();toggle(e.target.dataset.expand,false);}else if(e.target.dataset.spouse){e.preventDefault();select(e.target.dataset.spouse);}else if(e.target.dataset.person){e.preventDefault();select(e.target.dataset.person);}}});
  function updateScopeURL(){const url=new URL(location.href);if(viewRoot===rootId)url.searchParams.delete('family');else url.searchParams.set('family',viewRoot);history.replaceState({},'',url);}
  function isolate(id){viewRoot=id;db.nodes.forEach(n=>expanded.add(n.id));lastMode='all';showDetails(id,false);detail.classList.remove('open');updateScopeURL();render(true);}
  detail.addEventListener('click',e=>{const p=e.target.closest('[data-person]'),t=e.target.closest('[data-toggle]'),s=e.target.closest('[data-scope]');if(p)select(p.dataset.person,true);if(t)toggle(t.dataset.toggle);if(s)isolate(s.dataset.scope);if(e.target.closest('.close-detail'))detail.classList.remove('open');});
  document.getElementById('fullTree').addEventListener('click',()=>isolate(rootId));
  ['mainline','overview','all'].forEach(mode=>document.getElementById(mode).addEventListener('click',()=>{
    expanded.clear();
    if(mode==='mainline')db.mainPath.forEach(id=>expanded.add(id));
    if(mode==='mainline'&&!mainPath.has(viewRoot))expanded.add(viewRoot);
    if(mode==='overview')page.overview.forEach(id=>expanded.add(id));
    if(mode==='overview')expanded.add(viewRoot);
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
    results.innerHTML=found.length?found.map(n=>`<button data-person="${n.id}">${esc(displayName(n))}<small>${n.fatherId?esc(byId.get(n.fatherId).name)+(n.kind==='group'?'支系':'之下'):n.id===rootId?'起点':treeIds.has(n.id)?'图中关联（见旁注）':'关联亲属'} · ${esc(refShort(n.refs[0]))}</small></button>`).join(''):'<p>本段没有此姓名，可换用人物别名或切换家谱分段。</p>';
  });
  results.addEventListener('click',e=>{const b=e.target.closest('[data-person]');if(b){select(b.dataset.person,true);search.value='';results.innerHTML='';}});
  document.addEventListener('click',e=>{if(!e.target.closest('.search'))results.innerHTML='';});
  search.addEventListener('keydown',e=>{if(e.key==='Escape'){results.innerHTML='';search.value='';}});
  const sourcePanel=document.getElementById('sources');
  const mappingRows=(db.tribeMapping||[]).map(row=>{const n=byId.get(row.personId),m=byId.get(row.motherId),t=n.tribeInfo;return `<tr><td>${personButton(n.id)}<small>第${n.sonOrder}子</small></td><td>${personButton(m.id)}${refLinks(db.relations.find(r=>r.type==='mother-child'&&r.source===m.id&&r.target===n.id)?.refs||[])}</td><td><strong>${esc(t.ancestralLabel)}</strong><p>${esc(t.landLabel)}</p>${refLinks(t.landRefs)}</td></tr>`;}).join('');
  const mapping=mappingRows?`<strong id="tribeMapping">十二子与支派对照</strong><p>家谱按雅各十二子列名，包含利未与约瑟；分地时约瑟后裔列玛拿西、以法莲两支，利未人另得城邑与郊野。下表依十二子出生次序排列。</p>${refLinks(['创世记49:28','创世记48:5–6','约书亚记14:3–4'])}<div class="tribe-table-wrap"><table class="tribe-table"><thead><tr><th>十二子</th><th>生母</th><th>支派与分地</th></tr></thead><tbody>${mappingRows}</tbody></table></div>`:'';
  const lineageExplanation=(db.lineageExplanation||[]).length?'<strong>家谱差异与连线说明</strong>'+db.lineageExplanation.map(e=>`<p>${esc(e.text)}</p>${refLinks(e.refs)}`).join(''):'';
  const coverage=(db.imageCoverage||[]).length?'<details class="coverage"><summary>两张原图的内容核对与调整</summary>'+db.imageCoverage.map(item=>`<div class="event"><p><strong>${esc(item.section)}</strong><span class="coverage-state">${({covered:'已补入',corrected:'已按经文核对调整',uncertain:'保留疑问说明'})[item.status]||'核对说明'}</span></p><p>${esc(item.note)}</p>${refLinks(item.refs)}</div>`).join('')+'</details>':'';
  sourcePanel.innerHTML=`<button class="close-sources" type="button">关闭说明 ×</button>${mapping}${lineageExplanation}<strong>收录范围</strong><p>${esc(db.scope)}</p>${coverage}<p>一位具名妻妾标在父亲名字旁；有多位妻妾时，在各子女旁标记母亲。同胞按母亲分组，不表示出生次序。未知母亲不补造姓名；只记一位具名妻妾不表示此人一生只有这一位女性。◇与灰色虚线表示族源。${isAdam?'两个以诺、两个拉麦分别建档，拿玛没有被认定为挪亚之妻。':''}</p>${(db.tribeExplanation||[]).length?'<strong>十二子与支派</strong>'+db.tribeExplanation.map(e=>`<p>${esc(e.text)}</p>${refLinks(e.refs)}`).join(''):''}${db.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`).join('')}`;
  sourcePanel.querySelector('.close-sources').onclick=()=>{sourcePanel.hidden=true;};
  document.getElementById('sourcesToggle').addEventListener('click',()=>{sourcePanel.hidden=!sourcePanel.hidden;if(!sourcePanel.hidden)sourcePanel.scrollIntoView({behavior:'smooth',block:'nearest'});});
  const tribesToggle=document.getElementById('tribesToggle');
  tribesToggle.hidden=!mappingRows;
  tribesToggle.addEventListener('click',()=>{sourcePanel.hidden=false;sourcePanel.scrollIntoView({behavior:'smooth',block:'start'});});
  sourcePanel.addEventListener('click',e=>{const button=e.target.closest('[data-person]');if(button){sourcePanel.hidden=true;select(button.dataset.person,true);viewport.scrollIntoView({behavior:'smooth',block:'center'});}});
  let resizeTimer,lastSize='';
  if('ResizeObserver' in window)new ResizeObserver(()=>{const size=viewport.clientWidth+':'+viewport.clientHeight;if(size===lastSize)return;lastSize=size;render(true);}).observe(viewport);
  else window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>render(true),150);});
  const baseFocus=isRelatedFamily?[rootId]:db.quickFocus||page.focus||(isJudah?[rootId]:treeKey==='abraham-jacob'?['abraham','ishmael','isaac','esau','jacob','joseph_patriarch']:treeKey==='noah-abraham'?['noah','terah','nahor_brother','haran_person','laban']:[]);
  const focusIds=[...new Set(treeKey==='noah-abraham'?['noah','ham','shem','japheth',...baseFocus]:baseFocus)];
  const quickFocus=document.getElementById('quickFocus');
  if(focusIds.length){quickFocus.hidden=false;quickFocus.innerHTML='<span>定位</span>'+focusIds.filter(id=>byId.has(id)).map(id=>`<button data-focus="${id}">${esc(labelName(byId.get(id)))}</button>`).join('');quickFocus.addEventListener('click',e=>{const b=e.target.closest('[data-focus]');if(b)select(b.dataset.focus,true);});}
  const initialId=byId.has(params.get('person'))?params.get('person'):viewRoot;
  showDetails(initialId,false);render(true);
  if(window.parent!==window)window.parent.postMessage({type:'bible-family-tree',tree:treeKey,person:params.get('person')||'',related:relatedFamily?.rootId||''},location.origin);
})();
