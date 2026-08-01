# WhatsApp Consultations Specification

## Purpose

Define protected consultation creation, targeted `whatsapp-web.js` delivery, idempotency, conversation recovery, and grounded Spanish Q&A.

## Requirements

### Requirement: Published-project consultation

Only an authorized administrator MAY create or start a consultation for a published project with a fixed question, supported options, opening/closing state, and non-binding disclaimer. A consultation MUST NOT alter legislative records.

#### Scenario: Campaign is created

- GIVEN the project is public and has a valid reviewed summary
- WHEN an authorized administrator creates a consultation
- THEN the consultation is persisted with its options and is eligible for audience matching

#### Scenario: Unpublished project campaign

- GIVEN the project is draft, failed, or unpublished
- WHEN a campaign is requested
- THEN creation or dispatch is denied and no recipient is contacted

### Requirement: Snapshot audience and idempotent delivery

The system MUST snapshot eligible opted-in category matches and assign each logical recipient a unique campaign/project/normalized-number idempotency key. Delivery states MUST distinguish `queued`, `sent`, `delivered` when available, `failed`, `skipped`, and `opted_out`. Bounded retries MAY use backoff but MUST NOT create duplicate logical deliveries.

#### Scenario: Matching recipient is dispatched

- GIVEN consent is active and categories overlap at dispatch time
- WHEN the campaign sends through the WhatsApp adapter
- THEN one idempotent recipient record is attempted and its delivery state is persisted

#### Scenario: Retry after adapter failure

- GIVEN an attempt failed before confirmed delivery
- WHEN a bounded retry is scheduled
- THEN the same idempotency key is reused and no second logical consultation is created

### Requirement: Safe conversation state and input fallback

The bot MUST resolve a selected project from explicit selection or non-expired conversation state. Ambiguous or expired state MUST require re-selection. It MUST accept supported interactive replies when available and text fallback options such as `1`, `2`, and `3`; invalid or unrelated input MUST leave the current opinion unchanged.

#### Scenario: Session expired

- GIVEN no active project remains in conversation state
- WHEN the citizen asks a project question or submits an option
- THEN the bot asks the citizen to identify the project again

### Requirement: Grounded Spanish direct-context Q&A

For each question, the system MUST inject only the selected project's persisted source text, cached summary, metadata, question, and grounding instructions. It MUST NOT use RAG, embeddings, vector search, or unrelated projects. The context MUST be measured against a documented maximum; oversized content MUST be rejected or narrowed with an explicit response and MUST NOT be silently truncated. Answers MUST be in clear Spanish, distinguish unsupported information, and never invent legal effects, dates, costs, eligibility, or promises.

#### Scenario: Answer is supported

- GIVEN the selected project context contains the requested fact and fits the limit
- WHEN the citizen asks in Spanish
- THEN the bot answers from that context and does not summarize again

#### Scenario: Answer is unavailable or context is oversized

- GIVEN the source does not support the answer or the context exceeds the configured limit
- WHEN the citizen asks the question
- THEN the bot states the limitation or requests a narrower project/section without fabricating or silently truncating critical text

### Requirement: Safe integration fallback

WhatsApp or LLM unavailability MUST produce a persisted pending/failed state and an administrator-visible error. The citizen MUST receive only a safe fallback, such as the cached summary or temporary-unavailability notice; the system MUST NOT fabricate an answer or imply successful delivery when unconfirmed.

#### Scenario: LLM provider is unavailable

- GIVEN a citizen asks a grounded question while the LLM provider is unavailable
- WHEN the request fails or times out
- THEN the bot returns the cached summary or a temporary-unavailability notice, records the failure, and does not invent an answer

### Unresolved assumptions

WhatsApp session ownership, authentication/recovery, provider limits, retry timing, exact context unit and maximum, LLM retention, and fallback wording remain design decisions.
