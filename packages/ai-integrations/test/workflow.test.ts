import assert from "node:assert/strict";
import { test } from "node:test";
import { renderStandardSkill } from "../src/adapters/shared.js";
import {
  createBuildLikeThisRuntime,
  createDefaultRegistry,
  createIntegrationPlan,
  playbookSkills,
  principleSkills,
  workflowSkills,
} from "../src/index.js";

test("principle skills stay short and citeable by id", () => {
  const required = [
    "prove-it-works",
    "fix-root-causes",
    "guard-the-context-window",
    "never-block-on-the-human",
    "encode-lessons-in-structure",
    "thinking-before-typing",
    "user-before-feature",
    "contracts-before-clients",
    "smallest-complete-slice",
    "validate-every-boundary",
    "evidence-over-optimism",
    "reversible-by-default",
    "make-failure-observable",
    "name-the-trade-off",
  ];
  assert.deepEqual(
    principleSkills.map((skill) => skill.id).sort(),
    [...required].sort(),
  );
  for (const skill of principleSkills) {
    assert.equal(skill.constraints?.kind, "principle");
    assert.ok(skill.instructions.length < 1_200, `${skill.id} is too long for a principle leaf`);
    assert.ok(skill.instructions.length > 180, `${skill.id} is empty`);
    assert.match(skill.instructions, /\*\*When:\*\*/);
    assert.match(skill.instructions, /\*\*Why:\*\*/);
    assert.match(skill.instructions, /\*\*Do not:\*\*/);
    assert.doesNotMatch(skill.instructions, /## Delegation and parallel safety/);
  }
});

test("playbooks encode goal, finish condition, evidence, constraints, and todo steps", () => {
  const required = [
    "playbook-bug-fix",
    "playbook-investigation",
    "playbook-perf-hillclimb",
    "playbook-feature",
    "playbook-refactor",
    "playbook-prototype",
    "playbook-shipping",
    "playbook-babysit-pr",
    "playbook-autonomous-run",
    "playbook-orchestrate",
  ];
  assert.deepEqual(
    playbookSkills.map((skill) => skill.id).sort(),
    [...required].sort(),
  );
  for (const skill of playbookSkills) {
    assert.equal(skill.constraints?.kind, "playbook");
    assert.match(skill.instructions, /## Prompt shape/);
    assert.match(skill.instructions, /\*\*Goal:\*\*/);
    assert.match(skill.instructions, /\*\*Finish condition:\*\*/);
    assert.match(skill.instructions, /\*\*Evidence:\*\*/);
    assert.match(skill.instructions, /\*\*Constraints:\*\*/);
    assert.match(skill.instructions, /Copy these steps into the todo list word for word/);
    assert.match(skill.instructions, /## Principles to cite by name/);
    assert.ok(skill.instructions.length < 3_500, `${skill.id} is drifting toward a token bomb`);
  }
  assert.match(playbookSkills.find((skill) => skill.id === "playbook-bug-fix")!.instructions, /Reproduce/);
  assert.match(
    playbookSkills.find((skill) => skill.id === "playbook-perf-hillclimb")!.instructions,
    /baseline/i,
  );
});

test("mstack router and help skills classify, select playbooks, and support sticky mode metadata", () => {
  const router = workflowSkills.find((skill) => skill.id === "mstack");
  const help = workflowSkills.find((skill) => skill.id === "mstack-help");
  assert.ok(router);
  assert.ok(help);
  assert.equal(router.constraints?.kind, "workflow");
  assert.equal(router.constraints?.mode, true);
  assert.equal(router.constraints?.["disable-model-invocation"], true);
  assert.match(router.instructions, /Finish condition/);
  assert.match(router.instructions, /playbook-bug-fix/);
  assert.match(router.instructions, /playbook-orchestrate/);
  assert.match(router.instructions, /prove-it-works/);
  assert.match(router.instructions, /Custom Modes/);
  assert.match(help.instructions, /mstack ai setup/);
  assert.match(help.instructions, /Do not start the engineering work/);

  const rendered = renderStandardSkill(router);
  assert.match(rendered, /disable-model-invocation: true/);
  assert.match(rendered, /mode: true/);
  assert.match(rendered, /icon: "rocket"/);
  assert.match(rendered, /color: "brand"/);
});

test("workflow skills install through every adapter skill surface", () => {
  const runtime = createBuildLikeThisRuntime({ projectName: "Workflow" });
  const plan = createIntegrationPlan(
    createDefaultRegistry(),
    runtime,
    createDefaultRegistry().list().map((adapter) => adapter.id),
  );
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".agents/skills/mstack/SKILL.md"));
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".agents/skills/mstack-help/SKILL.md"));
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".agents/skills/prove-it-works/SKILL.md"));
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".agents/skills/playbook-bug-fix/SKILL.md"));
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".claude/skills/mstack/SKILL.md"));
  assert.match(runtime.instructions?.content ?? "", /Workflow router/);
  assert.match(runtime.instructions?.content ?? "", /\/mstack/);
});
