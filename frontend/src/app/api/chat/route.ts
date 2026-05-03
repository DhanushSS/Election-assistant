/**
 * /api/chat — Server-Sent Events streaming endpoint
 *
 * WHY SSE over WebSocket: SSE is unidirectional (server→client), simpler
 * to implement on Next.js Edge, naturally supports HTTP/2 multiplexing,
 * and doesn't require a stateful connection manager.
 *
 * Security:
 * - OWASP A07: Firebase ID token verified on every request
 * - OWASP A03: Zod validates all request body fields
 * - OWASP A04: Rate limiting per user UID (not just IP)
 * - OWASP A05: CSP headers set in next.config.js
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { generateStreamWithFallback } from '@/infrastructure/vertex-ai/client';
import { ELECTION_SYSTEM_PROMPT } from '@/infrastructure/vertex-ai/prompts/electionPrompt';
import { ConversationRepository } from '@/infrastructure/firestore/repositories/ConversationRepository';
import { initializeApp, getApps } from 'firebase-admin/app';
import type { Part } from '@google-cloud/vertexai';

// Initialize Firebase Admin (idempotent)
if (getApps().length === 0) {
  initializeApp({ projectId: process.env['GOOGLE_CLOUD_PROJECT'] ?? 'election-assistant-prod' });
}

const ChatBodySchema = z.object({
  message: z.string().min(1).max(5000),
  conversationId: z.string().min(1).optional(),
  language: z.string().length(2).default('en'),
  region: z.string().max(10).optional(),
});

// Per-user rate limiter (in-memory; use Redis/Firestore for multi-instance)
const userRequestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

function checkRateLimit(uid: string): boolean {
  const now = Date.now();
  const record = userRequestCounts.get(uid);

  if (!record || now > record.resetAt) {
    userRequestCounts.set(uid, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  // 1. Authenticate (OWASP A07)
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let uid: string;
  try {
    const token = authHeader.slice(7);
    const decoded = await getAuth().verifyIdToken(token, true); // checkRevoked=true
    uid = decoded.uid;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. Rate limit (OWASP A04)
  if (!checkRateLimit(uid)) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please wait 60 seconds.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      }
    );
  }

  // 3. Validate body (OWASP A03)
  let body: z.infer<typeof ChatBodySchema>;
  try {
    const raw = await request.json();
    body = ChatBodySchema.parse(raw);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. Fetch conversation history
  const repo = new ConversationRepository();
  let conversationId = body.conversationId;
  if (!conversationId) {
    const conv = await repo.createConversation(uid, {
      uid,
      language: body.language,
      region: body.region,
      messageCount: 0,
    });
    conversationId = conv.id;
  }

  const history = await repo.listMessages(uid, conversationId, 20);

  // 5. Build context parts
  const parts: Part[] = [];
  if (body.region) {
    parts.push({ text: `[Region: ${body.region}]\n` });
  }
  for (const msg of history.slice(-20)) {
    parts.push({
      text: `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`,
    });
  }
  parts.push({ text: `User: ${body.message}` });

  const systemPrompt =
    ELECTION_SYSTEM_PROMPT +
    (body.region
      ? `\n\nUSER CONTEXT: Region = ${body.region}.`
      : '') +
    (body.language !== 'en'
      ? `\n\nLANGUAGE: Respond in ${body.language}.`
      : '');

  // 6. Stream SSE response
  const encoder = new TextEncoder();
  let fullResponse = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send conversationId as first event
        controller.enqueue(
          encoder.encode(
            `event: meta\ndata: ${JSON.stringify({ conversationId })}\n\n`
          )
        );

        for await (const chunk of generateStreamWithFallback(parts, systemPrompt)) {
          fullResponse += chunk;
          controller.enqueue(
            encoder.encode(`event: chunk\ndata: ${JSON.stringify({ text: chunk })}\n\n`)
          );
        }

        // Persist messages after streaming completes
        await repo.addMessage(uid, conversationId!, {
          role: 'user',
          content: body.message,
          language: body.language,
        }).catch(console.error);

        await repo.addMessage(uid, conversationId!, {
          role: 'assistant',
          content: fullResponse,
          language: body.language,
        }).catch(console.error);

        controller.enqueue(
          encoder.encode(
            `event: done\ndata: ${JSON.stringify({ conversationId })}\n\n`
          )
        );
        controller.close();
      } catch {
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({ message: 'Stream error' })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
