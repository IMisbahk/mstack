import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  applyIntegrationPlan,
  approveIntegrationPlan,
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
    ["claude-code", "codex", "cursor", "gemini-cli", "continue", "aider"],
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
    ".codex/agents/security-reviewer.toml",
    ".cursor/agents/security-reviewer.md",
    ".gemini/agents/security-reviewer.md",
  ]) {
    assert.ok(paths.has(expected), `missing ${expected}`);
  }

  assert.ok(registry.list().every((adapter) => adapter.runtime.documentationUrl.startsWith("https://")));

  // Codex, Cursor, and Gemini share the open .agents skill artifact without collision.
  assert.equal(
    plan.artifacts.filter((artifact) => artifact.path === ".agents/skills/ship-safely/SKILL.md").length,
    1,
  );
  assert.match(
    plan.artifacts.find((artifact) => artifact.path === ".codex/config.toml")?.content ?? "",
    /timeout = 10/,
  );
  assert.match(
    plan.artifacts.find((artifact) => artifact.path === ".gemini/settings.json")?.content ?? "",
    /"timeout": 10000/,
  );
  assert.ok(registry.list().every((adapter) => adapter.profile?.verifiedAt === "2026-07-15"));
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
