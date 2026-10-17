# 圣经一年阅读计划 PWA

## 部署到 GitHub Pages
1. 新建一个 GitHub 仓库，例如 `bible-reading`
2. 上传网站运行文件与对应维护源；本项目的发布清单由 `node image-work/build-publish-list-v15.cjs` 生成，请勿直接上传整个工作目录中的临时文件
3. GitHub 仓库进入 Settings → Pages
4. Build and deployment 选择 `Deploy from a branch`
5. Branch 选择 `main`，目录选择 `/ (root)`，保存
6. 等待 GitHub Pages 地址生成，例如：
   `https://你的用户名.github.io/bible-reading/`

## iPhone 添加到桌面
1. 用 Safari 打开 GitHub Pages 地址
2. 点击 Safari 底部“分享”
3. 选择“添加到主屏幕”
4. 名称可保留“圣经阅读”
5. 以后直接点桌面图标进入

## 离线
首次完整打开后，Service Worker 会缓存网页资源。
之后即使断网，仍可打开程序并查看计划、打卡和笔记。

## 数据
阅读进度与笔记保存在当前设备浏览器本地（localStorage）。
建议偶尔用“导出进度”备份 JSON 文件。

## 新增专题
- 30天《圣经金钱观》专题
- 每天经文、主题、反思问题
- 独立完成状态与灵修笔记


## 圣经人物知识库（2026-10-17）
- 222份中文人物导读：旧约110、新约112。包含三人合传，条数不是独立人物总人数。
- 完整收录耶稣十二门徒，并区分多个雅各、犹大、马利亚、腓力等易混人物。
- 支持按人物名、经卷、主题、关系搜索。
- 每个人物包含：身份、主要经卷、一生经历、关键关系、导读重点。
- “按历史时期展开”提供类似可展开思维导图的总览。
- `people-data.json` 是维护源数据，便于以后交给 Codex 批量增补；网页运行使用 `people-data.js`，可完全离线。
- `node build-people-data.cjs` 从维护源生成运行文件。
- `family-tree/` 提供17个家谱视图，默认竖向、全部展开；十二支派分别查看，马太与路加家谱分别保留。原两张图片保留。
- `people-index/` 可检索中文导读、家谱档案，以及 STEP Bible TIPNR 的2995条具名／称谓人物原名索引。仅提取标识、名字、类别和经文，不导入其AI描述或推测血缘；许可与排除项目见 `people-index/SOURCE.md`。
- **目前不声称收齐所有人物的中文资料或完整家谱**。原名与中文译名尚未逐人核对；未具名角色、灵体、群体及人地不明条目范围另列。家谱跨页档案数也不是独立人数。
- 更新顺序：编辑资料 → `node build-people-data.cjs` → `node family-tree/build-viewer.cjs` → `node people-index/build-local.cjs` → 核验 → 更新SW及资源版本后部署。
