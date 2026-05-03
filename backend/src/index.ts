/**
 * VoteAI India Backend — Express entry point
 * Runs on Cloud Run, port 8080
 */

import express from 'express';
import cors from 'cors';
import { applySecurityHeaders } from './middleware/securityHeaders';
import { rateLimiter } from './middleware/rateLimiter';
import chatRouter from './routes/chat';
import translateRouter from './routes/translate';

const app = express();
const PORT = parseInt(process.env.PORT ?? '8080', 10);

// ── Security headers (before anything) ──────────
applySecurityHeaders(app);

// ── CORS ─────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL ?? 'http://localhost:3000',
  'https://election-assistant-prod.web.app',
  'https://election-assistant-prod.firebaseapp.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: false,
}));

// ── Body parsing ──────────────────────────────────
app.use(express.json({ limit: '64kb' })); // Prevent large payload attacks

// ── Global rate limiter ───────────────────────────
app.use(rateLimiter);

// ── Health check ──────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'voteai-india-backend', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────
app.use('/api/chat', chatRouter);
app.use('/api/translate', translateRouter);

// ── 404 handler ──────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error handler ─────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[app] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`VoteAI India backend running on port ${PORT}`);
});

export default app;
