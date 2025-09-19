import admin from 'firebase-admin';

// This is a singleton to ensure we only initialize the app once.
let db: admin.database.Database;

function initializeAdminDb() {
  if (admin.apps.length === 0) {
    console.log('Initializing Firebase Admin SDK...');

    // When deployed, these will be set as secrets in the App Hosting environment.
    // For local dev, they'll be read from the .env file.
    const serviceAccount: admin.ServiceAccount = {
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    };

    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
      db = admin.database();
    } catch (error) {
      console.error('Firebase Admin SDK initialization error:', error);
      // In a production app, you might want to throw an error or handle this differently.
      // For this context, we will log the error and `db` will remain uninitialized.
    }
  } else if (!db) {
    db = admin.database();
  }
}

// Initialize on module load.
initializeAdminDb();

export { db };
