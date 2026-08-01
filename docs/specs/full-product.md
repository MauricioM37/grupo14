# Full Product Vision

## 1. Outcome

Create an accountable participation platform that lets citizens understand, discuss, follow, and express opinions about public proposals through a familiar channel, while giving institutions transparent aggregate evidence and a traceable communication record.

The full product expands beyond a WhatsApp consultation bot. It must preserve the core promise: plain language, voluntary participation, grounded information, privacy, and a visible distinction between citizen input and formal legislative decisions.

## 2. Product domains

### 2.1 Public information and discovery

- Public project catalog by topic, jurisdiction, status, and impact area.
- Plain-language text and audio summaries.
- Accessible project pages and downloadable public reports.
- Version history showing source changes and summary review.
- Search and comparison across public projects, subject to an explicit retrieval architecture decision.

### 2.2 Consent and inclusive participation

- Topic, geographic, and frequency preferences.
- Accessible text, voice, and audio-to-audio interaction.
- Clear consent renewal, revocation, and data-deletion controls.
- Language and accessibility options appropriate to the jurisdiction.
- Protection against harassment, spam, and automated abuse.

### 2.3 Grounded AI assistance

- Project-specific Q&A.
- Source citations or document sections where technically and legally appropriate.
- Safe answers when material is incomplete or ambiguous.
- Versioned prompts, models, evaluations, and human review.
- A future retrieval layer may be introduced for scale, but only after defining source authority, access control, freshness, and privacy boundaries.

### 2.4 Consultations and citizen initiatives

- Scheduled consultations with category/geographic audience matching.
- Text and voice responses.
- Citizen proposals and neighborhood problem reports.
- Support thresholds and consolidated reports for institutional review.
- Explicit separation between support, consultation opinion, petition, and official vote.

Citizen-created polls are not automatically official consultations. They require moderation, provenance, abuse protection, and a visible status.

### 2.5 Institutional transparency

- Legislative status timeline: submitted, committee, chamber, approved, rejected, enacted, or other jurisdiction-specific states.
- Public record of representatives' formal votes where an authoritative source exists.
- Notifications to citizens who opted into project follow-up.
- Audit trail for source versions, publications, campaigns, aggregation, and administrative changes.
- Public explanations of data collection, methodology, and limitations.

### 2.6 Reporting and accountability

- Public weekly/monthly impact reports.
- Press-ready aggregate infographics.
- Category, jurisdiction, and time-range dashboards.
- Exportable non-identifying datasets where lawful.
- Comparative metrics that never imply statistical representativeness without a documented methodology.

## 3. Identity and privacy model

The full product may add lightweight identity validation to limit duplicate or automated participation, but identity verification and opinion privacy must remain separate concerns:

- The system may verify eligibility without publishing identity.
- The institution must define whether a consultation requires eligibility or remains open public opinion.
- Phone numbers and identity attributes must not appear in public aggregates.
- Any DNI or government-service integration requires jurisdictional legal review, data minimization, retention limits, and an explicit threat model.
- The product must never claim that a verified phone number alone proves residency, citizenship, or legal voting authority.

## 4. Full-product requirements

- **FP-001** The platform MUST preserve immutable source and summary versions for public projects.
- **FP-002** Every proactive message MUST be traceable to consent, audience criteria, and a campaign.
- **FP-003** Every public result MUST expose its methodology, denominator, date range, and non-binding status.
- **FP-004** Follow-up notifications MUST be limited to citizens who opted into the relevant project/topic and frequency.
- **FP-005** Formal legislator votes MUST come from an authoritative institutional source and be labeled separately from citizen opinions.
- **FP-006** Geographic targeting MUST use a defined jurisdiction model and explicit consent/data policy.
- **FP-007** Voice input MUST provide transcription status, deletion/retention controls, and a text fallback.
- **FP-008** AI-generated summaries, classifications, and reports MUST be versioned and reviewable.
- **FP-009** Automated analysis MUST not be presented as a verified majority, official mandate, or neutral fact without methodology and review.
- **FP-010** Abuse controls MUST prevent repeated automated participation, campaign flooding, and unauthorized administrative actions.
- **FP-011** The platform MUST support data export, correction, consent withdrawal, and deletion workflows appropriate to applicable law.
- **FP-012** A multi-jurisdiction deployment MUST isolate authority, categories, projects, administrators, consent, and reporting boundaries.

## 5. Full-product actor model

| Actor | Additional responsibilities |
|---|---|
| Citizen | Manage identity/eligibility where required, preferences, follows, proposals, and consent. |
| Moderator | Review proposals, abusive content, questionable automated groupings, and public copy. |
| Legislative administrator | Manage authoritative projects, consultations, status updates, and formal source links. |
| Representative/public official | Review aggregate feedback and publish formal responses or votes through authoritative records. |
| Auditor | Inspect provenance, access, campaign, version, and aggregation logs. |
| Public/press | Consume public projects, methodology, results, reports, and formal status information. |

## 6. Full-product acceptance principles

- [ ] Citizens can understand what they are receiving and why.
- [ ] Citizens can participate without installing a new application.
- [ ] Every proactive message has valid consent and an explainable audience rule.
- [ ] AI answers are grounded, versioned, and honest about uncertainty.
- [ ] Public results cannot identify individual participants.
- [ ] Citizen opinion, petition support, and formal legislative votes are visibly distinct.
- [ ] Source changes and institutional status changes are traceable.
- [ ] Voice and accessibility features do not remove the complete text path.
- [ ] Reports show methodology and limitations, not only attractive percentages.
- [ ] The platform can be audited without exposing private citizen content.

## 7. Evolution path from the first version

1. Stabilize direct-context Q&A and cached summaries for one or a few projects.
2. Add project/version lifecycle and operational campaign monitoring.
3. Add aggregate dashboards and reviewed question/concern grouping.
4. Add accessibility and voice only with a complete retention and fallback design.
5. Add legislative tracking from authoritative sources.
6. Evaluate retrieval architecture when direct context no longer meets scale or latency limits.
7. Add identity, initiatives, public reports, and multi-jurisdiction support through separate reviewed increments.

## 8. Strategic risks

| Risk | Required product response |
|---|---|
| Participation is mistaken for representative public opinion | Publish selection, denominator, and limitation disclosures. |
| Institutional or political misuse | Keep source, methodology, consent, and administrative audit trails. |
| AI hallucination or framing bias | Grounding, evaluations, versioning, human review, and transparent fallback. |
| Identity data becomes a surveillance system | Minimize data, separate eligibility from opinion, restrict access, and define retention. |
| WhatsApp dependency or account restrictions | Keep a transport adapter boundary and a public portal fallback. |
| Large document/context cost | Define scale limits and make any retrieval migration an explicit product/architecture decision. |
