
import admin from 'firebase-admin';
import 'dotenv/config';

let db: admin.database.Database | null = null;

function initializeAdminApp(): admin.database.Database {
    // If the app is already initialized, return the existing database instance.
    if (admin.apps.length > 0 && db) {
        return db;
    }

    // Read the service account credentials from the environment variable.
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountJson) {
        console.error('[CRITICAL DEBUG] initializeAdminApp: FIREBASE_SERVICE_ACCOUNT_JSON environment variable is NOT SET.');
        throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. In local dev, check your .env file. In production, check your App Hosting secrets.');
    }

    let serviceAccount;
    try {
        // The environment variable can be a string (from .env) or an object (from App Hosting).
        // This handles both cases.
        serviceAccount = typeof serviceAccountJson === 'string'
            ? JSON.parse(serviceAccountJson)
            : serviceAccountJson;
    } catch (e: any) {
        console.error('[CRITICAL DEBUG] initializeAdminApp: Failed to parse service account JSON.', e.message);
        throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. Make sure it's a valid JSON string in your .env file. Error: ${e.message}`);
    }

    console.log('[VERBOSE DEBUG] initializeAdminApp: Attempting to initialize Firebase Admin SDK...');
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });
        console.log('[VERBOSE DEBUG] initializeAdminApp: Firebase Admin SDK initialized successfully.');
    } catch (error: any) {
        // This will catch errors if the app is already initialized, which can happen.
        if (error.code !== 'app/duplicate-app') {
            console.error('[CRITICAL DEBUG] initializeAdminApp: admin.initializeApp failed.', error.message);
            throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
        }
    }

    db = admin.database();
    return db;
}

export function getDb(): admin.database.Database {
    try {
        // This ensures initialization only happens once.
        if (!db) {
            db = initializeAdminApp();
        }
        return db;
    } catch(error: any) {
        console.error("[CRITICAL DEBUG] getDb: An error occurred during database initialization process.", error.message);
        // Re-throw the error to be caught by the calling function (e.g., in actions.ts)
        throw error;
    }
}
