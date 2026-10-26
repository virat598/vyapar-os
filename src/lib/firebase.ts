import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

function sanitizeEnv(val?: string): string {
  if (!val) return "";
  return val.replace(/^[\x22\x27\\]+|[\x22\x27\\]+$/g, "").trim();
}

const rawApiKey = sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
const rawProjectId = sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
const rawAuthDomain = sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
const rawStorageBucket = sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
const rawMessagingSenderId = sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID);
const rawAppId = sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID);
const rawMeasurementId = sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID);

export const firebaseConfig = {
  apiKey: rawApiKey,
  authDomain: rawAuthDomain || (rawProjectId ? `${rawProjectId}.firebaseapp.com` : ""),
  projectId: rawProjectId,
  storageBucket: rawStorageBucket || (rawProjectId ? `${rawProjectId}.appspot.com` : ""),
  messagingSenderId: rawMessagingSenderId,
  appId: rawAppId,
  measurementId: rawMeasurementId,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey.length > 0 &&
  firebaseConfig.projectId.length > 0 &&
  firebaseConfig.apiKey !== "undefined"
);

// Singleton initialization for Firebase App
export const app =
  isFirebaseConfigured
    ? getApps().length > 0
      ? getApp()
      : initializeApp(firebaseConfig)
    : null;

// Firebase Authentication instance
export const auth = app ? getAuth(app) : null;

// Cloud Firestore instance
export const firestore = app ? getFirestore(app) : null;

// Google Auth Provider with account selection prompt
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export async function signInWithGoogle(): Promise<User | null> {
  if (!auth) {
    throw new Error(
      "Firebase Auth is not initialized. Please configure NEXT_PUBLIC_FIREBASE_* environment variables."
    );
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Firebase Google Sign-In error:", error);
    throw error;
  }
}

export async function signOutFirebase(): Promise<void> {
  if (auth) {
    await firebaseSignOut(auth);
  }
}

export { onAuthStateChanged };
export type { User };
