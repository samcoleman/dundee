/* eslint-disable no-undef */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('notificationclick', async function (event) {

  //Closes the notification
  event.notification.close();

  //Looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients
      .matchAll()
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client && client.url.includes('dash')) {
            client.postMessage({reply: event.reply, action: event.action, data: event.notification.data});
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow("/dash");
      })
  );
});

console.info(
  "[next-service-worker] This is a noop service worker for local development. This ensures that a previously installed service worker is ejected. Your configured service worker will be generated in production builds. If you want to inspect the production service worker locally, you can run `next build` followed by `next start`. Alternatively, you can opt into production service worker generation in local development by setting `serviceWorker.enableInDevelopment: true` in your next.config.js. See https://github.com/tatethurston/next-service-worker for configuration options."
);