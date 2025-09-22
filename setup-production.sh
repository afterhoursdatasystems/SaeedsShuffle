#!/bin/bash

# Firebase Production Setup Script
# Run this after: firebase login

echo "🔥 Firebase Production Setup"
echo "================================"

# Check if logged in
echo "📋 Checking Firebase authentication..."
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Not logged into Firebase. Please run: firebase login"
    exit 1
fi

echo "✅ Firebase CLI authenticated"

# Set project
echo "🎯 Setting Firebase project..."
firebase use saeeds-shuffle

# Create App Hosting backend if it doesn't exist
echo "🏗️  Checking App Hosting backend..."
firebase apphosting:backends:list

echo ""
echo "🔧 Setting up environment variables..."
echo "Choose your setup method:"
echo "1. Manual setup via Firebase Console (Recommended)"
echo "2. CLI setup (requires additional permissions)"
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "📝 Manual Setup Instructions:"
    echo ""
    echo "1. Go to: https://console.firebase.google.com/project/saeeds-shuffle/apphosting"
    echo "2. Select your backend or create one"
    echo "3. Go to 'Environment variables' tab"
    echo "4. Add these variables (Firebase will auto-add NEXT_PUBLIC_ prefix):"
    echo ""
    echo "   FIREBASE_API_KEY=AIzaSyA0j0G-AMN-GqPNFH0toSVpX9jDoHcqUXA"
    echo "   FIREBASE_AUTH_DOMAIN=saeeds-shuffle.firebaseapp.com"
    echo "   FIREBASE_DATABASE_URL=https://saeeds-shuffle-default-rtdb.firebaseio.com"
    echo "   FIREBASE_PROJECT_ID=saeeds-shuffle"
    echo "   FIREBASE_STORAGE_BUCKET=saeeds-shuffle.firebasestorage.app"
    echo "   FIREBASE_MESSAGING_SENDER_ID=125373944681"
    echo "   FIREBASE_APP_ID=1:125373944681:web:84b71ef6ec5af3e78263f8"
    echo ""
    echo "5. For the service account:"
    echo "   - Go to: https://console.cloud.google.com/security/secret-manager?project=saeeds-shuffle"
    echo "   - Create a new secret named 'firebase-service-account'"
    echo "   - Paste your service account JSON as the value"
    echo "   - Back in Firebase Console, add secret reference:"
    echo "     Name: FIREBASE_SERVICE_ACCOUNT_JSON"
    echo "     Type: Secret"
    echo "     Secret: firebase-service-account"
    echo ""
    echo "✅ Follow these manual steps, then run deployment!"

elif [ "$choice" = "2" ]; then
    echo "⚠️  CLI setup requires additional IAM permissions."
    echo "Setting up secrets via gcloud..."

    # Create service account secret
    echo "Creating service account secret..."
    echo '{"type":"service_account","project_id":"saeeds-shuffle","private_key_id":"d2fcb0337d50d1ad888985c31982da7d7bae34ac","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCuuKbwtEUinUYh\nzPRzsAxB2TKDmWVDkZdT4BesXNne88v4l79EYX/zcZezloDt59TvucSXbiKiwbLT\nihDiZQYoRAFFskfcUPhAXR0ZLfrPfjfED5ZsoKRF9KhCH8SRNg5+K8Dtu4BFQxze\ncuOq5w55ZCjI7jbTxdVLr2KnPAQiZF6GLzaDI6imvPZkmMrzkqydVfalwk32x9wR\nlYAnmVc5iAesM95opQDs3OdXTCmSf8fVMk9zNcdgqcnCDsm4rltckIxbI7tIVAGB\nJubAL5hX6Ir7ZjJCe9J+c1/gGbRJTDtsXVKzpOM/7a3yWBDcUuLPiPTnVlWrSBJ7\nyG+4fQgvAgMBAAECggEARGcbSGozFNmg3tPIMlCOg+seGSJhYEIsDhTR/9N8Ioqs\n5L64DXPkbXEf1JnMERftqArA+g4OtkyCD8piUNf/QJ1bKCejdZAnmL87iKOVKU2/\nVF1L5WxA0/h0NSsNwFH6+49yoUACeFtNfpNZKYv7ATBivUNxqJgvqMlZpKJc9f9S\n0Wty6d29LXEfWxZe3JuYkonBUDjRe2EMnRPlqyeBEbOHG54DPG0Kc7y7H4TKEFDF\n+P69oVTj7lhYld0TyLgaUKi9YTJStgpBJYLGGW80p94WVbPkZQJeX+ERHvUjvf5K\ncypjoK/G81l2q2crcQtY71I+fYjaeGeXjAiHo60jNQKBgQDY6qdEAW7qnD/p4hWA\nnLdCyff7l3thA/S7S54sYRyO+dUCKhNT51M3UMUB6h7b7aHDSNu5nDCcZHy6peX2\nP5jMcfTy8PBxtYj+5MNlnbpYGKzvc7eSI5yleSJ9smZazZwFAntTJrWiEbD0MAcs\nQxR8PEbtK0nZQmd5SyYSd4lWDQKBgQDOM7n91otABvaguEZblfSuCT4p5Aur8AVM\n5yWARl5UEVZkOBjhNL5jy69DOnEZplXpHLTydg7J5pjCAEfMzhRV7osdrGUGz0rf\nA2DPM8GQS+WfpyEVGU05j2QzOzFTGJ7aJCvGTGFqtMGEZS6JZC4Xr4wvf1oG2eST\nL+zQuOjkKwKBgQC1VtYmoBwdviogWIUpU9pQ14+coPLgE/KQcZL1/ullDa7pdEtc\nJVMIN1m7VAIgUfSd0Vb/QHfTBp7PWsl4p4oRwGLKhmo8ZUr17ED9vnJ+G4LXW6Hn\nZiYan74Z3v56gtEfzwdSaFYH+0o3mb8lXZ7OjYWt2DaQjlb6q7xUS+JgMQKBgGhR\nLN/pIQtkOnL2psmApIdDL8q7jtgOFnBgY81wTBpVpxIOey+7ojIUgncNYthqGP5U\nwooDBdpIqbFDuQ84lnsesgxyAa4fQq5uJBTPBza73tAVGhx1b2cWTsfIQ1zZkMul\nDuxECeiUx232TkO9hb//1HjXAbGDnCqGTVUOput/AoGAWBuUjsoZc2uOnfoN4ddL\nyg91Kfl4cfP+WzErn58H4znB+RWf2oF4uSHvOL6PIOapJ1bCQEUqucm1dXbbs/uy\nMobsjnq0rPzqZuRg1vKh5RSFDUDmk6+2vmioe/f7nMOXrDCByYEFnA3nF5eCaf3P\nvgQfIh+RSHoPDClOmJNdIiA=\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-fbsvc@saeeds-shuffle.iam.gserviceaccount.com","client_id":"102353246740245933771","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40saeeds-shuffle.iam.gserviceaccount.com","universe_domain":"googleapis.com"}' | gcloud secrets create firebase-service-account --data-file=-

    echo "✅ Secrets configured! Deploy your app now."
else
    echo "❌ Invalid choice. Please run the script again."
    exit 1
fi

echo ""
echo "🚀 Ready to deploy!"
echo "Run: firebase deploy --only hosting"