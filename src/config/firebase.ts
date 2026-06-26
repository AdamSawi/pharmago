/**
 * Firebase configuration — PharmaGo
 *
 * Replace the placeholder values below with your real Firebase project config:
 *   Firebase console → Project settings → Your apps → Web app → SDK setup
 *
 * HOW TO GET YOUR CONFIG:
 *   1. Go to https://console.firebase.google.com
 *   2. Create project "pharmago" (or open existing)
 *   3. Add a Web app (the React Native SDK uses the Web config)
 *   4. Copy the firebaseConfig object here
 *   5. Enable: Authentication (Email/Password) + Firestore
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { initializeAuth, type Persistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// `firebase/auth`'s package.json "exports" map has no "react-native" condition
// for `getReactNativePersistence`, so it's missing from that module's public
// type surface even though Metro correctly bundles the React Native build at
// runtime (via `@firebase/auth`'s own "react-native" condition). Pull the
// function in directly from the underlying package and type it by hand.
const { getReactNativePersistence } = require('@firebase/auth') as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};

// ─── REPLACE WITH YOUR REAL CONFIG ───────────────────────────────────────────
const firebaseConfig = {
  apiKey: 'AIzaSyDScglKw4nIhEOMSjcexAdi6pc-qHdlxMI',
  authDomain: 'pharmago-inov.firebaseapp.com',
  projectId: 'pharmago-inov',
  storageBucket: 'pharmago-inov.firebasestorage.app',
  messagingSenderId: '938526253161',
  appId: '1:938526253161:web:21bae253e823dc792942f8',
};
// ─────────────────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);

// Auth with AsyncStorage persistence (survives app restarts)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore
export const db = getFirestore(app);
