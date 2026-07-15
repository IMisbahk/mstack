import type { SkillDefinition } from "../types.js";

interface SkillSource {
  readonly id: string;
  readonly description: string;
  readonly purpose: string;
  readonly inputs: readonly string[];
  readonly process: readonly string[];
  readonly output: readonly string[];
  readonly guardrails: readonly string[];
}

function defineSkill(source: SkillSource): SkillDefinition {
  return {
    id: source.id,
    version: "1.0.0",
    activation: "passive",
    security: "content",
    fallback: "degrade",
    description: source.description,
    instructions: [
      `# ${source.id}`,
      "",
      "This skill is part of Misbah Khursheed's Build Like This workflow. Thinking, evidence, and explicit trade-offs come before generated output.",
      "",
      "## Purpose",
      "",
      source.purpose,
      "",
      "## Required inputs",
      "",
      ...source.inputs.map((item) => `- ${item}`),
      "",
      "If a missing input would materially change the result, state the gap and obtain or discover it before proceeding. Otherwise label the assumption and continue.",
      "",
      "## Process",
      "",
      ...source.process.map((item, index) => `${index + 1}. ${item}`),
      "",
      "## Output contract",
      "",
      ...source.output.map((item) => `- ${item}`),
      "",
      "## Guardrails",
      "",
      ...source.guardrails.map((item) => `- ${item}`),
      "",
      "End with the evidence gathered, verification performed, and any residual risk or unresolved decision.",
    ].join("\n"),
  };
}

export const engineeringSkills: readonly SkillDefinition[] = [
  defineSkill({
    id: "feature-planning",
    description: "Turn a validated user need into implementation-ready scope, contracts, risks, and delivery slices.",
    purpose:
      "Create a plan that connects a user outcome to observable behavior and the smallest safe sequence of engineering changes.",
    inputs: [
      "Target user, problem evidence or labeled hypothesis, desired outcome, and non-goals.",
      "Current behavior and relevant product, architecture, contract, and operational context.",
      "Constraints on permissions, data, compatibility, rollout, accessibility, reliability, and time.",
    ],
    process: [
      "Restate the problem, outcome, evidence, assumptions, and explicitly excluded scope.",
      "Describe the end-to-end journey and enumerate success, empty, validation, denial, degraded, and failure states.",
      "Define testable acceptance criteria, actors/permissions, state transitions, and contract/data changes before tasks.",
      "Map affected modules and external boundaries; identify security, privacy, migration, observability, and rollback needs.",
      "Slice delivery vertically so each step proves useful behavior and preserves compatibility; order dependencies explicitly.",
      "Define verification at unit, integration, contract, and end-to-end levels in proportion to risk.",
    ],
    output: [
      "Outcome, scope, non-goals, assumptions, and acceptance criteria.",
      "User-visible state table plus contract, data, permission, and failure impact.",
      "Ordered vertical slices with affected ownership, tests, rollout/recovery, and completion evidence.",
    ],
    guardrails: [
      "Do not produce a file-by-file task list before defining behavior and contracts.",
      "Do not disguise unanswered product decisions as implementation details.",
      "Do not add speculative platform work without a current acceptance criterion.",
    ],
  }),
  defineSkill({
    id: "api-contract-design",
    description: "Design a stable API contract with validation, authorization, errors, compatibility, and examples.",
    purpose:
      "Specify an API operation precisely enough that clients, servers, tests, and operators share the same behavioral contract.",
    inputs: [
      "User action and outcome, actors, resource ownership, and state transitions.",
      "Existing API conventions, versioning strategy, and compatibility constraints.",
      "Expected volume, latency, idempotency, pagination, and security requirements.",
    ],
    process: [
      "Model resources and operations from domain language rather than storage tables or UI components.",
      "Define authentication separately from resource-level authorization for every operation.",
      "Specify request path/query/header/body schemas, normalization, bounds, and unknown-field behavior.",
      "Specify success responses, stable error codes, status mapping, and safe user/operator detail.",
      "Define idempotency, concurrency, pagination, rate limits, deprecation, and compatibility rules where applicable.",
      "Write representative success and failure examples, then derive contract tests and implementation handoff notes.",
    ],
    output: [
      "Operation table with purpose, actor, permission, request, response, and state effect.",
      "Runtime-validatable schemas and stable error catalog with examples.",
      "Compatibility, idempotency/concurrency, rate-limit, observability, and contract-test plan.",
    ],
    guardrails: [
      "Do not expose database or vendor SDK models as the public contract.",
      "Do not use a success response to encode expected domain failures.",
      "Do not rely on client-side validation or hidden conventions for security-critical constraints.",
    ],
  }),
  defineSkill({
    id: "database-modeling",
    description: "Model durable data ownership, invariants, access patterns, indexes, and safe migrations.",
    purpose:
      "Turn domain rules and access patterns into a persistence design that remains correct under concurrency, growth, and deployment change.",
    inputs: [
      "Entities, ownership, lifecycle/state transitions, cardinality, and invariants.",
      "Tenant and sensitive-data boundaries, retention/deletion rules, and recovery expectations.",
      "Read/write patterns, expected scale, consistency needs, and current schema constraints.",
    ],
    process: [
      "Identify aggregate ownership and distinguish durable facts from derived or cached values.",
      "Define tables/collections, keys, relationships, nullability, uniqueness, checks, and deletion behavior.",
      "Map transaction and concurrency boundaries, including race conditions and idempotent writes.",
      "Derive minimal indexes from concrete access patterns and validate critical queries against representative data.",
      "Classify sensitive fields and define tenant isolation, retention, audit, backup, and restore behavior.",
      "Design expand-migrate-contract rollout with restartable backfill, compatibility window, monitoring, and recovery.",
    ],
    output: [
      "Entity/relationship and ownership model with explicit invariants and constraints.",
      "Access-pattern/index table and transaction/concurrency behavior.",
      "Migration/backfill/rollback-or-forward plan plus integrity, isolation, and query tests.",
    ],
    guardrails: [
      "Do not add an index without naming the query it serves and its write/storage cost.",
      "Do not use application validation as the only protection for durable invariants.",
      "Do not propose destructive migration steps without backup, compatibility, and recovery evidence.",
    ],
  }),
  defineSkill({
    id: "repository-audit",
    description: "Assess repository health, boundaries, delivery readiness, and the highest-leverage improvements.",
    purpose:
      "Produce an evidence-based health assessment that helps maintainers prioritize concrete risks rather than chase a generic best-practice checklist.",
    inputs: [
      "Repository tree, manifests, source modules, tests, automation, instructions, and relevant project documents.",
      "Intended product/deployment shape and known pain points if available.",
      "Allowed diagnostic commands and constraints on running builds or external tools.",
    ],
    process: [
      "Inventory entry points, packages, ownership boundaries, generated artifacts, and dependency direction.",
      "Inspect build/test/type/lint/release commands and run the safest representative checks.",
      "Sample critical paths for validation, authorization, errors, secrets, observability, and recovery behavior.",
      "Compare documentation and agent instructions with executable behavior; identify stale or missing sources of truth.",
      "Review dependency hygiene, dead/duplicate code signals, migration state, and production configuration risks.",
      "Rank findings by user/operational impact, likelihood, and effort; separate quick fixes from structural work.",
    ],
    output: [
      "Repository map and concise health scorecard backed by inspected files and commands.",
      "Prioritized findings with evidence, impact, and recommended owner/action.",
      "A sequenced 30/60/90-style improvement path only when the breadth warrants it.",
    ],
    guardrails: [
      "Do not infer a defect solely from an unfamiliar convention; trace actual behavior.",
      "Do not recommend broad rewrites when a boundary or automation fix addresses the risk.",
      "Do not mutate the repository during an audit unless explicitly asked to fix findings.",
    ],
  }),
  defineSkill({
    id: "architecture-assessment",
    description: "Review architecture against current requirements, boundaries, failure modes, and change pressure.",
    purpose:
      "Determine whether the present design safely supports documented outcomes and identify the smallest architectural decisions that need attention.",
    inputs: [
      "Product outcomes/non-goals, architecture description, diagrams, ADRs, and current repository structure.",
      "Load/SLOs, security/privacy constraints, deployment topology, incidents, and expected change pressure.",
      "Known bottlenecks or proposed architectural change.",
    ],
    process: [
      "Map actors, components, data ownership, trust boundaries, and synchronous/asynchronous flows from evidence.",
      "Trace representative success and failure journeys across contracts, state, retries, and recovery.",
      "Evaluate cohesion, coupling, dependency direction, shared-state hazards, and operational ownership.",
      "Check security isolation, availability, observability, deployment/migration safety, scale triggers, and cost.",
      "Distinguish current failures from future risks and compare the smallest viable response options.",
      "Record decisions or ADR candidates with consequences, validation signals, and revisit triggers.",
    ],
    output: [
      "Current-state boundary/data/interaction map and requirement fit assessment.",
      "Prioritized risks and strengths with concrete evidence and failure scenarios.",
      "Recommended decisions, rejected alternatives, sequencing, validation, and revisit triggers.",
    ],
    guardrails: [
      "Do not equate more services, queues, caches, or layers with better architecture.",
      "Do not recommend technology replacement without naming the unmet constraint and migration cost.",
      "Do not treat diagrams or documents as proof when code and production behavior disagree.",
    ],
  }),
  defineSkill({
    id: "threat-model-review",
    description: "Threat-model a feature or change and derive prioritized, testable security controls.",
    purpose:
      "Find realistic abuse paths across trust boundaries and turn them into proportionate prevention, detection, and recovery work.",
    inputs: [
      "Feature behavior or diff, actors/roles, data classification, and deployment/integration context.",
      "Authentication/session model, authorization rules, trust boundaries, and external effects.",
      "Applicable tenancy, privacy, compliance, retention, and audit requirements.",
    ],
    process: [
      "List assets, entry points, trust boundaries, attacker capabilities, and consequential actions.",
      "Trace data and authority through input, identity, authorization, storage, tools/providers, output, and logs.",
      "Generate plausible abuse cases for spoofing, tampering, disclosure, denial, escalation, replay, and tenant crossing.",
      "Evaluate existing controls and failure-open behavior; verify high-risk paths against code/config when possible.",
      "Rank findings by exploitability and impact, then design least-privilege defense in depth.",
      "Define regression tests, monitoring/audit signals, incident recovery, and explicitly accepted residual risk.",
    ],
    output: [
      "Compact threat model and trust-boundary/data-flow narrative.",
      "Prioritized abuse cases/findings with evidence and narrow mitigations.",
      "Security tests, telemetry, rollout precautions, and residual-risk decisions.",
    ],
    guardrails: [
      "Do not expose secrets or execute destructive proof-of-concepts against live systems.",
      "Do not report checklist items without an asset and plausible attack path.",
      "Do not claim compliance or security approval beyond the evidence reviewed.",
    ],
  }),
  defineSkill({
    id: "systematic-debugging",
    description: "Move from symptom to reproducible causal mechanism, narrow fix, and regression evidence.",
    purpose:
      "Resolve defects efficiently by reducing uncertainty through controlled experiments instead of accumulating speculative patches.",
    inputs: [
      "Expected and actual behavior, exact error/output, environment/version, timing, and frequency.",
      "Reproduction steps or failing input plus relevant logs, traces, data shape, and recent changes.",
      "Applicable contracts/invariants and constraints on production access or mutation.",
    ],
    process: [
      "Create a timeline and separate verified observations from assumptions and interpretations.",
      "Build the smallest reliable reproduction; compare failing and working cases and preserve evidence.",
      "Locate the first violated invariant by tracing backward from the symptom across boundaries.",
      "Build a ranked hypothesis tree and run one discriminating experiment per branch.",
      "Implement the smallest root-cause fix and a regression test that fails for the original mechanism.",
      "Verify adjacent scenarios, production differences, and whether monitoring or data repair is required.",
    ],
    output: [
      "Minimal reproduction, evidence timeline, and hypothesis ledger.",
      "Causal explanation from broken invariant to observed symptom.",
      "Narrow fix, regression proof, verification results, and recovery/monitoring follow-up.",
    ],
    guardrails: [
      "Do not suppress an exception, loosen validation, or weaken a test to remove the symptom.",
      "Do not change several independent variables in one experiment without stating the ambiguity.",
      "Do not mutate production state without explicit authorization and recovery planning.",
    ],
  }),
  defineSkill({
    id: "safe-refactoring",
    description: "Plan and execute behavior-preserving structural improvements with a practical safety net.",
    purpose:
      "Make a concrete future change safer or cheaper by improving cohesion, ownership, and dependency direction without mixing in new behavior.",
    inputs: [
      "Specific maintenance pain or upcoming change, affected code/callers, and desired structural outcome.",
      "Observable behavior and public contracts that must remain stable.",
      "Existing tests, performance constraints, rollout risk, and allowed change scope.",
    ],
    process: [
      "State the structural smell in terms of change cost, coupling, responsibility, or testability.",
      "Map callers, dependencies, side effects, public surface, and the invariants to preserve.",
      "Add focused characterization tests where important behavior lacks evidence.",
      "Design a sequence of small transformations, each compiling and independently verifiable.",
      "Move behavior toward the owning module, remove obsolete paths, and avoid premature generalization.",
      "Compare before/after structure and run focused plus broader regression checks.",
    ],
    output: [
      "Problem statement, preserved invariants, target boundary, and staged transformation plan.",
      "Behavior-preserving change with strengthened tests and no unrelated feature work.",
      "Before/after dependency explanation, verification, and intentionally deferred cleanup.",
    ],
    guardrails: [
      "Do not combine refactoring with semantic behavior changes unless inseparable and explicitly reviewed.",
      "Do not introduce a shared abstraction until stable common behavior and variation are demonstrated.",
      "Do not optimize for fewer files or lines at the expense of clear ownership.",
    ],
  }),
  defineSkill({
    id: "performance-investigation",
    description: "Profile a user-visible performance problem and validate the smallest effective optimization.",
    purpose:
      "Turn a vague speed or cost concern into a reproducible workload, attributed bottleneck, measured change, and regression guard.",
    inputs: [
      "Affected journey, metric/percentile, baseline, target budget, workload, and environment.",
      "Representative data and available traces, profiles, query plans, browser timings, or resource metrics.",
      "Correctness, accessibility, reliability, and cost constraints.",
    ],
    process: [
      "Make the workload repeatable and establish warm/cold, average/tail, and variance-aware baselines.",
      "Decompose end-to-end time/resources across client, network, application, database, and providers.",
      "Collect the narrowest profile or trace that can attribute the dominant cost.",
      "Rank hypotheses and run controlled experiments without changing multiple independent variables.",
      "Implement the smallest optimization and compare equivalent before/after runs, including correctness checks.",
      "Add a regression threshold and assess cache invalidation, capacity, cost, and operational consequences.",
    ],
    output: [
      "Reproducible benchmark/workload and baseline distribution.",
      "Bottleneck evidence, hypothesis results, and selected optimization rationale.",
      "Before/after metrics, correctness verification, regression guard, and trade-offs.",
    ],
    guardrails: [
      "Do not optimize from a single trace, average, or synthetic best-case result.",
      "Do not introduce unbounded caching or concurrency without invalidation and saturation behavior.",
      "Do not declare success when gains fall within baseline variance.",
    ],
  }),
  defineSkill({
    id: "release-readiness",
    description: "Verify a change is safe to release across behavior, security, data, operations, and recovery.",
    purpose:
      "Produce evidence for a release decision and a practical rollout/recovery plan, not a ceremonial checklist.",
    inputs: [
      "Release scope, acceptance criteria, diff/version range, target environments, and owners.",
      "Test/build results, migrations, configuration/secrets, dependencies, and known risks.",
      "Deployment method, observability, rollout controls, compatibility window, and recovery capabilities.",
    ],
    process: [
      "Reconcile shipped behavior with scope, acceptance criteria, non-goals, and public contract changes.",
      "Verify tests/build/types and inspect security, privacy, dependency, configuration, and secret impact.",
      "Review schema/data migrations, backfills, compatibility ordering, and rollback/forward recovery.",
      "Confirm health signals, dashboards/alerts, support/operator notes, ownership, and incident triggers.",
      "Define progressive rollout, smoke checks, decision thresholds, and explicit stop/recovery steps.",
      "Classify blockers, accepted risks, and post-release verification with named evidence/owners.",
    ],
    output: [
      "Go/no-go recommendation with blockers first and evidence links/commands.",
      "Rollout, smoke-test, monitoring, and rollback/forward recovery sequence.",
      "Accepted risks, owners, communication needs, and post-release checks.",
    ],
    guardrails: [
      "Do not mark an item ready based on intention or an unrun command.",
      "Do not recommend rollback when schema/data changes make it unsafe; define forward recovery instead.",
      "Do not bury a release blocker among low-severity observations.",
    ],
  }),
];
