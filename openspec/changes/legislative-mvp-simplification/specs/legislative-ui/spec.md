# Legislative UI Specification

## Purpose

Define lightweight public and administrator surfaces that make the legislative MVP readable, responsive, and operationally transparent.

## Requirements

### Requirement: Public legislative surface

The public UI MUST provide a project list and detail view for published projects, showing title, direct URL, summary, optional question, content, deputy/party mappings, topics, opinion controls, aggregate results, and subscription state. It MUST identify opinions as non-binding citizen sentiment and MUST include a WhatsApp contact link to `https://wa.me/3795566267`.

#### Scenario: Read a published project

- GIVEN a public visitor opens a published project
- WHEN the detail surface loads
- THEN the required legislative context, opinion action, and WhatsApp link are visible and usable

#### Scenario: Keep drafts private

- GIVEN a visitor requests a draft or unavailable project
- WHEN the page resolves the project
- THEN the UI shows a not-found state without draft content or admin controls

### Requirement: Administrator operations surface

The admin UI MUST provide project CRUD and publish controls, deputy/party/topic administration, subscription/opinion aggregate reads, notification dispatch controls, and a QR/status panel. Protected operations MUST show unauthorized and forbidden states rather than rendering controls that cannot succeed.

#### Scenario: Operate a project and pairing panel

- GIVEN an authorized administrator
- WHEN the admin dashboard loads
- THEN project controls, aggregate reads, notification actions, and the current WhatsApp lifecycle state are visible

#### Scenario: Hide protected controls

- GIVEN an unauthenticated or unauthorized visitor
- WHEN the admin route is opened
- THEN the UI shows an access state and does not expose operational data or QR content

### Requirement: Visual system and responsive behavior

The UI SHOULD use a distinctive generated-logo treatment, an attractive editorial header and footer, semantic color tokens, readable display/body typography, and restrained motion. It MUST remain usable at mobile and desktop widths, preserve keyboard focus, and avoid presenting an unstyled generic dashboard.

#### Scenario: Render the generated brand treatment

- GIVEN any public or admin page
- WHEN the page renders
- THEN the generated logo, header navigation, footer, and primary action hierarchy are consistent and recognizable

#### Scenario: Adapt to a narrow viewport

- GIVEN a mobile-width viewport
- WHEN a project detail or QR panel renders
- THEN content remains readable, controls remain reachable, and no horizontal overflow hides status or actions

### Requirement: Explicit loading, empty, and failure states

Every data-driven surface MUST represent loading, empty, provider failure, validation failure, unauthorized, and forbidden states with actionable copy. Retry actions MUST be bounded and MUST NOT duplicate mutations or sends.

#### Scenario: Show provider failure safely

- GIVEN WhatsApp or Groq returns an unavailable response
- WHEN the corresponding public or admin surface updates
- THEN the UI explains the unavailable capability, preserves the rest of the page, and offers a safe retry or fallback

#### Scenario: Show an empty project aggregate

- GIVEN a published project has no opinions or subscriptions
- WHEN its detail page loads
- THEN the UI shows an explicit empty state instead of a broken chart or misleading percentage

### Requirement: MVP acceptance and non-goals

The UI MUST support the single demonstrable flow: create, publish, browse, subscribe, express one opinion, read aggregates, inspect QR status, and use direct WhatsApp contact. It MUST NOT add official voting, multi-session WhatsApp management, campaign workflows, RAG/vector UI, or enterprise administration.

#### Scenario: Complete the public flow

- GIVEN one published project and a responsive browser
- WHEN a visitor reads, subscribes, submits one opinion, and opens WhatsApp contact
- THEN each state is understandable and no excluded feature is required
