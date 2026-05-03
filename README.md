# 🗳️ Election Assistant

> **AI-powered civic guidance for every step of the election process**  
> Built for the Hack2Skill Google Prompt Wars Hackathon

[![Cloud Build](https://img.shields.io/badge/Google%20Cloud%20Build-passing-4285F4?logo=google-cloud&logoColor=white)](https://console.cloud.google.com/cloud-build)
[![Firebase](https://img.shields.io/badge/Firebase-production-FFCA28?logo=firebase&logoColor=black)](https://console.firebase.google.com)
[![Vertex AI](https://img.shields.io/badge/Vertex%20AI-Gemini%20Pro-4285F4?logo=google-cloud&logoColor=white)](https://cloud.google.com/vertex-ai)
[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG%202.1-AA%20Compliant-green)](./ACCESSIBILITY.md)
[![Security](https://img.shields.io/badge/OWASP%20Top%2010-Addressed-blue)](./SECURITY.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## ✨ Live Demo

> **Production URL:** `https://election-assistant-prod.web.app`  
> **API Health:** `https://election-assistant-api-[hash]-uc.a.run.app/api/health`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                  USER BROWSER (Next.js 14 App Router)               │
│           Firebase Hosting CDN — Static assets, ISR pages           │
└───────────────────────┬─────────────────────────────────────────────┘
                        │ HTTPS / SSE (streaming)
┌───────────────────────▼─────────────────────────────────────────────┐
│              CLOUD RUN — Next.js API Routes                          │
│    /api/chat (SSE stream)  /api/translate  /api/health               │
│    min-instances=1 | distroless container | Workload Identity        │
└──────┬──────────────┬──────────────────┬───────────────┬────────────┘
       │              │                  │               │
┌──────▼──────┐ ┌─────▼──────┐ ┌────────▼─────┐ ┌──────▼───────────┐
│ VERTEX AI   │ │ FIRESTORE  │ │   FIREBASE   │ │ CLOUD TRANSLATION│
│ Gemini Pro  │ │ Real-time  │ │     AUTH     │ │   API v3         │
│ + Flash     │ │ Subcollect │ │ Google/Email │ │ Glossary + Cache │
│ + FAQ       │ │ ions       │ │ /Anonymous   │ │                  │
└─────────────┘ └────────────┘ └──────────────┘ └──────────────────┘
       │
┌──────▼──────────────────────────────────────────────────────────────┐
│  CLOUD LOGGING + ERROR REPORTING + SECRET MANAGER                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Architecture Decision Record

| Service | Why This vs. Alternative |
|---------|--------------------------|
| **Vertex AI Gemini Pro** | Semantic grounding, JSON structured output, token tracking — vs. Dialogflow (rule-based, no LLM) |
| **Cloud Run** | Persistent SSE connections, min-instances, container control — vs. Cloud Functions (cold starts, no persistent connections) |
| **Firestore** | Real-time listeners, offline support, subcollection model — vs. RTDB (flat structure) |
| **Firebase Auth** | Multi-provider, custom claims, revocation check — vs. manual JWT |
| **Translation API v3** | Glossary API, batch, auto-detect — vs. v2 (no glossary, no batch) |
| **Secret Manager** | Encrypted, IAM-gated, audited — vs. environment variables |
| **Cloud Build** | Google-native CI/CD, Workload Identity — vs. GitHub Actions |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- Google Cloud SDK: [install](https://cloud.google.com/sdk/docs/install)
- GCP project: `election-assistant-prod`

### Local Development (Emulators — no real API calls)

```bash
# 1. Clone and install
git clone https://github.com/your-org/election-assistant
cd election-assistant/frontend
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Firebase config from Firebase Console

# 3. Start Firebase emulators
cd ..
firebase emulators:start

# 4. Run Next.js dev server (in new terminal)
cd frontend
npm run dev
```

Open `http://localhost:3000`

### Running Tests

```bash
# Unit tests
npm test

# Unit tests with coverage (target: >85%)
npm run test:coverage

# E2E tests (requires dev server running)
npm run test:e2e

# Full validation suite (typecheck + lint + tests)
npm run validate
```

---

## 📁 Project Structure

```
election-assistant/
├── frontend/                    # Next.js 14 App Router application
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── chat/route.ts       # SSE streaming AI chat
│   │   │   │   ├── translate/route.ts  # Translation API v3
│   │   │   │   └── health/route.ts     # Cloud Run health check
│   │   │   ├── assistant/page.tsx      # Chat interface
│   │   │   ├── timeline/page.tsx       # Election timeline
│   │   │   └── page.tsx                # Onboarding wizard
│   │   ├── features/
│   │   │   ├── election-assistant/     # AI chat feature
│   │   │   │   ├── services/           # ElectionAssistantService
│   │   │   │   └── hooks/              # useElectionAssistant
│   │   │   ├── timeline/               # Interactive timeline
│   │   │   ├── auth/                   # Firebase auth
│   │   │   └── localization/           # i18n + Translation
│   │   ├── shared/
│   │   │   ├── services/               # TranslationService
│   │   │   └── hooks/                  # useReducedMotion
│   │   └── infrastructure/
│   │       ├── vertex-ai/              # Gemini client + prompts
│   │       ├── firestore/              # Repositories + client
│   │       └── translation/            # Translation client
│   └── __tests__/
│       ├── unit/                       # Jest unit tests
│       └── e2e/                        # Playwright E2E tests
├── firestore.rules                     # Production security rules
├── firestore.indexes.json              # Composite indexes
├── firebase.json                       # Firebase config
├── cloudbuild.yaml                     # Google Cloud Build CI/CD
├── Dockerfile                          # Multi-stage, distroless
├── SECURITY.md                         # OWASP Top 10 mapping
└── ACCESSIBILITY.md                    # WCAG 2.1 AA report
```

---

## 🔐 Security

Full OWASP Top 10 coverage documented in [SECURITY.md](./SECURITY.md).

Key controls:
- **CSP headers** on all responses (A05)
- **Firebase ID token verification** + revocation check on every API call (A07)
- **Zod runtime validation** at all API and DB boundaries (A03)
- **Firestore security rules** with field-level access control (A01)
- **Distroless Docker image** + non-root user (A06)
- **Secret Manager** for all credentials — no env var secrets (A02)
- **Per-user rate limiting** on all AI endpoints (A04)

---

## ♿ Accessibility

WCAG 2.1 AA compliant. Full report in [ACCESSIBILITY.md](./ACCESSIBILITY.md).

Key features:
- Skip navigation link (WCAG 2.4.1)
- ARIA live regions for AI streaming responses (WCAG 4.1.3)
- Keyboard-only navigation through all flows (WCAG 2.1.1)
- 44×44px touch targets (WCAG 2.5.5)
- `prefers-reduced-motion` support (WCAG 2.3.3)
- All text ≥ 4.5:1 contrast ratio (WCAG 1.4.3)
- RTL language support for Arabic, Hebrew, Farsi, Urdu (WCAG 1.3.2)
- axe-core automated scanning in Playwright E2E suite

---

## 🌐 Google Services Integration

### Vertex AI Gemini Pro
- **Multi-turn conversation** with rolling 20-message context window
- **3-tier fallback chain:** Gemini Pro → Flash → Static FAQ
- **Token usage tracking** with quota-aware rate limiting
- **Chain-of-thought system prompt** for accurate civic information
- **Streaming SSE** — first token visible in < 500ms
- **JSON structured output** for election timeline extraction

### Firestore
- **Normalized subcollection model:** `users/{uid}/conversations/{cid}/messages`
- **6 composite indexes** for efficient paginated queries
- **Optimistic UI** with server reconciliation
- **Batch writes** for atomic message + conversation updates

### Firebase Authentication
- **3 providers:** Google OAuth, Email/Password, Anonymous
- **Token revocation** check on every API request
- **Custom claims** ready for region-based personalization

### Cloud Translation API v3
- **Glossary API** for election-specific terminology consistency
- **Batch translation** with memory caching
- **Auto-detect** source language from user input
- **RTL support** for Arabic, Hebrew, Farsi, Urdu

### Cloud Run
- **min-instances=1** — zero cold starts for demo
- **Distroless container** — minimal attack surface
- **Graceful shutdown** handling
- **Health check endpoint** at `/api/health`

---

## 🚢 Deployment

### Google Cloud Build (CI/CD)

```bash
# Trigger manual build
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_MIN_INSTANCES=1 \
  --project=election-assistant-prod .
```

### Manual Deployment Steps

```bash
# 1. Set up GCP project
gcloud config set project election-assistant-prod

# 2. Enable required APIs
gcloud services enable \
  run.googleapis.com \
  firestore.googleapis.com \
  translate.googleapis.com \
  aiplatform.googleapis.com \
  secretmanager.googleapis.com

# 3. Create service account
gcloud iam service-accounts create election-assistant-sa \
  --display-name="Election Assistant Service Account"

# 4. Grant minimal IAM roles
gcloud projects add-iam-policy-binding election-assistant-prod \
  --member="serviceAccount:election-assistant-sa@election-assistant-prod.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding election-assistant-prod \
  --member="serviceAccount:election-assistant-sa@election-assistant-prod.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding election-assistant-prod \
  --member="serviceAccount:election-assistant-sa@election-assistant-prod.iam.gserviceaccount.com" \
  --role="roles/cloudtranslate.user"

# 5. Deploy Firestore rules and indexes
firebase deploy --only firestore --project election-assistant-prod

# 6. Build and deploy to Cloud Run
docker build --target production -t gcr.io/election-assistant-prod/election-assistant:latest .
docker push gcr.io/election-assistant-prod/election-assistant:latest

gcloud run deploy election-assistant-api \
  --image gcr.io/election-assistant-prod/election-assistant:latest \
  --region us-central1 \
  --min-instances 1 \
  --allow-unauthenticated \
  --service-account election-assistant-sa@election-assistant-prod.iam.gserviceaccount.com

# 7. Deploy Firebase Hosting
firebase deploy --only hosting --project election-assistant-prod
```

### Pre-Launch Checklist

- [ ] Firestore indexes deployed and active (may take ~1 minute)
- [ ] Firestore security rules deployed
- [ ] Firebase Auth — Google, Email, Anonymous providers enabled in Console
- [ ] Secret Manager secrets set for any service account keys
- [ ] Cloud Run `min-instances=1` confirmed in Cloud Console
- [ ] Firebase Hosting custom domain verified (if applicable)
- [ ] `npm audit` — 0 critical/high vulnerabilities
- [ ] Health check endpoint responding: `GET /api/health → 200`
- [ ] Vertex AI quota requested for production load
- [ ] Cloud Logging alerts configured for error rates

---

## 🧪 Testing

| Type | Framework | Coverage |
|------|-----------|---------|
| Unit | Jest + ts-jest | 85%+ |
| Integration | Firebase Emulator | Auth + Firestore rules |
| E2E | Playwright | Happy path, keyboard nav, a11y, multi-viewport |
| Accessibility | axe-core | WCAG 2.1 AA automated scan |

```bash
# View coverage report
npm run test:coverage
open coverage/lcov-report/index.html
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Run the full validation suite: `npm run validate`
4. Submit a pull request with a clear description

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

*Built with ❤️ for civic engagement. Powered by Google Cloud.*
