export { builtInAdapters } from "./adapters/index.js";
export {
  aiderAdapter,
  claudeAdapter,
  codexAdapter,
  continueAdapter,
  cursorAdapter,
  geminiAdapter,
} from "./adapters/index.js";
export { applyIntegrationPlan, type ApplyOptions } from "./core/installer.js";
export { createIntegrationPlan } from "./core/planner.js";
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
