/* eslint-disable no-undef */
importScripts(
  "https://www.gstatic.com/firebasejs/11.7.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.7.1/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBVG2hdQct-Xwnf7sSxutLeAeyR0GPiols",
  authDomain: "rafeeqi.firebaseapp.com",
  projectId: "rafeeqi",
  storageBucket: "rafeeqi.firebasestorage.app",
  messagingSenderId: "35543905418",
  appId: "1:35543905418:web:7a29156516320a30f72973",
  measurementId: "G-E0ZZPMRQG2",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Received background message: ", payload);
  // Customize the notification as required
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
  });
});
