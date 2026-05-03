/**
 * Rate limiter middleware — 60 requests per 15 minutes per IP
 * OWASP A04: Insecure Design prevention
 */

import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Trust Cloud Run's forwarded IP
    const forwarded = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0] ?? req.ip ?? 'unknown';
    return ip.trim();
  },
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please wait before trying again.',
      retryAfter: '15 minutes',
    });
  },
});

// Stricter limit for chat endpoint
export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Chat rate limit exceeded',
      message: 'Too many messages. Please wait a moment before sending another message.',
    });
  },
});
