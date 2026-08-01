# Apply Progress: Participación Ciudadana Activa v1

## Status

- Change: `participacion-ciudadana-v1`
- Mode: Standard (strict TDD disabled)
- Delivery: single PR with maintainer-approved `size:exception`
- Scope: all 16 implementation tasks completed from the partial baseline commit `40a70c8`.
- Forbidden paths preserved: `backendFiles/`, `docs/specs/`, `.env`, `.codegraph`, and credentials were not modified.

## Completed Tasks

All tasks are marked `[x]` in `tasks.md`.

| Task | Completion evidence |
|---|---|
| 1.1 | Vitest, Playwright, fake adapters, PostgreSQL scripts, deterministic bootstrap, and test scripts are configured. Unit run passed: 4 files / 8 tests. |
| 1.2 | Bearer admin protection, AES-GCM number encryption, HMAC lookup digest, private PDF storage, runtime database-key mapping, and UTF-8 context limits are implemented and unit-tested. |
| 1.3 | Prisma schema and committed migration are valid/generated; `prisma:migrate` reported no pending migrations against the configured PostgreSQL database. |
| 2.1 | Consent version checking, normalized numbers, immutable consent events, category subscriptions, generic opt-out, and dispatch-time consent recheck are wired. |
| 2.2 | Selectable-text PDF extraction, normalization, SHA-256 fingerprinting, usable-content validation, source failure status, and private storage are wired. |
| 2.3 | Groq summary cache keys, direct selected-project context, UTF-8 size gate, cached-summary fallback, and no-RAG Q&A are wired. |
| 2.4 | Protected draft/process/review/publish/unpublish routes enforce usable source plus matching approved summary. |
| 2.5 | Published-only public DTOs omit participant, phone, delivery, conversation, and individual opinion data. |
| 2.6 | WhatsApp lifecycle, fake adapter, audience snapshot, idempotent recipient rows, bounded retry state, dispatch recheck, and admin dispatch route are wired. |
| 2.7 | Conversation state recovery, `1/2/3` fallback, expiry handling, grounded Q&A, and protected fake inbound route are wired. |
| 2.8 | Current-opinion replacement, inbound event idempotency, transactional aggregates, percentages, participant count, and notifier publication are wired. |
| 3.1 | Public catalog/detail/subscription/admin pages and API routes are available; admin consultation status and dispatch operations are now exposed. |
| 3.2 | SSE remains aggregate-only and the client performs persisted project GET recovery on initial load and EventSource errors. |
| 4.1 | Unit and real PostgreSQL integration tests pass; integration fixtures roll back inside a non-destructive transaction. |
| 4.2 | Playwright runs a seeded public browse → subscribe → admin lifecycle/dispatch → fake inbound Q&A/opinion → aggregate journey. |
| 4.3 | `demo:bootstrap` is idempotent/non-destructive, README documents setup/fallbacks, and browser installation/configuration is deterministic. |

## Work Unit Evidence

| Evidence | Exact result |
|---|---|
| Focused test command | `npm run test:unit -- --run` — passed, 4 test files and 8 tests. |
| PostgreSQL integration command | `npm run test:integration -- --run` — passed, 1 file and 2 tests; one SELECT-only check and one rolled-back current-opinion/public-projection transaction. |
| Runtime harness command/scenario | `npm run test:e2e` — passed, 1 Playwright test; deterministic bootstrap, public rendering, subscription, protected consultation open/dispatch/close, fake inbound Q&A, fake inbound opinion, and aggregate refresh. Chromium was installed with `npx playwright install chromium`. |
| Prisma validation/generation | `npm run prisma:format; npm run prisma:validate; npm run prisma:generate` — all passed. The validation script now safely maps supported runtime connection keys without printing values. |
| Build/typecheck | `npm run typecheck` — passed. `npm run build` — passed; Next.js reported only the existing multiple-lockfile workspace-root warning. |
| PostgreSQL migration/smoke | `npm run prisma:migrate` — no pending migrations. `npm run smoke:postgres` — passed: `SELECT 1` returned 1; no mutation performed. |
| Demo bootstrap | `npm run demo:bootstrap` — passed; deterministic published project, approved source/summary, open consultation, and category were upserted without reset/drop/truncate/delete. |
| Rollback boundary | Revert the files under `backend/src/app/api/admin/consultations/[id]/`, `backend/src/app/api/admin/whatsapp/inbound/`, `backend/src/domain/consultations/`, `backend/src/domain/opinions/`, `backend/src/app/_components/`, `backend/tests/`, `backend/playwright.config.ts`, `backend/vitest.config.ts`, `backend/package.json`, `backend/.env.example`, `backend/README.md`, and this SDD progress/state update. Existing Prisma migration and baseline implementation remain independently revertible; no destructive down-migration was run. |

## Playwright Audit Resolution

The original E2E only checked the public catalog and failed on empty databases. The root causes were missing deterministic data, missing browser installation, a startup switch that could reuse an unrelated server, and no fake inbound/dispatch path. The suite now bootstraps persisted demo records, starts its own server by default (`START_E2E_SERVER=false` is the explicit opt-out), disables real WhatsApp, uses fixed test-only secrets in the child process, installs/uses Chromium, and exercises the complete journey through the controlled fake inbound route. A selector collision caused by the opt-out form was fixed by giving its number field a distinct accessible label; the final run passed.

## PostgreSQL Evidence and Safety

The configured PostgreSQL connection was available through the existing runtime environment. Values were resolved by key name and were never printed or committed. Migration deployment reported no pending migrations. Smoke performed only `SELECT 1`. Integration fixture writes were wrapped in an interactive transaction and deliberately rolled back; the demo bootstrap only uses idempotent upserts and does not reset, drop, truncate, or destructive-seed production data.

## Remaining Blockers / Risks

- No implementation blocker remains for the first functional version.
- Real Groq and real WhatsApp remain opt-in operational integrations. The safe default is cached/fallback behavior and `WHATSAPP_ENABLED=false`; a real QR session must be explicitly owned before enabling delivery.
- The Next.js build still emits a non-blocking warning because an ancestor `pnpm-lock.yaml` is visible; this does not fail typecheck, build, or runtime tests.

## Deviations

- The persisted context budget is measured with UTF-8 byte length rather than JavaScript UTF-16 code units, matching the design requirement.
- The fake adapter deduplicates repeated idempotency keys to make local delivery behavior deterministic; the production invariant remains enforced by persisted recipient keys.
