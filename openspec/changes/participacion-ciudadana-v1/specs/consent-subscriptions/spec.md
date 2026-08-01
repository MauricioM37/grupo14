# Consent and Subscriptions Specification

## Purpose

Define validated phone/category subscriptions, explicit messaging consent, revocation, and privacy-safe campaign eligibility.

## Requirements

### Requirement: Normalized subscription identity

The system MUST accept a WhatsApp number only after validating and normalizing it to one canonical international representation. It MUST require at least one active category and MUST prevent malformed or empty submissions from creating a subscription.

#### Scenario: Valid subscription request

- GIVEN a syntactically valid international number and at least one active category
- WHEN the citizen explicitly accepts the displayed consent text
- THEN the system creates or updates the subscription and records its consent event

#### Scenario: Invalid or incomplete request

- GIVEN an invalid number, inactive category, or no selected category
- WHEN the citizen submits the form
- THEN the request is rejected with actionable validation and no consent is recorded

### Requirement: Explicit, versioned opt-in

The system MUST record an immutable opt-in event containing the normalized citizen reference, selected categories, timestamp, consent-text version, and consent source. Entering a number, selecting a category, or visiting a page MUST NOT constitute consent. Consent wording MUST explain purpose, expected frequency, privacy treatment, and opt-out behavior.

#### Scenario: Consent is granted

- GIVEN the citizen has reviewed the current consent text
- WHEN the citizen performs an explicit opt-in action
- THEN the event is persisted with the exact text version and selected categories

#### Scenario: Consent version changes

- GIVEN a citizen previously opted in under an older text version
- WHEN a new consent text is required
- THEN the system MUST NOT silently treat the old event as acceptance of the new text

### Requirement: Revocation and matching invariant

The system MUST support removing selected categories or all future messaging. A campaign recipient MUST be eligible only if consent is currently active and at least one active category overlaps the project categories. Eligibility MUST be rechecked immediately before dispatch.

#### Scenario: Citizen revokes before dispatch

- GIVEN a recipient matched the audience snapshot but revoked consent afterward
- WHEN dispatch evaluates the recipient
- THEN no proactive message is sent and the delivery state is `opted_out` or `skipped`

#### Scenario: Non-matching category

- GIVEN consent is active but no category overlaps the project
- WHEN a campaign audience is calculated
- THEN the number is excluded and no delivery record is treated as sendable

### Requirement: Privacy-safe account handling

Public responses MUST NOT reveal whether a number is registered, subscribed, revoked, or associated with another person. Internal access to number data MUST be limited to authorized operational flows; the protection and key-management mechanism remains unresolved.

#### Scenario: Unknown number asks for help

- GIVEN an inbound number has no known subscription
- WHEN the bot handles the message
- THEN it explains the subscription flow without confirming account existence

### Unresolved assumptions

Administrator authentication, consent legal review, number encryption or hashing, retention, and the exact opt-out commands require design and jurisdictional approval; this specification does not invent those capabilities.
