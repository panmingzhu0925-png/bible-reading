/* Preview-only genealogy facts. Every relation belongs to a named passage/view. */
(() => {
 const nodes = {}, families = [];
 const existing = window.BIBLE_PEOPLE || [];
 const aliases = {'他玛':'tamar_ot','约瑟':'joseph_ot','拔示巴':'bathsheba'};
 function person(key, ref, note='', kind='person') {
  if (!nodes[key]) {
   const name=key.split('@')[0], qualifier=key.split('@')[1];
   const match=qualifier?null:existing.find(p=>p.name===name);
   nodes[key]={id:key,name:qualifier?`${name}（${qualifier}）`:name,refs:[],note:'',kind,detailId:match?.id||(!qualifier?aliases[name]:null)||null};
  }
  if(ref&&!nodes[key].refs.includes(ref))nodes[key].refs.push(ref);
  if(note)nodes[key].note=note;
  return key;
 }
 function family(id,title,roots,scope,notes='') {
  const f={id,title,roots:roots.split('|'),scope,notes,edges:[]};families.push(f);f.roots.forEach(r=>person(r,scope));return f;
 }
 function children(f,father,names,ref,mother=null,kind='person',relation='子女') {
  person(father,ref);if(mother)person(mother,ref);
  names.split('|').forEach(child=>{person(child,ref,'',kind);f.edges.push({father,mother,child,ref,relation});});
 }
 function chain(f,names,ref,relation='家谱记载') {
  const path=names.split('|');path.forEach(n=>person(n,ref));for(let i=1;i<path.length;i++)children(f,path[i-1],path[i],ref,null,'person',relation);return path;
 }
 // Genesis 4–5: both named lines; distinguish repeated Enoch/Lamech names.
 const early=family('early','亚当家族与洪水前世代','亚当','创世记4:1–26；5:1–32','该隐家系和塞特家系分别展示。经文说另有儿女而未具名者，以说明节点保留。');
 children(early,'亚当','该隐|亚伯|塞特','创世记4:1–2、25','夏娃');
 chain(early,'该隐|以诺@该隐之子|以拿|米户雅利|玛土撒利|拉麦@该隐家系','创世记4:17–18','儿子');
 children(early,'拉麦@该隐家系','雅八|犹八','创世记4:19–21','亚大@拉麦之妻');
 children(early,'拉麦@该隐家系','土八该隐|拿玛@拉麦之女','创世记4:22','洗拉');
 chain(early,'塞特|以挪士|该南@创5|玛勒列|雅列|以诺|玛土撒拉|拉麦@挪亚之父|挪亚','创世记5:6–29','儿子');
 children(early,'亚当','其他未具名儿女@亚当','创世记5:4',null,'unknown','另有儿女');
 children(early,'挪亚','闪|含|雅弗','创世记5:32');
 // Genesis 10: includes ethnic groups without pretending they are named individuals.
 const nations=family('nations','挪亚三子与列国支系','挪亚','创世记10:1–32','本章兼有人名和族群名。族群节点标为“族群”；地名与城邑不作为子女。');
 children(nations,'挪亚','闪|含|雅弗','创世记10:1');
 children(nations,'雅弗','歌篾|玛各|玛代|雅完|土巴|米设|提拉','创世记10:2');
 children(nations,'歌篾','亚实基拿|利法|陀迦玛','创世记10:3');
 children(nations,'雅完','以利沙|他施|基提|多单','创世记10:4');
 children(nations,'含','古实|麦西|弗|迦南','创世记10:6');
 children(nations,'古实','西巴|哈腓拉@古实支系|撒弗他|拉玛|撒弗提迦|宁录','创世记10:7–8');
 children(nations,'拉玛','示巴@拉玛支系|底但@拉玛支系','创世记10:7');
 children(nations,'麦西','路低人|亚拿米人|利哈比人|拿弗土希人|帕斯鲁细人|迦斯路希人|迦斐托人','创世记10:13–14',null,'clan','族群支系');
 children(nations,'迦斯路希人','非利士人','创世记10:14',null,'clan','由此出来');
 children(nations,'迦南','西顿|赫','创世记10:15');
 children(nations,'迦南','耶布斯人|亚摩利人|革迦撒人|希未人|亚基人|西尼人|亚瓦底人|洗玛利人|哈马人','创世记10:16–18',null,'clan','族群支系');
 children(nations,'闪','以拦|亚述|亚法撒|路德|亚兰@闪之子','创世记10:22');
 children(nations,'亚兰@闪之子','乌斯@亚兰支系|户勒|基帖|玛施','创世记10:23');
 chain(nations,'亚法撒|沙拉|希伯','创世记10:24','儿子');
 children(nations,'希伯','法勒|约坍','创世记10:25');
 children(nations,'约坍','亚摩答|沙列|哈萨玛非|耶拉|哈多兰|乌萨|德拉|俄巴路|亚比玛利@约坍之子|示巴@约坍支系|阿斐|哈腓拉@约坍支系|约巴','创世记10:26–29');
 // Genesis 11 & 22: genealogy into the patriarch families, with Nahor disambiguated.
 const terah=family('terah','闪至他拉与亲族','闪','创世记11:10–32；22:20–24；24:15、29；29:16','拿鹤（他拉之父）与拿鹤（亚伯拉罕之兄弟）是两人；利百加既在娘家出现，也在以撒家族作为母亲出现。');
 chain(terah,'闪|亚法撒|沙拉|希伯|法勒|拉吴|西鹿|拿鹤@他拉之父|他拉','创世记11:10–24','儿子');
 children(terah,'他拉','亚伯拉罕|拿鹤@亚伯拉罕之兄弟|哈兰','创世记11:26–27');
 children(terah,'哈兰','罗得|密迦|亦迦','创世记11:27、29');
 children(terah,'拿鹤@亚伯拉罕之兄弟','乌斯@拿鹤之子|布斯|基母利|基薛|哈琐|必达|益拉|彼土利','创世记22:20–23','密迦');
 children(terah,'拿鹤@亚伯拉罕之兄弟','提八|迦含|他辖|玛迦@拿鹤之子','创世记22:24','流玛');
 children(terah,'基母利','亚兰@基母利之子','创世记22:21');
 children(terah,'彼土利','利百加|拉班','创世记24:15、29');
 children(terah,'拉班','利亚|拉结','创世记29:16');
 // Abraham: all eight named sons and Ishmael/Keturah descendants listed in ch25.
 const ab=family('abraham','亚伯拉罕各支家族','亚伯拉罕','创世记16:15；21:1–3；25:1–26；35:23–26','亚伯拉罕的8位具名儿子全部列出。子孙按母亲分支；以撒与雅各支系可以继续展开。');
 children(ab,'亚伯拉罕','以实玛利','创世记16:15；25:12','夏甲');
 children(ab,'亚伯拉罕','以撒','创世记21:1–3','撒拉');
 children(ab,'亚伯拉罕','心兰|约珊|米但|米甸|伊施巴|书亚','创世记25:1–2','基土拉');
 children(ab,'约珊','示巴@约珊之子|底但@约珊之子','创世记25:3');
 children(ab,'底但@约珊之子','亚书利族|利都是族|利乌米族','创世记25:3',null,'clan','族群支系');
 children(ab,'米甸','以法|以弗|哈诺@米甸之子|亚比大|以勒大','创世记25:4');
 children(ab,'以实玛利','尼拜约|基达|亚德别|米比衫|米施玛|度玛|玛撒|哈大|提玛|伊突|拿非施|基底玛','创世记25:13–16');
 children(ab,'以实玛利','巴实抹@以实玛利之女','创世记36:3');
 children(ab,'以撒','以扫|雅各','创世记25:20–26','利百加');
 const jacob=family('jacob','雅各十二子与底拿','雅各','创世记29:31–35；30:1–24；35:16–26；46:8–25','12个儿子与女儿底拿全部列出，并继续收录创世记46章列名的下一代。不同章节的名字差异保留说明。');
 function jacobChildren(f){
  children(f,'雅各','吕便|西缅|利未|犹大|以萨迦|西布伦|底拿','创世记29:31–35；30:17–21；35:23','利亚');
  children(f,'雅各','但|拿弗他利','创世记30:3–8；35:25','辟拉');
  children(f,'雅各','迦得|亚设','创世记30:9–13；35:26','悉帕');
  children(f,'雅各','约瑟|便雅悯','创世记30:22–24；35:16–24','拉结');
 }
 jacobChildren(ab);jacobChildren(jacob);
 const grandchildren=[['吕便','哈诺@吕便之子|法路|希斯仑@吕便之子|迦米','9'],['西缅','耶母利|雅悯|阿辖|雅斤|琐辖|扫罗@西缅之子','10'],['利未','革顺|哥辖|米拉利','11'],['以萨迦','陀拉|普瓦|约伯@以萨迦之子|伸仑','13'],['西布伦','西烈|以伦@西布伦之子|雅利','14'],['迦得','洗非芸|哈基|书尼|以斯本|以利@迦得之子|亚罗底|亚列利','16'],['亚设','音拿|亦施瓦|亦施韦|比利亚|西拉@亚设之女','17'],['便雅悯','比拉|比结|亚实别|基拉@便雅悯之子|乃幔@便雅悯之子|以希|罗实|母平|户平|亚勒','21'],['但','户伸','23'],['拿弗他利','雅薛|沽尼|耶色|示冷','24']];
 grandchildren.forEach(([p,c,v])=>children(jacob,p,c,`创世记46:${v}`));
 children(jacob,'比利亚','希别|玛结','创世记46:17');
 children(jacob,'犹大','珥|俄南|示拉','创世记38:2–5','书亚的女儿');
 children(jacob,'犹大','法勒斯|谢拉','创世记38:27–30','他玛');
 children(jacob,'法勒斯','希斯仑@犹大支系|哈母勒','创世记46:12');
 children(jacob,'约瑟','玛拿西@约瑟之子|以法莲','创世记46:20','亚西纳');
 person('底拿',null,'雅各与利亚的女儿；不是十二个儿子之一。');
 person('约伯@以萨迦之子',null,'创46:13的家谱人物，不与约伯记主人公合并；民26:24对应名字为雅述。');
 person('扫罗@西缅之子',null,'母亲为未具名的迦南女子；不是以色列王扫罗。');
 person('以利@迦得之子',null,'创46:16迦得之子，不与撒母耳记的祭司以利合并。');
 // Esau + Seir: complete named parent/child lists in Genesis 36:1–30.
 const esau=family('esau','以扫与西珥家族','以扫|西珥','创世记36:1–30','按创36中的配偶名字展示；创26、28的配偶命名差异不强行合并。以东诸王是王位先后，不伪画成父子。');
 children(esau,'以扫','以利法@以扫之子','创世记36:2、4','亚大@以扫之妻');
 children(esau,'以扫','流珥@以扫之子','创世记36:3–4','巴实抹@以实玛利之女');
 children(esau,'以扫','耶乌施@以扫之子|雅兰|可拉@以扫之子','创世记36:5','阿荷利巴玛');
 children(esau,'以利法@以扫之子','提幔|阿抹|洗玻|迦坦|基纳斯','创世记36:11');
 children(esau,'以利法@以扫之子','亚玛力','创世记36:12','亭纳');
 children(esau,'流珥@以扫之子','拿哈|谢拉@流珥之子|沙玛|米撒','创世记36:13');
 children(esau,'西珥','罗坍|朔巴|祭便|亚拿@西珥之子|底顺|以察|底珊','创世记36:20–21');
 children(esau,'罗坍','何利|希幔','创世记36:22');
 children(esau,'西珥','亭纳','创世记36:22',null,'person','家族成员（罗坍之妹）');
 children(esau,'朔巴','亚勒文|玛拿辖|以巴录|示玻|阿南','创世记36:23');
 children(esau,'祭便','亚雅|亚拿@祭便之子','创世记36:24');
 children(esau,'亚拿@祭便之子','底顺@亚拿之子|阿荷利巴玛','创世记36:25');
 children(esau,'底顺@亚拿之子','欣但|伊是班|益兰|基兰','创世记36:26');
 children(esau,'以察','辟罕|撒番|亚干','创世记36:27');
 children(esau,'底珊','乌斯@底珊之子|亚兰@底珊之子','创世记36:28');
 // Exodus 6 with Miriam from Numbers 26 and Moses sons from Exodus.
 const levi=family('levi','利未、摩西与亚伦家族','利未','出埃及记6:16–25；2:21–22；18:3–4；民数记26:59','按经文补齐利未三子、摩西亚伦的父母及其子女；相同名字不自动合并。');
 children(levi,'利未','革顺|哥辖|米拉利','出埃及记6:16');
 children(levi,'革顺','立尼|示每@革顺之子','出埃及记6:17');
 children(levi,'哥辖','暗兰|以斯哈|希伯伦@哥辖之子|乌薛','出埃及记6:18');
 children(levi,'米拉利','抹利|母示','出埃及记6:19');
 children(levi,'暗兰','亚伦|摩西|米利暗','出埃及记6:20；民数记26:59','约基别');
 children(levi,'以斯哈','可拉@利未人|尼斐@以斯哈之子|细基利','出埃及记6:21');
 children(levi,'乌薛','米沙利|以利撒反|西提利','出埃及记6:22');
 children(levi,'亚伦','拿答@亚伦之子|亚比户|以利亚撒@亚伦之子|以他玛','出埃及记6:23','以利沙巴');
 children(levi,'可拉@利未人','亚惜|以利加拿@可拉之子|亚比亚撒','出埃及记6:24');
 children(levi,'以利亚撒@亚伦之子','非尼哈@亚伦之孙','出埃及记6:25','普铁的女儿');
 children(levi,'摩西','革舜@摩西之子|以利以谢@摩西之子','出埃及记2:21–22；18:3–4','西坡拉');
 // David: named children and actual royal succession by descent (not chronological kings list).
 const david=family('david','大卫家族与犹大王室','大卫','历代志上3:1–24；撒母耳记下12:15–24；13:1','代上3列名的19位儿子与女儿他玛保留；同名儿子分别编号。另补撒下12未具名夭折之子。经文未具名的其他子女只标注，不杜撰名字。');
 [['亚希暖@大卫之妻','暗嫩','1'],['亚比该','但以利@大卫之子','1'],['玛迦@大卫之妻','押沙龙','2'],['哈及','亚多尼雅','2'],['亚比她','示法提雅@大卫之子','3'],['以格拉','以特念','3']].forEach(([m,c,v])=>children(david,'大卫',c,`历代志上3:${v}`,m));
 children(david,'大卫','示米亚|朔罢|拿单@大卫之子|所罗门','历代志上3:5','拔示巴');
 children(david,'大卫','益辖|以利沙玛@代上3:6|以利法列@代上3:6|挪迦|尼斐@大卫之子|雅非亚|以利沙玛@代上3:8|以利法列@代上3:8|以利雅大','历代志上3:6–8');
 children(david,'大卫','他玛@大卫之女','历代志上3:9；撒母耳记下13:1');
 children(david,'大卫','未具名夭折之子@大卫','撒母耳记下12:15–18','拔示巴', 'unknown');
 children(david,'大卫','其他未具名妃嫔之子@大卫','历代志上3:9',null,'unknown','另外记有');
 person('拔示巴',null,'代上3:5称拔书亚；本图合并为拔示巴。');
 person('但以利@大卫之子',null,'撒下3:3称基利押；不是但以理书主人公。');
 chain(david,'所罗门|罗波安|亚比雅@犹大王|亚撒|约沙法|约兰@犹大王|亚哈谢@犹大王|约阿施|亚玛谢|乌西雅|约坦|亚哈斯|希西家|玛拿西@犹大王|亚们|约西亚','历代志上3:10–14','儿子');
 children(david,'约西亚','约哈难@约西亚之子|约雅敬|西底家@约西亚之子|沙龙@约西亚之子','历代志上3:15');
 children(david,'约雅敬','耶哥尼雅|西底家@约雅敬之子','历代志上3:16');
 children(david,'耶哥尼雅','撒拉铁@代上3|玛基兰|毗大雅|示拿萨|耶加米|何沙玛|尼大比雅','历代志上3:17–18');
 children(david,'毗大雅','所罗巴伯@代上3|示每@毗大雅之子','历代志上3:19');
 children(david,'所罗巴伯@代上3','米书兰|哈拿尼雅|示罗密@所罗巴伯之女|哈舒巴|阿黑|比利家|哈撒底|于沙希悉','历代志上3:19–20');
 children(david,'哈拿尼雅','毗拉提|耶筛亚','历代志上3:21');
 '利法雅众子|亚珥难众子|俄巴底亚众子|示迦尼众子'.split('|').forEach(key=>david.roots.push(person(key,'历代志上3:21','本节并列家族；不强制解释为哈拿尼雅的直接子女。','clan')));
 // Keep ambiguous continuation as a separate root rather than inventing a parent.
 david.roots.push(person('示迦尼','历代志上3:21–22','3:21并列家族的世代连接有解释差异，单列此支，不强接为哈拿尼雅亲子。'));
 children(david,'示迦尼','示玛雅','历代志上3:22');
 children(david,'示玛雅','哈突|以甲|巴利亚|尼利雅|沙法','历代志上3:22');
 children(david,'尼利雅','以利约乃|希西家@尼利雅之子|亚斯利干','历代志上3:23');
 children(david,'以利约乃','何大雅|以利亚实|毗莱雅|阿谷|约哈难@以利约乃之子|第莱雅|阿拿尼','历代志上3:24');
 // Gospels are separate textual genealogies; no automatic harmonization.
 const matt=family('matthew','耶稣家谱 · 马太记载','亚伯拉罕@太1','马太福音1:1–16','完整保留本段列名；线标为“家谱记载”，不能一概当作相邻生物学父子。约兰至乌西雅、约西亚至耶哥尼雅有省略世代。约瑟不是耶稣的生父。');
 const matNames='亚伯拉罕|以撒|雅各|犹大|法勒斯|希斯仑|亚兰|亚米拿达|拿顺|撒门|波阿斯|俄备得|耶西|大卫|所罗门|罗波安|亚比雅|亚撒|约沙法|约兰|乌西雅|约坦|亚哈斯|希西家|玛拿西|亚们|约西亚|耶哥尼雅|撒拉铁|所罗巴伯|亚比玉|以利亚敬|亚所|撒督|亚金|以律|以利亚撒|马但|雅各|约瑟';
 function gospelChain(f,names,scope,ref){const list=names.split('|').map((name,i)=>`${name}@${scope}·${i+1}`);f.roots=[list[0]];chain(f,list.join('|'),ref);return list;}
 const mp=gospelChain(matt,matNames,'太1','马太福音1:2–16');
 const motherAt={4:'他玛',10:'喇合',11:'路得',14:'拔示巴'};
 matt.edges.forEach((e,i)=>{if(motherAt[i+1]){e.mother=person(motherAt[i+1],'马太福音1:3–6');}});
 const josephM=mp.at(-1);person('马利亚@耶稣之母','马太福音1:16、18–25');
 children(matt,josephM,'耶稣基督@太1','马太福音1:16、18–25','马利亚@耶稣之母','person','母亲所生；约瑟为养父');
 person(mp[19],null,'与乌西雅之间的家谱省略亚哈谢、约阿施、亚玛谢，参代上3:11–12。');
 person(mp[26],null,'与耶哥尼雅之间省略约雅敬，参代上3:15–16。');
 const luke=family('luke','耶稣家谱 · 路加记载','亚当@路3','路加福音3:23–38','按本段完整名单改为祖先在上。保留与创11、太1不同的该南、拿单、希里等；不把“希里为马利亚之父”的解释当作正文结论。');
 const reverseLuke='耶稣基督|约瑟|希里|玛塔|利未|麦基|雅拿|约瑟|玛他提亚|亚摩斯|拿鸿|以斯利|拿该|玛押|玛他提亚|西美|约瑟|犹大|约亚拿|利撒|所罗巴伯|撒拉铁|尼利|麦基|亚底|哥桑|以摩当|珥|约细|以利以谢|约令|玛塔|利未|西缅|犹大|约瑟|约南|以利亚敬|米利亚|买南|玛达他|拿单|大卫|耶西|俄备得|波阿斯|撒门|拿顺|亚米拿达|亚兰|希斯仑|法勒斯|犹大|雅各|以撒|亚伯拉罕|他拉|拿鹤|西鹿|拉吴|法勒|希伯|沙拉|该南|亚法撒|闪|挪亚|拉麦|玛土撒拉|以诺|雅列|玛勒列|该南|以挪士|塞特|亚当';
 const lp=gospelChain(luke,reverseLuke.split('|').reverse().join('|'),'路3','路加福音3:23–38');
 luke.edges.at(-1).relation='依人看来（非生父）';
 person(lp[0],null,'路3:38还追溯至神；神不作为人类家谱中的生物学父亲节点。');
 // Match Gospel figures to existing biography by explicit position/name identities.
 const gospelBiographies={'亚伯拉罕':'abraham','以撒':'isaac','大卫':'david','所罗门':'solomon','罗波安':'rehoboam','亚撒':'asa','约沙法':'jehoshaphat','希西家':'hezekiah','约西亚':'josiah','耶稣基督':'jesus','亚当':'adam','挪亚':'noah','闪':'shem','以诺':'enoch','波阿斯':'boaz'};
 [...mp,...lp].forEach(id=>{const base=id.split('@')[0],target=gospelBiographies[base];if(target&&existing.some(p=>p.id===target))nodes[id].detailId=target;});
 const judah=family('judah','犹大至耶西与大卫','犹大','创世记38:2–5、27–30；历代志上2:5、9–17','补齐犹大至大卫的连续世代，并列耶西七个列名儿子及两位女儿。撒上16记大卫为第八子，未列名者不杜撰名字。');
 children(judah,'犹大','珥|俄南|示拉','创世记38:2–5','书亚的女儿');
 children(judah,'犹大','法勒斯|谢拉','创世记38:27–30','他玛');
 children(judah,'法勒斯','希斯仑@犹大支系|哈母勒','历代志上2:5');
 children(judah,'希斯仑@犹大支系','耶拉篾|兰|基路拜','历代志上2:9');
 chain(judah,'兰|亚米拿达|拿顺|撒门|波阿斯','历代志上2:10–11','儿子');
 person('兰',null,'太1、路3对应名称为亚兰；本图旧约采用代上2的兰。');
 children(judah,'波阿斯','俄备得','路得记4:13、17','路得');
 children(judah,'俄备得','耶西','历代志上2:12');
 children(judah,'耶西','以利押@耶西之子|亚比拿达@耶西之子|示米亚@耶西之子|拿坦业@耶西之子|拉代|阿鲜|大卫|洗鲁雅|亚比该@耶西之女','历代志上2:13–16');
 children(judah,'洗鲁雅','亚比筛|约押|亚撒黑','历代志上2:16',null,'person','母系子女');
 children(judah,'以实玛利人以帖','亚玛撒','历代志上2:17','亚比该@耶西之女');
 judah.roots.push('以实玛利人以帖');
 const lot=family('lot','罗得与摩押、亚扪支系','罗得','创世记19:15、30–38','两个女儿未具名；经文记载的亲缘不等同于婚姻关系，不把两个女儿标为配偶。');
 children(lot,'罗得','长女@罗得|次女@罗得','创世记19:15');
 children(lot,'罗得','摩押','创世记19:36–37','长女@罗得');
 children(lot,'罗得','便亚米','创世记19:36、38','次女@罗得');
 person('长女@罗得',null,'罗得的长女，正文未给出姓名。');person('次女@罗得',null,'罗得的次女，正文未给出姓名。');
 const saul=family('saul','扫罗家族','尼珥@代上8','历代志上8:33–40','仅按代上8此段绘制；撒上9的祖系表述另有差异，不自动混并。伊施巴力、米力巴力为本段名字。');
 chain(saul,'尼珥@代上8|基士@扫罗之父|扫罗@以色列王','历代志上8:33','儿子');
 children(saul,'扫罗@以色列王','约拿单|麦基舒亚|亚比拿达@扫罗之子|伊施巴力','历代志上8:33');
 children(saul,'约拿单','米力巴力','历代志上8:34');children(saul,'米力巴力','米迦@扫罗后裔','历代志上8:34');
 children(saul,'米迦@扫罗后裔','毗敦|米勒|他利亚|亚哈斯@扫罗后裔','历代志上8:35');
 children(saul,'亚哈斯@扫罗后裔','耶何阿达','历代志上8:36');
 children(saul,'耶何阿达','亚拉篾|亚斯玛威|心利','历代志上8:36');
 chain(saul,'心利|摩撒|比尼亚|拉法@扫罗后裔|以利亚萨@扫罗后裔|亚悉','历代志上8:36–37','儿子');
 children(saul,'亚悉','亚斯利干@亚悉之子|波基鲁|以实玛利@亚悉之子|示亚利雅|俄巴底雅@亚悉之子|哈难','历代志上8:38');
 saul.roots.push(person('以设','历代志上8:39','亚悉的兄弟。'));children(saul,'以设','乌兰|耶乌施@以设之子|以利法列@以设之子','历代志上8:39');
 children(saul,'乌兰','未列名众子与孙子@乌兰','历代志上8:40',null,'unknown','共150人（姓名未列）');
 const tribes=family('tribes','十二支派后代 · 民数记记载','雅各','民数记26:5–62','与创46分别保留，尤其便雅悯的亚勒、乃幔在本段列为比拉之子，不强行抹平世代差异。');
 jacobChildren(tribes);
 [['吕便','哈诺@吕便之子|法路|希斯仑@吕便之子|迦米','5–6'],['西缅','尼母利@西缅之子|雅悯|雅斤|谢拉@西缅之子|扫罗@西缅之子','12–13'],['迦得','洗分|哈基|书尼|阿斯尼|以利@迦得之子|亚律|亚列利','15–17'],['犹大','示拉|法勒斯|谢拉','20'],['法勒斯','希斯仑@犹大支系|哈母勒','21'],['以萨迦','陀拉|普瓦|雅述|伸仑','23–24'],['西布伦','西烈|以伦@西布伦之子|雅利','26'],['亚设','音拿|亦施韦|比利亚|西拉@亚设之女','44–46'],['比利亚','希别|玛结','45'],['拿弗他利','雅薛|沽尼|耶色|示冷','48–49'],['但','书含','42'],['利未','革顺|哥辖|米拉利','57']].forEach(([p,c,v])=>children(tribes,p,c,`民数记26:${v}`));
 children(tribes,'法路','以利押@吕便后裔','民数记26:8');children(tribes,'以利押@吕便后裔','尼母利@以利押之子|大坍|亚比兰','民数记26:9');
 children(tribes,'约瑟','玛拿西@约瑟之子|以法莲','民数记26:28','亚西纳');
 chain(tribes,'玛拿西@约瑟之子|玛吉|基列@玛拿西支系','民数记26:29','儿子');
 children(tribes,'基列@玛拿西支系','伊以谢|希勒|亚斯烈|示剑@基列之子|示米大|希弗','民数记26:30–32');
 children(tribes,'希弗','西罗非哈','民数记26:33');children(tribes,'西罗非哈','玛拉|挪阿|曷拉|密迦@西罗非哈之女|得撒','民数记26:33');
 children(tribes,'以法莲','书提拉|比结@以法莲支系|他罕','民数记26:35');children(tribes,'书提拉','以兰','民数记26:36');
 children(tribes,'便雅悯','比拉|亚实别|亚希兰|书反|户反','民数记26:38–39');children(tribes,'比拉','亚勒@民26|乃幔@民26','民数记26:40');
 children(tribes,'哥辖','暗兰','民数记26:58');children(tribes,'暗兰','亚伦|摩西|米利暗','民数记26:59','约基别');children(tribes,'亚伦','拿答@亚伦之子|亚比户|以利亚撒@亚伦之子|以他玛','民数记26:60','以利沙巴');
 // A connected master tree uses compatible OT facts only; alternate passage views stay separate.
 const overview=family('overview','旧约家谱主树','亚当','创4–5、10–11、22、25、35、38、46；出6；代上2:5、9–17、3','连续展示已核对的旧约主干及旁支；默认只展开上层，可逐层展开到大卫与王室。民26和两份福音家谱另设视图。不是整本圣经所有人物的穷尽名单。');
 const unique=new Set();[early,nations,terah,ab,jacob,esau,levi,judah,david,lot].forEach(f=>f.edges.forEach(e=>{const key=[e.father,e.mother,e.child,e.relation].join('|');if(!unique.has(key)){unique.add(key);overview.edges.push({...e});}}));
 // Do not display the same child twice just because one chapter omitted its known mother.
 overview.edges=overview.edges.filter(e=>e.mother||!overview.edges.some(other=>other.father===e.father&&other.child===e.child&&other.mother));
 // These groups have no explicit connection to the Adam trunk in the selected passages.
 overview.roots.push('西珥','以实玛利人以帖','示迦尼','利法雅众子','亚珥难众子','俄巴底亚众子','示迦尼众子');
 families.unshift(families.pop());
 const sources=[
  ['创世记4–5','https://www.churchofjesuschrist.org/study/scriptures/ot/gen/5?lang=zhs'],
  ['创世记10','https://www.churchofjesuschrist.org/study/scriptures/ot/gen/10?lang=zhs'],
  ['创世记11','https://www.churchofjesuschrist.org/study/scriptures/ot/gen/11?lang=zhs'],
  ['创世记22','https://www.churchofjesuschrist.org/study/scriptures/ot/gen/22?lang=zhs'],
  ['创世记25','https://www.churchofjesuschrist.org/study/scriptures/ot/gen/25?lang=zhs'],
  ['创世记36','https://cnbible.com/genesis/36.htm'],
  ['创世记46','https://www.churchofjesuschrist.org/study/scriptures/ot/gen/46?lang=zhs'],
  ['出埃及记6','https://www.churchofjesuschrist.org/study/scriptures/ot/ex/6?lang=zhs'],
  ['历代志上3','https://cnbible.com/1_chronicles/3.htm'],
  ['历代志上2','https://cnbible.com/1_chronicles/2.htm'],
  ['历代志上8','https://cnbible.com/1_chronicles/8.htm'],
  ['民数记26','https://www.churchofjesuschrist.org/study/scriptures/ot/num/26?lang=zhs'],
  ['创世记19','https://www.churchofjesuschrist.org/study/scriptures/ot/gen/19?lang=zhs'],
  ['马太福音1','https://www.churchofjesuschrist.org/study/scriptures/nt/matt/1?lang=zhs'],
  ['路加福音3','https://www.churchofjesuschrist.org/study/scriptures/nt/luke/3?lang=zhs']
 ];
 window.BIBLE_GENEALOGY={nodes,families,sources,version:3};
})();
