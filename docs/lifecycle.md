# The Product Development Lifecycle I Follow

This process is sequential in decisions and iterative in learning. I want to answer the cheapest, most important question before paying to answer the next one.

AI can help at every phase—research synthesis, contradiction checks, contract drafting, implementation, testing—but it should accelerate an explicit decision. It should not quietly make the decision because nobody wrote it down.

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
