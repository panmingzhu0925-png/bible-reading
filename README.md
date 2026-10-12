# 圣经一年阅读计划 PWA

## 部署到 GitHub Pages
1. 新建一个 GitHub 仓库，例如 `bible-reading`
2. 把本文件夹里的所有文件上传到仓库根目录
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


## 圣经人物知识库（本版新增）
- 122位人物：旧约77、新约45。
- 完整收录耶稣十二门徒，并区分多个雅各、犹大、马利亚、腓力等易混人物。
- 支持按人物名、经卷、主题、关系搜索。
- 每个人物包含：身份、主要经卷、一生经历、关键关系、导读重点。
- “按历史时期展开”提供类似可展开思维导图的总览。
- `people-data.json` 是维护源数据，便于以后交给 Codex 批量增补；网页运行使用 `people-data.js`，可完全离线。
