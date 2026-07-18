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
  buildLikeThisMethod,
  createBuildLikeThisRuntime,
  engineeringAgents,
  engineeringHooks,
  engineeringPrompts,
  engineeringSkills,
  hookAssets,
  runtimeTemplates,
  type BuildLikeThisRuntimeOptions,
} from "./runtime/index.js";

import { builtInAdapters } from "./adapters/index.js";
import { IntegrationRegistry } from "./core/registry.js";

export function createDefaultRegistry(): IntegrationRegistry {
  return new IntegrationRegistry(builtInAdapters);
}
