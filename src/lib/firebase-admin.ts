
import admin from 'firebase-admin';
import 'dotenv/config';

let db: admin.database.Database | null = null;

function initializeAdminApp(): admin.database.Database {
    console.log('[VERBOSE DEBUG] initializeAdminApp: Function called.');

    // --- START OF DEBUGGING BLOCK ---
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    console.log('--- BEGIN RAW FIREBASE_SERVICE_ACCOUNT_JSON ---');
    console.log(serviceAccountJson);
    console.log('--- END RAW FIREBASE_SERVICE_ACCOUNT_JSON ---');
    console.log(`[VERBOSE DEBUG] Type of serviceAccountJson: ${typeof serviceAccountJson}`);
    // --- END OF DEBUGGING BLOCK ---

    if (admin.apps.length > 0) {
        console.log('[VERBOSE DEBUG] initializeAdminApp: Firebase Admin SDK already initialized. Reusing existing instance.');
        return admin.database();
    }

    console.log('[VERBOSE DEBUG] initializeAdminApp: Starting new Firebase Admin SDK initialization.');
    
    if (!serviceAccountJson) {
        console.error('[CRITICAL DEBUG] initializeAdminApp: FIREBASE_SERVICE_ACCOUNT_JSON environment variable is NOT SET.');
        throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. In local dev, check your .env file. In production, check your App Hosting secrets.');
    }
    
    console.log('[VERBOSE DEBUG] initializeAdminApp: FIREBASE_SERVICE_ACCOUNT_JSON is present.');
    
    let serviceAccount;
    try {
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

    return admin.database();
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
        throw error;
    }
}
