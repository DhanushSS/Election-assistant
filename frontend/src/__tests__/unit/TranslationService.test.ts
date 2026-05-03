/**
 * Unit tests for TranslationService
 *
 * Tests cover:
 * - Successful translation via API
 * - Language auto-detection
 * - RTL language detection
 * - In-memory cache hit on repeated request
 * - Batch translation with mixed cache/uncached entries
 * - Graceful degradation: API error returns original text
 * - Language allowlist rejects invalid codes via Zod
 */

import { TranslationService } from '@/shared/services/TranslationService';

// Mock the Google Cloud Translation client
jest.mock('@google-cloud/translate', () => ({
  TranslationServiceClient: jest.fn().mockImplementation(() => ({
    translateText: jest.fn(),
    detectLanguage: jest.fn(),
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TranslationServiceClient } = require('@google-cloud/translate');

describe('TranslationService', () => {
  let service: TranslationService;
  let mockTranslateText: jest.Mock;
  let mockDetectLanguage: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTranslateText = jest.fn();
    mockDetectLanguage = jest.fn();

    TranslationServiceClient.mockImplementation(() => ({
      translateText: mockTranslateText,
      detectLanguage: mockDetectLanguage,
    }));

    service = new TranslationService();
  });

  describe('translate()', () => {
    it('returns translated text from API', async () => {
      mockTranslateText.mockResolvedValue([
        {
          translations: [
            {
              translatedText: 'Cómo registrarse para votar',
              detectedLanguageCode: 'en',
            },
          ],
        },
      ]);

      const result = await service.translate({
        text: 'How to register to vote',
        targetLanguage: 'es',
      });

      expect(result.translatedText).toBe('Cómo registrarse para votar');
      expect(result.detectedSourceLanguage).toBe('en');
      expect(result.cached).toBe(false);
    });

    it('marks repeated requests as cached (memory cache hit)', async () => {
      mockTranslateText.mockResolvedValue([
        {
          translations: [{ translatedText: 'Voter', detectedLanguageCode: 'en' }],
        },
      ]);

      // First call
      await service.translate({ text: 'Vote', targetLanguage: 'fr' });
      // Second call (same text+language)
      const result = await service.translate({
        text: 'Vote',
        targetLanguage: 'fr',
      });

      // API should only be called once
      expect(mockTranslateText).toHaveBeenCalledTimes(1);
      expect(result.cached).toBe(true);
    });

    it('returns original text when API fails (graceful degradation)', async () => {
      mockTranslateText.mockRejectedValue(new Error('API error'));

      const result = await service.translate({
        text: 'Register to vote',
        targetLanguage: 'de',
      });

      expect(result.translatedText).toBe('Register to vote');
      expect(result.cached).toBe(false);
    });

    it('rejects invalid language codes via Zod', async () => {
      await expect(
        service.translate({
          text: 'Test',
          targetLanguage: 'xx' as 'en', // Invalid language code
        })
      ).rejects.toThrow();
    });

    it('rejects text exceeding 30,000 characters', async () => {
      await expect(
        service.translate({
          text: 'x'.repeat(30_001),
          targetLanguage: 'es',
        })
      ).rejects.toThrow();
    });
  });

  describe('isRTL()', () => {
    it.each([['ar'], ['he'], ['fa'], ['ur']] as const)(
      'returns true for RTL language %s',
      language => {
        expect(service.isRTL(language)).toBe(true);
      }
    );

    it.each([['en'], ['es'], ['fr'], ['de'], ['zh']] as const)(
      'returns false for LTR language %s',
      language => {
        expect(service.isRTL(language)).toBe(false);
      }
    );
  });

  describe('isSupportedLanguage()', () => {
    it('returns true for supported language codes', () => {
      expect(service.isSupportedLanguage('en')).toBe(true);
      expect(service.isSupportedLanguage('ar')).toBe(true);
      expect(service.isSupportedLanguage('hi')).toBe(true);
    });

    it('returns false for unsupported or unknown codes', () => {
      expect(service.isSupportedLanguage('xx')).toBe(false);
      expect(service.isSupportedLanguage('')).toBe(false);
      expect(service.isSupportedLanguage('ENGLISH')).toBe(false);
    });
  });

  describe('detectLanguage()', () => {
    it('returns detected language code', async () => {
      mockDetectLanguage.mockResolvedValue([
        {
          languages: [{ languageCode: 'es', confidence: 0.99 }],
        },
      ]);

      const lang = await service.detectLanguage('Cómo registrarse');
      expect(lang).toBe('es');
    });

    it('defaults to "en" when detection fails', async () => {
      mockDetectLanguage.mockResolvedValue([{ languages: [] }]);
      const lang = await service.detectLanguage('???');
      expect(lang).toBe('en');
    });
  });

  describe('batchTranslate()', () => {
    it('translates multiple texts and returns matching array', async () => {
      mockTranslateText.mockResolvedValue([
        {
          translations: [
            { translatedText: 'Votar' },
            { translatedText: 'Registrarse' },
          ],
        },
      ]);

      const results = await service.batchTranslate(
        ['Vote', 'Register'],
        'es'
      );

      expect(results).toHaveLength(2);
      expect(results[0]?.translatedText).toBe('Votar');
      expect(results[1]?.translatedText).toBe('Registrarse');
    });

    it('skips API for texts already in cache', async () => {
      // Prime the cache for 'Vote' → Spanish
      mockTranslateText.mockResolvedValueOnce([
        { translations: [{ translatedText: 'Votar', detectedLanguageCode: 'en' }] },
      ]);
      await service.translate({ text: 'Vote', targetLanguage: 'es' });

      // Batch includes one cached item + one new item
      mockTranslateText.mockResolvedValueOnce([
        { translations: [{ translatedText: 'Registrarse' }] },
      ]);

      const results = await service.batchTranslate(['Vote', 'Register'], 'es');

      // Only one API call for the uncached item
      expect(mockTranslateText).toHaveBeenCalledTimes(2); // 1 prime + 1 batch
      expect(results[0]?.translatedText).toBe('Votar');
      expect(results[1]?.translatedText).toBe('Registrarse');
    });
  });
});
