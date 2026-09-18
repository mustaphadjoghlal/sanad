importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// The Firebase config arrives in the registration URL's query string.
//
// It has to be read here, at the top level, and not from a postMessage: the
// browser starts this worker from scratch to deliver a push while the site is
// closed, and in that moment there is no page around to send it anything. The
// registration URL — query string included — is persisted by the browser, so
// reading it here is what makes background notifications work at all.
function readConfig() {
  const params = new URLSearchParams(self.location.search);
  const config = {
    apiKey: params.get('apiKey'),
    projectId: params.get('projectId'),
    messagingSenderId: params.get('messagingSenderId'),
    appId: params.get('appId'),
  };
  return config.apiKey && config.projectId && config.messagingSenderId && config.appId
    ? config
    : null;
}

const firebaseConfig = readConfig();

if (firebaseConfig) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const { title, body, icon } = payload.notification ?? {};
    self.registration.showNotification(title ?? 'سند', {
      body: body ?? '',
      icon: icon ?? '/icon-192.png',
      badge: '/icon-192.png',
      dir: 'rtl',
      lang: 'ar',
      data: payload.data,
    });
  });
} else {
  console.warn('[sanad-sw] Firebase config missing from the registration URL.');
}

// Take over as soon as an updated worker is installed, so a config fix does
// not wait for every tab to close.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link;
  // Only ever navigate within the site — a notification must not be able to
  // send someone to an arbitrary origin.
  const path = typeof link === 'string' && link.startsWith('/') ? link : '/';
  const url = new URL(path, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
