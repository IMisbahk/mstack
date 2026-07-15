import type {
  ApprovalDecision,
  ApprovalKind,
  ApprovalRequirement,
  GeneratedArtifact,
  IntegrationManifest,
  IntegrationPlan,
  ManifestResource,
  ReconciliationAction,
  ReconciliationChange,
  ReconciliationPlan,
  RepositoryFileSnapshot,
  RepositoryInspection,
} from "../types.js";
import { markerIdFor, mergeManagedBlock, readManagedBlock, removeManagedBlock } from "./managed-text.js";
import { reconcileOwnedJson, removeOwnedJson } from "./owned-json.js";
import { deepFreeze, hashContent, stableStringify } from "./safety.js";
import { validateReconciliationPlan } from "./validation.js";

export function createReconciliationPlan(desired: IntegrationPlan, inspection: RepositoryInspection): ReconciliationPlan {
  return createPlan("install", desired, inspection);
}

export function createUpgradePlan(desired: IntegrationPlan, inspection: RepositoryInspection): ReconciliationPlan {
  return createPlan("upgrade", desired, inspection);
}

export interface RemovalPlanOptions { readonly resourceIds?: readonly string[]; readonly environments?: readonly string[]; }

export function createRemovalPlan(inspection: RepositoryInspection, options: RemovalPlanOptions = {}): ReconciliationPlan {
  const selectedIds = options.resourceIds === undefined ? undefined : new Set(options.resourceIds);
  const selectedEnvironments = options.environments === undefined ? undefined : new Set(options.environments);
  const retained = inspection.desired.flatMap((artifact) => {
    const resource = inspection.manifest?.resources.find((item) => item.resourceId === resourceId(artifact) && item.path === artifact.path);
    if (resource === undefined || selectedIds?.has(resource.resourceId)) return [];
    if (selectedIds === undefined && selectedEnvironments === undefined) return [];
    if (selectedEnvironments === undefined) return [artifact];
    const remaining = (artifact.environments ?? [artifact.environment]).filter((adapter) => !selectedEnvironments.has(adapter));
    return remaining.length === 0 ? [] : [{ ...artifact, environment: remaining[0]!, environments: remaining }];
  });
  const desired: IntegrationPlan = { schemaVersion: 1, integrationId: inspection.manifest?.runtimeId ?? "legacy.runtime", integrationVersion: inspection.manifest?.runtimeVersion ?? "0.0.0", environments: [], artifacts: retained, diagnostics: [] };
  return createPlan("remove", desired, inspection);
}

function createPlan(kind: ReconciliationPlan["kind"], desired: IntegrationPlan, inspection: RepositoryInspection): ReconciliationPlan {
  if (inspection.root.length === 0) throw new Error("Inspection root is required");
  const operationId = `op.${hashContent(stableStringify({ kind, runtime: desired.integrationId, version: desired.integrationVersion, desired: desired.artifacts.map(materialArtifact), current: inspection.files.map((file) => [file.path, file.hash]), manifest: inspection.manifest })).slice(0, 20)}`;
  const desiredByPath = new Map(desired.artifacts.map((artifact) => [artifact.path, artifact]));
  const previousByPath = new Map((inspection.manifest?.resources ?? []).map((resource) => [resource.path, resource]));
  const snapshotByPath = new Map(inspection.files.map((file) => [file.path, file]));
  const paths = new Set([...desiredByPath.keys(), ...previousByPath.keys()]);
  const changes: ReconciliationChange[] = [];

  for (const path of [...paths].sort()) {
    const artifact = desiredByPath.get(path);
    const previous = previousByPath.get(path);
    const snapshot = snapshotByPath.get(path) ?? missing(path);
    changes.push(artifact === undefined ? planDeletion(operationId, previous!, snapshot) : planDesired(operationId, artifact, previous, snapshot));
  }
  const ordered = orderByDependencies(changes, desired.artifacts);
  const manifest = buildManifest(desired, ordered, operationId);
  const plan: ReconciliationPlan = { schemaVersion: 1, operationId, kind, root: inspection.root, runtimeId: desired.integrationId ?? inspection.manifest?.runtimeId ?? "legacy.runtime", runtimeVersion: desired.integrationVersion ?? inspection.manifest?.runtimeVersion ?? "0.0.0", environments: desired.environments, changes: ordered, diagnostics: desired.diagnostics, approvals: [], manifest };
  validateReconciliationPlan(plan);
  return deepFreeze(plan) as ReconciliationPlan;
}

function planDesired(operationId: string, artifact: GeneratedArtifact, previous: ManifestResource | undefined, snapshot: RepositoryFileSnapshot): ReconciliationChange {
  const id = resourceId(artifact); const version = artifact.resourceVersion ?? "0.0.0";
  const security = artifact.security ?? "content"; const activation = artifact.activation ?? "passive";
  let nextContent = artifact.content; let ownedEntries = previous?.ownedEntries; const mergeConflicts: string[] = [];
  try {
    if (artifact.mergeStrategy === "managed-block") {
      const marker = markerIdFor(artifact.markerId ?? id);
      const merged = mergeManagedBlock(snapshot.content, marker, artifact.content, [artifact.environment]);
      nextContent = merged.content;
    } else if (artifact.mergeStrategy === "merge-json") {
      const merged = reconcileOwnedJson(snapshot.content, artifact.content, previous?.ownedEntries);
      nextContent = merged.content; ownedEntries = merged.entries; mergeConflicts.push(...merged.conflicts);
    }
  } catch (error) { mergeConflicts.push(error instanceof Error ? error.message : String(error)); }
  const nextHash = hashContent(nextContent); const currentHash = snapshot.hash;
  let action: ReconciliationAction; let reason: string;
  if (!snapshot.exists) { action = "create"; reason = "Target does not exist"; }
  else if (currentHash === nextHash) { action = previous === undefined ? "adopt" : "unchanged"; reason = previous === undefined ? "Existing content exactly matches the desired artifact" : "Installed content already matches"; }
  else if (mergeConflicts.length > 0) { action = "conflict"; reason = `Owned structured data conflicts at ${mergeConflicts.join(", ")}`; }
  else if (previous === undefined) {
    if (artifact.mergeStrategy === "managed-block" || artifact.mergeStrategy === "merge-json") { action = "update"; reason = "Add managed state while preserving unowned content"; }
    else { action = "conflict"; reason = "Existing file has no validated ownership"; }
  } else if (ownedStateUnchanged(previous, snapshot, artifact)) { action = "update"; reason = "Previously owned state is unchanged and can be reconciled"; }
  else { action = "conflict"; reason = "Previously owned state has drifted"; }
  if (artifact.mergeStrategy === "manual" && snapshot.exists && currentHash !== nextHash) { action = "conflict"; reason = "Shared TOML/YAML requires manual reconciliation"; }

  const requirements = requirementsFor(operationId, id, artifact.path, action, reason, artifact, previous !== undefined);
  return {
    resourceId: id, resourceVersion: version, adapters: artifact.environments ?? [artifact.environment], feature: artifact.feature, path: artifact.path,
    action, reason, ...(currentHash === undefined ? {} : { previousHash: currentHash }), nextHash,
    ...(snapshot.mode === undefined ? {} : { previousMode: snapshot.mode }), nextMode: artifact.mode ?? (artifact.executable === true ? 0o755 : snapshot.mode ?? 0o644), nextContent,
    mergeStrategy: artifact.mergeStrategy, security, activation, approvalRequirements: requirements, approvals: [], denied: false,
    backupRequired: snapshot.exists && action !== "unchanged" && action !== "adopt", recovery: !snapshot.exists ? "delete-created" : action === "unchanged" || action === "adopt" ? "none" : "restore-backup",
    ...(ownedEntries === undefined ? {} : { ownedEntries }),
  };
}

function planDeletion(operationId: string, previous: ManifestResource, snapshot: RepositoryFileSnapshot): ReconciliationChange {
  let nextContent: string | undefined; let nextHash: string | undefined; let drift = false;
  if (!snapshot.exists) return { resourceId: previous.resourceId, resourceVersion: previous.resourceVersion, adapters: previous.adapters, feature: "assets", path: previous.path, action: "unchanged", reason: "Previously owned target is already absent", mergeStrategy: previous.mergeStrategy, security: previous.security, activation: previous.activation, approvalRequirements: [], approvals: [], denied: false, backupRequired: false, recovery: "none" };
  if (previous.mergeStrategy === "managed-block") {
    const block = readManagedBlock(snapshot.content ?? "", markerIdFor(previous.resourceId));
    drift = block === undefined || (previous.managedHash !== undefined && hashContent(block) !== previous.managedHash);
    nextContent = removeManagedBlock(snapshot.content ?? "", markerIdFor(previous.resourceId)); nextHash = hashContent(nextContent);
  } else if (previous.mergeStrategy === "merge-json") {
    const removed = removeOwnedJson(snapshot.content ?? "{}", previous.ownedEntries ?? []); drift = removed.conflicts.length > 0; nextContent = removed.content; nextHash = hashContent(nextContent);
  } else drift = snapshot.hash !== previous.installedHash;
  const action: ReconciliationAction = drift ? "conflict" : "delete";
  const reason = drift ? "Previously owned state has drifted and cannot be deleted safely" : "Previously owned resource is no longer desired";
  const requirements = drift ? [requirement(operationId, "drifted-deletion", previous.resourceId, previous.path, action, reason)] : [];
  return { resourceId: previous.resourceId, resourceVersion: previous.resourceVersion, adapters: previous.adapters, feature: "assets", path: previous.path, action, reason, ...(snapshot.hash === undefined ? {} : { previousHash: snapshot.hash }), ...(nextHash === undefined ? {} : { nextHash }), ...(snapshot.mode === undefined ? {} : { previousMode: snapshot.mode }), ...(snapshot.mode === undefined ? {} : { nextMode: snapshot.mode }), ...(nextContent === undefined ? {} : { nextContent }), mergeStrategy: previous.mergeStrategy, security: previous.security, activation: previous.activation, approvalRequirements: requirements, approvals: [], denied: false, backupRequired: true, recovery: "restore-backup" };
}

function requirementsFor(operationId: string, id: string, path: string, action: ReconciliationAction, reason: string, artifact: GeneratedArtifact, previouslyOwned: boolean): ApprovalRequirement[] {
  const kinds: ApprovalKind[] = [];
  if (action === "conflict") kinds.push(previouslyOwned ? "ownership-repair" : "unmanaged-replacement");
  if (action !== "unchanged") {
    if (artifact.feature === "hooks") kinds.push("hook-activation");
    if (artifact.executable === true || artifact.security === "executable" || artifact.constraints?.["executable-change"] === true) kinds.push("executable-change");
    if (artifact.security === "network" || artifact.feature === "mcp") kinds.push("network-access");
    if (artifact.security === "trust") kinds.push("trust-change");
    if (artifact.security === "policy") kinds.push("weakened-policy");
    if (artifact.constraints?.experimental === true) kinds.push("experimental-activation");
  }
  return [...new Set(kinds)].map((kind) => requirement(operationId, kind, id, path, action, reason));
}
function requirement(operationId: string, kind: ApprovalKind, resourceIdValue: string, path: string, action: ReconciliationAction, reason: string): ApprovalRequirement { return { id: `${operationId}.${kind}.${hashContent(`${resourceIdValue}:${path}:${action}`).slice(0, 12)}`, kind, resourceId: resourceIdValue, path, action, reason }; }

export function approveIntegrationPlan(plan: ReconciliationPlan, decisions: readonly ApprovalDecision[] | Readonly<Record<string, "approve" | "deny">>): ReconciliationPlan {
  const list: ApprovalDecision[] = Array.isArray(decisions) ? [...decisions] : Object.entries(decisions).map(([requirementId, decision]) => ({ requirementId, decision }));
  const required = new Set(plan.changes.flatMap((change) => change.approvalRequirements.map((item) => item.id)));
  const seen = new Set<string>();
  for (const decision of list) {
    if (decision.decision !== "approve" && decision.decision !== "deny") throw new Error(`Approval '${decision.requirementId}' has invalid decision`);
    if (!required.has(decision.requirementId)) throw new Error(`Approval '${decision.requirementId}' does not belong to operation '${plan.operationId}'`);
    if (seen.has(decision.requirementId)) throw new Error(`Duplicate approval decision '${decision.requirementId}'`);
    if (decision.decidedBy !== undefined && decision.decidedBy.trim().length === 0) throw new Error(`Approval '${decision.requirementId}' decidedBy is empty`);
    if (decision.decidedAt !== undefined && Number.isNaN(Date.parse(decision.decidedAt))) throw new Error(`Approval '${decision.requirementId}' decidedAt is invalid`);
    seen.add(decision.requirementId);
  }
  const byId = new Map(list.map((decision) => [decision.requirementId, decision]));
  const changes = plan.changes.map((change) => {
    const approvals = change.approvalRequirements.filter((item) => byId.get(item.id)?.decision === "approve").map((item) => item.id);
    const denied = change.approvalRequirements.some((item) => byId.get(item.id)?.decision === "deny");
    if (denied) {
      const { nextContent: _nextContent, nextHash: _nextHash, ...preserved } = change;
      void _nextContent; void _nextHash;
      return { ...preserved, action: "preserve" as const, reason: "Explicit operation decision denied this resource; existing state is preserved", approvals, denied };
    }
    return { ...change, approvals, denied };
  });
  const manifestResources = plan.manifest.resources.filter((resource) => !changes.some((change) => change.resourceId === resource.resourceId && change.path === resource.path && change.denied));
  const approved = { ...plan, changes, approvals: list, manifest: { ...plan.manifest, resources: manifestResources } };
  validateReconciliationPlan(approved);
  return deepFreeze(approved) as ReconciliationPlan;
}

function buildManifest(desired: IntegrationPlan, changes: readonly ReconciliationChange[], operationId: string): IntegrationManifest {
  const artifacts = new Map(desired.artifacts.map((artifact) => [`${resourceId(artifact)}\0${artifact.path}`, artifact]));
  const resources: ManifestResource[] = [];
  for (const change of changes) {
    const artifact = artifacts.get(`${change.resourceId}\0${change.path}`);
    if (artifact === undefined || change.nextHash === undefined) continue;
    const managedHash = artifact.mergeStrategy === "managed-block" ? hashContent(artifact.content.trim()) : undefined;
    resources.push({ resourceId: change.resourceId, resourceVersion: change.resourceVersion, adapters: change.adapters, profileIds: artifact.profileId === undefined ? [] : [artifact.profileId], path: change.path, mergeStrategy: change.mergeStrategy, installedHash: change.nextHash, ...(managedHash === undefined ? {} : { managedHash }), ...(change.ownedEntries === undefined ? {} : { ownedEntries: change.ownedEntries }), ...(change.nextMode === undefined ? {} : { mode: change.nextMode }), security: change.security, activation: change.activation, approvals: change.approvalRequirements.map((item) => item.id) });
  }
  return { schemaVersion: 1, runtimeId: desired.integrationId ?? "legacy.runtime", runtimeVersion: desired.integrationVersion ?? "0.0.0", resources, recovery: { operationId, journalPath: `.mstack/runtime/operations/${operationId}.json`, backupRoot: `.mstack/runtime/backups/${operationId}` } };
}

function ownedStateUnchanged(previous: ManifestResource, snapshot: RepositoryFileSnapshot, artifact: GeneratedArtifact): boolean {
  if (!snapshot.exists) return false;
  if (artifact.mergeStrategy === "managed-block") { const block = readManagedBlock(snapshot.content ?? "", markerIdFor(artifact.markerId ?? resourceId(artifact))) ?? readManagedBlock(snapshot.content ?? "", artifact.environment); return block !== undefined && (previous.managedHash === undefined || hashContent(block) === previous.managedHash); }
  return snapshot.hash === previous.installedHash;
}
function resourceId(artifact: GeneratedArtifact): string { return artifact.resourceId ?? `${artifact.feature}.${hashContent(artifact.path).slice(0, 12)}`; }
function missing(path: string): RepositoryFileSnapshot { return { path, exists: false, kind: "missing", contained: true, markerDefects: [] }; }
function materialArtifact(artifact: GeneratedArtifact): unknown { return { ...artifact, contentHash: hashContent(artifact.content), content: undefined }; }
function orderByDependencies(changes: readonly ReconciliationChange[], artifacts: readonly GeneratedArtifact[]): ReconciliationChange[] {
  const dependencies = new Map(artifacts.map((artifact) => [`${resourceId(artifact)}\0${artifact.path}`, artifact.dependencies ?? []]));
  const byResource = new Map<string, ReconciliationChange[]>();
  for (const change of changes) byResource.set(change.resourceId, [...(byResource.get(change.resourceId) ?? []), change]);
  const result: ReconciliationChange[] = []; const visiting = new Set<string>(); const visited = new Set<string>();
  const visit = (change: ReconciliationChange): void => {
    const key = `${change.resourceId}\0${change.path}`; if (visited.has(key)) return; if (visiting.has(key)) throw new Error(`Artifact dependency cycle includes '${change.resourceId}'`);
    visiting.add(key); for (const dependency of dependencies.get(key) ?? []) for (const dependencyChange of byResource.get(dependency) ?? []) visit(dependencyChange);
    visiting.delete(key); visited.add(key); result.push(change);
  };
  for (const change of changes) visit(change); return result;
}
