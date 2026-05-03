/**
 * Chat routes — POST /api/chat (SSE streaming), GET /api/chat/history/:sessionId
 */

import { Router, type Request, type Response } from 'express';
import { GeminiService } from '../services/GeminiService';
import { FirestoreService } from '../services/FirestoreService';
import { validateBody, ChatSchema } from '../middleware/inputValidator';
import { chatRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const firestoreService = new FirestoreService();
const geminiService = new GeminiService(firestoreService);

// POST /api/chat — streaming SSE response
router.post('/', chatRateLimiter, validateBody(ChatSchema), async (req: Request, res: Response): Promise<void> => {
  const { message, sessionId, language } = req.body as {
    message: string;
    sessionId: string;
    language: 'en' | 'hi';
  };

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  // Load conversation history
  let history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  try {
    const rawHistory = await firestoreService.getHistory(sessionId, 10);
    history = rawHistory.map(m => ({ role: m.role, content: m.content }));
  } catch (err) {
    console.warn('[chat] Failed to load history, starting fresh:', err);
  }

  // Handle client disconnect
  req.on('close', () => {
    if (!res.writableEnded) res.end();
  });

  try {
    await geminiService.streamChat({ message, sessionId, language, history, res });
  } catch (err) {
    console.error('[chat] Unhandled stream error:', err);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to get response. Please try again.' })}\n\n`);
      res.end();
    }
  }
});

// GET /api/chat/history/:sessionId
router.get('/history/:sessionId', async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;

  // Basic UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!sessionId || !uuidRegex.test(sessionId)) {
    res.status(400).json({ error: 'Invalid session ID' });
    return;
  }

  try {
    const history = await firestoreService.getHistory(sessionId, 20);
    res.json({ history });
  } catch (err) {
    console.error('[chat/history] Error:', err);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

export default router;
