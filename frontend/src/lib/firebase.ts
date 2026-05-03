/**
 * Firebase Firestore client — no Auth, no Admin SDK
 * Only used for client-side reads of election data cache
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let db: Firestore;

// Lazy init — only on client
export function getFirestoreClient(): Firestore {
  if (typeof window === 'undefined') {
    throw new Error('Firestore client should only be used on client side');
  }
  if (!db) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;
    db = getFirestore(app);
  }
  return db;
}
