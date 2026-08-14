/* 学习台 Service Worker：缓存静态资源，断网也能打开；联网自动更新 */
const CACHE = "desk-v0814";
const ASSETS = [
  "./",
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
