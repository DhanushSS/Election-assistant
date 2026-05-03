/**
 * FirestoreService — Conversation persistence for VoteAI India
 * No auth — sessions identified by anonymous UUID
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, type Firestore } from 'firebase-admin/firestore';

// Init Firebase Admin (once)
if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccount) {
    initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
  } else {
    // On Cloud Run — uses default service account via ADC
    initializeApp();
  }
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: FirebaseFirestore.Timestamp;
}

export class FirestoreService {
  private db: Firestore;

  constructor() {
    this.db = getFirestore();
  }

  async saveMessage(sessionId: string, role: 'user' | 'assistant', content: string): Promise<void> {
    const colRef = this.db
      .collection('conversations')
      .doc(sessionId)
      .collection('messages');

    await colRef.add({
      role,
      content,
      createdAt: FieldValue.serverTimestamp(),
      // TTL: 30 days
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }

  async getHistory(sessionId: string, limit = 20): Promise<ConversationMessage[]> {
    const snapshot = await this.db
      .collection('conversations')
      .doc(sessionId)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .limitToLast(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as ConversationMessage);
  }

  async sessionExists(sessionId: string): Promise<boolean> {
    const doc = await this.db.collection('conversations').doc(sessionId).get();
    return doc.exists;
  }
}
