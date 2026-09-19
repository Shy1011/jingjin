/* 自我精进 · Service Worker
 *
 * 作用：把整个应用缓存到手机本地，断网也能打开。
 *
 * ★ 每次修改 index.html 之后，请把下面的 VERSION 改一下（例如 v1 → v2）。
 *   不改的话，手机可能一直用着旧版本的缓存。
 */

const VERSION = 'v3';
const CACHE = 'zwjj-' + VERSION;

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
];

// 安装：预缓存资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.all(ASSETS.map((url) => cache.add(url).catch(() => null)))
      )
      .then(() => self.skipWaiting())
  );
});

// 激活：清掉旧版本缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 页面导航：先用缓存保证秒开，同时后台拉新版本写回缓存（下次打开即新版）
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached =
          (await cache.match('./index.html')) || (await cache.match('./'));
        const network = fetch(req)
          .then((res) => {
            if (res && res.ok) cache.put('./index.html', res.clone());
            return res;
          })
          .catch(() => null);
        const res = cached || (await network);
        return (
          res ||
          new Response('离线中，且本地没有缓存副本。', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        );
      })
    );
    return;
  }

  // 其它同源静态资源：缓存优先，后台更新
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      return cached || (await network) || new Response('', { status: 504 });
    })
  );
});
