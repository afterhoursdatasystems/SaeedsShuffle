
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Singleton pattern to ensure we only initialize the app once.
let db: admin.database.Database;

function initializeDb() {
  if (!admin.apps.length) {
    console.log('Initializing Firebase Admin SDK for Realtime Database...');
    
    const keyPath = path.join(process.cwd(), 'saeeds-shuffle-firebase-adminsdk-fbsvc-117c222707.json');
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://saeeds-shuffle-default-rtdb.firebaseio.com"
    });
  }
  db = admin.database();
}

// Initialize the database connection when this module is loaded.
initializeDb();

// Export the database instance for use in other parts of the app.
export { db };
