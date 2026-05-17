// src/sw.ts
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;
declare const clients: Clients;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

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
    })(),
  );
  if ("setAppBadge" in self) {
    (
      self as unknown as ServiceWorkerGlobalScope & {
        setAppBadge: (n?: number) => Promise<void>;
      }
    )
      .setAppBadge()
      .catch(() => {});
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if ("clearAppBadge" in self) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (self as any).clearAppBadge().catch(() => {});
  }
  event.waitUntil(clients.openWindow(event.notification.data ?? "/"));
});
