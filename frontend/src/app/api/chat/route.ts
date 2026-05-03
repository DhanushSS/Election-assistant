import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';

/**
 * POST /api/chat — SSE proxy to Cloud Run backend
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;

    const backendResponse = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok || !backendResponse.body) {
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
    }

    // Passthrough SSE stream
    return new NextResponse(backendResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

  try {
    const res = await fetch(`${BACKEND_URL}/api/chat/history/${sessionId}`);
    const data = await res.json() as unknown;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 });
  }
}
