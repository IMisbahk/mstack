import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createDefaultRegistry, createIntegrationPlan, type IntegrationSpec } from "../src/index.js";

const platformSpec: IntegrationSpec = {
  id: "platform-fixture",
  version: "1.0.0",
  project: { name: "Platforms" },
  instructions: { id: "guidance", version: "1.0.0", content: "Use the project contract." },
  rules: [{ id: "security-rule", version: "1.0.0", content: "Preserve trust boundaries.", fallback: "skip" }],
  hooks: [{ id: "verify", version: "1.0.0", event: "after-response", command: "node verify.mjs", fallback: "skip" }],
  mcpServers: [{ id: "local-docs", version: "1.0.0", type: "http", url: "https://example.com/mcp", fallback: "skip" }],
};

test("verified adapter profiles expose honest native, emulated, experimental, and unsupported support", () => {
  const registry = createDefaultRegistry();
  for (const adapter of registry.list()) {
    assert.equal(adapter.profile?.verifiedAt, "2026-07-15");
    assert.equal(adapter.profile?.capabilities, adapter.capabilities);
    assert.ok(Object.values(adapter.capabilities).every((capability) => capability.detail.length > 0));
  }
  assert.equal(registry.get("codex").capabilities.hooks.level, "experimental");
  assert.equal(registry.get("continue").capabilities.hooks.level, "unsupported");
  assert.equal(registry.get("aider").capabilities.skills.level, "emulated");
  assert.equal(registry.get("gemini-cli").capabilities.mcp.level, "native");
});

test("Claude, Codex, and Gemini render corrected project-local surfaces", () => {
  const registry = createDefaultRegistry();
  const claude = createIntegrationPlan(registry, platformSpec, ["claude-code"]);
  assert.ok(claude.artifacts.some((artifact) => artifact.path === ".claude/rules/build-like-this/project.md"));
  assert.ok(claude.artifacts.some((artifact) => artifact.path === ".mcp.json"));
  assert.ok(claude.artifacts.every((artifact) => artifact.path !== "CLAUDE.local.md"));
  assert.doesNotMatch(claude.artifacts.find((artifact) => artifact.path === "CLAUDE.md")!.content, /^#\s/m);

  const codex = createIntegrationPlan(registry, platformSpec, ["codex"]);
  const config = codex.artifacts.find((artifact) => artifact.path === ".codex/config.toml")!;
  assert.equal(config.mergeStrategy, "manual");
  assert.equal(config.activation, "privileged");
  assert.match(config.content, /\[\[hooks\.Stop\]\]/);
  assert.match(config.content, /\[\[hooks\.Stop\.hooks\]\]/);
  assert.match(config.content, /type = "command"/);
  assert.doesNotMatch(config.content, /\[\[hooks\]\]/);
  assert.doesNotMatch(config.content, /timeout_seconds/);
  assert.match(config.content, /\[mcp_servers\."local-docs"\]/);
  assert.doesNotMatch(config.content, /type = "http"/);
  assert.ok(codex.artifacts.every((artifact) => artifact.path !== ".codex/hooks.json"));
  assert.doesNotMatch(codex.artifacts.find((artifact) => artifact.path === "AGENTS.md")!.content, /^#\s/m);

  const gemini = createIntegrationPlan(registry, platformSpec, ["gemini-cli"]);
  const settings = gemini.artifacts.find((artifact) => artifact.path === ".gemini/settings.json")!;
  assert.match(settings.content, /"type": "http"/);
  assert.match(settings.content, /"url": "https:\/\/example.com\/mcp"/);
  assert.doesNotMatch(settings.content, /httpUrl/);
  assert.doesNotMatch(gemini.artifacts.find((artifact) => artifact.path === "GEMINI.md")!.content, /^#\s/m);

  const aider = createIntegrationPlan(registry, platformSpec, ["aider"]);
  assert.doesNotMatch(aider.artifacts.find((artifact) => artifact.path === "CONVENTIONS.md")!.content, /^#\s/m);
});

test("generated Codex configuration is accepted by an installed Codex CLI", async (context) => {
  const available = spawnSync("codex", ["--version"], { encoding: "utf8" });
  if (available.error !== undefined || available.status !== 0) {
    context.skip("Codex CLI is not installed in this environment");
    return;
  }

  const root = await mkdtemp(join(tmpdir(), "mstack-codex-config-"));
  const codexHome = join(root, ".codex-home");
  try {
    await mkdir(codexHome, { recursive: true });
    const plan = createIntegrationPlan(
      createDefaultRegistry(),
      { ...platformSpec, hooks: [{ ...platformSpec.hooks![0]!, timeoutMs: 10_000 }] },
      ["codex"],
    );
    const config = plan.artifacts.find((artifact) => artifact.path === ".codex/config.toml")!;
    assert.match(config.content, /timeout = 10/);
    await writeFile(join(codexHome, "config.toml"), config.content, "utf8");

    const parsed = spawnSync("codex", ["features", "list"], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, CODEX_HOME: codexHome },
    });
    assert.equal(parsed.status, 0, parsed.stderr || parsed.stdout);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("unsupported resources skip or fail according to fallback and shared YAML stays manual", () => {
  const registry = createDefaultRegistry();
  const aider = createIntegrationPlan(registry, platformSpec, ["aider"]);
  assert.equal(aider.artifacts.find((artifact) => artifact.path === ".aider.conf.yml")?.mergeStrategy, "manual");
  assert.ok(aider.diagnostics.some((diagnostic) => diagnostic.feature === "hooks"));
  assert.ok(aider.artifacts.every((artifact) => artifact.path !== ".mcp.json"));

  assert.throws(() => createIntegrationPlan(registry, { ...platformSpec, mcpServers: [{ ...platformSpec.mcpServers![0]!, fallback: "fail" }] }, ["aider"]), /does not support mcp-server/);
  for (const environment of ["cursor", "continue"]) {
    const plan = createIntegrationPlan(registry, platformSpec, [environment]);
    assert.ok(plan.diagnostics.some((diagnostic) => diagnostic.feature === "mcp"));
  }
});
