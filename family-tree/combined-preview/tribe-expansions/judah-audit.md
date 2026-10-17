# 原图正面犹大区扩展核对

核对日期：2026-10-17。基准为 `original-source-search/圣经家谱_同款正面_2880.jpg` 左半区域，人物与关系以简体中文和合本经文重新核查。数据文件只扩展 `judah-jesus.json`，不改原主线、页面与生产站点。

## 范围与数量

扩展共 308 条新增/覆盖档案，覆盖原库 5 人（耶西、大卫、示拉、玛伦、拔示巴），增加 92 条婚姻、母系和一条异表父子关系。合并后 360 档案。原有太1主线 42 人及其父系、谱系类型、四处省代标记和约瑟非耶稣生父语义保留。

- 犹大五子；谢拉五子与撒底—迦米—亚干；示拉的具名家族及织细麻布族群。
- 希斯伦—耶拉篾全段及示珊女婿耶哈一线；希斯伦—西割—睚珥；亚施户两妻七子。
- 希斯伦之子迦勒的具名妻妾、各母所生子女、户珥—乌利—比撒列、朔巴/萨玛/哈勒与诸族；雅代家独立列名。
- 基纳斯—俄陀聂/西莱雅；耶孚尼—迦勒三子、以拉—基纳斯；押撒与俄陀聂婚姻。
- 以利米勒/拿俄米、玛伦/路得、基连/俄珥巴，与波阿斯的后续婚姻。
- 耶西六名兄弟、两名姐妹、外甥、示米亚的两名儿子；大卫代上3所有具名儿女及另见的耶利摩、押沙龙女儿他玛；八位具名妻子及前夫/父家。
- 罗波安具名妻与儿子；约沙法六兄弟、约示巴；犹大诸王具名生母与其具名父家；约西亚四子、约雅敬另一子西底家。
- 代上3:17–24被掳后王室全部具名旁支，未定的家族列名不强行串成父子。
- 原图“以色列国诸王”栏按实际王朝分别建家族，而非把历任君王相连作同一父系。

## 关键纠正与保留差异

1. **书亚不是犹大妻子的名字**：原档“书亚之女（未具名）”保留，犹大儿妇他玛也不改为犹大之妻。[创38](https://cnbible.com/cus/genesis/38.htm)、[代上2:3–4](https://cnbible.com/cus/1_chronicles/2.htm)。
2. **耶哈是女婿**：`fatherId:null`，用 `treeParentId:sheshan_ishi` 与 `lineageKind:family` 标明，另保留示珊未具名女儿母系。亚来与“没有儿子”的张力不硬解。[代上2:31–35](https://cnbible.com/cus/1_chronicles/2.htm)。
3. **两位迦勒分别建档**：希斯伦之子与耶孚尼之子；两名父亲名下同名押撒也分别列档。雅代无明载父系，不能插在经文中就当作迦勒亲生子。[代上2:18、46–49](https://cnbible.com/cus/1_chronicles/2.htm)、[代上4:13–15](https://cnbible.com/cus/1_chronicles/4.htm)。
4. **地族之祖不伪作直接儿子**：提哥亚、西弗、伯夙等只在说明中作为地名；基列耶琳诸族、半数米努哈人、萨玛后裔族群是 `kind:group`。哈末是基尼人祖族，作为 `context` 关联家族，不冒称犹大血统。[代上2:42–55](https://cnbible.com/cus/1_chronicles/2.htm)。
5. **大卫姐妹按亲属事实连接**：洗鲁雅父未在引用本节具名，三个儿子按母系 `treeParentId` 连接。亚比该按撒下17:25记父拿辖，与耶西不强认同一人；她与大卫之妻亚比该分档。[代上2:16–17](https://cnbible.com/cus/1_chronicles/2.htm)、[撒下17:25](https://cnbible.com/cus/2_samuel/17.htm)。
6. **大卫儿女母系**：拔示巴四子照代上3:5列；其余九名不推定生母。代上3重复两名以利沙玛和两名以利法列，保持不同 ID。撒下5另表用字不直接消灭原章列名。米甲至死无子。[代上3:1–9](https://cnbible.com/cus/1_chronicles/3.htm)、[撒下5](https://cnbible.com/cus/2_samuel/5.htm)、[撒下6:23](https://cnbible.com/cus/2_samuel/6.htm)。
7. **玛迦/米该雅父系异表**：代下11:20称押沙龙之女，13:2作基比亚人乌列之女；记录为异表谱系列名，不臆造乌列—他玛婚姻解释。亚撒的祖母玛迦不写作生母。罗波安11:19的三子，母亲代词指向有解释差异，未硬配玛哈拉或亚比孩。[代下11](https://cnbible.com/cus/2_chronicles/11.htm)、[代下13:2](https://cnbible.com/cus/2_chronicles/13.htm)、[王上15:10](https://cnbible.com/cus/1_kings/15.htm)。
8. **生母不自动等于妻子**：经文仅给王子母名而未直接称婚姻身份时，只列母子关系；没有将所有王母自动添加为夫妻。亚他利雅为亚哈之女/暗利孙女，但无明确经文指她为耶洗别所生，不添加其生母线。[王下8:18、26](https://cnbible.com/cus/2_kings/8.htm)。
9. **两个西底家不混**：约西亚之子（原名玛探雅）与代上3:16约雅敬之子独立。沙龙/约哈斯根据耶22:11与王下23对照列同一档。[代上3:15–16](https://cnbible.com/cus/1_chronicles/3.htm)、[王下24:17–18](https://cnbible.com/cus/2_kings/24.htm)、[耶22:11](https://cnbible.com/cus/jeremiah/22.htm)。
10. **所罗巴伯异表**：保留太1中的 `fatherId:shealtiel`、`lineageKind:genealogy`，毗大雅—所罗巴伯作为带说明的代上3父系列名关系，不造第二个所罗巴伯或把毗大雅等同撒拉铁。[太1:12](https://cnbible.com/cus/matthew/1.htm)、[代上3:19](https://cnbible.com/cus/1_chronicles/3.htm)。
11. **米书兰五子依据所声明译本**：[简体和合本 cnbible](https://cnbible.com/cus/1_chronicles/3.htm) 与 [Wordproject](https://www.wordproject.org/bibles/gb/13/3.htm) 均明确列哈舒巴、阿黑、比利家、哈撒底、于沙希悉为米书兰之子。部分其他译本归所罗巴伯，数据旁注明译本差异，不冒称所有译本一致。
12. **代上3:21–22不强串代**：利法雅/亚珥难/俄巴底亚/示迦尼的“众子”未给互为父子顺序，四家独立关联列名；示玛雅五个具名儿子与“共六人”的数字张力保留，不发明第六名。[代上3:21–24](https://cnbible.com/cus/1_chronicles/3.htm)。
13. **北国王朝不是犹大世系**：尼八家明属以法莲，巴沙家以萨迦；暗利家、耶户家、雅比/迦底/利玛利/以拉等父子在自己家族内部连接。篡位顺序不作父子。不同国的约兰、亚哈谢、约阿施等同名均独立。[王上11:26](https://cnbible.com/cus/1_kings/11.htm)、[王上15–16](https://cnbible.com/cus/1_kings/16.htm)、[王下9:2](https://cnbible.com/cus/2_kings/9.htm)、[王下15](https://cnbible.com/cus/2_kings/15.htm)。
14. **原图路3黄线独立**：已建拿单（大卫之子）档案 `nathan_david`；本扩展不把希里说成马利亚父亲，不把路3与太1硬合。由主任务另制路加对照分段。

## 阅读与机械验证

经文网页在本次任务逐章浏览。代上2、3同时对照 Wordproject；代下21的 cnbible 抓取失败，改读 [Wordproject 代下21](https://www.wordproject.org/bibles/gb/14/21.htm)。其余章节链接逐条保存在 JSON 的 `sources` 中。

运行 `node family-tree/combined-preview/tribe-expansions/validate-judah-expansion.cjs`：检查 ID、字段、目标引用、双种父系无环、42 主线不变、母系、同名、异表、北国独立王朝和覆盖审计。

边界：不宣称原图小字逐字 OCR 完全复现；人物取可核的经文范围，地名与族群适当合并说明。不是全圣经每位犹大支派人物、历代后裔与所有匿名儿女的穷尽全集。资料仍是本地预览，未上线。
