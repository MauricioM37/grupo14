# WhatsApp and Groq Bot Specification

## Purpose

Define one safe WhatsApp session, QR pairing, grounded project Q&A, and provider failures.

## Requirements

### Requirement: Singleton WhatsApp lifecycle

The system MUST expose one process-wide `whatsapp-web.js` session in exactly one of `initializing`, `qr`, `ready`, `disconnected`, or `failed`. It MUST NOT create concurrent sessions or expose credentials in status responses. An administrator MUST initialize, inspect, and stop it through protected endpoints.

The API MUST expose administrator initialization, status, QR retrieval, and stop operations, plus Q&A that never exposes the session credential.

#### Scenario: Start and observe pairing

- GIVEN an authorized administrator and no active WhatsApp session
- WHEN initialization is requested and a QR is produced
- THEN status changes from `initializing` to `qr` and the current QR is visible only to the administrator

#### Scenario: Reject a second session

- GIVEN a session is already `initializing`, `qr`, or `ready`
- WHEN another initialization request arrives
- THEN the API returns the current status with `409` or `200` and starts no second session

### Requirement: Pairing and failure visibility

The admin status surface MUST show QR availability and lifecycle states with a recovery action. A disconnect MUST stop sends until readiness returns. Provider failures MUST become `failed` without crashing the application.

#### Scenario: Recover after disconnect

- GIVEN a previously ready session becomes disconnected
- WHEN an administrator opens status and attempts a notification
- THEN status is visible as `disconnected`, the send is safely skipped, and the response explains how to reconnect

#### Scenario: Handle initialization failure

- GIVEN WhatsApp initialization fails
- WHEN the failure is observed
- THEN status becomes `failed`, no message is sent, and the API returns a retryable `503`

### Requirement: Grounded project question answering

The Q&A API MUST select one published project and build context only from its URL, summary, optional question, and content. It MUST bound selection, question, context, and output sizes; reject missing/unpublished projects; and MUST NOT use RAG, embeddings, vector databases, or hidden retrieval.

The API MUST accept an explicit project identifier and question, and return a bounded answer with project identity or a stable unavailable/validation error.

#### Scenario: Answer from direct project context

- GIVEN a published project and a bounded question
- WHEN a citizen asks the question through the API or WhatsApp flow
- THEN Groq receives the selected project context and the response identifies the project context used

#### Scenario: Handle Groq failure

- GIVEN Groq is unavailable, times out, or rejects bounded input
- WHEN Q&A is requested
- THEN the system returns a safe fallback stating that an answer is unavailable and does not fabricate legislative content

### Requirement: Notification dispatch safety

Administrator-triggered dispatch MUST target an explicit project and recipients derived from current subscriptions. WhatsApp MUST be used only when `ready`, with per-request results and a no-send fallback when readiness or recipients are absent.

The API MUST expose protected dispatch and a result containing attempted, sent, skipped, and failed counts.

#### Scenario: Send through a ready singleton

- GIVEN a ready session, a published project, and eligible subscribed recipients
- WHEN an authorized administrator dispatches a notification
- THEN each attempted direct delivery has a visible result and no unrelated recipient is targeted

#### Scenario: Use the no-send fallback

- GIVEN no ready session or no eligible recipients
- WHEN dispatch is requested
- THEN the API returns a safe no-send result and creates no provider send attempt

### Requirement: Integration API errors

Bot endpoints MUST return `400` for invalid bounded input, `401/403` for protected access, `404` for unknown projects, `409` for singleton conflicts, and `503` for unavailable providers. Responses MUST omit secrets and stack traces.

#### Scenario: Reject an unbounded question

- GIVEN a question exceeding the published input limit
- WHEN the Q&A endpoint validates it
- THEN the API returns `400` with a stable validation code and does not call Groq
