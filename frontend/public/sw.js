self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'سجل المواد';
  const options = {
    body: data.message || 'تعديل جديد في الأسعار أو المواد',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    dir: 'rtl',
    vibrate: [300, 100, 300, 100, 300],
    renotify: true,
    requireInteraction: true,
    silent: false,
    tag: Date.now().toString(),
    data: data,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
