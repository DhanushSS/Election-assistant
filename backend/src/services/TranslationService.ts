/**
 * TranslationService — Google Cloud Translation API v3
 * EN ↔ HI with LRU cache to minimize API calls
 */

import { TranslationServiceClient } from '@google-cloud/translate';
import { LRUCache } from 'lru-cache';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT ?? 'election-assistant-prod';
const LOCATION = 'global';
const PARENT = `projects/${PROJECT_ID}/locations/${LOCATION}`;

const client = new TranslationServiceClient();

// Cache: key = `${text}|${targetLang}`, max 500 entries, 1hr TTL
const cache = new LRUCache<string, string>({
  max: 500,
  ttl: 60 * 60 * 1000,
});

export type SupportedLanguage = 'en' | 'hi';

export class TranslationService {
  async translate(text: string, targetLanguage: SupportedLanguage): Promise<string> {
    if (!text.trim()) return text;
    if (targetLanguage === 'en') return text; // English is default, no API call

    const cacheKey = `${text}|${targetLanguage}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const [response] = await client.translateText({
        parent: PARENT,
        contents: [text],
        mimeType: 'text/plain',
        sourceLanguageCode: 'en',
        targetLanguageCode: targetLanguage,
        // Election glossary if configured
        ...(process.env.TRANSLATION_GLOSSARY_ID && {
          glossaryConfig: {
            glossary: `${PARENT}/glossaries/${process.env.TRANSLATION_GLOSSARY_ID}`,
          },
        }),
      });

      const translated = response.translations?.[0]?.translatedText ?? text;
      cache.set(cacheKey, translated);
      return translated;
    } catch (err) {
      console.error('[TranslationService] API error:', err);
      return text; // Graceful fallback — return original text
    }
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const [response] = await client.detectLanguage({
        parent: PARENT,
        content: text,
        mimeType: 'text/plain',
      });
      return response.languages?.[0]?.languageCode ?? 'en';
    } catch {
      return 'en';
    }
  }
}
