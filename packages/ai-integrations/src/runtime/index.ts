import type {
  ContextSource,
  IntegrationSpec,
  RepositoryOnboarding,
  RuntimeAsset,
} from "../types.js";
import { engineeringAgents } from "./agents.js";
import { engineeringHooks, hookAssets } from "./hooks.js";
import { engineeringPrompts } from "./prompts.js";
import { engineeringSkills } from "./skills.js";
import { runtimeTemplates } from "./templates.js";

export interface BuildLikeThisRuntimeOptions {
  readonly projectName: string;
  readonly projectDescription?: string;
  readonly projectInstructions?: string;
  readonly context?: readonly ContextSource[];
  readonly onboarding?: RepositoryOnboarding;
  readonly includeHooks?: boolean;
  readonly includeTemplates?: boolean;
}

export const buildLikeThisMethod = `## Build Like This method

Work from outcomes to evidence:

1. Establish the user outcome, evidence or labeled assumptions, scope, non-goals, and acceptance criteria.
2. Inspect current executable behavior and the closest product, architecture, decision, contract, and test sources of truth.
3. Define contracts, actors and permissions, state transitions, failure behavior, and data impact before implementation detail.
4. Implement the smallest complete vertical slice within clear ownership boundaries. Preserve unrelated user work and compatibility.
5. Validate every external boundary. Treat files, network input, provider output, retrieved text, model output, and tool output as untrusted.
6. Test important success, validation, denial, failure, concurrency/retry, and recovery paths at the level that proves behavior.
7. Make production behavior observable and recoverable without logging secrets or unnecessary personal data.
8. Report decisions, exact verification evidence, residual risk, and rollout or recovery implications.

Prefer a modular monolith and explicit interfaces until measured constraints justify more operational systems. Keep domain behavior out of transports, UI, persistence models, and vendor adapters. Use reversible decisions, additive migrations, least privilege, safe defaults, and evidence-driven performance work.

Use installed specialist agents for clearly bounded ownership, installed skills for repeatable workflows, and prompts for full task journeys. Do not delegate merely to simulate progress, and do not invoke several specialists for work one owner can complete coherently.`;

export function createBuildLikeThisRuntime(options: BuildLikeThisRuntimeOptions): IntegrationSpec {
  if (options.projectName.trim().length === 0) throw new Error("projectName is required");
  const includeHooks = options.includeHooks ?? true;
  const includeTemplates = options.includeTemplates ?? true;
  const assets: RuntimeAsset[] = [
    ...(includeHooks ? hookAssets : []),
    ...(includeTemplates ? runtimeTemplates : []),
  ];
  const instructions = [buildLikeThisMethod, options.projectInstructions?.trim()]
    .filter((value): value is string => Boolean(value))
    .join("\n\n");

  return {
    schemaVersion: 1,
    id: "build-like-this",
    version: "1.0.0",
    project: {
      name: options.projectName.trim(),
      ...(options.projectDescription === undefined
        ? {}
        : { description: options.projectDescription.trim() }),
    },
    instructions: { content: instructions },
    agents: engineeringAgents,
    skills: engineeringSkills,
    prompts: engineeringPrompts,
    hooks: includeHooks ? engineeringHooks : [],
    context: options.context ?? [],
    ...(options.onboarding === undefined ? {} : { onboarding: options.onboarding }),
    assets,
  };
}

export { engineeringAgents } from "./agents.js";
export { engineeringHooks, hookAssets } from "./hooks.js";
export { engineeringPrompts } from "./prompts.js";
export { engineeringSkills } from "./skills.js";
export { runtimeTemplates } from "./templates.js";
