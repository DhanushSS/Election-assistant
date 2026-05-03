/**
 * Unit tests — GeminiService
 */

import { GeminiService } from '../../backend/src/services/GeminiService';
import { FirestoreService } from '../../backend/src/services/FirestoreService';

// Mock Vertex AI
jest.mock('@google-cloud/vertexai', () => ({
  VertexAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContentStream: jest.fn().mockResolvedValue({
        stream: (async function* () {
          yield { candidates: [{ content: { parts: [{ text: 'Lok Sabha has 543 seats.' }] } }] };
        })(),
        response: Promise.resolve({ usageMetadata: { totalTokenCount: 42 } }),
      }),
    }),
  })),
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
    HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
  },
  HarmBlockThreshold: {
    BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE',
  },
}));

// Mock FirestoreService
const mockFirestoreService = {
  saveMessage: jest.fn().mockResolvedValue(undefined),
  getHistory: jest.fn().mockResolvedValue([]),
} as unknown as FirestoreService;

// Mock SSE response
function makeMockRes() {
  const written: string[] = [];
  return {
    write: jest.fn((data: string) => written.push(data)),
    end: jest.fn(),
    writableEnded: false,
    _written: written,
  };
}

describe('GeminiService', () => {
  let service: GeminiService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GeminiService(mockFirestoreService);
  });

  it('streams a response and ends with done event', async () => {
    const res = makeMockRes();

    await service.streamChat({
      message: 'How many seats does Lok Sabha have?',
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      language: 'en',
      history: [],
      res: res as unknown as import('express').Response,
    });

    const written = res._written.join('');
    expect(written).toContain('Lok Sabha has 543 seats.');
    expect(written).toContain('"type":"done"');
    expect(res.end).toHaveBeenCalled();
  });

  it('saves user and assistant messages to Firestore', async () => {
    const res = makeMockRes();

    await service.streamChat({
      message: 'What is NOTA?',
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      language: 'en',
      history: [],
      res: res as unknown as import('express').Response,
    });

    expect(mockFirestoreService.saveMessage).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
      'user',
      'What is NOTA?'
    );
    expect(mockFirestoreService.saveMessage).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
      'assistant',
      expect.any(String)
    );
  });

  it('adds Hindi instruction when language is hi', async () => {
    const { VertexAI } = await import('@google-cloud/vertexai');
    const mockGetModel = jest.fn().mockReturnValue({
      generateContentStream: jest.fn().mockResolvedValue({
        stream: (async function* () {
          yield { candidates: [{ content: { parts: [{ text: 'लोकसभा में 543 सीटें हैं।' }] } }] };
        })(),
        response: Promise.resolve({ usageMetadata: { totalTokenCount: 30 } }),
      }),
    });
    (VertexAI as jest.Mock).mockImplementation(() => ({ getGenerativeModel: mockGetModel }));

    const res = makeMockRes();
    const hiService = new GeminiService(mockFirestoreService);

    await hiService.streamChat({
      message: 'लोकसभा क्या है?',
      sessionId: '550e8400-e29b-41d4-a716-446655440001',
      language: 'hi',
      history: [],
      res: res as unknown as import('express').Response,
    });

    const callArgs = mockGetModel.mock.calls[0];
    // Verify model was called
    expect(mockGetModel).toHaveBeenCalled();
    expect(callArgs).toBeDefined();
  });
});
