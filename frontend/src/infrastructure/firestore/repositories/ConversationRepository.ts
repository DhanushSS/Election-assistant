/**
 * ConversationRepository — Data access layer for conversation persistence.
 *
 * WHY repository pattern: Decouples business logic from Firestore specifics.
 * Swap Firestore for any store without touching service/component code.
 * This follows SRP — this class's sole responsibility is Firestore I/O.
 *
 * Data model (normalized, subcollections):
 *   users/{uid}/conversations/{cid}
 *   users/{uid}/conversations/{cid}/messages/{mid}
 *
 * Composite indexes required (see firestore.indexes.json):
 *   conversations: [uid, updatedAt DESC]
 *   messages: [conversationId, createdAt ASC]
 */

import { z } from 'zod';
import { getAdminFirestore } from '../client';
import type { Firestore } from 'firebase-admin/firestore';

// --- Zod schemas for runtime validation at the DB boundary ---

export const MessageRoleSchema = z.enum(['user', 'assistant', 'system']);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const MessageSchema = z.object({
  id: z.string().min(1),
  conversationId: z.string().min(1),
  role: MessageRoleSchema,
  content: z.string().min(1).max(10_000),
  model: z.string().optional(),
  tokensUsed: z.number().int().nonnegative().optional(),
  createdAt: z.number().positive(), // Unix ms timestamp
  language: z.string().length(2).optional(),
});

export type Message = z.infer<typeof MessageSchema>;

export const ConversationSchema = z.object({
  id: z.string().min(1),
  uid: z.string().min(1),
  title: z.string().max(200).optional(),
  region: z.string().optional(),
  language: z.string().length(2).default('en'),
  createdAt: z.number().positive(),
  updatedAt: z.number().positive(),
  messageCount: z.number().int().nonnegative().default(0),
});

export type Conversation = z.infer<typeof ConversationSchema>;

// --- Repository ---

export class ConversationRepository {
  private readonly db: Firestore;

  // Dependency injection — testable with a mock Firestore instance
  constructor(db?: Firestore) {
    this.db = db ?? getAdminFirestore();
  }

  private userRef(uid: string) {
    return this.db.collection('users').doc(uid);
  }

  private conversationsRef(uid: string) {
    return this.userRef(uid).collection('conversations');
  }

  private messagesRef(uid: string, conversationId: string) {
    return this.conversationsRef(uid)
      .doc(conversationId)
      .collection('messages');
  }

  async createConversation(
    uid: string,
    data: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Conversation> {
    const ref = this.conversationsRef(uid).doc();
    const now = Date.now();
    const conversation: Conversation = {
      ...data,
      id: ref.id,
      uid,
      createdAt: now,
      updatedAt: now,
    };
    ConversationSchema.parse(conversation); // Runtime validation
    await ref.set(conversation);
    return conversation;
  }

  async getConversation(
    uid: string,
    conversationId: string
  ): Promise<Conversation | null> {
    const snap = await this.conversationsRef(uid).doc(conversationId).get();
    if (!snap.exists) return null;
    const data = snap.data();
    return ConversationSchema.parse({ ...data, id: snap.id });
  }

  async listConversations(uid: string, limit = 20): Promise<Conversation[]> {
    const snaps = await this.conversationsRef(uid)
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .get();
    return snaps.docs.map(d =>
      ConversationSchema.parse({ ...d.data(), id: d.id })
    );
  }

  async addMessage(
    uid: string,
    conversationId: string,
    data: Omit<Message, 'id' | 'conversationId' | 'createdAt'>
  ): Promise<Message> {
    const ref = this.messagesRef(uid, conversationId).doc();
    const message: Message = {
      ...data,
      id: ref.id,
      conversationId,
      createdAt: Date.now(),
    };
    MessageSchema.parse(message); // Runtime validation

    // Batch write: save message + update conversation atomically
    const batch = this.db.batch();
    batch.set(ref, message);
    batch.update(this.conversationsRef(uid).doc(conversationId), {
      updatedAt: Date.now(),
      messageCount: (await this.getConversation(uid, conversationId))
        ?.messageCount
        ? ((await this.getConversation(uid, conversationId))
            ?.messageCount ?? 0) + 1
        : 1,
    });
    await batch.commit();

    return message;
  }

  async listMessages(
    uid: string,
    conversationId: string,
    limit = 50
  ): Promise<Message[]> {
    const snaps = await this.messagesRef(uid, conversationId)
      .orderBy('createdAt', 'asc')
      .limit(limit)
      .get();
    return snaps.docs.map(d =>
      MessageSchema.parse({ ...d.data(), id: d.id })
    );
  }

  async updateConversationTitle(
    uid: string,
    conversationId: string,
    title: string
  ): Promise<void> {
    await this.conversationsRef(uid).doc(conversationId).update({
      title: title.slice(0, 200),
      updatedAt: Date.now(),
    });
  }
}
