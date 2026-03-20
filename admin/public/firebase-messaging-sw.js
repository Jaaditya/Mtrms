importScripts('https://www.gstatic.com/firebasejs/9.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDLkJx2UhorOY-GoHSeUeIz-v4wq8srIkw",
  authDomain: "mtrms-6101d.firebaseapp.com",
  projectId: "mtrms-6101d",
  storageBucket: "mtrms-6101d.firebasestorage.app",
  messagingSenderId: "75413077812",
  appId: "1:75413077812:web:257f5f88d1db23f13cef61",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
