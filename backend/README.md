# hakIA — Participación Ciudadana Activa v1

This package is the first functional vertical slice for non-binding civic participation. It is a Node-runtime Next.js 15 application backed by PostgreSQL/Prisma, with replaceable Groq and `whatsapp-web.js` adapters.

## Runtime setup

Requirements: Node.js 20.9+, PostgreSQL, and npm.

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate       # deploys only committed migrations; never use reset against production
npm run dev
```

The application accepts `DATABASE_URL`/`postgresqlURL` or the normalized connection fields `Host`, `Puerto`, `Base de datos`, `Usuario`, `Password`, and `SSL`. Credentials are resolved at runtime and are never logged by the application. Use the existing environment rather than committing `.env`.

Required secrets are `ADMIN_BEARER_TOKEN`, `DATA_ENCRYPTION_KEY`, and `NUMBER_HMAC_KEY`. Use independent, randomly generated values in every environment. Phone numbers are AES-GCM encrypted for delivery and indexed by a keyed HMAC digest; public projections never select either representation.

## Admin bootstrap and workflow

The initial administrator boundary is a bearer secret, not a user-management system. Send `Authorization: Bearer $ADMIN_BEARER_TOKEN` to `/api/admin/*`. Create categories first:

```bash
curl -X POST http://localhost:3000/api/admin/categories \
  -H "Authorization: Bearer $ADMIN_BEARER_TOKEN" -H "Content-Type: application/json" \
  -d '{"slug":"movilidad","name":"Movilidad"}'
```

The admin page at `/admin` supports saving a PDF draft, processing it, reviewing its generated summary, and publishing it. The API equivalents are `POST /api/admin/projects`, `POST /api/admin/projects/:id/process`, `POST /api/admin/projects/:id/review`, and `POST /api/admin/projects/:id/publish`.

Publication requires a selectable-text PDF, a source fingerprint, a generated summary, and an explicit administrator approval for the matching source fingerprint. Failed extraction or unavailable Groq leaves the project private.

## PDF constraints

v1 accepts ordinary text PDFs only. Scanned/image-only PDFs are rejected. Extracted text must contain at least `MIN_EXTRACTED_CHARS` characters and cannot exceed `DIRECT_CONTEXT_MAX_CHARS` (default 80,000 UTF-8 characters). PDF bytes are stored under `PDF_STORAGE_PATH` with private filesystem permissions and are not exposed by a route.

## Groq and grounded Q&A

Summaries are cached by source fingerprint, prompt version, and model configuration. Q&A injects only the selected project's metadata, source text, approved summary, and question. It does not use RAG, embeddings, vector search, unrelated projects, or per-message summarization. If Groq is unavailable, a citizen receives the approved cached summary or a temporary-unavailability message; the system never fabricates an answer.

## WhatsApp lifecycle

`WHATSAPP_ENABLED=false` is the safe default. The adapter is created once per process, uses `WHATSAPP_SESSION_PATH`, and exposes `disabled`, `initializing`, `qr`, `ready`, `disconnected`, and `failed` states. Start or stop it through the protected `/api/admin/whatsapp` endpoint. The QR is intentionally not persisted in the public API. `whatsapp-web.js` is never started by tests; `createFakeWhatsAppIntegration()` is deterministic and records sent messages.

Dispatch creates a persisted audience snapshot and one idempotent recipient row per consultation/citizen. Consent is checked again immediately before sending. Revoked or non-matching recipients are skipped; failed sends retain bounded retry state and never create a second logical delivery.

## Demo flow

1. Create a category and configure the admin bearer plus encryption/HMAC secrets.
2. Upload a selectable-text PDF at `/admin`.
3. Process, review, and publish the project.
4. Create an open consultation with two or three fixed options through the admin API.
5. Browse `/` and `/projects/:id`; only aggregate counts, percentages, participant count, and version are public.
6. Subscribe at `/suscribirse` with explicit versioned consent.
7. Dispatch with WhatsApp disabled for a safe dry-run, or enable only when an operator explicitly owns the QR session.
8. Use the fake adapter in tests for `1/2/3`, grounded Spanish questions, opt-out, replacement opinions, and aggregate refresh.

Aggregate updates use process-local SSE at `/api/projects/:id/events`; persisted aggregate GET responses remain authoritative after reconnect or process restart.

## Verification

```bash
npm run prisma:format
npm run prisma:validate
npm run prisma:generate
npm run test:unit -- --run
npm run test:integration -- --run
npm run typecheck
npm run build
npm run smoke:postgres
npm run test:e2e
```

The PostgreSQL smoke performs only `SELECT 1`. It does not reset, drop, truncate, seed, or mutate the configured database.

## Non-goals

This release does not implement RAG, embeddings, vector search, audio, geographic targeting, official identity or legislative voting, sentiment analysis, citizen-created consultations, legislative tracking, queue workers, multi-instance realtime fan-out, or a full identity/admin management system. `backendFiles/` and `docs/specs/` are intentionally unchanged.
