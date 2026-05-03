/**
 * Unit tests — inputValidator middleware
 */

import { ChatSchema, TranslateSchema } from '../../backend/src/middleware/inputValidator';

describe('ChatSchema', () => {
  const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts valid chat request', () => {
    const result = ChatSchema.safeParse({
      message: 'What is Lok Sabha?',
      sessionId: VALID_UUID,
      language: 'en',
    });
    expect(result.success).toBe(true);
  });

  it('defaults language to en', () => {
    const result = ChatSchema.safeParse({
      message: 'Hello',
      sessionId: VALID_UUID,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.language).toBe('en');
  });

  it('rejects empty message', () => {
    const result = ChatSchema.safeParse({
      message: '',
      sessionId: VALID_UUID,
      language: 'en',
    });
    expect(result.success).toBe(false);
  });

  it('rejects message over 1000 chars', () => {
    const result = ChatSchema.safeParse({
      message: 'a'.repeat(1001),
      sessionId: VALID_UUID,
      language: 'en',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/1000/);
    }
  });

  it('rejects invalid UUID', () => {
    const result = ChatSchema.safeParse({
      message: 'Valid message',
      sessionId: 'not-a-uuid',
      language: 'en',
    });
    expect(result.success).toBe(false);
  });

  it('rejects unsupported language', () => {
    const result = ChatSchema.safeParse({
      message: 'Valid message',
      sessionId: VALID_UUID,
      language: 'fr',
    });
    expect(result.success).toBe(false);
  });

  it('strips XSS from message', () => {
    const result = ChatSchema.safeParse({
      message: '<script>alert("xss")</script>Tell me about elections',
      sessionId: VALID_UUID,
      language: 'en',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).not.toContain('<script>');
    }
  });

  it('accepts Hindi language', () => {
    const result = ChatSchema.safeParse({
      message: 'लोकसभा क्या है?',
      sessionId: VALID_UUID,
      language: 'hi',
    });
    expect(result.success).toBe(true);
  });
});

describe('TranslateSchema', () => {
  it('accepts valid translate request', () => {
    const result = TranslateSchema.safeParse({
      text: 'How to register to vote?',
      targetLanguage: 'hi',
    });
    expect(result.success).toBe(true);
  });

  it('rejects text over 5000 chars', () => {
    const result = TranslateSchema.safeParse({
      text: 'a'.repeat(5001),
      targetLanguage: 'hi',
    });
    expect(result.success).toBe(false);
  });

  it('rejects unsupported target language', () => {
    const result = TranslateSchema.safeParse({
      text: 'Hello',
      targetLanguage: 'fr',
    });
    expect(result.success).toBe(false);
  });
});
