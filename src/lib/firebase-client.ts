
'use client';

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';

// It's safe to expose this config to the client.
// Firebase security rules and App Check will protect your backend.
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
        console.error("Firebase API key is missing. Please check your environment variables.");
        // You might want to return a dummy app or throw an error,
        // but for now, we'll log the error and let it fail on initializeApp.
    }
    return !getApps().length ? initializeApp(firebaseConfig) : getApp();
}

export const getClientApp = () => initializeClientApp();
