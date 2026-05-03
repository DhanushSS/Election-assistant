# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci --only=production && \
    npm ci --only=development

# ─── Stage 2: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ .

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ─── Stage 3: Production (distroless) ─────────────────────────────────────────
# WHY distroless: Smallest attack surface, no shell, no package manager.
# Addresses OWASP A06 (Vulnerable and Outdated Components).
FROM gcr.io/distroless/nodejs20-debian12 AS production

WORKDIR /app

# Only copy the Next.js standalone output (includes minimal node_modules)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Non-root user (UID 65532 = nonroot in distroless)
USER 65532:65532

# Cloud Run expects PORT env variable
ENV PORT=8080
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 8080

# Health check (Cloud Run uses HTTP health checks via the /api/health route)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["/nodejs/bin/node", "-e", "require('http').get('http://localhost:8080/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"]

CMD ["server.js"]
