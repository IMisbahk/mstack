import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
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
    assert.match(adapter.profile?.verifiedAt ?? "", /^2026-07-(?:15|18)$/);
    assert.equal(adapter.profile?.capabilities, adapter.capabilities);
    assert.ok(Object.values(adapter.capabilities).every((capability) => capability.detail.length > 0));
  }
  assert.equal(registry.get("codex").capabilities.hooks.level, "experimental");
  assert.equal(registry.get("continue").capabilities.hooks.level, "unsupported");
  assert.equal(registry.get("aider").capabilities.skills.level, "emulated");
  assert.match(registry.get("aider").capabilities.prompts.detail, /on-demand reads/);
  assert.match(registry.get("aider").capabilities.agents.detail, /cannot spawn subagents.*parallel/);
  assert.equal(registry.get("gemini-cli").capabilities.mcp.level, "native");
  assert.equal(registry.get("antigravity").capabilities.hooks.level, "native");
  assert.equal(registry.get("kimi-code").capabilities.agents.level, "emulated");
  assert.equal(registry.get("kimi-code").capabilities.hooks.level, "unsupported");
  assert.equal(registry.get("opencode").capabilities.agents.level, "native");
  assert.deepEqual(registry.get("roo-code").runtime.commands, []);
});

test("Antigravity renders only verified project hooks, agents, rules, and MCP fields", () => {
  const plan = createIntegrationPlan(createDefaultRegistry(), platformSpec, ["antigravity"]);
  assert.ok(plan.artifacts.some((artifact) => artifact.path === "AGENTS.md"));
  assert.ok(plan.artifacts.some((artifact) => artifact.path === ".agents/rules/build-like-this/security-rule.md"));
  const hooks = plan.artifacts.find((artifact) => artifact.path === ".agents/hooks.json")!;
  assert.equal(hooks.activation, "privileged");
  assert.match(hooks.content, /"PostInvocation"/);
  assert.doesNotMatch(hooks.content, /SessionStart/);
  const mcp = plan.artifacts.find((artifact) => artifact.path === ".agents/mcp_config.json")!;
  assert.match(mcp.content, /"serverUrl": "https:\/\/example.com\/mcp"/);
  assert.doesNotMatch(mcp.content, /"url"|"httpUrl"/);
});

test("content-compatible adapters do not inherit Claude privileged configuration", () => {
  for (const environment of ["kimi-code", "github-copilot", "opencode", "kiro", "qwen-code", "junie", "cline", "roo-code"]) {
    const plan = createIntegrationPlan(createDefaultRegistry(), platformSpec, [environment]);
    assert.ok(plan.artifacts.every((artifact) => !artifact.path.startsWith(".claude/")), environment);
    assert.ok(plan.artifacts.every((artifact) => artifact.path !== ".mcp.json"), environment);
    assert.ok(plan.diagnostics.some((diagnostic) => diagnostic.feature === "hooks"), environment);
    assert.ok(plan.diagnostics.some((diagnostic) => diagnostic.feature === "mcp"), environment);
  }
});

test("Claude, Codex, and Gemini render corrected project-local surfaces", () => {
  const registry = createDefaultRegistry();
  const claude = createIntegrationPlan(registry, platformSpec, ["claude-code"]);
  assert.ok(claude.artifacts.some((artifact) => artifact.path === ".claude/rules/build-like-this/project.md"));
  assert.ok(claude.artifacts.some((artifact) => artifact.path === ".mcp.json"));
  assert.ok(claude.artifacts.every((artifact) => artifact.path !== "CLAUDE.local.md"));
  const claudeInstructions = claude.artifacts.find((artifact) => artifact.path === "CLAUDE.md")!.content;
  assert.doesNotMatch(claudeInstructions, /^#\s/m);
  assert.match(claudeInstructions, /Platforms is the host project/);
  assert.match(claudeInstructions, /Build Like This is the engineering method and mstack is its installer/);

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

test("generated OpenCode commands, agents, and shared skills are discovered by an installed CLI", async (context) => {
  const available = spawnSync("opencode", ["--version"], { encoding: "utf8" });
  if (available.error !== undefined || available.status !== 0) {
    context.skip("OpenCode is not installed in this environment");
    return;
  }

  const root = await mkdtemp(join(tmpdir(), "mstack-opencode-config-"));
  try {
    const plan = createIntegrationPlan(createDefaultRegistry(), {
      id: "opencode-fixture",
      version: "1.0.0",
      project: { name: "OpenCode fixture" },
      instructions: { content: "Use the repository contract." },
      prompts: [{ id: "review-change", description: "Review the change", prompt: "Review the current diff." }],
      skills: [{ id: "ship-safely", description: "Ship safely", instructions: "Verify the release." }],
      agents: [{ id: "security-reviewer", description: "Review security", instructions: "Inspect trust boundaries." }],
    }, ["opencode"]);
    for (const artifact of plan.artifacts) {
      const target = join(root, artifact.path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, artifact.content, "utf8");
    }
    const environment = {
      ...process.env,
      XDG_CONFIG_HOME: join(root, ".config"),
      OPENCODE_DISABLE_CLAUDE_CODE: "1",
    };
    const config = spawnSync("opencode", ["--pure", "debug", "config"], { cwd: root, encoding: "utf8", env: environment });
    assert.equal(config.status, 0, config.stderr || config.stdout);
    assert.match(config.stdout, /review-change/);
    const agent = spawnSync("opencode", ["--pure", "debug", "agent", "security-reviewer"], { cwd: root, encoding: "utf8", env: environment });
    assert.equal(agent.status, 0, agent.stderr || agent.stdout);
    assert.match(agent.stdout, /Inspect trust boundaries/);
    const skills = spawnSync("opencode", ["--pure", "debug", "skill"], { cwd: root, encoding: "utf8", env: environment });
    assert.equal(skills.status, 0, skills.stderr || skills.stdout);
    assert.match(skills.stdout, /ship-safely/);
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
