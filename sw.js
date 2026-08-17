/* 学习台 Service Worker（自毁版）：
   安装即注销自己，不再缓存任何页面/资源。
   目的：彻底解除旧版缓存对多设备同步的锁定，所有请求改走网络，
   保证每台设备每次刷新都能拿到 GitHub Pages 上的最新 index.html。 */
self.addEventListener("install", () => {
  self.skipWaiting();
  // 注销当前注册，让页面之后不再被 Service Worker 控制（直接走网络）
  try { self.registration.unregister(); } catch (e) {}
});
self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});
