import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  applyIntegrationPlan,
  approveIntegrationPlan,
  createDefaultRegistry,
  createIntegrationPlan,
  createReconciliationPlan,
  createRemovalPlan,
  inspectIntegrationRepository,
  normalizeIntegrationSpec,
  resumeIntegrationOperation,
  verifyIntegrationRuntime,
  type IntegrationPlan,
  type IntegrationSpec,
} from "../src/index.js";

const passiveSpec: IntegrationSpec = {
  id: "fixture-runtime",
  version: "1.0.0",
  project: { name: "Fixture" },
  instructions: { id: "fixture-instructions", version: "1.0.0", content: "Keep changes focused." },
  assets: [{ id: "fixture-note", version: "1.0.0", feature: "assets", path: ".mstack/fixture.txt", content: "fixture" }],
};

test("normalization gives legacy resources deterministic versioned defaults and freezes the result", () => {
  const normalized = normalizeIntegrationSpec({ project: { name: "Legacy App" }, prompts: [{ id: "review", description: "Review", prompt: "Review this." }] });
  assert.equal(normalized.schemaVersion, 1);
  assert.equal(normalized.id, "legacy.legacy-app");
  assert.equal(normalized.version, "0.0.0");
  assert.deepEqual(normalized.resources.map((resource) => [resource.id, resource.kind, resource.version, resource.fallback]), [["review", "prompt", "0.0.0", "degrade"]]);
  assert.ok(Object.isFrozen(normalized));
  assert.ok(Object.isFrozen(normalized.resources));
});

test("inspect, plan, apply, verify, and a second cycle converge while preserving surrounding text", async () => {
  const root = await mkdtemp(join(tmpdir(), "mstack-reconcile-"));
  try {
    await writeFile(join(root, "AGENTS.md"), "# User guidance\n", "utf8");
    const desired = createIntegrationPlan(createDefaultRegistry(), passiveSpec, ["codex"]);
    const first = createReconciliationPlan(desired, await inspectIntegrationRepository(root, desired));
    assert.equal(first.changes.find((change) => change.path === "AGENTS.md")?.action, "update");
    const applied = await applyIntegrationPlan(root, first);
    assert.ok(applied.files.every((file) => file.status !== "conflict"));
    await writeFile(join(root, "AGENTS.md"), `${await readFile(join(root, "AGENTS.md"), "utf8")}\nUser footer.\n`, "utf8");
    const verification = await verifyIntegrationRuntime(root, desired, createDefaultRegistry());
    assert.equal(verification.valid, true);
    assert.equal(verification.converged, true);
    const second = createReconciliationPlan(desired, await inspectIntegrationRepository(root, desired));
    assert.ok(second.changes.every((change) => change.action === "unchanged"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("force cannot replace unmanaged content but a path-specific approval creates a backup", async () => {
  const root = await mkdtemp(join(tmpdir(), "mstack-approval-"));
  try {
    await writeFile(join(root, ".mstack-fixture"), "user\n", "utf8");
    const spec: IntegrationSpec = { project: { name: "Approval" }, assets: [{ id: "managed", version: "1.0.0", feature: "assets", path: ".mstack-fixture", content: "managed" }] };
    const desired = createIntegrationPlan(createDefaultRegistry(), spec, ["codex"]);
    const forced = await applyIntegrationPlan(root, desired, { force: true });
    assert.equal(forced.files.find((file) => file.path === ".mstack-fixture")?.status, "conflict");
    assert.equal(await readFile(join(root, ".mstack-fixture"), "utf8"), "user\n");
    const plan = createReconciliationPlan(desired, await inspectIntegrationRepository(root, desired));
    const requirement = plan.changes.find((change) => change.path === ".mstack-fixture")!.approvalRequirements[0]!;
    const applied = await applyIntegrationPlan(root, approveIntegrationPlan(plan, [{ requirementId: requirement.id, decision: "approve" }]));
    assert.equal(applied.files.find((file) => file.path === ".mstack-fixture")?.status, "updated");
    assert.equal(await readFile(join(root, ".mstack-fixture"), "utf8"), "managed\n");
    await access(join(root, `.mstack/runtime/backups/${plan.operationId}/.mstack-fixture`));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("unchanged privileged resources preserve approvals and repair legacy missing records", async () => {
  const root = await mkdtemp(join(tmpdir(), "mstack-approval-preservation-"));
  try {
    const spec: IntegrationSpec = {
      id: "privileged-runtime",
      version: "1.0.0",
      project: { name: "Approval preservation" },
      assets: [{
        id: "approved-hook",
        version: "1.0.0",
        feature: "hooks",
        path: ".mstack/runtime/hooks/approved.mjs",
        content: "export {};",
        executable: true,
      }],
    };
    const desired = createIntegrationPlan(createDefaultRegistry(), spec, ["codex"]);
    const install = createReconciliationPlan(desired, await inspectIntegrationRepository(root, desired));
    const installed = approveIntegrationPlan(install, install.changes.flatMap((change) =>
      change.approvalRequirements.map((requirement) => ({ requirementId: requirement.id, decision: "approve" as const })),
    ));
    await applyIntegrationPlan(root, installed);

    const manifestPath = join(root, ".mstack/runtime/manifest.json");
    const firstManifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const firstApprovals = firstManifest.resources.find((resource: { resourceId: string }) => resource.resourceId === "approved-hook")?.approvals;
    assert.ok(Array.isArray(firstApprovals) && firstApprovals.length > 0);

    const unchanged = createReconciliationPlan(desired, await inspectIntegrationRepository(root, desired));
    const unchangedHook = unchanged.changes.find((change) => change.resourceId === "approved-hook")!;
    assert.equal(unchangedHook.action, "unchanged");
    assert.deepEqual(unchangedHook.approvalRequirements, []);
    assert.deepEqual(unchangedHook.approvals, firstApprovals);
    await applyIntegrationPlan(root, unchanged);
    const preservedManifest = JSON.parse(await readFile(manifestPath, "utf8"));
    assert.deepEqual(preservedManifest.resources.find((resource: { resourceId: string }) => resource.resourceId === "approved-hook")?.approvals, firstApprovals);

    const brokenManifest = {
      ...preservedManifest,
      resources: preservedManifest.resources.map((resource: { resourceId: string }) =>
        resource.resourceId === "approved-hook" ? { ...resource, approvals: [] } : resource,
      ),
    };
    await writeFile(manifestPath, `${JSON.stringify(brokenManifest, null, 2)}\n`, "utf8");

    const repair = createReconciliationPlan(desired, await inspectIntegrationRepository(root, desired));
    const repairHook = repair.changes.find((change) => change.resourceId === "approved-hook")!;
    assert.equal(repairHook.action, "unchanged");
    assert.ok(repairHook.approvalRequirements.length > 0);
    assert.match(repairHook.reason, /approval record is missing/);
    const blocked = await applyIntegrationPlan(root, repair);
    assert.equal(blocked.files.find((file) => file.path === repairHook.path)?.status, "conflict");

    const repaired = approveIntegrationPlan(repair, repairHook.approvalRequirements.map((requirement) => ({
      requirementId: requirement.id,
      decision: "approve" as const,
    })));
    await applyIntegrationPlan(root, repaired);
    const verification = await verifyIntegrationRuntime(root, desired, createDefaultRegistry());
    assert.equal(verification.valid, true);
    const repairedManifest = JSON.parse(await readFile(manifestPath, "utf8"));
    assert.ok(repairedManifest.resources.find((resource: { resourceId: string }) => resource.resourceId === "approved-hook")?.approvals.length > 0);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("drifted removal is blocked until its operation-specific deletion is approved", async () => {
  const root = await mkdtemp(join(tmpdir(), "mstack-remove-"));
  try {
    const desired = createIntegrationPlan(createDefaultRegistry(), passiveSpec, ["codex"]);
    await applyIntegrationPlan(root, createReconciliationPlan(desired, await inspectIntegrationRepository(root, desired)));
    await writeFile(join(root, ".mstack/fixture.txt"), "user drift\n", "utf8");
    const inspection = await inspectIntegrationRepository(root, desired);
    const removal = createRemovalPlan(inspection, { resourceIds: ["fixture-note"] });
    const change = removal.changes.find((item) => item.path === ".mstack/fixture.txt")!;
    assert.equal(change.action, "conflict");
    assert.equal(change.approvalRequirements[0]?.kind, "drifted-deletion");
    const blocked = await applyIntegrationPlan(root, removal);
    assert.equal(blocked.files.find((file) => file.path === ".mstack/fixture.txt")?.status, "conflict");
    const approved = approveIntegrationPlan(removal, [{ requirementId: change.approvalRequirements[0]!.id, decision: "approve" }]);
    const removed = await applyIntegrationPlan(root, approved);
    assert.equal(removed.files.find((file) => file.path === ".mstack/fixture.txt")?.status, "deleted");
    await assert.rejects(() => access(join(root, ".mstack/fixture.txt")));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("an interrupted operation resumes only from matching previous or next hashes", async () => {
  const root = await mkdtemp(join(tmpdir(), "mstack-resume-"));
  try {
    const spec: IntegrationSpec = { project: { name: "Resume" }, assets: [
      { id: "first", version: "1.0.0", feature: "assets", path: "generated/first.txt", content: "first" },
      { id: "second", version: "1.0.0", feature: "assets", path: "generated/second.txt", content: "second" },
    ] };
    const desired: IntegrationPlan = createIntegrationPlan(createDefaultRegistry(), spec, ["codex"]);
    const plan = createReconciliationPlan(desired, await inspectIntegrationRepository(root, desired));
    const interrupted = await applyIntegrationPlan(root, plan, { failAfterDurableBoundary: 2 });
    assert.ok(interrupted.recovery?.length);
    await assert.rejects(() => access(join(root, ".mstack/runtime/manifest.json")), "manifest must be written after all resource boundaries");
    const resumed = await resumeIntegrationOperation(root, plan);
    assert.equal(resumed.recovery, undefined);
    assert.equal(await readFile(join(root, "generated/first.txt"), "utf8"), "first\n");
    assert.equal(await readFile(join(root, "generated/second.txt"), "utf8"), "second\n");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("a target changed after inspection fails before any planned mutation", async () => {
  const root = await mkdtemp(join(tmpdir(), "mstack-stale-"));
  try {
    const spec: IntegrationSpec = { project: { name: "Stale" }, assets: [
      { id: "first-stale", version: "1.0.0", feature: "assets", path: "generated/first.txt", content: "planned" },
      { id: "second-stale", version: "1.0.0", feature: "assets", path: "generated/second.txt", content: "planned" },
    ] };
    const desired = createIntegrationPlan(createDefaultRegistry(), spec, ["codex"]);
    const plan = createReconciliationPlan(desired, await inspectIntegrationRepository(root, desired));
    await mkdir(join(root, "generated"), { recursive: true });
    await writeFile(join(root, "generated/first.txt"), "concurrent", "utf8");
    await assert.rejects(() => applyIntegrationPlan(root, plan), /changed after inspection/);
    assert.equal(await readFile(join(root, "generated/first.txt"), "utf8"), "concurrent");
    await assert.rejects(() => access(join(root, "generated/second.txt")));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("adapter deselection retains shared contributors and executable modes are explicit", async () => {
  const root = await mkdtemp(join(tmpdir(), "mstack-deselect-"));
  try {
    const spec: IntegrationSpec = {
      project: { name: "Deselect" },
      skills: [{ id: "shared-skill", version: "1.0.0", description: "Shared", instructions: "Use shared guidance." }],
      assets: [{ id: "tool", version: "1.0.0", feature: "assets", path: "tools/check.mjs", content: "process.exit(0);", executable: true }],
    };
    const desired = createIntegrationPlan(createDefaultRegistry(), spec, ["codex", "cursor"]);
    const install = createReconciliationPlan(desired, await inspectIntegrationRepository(root, desired));
    await applyIntegrationPlan(root, approveIntegrationPlan(install, Object.fromEntries(install.changes.flatMap((change) => change.approvalRequirements.map((requirement) => [requirement.id, "approve" as const])))));
    if (process.platform !== "win32") assert.equal((await stat(join(root, "tools/check.mjs"))).mode & 0o777, 0o755);
    const installedManifest = JSON.parse(await readFile(join(root, ".mstack/runtime/manifest.json"), "utf8")) as { resources: Array<{ path: string; mode?: number }> };
    assert.equal(installedManifest.resources.find((resource) => resource.path === "tools/check.mjs")?.mode, 0o755);

    const removal = createRemovalPlan(await inspectIntegrationRepository(root, desired), { environments: ["codex"] });
    await applyIntegrationPlan(root, removal);
    await access(join(root, ".agents/skills/shared-skill/SKILL.md"));
    const manifest = JSON.parse(await readFile(join(root, ".mstack/runtime/manifest.json"), "utf8")) as { resources: Array<{ path: string; adapters: string[] }> };
    assert.deepEqual(manifest.resources.find((resource) => resource.path === ".agents/skills/shared-skill/SKILL.md")?.adapters, ["cursor"]);
  } finally { await rm(root, { recursive: true, force: true }); }
});
