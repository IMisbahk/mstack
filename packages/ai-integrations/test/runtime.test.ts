import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import {
  applyIntegrationPlan,
  approveIntegrationPlan,
  createBuildLikeThisRuntime,
  createDefaultRegistry,
  createIntegrationPlan,
  createReconciliationPlan,
  engineeringAgents,
  engineeringHooks,
  engineeringPrompts,
  engineeringSkills,
  hookAssets,
  inspectIntegrationRepository,
  runtimeTemplates,
} from "../src/index.js";

test("runtime ships a focused, structurally complete engineering library", () => {
  assert.equal(engineeringAgents.length, 19);
  assert.equal(engineeringSkills.length, 20);
  assert.equal(engineeringPrompts.length, 19);
  assert.equal(engineeringHooks.length, 4);
  assert.equal(runtimeTemplates.length, 10);
  assert.ok(runtimeTemplates.every((item) => item.feature === "templates"));
  assert.ok(
    [...engineeringAgents, ...engineeringSkills, ...engineeringPrompts, ...runtimeTemplates].every(
      (item) => item.version === "1.1.0",
    ),
  );

  const allIds = [
    ...engineeringAgents.map((item) => item.id),
    ...engineeringSkills.map((item) => item.id),
    ...engineeringPrompts.map((item) => item.id),
    ...engineeringHooks.map((item) => item.id),
  ];
  assert.equal(new Set(allIds).size, allIds.length, "runtime component ids must be globally unique");

  const agentSections = [
    "## Project identity and sources of truth",
    "## Responsibility",
    "## Strict boundaries",
    "## Engineering philosophy",
    "## Preferred workflow",
    "## Expected inputs",
    "## Expected outputs",
    "## Delegation and parallel safety",
  ];
  for (const agent of engineeringAgents) {
    assert.ok(agent.instructions.length > 1_500, `${agent.id} is too shallow`);
    for (const section of agentSections) assert.match(agent.instructions, new RegExp(section));
  }

  for (const skill of engineeringSkills) {
    assert.ok(skill.instructions.length > 1_500, `${skill.id} is too shallow`);
    for (const section of [
      "## Project identity and sources of truth",
      "## Required inputs",
      "## Process",
      "## Output contract",
      "## Guardrails",
      "## Delegation and parallel safety",
    ]) {
      assert.match(skill.instructions, new RegExp(section));
    }
  }

  for (const prompt of engineeringPrompts) {
    assert.ok(prompt.prompt.length > 1_400, `${prompt.id} is too shallow`);
    assert.match(prompt.prompt, /Discover local instructions/);
    assert.match(prompt.prompt, /exact verification evidence/);
    assert.match(prompt.prompt, /## Project identity and sources of truth/);
    assert.match(prompt.prompt, /## Delegation and parallel safety/);
    assert.ok(prompt.argumentHint);
  }
});

test("runtime maps all ten lifecycle phases to distinct skills, prompts, and accountable leads", () => {
  const phases = [
    ["idea-validation", "research-idea", "product-manager"],
    ["target-user-definition", "identify-target-users", "product-manager"],
    ["user-needs-research", "research-user-needs", "user-researcher"],
    ["feature-design", "design-features", "product-manager"],
    ["product-definition", "write-product-definition", "product-manager"],
    ["architecture-design", "design-architecture", "software-architect"],
    ["backend-delivery", "build-backend", "backend-engineer"],
    ["frontend-delivery", "build-frontend", "frontend-engineer"],
    ["deployment-delivery", "deploy-product", "release-manager"],
    ["continuous-improvement", "improve-product", "product-manager"],
  ] as const;

  for (const [skillId, promptId, leadId] of phases) {
    const skill = engineeringSkills.find((item) => item.id === skillId);
    const prompt = engineeringPrompts.find((item) => item.id === promptId);
    assert.ok(skill, `missing lifecycle skill ${skillId}`);
    assert.ok(prompt, `missing lifecycle prompt ${promptId}`);
    assert.ok(engineeringAgents.some((item) => item.id === leadId), `missing lead ${leadId}`);
    assert.match(prompt.prompt, new RegExp(skillId));
    assert.match(prompt.prompt, new RegExp(leadId));
  }

  for (const id of [
    "workflow-coordinator",
    "product-researcher",
    "user-researcher",
    "product-designer",
    "test-engineer",
    "product-analyst",
    "release-manager",
  ]) {
    assert.ok(engineeringAgents.some((item) => item.id === id), `missing lifecycle agent ${id}`);
  }
});

test("runtime composes once and renders through every adapter without duplicated shared assets", () => {
  const runtime = createBuildLikeThisRuntime({
    projectName: "Example",
    projectDescription: "An example product.",
    context: [{ path: "docs/product.md" }, { path: "docs/architecture.md" }],
    onboarding: { setupCommands: ["pnpm install"], verificationCommands: ["pnpm test"] },
  });
  const environments = createDefaultRegistry().list().map((adapter) => adapter.id);
  const plan = createIntegrationPlan(createDefaultRegistry(), runtime, environments);

  assert.equal(runtime.version, "1.1.0");
  const runtimeInstructions = runtime.instructions?.content;
  assert.ok(runtimeInstructions);
  assert.match(runtimeInstructions, /You are building \*\*Example\*\*, the host project/);
  assert.match(runtimeInstructions, /mstack installs and reconciles/);
  assert.match(runtimeInstructions, /\.mstack\/templates\/.*reference scaffolds/s);
  assert.match(runtimeInstructions, /## Ten-phase lifecycle/);
  assert.match(runtimeInstructions, /## Delegation and parallel safety/);

  for (const asset of [...hookAssets, ...runtimeTemplates]) {
    assert.equal(
      plan.artifacts.filter((artifact) => artifact.path === asset.path).length,
      1,
      `${asset.path} should be installed once`,
    );
  }
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".claude/agents/product-manager.md"));
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".claude/agents/workflow-coordinator.md"));
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".codex/agents/software-architect.toml"));
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".agents/skills/feature-planning/SKILL.md"));
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".agents/skills/idea-validation/SKILL.md"));
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".gemini/commands/build-feature.toml"));
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".gemini/commands/research-idea.toml"));
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".continue/prompts/design-api.md"));
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".mstack/aider/index.md"));
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".mstack/runtime/.gitignore"));
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".mstack/templates/discovery.template.md"));
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".mstack/templates/experiment.template.md"));
});

test("installed hook scripts are valid JavaScript and remain advisory", async () => {
  const root = await mkdtemp(join(tmpdir(), "mstack-runtime-hooks-"));
  try {
    for (const asset of hookAssets) {
      const path = join(root, asset.path.split("/").at(-1)!);
      await writeFile(path, asset.content, "utf8");
      const checked = spawnSync(process.execPath, ["--check", path], { encoding: "utf8" });
      assert.equal(checked.status, 0, checked.stderr);
    }

    const disciplinePath = join(root, "change-discipline.mjs");
    const executed = spawnSync(process.execPath, [disciplinePath], {
      encoding: "utf8",
      input: JSON.stringify({ tool_input: { command: "pnpm add left-pad" } }),
    });
    assert.equal(executed.status, 0);
    assert.equal(executed.stdout, "{}\n");
    assert.match(executed.stderr, /dependency change detected/);

    const ordinaryInstall = spawnSync(process.execPath, [disciplinePath], {
      encoding: "utf8",
      input: JSON.stringify({ tool_input: { command: "pnpm install --frozen-lockfile" } }),
    });
    assert.equal(ordinaryInstall.status, 0);
    assert.equal(ordinaryInstall.stdout, "{}\n");
    assert.equal(ordinaryInstall.stderr, "");

    const descriptiveCommit = spawnSync(process.execPath, [disciplinePath], {
      encoding: "utf8",
      input: JSON.stringify({ tool_input: { command: 'git commit -m "fix: preserve hook ownership"' } }),
    });
    assert.equal(descriptiveCommit.status, 0);
    assert.equal(descriptiveCommit.stderr, "");

    const riskPath = join(root, "risk-review.mjs");
    const destructive = spawnSync(process.execPath, [riskPath], {
      encoding: "utf8",
      input: JSON.stringify({ tool_input: { command: "git reset --hard HEAD~1" } }),
    });
    assert.equal(destructive.status, 0);
    assert.equal(destructive.stdout, "{}\n");
    assert.match(destructive.stderr, /destructive command detected/);

    const externalWrite = spawnSync(process.execPath, [riskPath], {
      encoding: "utf8",
      input: JSON.stringify({ tool_input: { command: "git push origin main" } }),
    });
    assert.match(externalWrite.stderr, /external write detected/);

    const safeRead = spawnSync(process.execPath, [riskPath], {
      encoding: "utf8",
      input: JSON.stringify({ tool_input: { command: "git status --short" } }),
    });
    assert.equal(safeRead.status, 0);
    assert.equal(safeRead.stderr, "");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("feature completeness rechecks same-path content changes and secret-bearing files", async () => {
  const root = await mkdtemp(join(tmpdir(), "mstack-feature-hook-"));
  try {
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, "src/one.ts"), "export const one = 1;\n", "utf8");
    await writeFile(join(root, "src/with space.ts"), "export const two = 2;\n", "utf8");
    assert.equal(spawnSync("git", ["init", "--quiet"], { cwd: root }).status, 0);
    assert.equal(spawnSync("git", ["add", "."], { cwd: root }).status, 0);
    assert.equal(spawnSync("git", ["-c", "user.name=mstack", "-c", "user.email=mstack@example.test", "commit", "--quiet", "-m", "fixture"], { cwd: root }).status, 0);

    await writeFile(join(root, "src/one.ts"), "export const one = 10;\n", "utf8");
    await writeFile(join(root, "src/with space.ts"), "export const two = 20;\n", "utf8");
    const featurePath = join(root, "feature-completeness.mjs");
    const asset = hookAssets.find((item) => item.id === "feature-completeness-hook");
    assert.ok(asset);
    await writeFile(featurePath, asset.content, "utf8");

    const first = spawnSync(process.execPath, [featurePath], { cwd: root, encoding: "utf8" });
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stderr, /without a corresponding test change/);

    await writeFile(join(root, "src/one.ts"), "export const one = 100;\n", "utf8");
    const second = spawnSync(process.execPath, [featurePath], { cwd: root, encoding: "utf8" });
    assert.equal(second.status, 0, second.stderr);
    assert.match(second.stderr, /without a corresponding test change/);

    await writeFile(join(root, ".env.local"), "TOKEN=fixture-only\n", "utf8");
    const secret = spawnSync(process.execPath, [featurePath], { cwd: root, encoding: "utf8" });
    assert.equal(secret.status, 0, secret.stderr);
    assert.match(secret.stderr, /potentially secret-bearing file changed/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("repository health reports missing mstack documents and TypeScript checks", async () => {
  const root = await mkdtemp(join(tmpdir(), "mstack-health-hook-"));
  try {
    await mkdir(join(root, ".mstack"), { recursive: true });
    await writeFile(join(root, "package.json"), JSON.stringify({ scripts: {} }), "utf8");
    await writeFile(join(root, "tsconfig.json"), "{}\n", "utf8");
    const asset = hookAssets.find((item) => item.id === "repository-health-hook");
    assert.ok(asset);
    const healthPath = join(root, "repository-health.mjs");
    await writeFile(healthPath, asset.content, "utf8");

    const checked = spawnSync(process.execPath, [healthPath], {
      cwd: root,
      encoding: "utf8",
      input: JSON.stringify({ cwd: root }),
    });
    assert.equal(checked.status, 0);
    assert.equal(checked.stdout, "{}\n");
    assert.match(checked.stderr, /docs\/ is missing/);
    assert.match(checked.stderr, /no typecheck or check script/);

    const nullInput = spawnSync(process.execPath, [healthPath], {
      cwd: root,
      encoding: "utf8",
      input: "null",
    });
    assert.equal(nullInput.status, 0, nullInput.stderr);
    assert.equal(nullInput.stdout, "{}\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("runtime installs canonical resources and its health hook runs from the repository root", async () => {
  const root = await mkdtemp(join(tmpdir(), "mstack-runtime-install-"));
  try {
    await writeFile(join(root, "package.json"), JSON.stringify({ name: "fixture" }), "utf8");
    const runtime = createBuildLikeThisRuntime({ projectName: "Fixture" });
    const plan = createIntegrationPlan(createDefaultRegistry(), runtime, ["codex"]);
    const inspection = await inspectIntegrationRepository(root, plan);
    const reconciliation = createReconciliationPlan(plan, inspection);
    const approved = approveIntegrationPlan(reconciliation, Object.fromEntries(reconciliation.changes.flatMap((change) => change.approvalRequirements.map((requirement) => [requirement.id, "approve" as const]))));
    const result = await applyIntegrationPlan(root, approved);
    assert.ok(result.files.every((file) => file.status === "created"));

    const templateContent = await readFile(
      join(root, ".mstack/templates/architecture.template.md"),
      "utf8",
    );
    assert.match(templateContent, /## Security boundaries/);
    const discoveryTemplate = await readFile(
      join(root, ".mstack/templates/discovery.template.md"),
      "utf8",
    );
    assert.match(discoveryTemplate, /docs\/research/);
    assert.match(discoveryTemplate, /What this research does \*\*not\*\* establish/);
    const experimentTemplate = await readFile(
      join(root, ".mstack/templates/experiment.template.md"),
      "utf8",
    );
    assert.match(experimentTemplate, /docs\/experiments/);
    assert.match(experimentTemplate, /Authorization, safety, and data/);

    const hookPath = join(root, ".mstack/runtime/hooks/repository-health.mjs");
    const executed = spawnSync(process.execPath, [hookPath], {
      cwd: root,
      encoding: "utf8",
      input: JSON.stringify({ cwd: root }),
    });
    assert.equal(executed.status, 0, executed.stderr);
    assert.equal(executed.stdout, "{}\n");

    const nested = join(root, "packages/example");
    await mkdir(nested, { recursive: true });
    const launcher = spawnSync(engineeringHooks[0]!.command, {
      cwd: nested,
      shell: true,
      encoding: "utf8",
      input: JSON.stringify({ cwd: nested }),
    });
    assert.equal(launcher.status, 0, launcher.stderr);
    assert.equal(launcher.stdout, "{}\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("runtime can omit optional automation assets without weakening content", () => {
  const runtime = createBuildLikeThisRuntime({
    projectName: "No automation",
    includeHooks: false,
    includeTemplates: false,
  });
  assert.deepEqual(runtime.hooks, []);
  assert.deepEqual(runtime.assets?.map((asset) => asset.path), [".mstack/runtime/.gitignore"]);
  assert.equal(runtime.agents?.length, 19);
  assert.equal(runtime.skills?.length, 20);
  assert.equal(runtime.prompts?.length, 19);
});
