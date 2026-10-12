/* Interactive map built exclusively from the maintained people database. */
(() => {
  const host = document.getElementById('peopleMap');
  const status = document.getElementById('mapStatus');
  const ns = 'http://www.w3.org/2000/svg';
  let svg, box, original, selected, points = new Map(), gesture;
  const node = (tag, attrs, text) => {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs || {}).forEach(([k,v]) => el.setAttribute(k,v));
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const update = () => svg.setAttribute('viewBox', box.join(' '));
  function zoom(factor) {
    const width = Math.max(300, Math.min(original[2] * 2, box[2] * factor));
    const height = box[3] * width / box[2];
    box = [box[0] + (box[2]-width)/2, box[1] + (box[3]-height)/2, width, height]; update();
  }
  window.renderPeopleMap = function (people) {
    points.clear(); gesture = null;
    const groups = [...new Set(people.map(p => p.era))];
    const positions = new Map();
    groups.forEach((era,col) => people.filter(p=>p.era===era).forEach((p,row)=>positions.set(p.id,{x:40+col*230,y:80+row*72})));
    const height = Math.max(420,...groups.map(era=>140+people.filter(p=>p.era===era).length*72));
    original = [0,0,Math.max(740,groups.length*230+40),height];
    // Start at a readable size; the entire chart remains available by panning.
    box = [0,0,740,520];
    svg = node('svg',{role:'group','aria-label':'圣经人物关系导图',preserveAspectRatio:'xMidYMid meet'});
    host.replaceChildren(svg); update();
    if (!people.length) { status.textContent='没有匹配人物，请调整上方筛选。'; return; }
    const edges = node('g',{'class':'mapEdges'}); svg.append(edges);
    const seen = new Set(); let count = 0;
    people.forEach(p => (p.relations||[]).forEach(r => {
      const target = findPersonByName(r.name);
      if (!target || target.id===p.id || !positions.has(target.id)) return;
      const key=[p.id,target.id].sort().join('|'); if(seen.has(key))return; seen.add(key); count++;
      const a=positions.get(p.id),b=positions.get(target.id);
      const x1=a.x+95,y1=a.y+25,x2=b.x+95,y2=b.y+25;
      const path=node('path',{d:`M ${x1} ${y1} C ${(x1+x2)/2} ${y1}, ${(x1+x2)/2} ${y2}, ${x2} ${y2}`,'data-from':p.id,'data-to':target.id});
      path.append(node('title',{},`${p.name} → ${target.name}：${r.type}`)); edges.append(path);
    }));
    groups.forEach((era,col)=>svg.append(node('text',{x:40+col*230,y:42,'class':'mapEra'},era)));
    people.forEach(p=>{
      const at=positions.get(p.id);
      const g=node('g',{transform:`translate(${at.x},${at.y})`,role:'button',tabindex:'0','aria-label':`查看${p.name}的经卷和经历`,'data-map-person':p.id,'class':`mapPerson ${p.testament==='新约'?'mapNT':'mapOT'}`});
      g.append(node('rect',{width:190,height:50,rx:12}));
      const text=node('text',{x:95,y:30,'text-anchor':'middle'} ,p.name);
      if(p.name.length>12){text.setAttribute('textLength','170');text.setAttribute('lengthAdjust','spacingAndGlyphs');}
      g.append(text); g.append(node('title',{},`${p.name} · ${(p.roles||[]).join(' / ')}`));
      g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault(); choose(p.id);}});
      svg.append(g);
    });
    status.textContent=`${people.length} 位人物 · ${count} 组关系 · 拖动 / 双指缩放，点击人物查看资料。连线来自现有资料，并非完整家谱。`;
    svg.addEventListener('click',e=>{if(gesture?.moved)return;const g=e.target.closest('[data-map-person]');if(g)choose(g.dataset.mapPerson);});
    svg.addEventListener('pointerdown',e=>{
      svg.setPointerCapture(e.pointerId); points.set(e.pointerId,{x:e.clientX,y:e.clientY});
      gesture={moved:false,start:[e.clientX,e.clientY]};
    });
    svg.addEventListener('pointermove',e=>{
      if(!points.has(e.pointerId))return;
      const old=points.get(e.pointerId), next={x:e.clientX,y:e.clientY};
      if(Math.hypot(e.clientX-gesture.start[0],e.clientY-gesture.start[1])>5)gesture.moved=true;
      if(points.size===2){
        const other=[...points.entries()].find(([id])=>id!==e.pointerId)[1];
        const before=Math.hypot(old.x-other.x,old.y-other.y),after=Math.hypot(next.x-other.x,next.y-other.y);
        if(before>0&&after>0)zoom(before/after);
      } else {
        const rect=svg.getBoundingClientRect(), scale=Math.max(box[2]/rect.width,box[3]/rect.height);
        box[0]-=(next.x-old.x)*scale;box[1]-=(next.y-old.y)*scale;update();
      }
      points.set(e.pointerId,next);
    });
    const release=e=>points.delete(e.pointerId);
    svg.addEventListener('pointerup',release);svg.addEventListener('pointercancel',release);
    highlight(selected);
  };
  function highlight(id){
    if(!svg)return;
    svg.querySelectorAll('[data-map-person]').forEach(g=>g.classList.toggle('mapSelected',g.dataset.mapPerson===id));
    svg.querySelectorAll('path').forEach(p=>p.classList.toggle('mapLinked',p.dataset.from===id||p.dataset.to===id));
  }
  function choose(id){selected=id;highlight(id);openPerson(id);}
  document.getElementById('mapZoomIn').onclick=()=>svg&&zoom(.8);
  document.getElementById('mapZoomOut').onclick=()=>svg&&zoom(1.25);
  document.getElementById('mapReset').onclick=()=>{if(svg){box=[0,0,740,520];update();}};
  document.getElementById('mapFit').onclick=()=>{if(svg){box=[...original];update();}};
})();
