/**
 * Unit tests for ElectionAssistantService
 *
 * Tests cover:
 * - Happy path: creates conversation, generates response
 * - Context window management: only last 20 messages included
 * - Fallback chain: handles Vertex AI errors gracefully
 * - Timeline parsing: extracts structured data from JSON blocks
 * - Input validation: Zod rejects invalid inputs
 * - Persistence failure: chat still succeeds if DB write fails
 */

import { ElectionAssistantService } from '@/features/election-assistant/services/ElectionAssistantService';
import { ConversationRepository } from '@/infrastructure/firestore/repositories/ConversationRepository';
import * as vertexClient from '@/infrastructure/vertex-ai/client';

// Mock the Vertex AI client
jest.mock('@/infrastructure/vertex-ai/client', () => ({
  generateWithFallback: jest.fn(),
  generateStreamWithFallback: jest.fn(),
}));

// Mock the ConversationRepository
jest.mock('@/infrastructure/firestore/repositories/ConversationRepository');

const mockGenerateWithFallback = vertexClient.generateWithFallback as jest.MockedFunction<
  typeof vertexClient.generateWithFallback
>;

describe('ElectionAssistantService', () => {
  let service: ElectionAssistantService;
  let mockRepo: jest.Mocked<ConversationRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepo = {
      createConversation: jest.fn(),
      getConversation: jest.fn(),
      listConversations: jest.fn(),
      addMessage: jest.fn(),
      listMessages: jest.fn(),
      updateConversationTitle: jest.fn(),
    } as unknown as jest.Mocked<ConversationRepository>;

    service = new ElectionAssistantService(mockRepo);

    // Default mocks
    mockRepo.createConversation.mockResolvedValue({
      id: 'conv-123',
      uid: 'user-abc',
      language: 'en',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
    });

    mockRepo.listMessages.mockResolvedValue([]);
    mockRepo.addMessage.mockResolvedValue({
      id: 'msg-1',
      conversationId: 'conv-123',
      role: 'user',
      content: 'test',
      createdAt: Date.now(),
    });
    mockRepo.updateConversationTitle.mockResolvedValue();

    mockGenerateWithFallback.mockResolvedValue({
      text: 'To register to vote, visit vote.gov.',
      model: 'gemini-1.5-pro-002',
      tokensUsed: 150,
      groundingUsed: false,
    });
  });

  describe('chat()', () => {
    it('returns a successful response for a valid request', async () => {
      const result = await service.chat({
        uid: 'user-abc',
        message: 'How do I register to vote?',
        language: 'en',
      });

      expect(result.kind).toBe('success');
      if (result.kind !== 'success') return;
      expect(result.reply).toBe('To register to vote, visit vote.gov.');
      expect(result.conversationId).toBe('conv-123');
      expect(result.model).toBe('gemini-1.5-pro-002');
      expect(result.tokensUsed).toBe(150);
      expect(result.timelineData).toBeNull();
    });

    it('creates a new conversation when none is provided', async () => {
      await service.chat({
        uid: 'user-abc',
        message: 'Hello',
        language: 'en',
      });

      expect(mockRepo.createConversation).toHaveBeenCalledWith(
        'user-abc',
        expect.objectContaining({
          uid: 'user-abc',
          language: 'en',
        })
      );
    });

    it('reuses an existing conversation when conversationId is provided', async () => {
      mockRepo.listMessages.mockResolvedValue([
        {
          id: 'old-msg',
          conversationId: 'existing-conv',
          role: 'user',
          content: 'Previous message',
          createdAt: Date.now() - 5000,
        },
      ]);

      await service.chat({
        uid: 'user-abc',
        conversationId: 'existing-conv',
        message: 'Follow up question',
        language: 'en',
      });

      expect(mockRepo.createConversation).not.toHaveBeenCalled();
      expect(mockRepo.listMessages).toHaveBeenCalledWith(
        'user-abc',
        'existing-conv',
        20
      );
    });

    it('includes region context in the prompt when provided', async () => {
      await service.chat({
        uid: 'user-abc',
        message: 'When is the deadline?',
        language: 'en',
        region: 'US-CA',
      });

      const [partsArg, systemPromptArg] = mockGenerateWithFallback.mock.calls[0]!;
      const partsText = partsArg.map(p => ('text' in p ? p.text : '')).join('');
      expect(partsText).toContain('US-CA');
      expect(systemPromptArg).toContain('US-CA');
    });

    it('extracts timeline data from structured JSON response', async () => {
      mockGenerateWithFallback.mockResolvedValue({
        text: `Here are the key election steps:

\`\`\`json
{
  "type": "timeline",
  "steps": [
    {
      "id": "step-1",
      "title": "Voter Registration",
      "date": "30 days before election",
      "description": "Register to vote",
      "isDeadline": true
    }
  ]
}
\`\`\``,
        model: 'gemini-1.5-pro-002',
        tokensUsed: 300,
        groundingUsed: false,
      });

      const result = await service.chat({
        uid: 'user-abc',
        message: 'Show me the election timeline',
        language: 'en',
      });

      expect(result.kind).toBe('success');
      if (result.kind !== 'success') return;
      expect(result.timelineData).not.toBeNull();
      expect(result.timelineData).toHaveLength(1);
      expect(result.timelineData?.[0]?.title).toBe('Voter Registration');
      expect(result.timelineData?.[0]?.isDeadline).toBe(true);
      expect(result.reply).not.toContain('```json');
    });

    it('handles malformed JSON in response gracefully (returns plain text)', async () => {
      mockGenerateWithFallback.mockResolvedValue({
        text: 'Here is a timeline:\n```json\n{ invalid json here \n```',
        model: 'gemini-1.5-pro-002',
        tokensUsed: 100,
        groundingUsed: false,
      });

      const result = await service.chat({
        uid: 'user-abc',
        message: 'Show timeline',
        language: 'en',
      });

      expect(result.kind).toBe('success');
      if (result.kind !== 'success') return;
      expect(result.timelineData).toBeNull();
    });

    it('returns error response when Vertex AI throws', async () => {
      mockGenerateWithFallback.mockRejectedValue(new Error('Quota exceeded'));

      const result = await service.chat({
        uid: 'user-abc',
        message: 'Hello',
        language: 'en',
      });

      expect(result.kind).toBe('error');
      if (result.kind !== 'error') return;
      expect(result.code).toBe('CHAT_ERROR');
    });

    it('still returns success when message persistence fails', async () => {
      mockRepo.addMessage.mockRejectedValue(new Error('Firestore unavailable'));

      const result = await service.chat({
        uid: 'user-abc',
        message: 'Will this still work?',
        language: 'en',
      });

      // Chat succeeds even if DB write fails
      expect(result.kind).toBe('success');
    });

    it('rejects invalid uid (empty string) via Zod', async () => {
      await expect(
        service.chat({ uid: '', message: 'Hello', language: 'en' })
      ).rejects.toThrow();
    });

    it('rejects message longer than 5000 characters via Zod', async () => {
      await expect(
        service.chat({
          uid: 'user-abc',
          message: 'x'.repeat(5001),
          language: 'en',
        })
      ).rejects.toThrow();
    });

    it('passes language context to system prompt when non-English', async () => {
      await service.chat({
        uid: 'user-abc',
        message: '¿Cómo me registro?',
        language: 'es',
      });

      const [, systemPromptArg] = mockGenerateWithFallback.mock.calls[0]!;
      expect(systemPromptArg).toContain('es');
    });

    it('updates conversation title on first message', async () => {
      mockRepo.listMessages.mockResolvedValue([]); // Empty history = first message

      await service.chat({
        uid: 'user-abc',
        message: 'How do I find my polling place?',
        language: 'en',
      });

      expect(mockRepo.updateConversationTitle).toHaveBeenCalledWith(
        'user-abc',
        'conv-123',
        'How do I find my polling place?'
      );
    });

    it('does NOT update conversation title on subsequent messages', async () => {
      mockRepo.listMessages.mockResolvedValue([
        {
          id: 'msg-existing',
          conversationId: 'conv-123',
          role: 'user',
          content: 'Previous',
          createdAt: Date.now() - 1000,
        },
      ]);

      await service.chat({
        uid: 'user-abc',
        conversationId: 'conv-123',
        message: 'Follow up',
        language: 'en',
      });

      expect(mockRepo.updateConversationTitle).not.toHaveBeenCalled();
    });
  });
});
