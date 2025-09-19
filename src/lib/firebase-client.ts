
'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from './firebase-config';

// Client-side app initialization
function initializeClientApp() {
    return !getApps().length ? initializeApp(firebaseConfig) : getApp();
}

export const getClientApp = () => initializeClientApp();
