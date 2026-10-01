// ============================================================
// ACADEMIC CALENDAR
// FIREBASE PUSH NOTIFICATIONS
// ============================================================

import {
  initializeApp
} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';

import {
  getMessaging,
  getToken,
  onMessage,
  isSupported
} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging.js';


// ------------------------------------------------------------
// FIREBASE CONFIGURATION
// ------------------------------------------------------------

const firebaseConfig = {

  apiKey:
    "AIzaSyCv60MSfO9ScTsSUwKYrE_vWPRda9frLGA",

  authDomain:
    "academic-calendar-4031.firebaseapp.com",

  projectId:
    "academic-calendar-4031",

  storageBucket:
    "academic-calendar-4031.firebasestorage.app",

  messagingSenderId:
    "753448578557",

  appId:
    "1:753448578557:web:f89f3a9db31ee58ec07d94"

};


// ------------------------------------------------------------
// VAPID PUBLIC KEY
// ------------------------------------------------------------

const VAPID_KEY =
  "BNo-srVlmeBJE_1XoRKiThGSEJiUaCC55XDWhcmKZZlYvl99qWx0gY47CZw_1Gs-Pslkrl6cQWDLLwMvUrHKs6k";


// ------------------------------------------------------------
// INITIALIZE FIREBASE
// ------------------------------------------------------------

const app = initializeApp(firebaseConfig);


// ------------------------------------------------------------
// UI HELPERS
// ------------------------------------------------------------

const btn = document.getElementById('notifyBtn');


function status(message) {

  console.log(
    '[Notifications]',
    message
  );

  if (typeof showToast === 'function') {

    showToast(message);

  } else {

    alert(message);

  }

}


// ------------------------------------------------------------
// TOKEN PANEL
// ------------------------------------------------------------

const panel = document.createElement('div');

panel.id = 'fcmTokenPanel';

panel.hidden = true;

panel.style.cssText =
  'margin:12px auto;' +
  'padding:12px;' +
  'max-width:900px;' +
  'border:1px solid #d1d5db;' +
  'border-radius:10px;';


panel.innerHTML = `

  <strong>Firebase FCM test token</strong>

  <p style="font-size:12px">

    This token is private to this device/browser.
    Use it only for Firebase Console testing.
    Do not publish or share it.

  </p>

  <textarea
    id="fcmTokenBox"
    readonly
    style="
      width:100%;
      min-height:75px;
      box-sizing:border-box;
    "
  ></textarea>

  <br><br>

  <button
    type="button"
    id="copyFcmToken"
  >
    Copy token
  </button>

`;

document.querySelector('main')?.prepend(panel);


// ------------------------------------------------------------
// COPY TOKEN
// ------------------------------------------------------------

document
  .getElementById('copyFcmToken')
  ?.addEventListener('click', async () => {

    const token =
      document.getElementById('fcmTokenBox').value;

    try {

      await navigator.clipboard.writeText(token);

      status('FCM token copied.');

    } catch {

      document
        .getElementById('fcmTokenBox')
        .select();

      status(
        'Select the token and copy it manually.'
      );

    }

  });


// ------------------------------------------------------------
// ENABLE NOTIFICATIONS
// ------------------------------------------------------------

async function enableNotifications() {

  if (!btn) {
    console.error(
      '[Notifications] notifyBtn was not found.'
    );
    return;
  }

  btn.disabled = true;

  try {

    // --------------------------------------------------------
    // CHECK SUPPORT
    // --------------------------------------------------------

    if (
      !('serviceWorker' in navigator) ||
      !('Notification' in window)
    ) {

      throw new Error(
        'This browser does not support web push notifications.'
      );

    }


    const supported =
      await isSupported();

    if (!supported) {

      throw new Error(
        'Firebase Cloud Messaging is not supported in this browser.'
      );

    }


    // --------------------------------------------------------
    // REQUEST PERMISSION
    // --------------------------------------------------------

    const permission =
      await Notification.requestPermission();

    if (permission !== 'granted') {

      throw new Error(
        'Notification permission was not granted.'
      );

    }


    console.log(
      '[Notifications] Permission granted.'
    );


    // --------------------------------------------------------
    // USE EXISTING PWA SERVICE WORKER
    // --------------------------------------------------------

    const registration =
      await navigator.serviceWorker.register(
        './sw.js'
      );


    console.log(
      '[Notifications] Service worker registered:',
      registration
    );


    await navigator.serviceWorker.ready;


    console.log(
      '[Notifications] Service worker ready.'
    );


    // --------------------------------------------------------
    // INITIALIZE FIREBASE MESSAGING
    // --------------------------------------------------------

    const messaging =
      getMessaging(app);


    // --------------------------------------------------------
    // GET FCM REGISTRATION TOKEN
    // --------------------------------------------------------

    const token =
      await getToken(

        messaging,

        {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration
        }

      );


    if (!token) {

      throw new Error(
        'Firebase did not return an FCM registration token.'
      );

    }


    console.log(
      '[Notifications] FCM registration token:',
      token
    );


    // --------------------------------------------------------
    // SHOW TOKEN
    // --------------------------------------------------------

    document
      .getElementById('fcmTokenBox')
      .value = token;


    document
      .getElementById('fcmTokenPanel')
      .hidden = false;


    btn.textContent =
      'Notifications Enabled';


    status(
      'Notifications enabled. Your FCM token is ready for testing.'
    );


    // --------------------------------------------------------
    // FOREGROUND MESSAGE HANDLER
    // --------------------------------------------------------

    onMessage(
      messaging,
      (payload) => {

        console.log(
          '[Notifications] Foreground message:',
          payload
        );


        const title =
          payload.notification?.title ||
          'Academic Calendar';


        const body =
          payload.notification?.body ||
          'You have a new notification.';


        status(
          `${title}: ${body}`
        );

      }
    );


  } catch (error) {

    console.error(
      '[Notifications] Error:',
      error
    );


    status(
      error?.message ||
      'Could not enable notifications.'
    );


  } finally {

    btn.disabled = false;

  }

}


// ------------------------------------------------------------
// BUTTON
// ------------------------------------------------------------

btn?.addEventListener(
  'click',
  enableNotifications
);
