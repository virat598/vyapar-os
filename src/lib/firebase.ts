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

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || "",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ||
    (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim()
      ? `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.trim()}.firebaseapp.com`
      : ""),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || "",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
    (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim()
      ? `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.trim()}.appspot.com`
      : ""),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() || "",
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
