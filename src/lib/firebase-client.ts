
'use client';

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';

// These environment variables are set by Firebase App Hosting during the build process.
// They are safe to expose to the client.
export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


// Client-side app initialization
function initializeClientApp() {
    if (!firebaseConfig.apiKey) {
        console.error("Firebase API key is missing. Please check your .env.local file and ensure all NEXT_PUBLIC_FIREBASE_* variables are set.");
        throw new Error("Firebase configuration is incomplete. Check your environment variables.");
    }

    if (!firebaseConfig.databaseURL) {
        console.error("Firebase Database URL is missing. This is required for Realtime Database connections.");
        throw new Error("Firebase Database URL is required for Realtime Database. Check NEXT_PUBLIC_FIREBASE_DATABASE_URL in your .env.local file.");
    }

    return !getApps().length ? initializeApp(firebaseConfig) : getApp();
}

export const getClientApp = () => initializeClientApp();
