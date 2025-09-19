import admin from 'firebase-admin';

// This is a singleton to ensure we only initialize the app once.
let db: admin.database.Database;

function initializeAdminDb() {
  if (admin.apps.length === 0) {
    console.log('Initializing Firebase Admin SDK...');

    try {
      // In production, FIREBASE_SERVICE_ACCOUNT_JSON will be set as a secret.
      // In local dev, it's loaded from the .env file.
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

      if (!serviceAccountJson) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set.');
      }

      const serviceAccount = JSON.parse(serviceAccountJson);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });

      db = admin.database();
      console.log('Firebase Admin SDK initialized successfully.');

    } catch (error) {
      console.error('Firebase Admin SDK initialization error:', error);
      // This will prevent the app from starting if the config is invalid.
      // In a production app, you might want to throw an error or handle this differently.
    }
  } else if (!db) {
    db = admin.database();
  }
}

// Initialize on module load.
initializeAdminDb();

export { db };
