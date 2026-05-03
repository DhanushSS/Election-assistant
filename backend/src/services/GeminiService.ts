/**
 * GeminiService — Vertex AI Gemini 1.5 Pro integration
 * Cloud Run backend service for VoteAI India
 */

import {
  VertexAI,
  HarmCategory,
  HarmBlockThreshold,
  type Content,
} from '@google-cloud/vertexai';
import { Response } from 'express';
import { FirestoreService } from './FirestoreService';
import { GEMINI_SYSTEM_PROMPT } from '../constants/india-elections';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT ?? 'election-assistant-prod';
const LOCATION = process.env.VERTEX_AI_LOCATION ?? 'us-central1';

const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Static FAQ fallback — India elections only
const STATIC_FAQ: Record<string, string> = {
  default: `I'm VoteAI India, your guide to Indian elections. I can help you with:
• Voter registration (Form 6, Form 7, Form 8)
• Lok Sabha & Rajya Sabha elections  
• Model Code of Conduct
• EVM and VVPAT information
• Polling booth procedures
• NOTA (None of the Above)

📞 Voter Helpline: 1950
🌐 Portal: voters.eci.gov.in

Please ask me any question about Indian elections!`,
  register: `To register as a voter in India:
1. Visit voters.eci.gov.in or the Voter Helpline App
2. Fill Form 6 (for new registration)
3. Submit proof of age, address, and a photo
4. Your BLO (Booth Level Officer) will verify
5. You'll receive your EPIC card (Voter ID)

Minimum age: 18 years. Helpline: 1950`,
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamChatOptions {
  message: string;
  sessionId: string;
  language: 'en' | 'hi';
  history: ChatMessage[];
  res: Response;
}

export class GeminiService {
  private firestoreService: FirestoreService;

  constructor(firestoreService: FirestoreService) {
    this.firestoreService = firestoreService;
  }

  /**
   * Stream a chat response via SSE.
   * Fallback chain: gemini-1.5-pro → gemini-1.5-flash → static FAQ
   */
  async streamChat({ message, sessionId, language, history, res }: StreamChatOptions): Promise<void> {
    // Build conversation history for Gemini
    const contents: Content[] = this.buildContents(history, message, language);

    try {
      await this.streamWithModel('gemini-1.5-pro', contents, sessionId, message, res);
    } catch (proErr) {
      console.warn('[GeminiService] Pro model failed, trying Flash:', proErr);
      try {
        await this.streamWithModel('gemini-1.5-flash', contents, sessionId, message, res);
      } catch (flashErr) {
        console.warn('[GeminiService] Flash model failed, using static FAQ:', flashErr);
        await this.streamStaticFallback(message, sessionId, res);
      }
    }
  }

  private async streamWithModel(
    modelName: string,
    contents: Content[],
    sessionId: string,
    userMessage: string,
    res: Response
  ): Promise<void> {
    const model = vertexAI.getGenerativeModel({
      model: modelName,
      systemInstruction: { role: 'system', parts: [{ text: GEMINI_SYSTEM_PROMPT }] },
      safetySettings: SAFETY_SETTINGS,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
      },
    });

    const streamResult = await model.generateContentStream({ contents });
    let fullResponse = '';

    for await (const chunk of streamResult.stream) {
      const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ type: 'token', text })}\n\n`);
      }
    }

    // Save to Firestore
    await this.firestoreService.saveMessage(sessionId, 'user', userMessage);
    await this.firestoreService.saveMessage(sessionId, 'assistant', fullResponse);

    // Token usage from final response
    const finalResponse = await streamResult.response;
    const usage = finalResponse.usageMetadata;
    res.write(`data: ${JSON.stringify({
      type: 'done',
      model: modelName,
      tokensUsed: usage?.totalTokenCount ?? 0,
    })}\n\n`);
    res.end();
  }

  private async streamStaticFallback(
    message: string,
    sessionId: string,
    res: Response
  ): Promise<void> {
    const lowerMsg = message.toLowerCase();
    const faqKey = Object.keys(STATIC_FAQ).find(
      key => key !== 'default' && lowerMsg.includes(key)
    );
    const response = STATIC_FAQ[faqKey ?? 'default'] ?? STATIC_FAQ['default']!;

    // Simulate streaming for consistency
    const words = response.split(' ');
    let fullText = '';
    for (const word of words) {
      const token = word + ' ';
      fullText += token;
      res.write(`data: ${JSON.stringify({ type: 'token', text: token })}\n\n`);
      await new Promise(r => setTimeout(r, 20));
    }

    await this.firestoreService.saveMessage(sessionId, 'user', message);
    await this.firestoreService.saveMessage(sessionId, 'assistant', fullText.trim());

    res.write(`data: ${JSON.stringify({ type: 'done', model: 'static-faq', tokensUsed: 0 })}\n\n`);
    res.end();
  }

  private buildContents(history: ChatMessage[], newMessage: string, language: 'en' | 'hi'): Content[] {
    const langInstruction = language === 'hi'
      ? 'Please respond in Hindi (Devanagari script). '
      : '';

    const contents: Content[] = history.slice(-10).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    contents.push({
      role: 'user',
      parts: [{ text: langInstruction + newMessage }],
    });

    return contents;
  }
}
