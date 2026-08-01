# Tasks: Participación Ciudadana Activa v1

All paths are under `backend/`; `backendFiles/` and `docs/specs/` are read-only.

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated authored lines | 2,000–3,500 |
| 400-line budget risk | High |
| Single PR acceptable | Yes — configured 99,999-line budget; tightly coupled vertical slice |
| Delivery | single-pr; work-unit commits; chain not applicable |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

## Phase 1: Foundation

- [x] **1.1 Test setup** — P: enable tests. A: `package.json`, `vitest.config.ts`, `playwright.config.ts`, `tests/`. D: none. I: add runners, fakes, PG fixture/scripts. V: `npm run test:unit -- --run`. R: remove setup.
- [x] **1.2 Config/security** — P: protect runtime/data. A: `src/config/*`, `src/lib/security/*`, `src/lib/storage/*`, `.env.example`, `next.config.ts`. D: 1.1. I: Node runtime, constant-time admin bearer, encryption/HMAC, private PDFs, 80,000-char limit. V: config tests. R: revert config.
- [x] **1.3 Schema/migration** — P: persist invariants. A: `prisma/schema.prisma`, `prisma/migrations/*`. D: 1.2. I: all design models, indexes, composite uniqueness. V: Prisma format/validate/generate plus real PG migration. R: down-migrate only.

Threat matrix: every design row is `N/A`; no RED security tasks apply.

## Phase 2: Domain Services

- [x] **2.1 Contracts/consent** — P: safe identity/subscription. A: `src/domain/*`, `src/lib/errors.ts`, `src/domain/consent/*`. D: 1.3. I: typed errors, number normalization/encryption/digest, immutable versioned opt-in, categories, opt-out, generic responses, dispatch recheck. V: invalid/consent-version/revocation tests. R: revert consent modules.
- [x] **2.2 PDF pipeline** — P: private usable source. A: `src/domain/projects/extraction.ts`, `src/lib/storage/*`. D: 1.2, 2.1. I: extract/normalize/fingerprint; reject empty, scanned, or oversized text with status. V: text/empty-PDF tests. R: remove extractor/storage.
- [x] **2.3 Groq grounding** — P: cached auditable AI. A: `src/integrations/groq/*`, `src/domain/projects/summary.ts`, `src/domain/consultations/context.ts`. D: 2.2. I: source/prompt/model cache/invalidation; direct selected context, 80k gate, Spanish fallback, no RAG. V: cache/gate/outage tests. R: disable provider, keep drafts private.
- [x] **2.4 Projects/publication** — P: protected authoring. A: `src/domain/projects/*`, `src/app/api/admin/projects/*`. D: 2.1–2.3. I: draft/process/review/publish gates require usable source plus approved matching summary. V: auth/failure-gate tests. R: unpublish/revert routes.
- [x] **2.5 Public projection** — P: privacy-safe discovery. A: `src/domain/projects/public.ts`, `src/app/api/projects/*`. D: 2.4, 2.8. I: published-only DTOs: metadata, cached summary, status, disclaimer, aggregate/version; omit identities. V: draft/privacy tests. R: remove handlers.
- [x] **2.6 WhatsApp campaigns** — P: consented delivery. A: `src/integrations/whatsapp/*`, `src/domain/consultations/campaign.ts`. D: 2.1, 2.4. I: singleton lifecycle/QR/status/shutdown, snapshots, idempotency, recheck, states, bounded retry/fallback. V: fake-adapter dispatch/retry/opt-out tests. R: `WHATSAPP_ENABLED=false`; retain audit.
- [x] **2.7 Conversation/Q&A** — P: recoverable bot flow. A: `src/domain/consultations/conversation.ts`, inbound adapter. D: 2.3, 2.6. I: explicit/active project, expiry/ambiguity, interactive/`1/2/3`, Q&A and safe errors. V: expired/ambiguous/unsupported/provider scenarios. R: disable inbound.
- [x] **2.8 Opinions/aggregates** — P: correct non-binding results. A: `src/domain/opinions/*`, transaction helpers. D: 1.3, 2.7. I: inbound idempotency, one current opinion per citizen/project, replacement, atomic counts/percentages/participant/version. V: duplicate/replace/concurrency tests. R: disable writes; retain audit.

## Phase 3: Integration

- [x] **3.1 Routes/pages** — P: expose the loop. A: `src/app/(public)/*`, `src/app/admin/*`, `src/app/api/subscriptions/*`, `src/app/api/admin/*`. D: 2.4–2.8. I: protected admin, public catalog/detail, consent/category opt-out UI, no private fields. V: auth/render smoke. R: remove routes/pages.
- [x] **3.2 SSE fallback** — P: live safe refresh. A: `src/lib/realtime/*`, `src/app/api/projects/[id]/events/route.ts`, public client. D: 2.8, 3.1. I: aggregate-only notifier; persisted GET is reconnect authority. V: SSE/reconnect scenario. R: retain GET-only results.

## Phase 4: Verification / Demo

- [x] **4.1 Unit/integration** — P: prove domains/routes. A: `tests/unit/*`, `tests/integration/*`. D: 2.1–3.2. I: Vitest fake providers plus real PG transactions/auth/projections. V: `npm run test:unit` and `npm run test:integration`. R: remove tests.
- [x] **4.2 E2E journey** — P: prove user value. A: `tests/e2e/*`. D: 3.1, 4.1. I: Playwright, fake WhatsApp, disabled real dispatch. V: publish → browse → subscribe → consult → opinion → aggregate. R: remove E2E suite.
- [x] **4.3 Final integration/demo** — P: release evidence. A: `package.json`, `tests/scripts/*`, `README.md`. D: all prior. I: document seed/admin/PDF/demo, fallbacks, non-goals; preserve specs/exclusions. V: `npm run prisma:format && npm run prisma:validate && npm run typecheck && npm run build && npm run smoke:postgres`, then repeat demo. R: revert scripts/docs.

## Explicit Non-Goals

No `backendFiles/`; no `docs/specs/` edits; no RAG/embeddings/vector search, audio, geography, official identity/voting, sentiment, citizen-created consultations, legislative tracking, or expanded/full-product dashboards.
