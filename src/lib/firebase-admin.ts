
import admin from 'firebase-admin';

// This is a singleton to ensure we only initialize the app once.
let db: admin.database.Database;

function initializeAdminDb() {
  if (admin.apps.length === 0) {
    console.log('[DEBUG] Attempting to initialize Firebase Admin SDK...');

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountJson) {
      console.error('[DEBUG] FATAL: FIREBASE_SERVICE_ACCOUNT_JSON environment variable is NOT SET. Server cannot connect to Firebase.');
      return;
    } else {
      console.log('[DEBUG] FIREBASE_SERVICE_ACCOUNT_JSON environment variable is present.');
    }

    try {
      // In production (App Hosting), the secret might be pre-parsed.
      // In local dev, it's a string from the .env file that needs parsing.
      // This handles both cases.
      const serviceAccount = typeof serviceAccountJson === 'object' 
        ? serviceAccountJson 
        : JSON.parse(serviceAccountJson);

      console.log(`[DEBUG] Parsed service account for project: ${serviceAccount.project_id} and client email: ${serviceAccount.client_email}`);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });

      console.log('[DEBUG] Firebase Admin SDK initialized successfully.');

    } catch (error) {
      console.error('[DEBUG] Firebase Admin SDK initialization error:', error);
    }
  }
  
  // Get the database instance only if an app is initialized.
  if (admin.apps.length > 0) {
    db = admin.database();
    console.log('[DEBUG] Database instance created.');
  } else {
    console.error('[DEBUG] FATAL: No Firebase app initialized, cannot create database instance.');
  }
}

// Initialize on module load.
initializeAdminDb();

export { db };
