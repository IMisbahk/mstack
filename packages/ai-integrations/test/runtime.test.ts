import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import {
  applyIntegrationPlan,
  createBuildLikeThisRuntime,
  createDefaultRegistry,
  createIntegrationPlan,
  engineeringAgents,
  engineeringHooks,
  engineeringPrompts,
  engineeringSkills,
  hookAssets,
  runtimeTemplates,
} from "../src/index.js";

test("runtime ships a focused, structurally complete engineering library", () => {
  assert.equal(engineeringAgents.length, 12);
  assert.equal(engineeringSkills.length, 10);
  assert.equal(engineeringPrompts.length, 9);
  assert.equal(engineeringHooks.length, 3);
  assert.equal(runtimeTemplates.length, 8);

  const allIds = [
    ...engineeringAgents.map((item) => item.id),
    ...engineeringSkills.map((item) => item.id),
    ...engineeringPrompts.map((item) => item.id),
    ...engineeringHooks.map((item) => item.id),
  ];
  assert.equal(new Set(allIds).size, allIds.length, "runtime component ids must be globally unique");

  const agentSections = [
    "## Responsibility",
    "## Strict boundaries",
    "## Engineering philosophy",
    "## Preferred workflow",
    "## Expected inputs",
    "## Expected outputs",
  ];
  for (const agent of engineeringAgents) {
    assert.ok(agent.instructions.length > 1_500, `${agent.id} is too shallow`);
    for (const section of agentSections) assert.match(agent.instructions, new RegExp(section));
  }

  for (const skill of engineeringSkills) {
    assert.ok(skill.instructions.length > 1_500, `${skill.id} is too shallow`);
    for (const section of ["## Required inputs", "## Process", "## Output contract", "## Guardrails"]) {
      assert.match(skill.instructions, new RegExp(section));
    }
  }

  for (const prompt of engineeringPrompts) {
    assert.ok(prompt.prompt.length > 1_400, `${prompt.id} is too shallow`);
    assert.match(prompt.prompt, /Discover local instructions/);
    assert.match(prompt.prompt, /exact verification evidence/);
    assert.ok(prompt.argumentHint);
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

  for (const asset of [...hookAssets, ...runtimeTemplates]) {
    assert.equal(
      plan.artifacts.filter((artifact) => artifact.path === asset.path).length,
      1,
      `${asset.path} should be installed once`,
    );
  }
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".claude/agents/product-manager.md"));
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".codex/agents/software-architect.toml"));
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".agents/skills/feature-planning/SKILL.md"));
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".gemini/commands/build-feature.toml"));
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".continue/prompts/design-api.md"));
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".mstack/aider-playbook.md"));
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
    const result = await applyIntegrationPlan(root, plan);
    assert.ok(result.files.every((file) => file.status === "created"));

    const templateContent = await readFile(
      join(root, ".mstack/templates/architecture.template.md"),
      "utf8",
    );
    assert.match(templateContent, /## Security boundaries/);

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
  assert.deepEqual(runtime.assets, []);
  assert.equal(runtime.agents?.length, 12);
  assert.equal(runtime.skills?.length, 10);
  assert.equal(runtime.prompts?.length, 9);
});
