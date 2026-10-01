// ============================================================
// ACADEMIC CALENDAR PWA SERVICE WORKER
// Firebase Cloud Messaging enabled
// ============================================================


// ------------------------------------------------------------
// FIREBASE
// ------------------------------------------------------------

importScripts(
  'https://www.gstatic.com/firebasejs/12.3.0/firebase-app-compat.js'
);

importScripts(
  'https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging-compat.js'
);


// ------------------------------------------------------------
// FIREBASE CONFIGURATION
// ------------------------------------------------------------

firebase.initializeApp({

  apiKey: "AIzaSyCv60MSf09ScTsSUwKYrE_vWPRda9frLGA",

  authDomain:
    "academic-calendar-4031f.firebaseapp.com",

  projectId:
    "academic-calendar-4031f",

  storageBucket:
    "academic-calendar-4031f.firebasestorage.app",

  messagingSenderId:
    "753448578557",

  appId:
    "1:753448578557:web:f89f3a9db31ee58ec07d94"

});


// ------------------------------------------------------------
// FIREBASE MESSAGING
// ------------------------------------------------------------

const messaging = firebase.messaging();


// ------------------------------------------------------------
// PWA CACHE
// ------------------------------------------------------------

const CACHE = 'academic-calendar-v3';


const ASSETS = [

  './',

  './index.html',

  './style.css?v=2',

  './app.js?v=2',

  './notifications.js?v=3',

  './manifest.json',

  './icons/icon-192.png',

  './icons/icon-512.png'

];


// ------------------------------------------------------------
// INSTALL
// ------------------------------------------------------------

self.addEventListener(
  'install',
  event => {

    event.waitUntil(

      caches
        .open(CACHE)
        .then(cache => cache.addAll(ASSETS))

    );

    self.skipWaiting();

  }
);


// ------------------------------------------------------------
// ACTIVATE
// ------------------------------------------------------------

self.addEventListener(
  'activate',
  event => {

    event.waitUntil(

      caches
        .keys()
        .then(keys =>

          Promise.all(

            keys

              .filter(

                key =>
                  key.startsWith('academic-calendar-') &&
                  key !== CACHE

              )

              .map(
                key => caches.delete(key)
              )

          )

        )

    );

    self.clients.claim();

  }
);


// ------------------------------------------------------------
// FETCH
// ------------------------------------------------------------

self.addEventListener(
  'fetch',
  event => {

    if (

      event.request.method !== 'GET' ||

      new URL(event.request.url).origin !==
        self.location.origin

    ) {

      return;

    }


    event.respondWith(

      fetch(event.request)

        .then(response => {

          if (response.ok) {

            const copy = response.clone();

            caches
              .open(CACHE)
              .then(cache => {

                cache.put(
                  event.request,
                  copy
                );

              });

          }

          return response;

        })

        .catch(

          () =>
            caches.match(event.request)

        )

    );

  }
);
