// FarmTwin AI PWA Background Service Worker
// Enables notifications even when the app is closed, minimized, or phone screen is locked.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for background push events
self.addEventListener("push", (event) => {
  let data = {
    title: "🌱 FarmTwin AI Alert",
    body: "New urgent crop or microclimate threat detected on your farm.",
    tag: "farmtwin-push",
    url: "/alerts",
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: [200, 100, 200],
    tag: data.tag || "farmtwin-alert",
    renotify: true,
    requireInteraction: true,
    data: { url: data.url || "/alerts" },
    actions: [
      { action: "explore", title: "🚨 View Alert" },
      { action: "close", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// When user clicks the background notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/alerts";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Allow webpage to communicate with SW
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    self.registration.showNotification(event.data.title, event.data.options);
  }
});
