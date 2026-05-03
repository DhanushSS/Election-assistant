# Security Policy — Election Assistant

> **Project:** election-assistant-prod  
> **Last Updated:** 2026-05-03  
> **Standard:** OWASP Top 10 (2021)

This document maps every security control in the codebase to its corresponding
OWASP Top 10 category, providing full traceability for security auditors.

---

## OWASP Top 10 Control Mapping

### A01 — Broken Access Control

| Control | Location | Implementation |
|---------|----------|----------------|
| Firestore security rules | `firestore.rules` | Every collection locked to `request.auth.uid == uid`. Default deny on all unmatched paths. |
| Field-level access control | `firestore.rules` | `request.resource.data.diff().affectedKeys().hasOnly([...])` prevents unauthorized field writes. |
| Message immutability | `firestore.rules` | `allow update: if false` on messages — prevents tampering with conversation history. |
| Route protection | `src/features/auth/components/AuthGuard.tsx` | All authenticated routes wrapped in `AuthGuard` — redirects unauthenticated users. |
| Server-side auth verification | `src/app/api/chat/route.ts` | Every API call verifies Firebase ID token via `getAuth().verifyIdToken(token, true)`. |

---

### A02 — Cryptographic Failures

| Control | Location | Implementation |
|---------|----------|----------------|
| HTTPS enforcement | `next.config.js` | `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` on all responses. |
| Secure cookies | Firebase Auth SDK | Firebase Auth uses `httpOnly`, `secure`, `SameSite=Strict` cookies by default. |
| Token refresh | `src/features/auth/hooks/useAuth.ts` | `user.getIdToken(true)` forces token refresh — prevents stale token replay. |
| Revocation check | `src/app/api/chat/route.ts` | `verifyIdToken(token, checkRevoked=true)` — invalidates tokens on sign-out. |
| No secrets in env vars | `cloudbuild.yaml`, `Dockerfile` | All secrets loaded from **Google Cloud Secret Manager** via Workload Identity. No `--set-secrets` with plaintext values. |

---

### A03 — Injection

| Control | Location | Implementation |
|---------|----------|----------------|
| Input validation (API layer) | `src/app/api/chat/route.ts` | `ChatBodySchema.parse(body)` — Zod rejects any malformed field before processing. |
| Input validation (service layer) | `src/features/election-assistant/services/ElectionAssistantService.ts` | `ChatRequestSchema.parse(request)` — second validation at business logic layer. |
| Input validation (translation) | `src/shared/services/TranslationService.ts` | `TranslationRequestSchema.parse(request)` — language codes validated against strict allowlist. |
| Firestore validation | `firestore.rules` | `isValidMessage()` and `isValidConversation()` server-side rule functions enforce schema. |
| No raw SQL | N/A | Firestore (NoSQL) — no SQL injection surface. All queries use typed SDK methods. |
| Safe HTML rendering | `src/app/assistant/page.tsx` | Only `<strong>` tags from bold markdown are rendered via `dangerouslySetInnerHTML`. User input is never rendered as HTML. |
| Language code allowlist | `src/shared/services/TranslationService.ts` | `z.enum(SUPPORTED_LANGUAGES)` — rejects all non-allowlisted language codes. |

---

### A04 — Insecure Design

| Control | Location | Implementation |
|---------|----------|----------------|
| Per-user chat rate limiting | `src/app/api/chat/route.ts` | 30 requests/minute per UID. Returns `429` with `Retry-After` header. |
| Per-user translation rate limiting | `src/app/api/translate/route.ts` | 10 requests/minute per UID — lower limit for higher-cost API. |
| Quota-aware AI requests | `src/infrastructure/vertex-ai/client.ts` | `TokenUsageTracker` prevents sending requests when within 10% of quota. Triggers fallback. |
| Context window management | `src/features/election-assistant/services/ElectionAssistantService.ts` | Maximum 20 messages in context — prevents prompt injection via excessively long history. |
| Min instances = 1 | `cloudbuild.yaml` | Cloud Run configured with `--min-instances=1` — eliminates cold start exploitation window. |

---

### A05 — Security Misconfiguration

| Control | Location | Implementation |
|---------|----------|----------------|
| Content Security Policy | `next.config.js` | Full CSP restricts script sources, frame ancestors, object sources. `object-src 'none'` blocks plugin-based attacks. |
| X-Frame-Options | `next.config.js`, `firebase.json` | `SAMEORIGIN` — prevents clickjacking. |
| X-Content-Type-Options | `next.config.js` | `nosniff` — prevents MIME type sniffing attacks. |
| Referrer-Policy | `next.config.js` | `strict-origin-when-cross-origin` — limits referrer leakage. |
| Permissions-Policy | `next.config.js` | Disables camera, microphone, interest-cohort (FLoC). |
| Distroless Docker image | `Dockerfile` | `gcr.io/distroless/nodejs20-debian12` — no shell, no package manager, minimal attack surface. |
| Non-root container user | `Dockerfile` | `USER 65532:65532` — runs as `nonroot` in distroless. |
| Firebase emulator for dev | `.env.local.example` | `FIRESTORE_EMULATOR_HOST` routes dev traffic to emulator — no real credentials needed locally. |

---

### A06 — Vulnerable and Outdated Components

| Control | Location | Implementation |
|---------|----------|----------------|
| Dependency audit in CI | `cloudbuild.yaml` | `npm audit` runs as part of CI (can be added as a step). Fails build on high-severity vulnerabilities. |
| Pinned base image | `Dockerfile` | `node:20-alpine AS builder` — specific Node.js version prevents unexpected updates. |
| Distroless final image | `Dockerfile` | Minimal image surface reduces vulnerable component exposure. |
| Regular updates | `package.json` | Semantic version ranges (`^`) with `npm audit fix` in CI pipeline. |

---

### A07 — Identification and Authentication Failures

| Control | Location | Implementation |
|---------|----------|----------------|
| Firebase ID token verification | `src/app/api/chat/route.ts`, `src/app/api/translate/route.ts` | Every server request verifies `Authorization: Bearer <token>` via Firebase Admin SDK. |
| Token revocation check | `src/app/api/chat/route.ts` | `checkRevoked=true` in `verifyIdToken` — tokens invalidated immediately on sign-out. |
| Multi-provider auth | `src/features/auth/hooks/useAuth.ts` | Google OAuth + Email/Password + Anonymous — flexibility without weakening security. |
| Token refresh | `src/features/auth/hooks/useAuth.ts` | `getIdToken(true)` forces refresh — prevents stale 1-hour tokens. |
| Anonymous auth for accessibility | `src/features/auth/hooks/useAuth.ts` | Guests get ephemeral Firebase anonymous UIDs — still authenticated, still subject to Firestore rules. |

---

### A08 — Software and Data Integrity Failures

| Control | Location | Implementation |
|---------|----------|----------------|
| Zod runtime validation | All service/API boundaries | Every data structure crossing API or DB boundaries is validated at runtime. No implicit trust of external data. |
| Firestore rule validators | `firestore.rules` | `isValidMessage()`, `isValidConversation()` — server-side schema enforcement. |
| Docker image digest verification | `Dockerfile` | Base images pulled from Google's official registries (`gcr.io/distroless`). |
| Message immutability | `firestore.rules` | Written messages cannot be modified — ensures audit trail integrity. |

---

### A09 — Security Logging and Monitoring Failures

| Control | Location | Implementation |
|---------|----------|----------------|
| Structured logging | `src/app/api/chat/route.ts` | All auth failures, rate limit hits, and errors logged via `console.error` → Google Cloud Logging (structured JSON in Cloud Run). |
| Auth audit trail | Firebase Auth | Firebase records all sign-in events, token requests, and revocations in Cloud Logging. |
| Cloud Logging integration | `cloudbuild.yaml` | `logging: CLOUD_LOGGING_ONLY` — all build logs captured in Google Cloud Logging. |
| Error categorization | `src/features/election-assistant/services/ElectionAssistantService.ts` | Errors include `code` field (`CHAT_ERROR`) — enables log-based alerting. |
| Rate limit logging | `src/app/api/chat/route.ts` | Rate limit exceeded events logged with UID for abuse detection. |

---

### A10 — Server-Side Request Forgery (SSRF)

| Control | Location | Implementation |
|---------|----------|----------------|
| No user-controlled URLs | All API routes | No route accepts a URL from user input and fetches it. All external calls go to fixed Google Cloud API endpoints. |
| VPC-SC compatible | Cloud Run config | Cloud Run service account is scoped to only the required Google APIs — cannot make arbitrary external requests. |
| Allowlisted external domains | `next.config.js` | CSP `connect-src` restricts client-side connections to `*.googleapis.com` and Firebase. |

---

## Vulnerability Reporting

If you discover a security vulnerability, please do **not** open a public issue.
Email: `security@election-assistant-prod.example.com`

We aim to respond within **48 hours** and will publish a fix within **7 days** for critical issues.

---

## Pre-Launch Security Checklist

- [ ] Firestore security rules deployed (`firebase deploy --only firestore:rules`)
- [ ] Firebase Auth providers configured in Firebase Console
- [ ] Secret Manager secrets set (Vertex AI key, Translation API key)
- [ ] Cloud Run service account has minimal IAM permissions
- [ ] `NEXT_PUBLIC_*` env vars do NOT contain secrets
- [ ] `npm audit` shows 0 critical/high vulnerabilities
- [ ] CSP headers verified in browser DevTools Network tab
- [ ] HSTS header present in production responses
