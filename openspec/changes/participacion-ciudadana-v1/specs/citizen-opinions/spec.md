# Citizen Opinions Specification

## Purpose

Define voluntary non-binding opinion capture, replacement, aggregate calculation, and privacy-safe publication.

## Requirements

### Requirement: Valid opinion submission

The system MUST accept an opinion only when the citizen is resolved to a project and active consultation and the option is one of that consultation's supported values. Confirmation MUST state that the response is a citizen opinion and not an official legislative vote.

#### Scenario: Supported option received

- GIVEN an active project and consultation are known
- WHEN the citizen sends a supported interactive or text option
- THEN the system records or replaces the current opinion and confirms its non-binding nature

#### Scenario: Invalid or ambiguous option

- GIVEN the option is unsupported, ambiguous, unrelated, or the project is unresolved
- WHEN the message is handled
- THEN the bot explains accepted options or requests selection and does not change the current opinion

### Requirement: One current opinion invariant

The system MUST maintain at most one current opinion per citizen and project. A valid change while the consultation is open MUST replace the prior current value; historical changes MAY be retained privately for audit, but only the latest current value contributes to aggregates. Repeated processing of the same logical inbound event MUST be idempotent.

#### Scenario: First opinion

- GIVEN no current opinion exists for the citizen and project
- WHEN a valid option is submitted
- THEN one current opinion is created and contributes once to the aggregate

#### Scenario: Opinion replacement

- GIVEN a current opinion exists
- WHEN a different valid option is submitted while changes are allowed
- THEN the old value stops contributing, the new value contributes once, and participant count remains one

### Requirement: Aggregate projection and consistency

The system MUST expose counts, percentages, participant count, option labels, version, and last-updated time for each consultation. Aggregates MUST count only current opinions for the project and MUST exclude private identity, phone, delivery, and conversation data. A committed insert or replacement MUST produce one corresponding aggregate update event.

#### Scenario: Replacement updates results

- GIVEN a public page is displaying aggregate results
- WHEN a current opinion is replaced transactionally
- THEN counts and percentages reflect the replacement and an aggregate-only update becomes available

#### Scenario: Duplicate delivery or message

- GIVEN the same logical response is received more than once
- WHEN it is processed
- THEN it cannot create duplicate current opinions or inflate any aggregate

### Requirement: Non-binding and privacy boundary

Opinions MUST NOT be represented as official votes, mandates, sentiment scores, or legislative outcomes. Public consumers MUST receive only anonymized aggregates and MUST have no endpoint or projection for individual responses.

#### Scenario: Public result is requested

- GIVEN a visitor requests project results
- WHEN the response is generated
- THEN it contains aggregate data and the explicit non-binding disclaimer only

### Acceptance criteria

- GIVEN a matching opted-in citizen submits, changes, and repeats an option
- WHEN the portal refreshes or reconnects
- THEN exactly one current opinion is counted, the aggregate is correct, and no identifier is exposed.

### Unresolved assumptions

Whether opinion changes are allowed after consultation close, the exact percentage rounding, aggregate consistency strategy, and legal review of the disclaimer require design decisions.
