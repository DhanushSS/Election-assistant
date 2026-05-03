import { NextRequest } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

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
- If asked about non-Indian elections: "I'm VoteAI India and specialize only in Indian elections. For other countries, please consult their respective election authority."
- Always be politically neutral and non-partisan
- Cite ECI guidelines, constitutional articles, or legal provisions where relevant
- Use simple language for first-time voters
- Format multi-step answers with bullet points
- Always mention Voter Helpline 1950 for registration or booth queries`;

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Static fallback — used when API key missing or Gemini unavailable
const STATIC_RESPONSES: Record<string, string> = {
  default: `Welcome to VoteAI India! I can help you with:\n\n• **Voter Registration** — Form 6 on voters.eci.gov.in\n• **Lok Sabha & Rajya Sabha** elections\n• **Model Code of Conduct** (MCC)\n• **EVM and VVPAT** — how India's voting machines work\n• **NOTA** — None of the Above\n• **Booth location** and polling procedures\n\n📞 **Voter Helpline: 1950**\n🌐 **Portal: voters.eci.gov.in**\n\nPlease ask me any question about Indian elections!`,
  register: `To register as a voter in India:\n\n1. Visit **voters.eci.gov.in** or download the **Voter Helpline App**\n2. Fill **Form 6** (for new voter registration)\n3. Submit: proof of age (birth certificate/marksheet), proof of address, and passport photo\n4. Your **Booth Level Officer (BLO)** will verify your details\n5. You'll receive your **EPIC card** (Voter ID card)\n\n⏰ Register before the cutoff date (January 1st of election year)\n📞 Helpline: **1950**`,
  'lok sabha': `**Lok Sabha** (House of the People):\n\n• **543 elected seats** from single-member constituencies\n• Voting system: **First-Past-The-Post (FPTP)**\n• Term: **5 years** (can be dissolved earlier)\n• **Majority needed: 272+ seats** to form government\n• President invites majority leader to form government\n• Voting age: **18 years** minimum\n\nThe Lok Sabha is India's lower house — the primary legislative body under Article 81 of the Constitution.`,
  nota: `**NOTA (None of the Above)**:\n\n• Available on all EVMs since **Supreme Court judgment in 2013** (PUCL vs Union of India)\n• Located at the **bottom of the candidate list** on the EVM ballot unit\n• Symbol: **Cross (✗) mark**\n• NOTA votes are **counted and recorded** but the candidate with most votes wins regardless\n• If NOTA gets majority, the **second-highest candidate still wins** (no re-election)\n\nNOTA expresses voter dissatisfaction with all available candidates.`,
  evm: `**Electronic Voting Machine (EVM)**:\n\n• Manufactured by **BEL and ECIL** (Government of India PSUs)\n• **Standalone, not networked** — cannot be hacked remotely\n• **Two units**: Ballot Unit (voter presses) + Control Unit (Presiding Officer)\n• Powered by **alkaline battery** (works without electricity)\n• **VVPAT** attached: Voter sees a paper slip for 5 seconds confirming vote\n• After polling: EVMs stored in **strong rooms** under security\n• **VVPAT verification**: 5 random EVMs per constituency verified during counting\n\nECIs Article 324 authority ensures free and fair elections using EVMs.`,
  mcc: `**Model Code of Conduct (MCC)**:\n\n• Comes into **immediate effect** when Election Commission announces election schedule\n• Ends when **results are declared**\n• Key provisions:\n  - No new government schemes/announcements (can misuse govt resources)\n  - No use of government vehicles/staff for campaigns\n  - No hate speech or communal appeals\n  - No voter bribery (Section 171B IPC — criminal offense)\n  - No elections ads on Govt media\n• Violations? Report via **cVIGIL App** or call **1950**\n• ECI's Flying Squads and Static Surveillance Teams monitor compliance`,
};

function getStaticResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('register') || lower.includes('form 6') || lower.includes('epic')) return STATIC_RESPONSES['register']!;
  if (lower.includes('lok sabha') || lower.includes('loksabha')) return STATIC_RESPONSES['lok sabha']!;
  if (lower.includes('nota')) return STATIC_RESPONSES['nota']!;
  if (lower.includes('evm') || lower.includes('vvpat') || lower.includes('voting machine')) return STATIC_RESPONSES['evm']!;
  if (lower.includes('mcc') || lower.includes('model code') || lower.includes('conduct')) return STATIC_RESPONSES['mcc']!;
  return STATIC_RESPONSES['default']!;
}

// SSE encoder
function encode(data: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
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

    // ── ReadableStream for SSE ────────────────────────────────────────────
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // No API key → stream static response
          if (!apiKey) {
            const staticResponse = getStaticResponse(cleanMessage);
            const words = staticResponse.split(' ');
            for (const word of words) {
              controller.enqueue(encode({ type: 'token', text: word + ' ' }));
              await new Promise(r => setTimeout(r, 15));
            }
            controller.enqueue(encode({ type: 'done' }));
            controller.close();
            return;
          }

          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: SYSTEM_PROMPT,
            safetySettings: SAFETY_SETTINGS,
            generationConfig: {
              maxOutputTokens: 1024,
              temperature: 0.3,
              topP: 0.8,
            },
          });

          // Build conversation history for multi-turn chat
          const chatHistory = history.slice(-8).map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          }));

          const chat = model.startChat({ history: chatHistory });
          const langInstruction = language === 'hi' ? 'Please respond in Hindi (Devanagari script). ' : '';
          const result = await chat.sendMessageStream(langInstruction + cleanMessage);

          let hasContent = false;
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              hasContent = true;
              controller.enqueue(encode({ type: 'token', text }));
            }
          }

          if (!hasContent) {
            // Gemini returned empty — use static fallback
            const fallback = getStaticResponse(cleanMessage);
            controller.enqueue(encode({ type: 'token', text: fallback }));
          }

          controller.enqueue(encode({ type: 'done' }));
          controller.close();
        } catch (err) {
          console.error('[/api/chat] Gemini error:', err);
          // Stream error as a message rather than crashing
          const errMsg = err instanceof Error && err.message.includes('API_KEY')
            ? 'Configuration error: API key not set. Please add GEMINI_API_KEY to .env.local'
            : 'I\'m having trouble connecting to the AI. Here\'s what I know:\n\n' + getStaticResponse(cleanMessage);
          controller.enqueue(encode({ type: 'token', text: errMsg }));
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
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[/api/chat] Parse error:', err);
    return new Response(JSON.stringify({ error: 'Bad request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET() {
  return Response.json({ history: [] });
}
