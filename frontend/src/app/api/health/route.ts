export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'VoteAI India',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
}
