
'use server';

import admin from 'firebase-admin';

// Since the service account key is a JSON file, we can import it directly.
import serviceAccount from '../saeeds-shuffle-firebase-adminsdk-fbsvc-117c222707.json';

// Ensure the service account JSON is properly typed.
const serviceAccountParams = {
  type: serviceAccount.type,
  projectId: serviceAccount.project_id,
  privateKeyId: serviceAccount.private_key_id,
  privateKey: serviceAccount.private_key,
  clientEmail: serviceAccount.client_email,
  clientId: serviceAccount.client_id,
  authUri: serviceAccount.auth_uri,
  tokenUri: serviceAccount.token_uri,
  authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
  clientC509CertUrl: serviceAccount.client_x509_cert_url,
};

// Singleton pattern to ensure we only initialize the app once.
let db: admin.database.Database;

function initializeDb() {
    if (!admin.apps.length) {
      console.log('Initializing Firebase Admin SDK for Realtime Database...');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountParams),
        databaseURL: "https://saeeds-shuffle-default-rtdb.firebaseio.com"
      });
    }
    db = admin.database();
}

// Initialize the database connection when this module is loaded.
initializeDb();

// Export the database instance for use in other parts of the app.
export { db };
