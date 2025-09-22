# Firebase Configuration Setup Guide

## Step 1: Get Your Firebase Project Configuration

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon (Project Settings)
4. In the "General" tab, scroll down to "Your apps"
5. If you don't have a web app, click "Add app" and select the web icon `</>`
6. Copy the `firebaseConfig` object values to replace in `.env.local`

## Step 2: Enable Realtime Database

1. In Firebase Console, go to "Realtime Database" in the left sidebar
2. Click "Create Database"
3. Choose your location (us-central1 recommended for your hosting region)
4. Start in **test mode** for now (you can secure it later)
5. Copy the database URL (looks like: `https://your-project-default-rtdb.firebaseio.com/`)

## Step 3: Create Service Account

1. In Firebase Console, go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file securely
4. Copy the entire JSON content and replace the `FIREBASE_SERVICE_ACCOUNT_JSON` value in `.env.local`

## Step 4: Update .env.local

Replace the placeholder values in `.env.local` with your actual Firebase project values:

```env
# From Firebase Project Settings → General → Your apps
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc123

# From Service Account JSON (paste the entire JSON as one line)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project",...}
```

## Step 5: Test the Connection

Run your development server:
```bash
npm run dev
```

The app should now connect to Firebase Realtime Database successfully!