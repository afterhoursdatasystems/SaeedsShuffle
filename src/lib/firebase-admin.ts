import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Singleton pattern to ensure we only initialize the app once.
let db: admin.database.Database;

function initializeAdminDb() {
  if (!admin.apps.length) {
    console.log('Initializing Firebase Admin SDK for Realtime Database...');
    
    try {
        const keyPath = path.join(process.cwd(), 'saeeds-shuffle-firebase-adminsdk-fbsvc-117c222707.json');
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: "https://saeeds-shuffle-default-rtdb.firebaseio.com"
        });
    } catch (error) {
        console.error("Failed to initialize Firebase Admin SDK:", error);
        // In a production environment, you might want to handle this more gracefully.
        // For now, we'll log the error. The app might not function correctly without the admin SDK.
        return;
    }
  }
  db = admin.database();
}

// Initialize the database connection when this module is loaded.
initializeAdminDb();

export { db };
