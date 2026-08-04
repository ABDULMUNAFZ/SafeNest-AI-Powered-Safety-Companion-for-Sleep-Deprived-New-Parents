import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  initializeAuth, 
  browserLocalPersistence, 
  browserSessionPersistence, 
  indexedDBLocalPersistence, 
  GoogleAuthProvider 
} from "firebase/auth";

// Firebase Config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (typeof window !== "undefined") {
  console.log("[SafeNest Auth debug] Loaded API Key:", firebaseConfig.apiKey);
  console.log("[SafeNest Auth debug] isFirebaseConfigured:", Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain));
}

// Check if Firebase config is fully provided
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.authDomain && 
  firebaseConfig.projectId
);

// Initialize Firebase App (avoid duplicate initialization)
const app = isFirebaseConfigured
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

// Export Auth services with robust fallback persistence (excluding IndexedDB to prevent browser lockouts)
export const auth = app
  ? (getApps().length 
      ? getAuth(app)
      : initializeAuth(app, {
          persistence: [browserLocalPersistence, browserSessionPersistence]
        })
    )
  : null;

export const googleProvider = app ? new GoogleAuthProvider() : null;
