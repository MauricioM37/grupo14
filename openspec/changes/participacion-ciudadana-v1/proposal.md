# Proposal: Participación Ciudadana Activa v1

## Intent

Prove a trustworthy, non-binding loop: discovery → explicit WhatsApp opt-in → matched consultation → grounded Q&A → one current opinion → public aggregate. Administrators must publish reviewable PDF projects without exposing participant data.

## Scope

### In Scope
- Public visitors, subscribed citizens, and protected administrators in one Next.js/Node slice under `backend/`, backed by PostgreSQL.
- Public catalog/detail pages; PDF extraction and usable-text validation; one reviewed, versioned/cached summary; publication gating.
- Normalized international WhatsApp number, selected categories, explicit consent/version, revocation, and matching campaigns using `whatsapp-web.js`.
- Fixed consultation options, idempotent delivery, Spanish direct-context Q&A, replaceable current opinions, aggregate-only results, and realtime refresh/update.

### Out of Scope
- `backendFiles/` and legacy utilities; RAG, embeddings, vector search, audio, geographic targeting, official identity/voting, sentiment analysis, citizen-created consultations, and legislative tracking.
- Any change to `docs/specs/`; this proposal clarifies scope while preserving that source of truth.

## Business Rules

- No proactive message without matching active consent. Public pages never expose phone numbers, WhatsApp identifiers, or individual opinions.
- Publication requires usable extracted text and a reviewable summary. Summary versions include source fingerprint, prompt/template version, and model configuration; Q&A never re-summarizes.
- Opinions are voluntary and non-binding. Only one current opinion per citizen/project contributes to aggregates.

## Capabilities

### New Capabilities
- `public-projects`: Published discovery, detail, disclaimers, and aggregate projections.
- `consent-subscriptions`: Normalized consent, category subscriptions, revocation, and safe matching.
- `project-publication`: Protected PDF ingestion, summary review, and publication gating.
- `whatsapp-consultations`: Campaign delivery, conversation state, and grounded Q&A.
- `citizen-opinions`: Current opinion replacement and aggregate updates.

### Modified Capabilities
- None; `openspec/specs/` has no existing capability specs.

## Approach

Extend `backend/` with domain services, Prisma models, Groq adapters, and a `whatsapp-web.js` boundary. Demonstrate one project and consultation while persisting consent, versions, delivery, and idempotency. Resolve storage, admin authentication, context limits, session recovery, realtime transport, and consent wording in specs/design. Keep `docs/specs/` unchanged.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `backend/` | Modified | Application slice and integrations. |
| `openspec/changes/participacion-ciudadana-v1/` | New | Follow-on SDD artifacts. |
| `docs/specs/` | Unchanged | Product source of truth. |

## Risks

| Risk | Level | Mitigation |
|---|---|---|
| WhatsApp/LLM failure | High | Adapters, status, bounded retries, safe fallback. |
| Privacy/consent violation | High | Protected writes, immutable consent, dispatch re-check, aggregate-only projections. |
| Context/realtime failure | Medium | Size gate; persisted aggregates with reconnect/refresh recovery. |

## Rollout and Rollback

Controlled demo: one administrator, project, and documented WhatsApp session. Disable campaigns/unpublish on failure; revert application and schema migration to the pre-change revision, retaining private audit data.

## Dependencies and Decision Gaps

- PostgreSQL, Groq, `whatsapp-web.js` session ownership, PDF extraction/storage, and administrator authentication.
- Specs/design must choose scanned-PDF policy, number protection, context budget, LLM limits, realtime transport, recovery, and consent copy.

## Success Criteria

- [ ] Visitor discovery and opted-in matching citizen flow complete through Q&A and opinion submission.
- [ ] Aggregates refresh without identifiers; revocation and non-match prevent delivery.
- [ ] `backend/` build/typecheck pass; `docs/specs/` is unchanged.
