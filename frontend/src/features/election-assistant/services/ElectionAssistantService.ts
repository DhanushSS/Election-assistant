/**
 * ElectionAssistantService — Orchestrates multi-turn AI conversations.
 *
 * SRP: This service's sole responsibility is managing AI conversation state.
 * It does not handle HTTP, UI state, or direct Firestore writes.
 *
 * Dependency injection: ConversationRepository and Vertex AI client are
 * injected at construction time — making this class fully testable with mocks.
 *
 * Context window management: We maintain a rolling window of the last N
 * messages to stay within model context limits while preserving continuity.
 */

import { z } from 'zod';
import { generateWithFallback } from '@/infrastructure/vertex-ai/client';
import { ELECTION_SYSTEM_PROMPT } from '@/infrastructure/vertex-ai/prompts/electionPrompt';
import {
  ConversationRepository,
  type Message,
  type Conversation,
} from '@/infrastructure/firestore/repositories/ConversationRepository';
import type { Part } from '@google-cloud/vertexai';

// --- Request/Response schemas for runtime validation ---

export const ChatRequestSchema = z.object({
  uid: z.string().min(1),
  conversationId: z.string().min(1).optional(),
  message: z.string().min(1).max(5000),
  language: z.string().length(2).default('en'),
  region: z.string().max(10).optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export type ChatResponse =
  | {
      kind: 'success';
      reply: string;
      conversationId: string;
      model: string;
      tokensUsed: number;
      timelineData: TimelineStep[] | null;
    }
  | { kind: 'error'; code: string; message: string };

export const TimelineStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string().nullable(),
  description: z.string(),
  isDeadline: z.boolean(),
});

export type TimelineStep = z.infer<typeof TimelineStepSchema>;

const TimelineResponseSchema = z.object({
  type: z.literal('timeline'),
  steps: z.array(TimelineStepSchema),
});

// Maximum messages to include in context (prevents token overflow)
const MAX_CONTEXT_MESSAGES = 20;

export class ElectionAssistantService {
  constructor(
    private readonly conversationRepo: ConversationRepository = new ConversationRepository()
  ) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const validated = ChatRequestSchema.parse(request);

    try {
      // Create new conversation if none exists
      const conversationId = validated.conversationId
        ?? (await this.getOrCreateConversation(validated)).id;

      // Fetch conversation history for context
      const history = await this.conversationRepo.listMessages(
        validated.uid,
        conversationId,
        MAX_CONTEXT_MESSAGES
      );

      // Build context-aware prompt
      const contextParts = this.buildContextParts(history, validated.message, validated.region);
      const systemPrompt = this.buildSystemPrompt(validated.region, validated.language);

      // Generate response with fallback chain
      const result = await generateWithFallback(contextParts, systemPrompt, {
        temperature: 0.4,
        maxOutputTokens: 2048,
      });

      // Parse timeline data if present in response
      const { cleanText, timelineData } = this.parseTimelineFromResponse(result.text);

      // Persist both messages atomically (best-effort — don't fail chat on DB error)
      await this.persistMessages(validated.uid, conversationId, {
        userMessage: validated.message,
        assistantReply: cleanText,
        model: result.model,
        tokensUsed: result.tokensUsed,
        language: validated.language,
      }).catch(err => console.error('[ElectionAssistant] Failed to persist messages', err));

      // Generate conversation title from first user message
      if (history.length === 0) {
        await this.conversationRepo
          .updateConversationTitle(
            validated.uid,
            conversationId,
            validated.message.slice(0, 80)
          )
          .catch(() => undefined);
      }

      return {
        kind: 'success',
        reply: cleanText,
        conversationId,
        model: result.model,
        tokensUsed: result.tokensUsed,
        timelineData,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[ElectionAssistant] Chat error:', message);
      return {
        kind: 'error',
        code: 'CHAT_ERROR',
        message: 'Unable to process your request. Please try again.',
      };
    }
  }

  private async getOrCreateConversation(
    request: ChatRequest
  ): Promise<Conversation> {
    return this.conversationRepo.createConversation(request.uid, {
      uid: request.uid,
      language: request.language,
      region: request.region,
      messageCount: 0,
    });
  }

  private buildContextParts(
    history: Message[],
    currentMessage: string,
    region?: string
  ): Part[] {
    const parts: Part[] = [];

    if (region) {
      parts.push({
        text: `[Context: User is in region ${region}]\n`,
      });
    }

    // Include conversation history (rolling window)
    for (const msg of history.slice(-MAX_CONTEXT_MESSAGES)) {
      parts.push({
        text: `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`,
      });
    }

    parts.push({ text: `User: ${currentMessage}` });
    return parts;
  }

  private buildSystemPrompt(region?: string, language = 'en'): string {
    let prompt = ELECTION_SYSTEM_PROMPT;
    if (region) {
      prompt += `\n\nUSER CONTEXT: The user is located in region ${region}. Prioritize information relevant to this jurisdiction.`;
    }
    if (language !== 'en') {
      prompt += `\n\nLANGUAGE: Respond in ${language}. Use formal register appropriate for civic information.`;
    }
    return prompt;
  }

  private parseTimelineFromResponse(rawText: string): {
    cleanText: string;
    timelineData: TimelineStep[] | null;
  } {
    const jsonBlockRegex = /```json\n([\s\S]*?)\n```/;
    const match = rawText.match(jsonBlockRegex);

    if (!match?.[1]) {
      return { cleanText: rawText, timelineData: null };
    }

    try {
      const parsed = JSON.parse(match[1]);
      const validated = TimelineResponseSchema.safeParse(parsed);
      if (validated.success) {
        const cleanText = rawText.replace(jsonBlockRegex, '').trim();
        return { cleanText, timelineData: validated.data.steps };
      }
    } catch {
      // Malformed JSON — treat as plain text
    }

    return { cleanText: rawText, timelineData: null };
  }

  private async persistMessages(
    uid: string,
    conversationId: string,
    data: {
      userMessage: string;
      assistantReply: string;
      model: string;
      tokensUsed: number;
      language: string;
    }
  ): Promise<void> {
    await this.conversationRepo.addMessage(uid, conversationId, {
      role: 'user',
      content: data.userMessage,
      language: data.language,
    });
    await this.conversationRepo.addMessage(uid, conversationId, {
      role: 'assistant',
      content: data.assistantReply,
      model: data.model,
      tokensUsed: data.tokensUsed,
      language: data.language,
    });
  }
}
