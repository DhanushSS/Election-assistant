/**
 * Unit tests — TranslationService
 */

// Mock the Google Cloud Translation client
jest.mock('@google-cloud/translate', () => ({
  TranslationServiceClient: jest.fn().mockImplementation(() => ({
    translateText: jest.fn().mockResolvedValue([{
      translations: [{ translatedText: 'लोकसभा' }],
    }]),
    detectLanguage: jest.fn().mockResolvedValue([{
      languages: [{ languageCode: 'en' }],
    }]),
  })),
}));

import { TranslationService } from '../../backend/src/services/TranslationService';

describe('TranslationService', () => {
  let service: TranslationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TranslationService();
  });

  it('translates EN to HI', async () => {
    const result = await service.translate('Lok Sabha', 'hi');
    expect(result).toBe('लोकसभा');
  });

  it('returns original text for EN→EN (no API call)', async () => {
    const { TranslationServiceClient } = await import('@google-cloud/translate');
    const mockInstance = new (TranslationServiceClient as jest.Mock)();

    const result = await service.translate('Lok Sabha', 'en');
    expect(result).toBe('Lok Sabha');
    expect(mockInstance.translateText).not.toHaveBeenCalled();
  });

  it('returns empty string unchanged', async () => {
    const result = await service.translate('', 'hi');
    expect(result).toBe('');
  });

  it('caches repeated translations', async () => {
    const { TranslationServiceClient } = await import('@google-cloud/translate');
    const mockInstance = new (TranslationServiceClient as jest.Mock)();

    await service.translate('Election', 'hi');
    await service.translate('Election', 'hi');

    // Second call should hit cache, not API
    expect(mockInstance.translateText).toHaveBeenCalledTimes(1);
  });

  it('falls back to original text on API error', async () => {
    const { TranslationServiceClient } = await import('@google-cloud/translate');
    const mockInstance = new (TranslationServiceClient as jest.Mock)();
    mockInstance.translateText.mockRejectedValue(new Error('API quota exceeded'));

    // Re-create service to reset cache
    const freshService = new TranslationService();
    const result = await freshService.translate('Voter', 'hi');
    expect(result).toBe('Voter'); // Graceful fallback
  });
});
