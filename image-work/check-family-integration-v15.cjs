'use strict';
// Static and in-process Service Worker checks. This is not a real Safari,
// browser installation, touch gesture or browser-managed cache test.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const base = 'https://panmingzhu0925-png.github.io/bible-reading/';
const allowPendingIndex = process.argv.includes('--allow-pending-index');
const checks = [], pending = new Set();
const report = {
  testKind: 'Static source inspection and in-process Service Worker Mock',
  realBrowserTest: false,
  realSafariTest: false,
  limitations: ['不模拟 Safari 的安装、存储配额、浏览器缓存、进程回收和触摸行为。', '离线结果来自 Mock CacheStorage / Fetch，发布后仍须用真实浏览器核验。'],
  base,
  checkedAt: new Date().toISOString(),
  checks,
};
const check = async (name, run, kind = 'static') => {
  await run(); checks.push({ name, kind, passed: true }); console.log('PASS: ' + name);
};
function localAsset(url) {
  assert.equal(url.origin, new URL(base).origin, url.href);
  assert.ok(url.pathname.startsWith('/bible-reading/'), url.href);
  const relative = decodeURIComponent(url.pathname.slice('/bible-reading/'.length)) || 'index.html';
  const full = path.resolve(root, relative);
  assert.ok(full.startsWith(root + path.sep), relative);
  if (allowPendingIndex && relative.startsWith('people-index/') && !fs.existsSync(full)) {
    pending.add(relative); return;
  }
  assert.ok(fs.existsSync(full) && fs.statSync(full).isFile(), '本地缺少资源：' + relative);
}

(async () => {
  const index = read('index.html'), viewer = read('family-tree/index.html'), app = read('family-tree/app.js');
  const dbContext = { window: {} };
  vm.runInNewContext(read('family-tree/tree-data.js'), dbContext);
  const data = JSON.parse(JSON.stringify(dbContext.window.BIBLE_FAMILY_TREES));
  const keys = Object.keys(data);

  await check('主网页和查看器脚本语法可解析', () => {
    for (const [, script] of index.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(script);
    for (const file of ['family-tree/app.js', 'family-tree/compact-layout.js', 'family-tree/tree-data.js', 'sw.js']) new vm.Script(read(file), { filename: file });
  });
  await check('主网页七个家谱入口、人物列表与历史分组保留', () => {
    for (const key of ['adam', 'noah', 'abraham', 'tribes', 'judah', 'luke', 'original']) assert.ok(index.includes(`data-genealogy="${key}"`), key);
    for (const id of ['peopleList', 'peopleTree', 'peopleSearch', 'peopleEra']) assert.ok(index.includes(`id="${id}"`), id);
    assert.ok(index.includes('按历史时期展开'));
    assert.ok(index.includes('./genealogy-images.html'));
    assert.ok(index.includes('./people-index/index.html'));
    assert.ok(index.includes('尚不能称为全圣经人物全集'));
    const match = /const genealogyViews=(\{[\s\S]*?\n\});/.exec(index);
    assert.ok(match, '家谱入口映射可读取');
    const views = vm.runInNewContext('(' + match[1] + ')');
    const mapping = { adam: 'adam-noah', noah: 'noah-abraham', abraham: 'abraham-jacob', tribes: 'jacob-tribes', judah: 'judah-jesus', luke: 'judah-luke' };
    for (const [key, tree] of Object.entries(mapping)) {
      const url = new URL(views[key].url, base + 'index.html');
      assert.equal(url.searchParams.get('tree'), tree); assert.ok(data[tree]); localAsset(url);
    }
    localAsset(new URL(views.original.url, base));
  });
  await check('17套资料、所有跨页人物和节点端点有效', () => {
    assert.equal(keys.length, 17);
    assert.equal(data['adam-noah'].nodes.length, 27);
    assert.equal(data['noah-abraham'].nodes.length, 110);
    assert.deepEqual(data['abraham-jacob'].mainPath, ['abraham', 'isaac', 'jacob']);
    assert.equal(data['judah-jesus'].mainPath.length, 42);
    assert.equal(data['judah-luke'].mainPath.length, 53);
    for (const [key, db] of Object.entries(data)) {
      const ids = new Set(db.nodes.map(n => n.id)); assert.equal(ids.size, db.nodes.length, key);
      for (const node of db.nodes) {
        for (const field of ['fatherId', 'treeParentId', 'originFatherId']) if (node[field]) assert.ok(ids.has(node[field]), key + ':' + node.id + ':' + field);
        for (const link of node.crossPageLinks || []) {
          assert.ok(data[link.tree], key + ':' + node.id + ' → ' + link.tree);
          assert.ok(data[link.tree].nodes.some(n => n.id === link.personId), key + ':' + node.id + ' → ' + link.personId);
        }
      }
      for (const relation of db.relations) assert.ok(ids.has(relation.source) && ids.has(relation.target), key);
    }
  });
  await check('竖向全展开、十二支派与两份福音家谱导航保留', () => {
    assert.match(viewer, /value="TB" selected/); assert.match(viewer, /id="all" class="active"/);
    assert.match(app, /direction = 'TB'/); assert.match(app, /const expanded = new Set\(db.nodes.map\(n=>n.id\)\)/);
    for (const id of ['tribeNav', 'tribePicker', 'gospelNav', 'maternalGuide', 'branchScope']) assert.ok(viewer.includes(`id="${id}"`), id);
    assert.ok(viewer.includes('../genealogy-images.html'));
    for (const key of ['judah-jesus', 'judah-luke']) {
      const db = data[key]; assert.equal(db.nodes.find(n => n.id === 'mary').fatherId, null);
      assert.equal(db.nodes.find(n => n.id === 'jesus').lineageKind, 'household');
      assert.ok(db.maryNathanGuide.boundary.includes('没有直接写出'));
    }
  });
  await check('GitHub Pages子路径和查询版本的所有本地页面依赖存在', () => {
    for (const [file, html] of [['index.html', index], ['family-tree/index.html', viewer]]) {
      for (const [, asset] of html.matchAll(/(?:src|href)="((?:\.\/|\.\.\/)[^"]+)"/g)) localAsset(new URL(asset.replace(/&amp;/g, '&'), base + file));
    }
    assert.ok(!viewer.includes('https://cdn'));
    const css = read('family-tree/style.css'); assert.ok(css.startsWith("@import url('./app.css?v=15');"));
    localAsset(new URL('./app.css?v=15', base + 'family-tree/style.css'));
    for (const asset of ['style.css', 'app.js', 'compact-layout.js', 'tree-data.js']) assert.ok(viewer.includes(`./${asset}?v=15`), asset);
    assert.ok(!viewer.includes('./data.js?'));
    const manifest = JSON.parse(read('manifest.webmanifest'));
    assert.equal(new URL(manifest.start_url, base + 'manifest.webmanifest').href, base);
    assert.equal(new URL(manifest.scope, base + 'manifest.webmanifest').href, base);
  });

  const listeners = {}, store = new Map(), added = [], fetchCalls = [];
  const urlOf = request => typeof request === 'string' ? request : request.url;
  const bare = url => { const parsed = new URL(url); parsed.search = ''; parsed.hash = ''; return parsed.href; };
  function cacheFor(name) {
    if (!store.has(name)) store.set(name, new Map());
    const items = store.get(name);
    return {
      async addAll(requests) { for (const request of requests) { added.push(request); items.set(request.url, new Response(request.url)); } },
      async put(request, response) { items.set(urlOf(request), response.clone()); },
      async match(request, options = {}) {
        const url = urlOf(request), exact = items.get(url);
        if (exact) return exact.clone();
        if (options.ignoreSearch) for (const [candidate, response] of items) if (bare(candidate) === bare(url)) return response.clone();
        return undefined;
      }
    };
  }
  let networkFails = false;
  const context = { URL, Request, Response,
    self: { location: { href: base + 'sw.js', origin: new URL(base).origin }, registration: { scope: base }, clients: { async claim() {} }, async skipWaiting() {}, addEventListener: (name, fn) => { listeners[name] = fn; } },
    caches: { async open(name) { return cacheFor(name); }, async keys() { return [...store.keys()]; }, async delete(name) { return store.delete(name); } },
    fetch: async (request, options) => { fetchCalls.push({ url: urlOf(request), options }); if (networkFails) throw new Error('Mock offline'); return new Response('fresh online'); }
  };
  vm.runInNewContext(read('sw.js') + '\nglobalThis.testCacheName=CACHE;', context);
  async function lifecycle(name) { let work; listeners[name]({ waitUntil: promise => { work = promise; } }); assert.ok(work, name); await work; }
  async function request(url, mode = 'navigate', method = 'GET') {
    let result; listeners.fetch({ request: { url, mode, method }, respondWith: promise => { result = promise; } }); return result && await result;
  }
  await check('SW Mock安装：v15预缓存完整且每个资源文件存在', async () => {
    assert.match(context.testCacheName, /^bible-reading-v15-/);
    await lifecycle('install');
    const required = ['index.html', 'family-tree/index.html', 'family-tree/style.css?v=15', 'family-tree/app.css?v=15', 'family-tree/app.js?v=15', 'family-tree/compact-layout.js?v=15', 'family-tree/tree-data.js?v=15', 'family-tree/vendor/echarts.min.js', 'people-index/index.html', 'people-index/app.css?v=15', 'people-index/app.js?v=15', 'people-index/data.js?v=15', 'people-data.js?v=15', 'genealogy-images.html', 'assets/genealogy-front-transparent.png', 'assets/genealogy-back-transparent.png'];
    for (const asset of required) assert.ok(added.some(request => request.url === base + asset), asset);
    for (const asset of added) { assert.equal(asset.cache, 'reload'); localAsset(new URL(asset.url)); }
    assert.ok(!added.some(asset => /[?&]v=14(?:&|$)/.test(asset.url)));
  }, 'Service Worker Mock');
  await check('SW Mock激活：只清理本应用旧缓存，保留别站缓存', async () => {
    store.set('bible-reading-v14-old', new Map()); store.set('other-app', new Map()); store.set('other-bible-reading-data', new Map());
    await lifecycle('activate');
    assert.ok(!store.has('bible-reading-v14-old')); assert.ok(store.has(context.testCacheName));
    assert.ok(store.has('other-app')); assert.ok(store.has('other-bible-reading-data'));
  }, 'Service Worker Mock');
  await check('SW Mock离线：17视图及人物查询回退到预缓存查看器', async () => {
    networkFails = true;
    for (const tree of keys) {
      const person = data[tree].rootId;
      const url = base + 'family-tree/index.html?tree=' + tree + '&person=' + person + '&family=' + person + '&embed=1&explain=mary';
      assert.equal(await (await request(url)).text(), base + 'family-tree/index.html', tree);
    }
    assert.equal(await (await request(base + 'index.html?view=people')).text(), base + 'index.html');
    assert.equal(await (await request(base + 'genealogy-images.html?side=back&embed=1')).text(), base + 'genealogy-images.html');
    assert.equal(await (await request(base + 'people-index/index.html?q=马利亚')).text(), base + 'people-index/index.html');
    assert.equal(await (await request(base + 'not-yet-cached.html')).text(), base + 'index.html');
  }, 'Service Worker Mock');
  await check('SW Mock缓存优先资源：v15脚本和样式离线命中', async () => {
    const count = fetchCalls.length;
    for (const asset of ['style.css', 'app.css', 'app.js', 'compact-layout.js', 'tree-data.js']) assert.equal(await (await request(base + 'family-tree/' + asset + '?v=15', 'cors')).text(), base + 'family-tree/' + asset + '?v=15');
    assert.equal(fetchCalls.length, count, '预缓存命中后不调用网络');
  }, 'Service Worker Mock');
  await check('SW Mock请求隔离：其他源、其他Pages项目及POST不被接管', async () => {
    for (const url of ['https://other.example/app', new URL(base).origin + '/other-project/index.html', new URL(base).origin + '/bible-reading-other/index.html']) assert.equal(await request(url), undefined);
    assert.equal(await request(base + 'index.html', 'navigate', 'POST'), undefined);
  }, 'Service Worker Mock');
  await check('SW Mock导航网络优先，并在随后离线时返回最近成功结果', async () => {
    networkFails = false;
    const url = base + 'family-tree/index.html?tree=tribe-levi&person=moses';
    assert.equal(await (await request(url)).text(), 'fresh online');
    assert.equal(fetchCalls.at(-1).options.cache, 'no-cache');
    networkFails = true;
    assert.equal(await (await request(url)).text(), 'fresh online');
  }, 'Service Worker Mock');
  report.passed = true;
  report.pendingFiles = [...pending];
  report.complete = pending.size === 0;
  if (pending.size) console.log('PENDING: 人物索引尚在生成，发布前须去掉 --allow-pending-index 重新检查：' + [...pending].join(', '));
  console.log(`\n${checks.length} 组静态 / Mock 整合检查通过。此结果不代表真实 Safari 验证。`);
})().catch(error => {
  report.passed = false; report.complete = false; report.error = error.stack;
  console.error(error); process.exitCode = 1;
}).finally(() => {
  fs.mkdirSync(path.join(root, 'output'), { recursive: true });
  fs.writeFileSync(path.join(root, 'output/integration-v15-report.json'), JSON.stringify(report, null, 2) + '\n');
});
