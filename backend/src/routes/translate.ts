/**
 * Translate route — POST /api/translate
 */

import { Router, type Request, type Response } from 'express';
import { TranslationService } from '../services/TranslationService';
import { validateBody, TranslateSchema } from '../middleware/inputValidator';

const router = Router();
const translationService = new TranslationService();

router.post('/', validateBody(TranslateSchema), async (req: Request, res: Response): Promise<void> => {
  const { text, targetLanguage } = req.body as { text: string; targetLanguage: 'en' | 'hi' };

  try {
    const translated = await translationService.translate(text, targetLanguage);
    res.json({ translated, targetLanguage });
  } catch (err) {
    console.error('[translate] Error:', err);
    res.status(500).json({ error: 'Translation failed', original: text });
  }
});

export default router;
