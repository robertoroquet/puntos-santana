// Guarda la app en el teléfono para que abra rápido; los datos siempre se piden en línea.
const CACHE = 'ps-v45';
const ARCHIVOS = ['./', 'index.html', 'styles.css', 'app.js', 'config.js', 'santana-logo.jpg', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); return r; }).catch(() => caches.match(e.request)));
});

// Notificaciones push de Puntos Santana
self.addEventListener('push', (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Puntos Santana', {
    body: d.body || '', image: d.image || undefined, icon: 'icon-192.png', badge: 'icon-192.png', data: { url: d.url || './#/mensajes' }, tag: 'ps-' + Date.now()
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './#/mensajes', self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ws) => {
    for (const w of ws) { if ('focus' in w) { w.navigate(url); return w.focus(); } }
    return clients.openWindow(url);
  }));
});
