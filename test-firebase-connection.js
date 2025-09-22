#!/usr/bin/env node

/**
 * Firebase Connection Test Script
 *
 * Run this script to test your Firebase configuration:
 * node test-firebase-connection.js
 */

require('dotenv/config');

async function testFirebaseConnection() {
    console.log('🔥 Testing Firebase Configuration...\n');

    // Test environment variables
    console.log('📋 Checking Environment Variables:');
    const requiredVars = [
        'NEXT_PUBLIC_FIREBASE_API_KEY',
        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
        'NEXT_PUBLIC_FIREBASE_DATABASE_URL',
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
        'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
        'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
        'NEXT_PUBLIC_FIREBASE_APP_ID',
        'FIREBASE_SERVICE_ACCOUNT_JSON'
    ];

    const missing = [];
    requiredVars.forEach(varName => {
        const value = process.env[varName];
        if (value) {
            console.log(`✅ ${varName}: Set`);
        } else {
            console.log(`❌ ${varName}: Missing`);
            missing.push(varName);
        }
    });

    if (missing.length > 0) {
        console.log(`\n❌ Missing ${missing.length} required environment variables. Please update your .env.local file.\n`);
        return;
    }

    console.log('\n✅ All environment variables are set!\n');

    // Test Admin SDK
    console.log('🔧 Testing Firebase Admin SDK...');
    try {
        const admin = require('firebase-admin');

        // Parse service account
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

        // Initialize admin if not already done
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
            });
        }

        const db = admin.database();

        // Test write
        await db.ref('test/connection').set({
            timestamp: Date.now(),
            message: 'Firebase connection test successful!'
        });

        // Test read
        const snapshot = await db.ref('test/connection').once('value');
        const data = snapshot.val();

        if (data && data.message) {
            console.log('✅ Firebase Admin SDK: Connected successfully!');
            console.log(`📄 Test data: ${data.message}`);

            // Clean up test data
            await db.ref('test').remove();
            console.log('🧹 Test data cleaned up');
        } else {
            console.log('❌ Firebase Admin SDK: Could not read test data');
        }

    } catch (error) {
        console.log('❌ Firebase Admin SDK Error:', error.message);
        if (error.message.includes('PERMISSION_DENIED')) {
            console.log('💡 Tip: Make sure your Realtime Database rules allow read/write access');
        }
    }

    console.log('\n🎉 Firebase connection test complete!');
}

testFirebaseConnection().catch(console.error);