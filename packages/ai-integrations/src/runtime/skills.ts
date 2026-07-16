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
    version: "1.1.0",
    activation: "passive",
    security: "content",
    fallback: "degrade",
    description: source.description,
    instructions: [
      `# ${source.id}`,
      "",
      "This skill is part of Misbah Khursheed's Build Like This workflow. Thinking, evidence, and explicit trade-offs come before generated output.",
      "",
      "## Project identity and sources of truth",
      "",
      "The repository where this skill is installed is the host project being built. Build Like This is the method used to build it; mstack only installs and reconciles method resources. Do not assume mstack or Build Like This is the product unless project-owned sources explicitly identify this repository as mstack itself.",
      "",
      "Use project-owned docs/, decisions, executable code, and tests as sources of truth. .mstack/templates/ are reference scaffolds to copy and adapt into project-owned documents, not product requirements and not a replacement for docs/.",
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
      "## Delegation and parallel safety",
      "",
      "- Material lifecycle work must delegate at least one bounded specialist lane when subagents are available. Prefer two or more concurrent lanes only for independent evidence gathering, analysis, or non-overlapping file ownership.",
      "- The active lead owns integration and acceptance. Supporting agents do not recursively delegate unless explicitly promoted to lead a named lane.",
      "- Assign distinct outputs and ownership. Serialize shared docs, contracts, schemas, migrations, deployments, external writes, and overlapping file edits.",
      "- When subagents are unavailable, perform the same named specialist passes sequentially and state that constraint instead of implying parallel verification.",
      "- Delegation never grants permission for outreach, consequential external actions, destructive changes, paid resources, or production operations.",
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
  defineSkill({
    id: "idea-validation",
    description: "Phase 1: research and test a product idea before committing to an MVP or solution scope.",
    purpose:
      "Reduce the largest uncertainty in a product idea with current, attributable evidence and a falsifiable validation step. This precedes plan-mvp: it decides whether and how the idea deserves product planning rather than defining the MVP itself.",
    inputs: [
      "The idea, suspected user/context and problem, origin of the hypothesis, constraints, and decision deadline.",
      "Any existing observations, research, analytics, alternatives, attempted solutions, or known contradictions.",
      "Authorized research channels and limits on browsing, outreach, paid sources, personal data, and experiments.",
    ],
    process: [
      "Have the product manager lead; delegate independent problem/context and alternative/market evidence lanes to product research and analysis specialists.",
      "State the falsifiable problem/value hypothesis, evidence standard, decision options, and what would disconfirm the idea.",
      "Gather dated, attributable sources across independent source classes; record methods, access dates, relevance, and limitations.",
      "Compare the current workaround, alternatives, switching costs, frequency/severity signals, feasibility constraints, and negative evidence.",
      "Separate facts, interpretations, assumptions, contradictions, and open questions; never label secondary evidence as direct user validation.",
      "Choose go/refine/stop and define the smallest authorized primary-research or experiment step with a predeclared threshold.",
    ],
    output: [
      "A project-owned discovery brief under docs/research/ using the discovery template, with citations and confidence labels.",
      "A ranked assumption/evidence ledger, alternatives map, and explicit go/refine/stop rationale.",
      "The next validation experiment or research plan with owner, ethics/permission boundary, threshold, and stop rule.",
    ],
    guardrails: [
      "Do not proceed directly to features or architecture merely because the idea is plausible.",
      "Do not fabricate users, sources, quotes, demand, market size, or validation confidence.",
      "Do not contact people or mutate an external system without explicit authorization.",
    ],
  }),
  defineSkill({
    id: "target-user-definition",
    description: "Phase 2: define a narrow target user and meaningful actors from evidence and decision-relevant differences.",
    purpose:
      "Turn a validated problem direction into an explicit primary segment, secondary actors, exclusions, and research gaps. This defines whom to study and serve; it does not write the complete product definition.",
    inputs: [
      "Validated idea/problem evidence, candidate users and contexts, alternatives, and affected actors.",
      "Behavioral, support, research, or market evidence with provenance and coverage limits.",
      "Geography, accessibility, authority, compliance, channel, language, device, and first-release constraints.",
    ],
    process: [
      "Have the product manager lead; delegate evidence synthesis and actor/context analysis to product and user researchers in parallel.",
      "Segment by differences in job, trigger, behavior, authority, constraints, workaround, consequence, or definition of success.",
      "Distinguish primary users, buyers, administrators, operators, approvers, subjects, and excluded users where roles differ.",
      "Compare segment pain, frequency, reachability, urgency, switching cost, risk, and evidence strength without inventing scores.",
      "Select one narrow primary segment and explain exclusions and secondary actors as first-release decisions, not permanent truths.",
      "Record weak evidence and design the next ethical sampling/recruitment step before claiming representativeness.",
    ],
    output: [
      "A target-user decision with primary segment, context, job, constraints, workarounds, success, and evidence citations.",
      "An actor map covering roles, authority, incentives, risks, and explicit first-release exclusions.",
      "A segment assumption/coverage ledger and the next research sampling plan.",
    ],
    guardrails: [
      "Do not use fictional biography or demographics that change no product decision.",
      "Do not call a stakeholder, buyer, operator, and end user interchangeable when their authority or outcomes differ.",
      "Do not claim population prevalence or representativeness without evidence.",
    ],
  }),
  defineSkill({
    id: "user-needs-research",
    description: "Phase 3: investigate target-user jobs, needs, workarounds, pain, and desired outcomes.",
    purpose:
      "Produce traceable, decision-changing evidence about what the selected users need and why. Unlike idea-validation, this studies the chosen segment in depth; unlike feature-design, it does not select a solution.",
    inputs: [
      "Primary segment and actor map, research decisions, prior evidence, and unresolved need assumptions.",
      "Authorized research data or access: interviews, observations, support records, analytics, surveys, or usability evidence.",
      "Consent, privacy, retention, accessibility, recruitment, outreach, and representation constraints.",
    ],
    process: [
      "Have the user researcher lead; delegate existing-evidence analysis and research-instrument/coverage review as separate lanes.",
      "Define decisions, questions, sampling plan, disconfirming cases, method, consent, data handling, and stopping criteria.",
      "Investigate triggers, jobs, current steps, workarounds, frequency, severity, consequences, authority, constraints, and success language.",
      "Keep raw observations and direct quotes traceable; distinguish behavior from stated preference and researcher interpretation.",
      "Cluster recurring patterns, compare negative/edge cases and actor differences, and label confidence and coverage limitations.",
      "Prioritize needs by evidence and user consequence, then hand off opportunity statements rather than requested feature lists.",
    ],
    output: [
      "A dated project-owned research plan and/or synthesis under docs/research/ with method, sources, consent limits, and coverage.",
      "Evidence-backed jobs, needs, workarounds, pain patterns, desired outcomes, negative cases, and confidence labels.",
      "Prioritized opportunity statements, unresolved assumptions, and the next validation step.",
    ],
    guardrails: [
      "Do not invent participants, quotes, observations, prevalence, consent, or research findings.",
      "Do not conduct outreach, recording, or personal-data collection without explicit authorization and safeguards.",
      "Do not convert feature requests directly into needs without understanding context and desired outcome.",
    ],
  }),
  defineSkill({
    id: "feature-design",
    description: "Phase 4: turn validated needs into a minimal, coherent capability and user journey before implementation planning.",
    purpose:
      "Choose and design the smallest product capability likely to improve a validated need. This establishes product behavior and interaction intent; feature-planning later turns an agreed capability into implementation-ready slices.",
    inputs: [
      "Validated users, prioritized needs, evidence/assumptions, desired outcome, constraints, and non-goals.",
      "Existing product behavior, design system/platform patterns, accessibility target, and relevant technical constraints.",
      "Actor/permission implications, sensitive-data concerns, operational limits, and success measures.",
    ],
    process: [
      "Have the product manager lead; delegate alternative journey design to the product designer and feasibility/risk review to relevant engineering or security specialists.",
      "Define the user outcome and evaluation criteria before generating alternative capabilities or flows.",
      "Compare alternatives by need fit, behavior change, complexity, accessibility, risk, reversibility, and learning value.",
      "Select the narrowest coherent end-to-end journey and specify success, loading, empty, validation, denial, degraded, failure, and recovery states.",
      "Identify actor/permission, data, contract, security, content, instrumentation, and operational questions without inventing implementation.",
      "Prototype and test the riskiest interaction or assumption at the lowest useful fidelity, then document the selected behavior and non-goals.",
    ],
    output: [
      "A selected capability and alternative rationale mapped to validated needs and measurable outcome.",
      "A complete journey/state design with actor, accessibility, failure/recovery, content, and contract questions.",
      "Behavioral acceptance criteria, prototype/evidence results, non-goals, and implementation-planning handoff.",
    ],
    guardrails: [
      "Do not treat a polished screen or common pattern as evidence of need fit.",
      "Do not make interface checks the source of truth for authorization or business invariants.",
      "Do not expand the first slice with speculative personalization, platform work, or adjacent personas.",
    ],
  }),
  defineSkill({
    id: "product-definition",
    description: "Phase 5: consolidate validated product intent into the authoritative product definition and measurable release boundary.",
    purpose:
      "Write or update docs/product.md so users, problem, evidence, outcome, scope, non-goals, constraints, journey, metrics, and acceptance criteria constrain architecture and delivery. Unlike improve-documentation, this makes product decisions rather than polishing prose.",
    inputs: [
      "Idea, user, needs, and feature decisions with evidence, confidence, alternatives, and unresolved assumptions.",
      "Current docs/product.md, docs/features.md or feature specs, shipped behavior, and relevant project constraints.",
      "Metric definitions, baseline availability, privacy/accessibility requirements, owners, and validation window.",
    ],
    process: [
      "Have the product manager lead; delegate evidence-consistency and metric-operability checks to research and product-analysis specialists.",
      "Reconcile current project documents and shipped behavior; surface conflicts instead of silently selecting a convenient source.",
      "Define the primary user/problem, evidence and assumptions, observable outcome, first-release scope, non-goals, and excluded users.",
      "Specify the complete journey, policy constraints, actor implications, acceptance criteria, and user-safe failure/recovery behavior.",
      "Define each success/guardrail metric by formula, source, population, baseline, target, window, owner, and decision threshold.",
      "Update project-owned product/feature docs, record unresolved consequential decisions, and gate architecture on sufficient product clarity.",
    ],
    output: [
      "An authoritative docs/product.md update and any necessary feature-index/spec update describing the decided behavior.",
      "Traceability from evidence and user need to scope, non-goals, journey, acceptance criteria, and measurable outcomes.",
      "A product-to-architecture handoff with constraints, assumptions, decision owners, and explicit remaining gates.",
    ],
    guardrails: [
      "Do not fill missing evidence, baselines, owners, or policy decisions with plausible prose.",
      "Do not prescribe frameworks, databases, folder trees, or internal components in product.md.",
      "Do not advance an unvalidated idea to architecture without labeling the risk and decision gate.",
    ],
  }),
  defineSkill({
    id: "architecture-design",
    description: "Phase 6: design implementation-ready system boundaries, contracts, data ownership, security, and operations.",
    purpose:
      "Translate an agreed product definition into the smallest justified architecture and consequential decision records. Unlike architecture-assessment, this creates or changes a design rather than reviewing the current one.",
    inputs: [
      "Defined product outcomes, scope/non-goals, journeys, acceptance criteria, constraints, load/SLO assumptions, and risks.",
      "Current docs/architecture.md, ADRs, repository modules, contracts, data, deployment behavior, and incidents.",
      "Security/privacy/compliance, accessibility dependencies, cost, team, compatibility, and recovery constraints.",
    ],
    process: [
      "Have the software architect lead; delegate data, security, and deployment/operability analysis to their owning specialists in parallel.",
      "Map actors, trust boundaries, components, ownership, data, critical flows, external effects, and current constraints from evidence.",
      "Compare the smallest viable options, preferring a modular monolith and explicit adapters until measured requirements justify more deployables.",
      "Define module ownership/dependency direction, public contracts, schemas, authorization, state transitions, failure behavior, and transaction boundaries.",
      "Design deployment, configuration, observability, migration, capacity triggers, rollback/forward recovery, and security controls.",
      "Update docs/architecture.md and record consequential choices in an ADR with alternatives, consequences, validation, and revisit triggers.",
    ],
    output: [
      "An implementation-ready architecture update with components, ownership, data flows, contracts, trust boundaries, and failure behavior.",
      "Required API/schema/permission/migration/operational decisions and an ADR for consequential choices.",
      "A sequenced engineering handoff with verification, rollout/recovery expectations, risks, and revisit triggers.",
    ],
    guardrails: [
      "Do not select technology or add services, queues, caches, or generic layers without a requirement-linked reason.",
      "Do not expose database or vendor SDK types as domain/public contracts.",
      "Do not hide unresolved product, data, security, or operational decisions behind diagrams.",
    ],
  }),
  defineSkill({
    id: "backend-delivery",
    description: "Phase 7: deliver the agreed backend vertical slice with validated contracts, permissions, persistence, and recovery.",
    purpose:
      "Implement server-owned behavior after product and architecture decisions are defined. Unlike build-feature, this is the backend phase and stops at stable contracts and server behavior ready for frontend integration.",
    inputs: [
      "Approved feature behavior, architecture, actors/permissions, state transitions, API/event contracts, errors, and acceptance criteria.",
      "Relevant backend modules, schemas/migrations, tests, provider adapters, compatibility, and operational requirements.",
      "Authorization, privacy, idempotency/concurrency, latency, reliability, rollout, and recovery constraints.",
    ],
    process: [
      "Have the backend engineer lead; delegate database, security, and independent contract/test lanes, adding AI review only for AI boundaries.",
      "Reconcile the agreed contract with current behavior and update project-owned feature/architecture sources before implementation if decisions changed.",
      "Define runtime-validated requests/responses/errors, resource authorization, invariants, transaction boundaries, and compatibility before handlers.",
      "Implement domain/application behavior through owning interfaces, then connect persistence and provider adapters with timeouts and bounded recovery.",
      "Add structured redacted observability and test success, limits, malformed input, denial, duplicates/concurrency, dependency failure, and recovery.",
      "Run focused and package-level type, lint, test, and production-build checks; document configuration, migration order, rollout, and frontend contract handoff.",
    ],
    output: [
      "A narrow backend implementation with stable validated contracts, explicit permissions/errors, and preserved compatibility.",
      "Unit, integration, contract, security, and recovery evidence proportionate to the changed risks.",
      "Frontend integration examples plus migration, observability, rollout, recovery, and residual-risk notes.",
    ],
    guardrails: [
      "Do not place domain rules in HTTP handlers, ORM models, jobs, or provider callbacks.",
      "Do not let clients enforce server-owned authorization, financial state, or durable invariants.",
      "Do not change a public contract or applied migration history without a compatible documented path.",
    ],
  }),
  defineSkill({
    id: "frontend-delivery",
    description: "Phase 8: deliver the accessible frontend journey against the agreed server contract and complete state model.",
    purpose:
      "Implement the designed user journey after backend contracts are stable or faithfully mocked. This owns browser behavior and integration; it does not redefine server-owned policy or generic cross-stack scope.",
    inputs: [
      "Approved journey/prototype, content, state model, accessibility target, responsive/device requirements, and acceptance criteria.",
      "Typed backend contract or faithful mock with authentication, authorization, validation, errors, pagination, and degraded behavior.",
      "Existing design system, frontend architecture, browser support, performance budgets, tests, and rollout constraints.",
    ],
    process: [
      "Have the frontend engineer lead; delegate design/accessibility, independent journey testing, and performance review as bounded lanes.",
      "Trace the complete journey and separate server state, form state, URL state, and local presentation state before components.",
      "Implement semantic, keyboard-accessible, responsive behavior for loading, empty, success, validation, denial, degraded, failure, and recovery states.",
      "Integrate only against the agreed contract; surface contract conflicts rather than duplicating server policy or silently reshaping payloads.",
      "Verify focus, screen-reader semantics, contrast, reduced motion, slow/offline/dependency behavior, performance, and critical cross-browser journeys.",
      "Run focused and package-level type, lint, test, and production-build checks; record contract assumptions and release handoff.",
    ],
    output: [
      "A complete accessible frontend journey with deliberate state ownership and faithful server integration.",
      "Component/integration/end-to-end, accessibility, degraded-network, and performance verification evidence.",
      "Contract discrepancies, browser/device limitations, rollout implications, and residual risks.",
    ],
    guardrails: [
      "Do not make client code the source of truth for permissions, critical state, pricing, or business invariants.",
      "Do not omit non-happy-path states or replace semantic platform behavior with inaccessible custom controls.",
      "Do not add animation unless it improves comprehension and respects reduced-motion preferences.",
    ],
  }),
  defineSkill({
    id: "deployment-delivery",
    description: "Phase 9: execute an explicitly authorized, progressive product release with gates, observability, and recovery.",
    purpose:
      "Coordinate and perform the release after release-readiness evidence exists. Unlike release-readiness, this skill changes authorized environment state and therefore requires an exact target, accountable owners, stop conditions, and recovery path.",
    inputs: [
      "Explicit authorization for the named environment and operations, release artifact/scope, owners, window, and communication channel.",
      "Successful acceptance/build/test/security/readiness evidence, configuration, migrations, dependencies, and compatibility matrix.",
      "Deployment runbook, feature controls, health/metrics/alerts, smoke tests, stop thresholds, and rollback/forward-recovery plan.",
    ],
    process: [
      "Have the release manager lead; run test, security, DevOps, and conditional database evidence lanes in parallel before any mutation.",
      "Confirm exact environment authorization, artifact identity, owners, dependency health, backups/recovery, and no unresolved blockers.",
      "Publish and rehearse the serialized migration/deployment/feature-control sequence with smoke checks, communication, stop conditions, and decision authority.",
      "Execute only the authorized actions stage by stage; record versions, timestamps, results, observations, and approval at each gate.",
      "Monitor user and system guardrails through progressive exposure; stop and recover immediately when a declared threshold is crossed.",
      "Complete post-release verification, incident/support handoff, release record, residual-risk ownership, and measurement review date.",
    ],
    output: [
      "A go/no-go and authorization record tied to an exact artifact, target, evidence, owners, and accepted risks.",
      "An executed release record with stage results, smoke tests, observability, decisions, communications, and any recovery actions.",
      "Post-release product/system checks, residual risks, owners, and the improvement-phase measurement handoff.",
    ],
    guardrails: [
      "Do not infer production authorization from repository access, a generic request, or a passing readiness review.",
      "Do not parallelize migrations, deploys, or shared-state actions whose ordering affects compatibility or recovery.",
      "Do not expose secrets or roll back across incompatible data changes; use the documented safe recovery path.",
    ],
  }),
  defineSkill({
    id: "continuous-improvement",
    description: "Phase 10: measure released outcomes, learn from evidence, and select the smallest justified next change.",
    purpose:
      "Close the lifecycle loop by comparing actual user and operational outcomes with predeclared goals and guardrails. This chooses the next evidence-backed product action; it is broader than code cleanup, documentation, or performance tuning.",
    inputs: [
      "Product outcome, metric contracts, baseline/target/window, release scope/date, hypotheses, guardrails, and decision thresholds.",
      "Validated product analytics, user research/support evidence, incidents, reliability/performance/cost/security signals, and data-quality checks.",
      "Known segment changes, rollout exposure, confounders, qualitative feedback, residual risks, and available capacity.",
    ],
    process: [
      "Have the product manager lead; delegate metric/data-quality analysis to the product analyst and affected user, test, security, performance, or operations lanes.",
      "Revalidate metric definitions, instrumentation quality, exposure, baseline comparability, missingness, and guardrail integrity before interpreting results.",
      "Compare outcome and diagnostic measures by relevant segment and window, alongside qualitative evidence and operational consequences.",
      "Explain plausible causes and uncertainty; distinguish adoption, usability, value, reliability, and measurement failures.",
      "Choose continue/refine/expand/stop, rank opportunities by evidence and outcome impact, and select one smallest next experiment or vertical slice.",
      "Update project-owned product/feature/research/experiment artifacts, acceptance criteria, owner, threshold, and review date for the next loop.",
    ],
    output: [
      "A project-owned outcome review with trustworthy metrics, qualitative evidence, guardrails, uncertainty, and segment context.",
      "A continue/refine/expand/stop decision with causal hypotheses, accepted risks, and evidence-linked rationale.",
      "One prioritized next experiment or slice with owner, scope/non-goals, acceptance threshold, verification, and review date.",
    ],
    guardrails: [
      "Do not invent missing telemetry, causal certainty, user consensus, or statistical significance.",
      "Do not optimize a proxy while user harm, reliability, security, privacy, accessibility, or cost guardrails regress.",
      "Do not turn adjacent cleanup ideas into roadmap scope without a demonstrated outcome or maintenance need.",
    ],
  }),
];
