import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDwkuoewuBs4tmN8GRIaaQNmKq0lGuDGBE",
  authDomain: "osint-platform-d6b9b.firebaseapp.com",
  projectId: "osint-platform-d6b9b",
  storageBucket: "osint-platform-d6b9b.firebasestorage.app",
  messagingSenderId: "209310995959",
  appId: "1:209310995959:web:fc455ba4dbdc72d97c8af2"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type FirebaseUser
};
