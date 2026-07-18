import type {
  CanonicalResource,
  GeneratedArtifact,
  IntegrationAdapter,
  IntegrationManifest,
  IntegrationPlan,
  IntegrationSpec,
  ResourceMetadata,
  ReconciliationPlan,
} from "../types.js";
import {
  assertHttpsUrl,
  assertIdentifier,
  assertSafeRelativePath,
  assertVersion,
} from "./safety.js";

export { assertSafeRelativePath } from "./safety.js";

const hookEvents = new Set(["session-start", "before-prompt", "before-tool", "after-tool", "after-response", "session-end"]);
const features = new Set(["prompts", "hooks", "skills", "instructions", "rules", "slash-commands", "agents", "automatic-context", "repository-onboarding", "templates", "mcp", "permissions", "assets"]);
const activationModes = new Set(["passive", "explicit", "privileged"]);
const securityClasses = new Set(["content", "executable", "network", "trust", "policy"]);
const fallbackPolicies = new Set(["skip", "degrade", "fail"]);
const managementModes = new Set(["whole-file", "managed-block", "owned-json", "manual"]);
const mergeStrategies = new Set(["replace", "managed-block", "merge-json", "manual"]);
const supportLevels = new Set(["native", "emulated", "experimental", "unsupported"]);
const reconciliationActions = new Set(["create", "adopt", "update", "preserve", "conflict", "delete", "unchanged"]);

export function validateIntegrationSpec(spec: IntegrationSpec): void {
  if (spec === null || typeof spec !== "object") throw new Error("Integration spec must be an object");
  requireText(spec.project?.name, "project.name");
  if (spec.schemaVersion !== undefined && spec.schemaVersion !== 1) throw new Error("Unsupported spec schemaVersion");
  if (spec.id !== undefined) assertIdentifier(spec.id, "integration id");
  if (spec.version !== undefined) assertVersion(spec.version, "integration version");

  const ids = new Map<string, string>();
  const register = (id: string, kind: string, version?: string): void => {
    assertIdentifier(id, `${kind} id`);
    const previous = ids.get(id);
    if (previous !== undefined) throw new Error(`Duplicate integration id '${id}' used by ${previous} and ${kind}`);
    ids.set(id, kind);
    if (version !== undefined) assertVersion(version, `${kind} '${id}' version`);
  };
  const metadata = (value: ResourceMetadata, label: string): void => {
    for (const dependency of value.dependencies ?? []) assertIdentifier(dependency, `${label} dependency`);
    for (const platform of value.platforms ?? []) assertIdentifier(platform, `${label} platform`);
    if (value.activation !== undefined && !activationModes.has(value.activation)) throw new Error(`${label} has invalid activation`);
    if (value.security !== undefined && !securityClasses.has(value.security)) throw new Error(`${label} has invalid security class`);
    if (value.fallback !== undefined && !fallbackPolicies.has(value.fallback)) throw new Error(`${label} has invalid fallback policy`);
    if (value.management !== undefined && !managementModes.has(value.management)) throw new Error(`${label} has invalid management mode`);
    for (const [key, constraint] of Object.entries(value.constraints ?? {})) { assertIdentifier(key, `${label} constraint`); if (!["string", "number", "boolean"].includes(typeof constraint) || (typeof constraint === "number" && !Number.isFinite(constraint))) throw new Error(`${label} constraint '${key}' must be a finite scalar`); }
  };

  if (spec.instructions !== undefined) {
    requireText(spec.instructions.content, "instructions content");
    if (spec.instructions.id !== undefined) register(spec.instructions.id, "instructions", spec.instructions.version);
    metadata(spec.instructions, "instructions");
  }
  for (const prompt of spec.prompts ?? []) {
    register(prompt.id, "prompt", prompt.version); requireText(prompt.description, `prompt '${prompt.id}' description`); requireText(prompt.prompt, `prompt '${prompt.id}' body`); metadata(prompt, `prompt '${prompt.id}'`);
  }
  for (const skill of spec.skills ?? []) {
    register(skill.id, "skill", skill.version); requireText(skill.description, `skill '${skill.id}' description`); requireText(skill.instructions, `skill '${skill.id}' instructions`); metadata(skill, `skill '${skill.id}'`);
    const paths = new Set<string>();
    for (const resource of skill.resources ?? []) {
      assertSafeRelativePath(resource.path, `resource path for skill '${skill.id}'`); requireText(resource.content, `resource '${resource.path}' content`);
      if (paths.has(resource.path)) throw new Error(`Duplicate resource path '${resource.path}' in skill '${skill.id}'`);
      paths.add(resource.path);
    }
  }
  for (const hook of spec.hooks ?? []) {
    register(hook.id, "hook", hook.version); requireText(hook.command, `hook '${hook.id}' command`); metadata(hook, `hook '${hook.id}'`);
    if (!hookEvents.has(hook.event)) throw new Error(`hook '${hook.id}' has an invalid event`);
    validateCommand(hook.command, `hook '${hook.id}' command`);
    if (hook.timeoutMs !== undefined && (!Number.isInteger(hook.timeoutMs) || hook.timeoutMs <= 0)) throw new Error(`hook '${hook.id}' timeoutMs must be a positive integer`);
  }
  for (const agent of spec.agents ?? []) {
    register(agent.id, "agent", agent.version); requireText(agent.description, `agent '${agent.id}' description`); requireText(agent.instructions, `agent '${agent.id}' instructions`); metadata(agent, `agent '${agent.id}'`);
    for (const tool of agent.tools ?? []) requireText(tool, `agent '${agent.id}' tool`);
  }
  for (const [index, source] of (spec.context ?? []).entries()) {
    if (source.id !== undefined) register(source.id, "context", source.version);
    assertSafeRelativePath(source.path, `context path at index ${index}`); metadata(source, `context '${source.path}'`);
  }
  if (spec.onboarding !== undefined) {
    if (spec.onboarding.id !== undefined) register(spec.onboarding.id, "onboarding", spec.onboarding.version);
    for (const command of [...(spec.onboarding.setupCommands ?? []), ...(spec.onboarding.verificationCommands ?? [])]) validateCommand(command, "onboarding command");
  }
  const assetPaths = new Set<string>();
  for (const asset of spec.assets ?? []) {
    if (asset.id !== undefined) register(asset.id, "asset", asset.version);
    assertSafeRelativePath(asset.path, "runtime asset path");
    if (assetPaths.has(asset.path)) throw new Error(`Duplicate runtime asset path: ${asset.path}`);
    assetPaths.add(asset.path); requireText(asset.content, `runtime asset '${asset.path}' content`); validateMode(asset.mode, asset.path);
    if (!features.has(asset.feature)) throw new Error(`runtime asset '${asset.path}' has an invalid feature`);
  }
  for (const rule of spec.rules ?? []) { register(rule.id, "rule", rule.version); requireText(rule.content, `rule '${rule.id}' content`); }
  for (const template of spec.templates ?? []) { register(template.id, "template", template.version); assertSafeRelativePath(template.path, `template '${template.id}' path`); requireText(template.content, `template '${template.id}' content`); }
  for (const server of spec.mcpServers ?? []) {
    register(server.id, "mcp server", server.version);
    metadata(server, `mcp server '${server.id}'`);
    if (!["http", "sse", "stdio"].includes(server.type)) throw new Error(`mcp server '${server.id}' has invalid type`);
    if (server.type === "stdio") { requireText(server.command, `mcp server '${server.id}' command`); validateCommand(server.command!, `mcp server '${server.id}' command`); if (server.url !== undefined) throw new Error(`stdio mcp server '${server.id}' must not define url`); }
    else { requireText(server.url, `mcp server '${server.id}' url`); assertHttpsUrl(server.url!, `mcp server '${server.id}' url`, true); if (server.command !== undefined) throw new Error(`remote mcp server '${server.id}' must not define command`); }
  }
  for (const permission of spec.permissionRecommendations ?? []) { register(permission.id, "permission", permission.version); requireText(permission.description, `permission '${permission.id}' description`); metadata(permission, `permission '${permission.id}'`); if (!["preserve", "restrict", "broaden"].includes(permission.policy)) throw new Error(`permission '${permission.id}' has invalid policy`); }
}

export function validateAdapter(adapter: IntegrationAdapter): void {
  assertIdentifier(adapter.id, "adapter id"); requireText(adapter.displayName, "adapter displayName"); assertHttpsUrl(adapter.runtime.documentationUrl, `adapter '${adapter.id}' documentationUrl`);
  if (adapter.runtime.commands.length === 0 && adapter.runtime.projectMarkers.length === 0) throw new Error(`adapter '${adapter.id}' must declare a command or provider-unique project marker`);
  for (const command of adapter.runtime.commands) validateCommand(command, `adapter '${adapter.id}' command`);
  for (const marker of adapter.runtime.projectMarkers) assertSafeRelativePath(marker, `adapter '${adapter.id}' project marker`);
  for (const feature of features) if (adapter.capabilities[feature as keyof typeof adapter.capabilities] === undefined) throw new Error(`adapter '${adapter.id}' is missing capability '${feature}'`);
  for (const [feature, capability] of Object.entries(adapter.capabilities)) {
    if (!features.has(feature)) throw new Error(`adapter '${adapter.id}' has an unknown capability '${feature}'`);
    requireText(capability.detail, `adapter '${adapter.id}' capability '${feature}' detail`);
    if (!supportLevels.has(capability.level)) throw new Error(`adapter '${adapter.id}' capability '${feature}' has invalid level`);
    if (capability.minVersion !== undefined) assertVersion(capability.minVersion, `adapter '${adapter.id}' minimum version`);
    if (capability.maxVersion !== undefined) assertVersion(capability.maxVersion, `adapter '${adapter.id}' maximum version`);
  }
  if (adapter.profile !== undefined) {
    assertIdentifier(adapter.profile.id, `adapter '${adapter.id}' profile id`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(adapter.profile.verifiedAt)) throw new Error(`adapter '${adapter.id}' profile verifiedAt must be YYYY-MM-DD`);
  }
}

export function validateArtifact(artifact: GeneratedArtifact): void {
  assertIdentifier(artifact.environment, "artifact environment"); assertSafeRelativePath(artifact.path, "artifact path"); requireText(artifact.content, `artifact '${artifact.path}' content`);
  if (!features.has(artifact.feature)) throw new Error(`artifact '${artifact.path}' has invalid feature`);
  if (!mergeStrategies.has(artifact.mergeStrategy)) throw new Error(`artifact '${artifact.path}' has invalid mergeStrategy`);
  if (artifact.management !== undefined && !managementModes.has(artifact.management)) throw new Error(`artifact '${artifact.path}' has invalid management`);
  if (artifact.security !== undefined && !securityClasses.has(artifact.security)) throw new Error(`artifact '${artifact.path}' has invalid security`);
  if (artifact.activation !== undefined && !activationModes.has(artifact.activation)) throw new Error(`artifact '${artifact.path}' has invalid activation`);
  if (artifact.resourceId !== undefined) assertIdentifier(artifact.resourceId, "artifact resourceId");
  if (artifact.resourceVersion !== undefined) assertVersion(artifact.resourceVersion, "artifact resourceVersion");
  if (artifact.profileId !== undefined) assertIdentifier(artifact.profileId, "artifact profile id");
  for (const profileId of artifact.profileIds ?? []) assertIdentifier(profileId, "artifact profile id");
  for (const contributor of artifact.profileContributors ?? []) {
    assertIdentifier(contributor.environment, "artifact profile environment");
    assertIdentifier(contributor.profileId, "artifact profile id");
    if (!(artifact.environments ?? [artifact.environment]).includes(contributor.environment)) throw new Error(`artifact '${artifact.path}' has a profile for non-contributing environment '${contributor.environment}'`);
  }
  validateMode(artifact.mode, artifact.path);
}

export function validateIntegrationPlan(plan: IntegrationPlan): void {
  if (plan.environments.length === 0) throw new Error("At least one AI environment is required");
  for (const environment of plan.environments) assertIdentifier(environment, "plan environment");
  const paths = new Set<string>();
  for (const artifact of plan.artifacts) { validateArtifact(artifact); if (paths.has(artifact.path)) throw new Error(`Duplicate artifact path: ${artifact.path}`); paths.add(artifact.path); }
}

export function validateManifest(manifest: IntegrationManifest): void {
  if (manifest.schemaVersion !== 1) throw new Error("Unsupported runtime manifest schemaVersion");
  assertIdentifier(manifest.runtimeId, "manifest runtimeId"); assertVersion(manifest.runtimeVersion, "manifest runtimeVersion");
  const paths = new Set<string>();
  for (const resource of manifest.resources) {
    assertIdentifier(resource.resourceId, "manifest resourceId"); assertVersion(resource.resourceVersion, "manifest resourceVersion"); assertSafeRelativePath(resource.path, "manifest resource path");
    if (!/^[a-f0-9]{64}$/.test(resource.installedHash)) throw new Error(`manifest resource '${resource.resourceId}' has invalid installedHash`);
    if (resource.managedHash !== undefined && !/^[a-f0-9]{64}$/.test(resource.managedHash)) throw new Error(`manifest resource '${resource.resourceId}' has invalid managedHash`);
    if (!mergeStrategies.has(resource.mergeStrategy) || !securityClasses.has(resource.security) || !activationModes.has(resource.activation)) throw new Error(`manifest resource '${resource.resourceId}' has invalid ownership metadata`);
    if (paths.has(resource.path)) throw new Error(`manifest has duplicate resource path '${resource.path}'`); paths.add(resource.path);
    validateMode(resource.mode, resource.path);
    for (const adapter of resource.adapters) assertIdentifier(adapter, "manifest adapter");
    for (const profile of resource.profileIds) assertIdentifier(profile, "manifest profile id");
    for (const approval of resource.approvals) assertIdentifier(approval, "manifest approval id");
    for (const entry of resource.ownedEntries ?? []) if (!/^[a-f0-9]{64}$/.test(entry.installedHash)) throw new Error(`manifest resource '${resource.resourceId}' has invalid owned entry hash`);
  }
  if (manifest.recovery !== undefined) { assertIdentifier(manifest.recovery.operationId, "manifest operationId"); assertSafeRelativePath(manifest.recovery.journalPath, "manifest journal path"); assertSafeRelativePath(manifest.recovery.backupRoot, "manifest backup root"); }
}

export function validateReconciliationPlan(plan: ReconciliationPlan): void {
  if (plan.schemaVersion !== 1) throw new Error("Unsupported reconciliation plan schemaVersion");
  assertIdentifier(plan.runtimeId, "plan runtimeId"); assertVersion(plan.runtimeVersion, "plan runtimeVersion");
  assertIdentifier(plan.operationId, "plan operationId");
  for (const change of plan.changes) { assertSafeRelativePath(change.path, "change path"); assertIdentifier(change.resourceId, "change resourceId"); if (!reconciliationActions.has(change.action) || !mergeStrategies.has(change.mergeStrategy) || !securityClasses.has(change.security) || !activationModes.has(change.activation)) throw new Error(`change '${change.path}' has invalid reconciliation metadata`); if (change.nextContent !== undefined && change.nextHash === undefined) throw new Error(`change '${change.path}' has content without nextHash`); if (change.previousHash !== undefined && !/^[a-f0-9]{64}$/.test(change.previousHash)) throw new Error(`change '${change.path}' has invalid previousHash`); if (change.nextHash !== undefined && !/^[a-f0-9]{64}$/.test(change.nextHash)) throw new Error(`change '${change.path}' has invalid nextHash`); validateMode(change.previousMode, change.path); validateMode(change.nextMode, change.path); for (const requirement of change.approvalRequirements) { assertIdentifier(requirement.id, "approval requirement id"); if (requirement.path !== change.path || requirement.resourceId !== change.resourceId) throw new Error(`approval requirement '${requirement.id}' does not match its change`); } }
  validateManifest(plan.manifest);
}

export function validateCanonicalResource(resource: CanonicalResource): void {
  assertIdentifier(resource.id, `${resource.kind} id`); assertVersion(resource.version, `${resource.kind} '${resource.id}' version`);
  for (const dependency of resource.dependencies) assertIdentifier(dependency, `${resource.kind} '${resource.id}' dependency`);
}

function validateMode(mode: number | undefined, path: string): void {
  if (mode !== undefined && (!Number.isInteger(mode) || mode < 0 || mode > 0o777)) throw new Error(`mode for '${path}' must be an integer between 0 and 0777`);
}

function requireText(value: string | undefined, label: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${label} is required`);
}
function validateCommand(value: string, label: string): void { requireText(value, label); if (value.includes("\0") || /[\r\n]/.test(value)) throw new Error(`${label} must be one line`); }
