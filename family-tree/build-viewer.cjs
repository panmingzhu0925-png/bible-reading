'use strict';

// The reviewed preview is also the source for the production viewer. Keep the
// Scripture data in its JSON sources instead of editing either generated bundle.
const fs = require('node:fs');
const path = require('node:path');
const { buildData } = require('./combined-preview/build-tree-data.cjs');
const preview = path.join(__dirname, 'combined-preview');
const version = '18';
const read = file => fs.readFileSync(path.join(preview, file), 'utf8');
const write = (file, source) => fs.writeFileSync(path.join(__dirname, file), source);

function replace(source, from, to) {
  if (!source.includes(from)) throw new Error('预览模板已改变，请检查生产路径：' + from);
  return source.replace(from, to);
}

let html = read('index.html');
for (const [from, to] of [
  ['<title>全部人物树 · 配偶与生母标注预览</title>', '<title>圣经人物家谱 · 圣经阅读</title>'],
  ['href="./style.css"', `href="./style.css?v=${version}"`],
  ['href="../../genealogy-images.html"', 'href="../genealogy-images.html"'],
  ['href="../../index.html#pagePeople"', 'href="../index.html#pagePeople"'],
  ['返回现有网页', '返回圣经阅读'],
  ['人物树预览 ·', '家谱阅读 ·'],
  ['src="../vendor/echarts.min.js"', 'src="./vendor/echarts.min.js"'],
  ['src="./tree-data.js"', `src="./tree-data.js?v=${version}"`],
  ['src="./compact-layout.js"', `src="./compact-layout.js?v=${version}"`],
  ['src="./app.js"', `src="./app.js?v=${version}"`]
]) html = replace(html, from, to);
write('index.html', html);
write('style.css', replace(read('style.css'), "@import url('../app.css?v=14');", `@import url('./app.css?v=${version}');`));
write('app.js', replace(read('app.js'), "+' · 人物树预览';", "+' · 圣经人物家谱';"));
write('compact-layout.js', read('compact-layout.js'));

const data = buildData();
write('tree-data.js', 'window.BIBLE_FAMILY_TREES=' + JSON.stringify(data).replace(/</g, '\\u003c') + ';\n');
console.log(`已生成正式家谱查看器 v${version}：${Object.keys(data).length} 套资料。`);
for (const [key, db] of Object.entries(data)) console.log(`${key}: ${db.nodes.length} 条档案 / ${db.treeNodeIds.length} 图面条目`);
