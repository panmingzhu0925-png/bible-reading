# 圣经交互家谱

正式查看器为 `family-tree/index.html`，在主网站“圣经家谱”中嵌入，也可全屏查看。保留原有正背面图片入口、人物列表和主网站的历史时期阅读入口。

当前共有 17 套分段资料：

- `?tree=adam-noah`：亚当至挪亚，含该隐、塞特两支与具名配偶。
- `?tree=noah-abraham`：挪亚三子至亚伯拉罕，并列拿鹤、哈兰及相关家庭。
- `?tree=abraham-jacob`：亚伯拉罕、以实玛利、以撒、以扫家庭，雅各十二子、底拿，以及约瑟两子。
- `?tree=jacob-tribes`：雅各十二子与十二支派总览；支派选择器分别打开各家族。
- 11 个分支页面：`tribe-reuben`、`tribe-simeon`、`tribe-levi`、`tribe-dan`、`tribe-naphtali`、`tribe-gad`、`tribe-asher`、`tribe-issachar`、`tribe-zebulun`、`tribe-joseph`、`tribe-benjamin`。
- `?tree=judah-jesus`：犹大旁支、王室家庭与《马太福音》主线，旧约补列的省略世代另标。
- `?tree=judah-luke`：《路加福音》经大卫之子拿单的独立对照家谱。

以上是现有家谱收录范围，不表示圣经全部人物均已收录。档案中分别保留具名人物、未具名角色、族群及班次；跨页存在重复人物，档案数不能作为不同人物总数。

所有页面默认竖向从上至下、全部展开。主线居中，同胞按母亲分组；只有一位具名妻妾时在父亲旁标注，多位时在子女旁标出生母。单列页面不会擅自认定没有列出的配偶或儿女不存在。点击姓名看经历、出处、关系性质和跨页入口；可使用“单看这支家谱”、搜索、平移、缩放及横竖切换。

`person=人物ID` 可定位档案，`family=人物ID` 可单看图中该支，`embed=1` 用于主网页内嵌。`explain=mary` 展开马利亚与拿单支系的释经说明。约瑟至耶稣明确标记家庭身份，不作为生父关系；希里至马利亚仅列常见释经解释，未填为经文明记的父女关系。

犹大页提供“相关家族 · 单独查看”选择器。`?tree=judah-jesus&related=家族根ID` 单独展示北国王族、相关母家及姻亲等23组家族；这些家族不接在犹大根节点下。完整360条档案及原经文保留，主图266条图面记录，妻子、生母仍可点击；亚玛撒在主图按经文明记的母系与亚比该连接，另在益帖父家保留父系显示。“相关家族”不表示所有成员已被证明不属犹大支派，支派未明仍作未确定。

## 资料与构建

`combined-preview/` 是当前已审阅查看器和扩展资料的源目录，原始三段资料仍在 `data/`。主要资料包括 `abraham-jacob-children.json`、`jacob-tribes.json`、`judah-jesus.json`、`judah-luke.json`、`mary-nathan-note.json` 及 `tribe-expansions/`。各审核说明记录相应经文和名单差异。不同同名人物保留独立 ID；妻妾、母系、收养、族源、支派归属及有争议谱系不可一律改成父子。

运行 `node family-tree/build-viewer.cjs` 复用 `combined-preview/build-tree-data.cjs`，生成正式 `index.html`、`style.css`、`app.js`、`compact-layout.js`、`tree-data.js`，同时修正相对路径和生产资源版本。不要手改生成的 `tree-data.js`，也不要使用旧 `build-data.cjs` 的三段产物覆盖它。旧 `data.js` 暂存兼容，正式查看器不再加载该文件。

`app.css` 为共享基础样式，`style.css` 为本轮人物树扩展样式；预览仍引用相同基础样式。ECharts 5.6.0 位于 `vendor/`，保留 Apache-2.0 许可，不依赖外部 CDN；资料通过本地 JavaScript 载入，避免额外 JSON 请求导致子目录路径问题。

必要核验：`node family-tree/check-viewer.cjs`、`node family-tree/combined-preview/check-expanded-tribes.cjs`、`node family-tree/combined-preview/check-judah-related.cjs`，以及各扩展资料的校验脚本和浏览器手机布局检查。静态检查不代替经文逐条人工复核。

## 部署

GitHub Pages 项目路径下使用相对地址。当前生产资源版本为 v16；更新运行文件时，应同步更新主网站 `sw.js` 的缓存版本与清单，预缓存两个 CSS、三个运行脚本、本地 ECharts 和查看器页面。原图片页面及两张图片继续保留。发布后检查正式子目录中的内嵌、全屏、跨页定位及离线缓存更新。
