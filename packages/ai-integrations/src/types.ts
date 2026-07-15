export const integrationFeatures = [
  "prompts",
  "hooks",
  "skills",
  "instructions",
  "slash-commands",
  "agents",
  "automatic-context",
  "repository-onboarding",
] as const;

export type IntegrationFeature = (typeof integrationFeatures)[number];
export type SupportLevel = "native" | "emulated" | "unsupported";

export interface Capability {
  readonly level: SupportLevel;
  readonly detail: string;
}

export type CapabilityMap = Readonly<Record<IntegrationFeature, Capability>>;

export interface ProjectInstructions {
  readonly content: string;
}

export interface PromptDefinition {
  readonly id: string;
  readonly description: string;
  readonly prompt: string;
  readonly argumentHint?: string;
}

export interface SkillResource {
  readonly path: string;
  readonly content: string;
}

export interface SkillDefinition {
  readonly id: string;
  readonly description: string;
  readonly instructions: string;
  readonly resources?: readonly SkillResource[];
}

export type HookEvent =
  | "session-start"
  | "before-prompt"
  | "before-tool"
  | "after-tool"
  | "after-response"
  | "session-end";

export interface HookDefinition {
  readonly id: string;
  readonly event: HookEvent;
  readonly command: string;
  readonly matcher?: string;
  readonly timeoutMs?: number;
}

export interface AgentDefinition {
  readonly id: string;
  readonly description: string;
  readonly instructions: string;
  readonly tools?: readonly string[];
  readonly model?: string;
}

export interface ContextSource {
  readonly path: string;
  readonly description?: string;
  readonly required?: boolean;
}

export interface RepositoryOnboarding {
  readonly summary?: string;
  readonly setupCommands?: readonly string[];
  readonly verificationCommands?: readonly string[];
}

export interface RuntimeAsset {
  readonly feature: IntegrationFeature;
  readonly path: string;
  readonly content: string;
  readonly executable?: boolean;
}

export interface IntegrationSpec {
  readonly project: {
    readonly name: string;
    readonly description?: string;
  };
  readonly instructions?: ProjectInstructions;
  readonly prompts?: readonly PromptDefinition[];
  readonly skills?: readonly SkillDefinition[];
  readonly hooks?: readonly HookDefinition[];
  readonly agents?: readonly AgentDefinition[];
  readonly context?: readonly ContextSource[];
  readonly onboarding?: RepositoryOnboarding;
  /** Platform-neutral files installed once, regardless of the selected adapters. */
  readonly assets?: readonly RuntimeAsset[];
}

export type ArtifactMergeStrategy = "replace" | "managed-block" | "merge-json";

export interface GeneratedArtifact {
  readonly environment: string;
  readonly feature: IntegrationFeature;
  readonly path: string;
  readonly content: string;
  readonly mergeStrategy: ArtifactMergeStrategy;
  readonly executable?: boolean;
}

export interface IntegrationDiagnostic {
  readonly environment: string;
  readonly feature: IntegrationFeature;
  readonly level: "info" | "warning";
  readonly message: string;
}

export interface AdapterRenderResult {
  readonly artifacts: readonly GeneratedArtifact[];
  readonly diagnostics: readonly IntegrationDiagnostic[];
}

export interface IntegrationAdapter {
  readonly id: string;
  readonly displayName: string;
  readonly runtime: {
    readonly commands: readonly string[];
    readonly projectMarkers: readonly string[];
    readonly documentationUrl: string;
  };
  readonly capabilities: CapabilityMap;
  render(spec: IntegrationSpec): AdapterRenderResult;
}

export interface IntegrationPlan extends AdapterRenderResult {
  readonly environments: readonly string[];
}

export type ApplyStatus = "created" | "updated" | "unchanged" | "conflict";

export interface AppliedArtifact {
  readonly path: string;
  readonly status: ApplyStatus;
  readonly message?: string;
}

export interface ApplyResult {
  readonly files: readonly AppliedArtifact[];
  readonly diagnostics: readonly IntegrationDiagnostic[];
}
