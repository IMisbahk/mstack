# The Product Development Lifecycle I Follow

This process is sequential in decisions and iterative in learning. I want to answer the cheapest, most important question before paying to answer the next one.

AI can help at every phase—research synthesis, contradiction checks, contract drafting, implementation, testing—but it should accelerate an explicit decision. It should not quietly make the decision because nobody wrote it down.

## How the installed AI workflow maps to this lifecycle

Build Like This is the method used to build the host project; mstack only installs the supporting workflow. The host project's `docs/`, code, tests, and recorded decisions define what is being built. `.mstack/templates/` contains reference scaffolds that must be copied and adapted into project-owned artifacts rather than treated as requirements.

The installed runtime gives every phase a dedicated reusable method and task journey:

| Phase | Skill | Prompt | Primary durable output |
| --- | --- | --- | --- |
| Idea | `idea-validation` | `research-idea` | `docs/research/<topic>.md` |
| Target users | `target-user-definition` | `identify-target-users` | Updated discovery brief |
| User needs | `user-needs-research` | `research-user-needs` | Evidence and needs synthesis |
| Feature design | `feature-design` | `design-features` | Product scope or warranted feature spec |
| Product definition | `product-definition` | `write-product-definition` | `docs/product.md` |
| Architecture | `architecture-design` | `design-architecture` | `docs/architecture.md` and consequential ADRs |
| Backend | `backend-delivery` | `build-backend` | Validated server contract, behavior, and tests |
| Frontend | `frontend-delivery` | `build-frontend` | Accessible user journey and tests |
| Deployment | `deployment-delivery` | `deploy-product` | Authorized rollout, evidence, and recovery record |
| Continuous improvement | `continuous-improvement` | `improve-product` | Outcome review and next-phase decision |

### Sequential decisions, parallel work

The active phase lead must delegate at least one bounded specialist lane for a material lifecycle task. When two or more lanes are independent, launch them concurrently: for example, problem evidence, alternatives, and feasibility during discovery; data, security, and operations during architecture; or code, accessibility, and release reviews after implementation.

Parallelism never removes decision gates or ownership. Product intent precedes architecture, contracts precede dependent implementation, and readiness precedes deployment. Do not let agents edit the same contract, document, migration, or file concurrently. One lead integrates the results, records conflicts and confidence, and verifies the combined result against the phase exit criteria. Runtimes without native subagents execute the same named lanes sequentially and state that limitation.

Backend and frontend delivery may overlap after the backend contract, permissions, and stable errors are fixed: frontend works against a faithful contract mock while backend implementation continues, and integration waits for contract verification. This overlap does not let either lane redefine the shared contract independently.

## 1. Start with the idea

I write the idea as a user outcome, not a solution pitch. "Help independent designers get overdue invoices paid" is useful. "Build an AI finance dashboard" has already jumped to a feature and a technology.

Capture what triggered the idea, the problem you believe exists, the alternatives people use today, and the assumption most likely to invalidate the whole thing. Do not choose infrastructure yet. There may be nothing worth building.

**Why this phase exists:** an idea should earn the cost of investigation before it earns the cost of implementation.

**Exit criteria:** the desired outcome and the riskiest assumption are explicit.

## 2. Identify the target users

Choose a narrow primary user with a shared context and problem. Separate the person using the product from the buyer, administrator, approver, or person affected by it. They often need different things.

"Everyone" is an avoidance of product thinking. A narrow user is easier to understand, reach, serve, and learn from. Expansion can happen after the product works for someone specific.

Use interviews, observation, support requests, search behavior, existing workflows, and market evidence. AI can help organize that material; it cannot turn invented personas into user evidence.

**Exit criteria:** the primary segment is named, reachable, and meaningfully different from adjacent segments.

## 3. Understand what users actually need

Study the user's job, current workflow, pain, frequency, stakes, and workaround. Feature requests are clues, not requirements. Ask what outcome the user is trying to create and why their present approach fails.

Label assumptions with confidence and a validation method. A conversation, clickable prototype, concierge workflow, or spreadsheet can answer important product questions before a codebase exists.

**Why this phase exists:** building the wrong interpretation of a real problem is still building the wrong product.

**Exit criteria:** important needs are supported by evidence or clearly marked as hypotheses.

## 4. Design features around those needs

Map every proposed capability to a user need and an observable outcome. Select the smallest complete journey that can prove value. Write non-goals while the temptation to expand scope is still manageable.

I design the unhappy paths here too: empty states, invalid input, missing permissions, accessibility, external failure, and recovery. A feature is not defined if only the successful screen is understood.

**Exit criteria:** every committed feature has a reason, and the first release has a clear edge.

## 5. Write `product.md`

Turn the evidence and scope into a product contract. Define the vision, problem, target users, personas, needs, first-release capabilities, non-goals, success measures, constraints, risks, and open questions. Use the [product guide](product.md) and [template](../templates/product.template.md).

This is the point where I want disagreement. It is cheaper to discover two incompatible ideas in a document than after each has become a different part of the codebase.

**Exit criteria:** the people involved agree on who the product serves, what the release does, what it does not do, and how success will be judged.

## 6. Design the system in `architecture.md`

Translate product requirements into technical responsibilities. Define the system context, module boundaries, data ownership, API contracts, authentication and authorization, integrations, failure behavior, observability, deployment, security, and scaling triggers. Use the [architecture guide](architecture.md) and [template](../templates/architecture.template.md).

I prefer a modular monolith unless a real constraint requires distribution. I prototype the highest-risk technical assumption and record consequential choices as ADRs. Architecture should remove implementation ambiguity without pretending to predict the entire future.

**Exit criteria:** implementation can proceed against explicit boundaries and contracts, and material risks have owners or validation plans.

## 7. Build the backend

Implement a thin vertical slice of domain behavior, persistence, authorization, and API response. Define request and response schemas, state transitions, permissions, errors, and side effects before the frontend depends on them.

Keep transport, business rules, persistence, and provider code separate. Test the rules and boundaries, not only the happy request. Publish examples or machine-readable schemas so a human or AI working on the frontend has a stable target.

**Why backend first:** durable system behavior should not emerge accidentally from the needs of one screen.

**Exit criteria:** the first journey has a testable, observable contract stable enough for a consumer.

## 8. Build the frontend

Build against the documented contract. Organize the interface by user-facing capability and keep server state distinct from local UI state. Implement loading, empty, success, validation, unauthorized, degraded, and failure states.

The frontend owns the experience, not the source of truth for business rules or permissions. Validate keyboard use, screen-reader behavior, responsive layouts, perceived performance, analytics, and recovery.

**Exit criteria:** the target user can complete the core journey and understands what happened in every important state.

## 9. Deploy

A product is not finished when it works on a development machine. Build and deploy repeatably, keep secrets outside source control, run migrations safely, verify health checks, and define rollback or forward recovery. Add logs, metrics, error tracking, alerts, and tested backups in proportion to the risk.

Ship progressively when the blast radius justifies it. Test the real production journey and make ownership explicit. Someone must know what to do when it fails.

**Exit criteria:** the release is observable, recoverable, secure enough for its data, and owned.

## 10. Continuously improve the product

Compare product outcomes, user feedback, reliability, cost, and engineering friction against the original goals. Fix correctness and usability before adding surface area. Refactor while the reason is fresh.

Update `product.md`, `architecture.md`, feature specifications, and ADRs as the evidence changes. The point is not to protect the original plan. The point is to preserve a clear explanation of the current one.

**Exit criteria:** there is no final exit. The project returns to the earliest phase affected by what you learned.
