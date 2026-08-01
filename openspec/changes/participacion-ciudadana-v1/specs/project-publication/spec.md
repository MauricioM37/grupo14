# Project Publication Specification

## Purpose

Define protected PDF ingestion, usable-text validation, one-time versioned summary generation, review, and publication gating.

## Requirements

### Requirement: Protected project authoring

Only an authenticated administrator with project-management permission MAY create metadata, assign at least one active category, upload a PDF, process it, review a summary, publish, or unpublish a project. Public and citizen actors MUST NOT perform these actions.

#### Scenario: Administrator saves a draft

- GIVEN an authorized administrator supplies valid metadata, categories, and a PDF
- WHEN the project is saved
- THEN it remains unpublished until extraction and summary requirements pass

#### Scenario: Unauthorized write

- GIVEN a visitor or citizen lacks administrator permission
- WHEN they attempt an authoring or publication action
- THEN the action is denied and no project state changes

### Requirement: Usable source extraction

The system MUST persist normalized extracted text and a source fingerprint for each uploaded PDF. Publication MUST be blocked unless extraction succeeds and the text meets a documented usable-content threshold. Failed extraction MUST preserve an actionable error and keep the project private.

#### Scenario: Text PDF is processed

- GIVEN a PDF produces usable normalized text
- WHEN processing completes
- THEN the source status is usable and its fingerprint is persisted

#### Scenario: Scanned or empty PDF

- GIVEN extraction produces no usable text or exceeds the configured validation rule
- WHEN processing completes
- THEN publication remains blocked and an actionable processing status is visible to the administrator

### Requirement: Versioned summary cache

The system MUST generate and persist a clear-language summary once per source fingerprint, prompt/template version, and model-configuration identifier. The cache MUST be reusable by public pages and WhatsApp consultation flows; inbound Q&A MUST NOT invoke summarization. A changed source, prompt version, or relevant model configuration MUST invalidate publication eligibility for the prior summary and require a new generation.

#### Scenario: Repeated reads reuse the cache

- GIVEN the source fingerprint and summary inputs are unchanged
- WHEN a page or message requests the summary repeatedly
- THEN the persisted summary is reused without a new summarization call

#### Scenario: Source changes

- GIVEN a replacement PDF produces a different fingerprint
- WHEN the project is processed
- THEN the previous summary is not sufficient for publication and a new version is required

### Requirement: Reviewable publication gate

A project MUST become public only when usable source text and an available administrator-reviewed summary exist. A failed or unavailable LLM operation MUST keep the project unpublished and MUST NOT fabricate a summary.

#### Scenario: Review and publish

- GIVEN source validation passed and the summary is available for review
- WHEN an authorized administrator approves and publishes it
- THEN it becomes eligible for public discovery and matching campaigns

### Unresolved assumptions

PDF storage, scanned-PDF policy, exact usable-text threshold, administrator authentication, LLM provider/model, timeout, budget, retention, and review UI remain design decisions. No production capability is implied by leaving them open.
