# 犹大至耶稣：独立经文复核

复核日期：2026-10-17。独立阅读《和合本》相关章节后，逐项审查 `judah-jesus.json`；不修改 JSON 或网页。此记录侧重人物与关系的依据，网页布局由主代理另行验证。

## 审阅范围和结果

- 当前资料含 56 个档案、47 个树节点、42 个主线人物。主线由犹大开始，终止于耶稣；四位《马太福音》未列出的中间君王另有标记。
- 犹大五子、法勒斯两子均与[创46:12](https://cnbible.com/cus/genesis/46.htm)、[代上2:3–5](https://cnbible.com/cus/1_chronicles/2.htm)相符。
- 大卫以前按[得4:18–22](https://cnbible.com/cus/ruth/4.htm)与[代上2:9–15](https://cnbible.com/cus/1_chronicles/2.htm)交叉核对；同一谱位的“兰／亚兰”已留作名字差异。
- 所罗门至耶哥尼雅依[代上3:10–17](https://cnbible.com/cus/1_chronicles/3.htm)复核；其后依[太1:12–16](https://cnbible.com/cus/matthew/1.htm)逐个检查顺序与相邻连接，未发现名字或顺序错接。

## 不能按普通亲生父子线读的地方

| 位置 | 数据处理 | 经文依据 |
| --- | --- | --- |
| 约兰至乌西雅 | 补亚哈谢、约阿施、亚玛谢，三人均标 `matthewOmitted` | [代上3:11–12](https://cnbible.com/cus/1_chronicles/3.htm)，对照[太1:8](https://cnbible.com/cus/matthew/1.htm) |
| 约西亚至耶哥尼雅 | 补约雅敬并标省略，避免把孙子画作直接亲生儿子 | [代上3:15–16](https://cnbible.com/cus/1_chronicles/3.htm)，[王下24:6](https://cnbible.com/cus/2_kings/24.htm) |
| 乌西雅的别名 | 亚撒利雅、太1的“乌西亚”均保留为检索名 | [王下15:13](https://cnbible.com/cus/2_kings/15.htm)，[代下26:1](https://cnbible.com/cus/2_chronicles/26.htm) |
| 撒拉铁至所罗巴伯 | `lineageKind: genealogy`，说明太1列名与代上3的毗大雅记载差异，不编造收养或立嗣原因 | [太1:12](https://cnbible.com/cus/matthew/1.htm)，[代上3:17–19](https://cnbible.com/cus/1_chronicles/3.htm)；[拉3:2、8](https://cnbible.com/cus/ezra/3.htm)亦有撒拉铁记载 |
| 所罗巴伯之后至约瑟 | 按太1谱系列名，不把亚比玉改成代上3的其他人 | [太1:13–16](https://cnbible.com/cus/matthew/1.htm)，[代上3:19–21](https://cnbible.com/cus/1_chronicles/3.htm) |
| 约瑟至耶稣 | `lineageKind: household`；标签与关系明确“非生父”，马利亚另有母子关系 | [太1:16–25](https://cnbible.com/cus/matthew/1.htm)，[路3:23](https://cnbible.com/cus/luke/3.htm) |

本图补回四人之后的节点数量，不作为太1:17三组十四代的重新计数。路3在大卫以后走拿单一支，其名单与太1不能在未说明的情况下拼成单一谱系；路3也没有直接写明马利亚是希里的女儿。

## 女性及婚姻核对

- 他玛只与珥记夫妻，与法勒斯、谢拉记母子；不添加她与犹大的婚姻，也不添加她与示拉的婚姻。[创38:6、14、18、27–30](https://cnbible.com/cus/genesis/38.htm)
- 书亚之女保持未具名身份；书亚是父亲的名字。她是珥、俄南、示拉的母亲。[创38:2–5](https://cnbible.com/cus/genesis/38.htm)
- 喇合只记录太1所给的波阿斯生母关系，不假定经文直接说明其婚姻，未将她与《约书亚记》人物的认定写成经文明说。[太1:5](https://cnbible.com/cus/matthew/1.htm)
- 路得先为玛伦之妻，玛伦死后与波阿斯成婚并生俄备得；不把拿俄米的抚育身份写成生母。[得4:10、13–17](https://cnbible.com/cus/ruth/4.htm)
- 拔示巴先与乌利亚有婚姻，乌利亚死后成为大卫之妻。所罗门与先前夭折的未具名孩子分别看待。[撒下11:3、17、26–27](https://cnbible.com/cus/2_samuel/11.htm)，[撒下12:15–24](https://cnbible.com/cus/2_samuel/12.htm)
- 马利亚是耶稣的母亲、约瑟的妻子，不填入经文未给的父亲。[太1:16–25](https://cnbible.com/cus/matthew/1.htm)

## 审阅提示

首轮没有发现人物名单、父母关系或主线顺序的硬错误。已提醒资料作者将 scope 中“五位女性”改为“太1提及的五位女性，另保留利亚与书亚之女”，因为档案实际上含七位女性；并为耶哥尼雅的别名“哥尼雅”补[耶22:24](https://cnbible.com/cus/jeremiah/22.htm)出处。两项属于范围说明与来源完整性，最终状态以该 JSON 的最新修订为准。
