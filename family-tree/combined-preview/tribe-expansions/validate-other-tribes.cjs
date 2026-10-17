'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const file=JSON.parse(fs.readFileSync(path.join(__dirname,'other-tribes.json'),'utf8'));
const base=JSON.parse(fs.readFileSync(path.join(__dirname,'../jacob-tribes.json'),'utf8'));
const baseById=new Map(base.nodes.map(n=>[n.id,n]));
let checks=0;
const check=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
function db(key){return file.branches[key];}
function byId(key){return new Map([...base.nodes,...db(key).nodes].map(n=>[n.id,n]));}
function children(key,id){return db(key).nodes.filter(n=>n.fatherId===id).map(n=>n.name).sort();}
function list(key,id,names){assert.deepEqual(children(key,id),names.split(' ').sort());}
check('十个支派分支及根 ID',()=>{
  assert.equal(Object.keys(file.branches).length,10);
  for(const root of ['reuben','simeon','issachar','naphtali','gad','asher','zebulun','dan','joseph_patriarch','benjamin']){
    const key='tribe-'+(root==='joseph_patriarch'?'joseph':root);
    assert.equal(db(key).rootId,root);
  }
});
check('各分支新增 ID 唯一、字段完整、经文格式及来源链接',()=>{
  for(const [key,b] of Object.entries(file.branches)){
    const seen=new Set();assert(b.imageCoverage.length>0);assert(b.sources.length>0);
    for(const n of b.nodes){
      assert(!seen.has(n.id),key+': 重复 '+n.id);seen.add(n.id);
      assert.equal(n.kind,'person');assert(['male','female'].includes(n.gender));
      assert(n.name&&Array.isArray(n.events)&&typeof n.notes==='string');
      assert(n.refs.length>0,key+': '+n.id+' 无经文');
      for(const ref of n.refs)assert(/^[^\d]+\d+:\d+(?:[–-]\d+)?$/.test(ref),ref);
    }
    for(const source of b.sources)assert(/^https:\/\/cnbible\.com\/cus\/[a-z0-9_]+\/\d+\.htm$/.test(source.url));
  }
});
check('真实父亲和绘图关联父节点均可解析且无环',()=>{
  for(const [key,b]of Object.entries(file.branches)){
    const map=byId(key);
    for(const n of b.nodes){
      if(n.fatherId)assert(map.has(n.fatherId),key+': 缺父 '+n.id);
      if(n.treeParentId)assert(map.has(n.treeParentId),key+': 缺关联 '+n.id);
      if(!n.fatherId&&!n.relatedOnly){assert(n.treeParentId);assert(['tribal','context','maternal'].includes(n.lineageKind));assert(n.lineageLabel);}
      for(const mode of ['father','tree']){
        let current=n;const seen=new Set();
        while(current){assert(!seen.has(current.id),key+': '+mode+' 环 '+n.id);seen.add(current.id);current=map.get(mode==='father'?current.fatherId:(current.treeParentId||current.fatherId));}
      }
    }
    for(const r of b.relations){assert(map.has(r.source),key+': '+r.source);assert(map.has(r.target),key+': '+r.target);assert(r.refs.length);}
    for(const id of b.quickFocus)assert(map.has(id));
    for(const id of b.mainPath)assert(map.has(id));
  }
});
check('流便法路家、约珥家和三组独立父家',()=>{
  list('tribe-reuben','eliab_pallu','尼母利 大坍 亚比兰');
  const m=byId('tribe-reuben');assert.equal(m.get('reuben_备拉').fatherId,'reuben_巴力');assert.equal(m.get('reuben_比拉').fatherId,'reuben_亚撒');
  assert.equal(m.get('reuben_以利蓿').fatherId,'reuben_示丢珥');assert.equal(m.get('reuben_沙母亚').fatherId,'reuben_撒刻');assert.equal(m.get('reuben_安').fatherId,'reuben_比勒');
});
check('西缅扫罗六代、代上4族长父系及以示四子',()=>{
  const m=byId('tribe-simeon');let p='shaul_simeon';for(const name of '沙龙 米比衫 米施玛 哈母利 撒刻 示每'.split(' ')){assert.equal(m.get('simeon_'+name).fatherId,p);p='simeon_'+name;}
  list('tribe-simeon','simeon_以示','毗拉提 尼利雅 利法雅 乌薛');assert.equal(m.get('simeon_细撒').fatherId,'simeon_示非');assert.equal(m.get('simeon_耶户').fatherId,'simeon_约示比');
});
check('以萨迦代上7四子、同名士师家不并入创46家',()=>{
  list('tribe-issachar','tola_issachar','乌西 利法雅 耶勒 雅买 易伯散 示母利');list('tribe-issachar','issachar_伊斯拉希','米迦勒 俄巴底亚 约珥 伊示雅');
  const m=byId('tribe-issachar');assert.equal(m.get('issachar_judge_陀拉').fatherId,'issachar_judge_普瓦');assert.equal(m.get('issachar_judge_朵多').fatherId,null);
});
check('各支民1、民13、民34父子正确且无把父亲连为始祖亲子',()=>{
  const expected={
    'tribe-reuben':[['以利蓿','示丢珥'],['沙母亚','撒刻']],
    'tribe-simeon':[['示路蔑','苏利沙代'],['沙法','何利'],['示母利','亚米忽']],
    'tribe-issachar':[['拿坦业','苏押'],['以迦','约色'],['帕铁','阿散']],
    'tribe-naphtali':[['亚希拉','以南'],['拿比','缚西'],['比大黑','亚米忽']],
    'tribe-gad':[['以利雅萨','丢珥'],['臼利','玛基']],
    'tribe-asher':[['帕结','俄兰'],['西帖','米迦勒'],['亚希忽','示罗米']],
    'tribe-zebulun':[['以利押','希伦'],['迦叠','梭底'],['以利撒番','帕纳']],
    'tribe-dan':[['亚希以谢','亚米沙代'],['亚米利','基玛利'],['布基','约利']],
    'tribe-joseph':[['迦玛列','比大蓿'],['迦底','稣西'],['汉聂','以弗'],['基母利','拾弗但']],
    'tribe-benjamin':[['亚比但','基多尼'],['帕提','拉孚'],['以利达','基斯伦']]
  };
  for(const[key,pairs]of Object.entries(expected)){const m=byId(key);for(const[child,father]of pairs){const n=[...m.values()].find(n=>n.name===child&&m.get(n.fatherId)?.name===father);assert(n,key+': '+father+'→'+child);assert.notEqual(n.fatherId,db(key).rootId);}}
});
check('亚设代上7:30–39所有家系、女儿及不确定父家',()=>{
  list('tribe-asher','asher_heber_雅弗勒','巴萨 宾哈 亚施法');list('tribe-asher','asher_heber_朔默','亚希 罗迦 耶户巴 亚兰');
  list('tribe-asher','asher_希连_琐法','书亚 哈尼弗 书阿勒 比利 音拉 比悉 河得 珊玛 施沙 益兰 比拉');
  list('tribe-asher','asher_益帖','耶孚尼 毗斯巴 亚拉');list('tribe-asher','asher_乌拉','亚拉 汉尼业 利写');
  const m=byId('tribe-asher');assert.equal(m.get('asher_书雅').gender,'female');assert.equal(m.get('asher_希连').fatherId,null);assert.equal(m.get('asher_益帖').fatherId,null);
});
check('西布伦以比赞不确定族籍、但参孙生母与大利拉边界',()=>{
  const z=byId('tribe-zebulun');assert.equal(z.get('zebulun_ibzan').lineageKind,'context');assert.equal(z.get('zebulun_elon_judge').fatherId,null);
  const dan=byId('tribe-dan'),rels=db('tribe-dan').relations;assert.equal(dan.get('dan_delilah').fatherId,null);assert(!rels.some(r=>r.type==='spouse'&&[r.source,r.target].includes('dan_delilah')));assert(rels.some(r=>r.type==='mother-child'&&r.source==='dan_manoah_wife'&&r.target==='dan_samson'));
});
check('西罗非哈五女、母系哈摩利吉三子、基甸父家与具名子',()=>{
  const key='tribe-joseph',m=byId(key);assert.equal(m.get('gilead_zelophehad').fatherId,'gilead_hepher');list(key,'gilead_zelophehad','玛拉 挪阿 曷拉 密迦 得撒');
  for(const name of '伊施荷 亚比以谢 玛拉'.split(' ')){const n=m.get('hammoleketh_'+name);assert.equal(n.fatherId,null);assert.equal(n.lineageKind,'maternal');assert.equal(n.treeParentId,'machir_hammoleketh');}
  assert.equal(m.get('gideon').fatherId,'manasseh_joash_gideon');assert.equal(m.get('manasseh_joash_gideon').fatherId,null);list(key,'gideon','益帖 亚比米勒 约坦');
});
check('睚珥犹大父系与玛吉女儿母系、耶弗他不冒接古代基列',()=>{
  const m=byId('tribe-joseph');assert.equal(m.get('jair_segub').fatherId,'segub');assert.equal(m.get('segub').fatherId,'hezron_perez');assert.equal(m.get('hezron_perez').lineageKind,'context');assert.equal(m.get('machir_unnamed_daughter').fatherId,'manasseh_machir');
  assert(db('tribe-joseph').relations.some(r=>r.type==='mother-child'&&r.source==='machir_unnamed_daughter'&&r.target==='segub'));
  assert.equal(m.get('gilead_jephthah_father').fatherId,null);assert.equal(m.get('jephthah').fatherId,'gilead_jephthah_father');assert.notEqual(m.get('jephthah').fatherId,'manasseh_gilead');
});
check('以法莲重复他哈与书提拉不合并、约书亚只一条记录',()=>{
  const m=byId('tribe-joseph');assert.notEqual(m.get('ephraim_tahath_1').fatherId,m.get('ephraim_tahath_2').fatherId);assert.equal(m.get('ephraim_joshua_约书亚').fatherId,'ephraim_joshua_嫩');
  assert.equal(db('tribe-joseph').nodes.filter(n=>n.name==='约书亚').length,1);assert.equal(m.get('asenath').fatherId,'potiphera_asenath_father');assert(m.get('asenath').relatedOnly);
});
check('便雅悯原创46十人未变；民26亚勒/乃幔为另谱关系',()=>{
  const b=db('tribe-benjamin');assert(!b.nodes.some(n=>['naaman_benjamin','ard_benjamin'].includes(n.id)));assert.equal(b.relations.filter(r=>r.type==='genealogy-variant'&&r.source==='bela_benjamin').length,2);
  list('tribe-benjamin','becher_benjamin','细米拉 约阿施 以利以谢 以利约乃 暗利 耶利摩 亚比雅 亚拿突 亚拉篾');list('tribe-benjamin','ben_bilhan','耶乌施 便雅悯 以忽 基拿拿 细坦 他施 亚希沙哈');
});
check('便雅悯沙哈连多妻母系与同名妻/儿子不混',()=>{
  const b=db('tribe-benjamin');const rel=b.relations.filter(r=>r.type==='mother-child');assert.equal(rel.filter(r=>r.source==='ben_hodesh').length,7);assert.equal(rel.filter(r=>r.source==='ben_hushim_wife').length,2);assert.equal(rel.filter(r=>r.source==='ben_baara').length,0);
  const m=byId('tribe-benjamin');assert.equal(m.get('ben_hushim_wife').gender,'female');assert.equal(m.get('ben_ir_户品').gender,'male');
});
check('扫罗祖系差异、妻妾、生母、两个米非波设及完整后家',()=>{
  const key='tribe-benjamin',b=db(key),m=byId(key);assert.equal(m.get('saul_kish').fatherId,'saul_anc_亚别');assert.equal(m.get('ner_abner_father').fatherId,'saul_anc_亚别');assert.equal(m.get('abner').fatherId,'ner_abner_father');assert(b.relations.some(r=>r.type==='genealogy-variant'&&r.source==='ben_jeiel_尼珥'&&r.target==='saul_kish'));
  assert(!b.relations.some(r=>r.type==='mother-child'&&r.source==='saul_ahinoam'));assert.equal(b.relations.filter(r=>r.type==='mother-child'&&r.source==='rizpah').length,2);
  assert.equal(m.get('saul_mephibosheth').fatherId,'saul_king');assert.equal(m.get('mephibosheth_jonathan').fatherId,'jonathan');list(key,'saul_desc_亚悉','亚斯利干 波基路 以实玛利 示亚利雅 俄巴底雅 哈难');list(key,'saul_eshek','乌兰 耶乌施 以利法列');
});
check('以斯帖生父/养父分明，保罗仅支派归属，名字相同不自动接扫罗家',()=>{
  const b=db('tribe-benjamin'),m=byId('tribe-benjamin');assert.equal(m.get('esther').fatherId,'esther_abihail');assert(b.relations.some(r=>r.type==='adoption'&&r.source==='esther_末底改'&&r.target==='esther'));
  assert.equal(m.get('paul_apostle').fatherId,null);assert.equal(m.get('paul_apostle').lineageKind,'tribal');assert.notEqual(m.get('esther_基士').id,m.get('saul_kish').id);
});
console.log('\n'+checks+' 组检查通过；新增/覆盖 '+Object.values(file.branches).reduce((sum,b)=>sum+b.nodes.length,0)+' 条。');
