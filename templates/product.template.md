# Product: [Product Name]

> Status: Draft | In review | Approved | Shipped
> Owner: [Name or role]
> Last updated: YYYY-MM-DD
> Reviewers: [Names or roles]

**Build Like This note:** write this before architecture or implementation. The
purpose is not to complete every section; it is to expose weak product
assumptions while they are still cheap to change. Delete irrelevant sections
instead of filling them with invented certainty.

## Before you begin

Write what you know, label what you believe, and attach a validation method to
the difference. AI can help organize evidence and challenge the document. It
cannot provide evidence that no user supplied.

## Executive summary

[In two or three sentences, state the primary user, their problem, and the outcome this product will provide.]

## Vision

[Describe the durable future this product should help create. Avoid a list of features.]

## Problem

### Current situation

[Describe the workflow or condition today.]

### Evidence

- [Interview, observation, support request, market signal, or usage data]
- [Evidence source and date]

### Cost of the problem

[Explain frequency, severity, time, money, risk, or missed opportunity.]

### Existing alternatives

| Alternative | What works | Where it fails for the target user |
| --- | --- | --- |
| [Current method/product] | [Strength] | [Gap] |

## Target users

### Primary segment

[A narrow, reachable group with a shared problem and context.]

### Secondary actors

| Actor | Relationship to the product | Need or constraint |
| --- | --- | --- |
| [Buyer/admin/affected party] | [Role] | [Need] |

### Explicitly excluded for this release

- [User segment the first release will not serve and why]

## User personas

### [Persona name: role, not fictional biography]

- **Job to be done:** When [situation], I want to [motivation], so I can [outcome].
- **Current workaround:** [How the job is completed now]
- **Pain:** [Specific friction or risk]
- **Constraints:** [Access, skill, time, budget, policy]
- **Success:** [What a good result looks like]

## User needs

| ID | Need | Evidence | Importance | Confidence |
| --- | --- | --- | --- | --- |
| N1 | [User needs to…] | [Source] | Must | High/Medium/Low |

## Product principles

- [A product-specific rule that guides trade-offs]
- [Example: A user must understand why an automated action occurred.]

## Scope and features

### First release

| ID | Capability and user outcome | Need | Acceptance summary | Priority |
| --- | --- | --- | --- | --- |
| F1 | [The user can… so that…] | N1 | [Observable behavior] | Must/Should/Could |

### Later candidates

- [Capability that is valuable but not required to validate the first release]

### Non-goals

- [Something this release deliberately will not solve]

## Core user journey

1. [User context and entry]
2. [Important action]
3. [System response]
4. [User obtains value]

### Important alternate and failure journeys

- [Empty state]
- [Invalid input or denied permission]
- [External service failure and recovery]

## Goals

| Goal | Baseline | Target | Deadline |
| --- | --- | --- | --- |
| [Desired user or business outcome] | [Current value] | [Target value] | [Date/window] |

## Success metrics

### Primary outcome

| Metric | Definition/formula | Data source | Baseline | Target | Window |
| --- | --- | --- | --- | --- | --- |
| [Metric] | [Exact calculation] | [Event/table/tool] | [Value] | [Value] | [Period] |

### Guardrails

| Metric | Why it matters | Maximum/minimum acceptable value |
| --- | --- | --- |
| [Error, cost, complaint, safety, or quality measure] | [Risk controlled] | [Threshold] |

## Constraints

- **Timeline:** [Constraint]
- **Budget:** [Constraint]
- **Regions/languages:** [Constraint]
- **Accessibility:** [Target, e.g. WCAG 2.2 AA]
- **Privacy/compliance:** [Constraint]
- **Performance/reliability:** [User-visible requirement]

## Assumptions and validation

| Assumption | Confidence | Risk if wrong | Validation method | Owner | Due date |
| --- | --- | --- | --- | --- | --- |
| [Hypothesis] | H/M/L | [Impact] | [Interview/prototype/experiment] | [Role] | [Date] |

## Dependencies

- [People, policy, data, vendor, or platform dependency]

## Risks

| Risk | Likelihood | Impact | Mitigation | Owner |
| --- | --- | --- | --- | --- |
| [Product or delivery risk] | H/M/L | H/M/L | [Action] | [Role] |

## Open questions

- [ ] [Question that could change scope or behavior] — owner: [role], due: [date]

## Approval and change log

| Date | Change | Reason | Approved by |
| --- | --- | --- | --- |
| YYYY-MM-DD | Initial draft | [Reason] | [Name/role] |
