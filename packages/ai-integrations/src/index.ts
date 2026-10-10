export { builtInAdapters } from "./adapters/index.js";
export {
  aiderAdapter,
  antigravityAdapter,
  claudeAdapter,
  clineAdapter,
  codexAdapter,
  continueAdapter,
  cursorAdapter,
  geminiAdapter,
  githubCopilotAdapter,
  junieAdapter,
  kimiCodeAdapter,
  kiroAdapter,
  openCodeAdapter,
  qwenCodeAdapter,
  rooCodeAdapter,
  warpAdapter,
  windsurfAdapter,
  ampAdapter,
  zedAdapter,
} from "./adapters/index.js";
export { applyIntegrationPlan, resumeIntegrationOperation, type ApplyOptions } from "./core/installer.js";
export { createIntegrationPlan } from "./core/planner.js";
export { normalizeIntegrationSpec } from "./core/normalization.js";
export { inspectIntegrationRepository } from "./core/inspection.js";
export { approveIntegrationPlan, createReconciliationPlan, createRemovalPlan, createUpgradePlan, type RemovalPlanOptions } from "./core/reconciliation.js";
export { verifyIntegrationRuntime } from "./core/verification.js";
export { hashContent } from "./core/safety.js";
export { IntegrationRegistry } from "./core/registry.js";
export { assertSafeRelativePath, validateIntegrationSpec } from "./core/validation.js";
export { integrationFeatures } from "./types.js";
export type * from "./types.js";
export {
  applyAgentPolicy,
  applyPromptPolicy,
  applySkillPolicy,
  buildLikeThisMethod,
  buildRuntimeResourceCounts,
  buildTokenBudget,
  charsPerTokenEstimate,
  countForProfile,
  buildCursorPluginBundle,
  createArenaPrompt,
  createBuildLikeThisRuntime,
  createInstallChannelRecord,
  decoratedAgents,
  decoratedPrompts,
  decoratedSkills,
  defaultModelRoleMapping,
  deliverySkills,
  engineeringAgents,
  engineeringHooks,
  engineeringPrompts,
  engineeringSkills,
  filterSpecForProfile,
  hookAssets,
  installChannelPath,
  matchesInstallProfile,
  modelRoleConfigPath,
  modelRoles,
  modelsForRuntimes,
  mstackGeneratedMarker,
  playbookCatalog,
  playbookSkills,
  principleSkills,
  promptPolicy,
  agentPolicy,
  renderModelRoleGuidance,
  runtimeModelCatalogs,
  runtimeTemplates,
  skillPolicy,
  renderMstackRouterSkill,
  renderSetupMstackSkill,
  workflowSkills,
  type BuildLikeThisRuntimeOptions,
  type CursorPluginBundle,
  type CursorPluginFile,
  type DuplicateSkillFinding,
  type InstallChannel,
  type InstallChannelRecord,
  type ModelRoleConfigFile,
  type ModelRoleMapping,
  type RuntimeModelCatalog,
  type RuntimeResourceCounts,
  type TokenBudgetReport,
} from "./runtime/index.js";

import { builtInAdapters } from "./adapters/index.js";
import { IntegrationRegistry } from "./core/registry.js";

export function createDefaultRegistry(): IntegrationRegistry {
  return new IntegrationRegistry(builtInAdapters);
}
