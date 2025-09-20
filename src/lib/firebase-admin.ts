
import admin from 'firebase-admin';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

let db: admin.database.Database;

const initializeDb = async () => {
  if (admin.apps.length) {
    console.log('Firebase Admin SDK already initialized.');
    db = admin.database();
    return;
  }

  try {
    console.log('Initializing Firebase Admin SDK...');
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'saeeds-shuffle';
    const secretName = 'FIREBASE_SERVICE_ACCOUNT_JSON';
    
    // This name is the full resource path to the latest version of the secret.
    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;

    // Create the Secret Manager client.
    const client = new SecretManagerServiceClient();

    // Access the secret version.
    const [version] = await client.accessSecretVersion({ name });

    // Extract the payload as a string.
    const payload = version.payload?.data?.toString();

    if (!payload) {
      throw new Error(`Secret ${secretName} payload is empty.`);
    }

    const serviceAccount = JSON.parse(payload);
    
    console.log('Successfully fetched service account from Secret Manager.');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });

    db = admin.database();
    console.log('Firebase Admin SDK initialized successfully and database is connected.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
    // In case of error, db will be undefined. Subsequent calls may fail.
    // Throwing the error will crash the server on startup, which is often desirable
    // for critical connection issues to prevent it from running in a broken state.
    throw new Error('Could not initialize Firebase Admin SDK. Server is not starting.');
  }
};

// We need an async function to do the init, but we can't export a promise.
// So we create a promise that resolves when the db is ready.
const dbReady = initializeDb();

// This function allows other modules to wait for the db to be ready.
export const getDb = async () => {
  await dbReady;
  return db;
}

// For modules that can afford to wait, this simplifies access.
// But they must be careful to call it only after the app has started.
export { db };
