import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  initializeAuth, 
  browserLocalPersistence, 
  browserSessionPersistence, 
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut
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

// Export Auth services with robust fallback persistence (excluding IndexedDB)
let initializedAuth = null;
if (app) {
  try {
    initializedAuth = initializeAuth(app, {
      persistence: [browserLocalPersistence, browserSessionPersistence]
    });
  } catch (e) {
    // If already initialized, get the existing instance
    initializedAuth = getAuth(app);
  }
}

export const auth = initializedAuth;
export const googleProvider = app ? new GoogleAuthProvider() : null;

// Auth helper functions executed inside the same compiled chunk to prevent argument errors
export async function loginWithGoogle() {
  if (!auth || !googleProvider) {
    throw new Error("Firebase Auth is not configured.");
  }
  return signInWithPopup(auth, googleProvider);
}

export async function logoutUser() {
  if (!auth) return;
  return firebaseSignOut(auth);
}

