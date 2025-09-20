
import admin from 'firebase-admin';

// This is a singleton pattern. We'll store the initialized DB instance here.
let db: admin.database.Database | null = null;

function initializeAdminApp(): admin.database.Database {
    console.log('[VERBOSE DEBUG] initializeAdminApp: Function called.');

    if (admin.apps.length > 0) {
        console.log('[VERBOSE DEBUG] initializeAdminApp: Firebase Admin SDK already initialized. Reusing existing instance.');
        return admin.database();
    }

    console.log('[VERBOSE DEBUG] initializeAdminApp: Starting new Firebase Admin SDK initialization.');
    
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountJson) {
        console.error('[CRITICAL DEBUG] initializeAdminApp: FIREBASE_SERVICE_ACCOUNT_JSON environment variable is NOT SET.');
        throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. In local dev, check your .env file. In production, check your App Hosting secrets.');
    }
    
    console.log('[VERBOSE DEBUG] initializeAdminApp: FIREBASE_SERVICE_ACCOUNT_JSON is present. Type:', typeof serviceAccountJson);
    console.log('[VERBOSE DEBUG] initializeAdminApp: Raw service account string (first 70 chars):', serviceAccountJson.substring(0, 70));

    
    let serviceAccount;
    try {
        serviceAccount = JSON.parse(serviceAccountJson);
        console.log('[VERBOSE DEBUG] initializeAdminApp: Successfully parsed service account JSON.');
        console.log('[VERBOSE DEBUG] initializeAdminApp: Service account project_id from parsed JSON:', serviceAccount.project_id);
    } catch (e: any) {
        console.error('[CRITICAL DEBUG] initializeAdminApp: Failed to parse service account JSON.', e.message);
        throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. Ensure it is a valid JSON string. Error: ${e.message}`);
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
        // Re-throw the error to ensure calling functions know about the failure.
        throw error;
    }
}
