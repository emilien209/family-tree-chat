// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyARlWNyjjXhY6XL8kOPEb3qdm86B1JcOmI",
  authDomain: "family-chat-56b56.firebaseapp.com",
  projectId: "family-chat-56b56",
  storageBucket: "family-chat-56b56.firebasestorage.app",
  messagingSenderId: "549798373229",
  appId: "1:549798373229:web:e28eefe6b95e3ed5455c64",
  measurementId: "G-NCYJNK0SRX"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
