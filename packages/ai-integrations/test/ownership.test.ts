import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  applyIntegrationPlan,
  approveIntegrationPlan,
  createDefaultRegistry,
  createIntegrationPlan,
  createReconciliationPlan,
  createUpgradePlan,
  inspectIntegrationRepository,
  type IntegrationSpec,
  type ReconciliationPlan,
} from "../src/index.js";

test("owned JSON entries preserve unowned settings, detect drift, and remove only owned entries", async () => {
  const root = await mkdtemp(join(tmpdir(), "mstack-json-"));
  try {
    await mkdir(join(root, ".gemini"));
    await writeFile(join(root, ".gemini/settings.json"), `${JSON.stringify({ theme: "dark" }, null, 2)}\n`);
    const withHook: IntegrationSpec = { project: { name: "JSON" }, hooks: [{ id: "verify", version: "1.0.0", event: "after-response", command: "node verify.mjs" }] };
    const desired = createIntegrationPlan(createDefaultRegistry(), withHook, ["gemini-cli"]);
    const installedPlan = createReconciliationPlan(desired, await inspectIntegrationRepository(root, desired));
    await applyIntegrationPlan(root, approveAll(installedPlan));
    const installed = JSON.parse(await readFile(join(root, ".gemini/settings.json"), "utf8")) as Record<string, unknown>;
    assert.equal(installed.theme, "dark");

    installed.theme = "light";
    await writeFile(join(root, ".gemini/settings.json"), `${JSON.stringify(installed, null, 2)}\n`);
    const unchanged = createReconciliationPlan(desired, await inspectIntegrationRepository(root, desired));
    assert.equal(unchanged.changes.find((change) => change.path === ".gemini/settings.json")?.action, "unchanged");

    const drifted = structuredClone(installed) as { hooks: Record<string, Array<{ hooks: Array<{ command: string }> }>> };
    drifted.hooks.AfterAgent![0]!.hooks[0]!.command = "node changed.mjs";
    await writeFile(join(root, ".gemini/settings.json"), `${JSON.stringify(drifted, null, 2)}\n`);
    const conflict = createReconciliationPlan(desired, await inspectIntegrationRepository(root, desired));
    assert.equal(conflict.changes.find((change) => change.path === ".gemini/settings.json")?.action, "conflict");
    await applyIntegrationPlan(root, approveAll(conflict));

    const withoutHook = createIntegrationPlan(createDefaultRegistry(), { project: { name: "JSON" } }, ["gemini-cli"]);
    const removal = createUpgradePlan(withoutHook, await inspectIntegrationRepository(root, withoutHook));
    await applyIntegrationPlan(root, removal);
    assert.deepEqual(JSON.parse(await readFile(join(root, ".gemini/settings.json"), "utf8")), { theme: "light" });
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("legacy unnamed Claude and Cursor hooks upgrade without duplicates or losing user hooks", async () => {
  const root = await mkdtemp(join(tmpdir(), "mstack-legacy-hooks-"));
  try {
    const hook: IntegrationSpec["hooks"] = [
      { id: "verify", version: "1.0.0", event: "after-response", command: "node verify.mjs" },
    ];
    const desired = createIntegrationPlan(
      createDefaultRegistry(),
      { project: { name: "Legacy hooks" }, hooks: hook },
      ["claude-code", "cursor"],
    );
    const userClaudeHook = {
      name: "user-claude-hook",
      matcher: "Bash",
      hooks: [{ type: "command", command: "node user-claude.mjs" }],
    };
    const userCursorHook = {
      name: "user-cursor-hook",
      command: "node user-cursor.mjs",
    };

    await mkdir(join(root, ".claude"), { recursive: true });
    await mkdir(join(root, ".cursor"), { recursive: true });
    await writeFile(join(root, ".claude/settings.json"), `${JSON.stringify({
      permissions: { deny: ["Read(.env)"] },
      hooks: {
        Stop: [
          { hooks: [{ type: "command", command: "node verify.mjs" }] },
          userClaudeHook,
        ],
      },
    }, null, 2)}\n`);
    await writeFile(join(root, ".cursor/hooks.json"), `${JSON.stringify({
      version: 1,
      userSetting: true,
      hooks: {
        afterAgentResponse: [
          { command: "node verify.mjs" },
          userCursorHook,
        ],
      },
    }, null, 2)}\n`);

    const upgrade = createUpgradePlan(desired, await inspectIntegrationRepository(root, desired));
    assert.equal(upgrade.changes.find((change) => change.path === ".claude/settings.json")?.action, "update");
    assert.equal(upgrade.changes.find((change) => change.path === ".cursor/hooks.json")?.action, "update");
    const applied = await applyIntegrationPlan(root, approveAll(upgrade));
    assert.ok(applied.files.every((file) => file.status !== "conflict"));

    const claude = JSON.parse(await readFile(join(root, ".claude/settings.json"), "utf8")) as {
      permissions: { deny: string[] };
      hooks: { Stop: Array<{ name?: string; matcher?: string; hooks: Array<{ type: string; command: string }> }> };
    };
    assert.deepEqual(claude.permissions, { deny: ["Read(.env)"] });
    assert.equal(claude.hooks.Stop.filter((entry) => entry.hooks[0]?.command === "node verify.mjs").length, 1);
    assert.equal(claude.hooks.Stop.find((entry) => entry.hooks[0]?.command === "node verify.mjs")?.name, "verify");
    assert.deepEqual(claude.hooks.Stop.find((entry) => entry.name === userClaudeHook.name), userClaudeHook);

    const cursor = JSON.parse(await readFile(join(root, ".cursor/hooks.json"), "utf8")) as {
      userSetting: boolean;
      hooks: { afterAgentResponse: Array<{ name?: string; command: string }> };
    };
    assert.equal(cursor.userSetting, true);
    assert.equal(cursor.hooks.afterAgentResponse.filter((entry) => entry.command === "node verify.mjs").length, 1);
    assert.equal(cursor.hooks.afterAgentResponse.find((entry) => entry.command === "node verify.mjs")?.name, "verify");
    assert.deepEqual(cursor.hooks.afterAgentResponse.find((entry) => entry.name === userCursorHook.name), userCursorHook);

    const converged = createUpgradePlan(desired, await inspectIntegrationRepository(root, desired));
    assert.equal(converged.changes.find((change) => change.path === ".claude/settings.json")?.action, "unchanged");
    assert.equal(converged.changes.find((change) => change.path === ".cursor/hooks.json")?.action, "unchanged");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("managed text migrates one legacy adapter marker and conflicts on duplicate markers", async () => {
  const root = await mkdtemp(join(tmpdir(), "mstack-markers-"));
  try {
    const spec: IntegrationSpec = { project: { name: "Markers" }, instructions: { id: "project-guidance", version: "1.0.0", content: "New guidance." } };
    const desired = createIntegrationPlan(createDefaultRegistry(), spec, ["codex"]);
    await writeFile(join(root, "AGENTS.md"), "# User\n\n<!-- mstack:codex:start -->\nOld\n<!-- mstack:codex:end -->\n");
    const migration = createReconciliationPlan(desired, await inspectIntegrationRepository(root, desired));
    assert.equal(migration.changes.find((change) => change.path === "AGENTS.md")?.action, "update");
    await applyIntegrationPlan(root, migration);
    const migrated = await readFile(join(root, "AGENTS.md"), "utf8");
    assert.match(migrated, /mstack:project-guidance:start/);
    assert.doesNotMatch(migrated, /mstack:codex:start/);

    await writeFile(join(root, "AGENTS.md"), `${migrated}\n<!-- mstack:project-guidance:start -->\nDuplicate\n<!-- mstack:project-guidance:end -->\n`);
    const malformed = createReconciliationPlan(desired, await inspectIntegrationRepository(root, desired));
    const change = malformed.changes.find((item) => item.path === "AGENTS.md")!;
    assert.equal(change.action, "conflict");
    assert.match(change.reason, /marker/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("inspection rejects manifests containing user content, secrets, or absolute paths", async () => {
  const root = await mkdtemp(join(tmpdir(), "mstack-manifest-"));
  try {
    await mkdir(join(root, ".mstack/runtime"), { recursive: true });
    const base = { schemaVersion: 1, runtimeId: "fixture", runtimeVersion: "1.0.0", resources: [] };
    for (const extra of [{ content: "private" }, { secretToken: "token" }, { recoveryHint: "/absolute/path" }]) {
      await writeFile(join(root, ".mstack/runtime/manifest.json"), JSON.stringify({ ...base, ...extra }));
      await assert.rejects(() => inspectIntegrationRepository(root), /must not store/);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

function approveAll(plan: ReconciliationPlan): ReconciliationPlan {
  return approveIntegrationPlan(plan, plan.changes.flatMap((change) => change.approvalRequirements.map((requirement) => ({ requirementId: requirement.id, decision: "approve" as const }))));
}
