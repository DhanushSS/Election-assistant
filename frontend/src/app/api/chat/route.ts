import { NextRequest } from 'next/server';

// ── India-only system prompt ──────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are VoteAI India, an expert AI assistant specializing exclusively in Indian elections and democracy.

You ONLY answer questions about:
- Indian elections: Lok Sabha (543 seats), Rajya Sabha (245 seats), State Legislative Assembly, by-elections
- Election Commission of India (ECI) — established 25 January 1950 under Article 324
- Voter registration: Form 6 (new), Form 7 (deletion), Form 8 (correction), EPIC card (Voter ID)
- Electronic Voting Machines (EVM) — standalone, tamper-proof, BEL/ECIL manufactured
- VVPAT — Voter Verifiable Paper Audit Trail (5-second paper slip)
- Model Code of Conduct (MCC) — kicks in at election announcement, ends at result declaration
- Polling procedures, counting, certification and results declaration
- Constitutional provisions: Articles 324-329
- Political parties, candidate eligibility, campaign rules, expenditure limits
- NOTA (None of the Above) — available on all EVMs since 2013
- Booth Level Officers (BLO), Returning Officers, cVIGIL app for MCC complaints
- Voter Helpline: 1950 | Portal: voters.eci.gov.in | Results: results.eci.gov.in

STRICT RULES:
- If asked about non-Indian elections: "I'm VoteAI India and specialize only in Indian elections."
- Always be politically neutral and non-partisan
- Cite ECI guidelines, constitutional articles, or legal provisions where relevant
- Use simple language for first-time voters
- Format multi-step answers with bullet points
- Always mention Voter Helpline 1950 for registration or booth queries`;

// Static FAQ fallback when API key is missing
const STATIC_RESPONSES: Record<string, string> = {
  default: `Welcome to VoteAI India! I can help you with:\n\n• **Voter Registration** — Form 6 on voters.eci.gov.in\n• **Lok Sabha & Rajya Sabha** elections\n• **Model Code of Conduct** (MCC)\n• **EVM and VVPAT** — how India's voting machines work\n• **NOTA** — None of the Above\n\n📞 **Voter Helpline: 1950**`,
  register: `To register as a voter in India:\n\n1. Visit **voters.eci.gov.in** or download the **Voter Helpline App**\n2. Fill **Form 6** (for new voter registration)\n3. Submit proof of age, proof of address, and passport photo\n4. Your **Booth Level Officer (BLO)** verifies your details\n5. Receive your **EPIC card** (Voter ID card)\n\n📞 Helpline: **1950**`,
  'lok sabha': `**Lok Sabha** (House of the People):\n\n• **543 elected seats** — single-member constituencies\n• Voting: **First-Past-The-Post (FPTP)**\n• Term: **5 years**\n• **Majority: 272+ seats** to form government\n• Voting age: **18 years** minimum\n\nGoverned by Article 81 of the Constitution.`,
  nota: `**NOTA (None of the Above)**:\n\n• Available since **Supreme Court order in 2013** (PUCL vs Union of India)\n• Bottom of the **EVM ballot unit**\n• Symbol: **Cross (✗) mark**\n• NOTA votes are **counted and published** but don't affect who wins\n• Even if NOTA gets the most votes, the **highest-polling candidate wins**`,
  evm: `**EVM (Electronic Voting Machine)**:\n\n• Made by **BEL and ECIL** (Indian PSUs)\n• **Standalone** — not networked, cannot be hacked remotely\n• Two units: **Ballot Unit** (voter) + **Control Unit** (officer)\n• Runs on **alkaline battery** — no electricity needed\n• **VVPAT**: paper slip visible for 5 seconds confirming vote`,
  mcc: `**Model Code of Conduct (MCC)**:\n\n• Kicks in **immediately** when ECI announces election schedule\n• Ends when **results declared**\n• Bans new govt schemes, use of govt vehicles for campaigning\n• Prohibits voter bribing (Section 171B IPC)\n• Report violations via **cVIGIL App** or **1950**`,
};

function getStaticResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('register') || lower.includes('form 6') || lower.includes('epic')) return STATIC_RESPONSES['register']!;
  if (lower.includes('lok sabha') || lower.includes('loksabha')) return STATIC_RESPONSES['lok sabha']!;
  if (lower.includes('nota')) return STATIC_RESPONSES['nota']!;
  if (lower.includes('evm') || lower.includes('vvpat') || lower.includes('voting machine')) return STATIC_RESPONSES['evm']!;
  if (lower.includes('mcc') || lower.includes('model code')) return STATIC_RESPONSES['mcc']!;
  return STATIC_RESPONSES['default']!;
}

function encode(data: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

// ── Gemini REST streaming via fetch (API key auth) ────────────────────────────
async function* streamGemini(
  apiKey: string,
  message: string,
  history: Array<{ role: string; content: string }>,
  language: string,
): AsyncGenerator<string> {
  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

  const langPrefix = language === 'hi' ? 'Please respond in Hindi (Devanagari script). ' : '';

  // Build conversation contents
  const contents = [
    ...history.slice(-8).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: langPrefix + message }] },
  ];

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.3,
      topP: 0.8,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) {
    const errText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Gemini API ${response.status}: ${errText.slice(0, 200)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === '[DONE]') continue;

      try {
        const chunk = JSON.parse(raw) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
            finishReason?: string;
          }>;
        };
        const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) yield text;
      } catch {
        // Ignore parse errors on individual SSE chunks
      }
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      message?: string;
      sessionId?: string;
      language?: string;
      history?: Array<{ role: string; content: string }>;
    };

    const { message, language = 'en', history = [] } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanMessage = message.trim().slice(0, 1000);
    const apiKey = process.env.GEMINI_API_KEY;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (!apiKey) {
            // Stream static fallback
            const text = getStaticResponse(cleanMessage);
            controller.enqueue(encode({ type: 'token', text }));
            controller.enqueue(encode({ type: 'done' }));
            controller.close();
            return;
          }

          let hasContent = false;
          for await (const chunk of streamGemini(apiKey, cleanMessage, history, language)) {
            hasContent = true;
            controller.enqueue(encode({ type: 'token', text: chunk }));
          }

          if (!hasContent) {
            controller.enqueue(encode({ type: 'token', text: getStaticResponse(cleanMessage) }));
          }

          controller.enqueue(encode({ type: 'done' }));
          controller.close();
        } catch (err) {
          console.error('[/api/chat] Gemini error:', err);
          // Graceful fallback — show static answer with error note
          const fallback = getStaticResponse(cleanMessage);
          controller.enqueue(encode({ type: 'token', text: fallback }));
          controller.enqueue(encode({ type: 'done' }));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Bad request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET() {
  return Response.json({ history: [] });
}
