// ============================================================
// ACADEMIC CALENDAR
// FIREBASE PUSH NOTIFICATIONS
// ============================================================


// ------------------------------------------------------------
// FIREBASE IMPORTS
// ------------------------------------------------------------

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
    "AIzaSyCv60MSf09ScTsSUwKYrE_vWPRda9frLGA",

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

};


// ------------------------------------------------------------
// VAPID PUBLIC KEY
// ------------------------------------------------------------

const VAPID_KEY =
  "BNo-srVlmeBJE_1XoRKiThGSEJiUaCC55XDWhcmKZZlYvl99qWx0gY47CZw_1Gs-Pslkrl6cQWDLLwMvUrHKs6k";


// ------------------------------------------------------------
// BUTTON
// ------------------------------------------------------------

const btn =
  document.getElementById('notifyBtn');


// ------------------------------------------------------------
// INITIALIZE FIREBASE
// ------------------------------------------------------------

const app =
  initializeApp(firebaseConfig);


// ------------------------------------------------------------
// STATUS HELPER
// ------------------------------------------------------------

function status(message) {

  console.log(
    '[Notifications]',
    message
  );


  if (
    typeof showToast === 'function'
  ) {

    showToast(message);

  } else {

    alert(message);

  }

}


// ------------------------------------------------------------
// ENABLE NOTIFICATIONS
// ------------------------------------------------------------

async function enableNotifications() {

  btn.disabled = true;


  try {

    // --------------------------------------------------------
    // CHECK BROWSER SUPPORT
    // --------------------------------------------------------

    if (

      !('serviceWorker' in navigator) ||

      !('Notification' in window) ||

      !(await isSupported())

    ) {

      throw new Error(
        'Push notifications are not supported in this browser.'
      );

    }


    // --------------------------------------------------------
    // REQUEST PERMISSION
    // --------------------------------------------------------

    const permission =
      await Notification.requestPermission();


    if (
      permission !== 'granted'
    ) {

      throw new Error(
        'Notification permission was not granted.'
      );

    }


    // --------------------------------------------------------
    // REGISTER EXISTING PWA SERVICE WORKER
    // --------------------------------------------------------

    const registration =
      await navigator.serviceWorker.register(
        './sw.js'
      );


    await navigator.serviceWorker.ready;


    // --------------------------------------------------------
    // FIREBASE MESSAGING
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

          vapidKey:
            VAPID_KEY,

          serviceWorkerRegistration:
            registration

        }

      );


    if (!token) {

      throw new Error(
        'Firebase did not return a registration token.'
      );

    }


    // --------------------------------------------------------
    // UPDATE BUTTON
    // --------------------------------------------------------

    btn.textContent =
      'Notifications Enabled';


    // --------------------------------------------------------
    // SHOW STATUS
    // --------------------------------------------------------

    status(
      'Notifications enabled. Copy your test token from this device.'
    );


    // --------------------------------------------------------
    // DISPLAY TOKEN PANEL
    // --------------------------------------------------------

    const tokenBox =
      document.getElementById(
        'fcmTokenBox'
      );


    tokenBox.value =
      token;


    document.getElementById(
      'fcmTokenPanel'
    ).hidden = false;


    // --------------------------------------------------------
    // FOREGROUND MESSAGE HANDLER
    // --------------------------------------------------------

    onMessage(

      messaging,

      payload => {

        status(

          'Message received: ' +

          (

            payload.notification?.title ||

            'Academic Calendar'

          )

        );

      }

    );

  }


  catch (error) {

    console.error(
      '[Notifications]',
      error
    );


    status(

      error.message ||

      'Could not enable notifications.'

    );

  }


  finally {

    btn.disabled = false;

  }

}


// ------------------------------------------------------------
// TOKEN PANEL
// ------------------------------------------------------------

const panel =
  document.createElement('div');


panel.id =
  'fcmTokenPanel';


panel.hidden =
  true;


panel.style.cssText =
  'margin:12px auto;' +
  'padding:12px;' +
  'max-width:900px;' +
  'border:1px solid #d1d5db;' +
  'border-radius:10px';


panel.innerHTML = `

  <strong>
    Firebase test token (private)
  </strong>

  <p style="font-size:12px">

    Copy this on your own device for
    Firebase Console → Messaging →
    Send test message.

    Do not publish or share it.

  </p>

  <textarea
    id="fcmTokenBox"
    readonly
    style="width:100%;min-height:75px"
  ></textarea>

  <button
    type="button"
    id="copyFcmToken"
  >
    Copy token
  </button>

`;


// ------------------------------------------------------------
// ADD TOKEN PANEL TO PAGE
// ------------------------------------------------------------

document
  .querySelector('main')
  ?.prepend(panel);


// ------------------------------------------------------------
// COPY TOKEN BUTTON
// ------------------------------------------------------------

document
  .getElementById(
    'copyFcmToken'
  )
  .addEventListener(

    'click',

    async () => {

      const token =
        document.getElementById(
          'fcmTokenBox'
        ).value;


      try {

        await navigator.clipboard.writeText(
          token
        );


        status(
          'Token copied.'
        );

      }


      catch {

        document
          .getElementById(
            'fcmTokenBox'
          )
          .select();


        status(
          'Select and copy the token manually.'
        );

      }

    }

  );


// ------------------------------------------------------------
// BUTTON EVENT
// ------------------------------------------------------------

btn?.addEventListener(
  'click',
  enableNotifications
);
