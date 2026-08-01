# Citizen Opinions Specification

## Purpose

Define subscriptions, one current non-binding opinion per citizen/project, aggregates, and direct notifications.

## Requirements

### Requirement: Project subscriptions

The system MUST allow subscription to a published project and MUST prevent duplicate active citizen-project subscriptions. Citizens MAY unsubscribe their own subscription; administrators MAY inspect totals. Changes MUST be immediately reflected in reads.

The API MUST expose create/remove subscriptions and an administrator subscription read.

#### Scenario: Subscribe once

- GIVEN an identified citizen and a published project with no active subscription
- WHEN the citizen subscribes
- THEN one active subscription is created and `201` is returned

#### Scenario: Repeat subscription is idempotent

- GIVEN an existing active citizen-project subscription
- WHEN the citizen submits the same subscription request
- THEN the existing state is returned with `200` or `409`, with no duplicate row

### Requirement: One current opinion per citizen and project

The system MUST accept a non-binding opinion with a constrained value and bounded optional text, and MUST enforce one current opinion per citizen-project pair. An update MUST replace the current value while preserving the relationship. Opinions MUST be labeled citizen sentiment, never official votes.

The API contract MUST expose create/update current-opinion operations for an identified citizen and a public or authorized read of the current opinion.

#### Scenario: Submit and update an opinion

- GIVEN an identified citizen and a published project
- WHEN the citizen submits a valid opinion and later changes it
- THEN the first creates one current opinion and the second updates that same opinion

#### Scenario: Reject invalid opinion input

- GIVEN an unknown project, unpublished project, unsupported value, or over-limit text
- WHEN the citizen submits an opinion
- THEN the API returns `400` or `404` with a stable error code and does not change stored opinion data

### Requirement: Computed aggregate reads

The system MUST expose counts and percentages grouped by opinion value, computed from current opinion rows. Responses MUST identify project and total, handle empty data, and MUST NOT depend on persisted aggregate or snapshot tables.

The API contract MUST expose a public aggregate read for published projects and an administrator aggregate read with the same computed semantics.

#### Scenario: Read populated aggregates

- GIVEN current opinions for a published project
- WHEN a public or authorized administrator requests aggregates
- THEN deterministic counts and percentages are returned and totals match current opinions

#### Scenario: Read an empty aggregate

- GIVEN a published project with no current opinions
- WHEN aggregates are requested
- THEN the API returns `200` with zero totals and no division error

### Requirement: Direct notifications

The system MUST create a notification only for a direct project-related delivery, such as a subscription update or administrator announcement. It MUST include recipient, applicable project, status, and failure reason. The system MUST NOT require an event bus, audit log, campaign-idempotency layer, or audience snapshot.

The API contract MUST expose an administrator dispatch operation and a notification-result read; provider-specific sending MAY be delegated to the WhatsApp capability.

#### Scenario: Dispatch a subscribed-project notification

- GIVEN a subscribed citizen with a deliverable contact and an available delivery channel
- WHEN an authorized administrator requests notification dispatch for a project
- THEN one direct notification is recorded and its delivery result is visible

#### Scenario: Record an unavailable delivery

- GIVEN a recipient without a valid contact or an unavailable channel
- WHEN dispatch is requested
- THEN the notification is marked failed with a safe reason and no unsafe send is attempted

### Requirement: Validation and authorization responses

Opinion, subscription, aggregate, and notification APIs MUST return machine-readable `400`, `401`, `403`, `404`, `409`, or `503` errors as applicable. Errors MUST NOT expose credentials or stack traces.

#### Scenario: Reject unauthorized administration

- GIVEN a non-administrator requests notification dispatch or subscription reporting
- WHEN authorization is evaluated
- THEN the API returns `403` and performs no mutation
