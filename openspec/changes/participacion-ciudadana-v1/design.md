# Design: Participación Ciudadana Activa v1

## Technical Approach

Build one Node-runtime Next.js 15 App Router package in `backend/`. Route handlers and server-rendered public pages call domain services; Prisma is the only persistence boundary. Groq and `whatsapp-web.js` remain replaceable adapters. The demo defaults to one published project, one consultation, text PDFs, local private storage, SSE, and a single long-running process; all are configurable behind interfaces, not separate services or a queue.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|---|---|---|---|
| Execution | Synchronous PDF processing; persisted recipient rows plus bounded in-process dispatch | Queue/worker | Smallest reliable slice; DB states survive request/process failure. |
| Admin boundary | Bearer secret from environment, constant-time checked, on `/api/admin/*` | Hidden routes/serverless auth | Explicit protection now; replaceable with an identity provider. |
| Number protection | Encrypted number + keyed HMAC lookup digest; decrypt only in WhatsApp adapter; immutable consent audit | Plaintext/hashed-only | Delivery needs the number while public projections never do. |
| AI context | Persisted source + cached summary + metadata, max 80,000 UTF-8 chars; reject oversized source | Truncation/RAG | Deterministic, auditable grounding without embeddings. |
| Realtime | SSE notifier per process; GET aggregate is authority and reconnect fallback | WebSocket/broker | Minimal public update path; multi-instance fan-out remains configurable later. |

## Module Boundaries and Data Model

`src/domain/projects` owns extraction, fingerprints, summary review, publication gates; `consent` owns normalization, immutable events, subscriptions and opt-out; `consultations` owns audience snapshots, delivery state and conversation resolution; `opinions` owns current replacement and aggregate transactions; `src/integrations/groq` owns summary/Q&A calls; `src/integrations/whatsapp` owns client lifecycle, QR/session status and sends; `src/lib/realtime` publishes aggregate-only events. Controllers validate input and map typed domain errors.

Prisma models: `Admin`, `Citizen` (encrypted number, unique digest), `Category`, `ConsentEvent`, `Subscription`, `Project`, `ProjectSource`, `Summary`, `Consultation`, `AudienceSnapshot`, `CampaignRecipient`, `ConversationState`, `Opinion`, and `AggregateResult`. Composite uniqueness enforces `(citizenId, projectId)` current opinion and campaign idempotency. Public queries select projection DTOs only.

## API Contracts

`GET /api/projects`, `GET /api/projects/:id`, `GET /api/projects/:id/events` return published metadata, approved summary, disclaimer, aggregate and version only. `POST /api/subscriptions` accepts normalized number, categories, consent text/version/source and returns generic `{accepted:true}` without account existence disclosure; opt-out is a generic command and revokes future sends. Bearer-protected admin routes create/process/review/publish projects and create/dispatch consultations. `POST /api/admin/projects/:id/publish` is rejected unless source and approved summary match. WhatsApp inbound messages enter `ConversationService`, never a public write route.

## Data Flow and Sequences

```text
PDF → private storage → extractor/fingerprint → ProjectSource → Groq summary → Summary(review) → publish
number → normalize/encrypt/digest → consent event/subscriptions → audience snapshot → recipient rows → WhatsApp
question → active ConversationState → source+summary+question gate → Groq Q&A → Spanish grounded reply
option → resolve citizen/project → transaction(Opinion+AggregateResult) → SSE aggregate event → public GET fallback
```

```text
PDF: Admin→API→Extractor→Prisma(source)→Groq→Prisma(summary)→Admin review→Publish
Subscribe: Citizen→API→normalize→Prisma(consent/subscriptions)→generic response→optional WhatsApp confirmation
Campaign: Admin→API→match active consent→snapshot rows→recheck consent→WhatsApp→status/retry
Q&A: WhatsApp→state→load source+cache→size gate→Groq→reply (or safe fallback)
Opinion: WhatsApp→parse 1/2/3→transaction current opinion+aggregate→reply
Realtime: Opinion transaction→persist aggregate→notifier→SSE; reconnect→GET authority
```

## Error Handling, Security, and Operations

Use typed errors (`validation`, `unauthorized`, `conflict`, `provider_unavailable`, `context_too_large`) with safe public messages and structured server logs. Failed extraction/summary leaves drafts unpublished; Groq outage uses cached summary or “temporarily unavailable”; WhatsApp outage records bounded exponential retries and visible disconnected state. Dispatch rechecks active consent immediately before send; revoked/non-matching recipients become `skipped`. Encrypt secrets and numbers, restrict admin audit access, redact logs, never expose raw PDF/number/opinion, and label every response as non-binding citizen opinion. `whatsapp-web.js` is created once in a server-only lifecycle manager, uses the configured session path, exposes `initializing/qr/ready/disconnected`, and closes on process shutdown.

## Testing, Rollout, and Rollback

Add Vitest scripts and adapter fakes: unit-test normalization, publication gates, context budget, consent matching, idempotency, opinion uniqueness and aggregate math; integration-test Prisma transactions and route auth/projections; Playwright-smoke the public/admin loop with WhatsApp disabled and a fake adapter. Local verification: `npm run prisma:format`, `prisma:validate`, `npm run typecheck`, `npm run build`, then PostgreSQL smoke; enable real Groq/WhatsApp only for an explicit QR-session demo. Roll out behind `WHATSAPP_ENABLED=false`, seed one category/admin, process one text PDF, then enable dispatch. On failure disable dispatch/unpublish, preserve audit rows, and roll back application plus migration to the pre-change revision.

## File Changes

| File | Action | Description |
|---|---|---|
| `backend/prisma/schema.prisma` | Modify | Domain models, indexes and uniqueness constraints. |
| `backend/src/app/**`, `backend/src/domain/**`, `backend/src/lib/**` | Create | Pages, route handlers, services, projections, errors and SSE notifier. |
| `backend/src/integrations/groq/*`, `whatsapp/*` | Modify | Functional typed adapters and lifecycle boundaries. |
| `backend/src/config/*`, `.env.example`, `package.json`, `next.config.ts` | Modify | Limits, admin/storage/session settings, PDF/test dependencies and Node boundaries. |
| `backend/prisma/migrations/*`, `backend/tests/*` | Create | Migration and automated verification. |

## Threat Matrix

| Boundary | Applicability / response / RED test |
|---|---|
| Documentation-like paths | N/A — no executable-document classification. |
| Git repository selection | N/A — no VCS automation. |
| Commit state | N/A — no commit automation. |
| Push state | N/A — no push automation. |
| PR commands | N/A — no PR automation. |

## Open Questions

Consent wording/legal review, exact PDF library, retention/key rotation, and production admin identity remain configurable; demo defaults above are required before implementation.
