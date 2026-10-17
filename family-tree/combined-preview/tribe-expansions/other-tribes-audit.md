# 原图十二支派补充核对：其余十支派

核对日期：2026-10-17。范围：流便、西缅、以萨迦、拿弗他利、迦得、亚设、西布伦、但、约瑟两支、便雅悯。利未及犹大由另外的补充数据负责。

参照图片为 `original-source-search/圣经家谱_同款背面_2880.jpg`，文字及线条只作待核对清单，不能把原图的排列直接当作父子关系。本文所列姓名均按简体中文和合本对照经文；没有替圣经缺少的中间世代补名。

## 数据形式及边界

- `other-tribes.json` 有 10 个分支，468 条新增/覆盖人物记录。其中亚西纳沿用旧 ID 并补父亲，其余在各分支内用稳定且区分同名的 ID。此数字不是圣经人口普查人数。
- 既有创46树保留，不改便雅悯原先十位列名位置。后世家谱在各支派独立展开。
- `fatherId` 表示经文可证的父系。无上接世代的本支家族，以 `treeParentId`、`lineageKind:tribal` 关联，不能读成支派先祖的亲生儿子。
- 地点、同名、事迹相邻都不能单独证明父系或支派归属；此类人物用 `context` 标示。
- 父亲未记而母子明记者，用 `maternal` 与真实的 `mother-child` 关系。妻子/生母的档案用 `relatedOnly:true`，不因配偶身份变为丈夫的女儿。
- `genealogy-variant` 保留另一经文的谱位差异；`adoption` 只表示收养，不等于亲生父女。

## 逐区核对结果

### 流便

保留创46四子。补法路—以利押—尼母利/大坍/亚比兰；约珥—示玛雅—歌革—示每—米迦—利亚雅—巴力—备拉；另支约珥—示玛—亚撒—比拉。耶利、撒迦利雅没有父名，独立标本支归属。两位示玛/示玛雅、比拉/备拉不能因近音合并。

民1示丢珥—以利蓿、民13撒刻—沙母亚、民16比勒—安都各自保留父子，未冒接流便四子。流便已在河东分地，不虚构一名民34河西分地首领。

来源：[代上5:3–8](https://cnbible.com/cus/1_chronicles/5.htm)、[民26:5–9](https://cnbible.com/cus/numbers/26.htm)、[民1:5](https://cnbible.com/cus/numbers/1.htm)、[民13:4](https://cnbible.com/cus/numbers/13.htm)、[民16:1](https://cnbible.com/cus/numbers/16.htm)。原图本区具名人物已覆盖。

### 西缅

扫罗—沙龙—米比衫—米施玛—哈母利—撒刻—示每按代上4:25–27接续。示每有十六子、六女但未具名，不编二十二个名字。代上4:34–38全部具名族长及明确父家已收：米所巴、雅米勒、亚玛谢—约沙、约珥、亚薛—西莱雅—约示比—耶户，以及以利约乃、雅哥巴、约朔海、亚帅雅、亚底业、耶西篾、比拿雅、示玛雅—申利—耶大雅—亚龙—示非—细撒；另补以示四子。没有把这一长串名单排成单线父子。

民1苏利沙代—示路蔑、民13何利—沙法、民34亚米忽—示母利已补，另补民25撒路—心利。创46耶母利/琐辖与民26尼母利/谢拉差异沿用原说明，不确定改名不增加为额外的创46直系儿子。

来源：[代上4:24–43](https://cnbible.com/cus/1_chronicles/4.htm)、[民1](https://cnbible.com/cus/numbers/1.htm)、[民13](https://cnbible.com/cus/numbers/13.htm)、[民34:20](https://cnbible.com/cus/numbers/34.htm)、[民25:14](https://cnbible.com/cus/numbers/25.htm)。原图本区具名人物已覆盖；原图的宗族称谓不另作具名人物。

### 以萨迦

代上7:2–3陀拉六子及乌西—伊斯拉希—米迦勒/俄巴底亚/约珥/伊示雅已补。“共五人”的计数包括上一代，不凭计数生造第五个儿子。士10朵多—普瓦—陀拉为后世士师家，不能与创46普瓦、陀拉合并。民1苏押—拿坦业、民13约色—以迦、民34阿散—帕铁均已补。

来源：[代上7:1–5](https://cnbible.com/cus/1_chronicles/7.htm)、[士10:1–2](https://cnbible.com/cus/judges/10.htm)、[民1:8](https://cnbible.com/cus/numbers/1.htm)、[民13:7](https://cnbible.com/cus/numbers/13.htm)、[民34:26](https://cnbible.com/cus/numbers/34.htm)。原图具名人物已覆盖，原图父名/子名的上下方向均按经文核正。

### 拿弗他利

创46四子保留。代上7:13的沙龙与创46示冷差异不静默改写。民1以南—亚希拉、民13缚西—拿比及图外补充民34亚米忽—比大黑收录。另列亚比挪庵—巴拉，但士4只明确巴拉来自拿弗他利的基低斯，不能仅凭地点当作已证完整族谱，故用背景关联。

来源：[代上7:13](https://cnbible.com/cus/1_chronicles/7.htm)、[民1:15](https://cnbible.com/cus/numbers/1.htm)、[民13:14](https://cnbible.com/cus/numbers/13.htm)、[民34:28](https://cnbible.com/cus/numbers/34.htm)、[士4:6](https://cnbible.com/cus/judges/4.htm)。原图本区具名人物已覆盖。

### 迦得

创46七子保留，民26异写不直接增作另七子。民1丢珥—以利雅萨、民13玛基—臼利补录。原图较少，此次另补代上5:12–15约珥、沙番、雅乃、沙法等族长，布斯至亚比孩父系及亚比孩七子、古尼—押比叠—亚希。流便的约珥、迦得的约珥及以萨迦后裔约珥各有 ID。

来源：[代上5:11–15](https://cnbible.com/cus/1_chronicles/5.htm)、[民1:14](https://cnbible.com/cus/numbers/1.htm)、[民13:15](https://cnbible.com/cus/numbers/13.htm)、[民26:15–18](https://cnbible.com/cus/numbers/26.htm)。原图本区具名人物已覆盖。

### 亚设

保留四子及女儿西拉。代上7:30–39全部具名家族补录：希别三子一女，雅弗勒三子、朔默四子，希连四子及琐法十一子，益帖三子、乌拉三子，另有玛结—比撒威。希连虽称朔默兄弟，经文未直接给父名；益帖、乌拉的上代也未记。因此不照原图推断他们必为某个近音人物的异名，保持独立本支家。女儿书雅与琐法之子书亚性别和 ID 分开。

民1俄兰—帕结、民13米迦勒—西帖、民34示罗米—亚希忽收录。原图父/子上下次序较易倒读，均按圣经核正。

来源：[代上7:30–40](https://cnbible.com/cus/1_chronicles/7.htm)、[民1:13](https://cnbible.com/cus/numbers/1.htm)、[民13:13](https://cnbible.com/cus/numbers/13.htm)、[民34:27](https://cnbible.com/cus/numbers/34.htm)。原图本区具名人物已覆盖；有解释争议的希连/何坦、益帖/益兰不强行合并。

### 西布伦

创46三子保留。士12以伦明说为西布伦人，另列后世士师；不能与创46以伦合并。以比赞只有“伯利恒人”的经文，不能因原图放在西布伦区就断定支派，此处只作背景人物。民1希伦—以利押、民13梭底—迦叠及民34帕纳—以利撒番补录。

来源：[士12:8–12](https://cnbible.com/cus/judges/12.htm)、[民1:9](https://cnbible.com/cus/numbers/1.htm)、[民13:10](https://cnbible.com/cus/numbers/13.htm)、[民34:25](https://cnbible.com/cus/numbers/34.htm)。原图具名人物已覆盖，但以比赞的确定族籍已纠正为未明确。

### 但

保留户伸及民26书含异记说明。补但族玛挪亚—参孙、明确但未具名的参孙母亲。大利拉为参孙所爱的妇人，士16没有称她为妻，不建立婚姻关系。亚希撒抹—亚何利亚伯及民1亚米沙代—亚希以谢、民13基玛利—亚米利、民34约利—布基均补录。

来源：[出31:6](https://cnbible.com/cus/exodus/31.htm)、[士13](https://cnbible.com/cus/judges/13.htm)、[士16:4](https://cnbible.com/cus/judges/16.htm)、[民1:12](https://cnbible.com/cus/numbers/1.htm)、[民13:12](https://cnbible.com/cus/numbers/13.htm)、[民34:22](https://cnbible.com/cus/numbers/34.htm)。原图具名人物已覆盖，且避免把大利拉画作确定妻子。

### 约瑟：玛拿西

补波提非拉—亚西纳妻家；波提非拉不是约瑟主人波提乏。玛拿西后代包括玛吉、基列、亚斯列；玛拿西亚兰妾、玛吉妻玛迦及相关户品/书品；毗利施、示利施—乌兰/利金—比但；哈摩利吉及其三个儿子；民26基列各族与示米大四子；希弗—西罗非哈五女。

关键差异：民27:1明确西罗非哈为希弗之子，因此采用该父系，代上7:15“次子”称谓不用于把他直接接玛拿西。代上7:14的亚斯列与民26:31亚斯烈的代次差异写在说明，不强行决定二者是两个历史人物或两处是连续生父。哈摩利吉只明记为基列妹子，三个儿子的父亲未具名，按母子线连接。

基甸按士6保留父亲约阿施；约阿施是亚比以谢族，不能就此直接接为代上7亚比以谢亲生儿子。基甸具名益帖、亚比米勒、约坦及亚比米勒未具名生母补全；其他七十子不编名。

原图把睚珥放本支，实际代上2父系希斯仑—西割—睚珥、母系为玛吉之女，均保留，不能改成玛吉直接生睚珥。士师睚珥和耶弗他家只作基列背景；没有证据将耶弗他之父基列合为玛吉之子基列。另补民1、13、34三组父子及代上5玛拿西半支派七位族长。

来源：[创41:45–50](https://cnbible.com/cus/genesis/41.htm)、[创50:23](https://cnbible.com/cus/genesis/50.htm)、[代上7:14–19](https://cnbible.com/cus/1_chronicles/7.htm)、[民26:29–33](https://cnbible.com/cus/numbers/26.htm)、[民27:1](https://cnbible.com/cus/numbers/27.htm)、[代上2:21–22](https://cnbible.com/cus/1_chronicles/2.htm)、[民32:41](https://cnbible.com/cus/numbers/32.htm)、[士6](https://cnbible.com/cus/judges/6.htm)、[士8](https://cnbible.com/cus/judges/8.htm)、[士9](https://cnbible.com/cus/judges/9.htm)、[士10:3–5](https://cnbible.com/cus/judges/10.htm)、[士11](https://cnbible.com/cus/judges/11.htm)。原图具名人物已覆盖；无上代的士师没有硬接始祖。

### 约瑟：以法莲

代上7:20–27全部列名收录：书提拉—比列—他哈—以拉大—他哈—撒拔—书提拉；以谢、以列、比利亚、女儿舍伊拉；比利亚—利法/利悉—他拉—他罕—拉但—亚米忽—以利沙玛—嫩—约书亚。两位他哈、两位书提拉不合并，民26比结和他罕按该谱另标，未擅定比列、以谢、以列就是民26某个异名人物。

约书亚又名何西阿，探子身份与代上7祖系共用一个人物 ID。以利沙玛兼民1首领，不重造。民34拾弗但—基母利补全。押顿父家因葬地在以法莲山地而作为背景保留，不据居地编造父系。

来源：[代上7:20–27](https://cnbible.com/cus/1_chronicles/7.htm)、[民26:35–37](https://cnbible.com/cus/numbers/26.htm)、[民1:10](https://cnbible.com/cus/numbers/1.htm)、[民13:8、16](https://cnbible.com/cus/numbers/13.htm)、[民34:24](https://cnbible.com/cus/numbers/34.htm)、[士12:13–15](https://cnbible.com/cus/judges/12.htm)。原图具名人物已覆盖，谱位差异保留。

### 便雅悯：前段各家

原创46十人保持；代上7比拉五子、比结九子、耶叠—比勒罕七子、以珥及书品/户品、亚黑—户伸补录。代上8亚哈拉、挪哈、拉法与比拉后家全部补；同父名单重复的基拉或希伯只保留一条重复列名，不凭重复抄录造第二个确定历史人物。民26亚勒/乃幔在比拉下、创46在便雅悯下的差异用另谱关系和说明并存，不静默挪走旧节点。

代上8:6–28以忽家、沙哈连三位妻子和九子、以利巴力诸子、比利亚诸子、示玛、示每诸子、沙煞诸子、耶罗罕六子均已补齐。比利亚/示玛没有明给父名，不因经文排在以利巴力后就推定为其直接儿子。沙哈连被休妻户伸和巴拉与后妻贺得有时间说明；母亲只有明确生子的户伸、贺得，巴拉没有凭空分配孩子。

基遍耶利家、妻玛迦与十位列名儿子、米基罗—示米暗均按代上8/9补全，另补归回后代上9:7–8便雅悯各父家。

来源：[创46:21](https://cnbible.com/cus/genesis/46.htm)、[民26:38–40](https://cnbible.com/cus/numbers/26.htm)、[代上7:6–12](https://cnbible.com/cus/1_chronicles/7.htm)、[代上8](https://cnbible.com/cus/1_chronicles/8.htm)、[代上9](https://cnbible.com/cus/1_chronicles/9.htm)。原图前段具名人物已覆盖，并扩大到经文各家。

### 便雅悯：扫罗家、士师与后世人物

扫罗祖先采用撒上9/14亚斐亚—比歌拉—洗罗—亚别—基士—扫罗；押尼珥之父尼珥按撒上14为亚别之子/扫罗叔叔。代上8/9尼珥—基士是另一谱位，作为差异关系保留。数据中两处尼珥标注各自经文，不断言一定是两名不同历史人物，也不硬拼成无争议父系。

扫罗妻亚希暖与其父亚希玛斯、妾利斯巴与其父爱亚、具名儿女及明确生母均补。没有把妻子身份自动当作所有儿女的生母。利斯巴之子米非波设，与约拿单之子米非波设严格分开。约拿单后家至亚悉六子及以设三子完整；伊施巴力/伊施波设、米力巴力/米非波设、耶何阿达/雅拉、拉法/利法雅作为同谱对应称谓附记。亦施韦与亚比拿达的身份差异不武断消除。

米拉—亚得列及其父米何拉人巴西莱，米甲—大卫/帕提及帕提之父拉亿均补；不将这位巴西莱合为基列人大卫恩人。米甲的婚姻按时间记述，不创造她的具名儿女。临门—巴拿/利甲、士师以笏及基拉之父、末底改祖系、以斯帖生父亚比孩、保罗都补齐。以斯帖是末底改的养女，不是亲生女儿；保罗只有便雅悯属籍，没有可考的扫罗王父系。

来源：[撒上9](https://cnbible.com/cus/1_samuel/9.htm)、[撒上14:49–51](https://cnbible.com/cus/1_samuel/14.htm)、[撒上18](https://cnbible.com/cus/1_samuel/18.htm)、[撒上25:44](https://cnbible.com/cus/1_samuel/25.htm)、[撒下3](https://cnbible.com/cus/2_samuel/3.htm)、[撒下4](https://cnbible.com/cus/2_samuel/4.htm)、[撒下9:12](https://cnbible.com/cus/2_samuel/9.htm)、[撒下21:8](https://cnbible.com/cus/2_samuel/21.htm)、[士3:15](https://cnbible.com/cus/judges/3.htm)、[斯2:5–15](https://cnbible.com/cus/esther/2.htm)、[腓3:5](https://cnbible.com/cus/philippians/3.htm)、[罗11:1](https://cnbible.com/cus/romans/11.htm)、[徒13:9](https://cnbible.com/cus/acts/13.htm)。原图具名人物已覆盖，未编造缺失世代。

## 检查

执行 `node family-tree/combined-preview/tribe-expansions/validate-other-tribes.cjs`。检查十支根、字段/ID/经文、父亲/关联节点可解析且无环、各关键家庭人数与父母关系、首领与探子父家、同名边界和收养关系。该检查验证数据结构和已审的关键规则，不能替代经文解释的人工核对。

引用链接需支持新增经卷：创世记、出埃及记、民数记、历代志上、士师记、撒母耳记上、撒母耳记下、以斯帖记、腓立比书、罗马书、使徒行传。
