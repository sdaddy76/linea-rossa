/* Linea Rossa · avvisi "tocca a te". Riceve le notifiche push inviate dal server di gioco. */
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data && event.data.text() }; }
  event.waitUntil(self.registration.showNotification(data.title || 'Linea Rossa', {
    body: data.body || 'Tocca a te.', icon: '/favicon.ico', badge: '/favicon.ico',
    tag: data.gameId ? 'turno-' + data.gameId : 'turno', renotify: true, data: { url: data.url || '/' },
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const client of list) if ('focus' in client) return client.focus();
    return self.clients.openWindow(url);
  }));
});
