import type { PromptDefinition } from "../types.js";

interface PromptSource {
  readonly id: string;
  readonly description: string;
  readonly argumentHint: string;
  readonly task: string;
  readonly method: readonly string[];
  readonly deliverables: readonly string[];
  readonly constraints: readonly string[];
}

function definePrompt(source: PromptSource): PromptDefinition {
  return {
    id: source.id,
    description: source.description,
    argumentHint: source.argumentHint,
    prompt: [
      `# ${source.id}`,
      "",
      source.task,
      "",
      "This prompt follows Misbah Khursheed's Build Like This workflow: establish the user outcome and reasoning before generating implementation, then preserve that reasoning in contracts, boundaries, tests, and documentation.",
      "",
      "Treat the invocation arguments and current repository state as task input. Discover local instructions and relevant product, architecture, decision, contract, and test context before making material assumptions.",
      "",
      "## Method",
      "",
      ...source.method.map((item, index) => `${index + 1}. ${item}`),
      "",
      "## Deliverables",
      "",
      ...source.deliverables.map((item) => `- ${item}`),
      "",
      "## Constraints",
      "",
      ...source.constraints.map((item) => `- ${item}`),
      "",
      "Finish with what changed or was decided, exact verification evidence, remaining risks, and the next decision only if one is genuinely required.",
    ].join("\n"),
  };
}

export const engineeringPrompts: readonly PromptDefinition[] = [
  definePrompt({
    id: "build-feature",
    description: "Deliver a bounded feature from user outcome through verified implementation and rollout notes.",
    argumentHint: "<feature request or specification>",
    task: "Build the requested feature as the narrowest complete vertical slice, preserving existing behavior outside the agreed scope.",
    method: [
      "Restate the user outcome, evidence/assumptions, scope, non-goals, acceptance criteria, and affected actors.",
      "Inspect current behavior and identify contract, data, authorization, security, accessibility, operational, and documentation impact.",
      "Resolve or expose decisions that materially change the implementation; avoid blocking on discoverable details.",
      "Define backend/public contracts and state transitions before integrating clients; plan compatibility and migration where needed.",
      "Implement by owning capability with validated boundaries, complete failure states, and no unrelated refactoring.",
      "Test important success, validation, denial, failure, retry/concurrency, and recovery paths at the appropriate levels.",
      "Run relevant type, build, lint, test, and focused operational checks; review the final diff against acceptance criteria.",
    ],
    deliverables: [
      "Working implementation and focused tests, not merely a plan or scaffold.",
      "Explicit contract/data/configuration/migration changes and compatibility behavior.",
      "Verification results plus rollout, observability, and rollback/forward-recovery notes where relevant.",
    ],
    constraints: [
      "Do not invent product behavior to fill consequential ambiguity.",
      "Do not make client checks the source of truth for authorization or business invariants.",
      "Do not claim completion while acceptance criteria or required verification remain unresolved.",
    ],
  }),
  definePrompt({
    id: "plan-mvp",
    description: "Shape a product hypothesis into the smallest measurable MVP and implementation sequence.",
    argumentHint: "<product idea, users, evidence, constraints>",
    task: "Plan an MVP that tests the highest-risk product assumption with the least product and operational complexity.",
    method: [
      "Separate known evidence, assumptions, and open questions; identify the target user and painful current behavior.",
      "Define the outcome and falsifiable success signal before proposing features.",
      "Map the minimum end-to-end journey and all user-visible states needed for a trustworthy experience.",
      "Rank assumptions by impact and uncertainty; choose scope that tests the riskiest one without speculative platform work.",
      "Define non-goals, permissions, data/privacy boundaries, operational constraints, and explicit kill/revisit criteria.",
      "Translate scope into vertical delivery slices with acceptance criteria and a validation/rollout plan.",
    ],
    deliverables: [
      "Problem/evidence/assumption ledger and target outcome metric.",
      "MVP journey, scope, non-goals, acceptance criteria, and failure/degraded behavior.",
      "Ordered delivery and learning plan with risks, cost/operations considerations, and next-stage triggers.",
    ],
    constraints: [
      "Do not substitute feature count or launch date for a user outcome.",
      "Do not include multi-tenant scale, extensibility, or integrations without an MVP requirement.",
      "Do not present fabricated market evidence or metrics as fact.",
    ],
  }),
  definePrompt({
    id: "review-architecture",
    description: "Assess architecture against current requirements and recommend evidence-backed decisions.",
    argumentHint: "<system, proposal, or architecture concern>",
    task: "Review the relevant architecture as an owner: test whether boundaries, data, contracts, and operations fit the documented requirements and change pressure.",
    method: [
      "Map actors, components, data ownership, trust boundaries, dependency direction, and key flows from documents and code.",
      "Trace representative success, failure, retry, migration, and recovery journeys end to end.",
      "Evaluate cohesion/coupling, consistency, security/isolation, availability, observability, deployment safety, scale, and cost.",
      "Distinguish present defects from future risks and validate claims against load, incidents, or concrete change scenarios.",
      "Compare the smallest viable options; state consequences, migration cost, and conditions that would justify added complexity.",
      "Identify decisions that belong in an ADR and the evidence needed to validate them.",
    ],
    deliverables: [
      "Concise current-state map and requirements-fit assessment.",
      "Prioritized strengths/risks with concrete failure scenarios and evidence.",
      "Recommended decisions, alternatives rejected, migration/recovery approach, and revisit triggers.",
    ],
    constraints: [
      "Do not recommend services, queues, caches, or new technology as architectural decoration.",
      "Do not accept diagrams as truth when executable behavior contradicts them.",
      "Do not rewrite the system when a module boundary or contract correction is sufficient.",
    ],
  }),
  definePrompt({
    id: "review-pull-request",
    description: "Review a change for correctness, security, compatibility, operations, and missing tests.",
    argumentHint: "<PR, branch, diff, or review focus>",
    task: "Review the specified change. Findings are the product: report only defects or material risks that the author can act on.",
    method: [
      "Read the change intent and acceptance criteria, then inspect the full diff and relevant surrounding behavior.",
      "Trace changed paths through success, validation, authorization, boundary, failure, concurrency, and recovery scenarios.",
      "Check contracts, migrations, configuration, secrets, compatibility, observability, and rollout implications.",
      "Assess tests against the changed invariants and high-risk paths; run focused verification where safe.",
      "For each candidate finding, confirm a plausible failure scenario, impact, and precise code evidence.",
      "Order findings by severity and omit style commentary without concrete maintenance or correctness impact.",
    ],
    deliverables: [
      "Findings first; each includes severity, location, failure scenario, impact, and narrow remediation.",
      "Open questions only where missing information changes correctness or safety.",
      "Verification performed, remaining coverage gaps, and residual risks; explicitly say when no findings remain.",
    ],
    constraints: [
      "Do not implement fixes unless explicitly asked after the review.",
      "Do not inflate severity or report speculative defects without a causal path.",
      "Do not let passing tests override a demonstrated untested failure.",
    ],
  }),
  definePrompt({
    id: "debug-failure",
    description: "Diagnose a failure through reproduction and controlled evidence before implementing a fix.",
    argumentHint: "<symptom, error, reproduction, environment>",
    task: "Debug the reported failure systematically and, when authorized, implement the narrowest root-cause fix with regression evidence.",
    method: [
      "Capture expected/actual behavior, environment, exact input, frequency, timing, and last-known-good state.",
      "Separate observations from hypotheses and build the smallest reliable reproduction.",
      "Trace backward from the symptom to the first violated invariant across process, network, data, and UI boundaries.",
      "Rank hypotheses and run one discriminating experiment at a time; preserve logs/traces that eliminate branches.",
      "Explain the causal mechanism before changing behavior, then fix the broken invariant rather than masking the symptom.",
      "Add a regression test that fails for the original reason and verify adjacent and production-different paths.",
    ],
    deliverables: [
      "Minimal reproduction, evidence timeline, and tested hypothesis ledger.",
      "Root-cause explanation linking the broken invariant to the symptom.",
      "Narrow fix and regression test when requested, plus verification and monitoring/data-repair needs.",
    ],
    constraints: [
      "Do not suppress errors, loosen validation, or weaken tests to make the symptom disappear.",
      "Do not mutate external or production state without explicit authorization and recovery planning.",
      "Do not call correlation a root cause.",
    ],
  }),
  definePrompt({
    id: "refactor-module",
    description: "Refactor a module through small behavior-preserving transformations and a clear safety net.",
    argumentHint: "<module, maintenance pain, desired boundary>",
    task: "Improve the requested module's structure without changing its observable behavior or expanding adjacent scope.",
    method: [
      "Name the concrete change pain, responsibility/coupling problem, preserved invariants, and success signal.",
      "Map callers, dependencies, side effects, contracts, ownership, and current test evidence.",
      "Add characterization tests for important behavior that lacks a practical safety net.",
      "Design and apply a sequence of small compiling/testable transformations toward the owning boundary.",
      "Remove obsolete paths only after callers migrate; resist abstractions without stable shared semantics.",
      "Compare before/after dependencies and run focused plus broader regression checks.",
    ],
    deliverables: [
      "Refactored code with behavior-preserving tests and no unrelated semantic changes.",
      "Short before/after explanation of responsibilities and dependency direction.",
      "Verification evidence and intentionally deferred cleanup.",
    ],
    constraints: [
      "Do not mix dependency upgrades or feature behavior into the structural change.",
      "Do not optimize for line/file count over cohesion and readability.",
      "Do not create a generic abstraction solely to remove superficial duplication.",
    ],
  }),
  definePrompt({
    id: "design-api",
    description: "Design an implementation-ready API with schemas, permissions, errors, and compatibility rules.",
    argumentHint: "<user operation, resources, clients, constraints>",
    task: "Design the requested API contract before implementation so clients and servers can work against the same validated behavior.",
    method: [
      "Define the user operation, actors, resource ownership, invariants, and state transitions in domain language.",
      "Choose operation/resource shape consistent with existing API conventions, not database tables or screens.",
      "Specify authentication and resource authorization independently for every operation.",
      "Define request and response schemas, normalization, bounds, pagination, idempotency, concurrency, and rate limits.",
      "Define stable errors and safe details for validation, denial, conflict, missing resources, rate limits, and dependency failure.",
      "Write success/failure examples, compatibility/versioning behavior, observability, and contract tests.",
    ],
    deliverables: [
      "Operation table with actor, permission, request, response, state effect, and errors.",
      "Runtime-validatable schema or equivalent contract plus representative examples.",
      "Compatibility, idempotency/concurrency, rate-limit, security, and contract-test notes.",
    ],
    constraints: [
      "Do not leak database models, internal exceptions, secrets, or provider payloads.",
      "Do not rely on client validation for server invariants.",
      "Do not introduce breaking changes without a migration/deprecation path.",
    ],
  }),
  definePrompt({
    id: "improve-documentation",
    description: "Make project documentation accurate, decision-oriented, navigable, and verifiable against code.",
    argumentHint: "<document, audience, problem, or changed behavior>",
    task: "Improve the requested documentation as an operational source of truth, not as promotional prose or a dump of implementation detail.",
    method: [
      "Identify the audience, decision/task they need to complete, and authoritative executable sources.",
      "Verify commands, paths, contracts, defaults, examples, and current behavior against the repository.",
      "Separate product intent, current architecture, historical decisions, procedures, and reference material.",
      "Structure for progressive disclosure: outcome and prerequisites first, exact procedure/contract next, caveats and recovery last.",
      "Replace vague claims with concrete examples, failure behavior, ownership, and links to a single source of truth.",
      "Check link/path validity, command safety, terminology consistency, and stale duplication.",
    ],
    deliverables: [
      "Updated content optimized for the named audience and task.",
      "List of behavior/commands verified and any discrepancies found in code or other sources.",
      "Remaining unknowns or ownership decisions that documentation alone cannot resolve.",
    ],
    constraints: [
      "Do not describe behavior that was not verified or clearly label it as proposed.",
      "Do not duplicate whole contracts or decisions when a stable link is sufficient.",
      "Do not hide dangerous steps, prerequisites, failure modes, or recovery actions.",
    ],
  }),
  definePrompt({
    id: "production-readiness",
    description: "Assess whether a system or change is safe to operate and release under real failure conditions.",
    argumentHint: "<service, feature, or release scope>",
    task: "Perform an evidence-based production readiness review and produce a go/no-go decision with an actionable recovery-aware plan.",
    method: [
      "Confirm scope, acceptance criteria, owners, traffic/data assumptions, SLOs, and consequential user actions.",
      "Review authentication/authorization, data protection, abuse controls, dependencies, timeouts, retries, and idempotency.",
      "Trace startup, normal operation, overload, partial dependency failure, deploy, migration, backup/restore, and incident recovery.",
      "Verify build/tests/configuration/secrets, health/readiness, logs/metrics/traces, alerts, dashboards, and cost/capacity limits.",
      "Assess compatibility, rollout sequencing, smoke tests, feature controls, and rollback versus forward-recovery safety.",
      "Classify blockers, accepted risks, and follow-ups with named evidence, threshold, and owner.",
    ],
    deliverables: [
      "Go/no-go recommendation with blockers first and evidence for each readiness area.",
      "Progressive rollout, smoke test, monitoring thresholds, and rollback/forward-recovery procedure.",
      "Accepted residual risks, owners, incident/support notes, and post-release verification.",
    ],
    constraints: [
      "Do not mark readiness based on planned controls or commands that were not run.",
      "Do not recommend blind retries, fail-open security, or rollback across incompatible data migrations.",
      "Do not bury a high-impact operational gap in a checklist score.",
    ],
  }),
];
