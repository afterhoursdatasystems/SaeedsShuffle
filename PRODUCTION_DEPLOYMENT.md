# Production Deployment Checklist

## Prerequisites ✅

- [x] Firebase project created: `saeeds-shuffle`
- [x] Realtime Database enabled
- [x] Service account key generated
- [x] Local development working

## Step 1: Firebase Authentication

```bash
firebase login
firebase use saeeds-shuffle
```

## Step 2: Configure Production Environment Variables

### Option A: Firebase Console (Recommended)

1. **Go to Firebase Console**:
   - https://console.firebase.google.com/project/saeeds-shuffle/apphosting

2. **Create/Select App Hosting Backend**:
   - If no backend exists, create one
   - Connect to your GitHub repository
   - Select branch: `main`

3. **Add Environment Variables** (Firebase auto-adds `NEXT_PUBLIC_` prefix):
   ```
   FIREBASE_API_KEY=AIzaSyA0j0G-AMN-GqPNFH0toSVpX9jDoHcqUXA
   FIREBASE_AUTH_DOMAIN=saeeds-shuffle.firebaseapp.com
   FIREBASE_DATABASE_URL=https://saeeds-shuffle-default-rtdb.firebaseio.com
   FIREBASE_PROJECT_ID=saeeds-shuffle
   FIREBASE_STORAGE_BUCKET=saeeds-shuffle.firebasestorage.app
   FIREBASE_MESSAGING_SENDER_ID=125373944681
   FIREBASE_APP_ID=1:125373944681:web:84b71ef6ec5af3e78263f8
   ```

4. **Add Service Account Secret**:
   - Go to: https://console.cloud.google.com/security/secret-manager?project=saeeds-shuffle
   - Create secret: `firebase-service-account`
   - Value: Your complete service account JSON
   - Back in Firebase Console, link the secret:
     - Name: `FIREBASE_SERVICE_ACCOUNT_JSON`
     - Type: **Secret**
     - Secret: `firebase-service-account`

### Option B: Quick CLI Setup

```bash
# Run the setup script
bash setup-production.sh
```

## Step 3: Update Database Rules

Update your Realtime Database rules for production security:

1. Go to: https://console.firebase.google.com/project/saeeds-shuffle/database/saeeds-shuffle-default-rtdb/rules

2. Set production rules:
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

## Step 4: Deploy

```bash
# Build and deploy
firebase deploy --only hosting

# Or deploy everything
firebase deploy
```

## Step 5: Test Production

1. **Open your production URL**: Check Firebase Console for the deployed URL
2. **Test authentication**: Login with your Google account
3. **Test database**: Check if player data loads correctly
4. **Check console**: No Firebase errors should appear

## Troubleshooting Production Issues

### "Environment variables not found"
- ✅ Check Firebase Console → App Hosting → Environment variables
- ✅ Ensure variables don't have `NEXT_PUBLIC_` prefix in the console (Firebase adds it automatically)

### "Service account not found"
- ✅ Verify secret exists in Google Secret Manager
- ✅ Ensure secret is properly linked in Firebase Console

### "Permission denied" database errors
- ✅ Update database rules to allow authenticated access
- ✅ Ensure your Google account can authenticate

### "Failed to fetch data" in production
- ✅ Check browser console for specific error messages
- ✅ Verify all environment variables are correctly set
- ✅ Test database rules with Firebase Console simulator

## Environment Variable Mapping

**Local (.env.local)** → **Production (Firebase Console)**
```
NEXT_PUBLIC_FIREBASE_API_KEY     → FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN → FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_DATABASE_URL → FIREBASE_DATABASE_URL
NEXT_PUBLIC_FIREBASE_PROJECT_ID  → FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET → FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID → FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID      → FIREBASE_APP_ID
FIREBASE_SERVICE_ACCOUNT_JSON    → Secret: firebase-service-account
```

## Success Indicators

✅ **Deployment successful**: No build errors
✅ **Authentication working**: Can login with Google
✅ **Database connected**: Player data loads and saves
✅ **No console errors**: Clean browser console

## Next Steps After Deployment

1. **Security**: Review and tighten database rules
2. **Monitoring**: Set up error tracking
3. **Performance**: Enable analytics if needed
4. **Backup**: Set up automated database backups

---

🎉 **Your Firebase Realtime Database should now work in production!**