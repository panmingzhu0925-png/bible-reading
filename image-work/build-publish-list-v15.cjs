'use strict';
// Reviewable publication proposal only; this script never calls GitHub.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const preview = 'family-tree/combined-preview/';
const runtime = [
  'index.html', 'sw.js', 'people-data.js', 'people-data.json', 'build-people-data.cjs',
  'family-tree/index.html', 'family-tree/app.css', 'family-tree/style.css',
  'family-tree/app.js', 'family-tree/compact-layout.js', 'family-tree/tree-data.js',
  'people-index/index.html', 'people-index/app.css', 'people-index/app.js', 'people-index/data.js', 'people-index/local-data.js'
];
const source = [
  'family-tree/build-viewer.cjs',
  'family-tree/data/adam-noah.json', 'family-tree/data/noah-abraham.json', 'family-tree/data/abraham-jacob.json',
  ...['index.html', 'app.js', 'style.css', 'compact-layout.js', 'tree-data.js', 'build-tree-data.cjs', 'build-luke.cjs', 'build-preview.cjs', 'abraham-jacob-children.json', 'jacob-tribes.json', 'judah-jesus.json', 'judah-luke.json', 'mary-nathan-note.json', 'tribe-expansions/levi.json', 'tribe-expansions/judah.json', 'tribe-expansions/other-tribes.json'].map(file => preview + file)
];
// Automatically include the directory's finished builders and provenance files,
// without bundling temporary downloads or dependency directories.
const directory = path.join(root, 'people-index');
if (fs.existsSync(directory)) for (const name of fs.readdirSync(directory)) if (/\.(?:cjs|json|md)$/.test(name)) source.push('people-index/' + name);
const tests = [
  'family-tree/check-viewer.cjs',
  ...['check-children.cjs', 'check-tribes.cjs', 'check-judah.cjs', 'check-split-tribes.cjs', 'check-expanded-tribes.cjs', 'compact-layout.test.cjs', 'tribe-expansions/validate-levi.cjs', 'tribe-expansions/validate-judah-expansion.cjs', 'tribe-expansions/validate-other-tribes.cjs'].map(file => preview + file),
  'genealogy-data.js', // Independent Luke text-order fixture used by an integration test.
  'image-work/check-family-integration-v15.cjs', 'image-work/build-publish-list-v15.cjs'
];
const documentation = [
  'README.md', '人物资料维护说明.md', 'family-tree/README.md', 'output/生产家谱整合核验_v15.md',
  ...['adam-noah-audit.md', 'noah-abraham-audit.md', 'abraham-jacob-audit.md'].map(file => 'family-tree/data/' + file),
  ...['README.md', '十二支派分支说明.md', 'scripture-audit.md', 'scripture-children-audit.md', 'scripture-judah-audit.md', 'scripture-judah-independent-review.md', 'scripture-tribes-audit.md', 'scripture-tribes-mapping.md', 'mary-nathan-review.md', 'tribe-expansions/levi-audit.md', 'tribe-expansions/judah-audit.md', 'tribe-expansions/other-tribes-audit.md'].map(file => preview + file)
];
const preserve = [
  'genealogy-images.html', 'assets/genealogy-front-transparent.png', 'assets/genealogy-back-transparent.png',
  'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'family-tree/vendor/echarts.min.js'
];
const files = [...new Set([...runtime, ...source, ...tests, ...documentation])];
const pendingFiles = files.filter(file => !fs.existsSync(path.join(root, file)));
const result = {
  schemaVersion: 1,
  repository: 'panmingzhu0925-png/bible-reading',
  branch: 'main',
  assetVersion: '15',
  generatedAt: new Date().toISOString(),
  purpose: '审核后的发布文件建议；不包含凭据、临时日志或被弃用的家庭卡片设计。',
  publishExecuted: false,
  runtime, source, tests, documentation, preserve, files, pendingFiles,
  notes: [
    '发布前重新读取远端 main HEAD，基于该树创建提交并使用 force:false；此清单不保存或假定旧 HEAD。',
    'preserve 中的既有图片、图标和本地 ECharts 应核对远端 SHA 保持一致，无须为本次更新重新上传。',
    'people-index 仍在生成时 pendingFiles 可能非空；完成后重跑此脚本并补入主代理的新增人物源和审计报告。',
    'check-expanded-tribes.cjs 使用根目录 genealogy-data.js 中独立录入的路加名单作对照，该文件作为测试夹具保留。',
    'combined-preview 仍可独立访问，因此一并保留运行模板及生成 bundle；正式页面读取 family-tree 根目录中的生成文件。',
    '静态与 Mock SW 检查不代表真实 Safari/PWA 安装核验。',
    '发布前去掉 --allow-pending-index 运行 image-work/check-family-integration-v15.cjs。'
  ]
};
fs.mkdirSync(path.join(root, 'output'), { recursive: true });
fs.writeFileSync(path.join(root, 'output/publish-files-v15.json'), JSON.stringify(result, null, 2) + '\n');
console.log(`建议发布 ${files.length} 个文件；保留 ${preserve.length} 个既有文件；待生成 ${pendingFiles.length} 个文件。`);
if (pendingFiles.length) console.log(pendingFiles.join('\n'));
