# Firebase Setup Instructions

## Quick Start

1. **Follow the setup guide**: Open `setup-firebase.md` for detailed instructions
2. **Update environment variables**: Edit `.env.local` with your Firebase project credentials
3. **Test connection**: Run `node test-firebase-connection.js` to verify everything works

## Common Issues

### "Failed to fetch data" Error
- **Cause**: Missing or incorrect environment variables
- **Solution**: Check that all `NEXT_PUBLIC_FIREBASE_*` variables are set in `.env.local`

### "Service account not found" Error
- **Cause**: Missing `FIREBASE_SERVICE_ACCOUNT_JSON`
- **Solution**: Generate a new service account key from Firebase Console → Project Settings → Service Accounts

### "Permission Denied" Error
- **Cause**: Realtime Database rules are too restrictive
- **Solution**: Set database rules to test mode temporarily:
  ```json
  {
    "rules": {
      ".read": true,
      ".write": true
    }
  }
  ```

## Security Notes

- `.env.local` is automatically excluded from git (see `.gitignore`)
- Only `NEXT_PUBLIC_*` variables are exposed to the browser
- Service account JSON is kept server-side only
- Remember to secure your database rules before production

## Development vs Production

### Development (Local)
- Uses `.env.local` file
- Service account JSON as environment variable

### Production (Firebase Hosting)
- Uses Firebase App Hosting environment variables
- Service account managed by Google Cloud Secret Manager

## Need Help?

1. Check the console for detailed error messages
2. Run the test script: `node test-firebase-connection.js`
3. Verify your Firebase project has Realtime Database enabled
4. Ensure your service account has Database Admin permissions