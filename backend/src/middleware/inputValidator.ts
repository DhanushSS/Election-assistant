/**
 * Input validation middleware — Zod schemas + DOMPurify XSS stripping
 * OWASP A03: Injection prevention
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import type { Request, Response, NextFunction } from 'express';

// Chat request schema
export const ChatSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message too long (max 1000 characters)')
    .transform(val => DOMPurify.sanitize(val.trim())),
  sessionId: z
    .string()
    .uuid('Invalid session ID format'),
  language: z
    .enum(['en', 'hi'])
    .default('en'),
});

// Translation request schema
export const TranslateSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(5000)
    .transform(val => DOMPurify.sanitize(val.trim())),
  targetLanguage: z.enum(['en', 'hi']),
});

export type ChatRequest = z.infer<typeof ChatSchema>;
export type TranslateRequest = z.infer<typeof TranslateSchema>;

// Generic validation middleware factory
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Invalid request',
        details: result.error.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
