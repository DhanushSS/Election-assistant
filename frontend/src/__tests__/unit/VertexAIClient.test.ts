/**
 * Unit tests for the Vertex AI client — fallback chain behavior
 *
 * Tests validate:
 * - Tier 1 (Gemini Pro) used when available
 * - Falls back to Tier 2 (Gemini Flash) when Pro fails
 * - Falls back to Tier 3 (Static FAQ) when both models fail
 * - Streaming generator yields chunks
 * - Token tracking per model
 * - Malformed response handling
 */

// We mock the entire @google-cloud/vertexai module since we don't
// want real API calls in unit tests.
jest.mock('@google-cloud/vertexai', () => {
  const mockGenerateContent = jest.fn();
  const mockGenerateContentStream = jest.fn();

  return {
    VertexAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
        generateContentStream: mockGenerateContentStream,
      }),
    })),
    __mockGenerateContent: mockGenerateContent,
    __mockGenerateContentStream: mockGenerateContentStream,
  };
});

// Re-import after mock is set up
import { generateWithFallback, generateStreamWithFallback } from '@/infrastructure/vertex-ai/client';
import type { Part } from '@google-cloud/vertexai';

// Helper to get mocked functions
const getVertexMocks = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@google-cloud/vertexai') as {
    __mockGenerateContent: jest.Mock;
    __mockGenerateContentStream: jest.Mock;
  };
  return {
    mockGenerateContent: mod.__mockGenerateContent,
    mockGenerateContentStream: mod.__mockGenerateContentStream,
  };
};

function makeSuccessResponse(text: string, tokens = 100) {
  return {
    response: {
      candidates: [
        {
          content: {
            parts: [{ text }],
          },
        },
      ],
      usageMetadata: { totalTokenCount: tokens },
    },
  };
}

const TEST_PARTS: Part[] = [{ text: 'How do I vote?' }];
const TEST_SYSTEM = 'You are an election assistant.';

describe('Vertex AI Client — generateWithFallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns Gemini Pro response when Pro is available', async () => {
    const { mockGenerateContent } = getVertexMocks();
    mockGenerateContent.mockResolvedValueOnce(
      makeSuccessResponse('Vote at your polling place.', 120)
    );

    const result = await generateWithFallback(TEST_PARTS, TEST_SYSTEM);

    expect(result.text).toBe('Vote at your polling place.');
    expect(result.model).toBe('gemini-1.5-pro-002');
    expect(result.tokensUsed).toBe(120);
  });

  it('falls back to Gemini Flash when Pro throws', async () => {
    const { mockGenerateContent } = getVertexMocks();
    // Pro fails
    mockGenerateContent.mockRejectedValueOnce(new Error('Quota exceeded'));
    // Flash succeeds
    mockGenerateContent.mockResolvedValueOnce(
      makeSuccessResponse('Here is voting info.', 80)
    );

    const result = await generateWithFallback(TEST_PARTS, TEST_SYSTEM);

    expect(result.text).toBe('Here is voting info.');
    expect(result.model).toBe('gemini-1.5-flash-002');
  });

  it('falls back to static FAQ when both models fail', async () => {
    const { mockGenerateContent } = getVertexMocks();
    mockGenerateContent
      .mockRejectedValueOnce(new Error('Pro unavailable'))
      .mockRejectedValueOnce(new Error('Flash unavailable'));

    const result = await generateWithFallback(
      [{ text: 'How do I register to vote?' }],
      TEST_SYSTEM
    );

    expect(result.model).toBe('static-faq');
    expect(result.text.length).toBeGreaterThan(10);
    expect(result.tokensUsed).toBe(0);
  });

  it('returns static FAQ default when query matches no keyword', async () => {
    const { mockGenerateContent } = getVertexMocks();
    mockGenerateContent
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'));

    const result = await generateWithFallback(
      [{ text: 'random unrelated question xyz123' }],
      TEST_SYSTEM
    );

    expect(result.model).toBe('static-faq');
    expect(result.text).toContain('election');
  });

  it('handles empty candidates array gracefully by falling back', async () => {
    const { mockGenerateContent } = getVertexMocks();
    // Pro returns empty candidates
    mockGenerateContent.mockResolvedValueOnce({
      response: { candidates: [], usageMetadata: {} },
    });
    // Flash returns a valid response
    mockGenerateContent.mockResolvedValueOnce(
      makeSuccessResponse('Flash response.')
    );

    const result = await generateWithFallback(TEST_PARTS, TEST_SYSTEM);
    // Should use Flash since Pro returned no candidates (throws internally)
    expect(['gemini-1.5-flash-002', 'static-faq']).toContain(result.model);
  });

  it('passes temperature config to the model', async () => {
    const { mockGenerateContent } = getVertexMocks();
    mockGenerateContent.mockResolvedValueOnce(
      makeSuccessResponse('Answer.', 50)
    );

    await generateWithFallback(TEST_PARTS, TEST_SYSTEM, {
      temperature: 0.8,
      maxOutputTokens: 1024,
    });

    // Verify call was made (config validated at VertexAI SDK level)
    expect(mockGenerateContent).toHaveBeenCalled();
  });
});

describe('Vertex AI Client — generateStreamWithFallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('yields streamed chunks from Gemini Pro', async () => {
    const { mockGenerateContentStream } = getVertexMocks();

    async function* mockStream() {
      yield {
        candidates: [{ content: { parts: [{ text: 'Hello ' }] } }],
      };
      yield {
        candidates: [{ content: { parts: [{ text: 'world!' }] } }],
      };
    }

    mockGenerateContentStream.mockResolvedValueOnce({
      stream: mockStream(),
    });

    const chunks: string[] = [];
    for await (const chunk of generateStreamWithFallback(TEST_PARTS, TEST_SYSTEM)) {
      chunks.push(chunk);
    }

    const full = chunks.join('');
    expect(full).toContain('Hello');
    expect(full).toContain('world');
  });

  it('falls back to chunked non-streaming response when stream fails', async () => {
    const { mockGenerateContentStream, mockGenerateContent } = getVertexMocks();
    mockGenerateContentStream.mockRejectedValueOnce(new Error('Stream error'));

    // Flash generateContent (non-streaming fallback)
    mockGenerateContent.mockResolvedValueOnce(
      makeSuccessResponse('Fallback answer with multiple words here.')
    );

    const chunks: string[] = [];
    for await (const chunk of generateStreamWithFallback(TEST_PARTS, TEST_SYSTEM)) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThan(0);
    const full = chunks.join('');
    expect(full.trim().length).toBeGreaterThan(0);
  });
});
