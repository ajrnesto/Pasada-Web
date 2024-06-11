// imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js';

export const app = initializeApp({
  apiKey: "AIzaSyAiq-ZSfS5QdwGEWJAzz3eC0enuOkHvphM",
  authDomain: "pasadaapp.firebaseapp.com",
  databaseURL: "https://pasadaapp-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pasadaapp",
  storageBucket: "pasadaapp.appspot.com",
  messagingSenderId: "427047339609",
  appId: "1:427047339609:web:66c631d29f5b2e17a5d348",
  measurementId: "G-Q17W6JL8X1"
});

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);