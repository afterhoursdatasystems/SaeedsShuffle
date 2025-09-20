
import admin from 'firebase-admin';

let db: admin.database.Database;

if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountString) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not set in the environment.');
    }
    
    const serviceAccount = JSON.parse(serviceAccountString);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
    
    db = admin.database();
    console.log('Firebase Admin SDK initialized successfully.');

  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
    // In case of error, db will be undefined, and subsequent calls will fail.
  }
} else {
  db = admin.database();
}

export { db };
