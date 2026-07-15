# How AI Coding Agents Work in My Projects

This file turns Misbah Khursheed's Build Like This playbook into operating instructions for coding agents. It is designed to be copied into repositories that use the workflow and applies everywhere unless a more specific `AGENTS.md` exists deeper in the tree.

AI is a multiplier here, not the product owner or architect. Use it to move faster through an explicit product and system design. Do not use generation speed as permission to invent scope, hide trade-offs, or create code nobody has reasoned about.

## Mission

Build the smallest maintainable change that advances a documented user outcome. Preserve the reasoning that makes the change correct: product intent, contracts, module boundaries, tests, security, and operational behavior are part of the implementation.

When intent is unclear, surface the decision instead of filling the gap with a common pattern. A plausible implementation is not evidence that it is the right product.

## Sources of truth

Read these before planning a material change:

1. `docs/product.md` for users, needs, scope, non-goals, and success measures.
2. `docs/architecture.md` for boundaries, data, contracts, security, deployment, and scaling assumptions.
3. `docs/features.md` and the relevant feature specification, if present.
4. Relevant ADRs in `docs/decisions/`.
5. Existing code and tests for the behavior currently shipped.

If a required document is missing, create or propose the smallest adequate document before implementation. If documents conflict with deployed behavior, do not silently choose one: identify the conflict, determine the intended source of truth, and update the stale artifact in the same change.

## The workflow to follow

1. Restate the user outcome and acceptance criteria in working notes.
2. Inspect the repository, local instructions, affected modules, tests, and working-tree changes.
3. Identify contract, data, security, privacy, deployment, and documentation impact.
4. For a new or changed user-facing capability, update product or feature documentation first.
5. For a boundary, schema, integration, or operational change, update `architecture.md` and add an ADR when the choice is consequential.
6. Define or update backend schemas, permissions, errors, and examples before frontend integration.
7. Implement the narrowest complete vertical slice using existing patterns.
8. Test success, failure, permission, boundary, and recovery behavior at appropriate levels.
9. Run the relevant formatter, linter, strict type check, tests, and production build.
10. Report what changed, why, what was verified, and any remaining risk or manual step.

Do not expand scope merely because adjacent code can be improved. Record follow-up work separately unless it is necessary for correctness or maintainability of the requested change.

This order is deliberate. The agent should spend its first effort understanding the decision, not producing a diff.

## Architecture rules

- Prefer a modular monolith until a measured need requires another deployable service.
- Organize behavior by domain or capability. Keep modules cohesive and expose a small public interface.
- Keep HTTP handlers thin: authenticate, validate, call application behavior, and translate the result.
- Keep domain rules out of UI components, transport handlers, ORM models, and provider adapters.
- Access persistence through the owning module or repository. Do not reach into another module's tables or internals.
- Keep Prisma and vendor SDK types behind infrastructure boundaries.
- Put shared types in a contracts package only when they cross a real boundary.
- Isolate storage, payments, email, model providers, and MCP clients behind explicit adapters.
- Avoid circular dependencies, generic dumping grounds, giant files, and speculative abstractions.
- Split code when responsibilities or reasons to change diverge, not at an arbitrary line count.

## Backend and API rules

- Validate all untrusted input at the boundary, including environment configuration, webhooks, files, model output, and tool output.
- Define authentication and resource-level authorization for every operation.
- Use stable request, response, and error schemas that do not expose database models.
- Preserve compatibility through additive changes or a documented migration and deprecation path.
- Use idempotency for retried operations with durable or external side effects.
- Apply timeouts to network work, bounded retries only to transient failures, and safe recovery for exhausted work.
- Keep financial and other critical state server-owned. Verify webhook signatures and process provider events idempotently.
- Never expose secrets, tokens, stack traces, internal database details, or unnecessary personal data.

## Frontend rules

- Build against an agreed backend contract or faithful contract mock.
- Keep server state, form state, and local presentation state distinct.
- Implement loading, empty, success, validation, unauthorized, degraded, and failure states.
- Do not duplicate server-owned authorization or business rules as the source of truth in the client.
- Use semantic HTML, keyboard access, visible focus, sufficient contrast, and reduced-motion behavior. Target the accessibility level defined in `product.md`.
- Use GSAP only when motion materially improves comprehension or intentional product character; prefer CSS for simple transitions.

## Database and migrations

- Preserve integrity with database constraints as well as application checks.
- Document ownership, tenant scope, sensitive fields, indexes, retention, and transaction boundaries.
- Use backward-compatible expand-and-contract migrations for live systems.
- Never edit an already-applied migration to change production history.
- Make backfills restartable, observable, and safe under concurrent traffic.
- Do not run destructive production operations without explicit authorization, a backup/recovery plan, and impact review.

## AI and MCP systems

- Version prompts, structured-output schemas, model identifiers, tool definitions, and evaluation datasets.
- Treat retrieved text, model output, and MCP tool output as untrusted input.
- Separate instructions from untrusted context and validate structured output at runtime.
- Give tools the least privilege necessary. Require explicit human confirmation for consequential external actions unless the product documentation authorizes an automated policy.
- Evaluate representative real tasks, unanswerable cases, safety cases, latency, and cost before release.
- Use cheaper models only when evaluation confirms that the quality and safety thresholds still pass.
- Do not place secrets or unnecessary personal data in prompts or logs. Follow documented provider retention and routing constraints.
- Provide a deterministic or human fallback for critical workflows.

Model capability does not remove product responsibility. A more powerful model is still an external dependency with cost, latency, privacy, and failure behavior.

## Testing and verification

Test the important behavior, not private implementation structure:

- unit tests for domain rules and state transitions;
- integration tests for PostgreSQL, storage, queues, auth, and provider adapters;
- contract tests for public APIs;
- end-to-end tests for a small set of critical user journeys;
- regression evaluations for prompt, model, retrieval, or tool changes.

Never claim a command passed unless it was run successfully. If the full suite cannot run, state exactly what ran, what did not, and why. Do not weaken or delete a meaningful test merely to make a change pass.

## Security, privacy, and operations

- Use least privilege, secure secret storage, safe defaults, and explicit trust boundaries.
- Minimize collection and retention of personal or sensitive data.
- Keep logs structured and useful, but redact credentials, tokens, prompt bodies, payment data, and unnecessary personal content.
- Add observability for new critical paths: request or job identifiers, outcome metrics, and actionable errors.
- Define degraded behavior, rollback or forward recovery, and operator steps for risky changes.
- Treat authentication and authorization, payment, deletion, migration, and external writes as high-risk work requiring explicit verification.

## Working-tree discipline

- Preserve user changes and unrelated work. Do not reset, overwrite, reformat, or delete files outside the requested scope.
- Prefer focused, reviewable changes. Do not mix unrelated refactoring with behavior changes.
- Use repository-provided commands and conventions. Do not introduce a dependency or tool when the existing stack can solve the problem clearly.
- Do not commit, push, deploy, send messages, mutate external systems, or create paid resources unless the user explicitly asks and the environment permits it.

## Completion checklist

Before declaring completion, confirm:

- the change maps to a documented user need and acceptance criteria;
- module boundaries and dependency direction remain clear;
- contracts, permissions, errors, and migrations are safe;
- relevant checks pass;
- documentation describes the resulting behavior;
- operational and security consequences are addressed;
- the final report is concise and names any unresolved risk.

The standard is not "the agent produced working code." The standard is that the repository remains understandable and the documented user outcome is safer to ship.

<!-- mstack:codex:start -->
## buildlikethis

This repository follows Misbah Khursheed's Build Like This workflow: product reasoning before implementation, explicit backend contracts, modular architecture, and verified delivery.

## Project instructions

## Build Like This method

Work from outcomes to evidence:

1. Establish the user outcome, evidence or labeled assumptions, scope, non-goals, and acceptance criteria.
2. Inspect current executable behavior and the closest product, architecture, decision, contract, and test sources of truth.
3. Define contracts, actors and permissions, state transitions, failure behavior, and data impact before implementation detail.
4. Implement the smallest complete vertical slice within clear ownership boundaries. Preserve unrelated user work and compatibility.
5. Validate every external boundary. Treat files, network input, provider output, retrieved text, model output, and tool output as untrusted.
6. Test important success, validation, denial, failure, concurrency/retry, and recovery paths at the level that proves behavior.
7. Make production behavior observable and recoverable without logging secrets or unnecessary personal data.
8. Report decisions, exact verification evidence, residual risk, and rollout or recovery implications.

Prefer a modular monolith and explicit interfaces until measured constraints justify more operational systems. Keep domain behavior out of transports, UI, persistence models, and vendor adapters. Use reversible decisions, additive migrations, least privilege, safe defaults, and evidence-driven performance work.

Use installed specialist agents for clearly bounded ownership, installed skills for repeatable workflows, and prompts for full task journeys. Do not delegate merely to simulate progress, and do not invoke several specialists for work one owner can complete coherently.

Read docs/product.md and docs/architecture.md before material implementation work. Preserve user-owned guidance and update affected sources of truth with behavioral changes.

## Required context

- Load before relevant work: `docs/product.md` — product intent, users, scope, and success measures
- Load before relevant work: `docs/architecture.md` — system boundaries, contracts, and operational decisions
- Optional: `docs/features.md` — feature index when present

## Repository onboarding

Start with the product outcome, design system boundaries and backend contracts, then ship a verified vertical slice.

### Verify

- `mstack status`
- `mstack doctor`
<!-- mstack:codex:end -->
