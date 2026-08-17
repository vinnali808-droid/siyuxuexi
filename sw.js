/* 学习台 Service Worker：图片离线缓存；HTML 永远走网络拿最新，保证多设备同步版本一致 */
const CACHE = "desk-v0817";
const ASSETS = [
  "oc_xianyang_q.png",
  "oc_xianyang_full.png",
  "manifest.webmanifest"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // 不缓存跨域 API / CDN：云端同步需实时，且 PUT 写入不能走缓存
  if (url.hostname.includes("api.github.com") || url.hostname.includes("cdn.jsdelivr.net") || e.request.method !== "GET") {
    return; // 交给浏览器正常网络请求
  }
  // HTML 文档（导航请求 / .html / 根路径）：network-first，保证永远拿到线上最新版，
  // 多设备同步时不会卡在旧 Service Worker 缓存里
  const isHtml = e.request.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname === "/";
  if (isHtml) {
    e.respondWith(
      fetch(e.request).then((resp) => {
        const cp = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, cp).catch(() => {}));
        return resp;
      }).catch(() => caches.match(e.request).then((r) => r || caches.match("./")))
    );
    return;
  }
  // 其余静态资源（图片等）：cache-first，断网也能显示
  e.respondWith(
    caches.match(e.request).then((r) =>
      r || fetch(e.request).then((resp) => {
        const cp = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, cp).catch(() => {}));
        return resp;
      }).catch(() => caches.match("./"))
    )
  );
});
