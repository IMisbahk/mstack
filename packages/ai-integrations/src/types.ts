export const integrationFeatures = [
  "prompts",
  "hooks",
  "skills",
  "instructions",
  "rules",
  "slash-commands",
  "agents",
  "automatic-context",
  "repository-onboarding",
  "templates",
  "mcp",
  "permissions",
  "assets",
] as const;

export type IntegrationFeature = (typeof integrationFeatures)[number];
export type SupportLevel = "native" | "emulated" | "experimental" | "unsupported";
export type ResourceKind =
  | "instructions"
  | "rule"
  | "prompt"
  | "skill"
  | "hook"
  | "agent"
  | "context"
  | "onboarding"
  | "template"
  | "mcp-server"
  | "permission"
  | "asset";
export type ActivationMode = "passive" | "explicit" | "privileged";
export type SecurityClass = "content" | "executable" | "network" | "trust" | "policy";
export type FallbackPolicy = "skip" | "degrade" | "fail";
export type ManagementMode = "whole-file" | "managed-block" | "owned-json" | "manual";

export interface ResourceMetadata {
  readonly version?: string;
  readonly activation?: ActivationMode;
  readonly security?: SecurityClass;
  readonly dependencies?: readonly string[];
  readonly platforms?: readonly string[];
  readonly fallback?: FallbackPolicy;
  readonly management?: ManagementMode;
  readonly owner?: string;
  readonly constraints?: Readonly<Record<string, string | number | boolean>>;
}

export interface Capability {
  readonly level: SupportLevel;
  readonly detail: string;
  readonly limitations?: readonly string[];
  readonly minVersion?: string;
  readonly maxVersion?: string;
  readonly requiresTrust?: boolean;
  readonly requiresActivation?: boolean;
}

export type CapabilityMap = Readonly<Record<IntegrationFeature, Capability>>;

export interface CapabilityProfile {
  readonly id: string;
  readonly verifiedAt: string;
  readonly platformVersion?: string;
  readonly capabilities: CapabilityMap;
}

export interface ProjectInstructions extends ResourceMetadata {
  readonly id?: string;
  readonly content: string;
}

export interface PromptDefinition extends ResourceMetadata {
  readonly id: string;
  readonly description: string;
  readonly prompt: string;
  readonly argumentHint?: string;
}

export interface SkillResource extends ResourceMetadata {
  readonly id?: string;
  readonly path: string;
  readonly content: string;
}

export interface SkillDefinition extends ResourceMetadata {
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

export interface HookDefinition extends ResourceMetadata {
  readonly id: string;
  readonly event: HookEvent;
  readonly command: string;
  readonly matcher?: string;
  readonly timeoutMs?: number;
}

export interface AgentDefinition extends ResourceMetadata {
  readonly id: string;
  readonly description: string;
  readonly instructions: string;
  readonly tools?: readonly string[];
  readonly model?: string;
}

export interface ContextSource extends ResourceMetadata {
  readonly id?: string;
  readonly path: string;
  readonly description?: string;
  readonly required?: boolean;
}

export interface RepositoryOnboarding extends ResourceMetadata {
  readonly id?: string;
  readonly summary?: string;
  readonly setupCommands?: readonly string[];
  readonly verificationCommands?: readonly string[];
}

export interface RuntimeAsset extends ResourceMetadata {
  readonly id?: string;
  readonly feature: IntegrationFeature;
  readonly path: string;
  readonly content: string;
  readonly executable?: boolean;
  readonly mode?: number;
}

export interface RuleDefinition extends ResourceMetadata {
  readonly id: string;
  readonly description?: string;
  readonly content: string;
}

export interface TemplateDefinition extends ResourceMetadata {
  readonly id: string;
  readonly path: string;
  readonly content: string;
}

export interface McpServerDefinition extends ResourceMetadata {
  readonly id: string;
  readonly type: "http" | "sse" | "stdio";
  readonly url?: string;
  readonly command?: string;
  readonly args?: readonly string[];
}

export interface PermissionRecommendation extends ResourceMetadata {
  readonly id: string;
  readonly description: string;
  readonly policy: "preserve" | "restrict" | "broaden";
  readonly value: unknown;
}

export interface CanonicalResource extends ResourceMetadata {
  readonly id: string;
  readonly kind: ResourceKind;
  readonly version: string;
  readonly activation: ActivationMode;
  readonly security: SecurityClass;
  readonly dependencies: readonly string[];
  readonly platforms: readonly string[];
  readonly fallback: FallbackPolicy;
  readonly management: ManagementMode;
  readonly owner: string;
  readonly source: Readonly<Record<string, unknown>>;
}

export interface IntegrationSpec {
  readonly schemaVersion?: 1;
  readonly id?: string;
  readonly version?: string;
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
  readonly rules?: readonly RuleDefinition[];
  readonly templates?: readonly TemplateDefinition[];
  readonly mcpServers?: readonly McpServerDefinition[];
  readonly permissionRecommendations?: readonly PermissionRecommendation[];
}

export interface NormalizedIntegrationSpec extends IntegrationSpec {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly version: string;
  readonly resources: readonly CanonicalResource[];
}

export type ArtifactMergeStrategy = "replace" | "managed-block" | "merge-json" | "manual";

export interface JsonOwnedEntry {
  readonly pointer: string;
  readonly identity: string;
  readonly hash: string;
}

export interface GeneratedArtifact {
  readonly environment: string;
  readonly environments?: readonly string[];
  readonly profileId?: string;
  readonly profileIds?: readonly string[];
  readonly profileContributors?: readonly {
    readonly environment: string;
    readonly profileId: string;
  }[];
  readonly resourceId?: string;
  readonly resourceVersion?: string;
  readonly feature: IntegrationFeature;
  readonly path: string;
  readonly content: string;
  readonly mergeStrategy: ArtifactMergeStrategy;
  readonly management?: ManagementMode;
  readonly security?: SecurityClass;
  readonly activation?: ActivationMode;
  readonly dependencies?: readonly string[];
  readonly constraints?: Readonly<Record<string, string | number | boolean>>;
  readonly executable?: boolean;
  readonly mode?: number;
  readonly markerId?: string;
}

export interface IntegrationDiagnostic {
  readonly environment: string;
  readonly feature: IntegrationFeature;
  readonly level: "info" | "warning" | "error";
  readonly message: string;
  readonly resourceId?: string;
}

export interface AdapterRenderResult {
  readonly artifacts: readonly GeneratedArtifact[];
  readonly diagnostics: readonly IntegrationDiagnostic[];
}

export interface AdapterValidationFinding {
  readonly level: "info" | "warning" | "error";
  readonly message: string;
  readonly path?: string;
}

export interface IntegrationAdapter {
  readonly id: string;
  readonly displayName: string;
  readonly runtime: {
    readonly commands: readonly string[];
    readonly projectMarkers: readonly string[];
    readonly documentationUrl: string;
  };
  readonly profile?: CapabilityProfile;
  readonly capabilities: CapabilityMap;
  render(spec: IntegrationSpec): AdapterRenderResult;
  validate?(root: string, artifacts: readonly GeneratedArtifact[]):
    | readonly AdapterValidationFinding[]
    | Promise<readonly AdapterValidationFinding[]>;
}

export interface IntegrationPlan extends AdapterRenderResult {
  readonly schemaVersion?: 1;
  readonly integrationId?: string;
  readonly integrationVersion?: string;
  readonly environments: readonly string[];
}

export interface ManifestOwnedEntry {
  readonly pointer: string;
  readonly identity: string;
  readonly installedHash: string;
}

export interface ManifestResource {
  readonly resourceId: string;
  readonly resourceVersion: string;
  readonly adapters: readonly string[];
  readonly profileIds: readonly string[];
  readonly path: string;
  readonly mergeStrategy: ArtifactMergeStrategy;
  readonly installedHash: string;
  readonly managedHash?: string;
  readonly ownedEntries?: readonly ManifestOwnedEntry[];
  readonly mode?: number;
  readonly security: SecurityClass;
  readonly activation: ActivationMode;
  readonly approvals: readonly string[];
}

export interface IntegrationManifest {
  readonly schemaVersion: 1;
  readonly runtimeId: string;
  readonly runtimeVersion: string;
  readonly resources: readonly ManifestResource[];
  readonly recovery?: {
    readonly operationId: string;
    readonly journalPath: string;
    readonly backupRoot: string;
  };
}

export interface RepositoryFileSnapshot {
  readonly path: string;
  readonly exists: boolean;
  readonly kind: "missing" | "file" | "symlink" | "directory" | "other";
  readonly hash?: string;
  readonly mode?: number;
  readonly size?: number;
  readonly content?: string;
  readonly realPath?: string;
  readonly contained: boolean;
  readonly jsonValid?: boolean;
  readonly markerDefects: readonly string[];
  readonly platformVersion?: string;
}

export interface RepositoryInspection {
  readonly schemaVersion: 1;
  readonly root: string;
  readonly inspectedAt: string;
  readonly desired: readonly GeneratedArtifact[];
  readonly manifest?: IntegrationManifest;
  readonly files: readonly RepositoryFileSnapshot[];
  readonly findings: readonly VerificationFinding[];
}

export type ReconciliationAction =
  | "create"
  | "adopt"
  | "update"
  | "preserve"
  | "conflict"
  | "delete"
  | "unchanged";

export type ApprovalKind =
  | "unmanaged-replacement"
  | "drifted-deletion"
  | "hook-activation"
  | "executable-change"
  | "network-access"
  | "trust-change"
  | "weakened-policy"
  | "ownership-repair"
  | "experimental-activation";

export interface ApprovalRequirement {
  readonly id: string;
  readonly kind: ApprovalKind;
  readonly resourceId: string;
  readonly path: string;
  readonly action: ReconciliationAction;
  readonly reason: string;
}

export interface ApprovalDecision {
  readonly requirementId: string;
  readonly decision: "approve" | "deny";
  readonly decidedBy?: string;
  readonly decidedAt?: string;
}

export interface ReconciliationChange {
  readonly resourceId: string;
  readonly resourceVersion: string;
  readonly adapters: readonly string[];
  readonly feature: IntegrationFeature;
  readonly path: string;
  readonly action: ReconciliationAction;
  readonly reason: string;
  readonly previousHash?: string;
  readonly nextHash?: string;
  readonly previousMode?: number;
  readonly nextMode?: number;
  readonly nextContent?: string;
  readonly mergeStrategy: ArtifactMergeStrategy;
  readonly security: SecurityClass;
  readonly activation: ActivationMode;
  readonly approvalRequirements: readonly ApprovalRequirement[];
  readonly approvals: readonly string[];
  readonly denied: boolean;
  readonly backupRequired: boolean;
  readonly recovery: "none" | "delete-created" | "restore-backup" | "manual";
  readonly ownedEntries?: readonly ManifestOwnedEntry[];
}

export interface ReconciliationPlan {
  readonly schemaVersion: 1;
  readonly operationId: string;
  readonly kind: "install" | "upgrade" | "remove";
  readonly root: string;
  readonly runtimeId: string;
  readonly runtimeVersion: string;
  readonly environments: readonly string[];
  readonly changes: readonly ReconciliationChange[];
  readonly diagnostics: readonly IntegrationDiagnostic[];
  readonly approvals: readonly ApprovalDecision[];
  readonly manifest: IntegrationManifest;
}

export interface OperationJournalEntry {
  readonly path: string;
  readonly state: "pending" | "backed-up" | "written" | "verified";
  readonly previousHash?: string;
  readonly nextHash?: string;
  readonly backupPath?: string;
}

export interface OperationJournal {
  readonly schemaVersion: 1;
  readonly operationId: string;
  readonly planKind: ReconciliationPlan["kind"];
  readonly entries: readonly OperationJournalEntry[];
  readonly manifestWritten: boolean;
}

export type ApplyStatus = "created" | "adopted" | "updated" | "preserved" | "deleted" | "unchanged" | "conflict" | "denied";

export interface AppliedArtifact {
  readonly path: string;
  readonly status: ApplyStatus;
  readonly message?: string;
}

export interface ApplyResult {
  readonly files: readonly AppliedArtifact[];
  readonly diagnostics: readonly IntegrationDiagnostic[];
  readonly operationId?: string;
  readonly manifestPath?: string;
  readonly journalPath?: string;
  readonly recovery?: readonly string[];
}

export interface VerificationFinding {
  readonly code: string;
  readonly level: "info" | "warning" | "error";
  readonly path?: string;
  readonly resourceId?: string;
  readonly message: string;
}

export interface RuntimeVerification {
  readonly valid: boolean;
  readonly findings: readonly VerificationFinding[];
  readonly converged: boolean;
  readonly inspection: RepositoryInspection;
}
