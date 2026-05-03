/**
 * Vertex AI client with a three-tier fallback chain:
 * Gemini Pro → Gemini Flash → Static FAQ
 *
 * WHY: Quota exhaustion and transient errors are inevitable at scale.
 * This chain ensures users always get a response, degrading gracefully.
 * OWASP A04 (Insecure Design) — quota-aware rate limiting prevents abuse.
 */

import {
  VertexAI,
  HarmCategory,
  HarmBlockThreshold,
  type GenerateContentRequest,
  type GenerateContentResult,
  type Part,
} from '@google-cloud/vertexai';
import { STATIC_FAQ_RESPONSES } from './prompts/electionPrompt';

export type VertexAIModel = 'gemini-1.5-pro-002' | 'gemini-1.5-flash-002';

export interface GenerationConfig {
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: 'text/plain' | 'application/json';
}

export interface FallbackResult {
  text: string;
  model: VertexAIModel | 'static-faq';
  tokensUsed: number;
  groundingUsed: boolean;
}

export type VertexAIError =
  | { kind: 'quota-exceeded'; retryAfterMs: number }
  | { kind: 'content-filtered'; reason: string }
  | { kind: 'network-error'; message: string }
  | { kind: 'parse-error'; raw: string };

// Token budget per model (conservative: 80% of real limits)
const TOKEN_BUDGETS: Record<VertexAIModel, number> = {
  'gemini-1.5-pro-002': 800_000,
  'gemini-1.5-flash-002': 800_000,
};

class TokenUsageTracker {
  private usage = new Map<VertexAIModel, number>();
  private resetAt: number = Date.now() + 60_000;

  record(model: VertexAIModel, tokens: number): void {
    if (Date.now() > this.resetAt) {
      this.usage.clear();
      this.resetAt = Date.now() + 60_000;
    }
    this.usage.set(model, (this.usage.get(model) ?? 0) + tokens);
  }

  isNearQuota(model: VertexAIModel): boolean {
    return (this.usage.get(model) ?? 0) > TOKEN_BUDGETS[model] * 0.9;
  }
}

const tokenTracker = new TokenUsageTracker();

function createVertexClient(): VertexAI {
  return new VertexAI({
    project: process.env['GOOGLE_CLOUD_PROJECT'] ?? 'election-assistant-prod',
    location: process.env['VERTEX_AI_LOCATION'] ?? 'us-central1',
  });
}

async function generateWithModel(
  modelId: VertexAIModel,
  request: GenerateContentRequest,
  config?: GenerationConfig
): Promise<{ text: string; tokensUsed: number }> {
  const vertex = createVertexClient();
  const model = vertex.getGenerativeModel({
    model: modelId,
    generationConfig: {
      temperature: config?.temperature ?? 0.4,
      maxOutputTokens: config?.maxOutputTokens ?? 2048,
      ...(config?.responseMimeType
        ? { responseMimeType: config.responseMimeType }
        : {}),
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
  });

  const result: GenerateContentResult =
    await model.generateContent(request);

  const candidate = result.response.candidates?.[0];
  if (!candidate) {
    throw new Error('No candidates in response');
  }

  const text =
    candidate.content.parts
      .map((p: Part) => ('text' in p ? p.text : ''))
      .join('') ?? '';

  const tokensUsed =
    (result.response.usageMetadata?.totalTokenCount ?? 0);

  tokenTracker.record(modelId, tokensUsed);

  return { text, tokensUsed };
}

/**
 * Main entry point — runs the full fallback chain.
 * Callers receive the result regardless of which tier responded.
 */
export async function generateWithFallback(
  parts: Part[],
  systemInstruction: string,
  config?: GenerationConfig
): Promise<FallbackResult> {
  const request: GenerateContentRequest = {
    contents: [{ role: 'user', parts }],
    systemInstruction: {
      role: 'system',
      parts: [{ text: systemInstruction }],
    },
  };

  // Tier 1: Gemini Pro
  const proModel: VertexAIModel = 'gemini-1.5-pro-002';
  if (!tokenTracker.isNearQuota(proModel)) {
    try {
      const { text, tokensUsed } = await generateWithModel(
        proModel,
        request,
        config
      );
      return { text, model: proModel, tokensUsed, groundingUsed: false };
    } catch (err) {
      console.warn('[VertexAI] Gemini Pro failed, falling back to Flash', err);
    }
  }

  // Tier 2: Gemini Flash
  const flashModel: VertexAIModel = 'gemini-1.5-flash-002';
  if (!tokenTracker.isNearQuota(flashModel)) {
    try {
      const { text, tokensUsed } = await generateWithModel(
        flashModel,
        request,
        config
      );
      return { text, model: flashModel, tokensUsed, groundingUsed: false };
    } catch (err) {
      console.warn('[VertexAI] Gemini Flash failed, using static FAQ', err);
    }
  }

  // Tier 3: Static FAQ (always succeeds)
  const userQuery = parts.map(p => ('text' in p ? p.text : '')).join(' ');
  const faqResponse = findBestFaqMatch(userQuery);
  return {
    text: faqResponse,
    model: 'static-faq',
    tokensUsed: 0,
    groundingUsed: false,
  };
}

/**
 * Streaming variant — yields text chunks to the caller.
 * Used by the SSE /api/chat route.
 */
export async function* generateStreamWithFallback(
  parts: Part[],
  systemInstruction: string,
  config?: GenerationConfig
): AsyncGenerator<string> {
  const proModel: VertexAIModel = 'gemini-1.5-pro-002';
  if (!tokenTracker.isNearQuota(proModel)) {
    try {
      const vertex = createVertexClient();
      const model = vertex.getGenerativeModel({
        model: proModel,
        generationConfig: {
          temperature: config?.temperature ?? 0.4,
          maxOutputTokens: config?.maxOutputTokens ?? 2048,
        },
      });

      const stream = await model.generateContentStream({
        contents: [{ role: 'user', parts }],
        systemInstruction: {
          role: 'system',
          parts: [{ text: systemInstruction }],
        },
      });

      for await (const chunk of stream.stream) {
        const text =
          chunk.candidates?.[0]?.content.parts
            .map((p: Part) => ('text' in p ? p.text : ''))
            .join('') ?? '';
        if (text) yield text;
      }
      return;
    } catch {
      // Fall through to Flash
    }
  }

  // Fallback: Non-streaming Flash response, chunked for UX
  const result = await generateWithFallback(parts, systemInstruction, config);
  const words = result.text.split(' ');
  for (let i = 0; i < words.length; i += 5) {
    yield words.slice(i, i + 5).join(' ') + ' ';
    await new Promise(r => setTimeout(r, 30));
  }
}

function findBestFaqMatch(query: string): string {
  const lower = query.toLowerCase();
  for (const [keywords, answer] of Object.entries(STATIC_FAQ_RESPONSES)) {
    if (keywords.split(',').some(k => lower.includes(k.trim()))) {
      return answer;
    }
  }
  return STATIC_FAQ_RESPONSES['default'] ?? 'I can help you with election-related questions. Please ask about registration, voting procedures, timelines, or candidate information.';
}
