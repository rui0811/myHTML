/* 启动主页 Service Worker
 * 1) 页面本体：先给缓存、后台更新（下次打开就是新版）
 * 2) 快捷方式图标（跨域 favicon）：缓存 7 天，最多 80 个
 * 发新版时：改下面的 VERSION 即可。所有路径都是相对路径，GitHub Pages 子路径也能用。
 */
const VERSION = 'v1';
const APP_CACHE = 'app-' + VERSION;
const ICON_CACHE = 'favicons';          // 图标缓存不随版本清空
const META_CACHE = 'favicons-meta';     // 记录每个图标的缓存时间
const ICON_TTL = 7 * 24 * 3600 * 1000;
const ICON_MAX = 80;

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-64.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(APP_CACHE)
      .then(c => Promise.all(PRECACHE.map(u =>
        c.add(new Request(u, { cache: 'reload' })).catch(err => {
          // 页面本体必须成功；图标等缺了不影响安装
          if (u === './' || u === './index.html') throw err;
        }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(k => k.startsWith('app-') && k !== APP_CACHE)
        .map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // 同源：页面和自身资源
  if (url.origin === self.location.origin) {
    e.respondWith(appResponse(e, req));
    return;
  }
  // 跨域图片：快捷方式的 favicon
  if (req.destination === 'image') {
    e.respondWith(iconResponse(e, req));
  }
  // 其他跨域请求：不拦截
});

/* ---------- 页面本体：stale-while-revalidate ---------- */
async function appResponse(e, req) {
  const cache = await caches.open(APP_CACHE);
  const key = req.mode === 'navigate' ? './index.html' : req;
  const cached = await cache.match(key, { ignoreSearch: true });

  // 导航请求统一去取 ./index.html，避免目录重定向（opaqueredirect）影响缓存
  const target = req.mode === 'navigate' ? new Request('./index.html', { cache: 'no-cache' })
                                         : new Request(req, { cache: 'no-cache' });
  const update = fetch(target).then(res => {
    if (res && res.ok) cache.put(key, res.clone());
    return res;
  });

  if (cached) {
    e.waitUntil(update.catch(() => {}));   // 后台更新，失败（离线）就算了
    return cached;
  }
  try {
    return await update;
  } catch (err) {
    return (await cache.match('./index.html')) || Response.error();
  }
}

/* ---------- favicon：缓存优先，过期后后台刷新 ---------- */
const metaKey = u => new Request(self.registration.scope + '__t/' + encodeURIComponent(u));

async function iconResponse(e, req) {
  const [icons, meta] = await Promise.all([caches.open(ICON_CACHE), caches.open(META_CACHE)]);
  const cached = await icons.match(req.url);

  const refresh = async () => {
    const res = await fetch(req);
    // opaque（跨域 no-cors）看不到状态码，只能收；能看到状态时只收 200
    if (res.type === 'opaque' || res.ok) {
      await icons.put(req.url, res.clone());
      await meta.put(metaKey(req.url), new Response(String(Date.now())));
      trim(icons, meta);
    }
    return res;
  };

  if (cached) {
    const t = await meta.match(metaKey(req.url)).then(r => (r ? r.text() : '0'));
    if (Date.now() - Number(t) > ICON_TTL) e.waitUntil(refresh().catch(() => {}));
    return cached;
  }
  try {
    return await refresh();
  } catch (err) {
    return Response.error();   // 页面会走原来的“换下一个源 / 首字母占位”
  }
}

async function trim(icons, meta) {
  const keys = await icons.keys();
  for (let i = 0; i < keys.length - ICON_MAX; i++) {   // 最早缓存的先删
    await icons.delete(keys[i]);
    await meta.delete(metaKey(keys[i].url));
  }
}
