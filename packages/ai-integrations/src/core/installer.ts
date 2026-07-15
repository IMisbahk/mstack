import { chmod, copyFile, lstat, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type {
  AppliedArtifact,
  ApplyResult,
  IntegrationPlan,
  OperationJournal,
  OperationJournalEntry,
  ReconciliationChange,
  ReconciliationPlan,
} from "../types.js";
import { inspectIntegrationRepository } from "./inspection.js";
import { writeRuntimeManifest } from "./manifest.js";
import { createReconciliationPlan } from "./reconciliation.js";
import { assertSafeTarget, canonicalRepositoryRoot, hashContent } from "./safety.js";
import { validateIntegrationPlan, validateReconciliationPlan } from "./validation.js";

export interface ApplyOptions {
  readonly dryRun?: boolean;
  /** @deprecated force does not satisfy operation-specific approvals. */
  readonly force?: boolean;
  /** Test-only deterministic fault injection after N durable boundaries. */
  readonly failAfterDurableBoundary?: number;
}

export async function applyIntegrationPlan(root: string, input: IntegrationPlan | ReconciliationPlan, options: ApplyOptions = {}): Promise<ApplyResult> {
  const repositoryRoot = await canonicalRepositoryRoot(root);
  const plan = isReconciliationPlan(input) ? input : await legacyPlan(repositoryRoot, input);
  validateReconciliationPlan(plan);
  if (plan.root !== repositoryRoot) throw new Error(`Plan root does not match repository root`);

  const unresolved = plan.changes.flatMap((change) => change.approvalRequirements.filter((requirement) => !change.approvals.includes(requirement.id) && !change.denied));
  if (unresolved.length > 0) {
    return { files: plan.changes.map((change) => ({ path: change.path, status: change.approvalRequirements.some((item) => unresolved.includes(item)) ? "conflict" : previewStatus(change), ...(change.approvalRequirements.some((item) => unresolved.includes(item)) ? { message: `Approval required: ${change.approvalRequirements.filter((item) => unresolved.includes(item)).map((item) => item.kind).join(", ")}` } : {}) })), diagnostics: plan.diagnostics, operationId: plan.operationId, manifestPath: ".mstack/runtime/manifest.json" };
  }
  const files = plan.changes.map((change) => ({ path: change.path, status: change.denied ? "denied" as const : appliedStatus(change), ...(change.denied ? { message: "Resource was intentionally left absent by an explicit denial" } : {}) }));
  if (options.dryRun === true) return { files, diagnostics: plan.diagnostics, operationId: plan.operationId, manifestPath: ".mstack/runtime/manifest.json" };

  await preflight(repositoryRoot, plan.changes.filter((change) => !change.denied));
  const journalPath = `.mstack/runtime/operations/${plan.operationId}.json`;
  const stagingRoot = `.mstack/runtime/staging/${plan.operationId}`;
  const backupRoot = `.mstack/runtime/backups/${plan.operationId}`;
  let boundaries = 0;
  const fail = (): void => { boundaries += 1; if (options.failAfterDurableBoundary === boundaries) throw new Error(`Injected failure after durable boundary ${boundaries}`); };

  const entries: OperationJournalEntry[] = plan.changes.filter(mutates).map((change) => ({ path: change.path, state: "pending", ...(change.previousHash === undefined ? {} : { previousHash: change.previousHash }), ...(change.nextHash === undefined ? {} : { nextHash: change.nextHash }) }));
  let journal: OperationJournal = { schemaVersion: 1, operationId: plan.operationId, planKind: plan.kind, entries, manifestWritten: false };
  await writeJournal(repositoryRoot, journalPath, journal); fail();

  try {
    for (const change of plan.changes) {
      if (!mutates(change) || change.denied) continue;
      const target = await assertSafeTarget(repositoryRoot, change.path);
      const entryIndex = journal.entries.findIndex((entry) => entry.path === change.path);
      if (entryIndex < 0) throw new Error(`Operation journal is missing ${change.path}`);
      let entry = journal.entries[entryIndex]!;
      if (change.backupRequired && change.previousHash !== undefined) {
        const backupRelative = `${backupRoot}/${change.path}`;
        const backup = await assertSafeTarget(repositoryRoot, backupRelative);
        await mkdir(dirname(backup), { recursive: true }); await copyFile(target, backup);
        entry = { ...entry, state: "backed-up", backupPath: backupRelative };
        journal = replaceEntry(journal, entryIndex, entry); await writeJournal(repositoryRoot, journalPath, journal); fail();
      }
      await assertExpectedHash(target, change.previousHash);
      await assertSafeTarget(repositoryRoot, change.path);
      if ((change.action === "delete" || (change.action === "conflict" && change.nextHash === undefined)) && change.nextContent === undefined) await rm(target, { force: true });
      else if (change.nextContent !== undefined) {
        const stageRelative = `${stagingRoot}/${change.path}`; const stage = await assertSafeTarget(repositoryRoot, stageRelative);
        await mkdir(dirname(stage), { recursive: true }); await writeFile(stage, change.nextContent, { encoding: "utf8", mode: change.nextMode ?? 0o644 });
        await mkdir(dirname(target), { recursive: true }); await assertSafeTarget(repositoryRoot, change.path); await rename(stage, target);
        if (change.nextMode !== undefined) await chmod(target, change.nextMode);
      }
      entry = { ...entry, state: "written" }; journal = replaceEntry(journal, entryIndex, entry); await writeJournal(repositoryRoot, journalPath, journal); fail();
      await assertExpectedHash(target, change.nextHash);
      entry = { ...entry, state: "verified" }; journal = replaceEntry(journal, entryIndex, entry); await writeJournal(repositoryRoot, journalPath, journal); fail();
    }
    await rm(join(repositoryRoot, stagingRoot), { recursive: true, force: true });
    await writeRuntimeManifest(repositoryRoot, plan.manifest);
    return { files, diagnostics: plan.diagnostics, operationId: plan.operationId, manifestPath: ".mstack/runtime/manifest.json", journalPath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { files: files.map((file) => journal.entries.find((entry) => entry.path === file.path)?.state === "verified" ? file : file.status === "unchanged" || file.status === "adopted" || file.status === "preserved" ? file : { ...file, status: "conflict", message }), diagnostics: plan.diagnostics, operationId: plan.operationId, journalPath, recovery: [message, ...journal.entries.filter((entry) => entry.state !== "verified").map((entry) => `${entry.path}: verify current hash before resuming${entry.backupPath === undefined ? "" : `; backup ${entry.backupPath}`}`)] };
  }
}

export async function resumeIntegrationOperation(root: string, plan: ReconciliationPlan): Promise<ApplyResult> {
  const repositoryRoot = await canonicalRepositoryRoot(root); validateReconciliationPlan(plan);
  const remaining: ReconciliationChange[] = []; const manual: string[] = [];
  for (const change of plan.changes) {
    if (!mutates(change)) { remaining.push(change); continue; }
    const target = await assertSafeTarget(repositoryRoot, change.path); const hash = await optionalHash(target);
    if (hash === change.nextHash) remaining.push({ ...change, action: "unchanged", ...(hash === undefined ? {} : { previousHash: hash }), approvals: change.approvalRequirements.map((item) => item.id), backupRequired: false, recovery: "none" });
    else if (hash === change.previousHash || (hash === undefined && change.previousHash === undefined)) remaining.push(change);
    else manual.push(`${change.path}: expected ${change.previousHash ?? "missing"} or ${change.nextHash ?? "missing"}, found ${hash ?? "missing"}`);
  }
  if (manual.length > 0) return { files: plan.changes.map((change) => ({ path: change.path, status: "conflict", message: "Manual recovery required" })), diagnostics: plan.diagnostics, operationId: plan.operationId, recovery: manual };
  return applyIntegrationPlan(repositoryRoot, { ...plan, changes: remaining });
}

async function legacyPlan(root: string, plan: IntegrationPlan): Promise<ReconciliationPlan> { validateIntegrationPlan(plan); const inspection = await inspectIntegrationRepository(root, plan); return createReconciliationPlan(plan, inspection); }
function isReconciliationPlan(value: IntegrationPlan | ReconciliationPlan): value is ReconciliationPlan { return "changes" in value && "operationId" in value; }
function mutates(change: ReconciliationChange): boolean { return !change.denied && ["create", "update", "conflict", "delete"].includes(change.action); }
function previewStatus(change: ReconciliationChange): AppliedArtifact["status"] { const map: Record<ReconciliationChange["action"], AppliedArtifact["status"]> = { create: "created", adopt: "adopted", update: "updated", preserve: "preserved", conflict: "conflict", delete: "deleted", unchanged: "unchanged" }; return map[change.action]; }
function appliedStatus(change: ReconciliationChange): AppliedArtifact["status"] { return change.action === "conflict" ? (change.nextHash === undefined ? "deleted" : change.previousHash === undefined ? "created" : "updated") : previewStatus(change); }

async function preflight(root: string, changes: readonly ReconciliationChange[]): Promise<void> {
  for (const change of changes) {
    await assertSafeTarget(root, change.path);
    if (mutates(change)) {
      const target = join(root, change.path); await assertExpectedHash(target, change.previousHash);
      if (change.nextContent !== undefined && hashContent(change.nextContent) !== change.nextHash) throw new Error(`Plan content hash is invalid for ${change.path}`);
    }
  }
}
async function assertExpectedHash(path: string, expected: string | undefined): Promise<void> { const actual = await optionalHash(path); if (actual !== expected) throw new Error(`Target changed after inspection: ${path}`); }
async function optionalHash(path: string): Promise<string | undefined> { try { const stats = await lstat(path); if (!stats.isFile() || stats.isSymbolicLink()) throw new Error(`Target is not a regular file: ${path}`); return hashContent(await readFile(path)); } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error; } }
async function writeJournal(root: string, relative: string, journal: OperationJournal): Promise<void> { const path = await assertSafeTarget(root, relative); await mkdir(dirname(path), { recursive: true }); const temporary = `${path}.${process.pid}.tmp`; await writeFile(temporary, `${JSON.stringify(journal, null, 2)}\n`, { encoding: "utf8", mode: 0o600 }); await rename(temporary, path); }
function replaceEntry(journal: OperationJournal, index: number, entry: OperationJournalEntry): OperationJournal { return { ...journal, entries: journal.entries.map((current, currentIndex) => currentIndex === index ? entry : current) }; }
