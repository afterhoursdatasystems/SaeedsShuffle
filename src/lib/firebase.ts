
'use server';

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton pattern to ensure we only initialize the app once.
let db: admin.database.Database;

function initializeAdminDb() {
  if (!admin.apps.length) {
    console.log('Initializing Firebase Admin SDK for Realtime Database...');
    
    const keyPath = path.join(process.cwd(), 'saeeds-shuffle-firebase-adminsdk-fbsvc-117c222707.json');
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://saeeds-shuffle-default-rtdb.firebaseio.com"
    });
  }
  db = admin.database();
}

// Initialize the database connection when this module is loaded.
initializeAdminDb();


// Client-side app initialization
function initializeClientApp() {
    return !getApps().length ? initializeApp(firebaseConfig) : getApp();
}

export const getClientApp = () => initializeClientApp();
export { db };
