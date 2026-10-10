import type { SkillDefinition } from "../types.js";
import { playbookSkills } from "./playbooks.js";
import { principleSkills } from "./principles.js";

function playbookTitle(instructions: string, fallback: string): string {
  return instructions.match(/^# (.+)$/m)?.[1] ?? fallback;
}

function playbookMatchLine(instructions: string): string {
  const matchSection = instructions.split("## Match\n\n")[1] ?? "";
  return matchSection.split("\n\n")[0]?.trim() ?? "";
}

/** Compact router table: id + match cue only. Details live in playbook leaves. */
const playbookRoutes = playbookSkills
  .map((skill) => {
    const title = playbookTitle(skill.instructions, skill.id);
    const match = playbookMatchLine(skill.instructions);
    return `- \`${skill.id}\` (${title}) — ${match}`;
  })
  .join("\n");

const principleIds = principleSkills.map((skill) => `\`${skill.id}\``).join(", ");

/** Richer help index keeps one-line descriptions. */
const playbookHelpRoutes = playbookSkills
  .map((skill) => `- \`${skill.id}\` — ${playbookTitle(skill.instructions, skill.id)}: ${skill.description}`)
  .join("\n");

const principleHelpIndex = principleSkills
  .map((skill) => `- \`${skill.id}\` — ${skill.description}`)
  .join("\n");

function defineWorkflowSkill(source: {
  readonly id: string;
  readonly description: string;
  readonly instructions: string;
  readonly sticky?: boolean;
}): SkillDefinition {
  return {
    id: source.id,
    version: "1.1.0",
    activation: "explicit",
    security: "content",
    fallback: "degrade",
    description: source.description,
    constraints: {
      kind: "workflow",
      "disable-model-invocation": true,
      ...(source.sticky
        ? {
            mode: true,
            icon: "rocket",
            color: "brand",
          }
        : {}),
    },
    instructions: source.instructions.trim(),
  };
}

/** Router and help entry points installed as `/mstack` and `/mstack-help`. */
export const workflowSkills: readonly SkillDefinition[] = [
  defineWorkflowSkill({
    id: "mstack",
    sticky: true,
    description:
      "Route engineering work through an evidence-gated mstack playbook. Use for /mstack, sticky Custom Mode, or Build Like This delivery.",
    instructions: `
# mstack

You are the mstack workflow router for this repository. Classify intent, pick one playbook, copy its steps into the todo list, then execute. Prefer installed playbook and principle skills by id over restating them.

## Prompt shape

Normalize the user message into four fields (one sentence each is enough):

1. **Goal** — what is wrong or what should exist
2. **Finish condition** — a check that can pass or fail
3. **Evidence** — the proof the user wants to see
4. **Constraints** — hard limits (repro first, read-only, no merge, etc.)

If the finish condition is missing, derive a strict default from the playbook and state it. Do not invent product behavior to fill consequential ambiguity; label the assumption or stop.

## Route

Say \`new task\` or a clear subject change → re-match from scratch.
Otherwise continue the active playbook unless the user redirects.

Pick exactly one:

${playbookRoutes}

Ambiguous large work → ask one multiple-choice among the closest two playbooks, or default to \`playbook-investigation\` when the user forbids edits.
Lifecycle product work that is really phase research/definition may hand off to the matching lifecycle prompt after the first evidence gate, but still start from a playbook todo list.

## Execute

1. Load the chosen \`playbook-*\` skill and copy its **Steps** into todos word for word.
2. Cite principles by id only after loading that leaf. Available: ${principleIds}.
3. Keep the lead thread lean (\`guard-the-context-window\`). Fan out only for independent evidence or non-overlapping files.
4. Do not block on reversible work (\`never-block-on-the-human\`).
5. Finish only with proof against the finish condition (\`prove-it-works\`).

## Sticky mode

Where the tool supports Custom Modes, \`/mstack\` + Option/Alt+Enter (or Use as Mode) keeps this router attached every turn. Otherwise invoke \`/mstack\` at the start of each material task.

## Reply

Playbook id, finish condition, todo progress, verification evidence, residual risk. Skipped steps show \`skip: <reason>\`.
`.trim(),
  }),
  defineWorkflowSkill({
    id: "mstack-help",
    description: "Explain mstack workflow routing, playbooks, and principles without starting the work.",
    instructions: `
# mstack-help

Answer how to use mstack workflow resources. Do not start the engineering work unless the user clearly asked you to execute.

## What to return

1. A short answer
2. A copy-pasteable \`/mstack ...\` prompt when useful
3. The playbook or principle ids to trust for details

## Map

- Setup / install / regenerate → tell them to run \`mstack ai setup\` (and \`mstack validate --strict\` after). Workflow skills install through the core runtime.
- Start work → \`/mstack\` with goal + finish condition + evidence + constraints. Sticky Custom Mode where supported.
- Read-only question → \`playbook-investigation\`
- Bug / regression → \`playbook-bug-fix\` (reproduce first)
- Slow / metric → \`playbook-perf-hillclimb\`
- New behavior → \`playbook-feature\`
- Structure only → \`playbook-refactor\`
- Spike / decide → \`playbook-prototype\`
- Open PR / ship → \`playbook-shipping\`
- CI / review threads → \`playbook-babysit-pr\`
- Unattended long run → \`playbook-autonomous-run\`
- Parallel lanes → \`playbook-orchestrate\`
- Named principle → load that principle skill; do not paraphrase another project's wording

## Playbooks

${playbookHelpRoutes}

## Principles

${principleHelpIndex}

If the message is actually a work request ("fix this bug with mstack"), switch to \`mstack\` and say once that sticky Custom Mode keeps the router on.
`.trim(),
  }),
];
