# Legislative Projects Specification

## Purpose

Define the relational model and workflow for publishing legislative projects and exposing public detail.

## Requirements

### Requirement: Minimal legislative relational model

The system MUST represent `Project`, `Citizen`, `Deputy`, `Party`, `Topic`, and minimal `User` identity only where authentication is required. A project MUST contain title, direct URL, summary, optional question, content, publication status, and timestamps. Project-to-deputy and project-to-topic associations MUST be many-to-many; party membership MUST be represented through deputies. The model MUST NOT require byte-level phone-encryption metadata or unsupported catalog fragments.

#### Scenario: Create a project with legislative mappings

- GIVEN an authenticated administrator and valid project, deputy, and topic data
- WHEN the administrator creates the project and associations
- THEN the project and its mappings are stored and returned with stable identifiers

#### Scenario: Reject incomplete project content

- GIVEN a create request missing a title, URL, summary, or content
- WHEN the request is validated
- THEN the API returns `400` with field-level errors and creates no project

### Requirement: Project CRUD, publication, and public reading

The system MUST provide administrator CRUD and separate publication control. Public reads MUST return only published projects with URL, summary, optional question, content, deputy names, party names, and topics. Catalog APIs MUST support deputy, party, and topic CRUD. Invalid identifiers MUST return `404`; unauthenticated or unauthorized administration MUST return `401` or `403`.

The API contract MUST include administrator `POST/GET/PATCH/DELETE` project operations, an explicit publish operation, public `GET` list/detail operations, and administrator CRUD operations for deputies, parties, and topics.

#### Scenario: Publish and browse a project

- GIVEN a valid draft project owned by an authorized administrator
- WHEN the administrator publishes it and a public client requests its detail
- THEN the response is `200` and contains the complete public project context

#### Scenario: Hide a draft from public clients

- GIVEN a draft or unpublished project
- WHEN a public client requests its detail or list
- THEN the API returns `404` and does not disclose draft content

### Requirement: Bounded migration and explicit preservation

Migration MUST be non-destructive, produce a row-level outcome for every source record, and MUST fail on ambiguity or unmapped data rather than silently dropping it. Projects MUST map to `Project`; categories to `Topic`; citizens to `Citizen`; and opinions to the opinion model. URL/source/summary values MUST map explicitly to URL, summary, or content with precedence recorded. Encrypted-phone metadata, consultations, snapshots, campaign-idempotency, event/audit records, and persisted aggregates MUST NOT become runtime layers; source rows MUST receive preserved, rejected, or intentionally-not-migrated outcomes.

#### Scenario: Preserve an ambiguous legacy row

- GIVEN a legacy record that cannot be mapped uniquely
- WHEN the bounded first-version migration runs
- THEN the record remains recoverable in the migration-preservation output, is marked unresolved, and the migration check fails

#### Scenario: Recompute derived values

- GIVEN legacy persisted aggregate or snapshot data
- WHEN the target project is migrated
- THEN the data is marked derived/not migrated and future aggregates are computed from current relational rows

### Requirement: MVP boundary and acceptance criteria

The system MUST support one project from creation through public reading without official voting, consultation, campaign idempotency, multi-session delivery, RAG, embeddings, vector search, or enterprise security abstractions. Release is acceptable only when the project is created, mapped, published, read, and traced to an explicit outcome for each applicable legacy row.

#### Scenario: Demonstrate the complete project slice

- GIVEN valid administrator credentials and catalog mappings
- WHEN one project is created, published, and read publicly
- THEN all required project context is visible and no excluded subsystem is needed

#### Scenario: Block scope expansion

- GIVEN a request to add official voting or a second project-specific workflow
- WHEN the request is evaluated against this MVP
- THEN it is rejected as out of scope without changing the project contract
