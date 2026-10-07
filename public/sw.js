// Service worker de notificaciones push (Firebase Cloud Messaging).
// Muestra la notificación aunque la página esté cerrada y abre el portal al tocarla.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { data: { body: event.data ? event.data.text() : '' } };
  }
  const d = { ...(payload.notification || {}), ...(payload.data || {}) };

  event.waitUntil(
    self.registration.showNotification(d.title || 'Ayuda TI', {
      body: d.body || '',
      icon: d.icon || '/img/4.jpg',
      image: d.image || undefined,
      tag: d.tag || undefined,
      renotify: Boolean(d.tag),
      vibrate: [120, 60, 120],
      data: { url: d.url || '/portal' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/portal', self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const open = windows.find((c) => c.url.startsWith(self.location.origin));
      if (open) {
        await open.focus();
        if ('navigate' in open) return open.navigate(url);
        return;
      }
      return self.clients.openWindow(url);
    })(),
  );
});
