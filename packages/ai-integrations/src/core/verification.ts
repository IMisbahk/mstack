import { spawnSync } from "node:child_process";
import { join } from "node:path";
import type { IntegrationPlan, ReconciliationPlan, RuntimeVerification, VerificationFinding } from "../types.js";
import { IntegrationRegistry } from "./registry.js";
import { inspectIntegrationRepository } from "./inspection.js";
import { createReconciliationPlan } from "./reconciliation.js";
import { markerIdFor, readManagedBlock } from "./managed-text.js";
import { hashContent, stableStringify } from "./safety.js";

export async function verifyIntegrationRuntime(root: string, desired?: IntegrationPlan | ReconciliationPlan, registry?: IntegrationRegistry): Promise<RuntimeVerification> {
  const integrationPlan = desired === undefined ? undefined : "artifacts" in desired ? desired : reconciliationAsIntegration(desired);
  const inspection = await inspectIntegrationRepository(root, integrationPlan ?? []);
  const findings: VerificationFinding[] = [...inspection.findings];
  for (const resource of inspection.manifest?.resources ?? []) {
    const snapshot = inspection.files.find((file) => file.path === resource.path);
    if (snapshot?.exists !== true) { findings.push({ code: "missing-resource", level: "error", path: resource.path, resourceId: resource.resourceId, message: "Manifest-owned resource is absent" }); continue; }
    if (!snapshot.contained) findings.push({ code: "containment", level: "error", path: resource.path, resourceId: resource.resourceId, message: "Resource is outside the repository" });
    const ownershipValid = resource.mergeStrategy === "managed-block"
      ? resource.managedHash !== undefined && hashContent(readManagedBlock(snapshot.content ?? "", markerIdFor(resource.resourceId)) ?? "") === resource.managedHash
      : resource.mergeStrategy === "merge-json"
        ? ownedJsonValid(snapshot.content ?? "", resource.ownedEntries ?? [])
        : snapshot.hash === resource.installedHash;
    if (!ownershipValid) findings.push({ code: "hash-drift", level: "error", path: resource.path, resourceId: resource.resourceId, message: "Installed managed state differs from the manifest hash" });
    if (process.platform !== "win32" && resource.mode !== undefined && snapshot.mode !== resource.mode) findings.push({ code: "mode-drift", level: "error", path: resource.path, resourceId: resource.resourceId, message: `Expected mode ${resource.mode.toString(8)}, found ${snapshot.mode?.toString(8) ?? "missing"}` });
    if (resource.security !== "content" && resource.approvals.length === 0) findings.push({ code: "missing-approval", level: "error", path: resource.path, resourceId: resource.resourceId, message: "Privileged resource has no recorded operation-specific approval" });
    if (resource.path.endsWith(".mjs") && resource.security === "executable") {
      const checked = spawnSync(process.execPath, ["--check", join(inspection.root, resource.path)], { encoding: "utf8" });
      if (checked.status !== 0) findings.push({ code: "invalid-hook", level: "error", path: resource.path, resourceId: resource.resourceId, message: checked.stderr.trim() || "node --check failed" });
    }
  }
  if (desired !== undefined && "changes" in desired) {
    for (const change of desired.changes.filter((item) => item.denied)) {
      const snapshot = inspection.files.find((file) => file.path === change.path);
      if (snapshot?.exists === true && change.previousHash === undefined) findings.push({ code: "denied-present", level: "error", path: change.path, resourceId: change.resourceId, message: "Denied resource should be intentionally absent" });
      else findings.push({ code: "intentional-absence", level: "info", path: change.path, resourceId: change.resourceId, message: "Resource is absent by explicit decision" });
    }
  }
  if (registry !== undefined && integrationPlan !== undefined) {
    for (const environment of integrationPlan.environments) {
      const adapter = registry.get(environment);
      for (const finding of await adapter.validate?.(inspection.root, integrationPlan.artifacts.filter((artifact) => (artifact.environments ?? [artifact.environment]).includes(environment))) ?? []) findings.push({ code: "adapter-validation", level: finding.level, ...(finding.path === undefined ? {} : { path: finding.path }), message: `${adapter.displayName}: ${finding.message}` });
    }
  }
  let converged = true;
  if (integrationPlan !== undefined) {
    const second = createReconciliationPlan(integrationPlan, inspection);
    converged = second.changes.every((change) => change.action === "unchanged" || change.action === "adopt" || change.denied);
    if (!converged) findings.push({ code: "not-converged", level: "error", message: "A second inspect/plan cycle still proposes changes" });
  }
  return { valid: !findings.some((finding) => finding.level === "error"), findings, converged, inspection };
}

function reconciliationAsIntegration(plan: ReconciliationPlan): IntegrationPlan {
  return { schemaVersion: 1, integrationId: plan.runtimeId, integrationVersion: plan.runtimeVersion, environments: plan.environments, diagnostics: plan.diagnostics, artifacts: plan.changes.filter((change) => change.nextContent !== undefined && !change.denied).map((change) => ({ environment: change.adapters[0] ?? "mstack-runtime", environments: change.adapters, resourceId: change.resourceId, resourceVersion: change.resourceVersion, feature: change.feature, path: change.path, content: change.nextContent!, mergeStrategy: "replace", security: change.security, activation: change.activation, ...(change.nextMode === undefined ? {} : { mode: change.nextMode }) })) };
}

function ownedJsonValid(content: string, entries: readonly { pointer: string; identity: string; installedHash: string }[]): boolean {
  let root: unknown; try { root = JSON.parse(content); } catch { return false; }
  for (const entry of entries) {
    let value: unknown = root;
    for (const segment of entry.pointer.split("/").slice(1).map((item) => item.replaceAll("~1", "/").replaceAll("~0", "~"))) {
      if (value === null || Array.isArray(value) || typeof value !== "object") return false;
      value = (value as Record<string, unknown>)[segment];
    }
    if (Array.isArray(value)) value = value.find((item) => jsonIdentity(item) === entry.identity);
    if (value === undefined || hashContent(stableStringify(value)) !== entry.installedHash) return false;
  }
  return true;
}
function jsonIdentity(value: unknown): string {
  if (value !== null && !Array.isArray(value) && typeof value === "object") {
    const object = value as Record<string, unknown>;
    for (const key of ["id", "name", "command"]) if (typeof object[key] === "string") return `${key}:${object[key]}`;
    const hooks = object.hooks;
    if (Array.isArray(hooks) && hooks[0] !== null && typeof hooks[0] === "object" && typeof (hooks[0] as Record<string, unknown>).command === "string") return `command:${(hooks[0] as Record<string, unknown>).command}`;
  }
  return `hash:${hashContent(stableStringify(value))}`;
}
