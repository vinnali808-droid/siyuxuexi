/* 学习台 Service Worker（离线可用版 v2）：
   network-first：在线时永远请求网络（始终拿到最新版本，不挡更新），
   断网/超时时用上次成功缓存的页面兜底 → 离线也能打卡，恢复网络后自动同步。 */
const CACHE = "siyuxuexi-v2";
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(["./","index.html"])).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if(req.method!=="GET") return;
  let url;
  try{ url = new URL(req.url); }catch(err){ return; }
  if(url.origin!==location.origin) return;   // 不拦截跨域（Supabase API、CDN 等）
  e.respondWith((async()=>{
    const cache = await caches.open(CACHE);
    try{
      const fresh = await fetch(req);
      if(fresh && fresh.ok) cache.put(req, fresh.clone());
      return fresh;
    }catch(err){
      const cached = await cache.match(req, {ignoreSearch:true});
      if(cached) return cached;
      const idx = await cache.match("./index.html");
      if(idx) return idx;
      throw err;
    }
  })());
});
