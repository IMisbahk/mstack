import type { IntegrationSpec } from "../../../ai-integrations/src/index.js";

export type TaskRisk = "read-only" | "working-tree" | "destructive" | "remote";

export interface TaskRecipe {
  readonly id: string;
  readonly description: string;
  readonly risk: TaskRisk;
  readonly cwd?: string;
  readonly preconditions?: readonly string[];
  readonly inputs?: readonly { name: string; description: string; required?: boolean }[];
  readonly timeoutMs?: number;
  readonly steps: readonly { argv: readonly string[]; expectedOutput?: string; recovery?: string }[];
}

export interface CapabilityPack {
  readonly id: string;
  readonly version: string;
  readonly displayName: string;
  readonly description: string;
  readonly dependencies?: readonly string[];
  readonly supportedRuntimes?: readonly string[];
  readonly requiredToolchains?: readonly string[];
  readonly risks?: readonly string[];
  readonly createSpec: (context: { projectName: string }) => Pick<IntegrationSpec, "agents" | "skills" | "prompts" | "templates">;
  readonly tasks: readonly TaskRecipe[];
}
