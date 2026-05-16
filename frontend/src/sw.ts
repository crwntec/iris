// src/sw.ts
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;
declare const clients: Clients;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

async function getBadgeCount(): Promise<number> {
  try {
    const cache = await caches.open("badge-cache");
    const response = await cache.match("badge-count");
    if (response) {
      const text = await response.text();
      return parseInt(text, 10) || 0;
    }
  } catch {
    // Cache nicht verfügbar
  }
  return 0;
}

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    (async () => {
      self.registration.showNotification(data.title ?? "IRIS", {
        body: data.body,
        icon: "/android/launchericon-192x192.png",
        badge: "/android/launchericon-192x192.png",
        data: data.url,
      });
      if ("setAppBadge" in navigator) {
        try {
          const curr = await getBadgeCount();
          await navigator.setAppBadge(curr + 1);
        } catch (e) {
          console.error("Failed to set badge:", e);
        }
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if ("clearAppBadge" in navigator) {
    event.waitUntil(navigator.clearAppBadge());
  }
  event.waitUntil(clients.openWindow(event.notification.data ?? "/"));
});
