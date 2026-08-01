# Expanded MVP

## 1. Outcome

Turn the first functional slice into a credible hackathon product that a public-sector team can operate: multiple projects, reliable consultations, visible metrics, and understandable citizen concerns without pretending that the results are official legislative votes.

The first functional version remains the release gate. Every feature in this document is additive and must not weaken its consent, grounding, privacy, or non-binding-opinion rules.

## 2. Scope

### In scope

- Multiple published projects and reusable categories.
- Basic administrator/state dashboard.
- Project lifecycle: draft, processing, review, published, closed, archived.
- Consultation scheduling and delivery monitoring.
- Aggregate dashboards by project and category.
- Frequently asked question clustering from grounded conversations.
- Basic concern/topic grouping for open text.
- Delivery and participation health metrics.
- Better subscription management and preference center.
- Accessibility preparation and optional audio as a controlled enhancement.

### Still out of scope

- Official identity or voter authentication.
- Binding voting.
- Citizen-created polls.
- Full geographic targeting and jurisdiction federation.
- Legislator voting records and end-to-end legislative tracking.
- Automatic policy recommendations based on sentiment.
- Public individual-level data.

## 3. Expanded capabilities

### 3.1 State dashboard

Administrators can see:

- Published and active projects.
- Subscribers per category.
- Campaign audience size and delivery rate.
- Participation rate.
- Current opinion distribution.
- Most common grounded questions.
- Topics in open responses, clearly labeled as automated grouping.
- Data freshness and processing failures.

Every metric must expose its time range, population, and definition. A dashboard must not imply that a self-selected WhatsApp audience represents the whole population.

### 3.2 Project lifecycle

Projects move through explicit states:

`draft → processing → review → published → consultation-open → consultation-closed → archived`

Invalid transitions are rejected. A source change after publication requires an explicit reprocessing/review step and a visible version change.

### 3.3 Consultation operations

Administrators can:

- Schedule or manually start a campaign.
- Preview the target audience count.
- Cancel before dispatch.
- Pause bounded delivery after repeated failures.
- See delivery statuses and retry only failed recipients.
- Close a consultation and freeze its public result.

The audience remains category-based and opt-in. Any future geographic filter must be an explicit separate consent and data policy decision.

### 3.4 Open response analysis

Citizens may send a short text explanation after choosing an opinion. The system may group similar questions or concerns, but:

- Raw responses remain private.
- The grouping is marked as AI-generated.
- Groupings are not treated as verified facts or majority views.
- Administrators can inspect representative anonymized examples where legally permitted.
- The original project context remains available for interpreting questions.

### 3.5 Accessibility enhancement

The MVP may add audio summaries or receive voice messages only if consent, storage, transcription failure, and deletion behavior are specified. Audio is not required for the first demo. Text remains the complete fallback path.

## 4. Additional requirements

- **MVP-001** The administrator dashboard MUST distinguish participation metrics from population statistics.
- **MVP-002** The system MUST show the denominator and calculation period for every percentage.
- **MVP-003** A consultation MUST support open and close timestamps.
- **MVP-004** A closed consultation MUST stop accepting new opinions or visibly mark late responses according to a documented policy.
- **MVP-005** Administrators MUST be able to preview audience size before dispatch.
- **MVP-006** Delivery retries MUST be bounded and observable.
- **MVP-007** Project source and summary versions MUST be visible to administrators.
- **MVP-008** Reprocessing a changed project MUST invalidate dependent cached answers and require summary review.
- **MVP-009** The public page MUST show whether results are live or frozen.
- **MVP-010** The system MUST export an aggregate, non-identifying project report for internal review.
- **MVP-011** AI-generated question/concern groups MUST include a confidence or “needs review” state.
- **MVP-012** The system MUST allow a citizen to view and change topic subscriptions without changing unrelated consent.
- **MVP-013** The system MUST support a clear global opt-out command such as `BAJA` or `STOP`.
- **MVP-014** Any audio feature MUST preserve a complete text-only user journey.

## 5. Expanded data needs

Additions to the first-version entities:

- `ProjectVersion`: source fingerprint, summary version, reviewer, review timestamp.
- `ConsultationSchedule`: planned time, timezone, dispatch policy, status.
- `AudienceSnapshot`: category criteria, consent cutoff, recipient count, creation time.
- `DeliveryAttempt`: attempt number, provider status, error class, timestamp.
- `QuestionGroup`: project ID, label, source count, confidence, review status.
- `ConcernGroup`: project ID, label, source count, confidence, review status.
- `MetricDefinition`: metric name, formula, denominator, time window, visibility.

## 6. MVP acceptance checklist

- [ ] An administrator can manage more than one project and category.
- [ ] Project processing and publication states are visible.
- [ ] A campaign can be previewed, dispatched, monitored, retried, and closed.
- [ ] The dashboard explains every percentage and denominator.
- [ ] Public scores remain aggregate-only and are updated while a consultation is open.
- [ ] Questions and concerns are grouped without exposing personal data.
- [ ] A source change creates a new summary version and prevents stale answers.
- [ ] Opt-out and per-category preference changes work independently.
- [ ] Audio, if enabled, has a text fallback and a documented retention policy.

## 7. Risks and mitigation

| Risk | Mitigation |
|---|---|
| Self-selected audience is mistaken for public opinion | Show participation base, selection bias disclaimer, and denominator. |
| Direct context becomes too large | Enforce project/document limits; keep project selection deterministic; plan retrieval only as a future decision. |
| WhatsApp delivery is unreliable | Use an adapter, idempotent campaigns, bounded retries, and visible provider errors. |
| AI grouping creates misleading narratives | Mark as automated, show counts/confidence, keep human review, never call it a referendum. |
| Summary becomes stale | Version source, prompt, and model configuration; block publication after invalidation. |

## 8. Migration notes

The MVP must preserve the first-version identifiers and opinion semantics. Adding a dashboard, audio, or analysis module must not require exposing phone numbers or rewriting historical aggregate results. Any future RAG introduction requires an explicit architecture and privacy review; it is not an automatic optimization for this scope.
