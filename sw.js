// ============================================================
// ACADEMIC CALENDAR
// PWA SERVICE WORKER + FIREBASE CLOUD MESSAGING
// ============================================================

// ------------------------------------------------------------
// FIREBASE CONFIGURATION
// ------------------------------------------------------------

importScripts(
  'https://www.gstatic.com/firebasejs/12.3.0/firebase-app-compat.js'
);

importScripts(
  'https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: "AIzaSyCv60MSfO9ScTsSUwKYrE_vWPRda9frLGA",
  authDomain: "academic-calendar-4031f.firebaseapp.com",
  projectId: "academic-calendar-4031f",
  storageBucket: "academic-calendar-4031f.firebasestorage.app",
  messagingSenderId: "753448578557",
  appId: "1:753448578557:web:f89f3a9db31ee58ec07d94"
});

const messaging = firebase.messaging();


// ------------------------------------------------------------
// FIREBASE BACKGROUND NOTIFICATIONS
// ------------------------------------------------------------

messaging.onBackgroundMessage((payload) => {

  console.log(
    '[Firebase Messaging] Background message:',
    payload
  );

  const notificationTitle =
    payload.notification?.title ||
    payload.data?.title ||
    'Academic Calendar';

  const notificationOptions = {

    body:
      payload.notification?.body ||
      payload.data?.body ||
      'You have a new academic calendar notification.',

    icon: './icons/icon-192.png',

    badge: './icons/icon-192.png',

    data: payload.data || {}

  };

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});


// ------------------------------------------------------------
// PWA CACHE
// ------------------------------------------------------------

const CACHE = 'academic-calendar-v3';

const ASSETS = [
  './',
  './index.html',
  './style.css?v=2',
  './app.js?v=2',
  './notifications.js?v=4',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];


// ------------------------------------------------------------
// INSTALL
// ------------------------------------------------------------

self.addEventListener('install', (event) => {

  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );

  self.skipWaiting();

});


// ------------------------------------------------------------
// ACTIVATE
// ------------------------------------------------------------

self.addEventListener('activate', (event) => {

  event.waitUntil(

    caches.keys().then((keys) => {

      return Promise.all(

        keys
          .filter((key) => key !== CACHE)
          .map((key) => caches.delete(key))

      );

    })

  );

  self.clients.claim();

});


// ------------------------------------------------------------
// FETCH / OFFLINE CACHE
// ------------------------------------------------------------

self.addEventListener('fetch', (event) => {

  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(

    fetch(event.request)

      .then((response) => {

        const copy = response.clone();

        caches.open(CACHE).then((cache) => {
          cache.put(event.request, copy);
        });

        return response;

      })

      .catch(() => {

        return caches.match(event.request);

      })

  );

});
