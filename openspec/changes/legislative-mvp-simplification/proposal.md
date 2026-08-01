# Proposal: Legislative MVP Simplification

## Intent

Replace the over-engineered `participacion-ciudadana-v1` direction with a legislative product: admin upload, public reading, one non-binding opinion, and grounded WhatsApp Q&A. Its exploration, proposal, design, specs, and tasks are inspected context but superseded, not authoritative.

## Scope

### In Scope
- Schema: `Citizen`, `Project`, `Deputy`, `Party`, `Topic/Category`, `Subscription`, `Opinion`, `Notification`, and minimal `User/auth` if needed.
- Admin upload → public URL/summary/content → one opinion per citizen/project → aggregates and notifications.
- Admin QR page, one `whatsapp-web.js` session with `initializing/qr/ready/disconnected/failed`, and Groq context from project URL, summary, optional question, and content.
- UI with generated logo, attractive header/footer, clear failures, and `https://wa.me/3795566267`.

### Out of Scope
- Destructive migration, data deletion, or edits to `docs/specs/` and `backend/test-results/`.
- RAG, embeddings, vector databases, multi-session WhatsApp, campaign idempotency, byte-level phone-encryption metadata, audience snapshots, excessive audit/event/source-summary tables, consultation complexity, persisted aggregates, catalog fragmentation, official voting, or enterprise security abstractions.

## Capabilities

### New Capabilities
- `legislative-projects`: projects, publication, public detail, and deputy/party/topic mapping.
- `citizen-opinions`: subscriptions, current opinion, and aggregates.
- `whatsapp-groq-bot`: singleton QR lifecycle, project Q&A, notifications, failures.
- `legislative-ui`: readable public/admin surfaces and visual system.

### Modified Capabilities
- None; existing change artifacts are superseded planning context, not current capability authority.

## Approach

Add a migration and endpoints around `Project.url`, `summary`, optional `question`, and content. Explicitly map old projects/categories/citizens/opinions; preserve ambiguous/unmapped rows and fail checks rather than drop data. Use join tables only for project-to-many deputy/topic relations. Admin-triggered QR pairing is singleton-scoped; failures expose status, stop unsafe sends, and return fallbacks. Group aggregates with ORM/SQL.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `backend/prisma/`, `backend/src/` | Modified | Schema, routes, integrations, services, pages. |
| `openspec/changes/legislative-mvp-simplification/` | New | SDD artifacts. |
| `docs/specs/`, `backend/test-results/` | Unchanged | Protected. |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Mapping loses meaning | Med | Preflight report, preservation path, no destructive migration. |
| WhatsApp/Groq unavailable | High | Visible status, bounded retry, safe no-send/no-answer state. |
| MVP grows | Med | Enforce named non-goals and one-session/one-opinion limits. |

## Rollback Plan

Disable publishing, notifications, and bot initialization; restore the prior revision, retaining migration/preservation records. Re-enable the prior runtime only if compatible.

## Dependencies

- PostgreSQL, Prisma, Groq, and persistent Node runtime for one `whatsapp-web.js` session.

## Success Criteria

- [ ] One project can be uploaded, published, browsed, questioned through Groq, and rated once per citizen/project.
- [ ] QR pairing and disconnected/provider failures are visible and safe.
- [ ] Existing records have an explicit mapping or preservation outcome; no silent loss occurs.
- [ ] UI is readable, polished, lightweight, and includes the requested logo/header/footer/link.
