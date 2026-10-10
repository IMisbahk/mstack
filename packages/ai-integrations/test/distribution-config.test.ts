import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildCursorPluginBundle,
  buildRuntimeResourceCounts,
  buildTokenBudget,
  createArenaPrompt,
  createBuildLikeThisRuntime,
  createInstallChannelRecord,
  decoratedPrompts,
  decoratedSkills,
  defaultModelRoleMapping,
  engineeringAgents,
  engineeringHooks,
  engineeringPrompts,
  engineeringSkills,
  hookAssets,
  matchesInstallProfile,
  runtimeTemplates,
} from "../src/index.js";
import { builtInAdapters } from "../src/adapters/index.js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

test("resource policies tag invocation and lite membership without changing library size", () => {
  const skills = decoratedSkills();
  const prompts = decoratedPrompts();
  assert.equal(skills.length, engineeringSkills.length);
  assert.equal(prompts.length, engineeringPrompts.length);
  assert.ok(skills.every((skill) => skill.invocation === "model"));
  assert.ok(prompts.every((prompt) => prompt.invocation === "user"));
  assert.ok(skills.some((skill) => matchesInstallProfile(skill.installProfiles, "lite")));
  assert.ok(skills.some((skill) => !matchesInstallProfile(skill.installProfiles, "lite")));
  assert.ok(prompts.some((prompt) => matchesInstallProfile(prompt.installProfiles, "lite")));
});

test("lite profile installs a smaller skill and prompt surface than full", () => {
  const lite = createBuildLikeThisRuntime({ projectName: "Demo", profile: "lite" });
  const full = createBuildLikeThisRuntime({ projectName: "Demo", profile: "full" });
  assert.ok((lite.skills?.length ?? 0) < (full.skills?.length ?? 0));
  assert.ok((lite.prompts?.length ?? 0) < (full.prompts?.length ?? 0));
  assert.equal(full.skills?.length, engineeringSkills.length);
  assert.equal(full.prompts?.length, engineeringPrompts.length);
});

test("arena adds the optional multi-model prompt only when enabled", () => {
  const withoutArena = createBuildLikeThisRuntime({ projectName: "Demo", arena: false });
  const withArena = createBuildLikeThisRuntime({ projectName: "Demo", arena: true });
  assert.equal((withoutArena.prompts ?? []).some((prompt) => prompt.id === "multi-model-arena"), false);
  assert.equal((withArena.prompts ?? []).some((prompt) => prompt.id === "multi-model-arena"), true);
  assert.equal(createArenaPrompt().invocation, "user");
});

test("token budget reports always-on metadata cheaper than full library load", () => {
  const full = createBuildLikeThisRuntime({ projectName: "Demo", profile: "full" });
  const budget = buildTokenBudget({
    profile: "full",
    skills: full.skills ?? [],
    prompts: full.prompts ?? [],
    agents: full.agents ?? [],
  });
  assert.equal(budget.schemaVersion, 1);
  assert.ok(budget.totals.alwaysOnTokens > 0);
  assert.ok(budget.totals.fullLibraryTokens > budget.totals.alwaysOnTokens);
  assert.equal(budget.totals.modelInvoked, engineeringSkills.length);
  assert.equal(budget.totals.userInvoked, engineeringPrompts.length);

  const liteRuntime = createBuildLikeThisRuntime({ projectName: "Demo", profile: "lite" });
  const liteBudget = buildTokenBudget({
    profile: "lite",
    skills: liteRuntime.skills ?? [],
    prompts: liteRuntime.prompts ?? [],
    agents: liteRuntime.agents ?? [],
  });
  assert.ok(liteBudget.totals.alwaysOnTokens < budget.totals.alwaysOnTokens);
});

test("model role defaults bind code and judgment from runtime catalogs", () => {
  const mapping = defaultModelRoleMapping(["claude-code", "cursor"]);
  assert.equal(mapping.schemaVersion, 1);
  assert.ok(mapping.code);
  assert.ok(mapping.judgment);
  assert.ok((mapping.reviewPanel?.length ?? 0) > 0);
  assert.equal(mapping.arena, false);
});

test("install channel records warn against dual installs", () => {
  const record = createInstallChannelRecord("cli", "lite", "2026-10-10T00:00:00.000Z");
  assert.equal(record.channel, "cli");
  assert.equal(record.profile, "lite");
  assert.match(record.note, /Do not also install/);
});

test("generated resource counts match the live registry", () => {
  const live = buildRuntimeResourceCounts();
  assert.equal(live.adapters, builtInAdapters.length);
  assert.equal(live.agents, engineeringAgents.length);
  assert.equal(live.skills, engineeringSkills.length);
  assert.equal(live.prompts, engineeringPrompts.length);
  assert.equal(live.hooks, engineeringHooks.length);
  assert.equal(live.templates, runtimeTemplates.length);
  assert.ok(live.profiles.lite.skills < live.profiles.full.skills);

  const generatedPath = join(dirname(fileURLToPath(import.meta.url)), "../../src/generated/resource-counts.json");
  const generated = JSON.parse(readFileSync(generatedPath, "utf8")) as typeof live;
  assert.deepEqual(generated, live);
});

test("Cursor plugin bundle includes /mstack router, commands, rules, agents, and hooks", () => {
  const spec = createBuildLikeThisRuntime({ projectName: "mstack", profile: "full", arena: true });
  const bundle = buildCursorPluginBundle({
    version: "0.6.0",
    spec,
    hooks: engineeringHooks,
    hookAssets,
  });
  const paths = new Set(bundle.files.map((file) => file.path));
  assert.equal(bundle.pluginName, "mstack");
  assert.ok(paths.has(".cursor-plugin/plugin.json"));
  assert.ok(paths.has("skills/mstack/SKILL.md"));
  assert.ok(paths.has("skills/setup-mstack/SKILL.md"));
  assert.ok(paths.has("commands/mstack.md"));
  assert.ok(paths.has("agents/mstack-agent.md"));
  assert.ok(paths.has("rules/build-like-this.mdc"));
  assert.ok(paths.has("hooks/hooks.json"));
  assert.ok(paths.has("scripts/repository-health.mjs"));
  const router = bundle.files.find((file) => file.path === "skills/mstack/SKILL.md")?.content ?? "";
  assert.match(router, /mode: true/);
  assert.match(router, /disable-model-invocation: true/);
  assert.match(router, /playbook-bug-fix/);
  assert.match(router, /evidence-gated/);
  assert.ok(paths.has("assets/logo.svg"));
  const manifest = JSON.parse(bundle.files.find((file) => file.path === ".cursor-plugin/plugin.json")?.content ?? "{}");
  assert.equal(manifest.name, "mstack");
  assert.equal(manifest.homepage, "https://misbah.lol/mstack");
  assert.equal(manifest.logo, "assets/logo.svg");
  assert.equal(manifest.skills, "./skills/");
  assert.equal(manifest.commands, "./commands/");
  assert.equal(manifest.hooks, "./hooks/hooks.json");
});
