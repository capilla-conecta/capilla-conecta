// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyArvzPeyHrybCr6qvQ5kYqiXPCXm7FQInM",
  authDomain: "capilla-conecta.firebaseapp.com",
  databaseURL: "https://capilla-conecta-default-rtdb.firebaseio.com",
  projectId: "capilla-conecta",
  storageBucket: "capilla-conecta.firebasestorage.app",
  messagingSenderId: "188383641257",
  appId: "1:188383641257:web:78ce1dbb51f29b3b5433b8"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Este evento se dispara cuando llega una notificación y la app NO está en primer plano
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje en background:', payload);
  
  const notificationTitle = payload.notification?.title || 'Capilla Conecta';
  const notificationOptions = {
    body: payload.notification?.body || 'Tenés un mensaje nuevo',
    icon: '/icono.png' // Si tenés un logo, poné la ruta acá
  };
  
  self.registration.showNotification(notificationTitle, notificationOptions);
});