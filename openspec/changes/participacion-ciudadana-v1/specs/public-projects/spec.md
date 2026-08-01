# Public Projects Specification

## Purpose

Define the public, non-binding project discovery and aggregate-results surface for the first vertical slice.

## Requirements

### Requirement: Published project discovery

The system MUST expose only projects that satisfy the publication gate in the public catalog and detail view. A detail view MUST show title, description, categories, source date, publication status, cached summary, consultation status, aggregate results, last-updated time, and the disclaimer that results are citizen opinions, not official legislative votes.

#### Scenario: Visitor opens a published project

- GIVEN a project is public and has an available reviewed summary
- WHEN an unauthenticated visitor opens the catalog or detail page
- THEN the project and its permitted fields are displayed without registration

#### Scenario: Draft or failed project is requested publicly

- GIVEN a project is draft, unpublished, or failed processing
- WHEN a visitor requests the catalog or detail view
- THEN the project is not disclosed as public and no source or summary is returned

### Requirement: Aggregate-only public projection

The public projection MUST contain aggregate counts, percentages, participant count, option labels, and last-updated time only. It MUST NOT contain phone numbers, WhatsApp identifiers, citizen IDs, delivery records, conversation state, or individually attributable opinions.

#### Scenario: Public results update

- GIVEN a valid current opinion is inserted or replaced
- WHEN the aggregate is recomputed
- THEN the public view exposes only the new aggregate projection and timestamp

#### Scenario: Privacy-sensitive record is queried

- GIVEN a public request attempts to select participant or delivery data
- WHEN the request is processed
- THEN the data is denied or omitted regardless of the requested project

### Requirement: Realtime results contract

The system MUST publish an aggregate-only update for each committed aggregate change. A connected client MUST be able to recover the latest persisted projection after reconnect or refresh; transport choice remains open.

#### Scenario: Connected page receives an update

- GIVEN a public project page is connected
- WHEN a valid opinion changes its aggregate
- THEN the page receives or fetches the new aggregate without personal identifiers

#### Scenario: Client reconnects

- GIVEN a client lost its realtime connection
- WHEN it reconnects or refreshes
- THEN it obtains the latest aggregate and last-updated time rather than relying on missed events

### Requirement: Vertical-slice acceptance

The release SHALL be acceptable only when a visitor can browse a published project, read its grounded summary, observe a non-binding disclaimer, and see aggregate results that change after a valid citizen opinion without exposing participant identity.

#### Scenario: End-to-end public proof

- GIVEN a published project and a valid consultation opinion
- WHEN a visitor follows discovery, detail, and results views
- THEN all required public fields render and the aggregate reflects the current opinion

### Unresolved assumptions

The exact realtime transport, cache headers, pagination, and jurisdiction-specific disclaimer wording remain design decisions. The normative privacy projection MUST NOT depend on those choices.
