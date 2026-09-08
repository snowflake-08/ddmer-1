/* 浏览器订阅 Service Worker：负责接收推送并弹出系统通知 */
/* eslint-disable */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = {};
    }
  }

  const title = data.title || "站点更新";
  const options = {
    body: data.body || "网站有新内容，快来看看吧",
    data: { url: data.url || "/" },
    tag: "site-update",
    renotify: true
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const origin = new URL("/", self.registration.scope).origin;
  const target = new URL(
    (event.notification.data && event.notification.data.url) || "/",
    origin
  ).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });
      for (const client of windows) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin !== origin) continue;
        try {
          await client.navigate(target);
          await client.focus();
          return;
        } catch {
          // 该标签页不可导航，继续尝试其他标签页
        }
      }
      await self.clients.openWindow(target);
    })()
  );
});
