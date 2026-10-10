import type { SkillDefinition } from "../types.js";

interface PrincipleSource {
  readonly id: string;
  readonly description: string;
  readonly rule: string;
  readonly why: string;
  readonly applyWhen: string;
  readonly doNot: string;
}

function definePrinciple(source: PrincipleSource): SkillDefinition {
  return {
    id: source.id,
    version: "1.1.0",
    activation: "explicit",
    security: "content",
    fallback: "degrade",
    description: source.description,
    constraints: { kind: "principle" },
    instructions: [
      `# ${source.id}`,
      "",
      source.rule,
      "",
      `**When:** ${source.applyWhen}`,
      "",
      `**Why:** ${source.why}`,
      "",
      `**Do not:** ${source.doNot}`,
      "",
      "Cite this principle by id when it changed a decision. Keep the citation specific.",
    ].join("\n"),
  };
}

/** Tiny named rules cited by playbooks and `/mstack`. Keep each leaf short. */
export const principleSkills: readonly SkillDefinition[] = [
  definePrinciple({
    id: "prove-it-works",
    description: "Verify against the real artifact before claiming done.",
    rule: "Check the real result: run the failing path, read the stored value, inspect the diff, or capture the journey. Proxies and 'it compiles' are not proof.",
    why: "Unverified work has unknown correctness. Indirect signals feel cheap and hide the failure.",
    applyWhen: "Before declaring done, opening a PR, or reporting a fix.",
    doNot: "Treat green unit tests alone as proof that a user-visible defect is gone.",
  }),
  definePrinciple({
    id: "fix-root-causes",
    description: "Trace symptoms to the violated invariant; ship the smallest causal fix.",
    rule: "Reproduce first, separate observation from guess, and keep asking why until the mechanism is confirmed. Ship only the change that evidence justifies.",
    why: "Symptom patches accumulate debt and often reintroduce the same failure nearby.",
    applyWhen: "Debugging, regressions, flaky tests, or repeated 'maybe this helps' edits.",
    doNot: "Claim root cause from correlation alone, or leave speculative belt-and-suspenders patches.",
  }),
  definePrinciple({
    id: "guard-the-context-window",
    description: "Keep the lead thread lean; push bulk work into bounded subagents.",
    rule: "Summaries, decisions, and ownership stay in the lead. Large reads, fan-out, and noisy logs go to subagents that return short evidence.",
    why: "A crowded context makes the agent slower and less reliable on the next hard decision.",
    applyWhen: "Large files, broad searches, parallel investigation, or long autonomous runs.",
    doNot: "Paste entire logs or duplicate full skill bodies into the lead thread.",
  }),
  definePrinciple({
    id: "never-block-on-the-human",
    description: "Proceed on reversible work; ask only for irreversible or preference calls.",
    rule: "Discover what you can. Label assumptions. Ask only when the answer would change a consequential, irreversible, or preference-owned decision.",
    why: "Most stalls are discoverable. Blocking burns wall time without reducing risk.",
    applyWhen: "Tempted to ask permission for a reversible edit, naming choice, or local experiment.",
    doNot: "Ask 'should I continue?' on work the finish condition already authorizes.",
  }),
  definePrinciple({
    id: "encode-lessons-in-structure",
    description: "Turn repeated verbal guidance into checks, types, docs, or scripts.",
    rule: "If you write the same instruction twice, encode it where the next agent or human will hit it: lint, test, schema, ADR, or task recipe.",
    why: "Prose fades; structure keeps teaching after the chat ends.",
    applyWhen: "A mistake recurs, a review comment repeats, or a playbook step keeps being skipped.",
    doNot: "Add more reminder text when a mechanical guard would catch the same failure.",
  }),
  definePrinciple({
    id: "thinking-before-typing",
    description: "Define outcome, evidence, and boundaries before generating implementation.",
    rule: "Restate the user outcome, scope, non-goals, and acceptance criteria first. Code comes after the decision is visible.",
    why: "Generation speed makes unexamined ideas look finished. Writing exposes disagreement while change is cheap.",
    applyWhen: "Starting a feature, refactor, or any material product change.",
    doNot: "Open with a scaffold or rewrite when the outcome is still conversational.",
  }),
  definePrinciple({
    id: "user-before-feature",
    description: "Start from the user's current difficulty, not an exciting capability.",
    rule: "Name who hurts, what they do today, and what better looks like before proposing features or models.",
    why: "Features are candidates. Value is evidence that a user outcome improved.",
    applyWhen: "Scoping MVP, adding AI, or expanding beyond a thin slice.",
    doNot: "Treat competitor checklists or demo appeal as product evidence.",
  }),
  definePrinciple({
    id: "contracts-before-clients",
    description: "Stabilize backend behavior before frontend integration.",
    rule: "Define requests, responses, errors, permissions, and state transitions first. Clients consume the contract; they do not invent it.",
    why: "Implied contracts force every interface to guess, especially under parallel agents.",
    applyWhen: "Any API, data, or permission change with more than one consumer.",
    doNot: "Let UI state become the source of truth for authorization or durable rules.",
  }),
  definePrinciple({
    id: "smallest-complete-slice",
    description: "Ship the narrowest vertical slice that proves useful behavior.",
    rule: "Prefer one complete path with real failure states over a wide partial surface.",
    why: "Partial platforms hide whether the product works. Vertical proof teaches faster.",
    applyWhen: "Planning delivery order or resisting speculative infrastructure.",
    doNot: "Build shared frameworks for a single unproven journey.",
  }),
  definePrinciple({
    id: "validate-every-boundary",
    description: "Treat external input as untrusted and validate once at the edge.",
    rule: "HTTP, files, webhooks, config, model output, retrieved text, and tool results are untrusted until validated.",
    why: "Types disappear at runtime and external systems fail outside the happy path.",
    applyWhen: "Handlers, adapters, MCP tools, prompts, or any ingress of foreign data.",
    doNot: "Trust provider shapes, agent output, or cached snapshots without checks.",
  }),
  definePrinciple({
    id: "evidence-over-optimism",
    description: "Optimize and extract complexity only with measured need.",
    rule: "Record the budget, measure the bottleneck, then make the smallest change that moves the number.",
    why: "Speculative caches and services add operational cost before the product earns them.",
    applyWhen: "Performance work, scaling proposals, or 'we might need' infrastructure.",
    doNot: "Add distributed complexity to look production-ready.",
  }),
  definePrinciple({
    id: "reversible-by-default",
    description: "Prefer decisions that are easy to undo, migrate, or roll forward.",
    rule: "Use additive migrations, explicit adapters, and small slices. Record exceptions that are expensive to reverse.",
    why: "Change is ordinary. The cost of a design is largely the cost of changing it.",
    applyWhen: "Schema, API, provider, or deployment choices.",
    doNot: "Burn the boats for convenience on an unvalidated path.",
  }),
  definePrinciple({
    id: "make-failure-observable",
    description: "Failures must be visible, bounded, and recoverable.",
    rule: "Use identifiers, actionable errors, timeouts, bounded retries, and a stated user/operator path. Never log secrets or needless personal data.",
    why: "Silent failure only moves complexity into support and data repair.",
    applyWhen: "Jobs, payments, external writes, or any path that can leave partial state.",
    doNot: "Swallow errors or retry forever without idempotency and a stop condition.",
  }),
  definePrinciple({
    id: "name-the-trade-off",
    description: "Every consequential choice needs a reason a stranger can audit.",
    rule: "Say what was chosen, what was rejected, and what evidence or constraint decided it. Use an ADR when the cost of reversing is high.",
    why: "'Best practice' and 'the model suggested it' are not product constraints.",
    applyWhen: "PRs, architecture changes, security/data decisions, or new operational systems.",
    doNot: "Hide scope or risk inside an implementation that 'just works'.",
  }),
];
