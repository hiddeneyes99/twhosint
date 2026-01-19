import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// The user will provide the actual firebaseConfig next
const firebaseConfig = {
  apiKey: "AIzaSyDwkuoewuBs4tmN8GRIaaQNmKq0lGuDGBE",
  authDomain: "osint-platform-d6b9b.firebaseapp.com",
  projectId: "osint-platform-d6b9b",
  storageBucket: "osint-platform-d6b9b.firebasestorage.app",
  messagingSenderId: "209310995959",
  appId: "1:209310995959:web:fc455ba4dbdc72d97c8af2",
  measurementId: "G-KRNVV7KBL0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export instances
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
