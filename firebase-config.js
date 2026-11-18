// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, query, limitToLast, serverTimestamp, set, get, update, runTransaction, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyArvzPeyHrybCr6qvQ5kYqiXPCXm7FQInM",
  authDomain: "capilla-conecta.firebaseapp.com",
  databaseURL: "https://capilla-conecta-default-rtdb.firebaseio.com",
  projectId: "capilla-conecta",
  storageBucket: "capilla-conecta.firebasestorage.app",
  messagingSenderId: "188383641257",
  appId: "1:188383641257:web:78ce1dbb51f29b3b5433b8"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const messaging = getMessaging(app);
const googleProvider = new GoogleAuthProvider();

window.Firebase = {
  db, ref, push, onValue, query, limitToLast, serverTimestamp, set, get, update, runTransaction, remove,
  auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, googleProvider, signInWithPopup, sendEmailVerification,
  messaging, getToken, onMessage
};

console.log("🔥 Firebase conectado (DB + Auth + Messaging)");