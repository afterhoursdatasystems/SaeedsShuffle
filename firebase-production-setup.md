# Firebase Production Setup Guide

## Step 1: Configure Environment Variables in Firebase Console

### Method A: Using Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/project/saeeds-shuffle)
2. Click **App Hosting** in the left sidebar
3. Select your hosting backend or create one if you haven't
4. Go to **Environment variables** tab
5. Add these environment variables:

**Public Variables (automatically prefixed with NEXT_PUBLIC_):**
```
FIREBASE_API_KEY=AIzaSyA0j0G-AMN-GqPNFH0toSVpX9jDoHcqUXA
FIREBASE_AUTH_DOMAIN=saeeds-shuffle.firebaseapp.com
FIREBASE_DATABASE_URL=https://saeeds-shuffle-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=saeeds-shuffle
FIREBASE_STORAGE_BUCKET=saeeds-shuffle.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=125373944681
FIREBASE_APP_ID=1:125373944681:web:84b71ef6ec5af3e78263f8
```

### Method B: Using Firebase CLI

```bash
# Set public environment variables
firebase apphosting:secrets:set FIREBASE_API_KEY --data-file -
firebase apphosting:secrets:set FIREBASE_AUTH_DOMAIN --data-file -
firebase apphosting:secrets:set FIREBASE_DATABASE_URL --data-file -
firebase apphosting:secrets:set FIREBASE_PROJECT_ID --data-file -
firebase apphosting:secrets:set FIREBASE_STORAGE_BUCKET --data-file -
firebase apphosting:secrets:set FIREBASE_MESSAGING_SENDER_ID --data-file -
firebase apphosting:secrets:set FIREBASE_APP_ID --data-file -
```

## Step 2: Configure Service Account Secret

### Using Google Secret Manager (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/security/secret-manager?project=saeeds-shuffle)
2. Click **Create Secret**
3. Name: `firebase-service-account`
4. Value: Paste your service account JSON (the entire JSON object)
5. Click **Create**

### Link Secret to Firebase App Hosting

1. Back in Firebase Console → App Hosting → Environment variables
2. Add secret:
   - Name: `FIREBASE_SERVICE_ACCOUNT_JSON`
   - Type: **Secret**
   - Select: `firebase-service-account`

## Step 3: Update Your Code for Production

Your current code should work, but let's make sure it handles both environments:

### Update firebase-client.ts (if needed)
Your current setup should work since Firebase App Hosting automatically provides NEXT_PUBLIC_ prefixed variables.

## Step 4: Deploy to Production

```bash
# Build and deploy
firebase deploy --only hosting
```

## Troubleshooting Production Issues

### Common Error: "Environment variables not found"
- **Solution**: Make sure variables are set in Firebase Console under App Hosting → Environment variables

### Common Error: "Service account not found"
- **Solution**: Create the service account secret in Google Secret Manager and link it in Firebase Console

### Common Error: "Database permission denied"
- **Solution**: Update Realtime Database rules to allow authenticated access

### Database Rules for Production
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

## Environment Variable Names

Firebase App Hosting automatically adds `NEXT_PUBLIC_` prefix to your configured variables. So:
- `FIREBASE_API_KEY` becomes `NEXT_PUBLIC_FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN` becomes `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- etc.

Your service account secret `FIREBASE_SERVICE_ACCOUNT_JSON` remains as-is (no prefix).