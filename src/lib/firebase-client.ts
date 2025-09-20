
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
        console.error("Firebase API key is missing. The app may not work correctly in a local development environment if NEXT_PUBLIC environment variables are not set.");
    }
    return !getApps().length ? initializeApp(firebaseConfig) : getApp();
}

export const getClientApp = () => initializeClientApp();
