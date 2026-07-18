import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  applyIntegrationPlan,
  approveIntegrationPlan,
  createBuildLikeThisRuntime,
  createDefaultRegistry,
  createIntegrationPlan,
  createReconciliationPlan,
  inspectIntegrationRepository,
  type IntegrationSpec,
} from "../src/index.js";

const fullSpec: IntegrationSpec = {
  project: { name: "Acme", description: "A strict TypeScript service." },
  instructions: { content: "Keep domain code independent from transport code." },
  context: [{ path: "docs/architecture.md", description: "system boundaries" }],
  onboarding: {
    setupCommands: ["npm install"],
    verificationCommands: ["npm test"],
  },
  prompts: [
    {
      id: "review-change",
      description: "Review the current change",
      prompt: "Review the current diff for correctness and missing tests.",
      argumentHint: "[focus]",
    },
  ],
  skills: [
    {
      id: "ship-safely",
      description: "Prepare a safe release",
      instructions: "Run verification, summarize risk, and prepare the release.",
      resources: [{ path: "references/checklist.md", content: "# Checklist\n\n- Tests pass" }],
    },
  ],
  hooks: [
    {
      id: "verify-stop",
      event: "after-response",
      command: "./scripts/verify-agent.sh",
      timeoutMs: 10_000,
    },
  ],
  agents: [
    {
      id: "security-reviewer",
      description: "Review changes for security failures",
      instructions: "Inspect trust boundaries and report actionable findings.",
      tools: ["read_file", "grep_search"],
    },
  ],
};

test("built-in adapters declare and render all target environments", () => {
  const registry = createDefaultRegistry();
  assert.deepEqual(
    registry.list().map((adapter) => adapter.id),
    [
      "claude-code", "codex", "cursor", "gemini-cli", "continue", "aider",
      "antigravity", "kimi-code", "github-copilot", "opencode", "kiro",
      "qwen-code", "junie", "cline", "roo-code",
    ],
  );

  const plan = createIntegrationPlan(
    registry,
    fullSpec,
    registry.list().map((adapter) => adapter.id),
  );
  const paths = new Set(plan.artifacts.map((artifact) => artifact.path));

  for (const expected of [
    "CLAUDE.md",
    "AGENTS.md",
    "GEMINI.md",
    ".claude/settings.json",
    ".codex/config.toml",
    ".cursor/hooks.json",
    ".gemini/settings.json",
    ".continue/rules/00-mstack.md",
    ".continue/prompts/review-change.md",
    ".continue/agents/security-reviewer.md",
    ".aider.conf.yml",
    ".mstack/aider/index.md",
    ".mstack/aider/prompts/review-change.md",
    ".mstack/aider/skills/ship-safely.md",
    ".mstack/aider/agents/security-reviewer.md",
    ".codex/agents/security-reviewer.toml",
    ".cursor/agents/security-reviewer.md",
    ".gemini/agents/security-reviewer.md",
    ".agents/hooks.json",
    ".agents/agents/security-reviewer/agent.md",
    ".agents/skills/mstack-agent-security-reviewer/SKILL.md",
    ".github/prompts/review-change.prompt.md",
    ".github/agents/security-reviewer.agent.md",
    ".opencode/commands/review-change.md",
    ".opencode/agents/security-reviewer.md",
    ".kiro/skills/ship-safely/SKILL.md",
    ".kiro/skills/review-change/SKILL.md",
    ".kiro/skills/mstack-agent-security-reviewer/SKILL.md",
    ".qwen/skills/ship-safely/SKILL.md",
    ".qwen/commands/review-change.md",
    ".qwen/agents/security-reviewer.md",
    ".junie/skills/ship-safely/SKILL.md",
    ".junie/commands/review-change.md",
    ".junie/agents/security-reviewer.md",
    ".cline/skills/ship-safely/SKILL.md",
    ".cline/skills/review-change/SKILL.md",
    ".cline/skills/mstack-agent-security-reviewer/SKILL.md",
    ".roo/commands/review-change.md",
  ]) {
    assert.ok(paths.has(expected), `missing ${expected}`);
  }

  assert.ok(registry.list().every((adapter) => adapter.runtime.documentationUrl.startsWith("https://")));

  // Every verified Open Agent Skills consumer co-owns one byte-identical artifact.
  const sharedSkill = plan.artifacts.find((artifact) => artifact.path === ".agents/skills/ship-safely/SKILL.md")!;
  assert.equal(plan.artifacts.filter((artifact) => artifact.path === sharedSkill.path).length, 1);
  assert.deepEqual(sharedSkill.environments, [
    "antigravity", "codex", "cursor", "gemini-cli", "github-copilot", "kimi-code", "opencode", "roo-code",
  ]);
  assert.deepEqual(sharedSkill.profileIds, [
    "antigravity.2026-07-18",
    "codex.2026-07-15",
    "cursor.2026-07-15",
    "gemini-cli.2026-07-15",
    "github-copilot.2026-07-18",
    "kimi-code.2026-07-18",
    "opencode.2026-07-18",
    "roo-code.2026-07-18",
  ]);
  assert.deepEqual(plan.artifacts.find((artifact) => artifact.path === "AGENTS.md")?.environments, [
    "antigravity", "cline", "codex", "github-copilot", "junie", "kimi-code", "kiro", "opencode", "qwen-code", "roo-code",
  ]);
  assert.match(
    plan.artifacts.find((artifact) => artifact.path === ".codex/config.toml")?.content ?? "",
    /timeout = 10/,
  );
  assert.match(
    plan.artifacts.find((artifact) => artifact.path === ".gemini/settings.json")?.content ?? "",
    /"timeout": 10000/,
  );
  assert.ok(registry.list().every((adapter) => /^2026-07-(?:15|18)$/.test(adapter.profile?.verifiedAt ?? "")));
});

test("portable command adapters use each provider's documented Markdown contract", () => {
  const registry = createDefaultRegistry();
  for (const [environment, path] of [
    ["github-copilot", ".github/prompts/review-change.prompt.md"],
    ["qwen-code", ".qwen/commands/review-change.md"],
    ["junie", ".junie/commands/review-change.md"],
    ["roo-code", ".roo/commands/review-change.md"],
  ] as const) {
    const plan = createIntegrationPlan(registry, fullSpec, [environment]);
    const command = plan.artifacts.find((artifact) => artifact.path === path)!;
    assert.match(command.content, /^---\ndescription: "Review the current change"\n---\n/);
    assert.match(command.content, /Review the current diff for correctness and missing tests/);
  }
});

test("every adapter identifies the host project and keeps mstack templates reference-only", () => {
  const registry = createDefaultRegistry();
  const plan = createIntegrationPlan(
    registry,
    createBuildLikeThisRuntime({
      projectName: "Acme",
      context: [{ path: "docs/product.md" }, { path: "docs/architecture.md" }],
    }),
    registry.list().map((adapter) => adapter.id),
  );

  for (const path of [
    "AGENTS.md",
    ".claude/rules/build-like-this/project.md",
    ".cursor/rules/mstack.mdc",
    "GEMINI.md",
    ".continue/rules/00-mstack.md",
    "CONVENTIONS.md",
  ]) {
    const content = plan.artifacts.find((artifact) => artifact.path === path)?.content ?? "";
    assert.match(content, /You are building \*\*Acme\*\*, the host project/);
    assert.match(content, /Build Like This is the engineering method/);
    assert.match(content, /mstack installs and reconciles/);
    assert.match(content, /\.mstack\/templates\/.*reference scaffolds/s);
  }

  const claude = plan.artifacts.find((artifact) => artifact.path === "CLAUDE.md")?.content ?? "";
  assert.match(claude, /Acme is the host project/);
  assert.match(claude, /Build Like This is the engineering method and mstack is its installer/);

  const continueSkill = plan.artifacts.find((artifact) => artifact.path === ".continue/rules/skill-idea-validation.md")!;
  assert.equal(continueSkill.resourceId, "idea-validation");
  assert.equal(continueSkill.resourceVersion, "1.1.0");
});

test("shared compatibility artifacts and provenance are independent of selection order", async () => {
  const registry = createDefaultRegistry();
  const selected = ["roo-code", "kimi-code", "codex", "antigravity"];
  const forward = createIntegrationPlan(registry, fullSpec, selected);
  const reverse = createIntegrationPlan(registry, fullSpec, [...selected].reverse());
  const path = ".agents/skills/ship-safely/SKILL.md";
  const material = (plan: ReturnType<typeof createIntegrationPlan>) => {
    const artifact = plan.artifacts.find((item) => item.path === path)!;
    return {
      environment: artifact.environment,
      environments: artifact.environments,
      profileId: artifact.profileId,
      profileIds: artifact.profileIds,
      profileContributors: artifact.profileContributors,
      content: artifact.content,
    };
  };
  assert.deepEqual(material(forward), material(reverse));

  const root = await mkdtemp(join(tmpdir(), "mstack-shared-provenance-"));
  try {
    await applyApproved(root, forward);
    const manifest = JSON.parse(await readFile(join(root, ".mstack/runtime/manifest.json"), "utf8")) as {
      resources: Array<{ path: string; adapters: string[]; profileIds: string[] }>;
    };
    const resource = manifest.resources.find((item) => item.path === path)!;
    assert.deepEqual(resource.adapters, ["antigravity", "codex", "kimi-code", "roo-code"]);
    assert.deepEqual(resource.profileIds, [
      "antigravity.2026-07-18",
      "codex.2026-07-15",
      "kimi-code.2026-07-18",
      "roo-code.2026-07-18",
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Aider keeps indexed prompt, skill, and persona bodies out of automatic context", () => {
  const plan = createIntegrationPlan(createDefaultRegistry(), fullSpec, ["aider"]);
  const config = plan.artifacts.find((artifact) => artifact.path === ".aider.conf.yml")!.content;
  assert.match(config, /"CONVENTIONS\.md"/);
  assert.match(config, /"\.mstack\/aider\/index\.md"/);
  assert.match(config, /"docs\/architecture\.md"/);
  assert.doesNotMatch(config, /\.mstack\/aider\/(?:prompts|skills|agents)\//);

  const index = plan.artifacts.find((artifact) => artifact.path === ".mstack/aider/index.md")!;
  assert.equal(index.resourceId, "aider-resource-index");
  assert.match(index.content, /ID: `review-change`; description: Review the current change; path: `\.mstack\/aider\/prompts\/review-change\.md`/);
  assert.match(index.content, /ID: `ship-safely`.*path: `\.mstack\/aider\/skills\/ship-safely\.md`/);
  assert.match(index.content, /ID: `security-reviewer`.*path: `\.mstack\/aider\/agents\/security-reviewer\.md`/);
  assert.match(index.content, /manual, sequential passes.*cannot spawn.*parallel/);
  assert.doesNotMatch(index.content, /Review the current diff for correctness/);
  assert.doesNotMatch(index.content, /Inspect trust boundaries and report actionable findings/);
  assert.ok(plan.artifacts.every((artifact) => artifact.path !== ".mstack/aider-playbook.md"));

  const prompt = plan.artifacts.find((artifact) => artifact.path === ".mstack/aider/prompts/review-change.md")!;
  const skill = plan.artifacts.find((artifact) => artifact.path === ".mstack/aider/skills/ship-safely.md")!;
  const persona = plan.artifacts.find((artifact) => artifact.path === ".mstack/aider/agents/security-reviewer.md")!;
  assert.equal(prompt.resourceId, "review-change");
  assert.equal(skill.resourceId, "ship-safely");
  assert.equal(persona.resourceId, "security-reviewer");
  assert.match(prompt.content, /Review the current diff for correctness and missing tests/);
  assert.match(skill.content, /Run verification, summarize risk, and prepare the release/);
  assert.match(skill.content, /## Bundled resource: references\/checklist\.md/);
  assert.match(persona.content, /Inspect trust boundaries and report actionable findings/);
  assert.ok(plan.diagnostics.some((item) => item.feature === "agents" && /cannot spawn subagents.*parallel/.test(item.message)));
});

test("Aider upgrades an unchanged owned playbook configuration to the indexed layout", async () => {
  const root = await mkdtemp(join(tmpdir(), "mstack-aider-upgrade-"));
  try {
    const desired = createIntegrationPlan(createDefaultRegistry(), fullSpec, ["aider"]);
    const desiredConfig = desired.artifacts.find((artifact) => artifact.path === ".aider.conf.yml")!;
    const oldPlan = {
      ...desired,
      integrationVersion: "1.0.0",
      artifacts: [
        {
          ...desiredConfig,
          resourceVersion: "1.0.0",
          content: [
            "# Generated by mstack from Misbah's Build Like This workflow for aider. Regenerate instead of editing.",
            "read:",
            '  - "CONVENTIONS.md"',
            '  - ".mstack/aider-playbook.md"',
            '  - "docs/architecture.md"',
            "",
          ].join("\n"),
        },
        {
          environment: "aider",
          environments: ["aider"],
          resourceId: "aider-playbook",
          resourceVersion: "1.0.0",
          feature: "prompts" as const,
          path: ".mstack/aider-playbook.md",
          content: "# Legacy full playbook\n",
          mergeStrategy: "replace" as const,
          management: "whole-file" as const,
          security: "content" as const,
          activation: "passive" as const,
        },
      ],
    };
    await applyIntegrationPlan(root, oldPlan);

    const upgrade = createReconciliationPlan(desired, await inspectIntegrationRepository(root, desired));
    assert.equal(upgrade.changes.find((change) => change.path === ".aider.conf.yml")?.action, "update");
    assert.equal(upgrade.changes.find((change) => change.path === ".mstack/aider-playbook.md")?.action, "delete");
    assert.equal(upgrade.changes.find((change) => change.path === ".mstack/aider/index.md")?.action, "create");
    const applied = await applyIntegrationPlan(root, upgrade);
    assert.ok(applied.files.every((file) => file.status !== "conflict"));
    assert.match(await readFile(join(root, ".aider.conf.yml"), "utf8"), /\.mstack\/aider\/index\.md/);
    await assert.rejects(() => readFile(join(root, ".mstack/aider-playbook.md"), "utf8"));

    const second = createReconciliationPlan(desired, await inspectIntegrationRepository(root, desired));
    assert.ok(second.changes.every((change) => change.action === "unchanged"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("unsupported features degrade with diagnostics instead of aborting", () => {
  const plan = createIntegrationPlan(createDefaultRegistry(), fullSpec, ["continue", "aider", "codex"]);
  assert.ok(plan.diagnostics.some((item) => item.environment === "continue" && item.feature === "hooks"));
  assert.ok(plan.diagnostics.some((item) => item.environment === "aider" && item.feature === "hooks"));
  assert.ok(
    plan.diagnostics.some(
      (item) => item.environment === "codex" && item.feature === "slash-commands",
    ),
  );
});

test("installer preserves unmanaged files and updates managed blocks", async () => {
  const root = await mkdtemp(join(tmpdir(), "mstack-integrations-"));
  try {
    await writeFile(join(root, "AGENTS.md"), "# Existing guidance\n", "utf8");
    const firstPlan = createIntegrationPlan(createDefaultRegistry(), fullSpec, ["codex"]);
    const first = await applyApproved(root, firstPlan);
    assert.ok(first.files.every((file) => file.status !== "conflict"));

    const instructions = await readFile(join(root, "AGENTS.md"), "utf8");
    assert.match(instructions, /# Existing guidance/);
    assert.match(instructions, /mstack:project-instructions:start/);
    assert.match(instructions, /npm test/);

    const second = await applyApproved(root, firstPlan);
    assert.ok(second.files.every((file) => file.status === "unchanged"));

    const changedPlan = createIntegrationPlan(
      createDefaultRegistry(),
      {
        ...fullSpec,
        skills: [
          {
            ...fullSpec.skills![0]!,
            instructions: "Run all verification twice before preparing the release.",
          },
        ],
      },
      ["codex"],
    );
    const changed = await applyApproved(root, changedPlan);
    assert.equal(
      changed.files.find((file) => file.path === ".agents/skills/ship-safely/SKILL.md")?.status,
      "updated",
    );

    await writeFile(join(root, ".codex/agents/security-reviewer.toml"), "user owned\n", "utf8");
    const conflict = await applyIntegrationPlan(root, firstPlan);
    assert.equal(
      conflict.files.find((file) => file.path === ".codex/agents/security-reviewer.toml")?.status,
      "conflict",
    );
    const forced = await applyIntegrationPlan(root, firstPlan, { force: true });
    assert.equal(forced.files.find((file) => file.path === ".codex/agents/security-reviewer.toml")?.status, "conflict", "force cannot replace a decision-specific approval");
    const approved = await applyApproved(root, firstPlan);
    assert.equal(approved.files.find((file) => file.path === ".codex/agents/security-reviewer.toml")?.status, "updated");
    assert.equal(await readFile(join(root, ".codex/agents/security-reviewer.toml"), "utf8"), firstPlan.artifacts.find((artifact) => artifact.path === ".codex/agents/security-reviewer.toml")?.content);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("validation rejects unsafe resources and cross-feature id collisions", () => {
  assert.throws(
    () =>
      createIntegrationPlan(
        createDefaultRegistry(),
        {
          project: { name: "Unsafe" },
          prompts: [{ id: "same", description: "one", prompt: "one" }],
          skills: [{ id: "same", description: "two", instructions: "two" }],
        },
        ["codex"],
      ),
    /Duplicate integration id/,
  );

  assert.throws(
    () =>
      createIntegrationPlan(
        createDefaultRegistry(),
        {
          project: { name: "Unsafe" },
          skills: [
            {
              id: "unsafe",
              description: "unsafe",
              instructions: "unsafe",
              resources: [{ path: "../../secret", content: "nope" }],
            },
          ],
        },
        ["codex"],
      ),
    /must stay inside the repository/,
  );

  assert.throws(
    () =>
      createIntegrationPlan(
        createDefaultRegistry(),
        {
          project: { name: "Unsafe" },
          context: [{ path: "..\\secret" }],
        },
        ["codex"],
      ),
    /must stay inside the repository/,
  );

  assert.throws(
    () =>
      createIntegrationPlan(
        createDefaultRegistry(),
        {
          project: { name: "Unsafe" },
          assets: [{ feature: "hooks", path: "C:\\temp\\hook.mjs", content: "unsafe" }],
        },
        ["codex"],
      ),
    /must stay inside the repository/,
  );
});

test("installer rejects repository paths redirected through symlinks", async () => {
  const root = await mkdtemp(join(tmpdir(), "mstack-integrations-root-"));
  const outside = await mkdtemp(join(tmpdir(), "mstack-integrations-outside-"));
  try {
    await mkdir(join(root, ".codex"), { recursive: true });
    await symlink(outside, join(root, ".codex/agents"));
    const plan = createIntegrationPlan(createDefaultRegistry(), fullSpec, ["codex"]);
    await assert.rejects(() => applyIntegrationPlan(root, plan), /parent must not be a symlink|parent resolves outside repository root/);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

async function applyApproved(root: string, plan: ReturnType<typeof createIntegrationPlan>) {
  const inspection = await inspectIntegrationRepository(root, plan);
  const reconciliation = createReconciliationPlan(plan, inspection);
  const decisions = Object.fromEntries(reconciliation.changes.flatMap((change) => change.approvalRequirements.map((requirement) => [requirement.id, "approve" as const])));
  return applyIntegrationPlan(root, approveIntegrationPlan(reconciliation, decisions));
}
