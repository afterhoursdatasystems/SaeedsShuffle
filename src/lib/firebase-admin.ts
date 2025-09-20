
import admin from 'firebase-admin';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// This is a singleton pattern. We'll store the initialized DB instance here.
let db: admin.database.Database | null = null;

// Helper function to fetch the service account from Secret Manager.
async function getServiceAccount() {
    console.log('[DB] Accessing secret from Secret Manager...');
    const client = new SecretManagerServiceClient();
    const secretName = 'projects/saeeds-shuffle/secrets/FIREBASE_SERVICE_ACCOUNT_JSON/versions/latest';
    
    try {
        const [version] = await client.accessSecretVersion({ name: secretName });
        const payload = version.payload?.data?.toString();
        
        if (!payload) {
            throw new Error('Secret payload is empty.');
        }
        
        console.log('[DB] Secret fetched successfully.');
        return JSON.parse(payload);

    } catch (error) {
        console.error('[DB] Failed to fetch secret from Secret Manager:', error);
        throw new Error('Could not fetch database credentials from Secret Manager. Ensure you have run "gcloud auth application-default login" for local development.');
    }
}

// The main export is a function that returns a promise of the DB instance.
export const getDb = async (): Promise<admin.database.Database> => {
    // If the database is already initialized, return it immediately.
    if (db) {
        return db;
    }
    
    console.log('[DB] Initializing Firebase Admin SDK...');

    // If there are no apps initialized yet, initialize one.
    if (admin.apps.length === 0) {
        try {
            const serviceAccount = await getServiceAccount();

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
            });
            
            console.log('[DB] Firebase Admin SDK initialized successfully.');

        } catch (error) {
            console.error('[DB] Firebase Admin SDK initialization failed:', error);
            // Re-throw the error to ensure the calling function knows about the failure.
            throw error; 
        }
    }
    
    // Store the database instance in our singleton variable and return it.
    db = admin.database();
    return db;
};
