/**
 * Unit tests for ConversationRepository Zod schemas
 *
 * Tests validate:
 * - Valid messages pass all schema checks
 * - Invalid inputs are rejected with descriptive errors
 * - Edge cases (max length, empty strings, role enum)
 * - TimelineStep schema for AI response parsing
 */

import {
  MessageSchema,
  ConversationSchema,
} from '@/infrastructure/firestore/repositories/ConversationRepository';
import {
  TimelineStepSchema,
  ChatRequestSchema,
} from '@/features/election-assistant/services/ElectionAssistantService';

describe('MessageSchema', () => {
  const validMessage = {
    id: 'msg-1',
    conversationId: 'conv-1',
    role: 'user',
    content: 'How do I register?',
    createdAt: Date.now(),
  };

  it('accepts a valid user message', () => {
    const result = MessageSchema.safeParse(validMessage);
    expect(result.success).toBe(true);
  });

  it('accepts all valid roles', () => {
    const roles = ['user', 'assistant', 'system'] as const;
    for (const role of roles) {
      const result = MessageSchema.safeParse({ ...validMessage, role });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid role', () => {
    const result = MessageSchema.safeParse({ ...validMessage, role: 'bot' });
    expect(result.success).toBe(false);
  });

  it('rejects empty content', () => {
    const result = MessageSchema.safeParse({ ...validMessage, content: '' });
    expect(result.success).toBe(false);
  });

  it('rejects content exceeding 10,000 characters', () => {
    const result = MessageSchema.safeParse({
      ...validMessage,
      content: 'x'.repeat(10_001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields: model, tokensUsed, language', () => {
    const result = MessageSchema.safeParse({
      ...validMessage,
      model: 'gemini-1.5-pro-002',
      tokensUsed: 150,
      language: 'en',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative tokensUsed', () => {
    const result = MessageSchema.safeParse({
      ...validMessage,
      tokensUsed: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects language codes that are not exactly 2 characters', () => {
    expect(MessageSchema.safeParse({ ...validMessage, language: 'eng' }).success).toBe(false);
    expect(MessageSchema.safeParse({ ...validMessage, language: 'e' }).success).toBe(false);
    expect(MessageSchema.safeParse({ ...validMessage, language: 'en' }).success).toBe(true);
  });
});

describe('ConversationSchema', () => {
  const validConversation = {
    id: 'conv-1',
    uid: 'user-abc',
    language: 'en',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messageCount: 0,
  };

  it('accepts a valid conversation', () => {
    const result = ConversationSchema.safeParse(validConversation);
    expect(result.success).toBe(true);
  });

  it('rejects empty uid', () => {
    const result = ConversationSchema.safeParse({ ...validConversation, uid: '' });
    expect(result.success).toBe(false);
  });

  it('rejects title longer than 200 characters', () => {
    const result = ConversationSchema.safeParse({
      ...validConversation,
      title: 'a'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('defaults messageCount to 0 when not provided', () => {
    const { messageCount: _mc, ...withoutCount } = validConversation;
    const result = ConversationSchema.safeParse(withoutCount);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.messageCount).toBe(0);
  });

  it('rejects negative messageCount', () => {
    const result = ConversationSchema.safeParse({
      ...validConversation,
      messageCount: -5,
    });
    expect(result.success).toBe(false);
  });
});

describe('ChatRequestSchema', () => {
  const validRequest = {
    uid: 'user-abc',
    message: 'How do I vote?',
    language: 'en',
  };

  it('accepts a valid chat request', () => {
    const result = ChatRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it('rejects empty message', () => {
    const result = ChatRequestSchema.safeParse({ ...validRequest, message: '' });
    expect(result.success).toBe(false);
  });

  it('rejects message over 5000 characters', () => {
    const result = ChatRequestSchema.safeParse({
      ...validRequest,
      message: 'x'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it('defaults language to "en" when not provided', () => {
    const { language: _lang, ...withoutLang } = validRequest;
    const result = ChatRequestSchema.safeParse(withoutLang);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.language).toBe('en');
  });

  it('accepts optional region field', () => {
    const result = ChatRequestSchema.safeParse({
      ...validRequest,
      region: 'US-CA',
    });
    expect(result.success).toBe(true);
  });

  it('rejects region longer than 10 characters', () => {
    const result = ChatRequestSchema.safeParse({
      ...validRequest,
      region: 'US-CALIFORNIA',
    });
    expect(result.success).toBe(false);
  });
});

describe('TimelineStepSchema', () => {
  const validStep = {
    id: 'step-1',
    title: 'Voter Registration Deadline',
    date: '30 days before election',
    description: 'Last day to register to vote.',
    isDeadline: true,
  };

  it('accepts a valid timeline step', () => {
    const result = TimelineStepSchema.safeParse(validStep);
    expect(result.success).toBe(true);
  });

  it('accepts null date', () => {
    const result = TimelineStepSchema.safeParse({ ...validStep, date: null });
    expect(result.success).toBe(true);
  });

  it('rejects non-boolean isDeadline', () => {
    const result = TimelineStepSchema.safeParse({
      ...validStep,
      isDeadline: 'yes',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const { title: _title, ...withoutTitle } = validStep;
    const result = TimelineStepSchema.safeParse(withoutTitle);
    expect(result.success).toBe(false);
  });
});
