
import admin from 'firebase-admin';
import 'dotenv/config';

let db: admin.database.Database | null = null;

function initializeAdminApp(): admin.database.Database {
    console.log('[VERBOSE DEBUG] initializeAdminApp: Function called.');

    if (admin.apps.length > 0) {
        console.log('[VERBOSE DEBUG] initializeAdminApp: Firebase Admin SDK already initialized. Reusing existing instance.');
        if (!db) {
           db = admin.database();
        }
        return db;
    }

    console.log('[VERBOSE DEBUG] initializeAdminApp: Starting new Firebase Admin SDK initialization.');
    
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountJson) {
        console.error('[CRITICAL DEBUG] initializeAdminApp: FIREBASE_SERVICE_ACCOUNT_JSON environment variable is NOT SET.');
        throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. In local dev, check your .env file. In production, check your App Hosting secrets.');
    }
    
    console.log('[VERBOSE DEBUG] initializeAdminApp: FIREBASE_SERVICE_ACCOUNT_JSON is present.');
    
    let serviceAccount;
    try {
        // The environment variable can be a string (from .env) or an object (from App Hosting).
        // This handles both cases.
        serviceAccount = typeof serviceAccountJson === 'string'
            ? JSON.parse(serviceAccountJson)
            : serviceAccountJson;
        console.log('[VERBOSE DEBUG] initializeAdminApp: Successfully parsed service account JSON.');
    } catch (e: any) {
        console.error('[CRITICAL DEBUG] initializeAdminApp: Failed to parse service account JSON.', e.message);
        throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. Error: ${e.message}`);
    }

    try {
        console.log('[VERBOSE DEBUG] initializeAdminApp: Calling admin.initializeApp...');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });
        console.log('[SUCCESS DEBUG] initializeAdminApp: Firebase Admin SDK initialized successfully.');
    } catch (error: any) {
        console.error('[CRITICAL DEBUG] initializeAdminApp: admin.initializeApp failed.', error.message);
        throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
    }

    db = admin.database();
    return db;
}

export function getDb(): admin.database.Database {
    try {
        if (!db) {
            console.log('[VERBOSE DEBUG] getDb: No active DB instance, calling initializeAdminApp.');
            db = initializeAdminApp();
        } else {
            console.log('[VERBOSE DEBUG] getDb: Re-using existing DB instance.');
        }
        return db;
    } catch(error: any) {
        console.error("[CRITICAL DEBUG] getDb: An error occurred during database initialization process.", error.message);
        // Re-throw the error to ensure calling functions know about the failure.
        throw error;
    }
}
