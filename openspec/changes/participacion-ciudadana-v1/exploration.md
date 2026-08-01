# Exploration: Participación Ciudadana Activa v1

## Current State

The product source of truth defines one complete, non-binding participation loop:

`public project browsing → WhatsApp number/category subscription with explicit opt-in → administrator PDF upload → extracted source and one cached LLM summary → category-targeted WhatsApp consultation → grounded project Q&A → one current citizen opinion → public aggregate update`.

The repository is not yet implementing that loop. The active package is `backend/`, a Next.js 15 App Router API scaffold with TypeScript, Prisma/PostgreSQL, Groq, and `whatsapp-web.js` dependencies. It currently provides only `GET /api/health`; the Prisma schema has no domain models, there are no portal pages, and both provider integrations are explicit stubs. `next.config.ts` externalizes `whatsapp-web.js` for a future Node runtime but does not initialize a client. The package has build and typecheck scripts but no runnable test runner.

`backendFiles/` is a separate dependency-free legacy module collection. Its README describes reusable medical/audio/AI utilities and confirms that it has no package, TypeScript configuration, or local test toolchain. Nothing inspected there establishes a current boundary for this product, so it should not be treated as the active implementation package.

The first functional version already makes the key product constraints explicit: opinions are not official votes; public pages expose only aggregate data; proactive messages require recorded opt-in and category matching; summaries are versioned and reusable; Q&A uses direct context injection rather than RAG, embeddings, or vector search; and unsupported answers must be qualified rather than invented.

## Users and Goals

| User | Goal in the first slice | Required trust property |
|---|---|---|
| Public visitor | Discover a published project, read its summary, and see current aggregate results without registering | No phone numbers or individual opinions are visible |
| Subscribed citizen | Select topics, explicitly opt in, receive a matching consultation, ask grounded questions, and submit or change one opinion | Consent is explicit, participation is voluntary, and the response is clearly non-binding |
| Administrator | Upload and categorize a PDF, review the generated summary, publish a project, start one consultation, and inspect delivery/aggregate status | A project cannot publish with unusable source text or an unavailable summary |
| LLM provider | Generate a summary or answer from supplied project context | It cannot publish projects, send messages, or change opinions |
| WhatsApp transport | Deliver consultation and response messages | Delivery is adapter-bound, observable, retry-safe, and never used as implicit consent |

## Affected Areas

- `docs/specs/first-functional-version.md` — authoritative functional requirements, journeys, entities, invariants, failure behavior, direct-context contract, and open implementation decisions.
- `docs/specs/README.md` — shared vocabulary and non-negotiable privacy, consent, grounding, and opinion boundaries.
- `backend/src/app/api/health/route.ts` — current API entry-point pattern; future routes need explicit Node runtime behavior where integrations require it.
- `backend/prisma/schema.prisma` — currently only the PostgreSQL datasource; it must become the persistence boundary for citizens, consent, categories, projects, sources, summaries, consultations, recipients, opinions, aggregates, and conversation state.
- `backend/src/lib/config.ts` and `backend/.env.example` — existing environment boundary for database, Groq model/key, WhatsApp enablement/session path, and port; future limits, versions, storage, and admin configuration need an intentional contract.
- `backend/src/integrations/groq/*` — typed but non-functional text-generation adapter; it must support distinct summary and grounded-Q&A operations with model/configuration identity and safe failure handling.
- `backend/src/integrations/whatsapp/*` and `backend/next.config.ts` — typed but non-functional transport boundary; session/authentication, send status, retries, and Node process lifecycle remain unresolved.
- `backend/README.md` — accurately states that there are no pages, domain persistence, authentication, consent, campaigns, Q&A, or opinions; it will be a useful implementation boundary but must not be changed during exploration.
- `backend/package.json` — contains the runtime dependencies and only build/typecheck/Prisma scripts; no PDF extraction, file storage, job runner, realtime, schema validation, or test runner is currently selected.
- `openspec/changes/participacion-ciudadana-v1/state.yaml` — initialized DAG state; exploration is the next phase and no later artifact exists.

## Business Rules and Invariants to Carry Forward

1. Public catalog and detail pages MUST return published projects only and MUST never expose phone numbers, WhatsApp identifiers, or attributable opinions.
2. Subscription MUST normalize an international WhatsApp number, require at least one category, record explicit consent text/version, timestamp, selected categories, and source, and support category-level revocation plus global opt-out.
3. A campaign audience MUST be snapshotted from active category overlap and valid consent before dispatch. A revoked or non-matching number MUST be skipped.
4. A project MUST remain unpublished until PDF extraction yields usable text and a reviewable cached summary exists.
5. A summary cache key MUST include the source fingerprint, prompt/template version, and model configuration. Inbound Q&A MUST reuse the cache and MUST NOT invoke summarization.
6. Q&A context MUST contain only the selected project metadata, persisted source text, cached summary, question, and grounding instructions. Oversized documents require an explicit limit and safe handling; they MUST NOT silently fall back to RAG.
7. A citizen has at most one current opinion per project. A valid replacement changes the aggregate contribution; invalid or ambiguous messages do not change it.
8. Public aggregate events MUST contain aggregate data only, including participant count and last-updated/version information, never personal identifiers.
9. All messages and public copy MUST distinguish citizen opinion from official legislative voting and MUST state when the source does not support an answer.

## System Boundaries and Assumptions

### Proposed first-release boundary

The smallest coherent implementation is one deployable Next.js/Node application in `backend/`, backed by PostgreSQL and a configured `whatsapp-web.js` session. Public pages and API routes can live in the same package because no separate frontend exists in the repository. Domain services should own invariants; integration adapters should own Groq and WhatsApp provider behavior; Prisma should remain the persistence boundary.

The first demo should deliberately limit operational breadth to one published project, a small number of categories, one consultation with fixed options (`A favor`, `En contra`, `Necesito más información`), and one or a few opted-in recipients. The data model and audience calculation should still use the general project/category/campaign relationships so the slice does not encode a one-off flow.

### Assumptions requiring confirmation in proposal/design

- A single long-running Node process is acceptable for the first demonstration; serverless execution is not assumed because `whatsapp-web.js` needs a persistent authenticated session.
- Administrator authentication can be minimal for the first slice, but it cannot be left as an undocumented public write surface. The exact mechanism (single admin secret, existing identity provider, or another boundary) is open.
- Phone numbers must remain usable for WhatsApp delivery while being protected at rest. A likely design is encrypted storage plus a keyed lookup digest, but key management, rotation, retention, and access logging require explicit decisions.
- A local filesystem or object-storage reference is needed for uploaded PDFs. The repository currently selects neither; source text and fingerprints must be persisted independently of the original upload lifecycle.
- A synchronous PDF-processing path may be sufficient for one small document, while campaign dispatch should persist recipient state before attempting sends and tolerate bounded asynchronous work.
- A single-instance in-process event notifier can demonstrate live updates, provided refresh/reconnect returns the persisted aggregate and the limitation is documented. Multi-instance fan-out is not solved by the current scaffold.

### Open decisions

| Decision | Why it matters | Small-slice default to evaluate next |
|---|---|---|
| PDF extraction and scanned-PDF policy | Determines whether publication can produce trustworthy source text | Accept text PDFs only; reject scanned/empty extraction with an actionable error |
| Upload storage | PDFs may contain sensitive or unpublished material | Local/private storage for the demo, behind a storage interface; no public raw-file URL by default |
| LLM model, timeout, budget, and retention | Affects cost, latency, reproducibility, and data handling | Use configured Groq model; persist prompt/model identifiers and fail closed when unavailable |
| Direct-context size limit | Full PDF injection can exceed provider limits or become costly | Define a byte/token limit before publication and reject oversized sources explicitly |
| Administrator authentication | Prevents unauthorized publication and campaigns | Choose a minimal authenticated admin boundary before implementation; never rely on hidden routes |
| WhatsApp session ownership and recovery | `whatsapp-web.js` is stateful and operationally fragile | One explicitly owned session with QR/bootstrap documentation and visible disconnected state |
| Campaign execution model | Sends can outlive HTTP requests and provider failures | Persist audience/recipient rows first, then bounded dispatch with idempotency and observable status |
| Realtime transport | Product requires public updates without exposing identities | SSE plus persisted aggregate and refresh fallback is a small demonstrable option; short polling is the simpler fallback |
| Consent/legal copy | Consent validity depends on jurisdiction and channel wording | Make text/version configurable and obtain jurisdictional review before production use |

## Approaches

1. **Single vertical slice in the active Next.js package** — Implement public pages, admin routes, domain persistence, direct-context AI, WhatsApp adapter, and aggregate updates in `backend/`, with the boundaries already suggested by the scaffold.
   - Pros: smallest deployment and review surface; uses the existing package and dependencies; keeps the end-to-end demo easy to run; preserves one source of truth for invariants.
   - Cons: requires adding several concerns to a currently empty schema; a single Node process limits WhatsApp and realtime scalability; admin and worker boundaries need care.
   - Effort: Medium/High.

2. **Split portal, API, and messaging worker before the first slice** — Create separate frontend/API/dispatch services and a durable queue from the start.
   - Pros: clearer long-term operational isolation; campaign retries and WhatsApp lifecycle can be independently scaled; realtime and background work are easier to distribute later.
   - Cons: no existing service boundaries or queue infrastructure; substantially increases deployment, authentication, observability, and failure modes; delays proof of the product loop.
   - Effort: High.

## Recommendation

Proceed with Approach 1, but keep the internal boundaries explicit: `Project/Source/Summary`, `Consent/Subscription`, `Consultation/CampaignRecipient`, `Conversation/Opinion/Aggregate`, and separate Groq/WhatsApp adapters. Build the first demonstrable slice around one project and one consultation while persisting version, consent, delivery, and aggregate state as if multiple projects existed.

Use direct context injection exactly as specified, with a publication-time size gate and a safe fallback for LLM unavailability. Treat PDF processing and campaign dispatch as stateful operations rather than opaque controller logic. For realtime results, evaluate SSE backed by persisted aggregates and a single-instance notifier, with refresh recovery; if that is disproportionate during design, short polling is an acceptable demonstrator only if the next phase records the trade-off against FV-052.

This approach proves the product's differentiating trust loop without introducing RAG, audio, geographic targeting, official identity, sentiment analysis, or the expanded operational dashboard. It also leaves a clean path to replace local storage, the single-instance notifier, or the WhatsApp process without changing public opinion semantics.

## Smallest Demonstrable Slice

1. Seed one active category and one administrator account/boundary.
2. Admin uploads one text-based PDF, enters metadata, assigns the category, waits for extraction and one versioned summary, reviews it, and publishes the project.
3. Visitor opens the public catalog/detail page and sees only the published metadata, summary, disclaimer, and aggregate placeholder/results.
4. Citizen enters a normalized WhatsApp number, selects the category, reads the purpose/privacy/opt-out copy, and explicitly opts in; the system stores the consent event and subscriptions without exposing whether the number already existed.
5. Admin opens one consultation with the three fixed options. The system snapshots matching consented recipients and records idempotent delivery rows before sending through the WhatsApp adapter.
6. Citizen asks a question in the active project conversation and receives a Spanish answer grounded only in that project's source text and cached summary, or a transparent fallback.
7. Citizen replies with `1`, `2`, or `3`; the system inserts/replaces the current opinion, recalculates the aggregate, confirms the non-binding nature, and emits an aggregate-only update.
8. The public page receives or retrieves the new aggregate, participant count, and last-updated timestamp without receiving a phone number or individual response.

## Risks

- **WhatsApp operational fragility:** QR authentication, session persistence, account restrictions, and process restarts can prevent delivery. Mitigate with an adapter, explicit connection status, persisted recipient states, bounded retries, and an admin-visible failure path.
- **Privacy and consent failure:** Storing raw numbers or sending after revocation would violate the product boundary. Encrypt delivery data, use controlled lookup, persist immutable consent events, re-check active consent at dispatch, and keep public projections aggregate-only.
- **AI hallucination or stale context:** Model answers can invent legal effects or use an invalidated summary. Version source/prompt/model together, block publication after source changes, inject only the selected project's context, and fail closed on unsupported questions.
- **Context-size and cost overflow:** A PDF can exceed model limits or make every question expensive. Enforce a measured maximum before publication and define rejection/administrator-shortening behavior; do not silently truncate or add retrieval.
- **Duplicate participation or campaign sends:** Retries and repeated WhatsApp messages can create incorrect scores or user harm. Use campaign/project/phone idempotency, database uniqueness for the current opinion, and bounded retry states.
- **Realtime inconsistency:** An in-process notifier can miss events during restart or fail across multiple instances. Persist aggregates as the authority and require reconnect/refresh recovery; document single-instance scope or choose polling.
- **Unauthorized admin actions:** The scaffold has no authentication. Do not implement upload, publication, or dispatch behind an unprotected route, even for a demo.
- **Scope inflation:** Audio, RAG, official identity, geographic targeting, open-text analysis, and legislative status would obscure the first proof. Keep them explicitly out of this change.

## Ready for Proposal

Yes. The proposal should confirm the single-package vertical slice, select the smallest document/storage/LLM/WhatsApp/realtime defaults, define the minimal administrator boundary, and turn the listed privacy, consent, grounding, idempotency, and aggregate-only rules into explicit acceptance scope. It should preserve `docs/specs/` unchanged and carry unresolved operational/legal choices into design rather than silently deciding them during implementation.
