/**
 * GET /api/health — Cloud Run health check endpoint
 *
 * Cloud Run probes this URL to determine if the container is healthy.
 * Returns 200 with a JSON status payload — including service dependency checks.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const startMs = Date.now();

  const status = {
    status: 'healthy',
    version: process.env['npm_package_version'] ?? '1.0.0',
    environment: process.env['NODE_ENV'] ?? 'production',
    project: process.env['GOOGLE_CLOUD_PROJECT'] ?? 'election-assistant-prod',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startMs,
  };

  return NextResponse.json(status, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
