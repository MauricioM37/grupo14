# First Functional Version

## 1. Outcome

Prove one complete public-participation loop:

> Public project browsing → phone/topic subscription → PDF ingestion → one-time LLM summary → targeted WhatsApp consultation → grounded AI questions → citizen opinion → public real-time results.

The release is successful when a person can discover a published project, subscribe to its category, receive a WhatsApp message, ask about the project, submit an opinion, and see the aggregate score update on the public portal.

## 2. Scope

### In scope

- Public project catalog and public project detail pages.
- Citizen registration by WhatsApp number.
- Topic/category selection and explicit messaging opt-in.
- Minimal administrator workflow for PDF upload, metadata, categorization, and publication.
- PDF text extraction and one-time LLM summary generation.
- Persistent summary cache with source and prompt versioning.
- WhatsApp delivery through an adapter based on `whatsapp-web.js`.
- Targeted consultation campaigns for matching subscribers.
- AI questions about a selected project using directly injected project context.
- Opinion submission through WhatsApp.
- One current opinion per citizen and project.
- Aggregated scores and real-time portal updates.

### Out of scope

- Official voting, electoral authentication, or legally binding consultation.
- DNI validation or proof of residency.
- RAG, embeddings, vector databases, or semantic search.
- Audio messages, transcription, text-to-speech, and audio summaries.
- Geographic targeting beyond the category model.
- Citizen-created consultations.
- Legislative status tracking and legislator voting records.
- Advanced sentiment analysis, press reports, and citizen initiatives.
- A native mobile application.

## 3. Actors and permissions

| Actor | Allowed actions |
|---|---|
| Public visitor | Browse published projects, categories, summaries, and aggregate results. No registration required. |
| Subscribed citizen | All public actions; manage number/topic consent; receive matching messages; ask questions; submit or change an opinion. |
| Administrator | Create project metadata, upload PDFs, assign categories, process summaries, publish/unpublish projects, start consultations, inspect aggregate results and delivery status. |
| LLM provider | Receive only the project context and prompt needed for the requested operation; never receives an authority to publish or send messages. |

## 4. User journeys

### 4.1 Public discovery

1. Visitor opens the portal.
2. Portal lists published projects with title, category, status, and short summary.
3. Visitor opens a project page.
4. Page shows the source metadata, clear-language summary, consultation status, aggregate opinions, and disclaimer: “Estos resultados expresan opiniones ciudadanas y no constituyen una votación legislativa oficial.”

### 4.2 Subscription

1. Citizen enters a WhatsApp number.
2. Citizen selects one or more categories.
3. Portal explains the message purpose, expected frequency, privacy treatment, and opt-out mechanism.
4. Citizen explicitly accepts.
5. System stores the subscription and an immutable consent event.
6. The system optionally sends a confirmation message through WhatsApp.

The first version may use a simple confirmation flow, but it must not silently subscribe a number merely because it was entered in a form.

### 4.3 Project publication

1. Administrator creates project metadata and assigns categories.
2. Administrator uploads a PDF.
3. System extracts text and validates that usable content exists.
4. LLM generates the summary once.
5. System persists the source fingerprint, summary, prompt version, and processing status.
6. Administrator reviews the summary and publishes the project.
7. The project becomes visible publicly and eligible for matching consultation campaigns.

### 4.4 Targeted consultation

1. Administrator creates a consultation for a published project.
2. System snapshots opted-in subscribers whose categories match the project.
3. System sends a message such as:

   > “¿Qué opinás del proyecto ‘[título]’? Respondé 1 para A favor, 2 para En contra o 3 para Necesito más información. Tu respuesta es una opinión ciudadana y no un voto legislativo oficial.”

4. Delivery status is stored per recipient.
5. A citizen's valid response updates the aggregate score.
6. The portal pushes the new aggregate to connected viewers.

### 4.5 Questions about a project

1. Citizen replies to a project message or selects a project from the bot's available list.
2. Bot marks that project as active for the conversation.
3. Citizen asks a question.
4. Bot injects the stored project text, cached summary, metadata, and conversation-safe instructions directly into the LLM context.
5. Bot replies in clear Spanish and identifies uncertainty when the PDF does not contain the answer.

If several projects could match a question, the bot asks the citizen to choose a project instead of guessing.

### 4.6 Opinion update

1. Citizen replies with a supported option.
2. System resolves the number to the citizen record and the active consultation/project.
3. The current opinion for that citizen/project is inserted or replaced.
4. Historical changes may be retained privately for audit, but only the current opinion contributes to public scores.
5. The bot confirms the recorded opinion and provides an opt-out/help option.

## 5. Functional requirements

### Portal and projects

- **FV-001** The portal MUST show only projects with public status in the public catalog.
- **FV-002** Each public project MUST show title, description, categories, source date, publication status, cached summary, consultation status, aggregate results, last-updated timestamp, and the non-binding-opinion disclaimer.
- **FV-003** The public project page MUST NOT show phone numbers, WhatsApp identifiers, or individually attributable opinions.
- **FV-004** A visitor MUST be able to browse and read projects without registration.
- **FV-005** An administrator MUST be able to upload a PDF, enter metadata, assign at least one category, and save the project as draft.
- **FV-006** An administrator MUST be able to publish only a project with valid extracted text and an available summary.
- **FV-007** A failed extraction or summary operation MUST leave the project unpublished and show an actionable processing error.

### Subscription and consent

- **FV-010** The portal MUST accept a normalized WhatsApp number in international format.
- **FV-011** A citizen MUST select at least one category before subscribing.
- **FV-012** The portal MUST record explicit opt-in, timestamp, selected categories, consent text version, and source of consent.
- **FV-013** A citizen MUST be able to remove all or selected categories and opt out of future consultations.
- **FV-014** A number MUST NOT receive a targeted consultation when consent is absent, revoked, or the category does not match.
- **FV-015** The system SHOULD confirm a subscription without revealing whether another person already uses the number.

### AI summary and Q&A

- **FV-020** The system MUST extract and persist the normalized source text for each PDF.
- **FV-021** The system MUST generate a clear-language summary once per source/prompt/model version.
- **FV-022** The summary cache MUST be reusable by portal pages and WhatsApp messages.
- **FV-023** A source fingerprint MUST identify whether the uploaded document changed.
- **FV-024** A prompt/template version and model configuration identifier MUST be stored with each generated summary.
- **FV-025** The system MUST NOT call the summarization LLM for every inbound message.
- **FV-026** Q&A MUST use direct context injection, not RAG or vector retrieval, in this release.
- **FV-027** The active Q&A context MUST include the selected project's source text, cached summary, metadata, and grounding instructions, subject to a documented context-size limit.
- **FV-028** The bot MUST refuse or qualify an answer when the source text does not support it.
- **FV-029** The bot MUST never invent a legal effect, date, cost, eligibility rule, or promise absent from the project material.

### WhatsApp consultation and opinions

- **FV-030** An administrator MUST be able to create a consultation for one published project.
- **FV-031** The campaign audience MUST be calculated from the category subscription snapshot and valid opt-in state.
- **FV-032** Each recipient MUST have an idempotency key for the campaign/project/phone combination.
- **FV-033** Delivery status MUST distinguish queued, sent, delivered when available, failed, skipped, and opted out.
- **FV-034** Failed deliveries MAY retry with bounded attempts and backoff; retries MUST NOT duplicate the logical consultation.
- **FV-035** The bot MUST accept both interactive replies when supported and a text fallback such as `1`, `2`, or `3`.
- **FV-036** A valid opinion MUST be linked to a project, consultation, citizen/number, option, and timestamp.
- **FV-037** The system MUST maintain at most one current opinion per citizen and project.
- **FV-038** The first release SHOULD allow a citizen to change their opinion while the consultation is open; the latest valid response replaces the current score contribution.
- **FV-039** The bot MUST confirm that the response is an opinion and not an official legislative vote.
- **FV-040** Invalid, ambiguous, or unrelated replies MUST receive a help message without changing the opinion.

### Real-time results

- **FV-050** The portal MUST expose aggregate counts and percentages for each consultation option.
- **FV-051** The aggregate MUST count only one current opinion per citizen/project.
- **FV-052** A valid insert or replacement MUST trigger an update event for open public project pages.
- **FV-053** The portal MUST display a last-updated timestamp and a participant count.
- **FV-054** A disconnected client MUST recover the latest aggregate when it reconnects or refreshes.
- **FV-055** Real-time updates MUST contain aggregate data only, never personal identifiers.

## 6. Domain model

| Entity | Required fields |
|---|---|
| `Citizen` | Internal ID, normalized number, encrypted number, created time, status. |
| `ConsentEvent` | Citizen ID, consent type, categories, text version, timestamp, source, revoked time if applicable. |
| `Category` | ID, name, public description, active status. |
| `Subscription` | Citizen ID, category ID, active status, subscribed time, revoked time. |
| `Project` | ID, title, description, categories, source status, publication status, consultation status, timestamps. |
| `ProjectSource` | Project ID, original filename, storage reference, content fingerprint, extracted text, extraction status. |
| `Summary` | Project ID, summary text, source fingerprint, prompt version, model configuration, generated time, review status. |
| `Consultation` | Project ID, question, options, open/close times, status, disclaimer text version. |
| `CampaignRecipient` | Consultation ID, citizen ID, audience snapshot ID, idempotency key, delivery status, retry count, timestamps. |
| `Opinion` | Consultation ID, project ID, citizen ID, option, current flag, submitted time, replaced time. |
| `AggregateResult` | Consultation ID, counts, percentages, participant count, last-updated time, version. |
| `ConversationState` | WhatsApp number/citizen ID, active project ID, active consultation ID, last interaction, state, expiry. |

## 7. Business rules and invariants

1. A project cannot be public without usable source text and an approved/available cached summary.
2. A project may have multiple categories; a citizen matches if at least one active category overlaps.
3. Opt-in is required before any proactive consultation message.
4. A consultation never changes legislative records.
5. Public results are aggregated and non-identifying.
6. A citizen may have one current opinion per project. If changing opinions is enabled, the old value stops contributing.
7. A changed PDF creates a new source fingerprint and invalidates the previous summary for publication purposes.
8. Changing the summary prompt version or relevant model configuration requires a new summary generation.
9. A Q&A message cannot change project metadata, publish a project, or send a campaign.
10. A campaign retry must be safe to repeat and must not create duplicate opinions or duplicate logical recipients.

## 8. WhatsApp states and failure handling

| State | Expected behavior |
|---|---|
| Unknown number | Explain the portal subscription flow; do not assume consent. |
| Subscribed/no active project | Offer project categories or a public-portal link. |
| Active project | Answer project questions and offer consultation actions. |
| Ambiguous project | Ask the citizen to select one project. |
| Unsupported option | Explain accepted options and leave the current opinion unchanged. |
| Session expired | Ask the citizen to identify the project again. |
| WhatsApp unavailable | Keep campaign status pending/failed, retry within limits, and expose an admin error. |
| LLM unavailable | Send a safe fallback: the cached summary or a temporary-unavailability message; never fabricate an answer. |
| Oversized context | Ask the citizen to narrow to one project/section and log the event; do not silently truncate critical content. |
| Opt-out request | Revoke future proactive delivery and confirm the change. |

## 9. Direct-context AI contract

The first version uses deterministic context assembly:

1. Resolve the active project from conversation state or an explicit project selection.
2. Load that project's persisted source text and cached summary.
3. Add project metadata and the current user question.
4. Add instructions to answer only from the supplied material, distinguish the text from inference, and state when the answer is unavailable.
5. Exclude unrelated projects from the context unless the citizen explicitly asks for a project list.

The implementation MUST measure context size and define a maximum supported PDF size. It MUST document the behavior for documents that exceed that limit. The first release may reject, request a smaller source, or use an administrator-created shortened source; it may not silently add RAG.

## 10. Acceptance checklist

- [ ] A visitor can browse a published project without registration.
- [ ] A citizen can subscribe with a number, choose categories, and explicitly opt in.
- [ ] An administrator can upload, categorize, process, and publish a PDF project.
- [ ] The summary is generated once and reused after page refreshes and repeated messages.
- [ ] A matching subscriber receives a consultation through WhatsApp.
- [ ] A non-matching or opted-out number does not receive that consultation.
- [ ] The citizen can ask a project question and receives a grounded answer or a transparent fallback.
- [ ] A citizen can submit an opinion through interactive or text fallback input.
- [ ] Duplicate submissions do not create duplicate current opinions.
- [ ] Public scores update without exposing personal information.
- [ ] The public page clearly labels the result as a citizen opinion.

## 11. Open decisions for implementation

- WhatsApp session/authentication and operational account ownership.
- Exact PDF extraction library and handling of scanned PDFs.
- LLM provider, model, timeout, budget, and data-retention policy.
- Exact real-time transport (SSE, WebSocket, or short polling).
- Administrator authentication mechanism.
- Consent wording and legal review for the target jurisdiction.
- Maximum PDF size and maximum direct-context token budget.
