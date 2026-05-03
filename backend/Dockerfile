# ── Stage 1: Builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --only=production=false

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Production (distroless) ──────────────────────────────────────
FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app

# Copy only production build artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Cloud Run expects port 8080
EXPOSE 8080

# Run as non-root
USER nonroot:nonroot

CMD ["dist/index.js"]
