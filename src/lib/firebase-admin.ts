
import admin from 'firebase-admin';

// This is a singleton to ensure we only initialize the app once.
let db: admin.database.Database;

if (admin.apps.length === 0) {
  console.log('[DEBUG] Attempting to initialize Firebase Admin SDK...');

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    console.error('[DEBUG] FATAL: FIREBASE_SERVICE_ACCOUNT_JSON environment variable is NOT SET. Server cannot connect to Firebase.');
  } else {
    try {
       const serviceAccount = typeof serviceAccountJson === 'string'
        ? JSON.parse(serviceAccountJson)
        : serviceAccountJson;

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });

      console.log('[DEBUG] Firebase Admin SDK initialized successfully.');
      db = admin.database();
      console.log('[DEBUG] Database instance created.');

    } catch (error: any) {
      console.error('[DEBUG] Firebase Admin SDK initialization error:', error.message);
    }
  }
} else {
    // If the app is already initialized, just get the database instance.
    db = admin.database();
}


export { db };
