/**
 * POST /api/translate — Translation API v3 endpoint
 *
 * Security:
 * - OWASP A07: Firebase auth token required
 * - OWASP A03: Zod validates all input including language code allowlist
 * - OWASP A04: Per-user rate limit (10 req/min) to prevent abuse
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps } from 'firebase-admin/app';
import { translationService } from '@/shared/services/TranslationService';

if (getApps().length === 0) {
  initializeApp({
    projectId: process.env['GOOGLE_CLOUD_PROJECT'] ?? 'election-assistant-prod',
  });
}

const SUPPORTED_LANGUAGES = [
  'en', 'es', 'fr', 'ar', 'hi', 'pt', 'de', 'zh', 'ja', 'ko',
  'it', 'ru', 'nl', 'pl', 'vi', 'th', 'tr', 'fa', 'he', 'ur',
] as const;

const TranslateBodySchema = z.object({
  text: z.string().min(1).max(30_000),
  targetLanguage: z.enum(SUPPORTED_LANGUAGES),
  sourceLanguage: z.enum(SUPPORTED_LANGUAGES).optional(),
});

// Simple per-user rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkTranslateRateLimit(uid: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(uid);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(uid, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (record.count >= 10) return false;
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  // Auth check (OWASP A07)
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await getAuth().verifyIdToken(authHeader.slice(7));
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Rate limit (OWASP A04)
  if (!checkTranslateRateLimit(uid)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  // Input validation (OWASP A03)
  let body: z.infer<typeof TranslateBodySchema>;
  try {
    body = TranslateBodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const result = await translationService.translate({
      text: body.text,
      targetLanguage: body.targetLanguage,
      sourceLanguage: body.sourceLanguage,
    });

    return NextResponse.json({
      translatedText: result.translatedText,
      detectedSourceLanguage: result.detectedSourceLanguage,
      isRTL: result.isRTL,
      cached: result.cached,
    });
  } catch (err) {
    console.error('[/api/translate] Error:', err);
    return NextResponse.json(
      { error: 'Translation failed', translatedText: body.text },
      { status: 500 }
    );
  }
}
