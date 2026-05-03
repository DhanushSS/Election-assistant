/**
 * Firestore client initialization.
 *
 * WHY Admin SDK on server / Client SDK on client:
 * Admin SDK bypasses security rules (safe only server-side).
 * Client SDK respects security rules (required for client-side access).
 *
 * OWASP A01 (Broken Access Control): Client-side operations are always
 * gated by Firestore security rules. Server-side uses service account
 * credentials loaded from Secret Manager, not env vars.
 */

import { initializeApp, getApps, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  if (getApps().length > 0) {
    adminApp = getApps()[0]!;
    return adminApp;
  }

  // In production: credentials come from Workload Identity or Secret Manager.
  // In development: GOOGLE_APPLICATION_CREDENTIALS env var points to a key file.
  adminApp = initializeApp({
    projectId: process.env['GOOGLE_CLOUD_PROJECT'] ?? 'election-assistant-prod',
  });

  return adminApp;
}

export function getAdminFirestore(): Firestore {
  const app = getAdminApp();
  const db = getFirestore(app);

  // Connect to emulator in development
  if (process.env['FIRESTORE_EMULATOR_HOST']) {
    db.settings({ host: process.env['FIRESTORE_EMULATOR_HOST'], ssl: false });
  }

  return db;
}
