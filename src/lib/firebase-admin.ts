
import admin from 'firebase-admin';

let db: admin.database.Database;

// This function initializes the Firebase Admin SDK.
// It's designed to run only once.
const initializeAdminApp = () => {
  // If the app is already initialized, don't do it again.
  if (admin.apps.length > 0) {
    return;
  }

  console.log('Initializing Firebase Admin SDK...');

  // In production (on App Hosting), the service account JSON is passed as a raw
  // environment variable. In local development, it's a string from the .env file.
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. In local dev, check your .env file. In production, check your App Hosting secrets.');
  }

  try {
    // Determine the type of the service account credential
    let serviceAccount: admin.ServiceAccount;
    if (typeof serviceAccountJson === 'string') {
      // This path is for local development, where the .env file provides a string.
      serviceAccount = JSON.parse(serviceAccountJson);
    } else {
      // This path is for App Hosting, where the secret is injected as a pre-parsed object.
      // We assume it's in the correct format.
      serviceAccount = serviceAccountJson as admin.ServiceAccount;
    }

    // Initialize the app
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });

    console.log('Firebase Admin SDK initialized successfully.');

  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
    // Throwing the error helps debug issues by failing loudly.
    throw new Error('Could not initialize Firebase Admin SDK: ' + error.message);
  }
};

// Run the initialization
initializeAdminApp();

// Export the initialized database instance
db = admin.database();

export const getDb = async () => {
  // The 'db' instance is already initialized, so we can just return it.
  // The async nature is kept for compatibility with any previous usage.
  return db;
};
