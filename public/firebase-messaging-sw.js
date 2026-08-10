importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCYR5VsDWlrYYm2Q2UnMlN5xt2y_b8b1x0',
  authDomain: 'studio-7483951484-e5df7.firebaseapp.com',
  projectId: 'studio-7483951484-e5df7',
  storageBucket: 'studio-7483951484-e5df7.firebasestorage.app',
  messagingSenderId: '874741046212',
  appId: '1:874741046212:web:bc2a564da9e34cebae2291',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.data?.title || payload.notification?.title || 'NDC Preschool Church';
  const body = payload.data?.body || payload.notification?.body || 'New chat message';
  const url = payload.data?.url || '/chat';
  const badgeCount = Number.parseInt(payload.data?.badge || '0', 10);

  if ('setAppBadge' in navigator) {
    if (badgeCount > 0) {
      navigator.setAppBadge(badgeCount).catch(() => {});
    } else {
      navigator.clearAppBadge().catch(() => {});
    }
  }

  self.registration.showNotification(title, {
    body,
    icon: payload.data?.icon || '/icons/icon-192.png',
    badge: '/icons/icon-48.png',
    tag: payload.data?.tag || 'ndcpc-notification',
    data: { url },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/chat';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
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
