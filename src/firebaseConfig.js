import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  orderBy, 
  query, 
  where, 
  serverTimestamp, 
  updateDoc, 
  setDoc, 
  doc, 
  increment, 
  getDoc, 
  getDocs, 
  deleteDoc 
} from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

// Your verified Firebase connection credentials
const firebaseConfig = {
  apiKey: "AIzaSyCPEOUhvYSh3cTgWPUtFfyb4rkK_fqDfc0",
  authDomain: "amrutvahini-diaries.firebaseapp.com",
  projectId: "amrutvahini-diaries",
  storageBucket: "amrutvahini-diaries.firebasestorage.app",
  messagingSenderId: "127069684860",
  appId: "1:127069684860:web:bb1feae1d97ea4909935f9"
};

// Initialize the Firebase app instance
const app = initializeApp(firebaseConfig);

// Initialize services and export them for your components
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// Export all structural Firestore queries you already use
export {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  serverTimestamp,
  updateDoc,
  setDoc,
  doc,
  increment,
  getDoc,
  getDocs,
  deleteDoc,
  signInWithPopup,
  signOut,
  onAuthStateChanged
};

// Global Constants
export const ADMIN_UID = 'wEz2oV7i4fMbm075oAqSSioTUEm2';
export const ADMIN_PASS = 'AVCOEITBATCH2022-26';