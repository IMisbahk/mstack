import type { ModelRole, PromptDefinition } from "../types.js";

export const modelRoles = ["code", "judgment", "reviewPanel"] as const satisfies readonly ModelRole[];

export interface RuntimeModelCatalog {
  readonly runtimeId: string;
  readonly displayName: string;
  readonly models: readonly string[];
}

/**
 * Documented model identifiers each adapter commonly exposes.
 * Setup maps roles onto these lists; mstack never calls the models itself.
 */
export const runtimeModelCatalogs: readonly RuntimeModelCatalog[] = [
  {
    runtimeId: "claude-code",
    displayName: "Claude Code",
    models: ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5"],
  },
  {
    runtimeId: "cursor",
    displayName: "Cursor",
    models: ["composer-2", "claude-opus-4-6", "claude-sonnet-4-6", "gpt-5.4", "gemini-3.1-pro"],
  },
  {
    runtimeId: "codex",
    displayName: "Codex CLI",
    models: ["gpt-5.4", "o3", "o4-mini"],
  },
  {
    runtimeId: "github-copilot",
    displayName: "GitHub Copilot",
    models: ["gpt-5.4", "claude-sonnet-4-6", "gemini-3.1-pro"],
  },
  {
    runtimeId: "gemini-cli",
    displayName: "Gemini CLI",
    models: ["gemini-3.1-pro", "gemini-3.1-flash"],
  },
  {
    runtimeId: "opencode",
    displayName: "OpenCode",
    models: ["claude-sonnet-4-6", "gpt-5.4", "gemini-3.1-pro"],
  },
];

export interface ModelRoleMapping {
  readonly schemaVersion: 1;
  /** Implementation and editing work. */
  readonly code?: string;
  /** Architecture, product judgment, and acceptance decisions. */
  readonly judgment?: string;
  /** Optional multi-model review panel (ordered). */
  readonly reviewPanel?: readonly string[];
  /** When true, setup installs the optional multi-model arena prompt. */
  readonly arena?: boolean;
  /** Models available to the optional /arena flow. */
  readonly arenaModels?: readonly string[];
}

export interface ModelRoleConfigFile extends ModelRoleMapping {
  readonly updatedAt: string;
  readonly runtimes: readonly string[];
}

export const modelRoleConfigPath = ".mstack/model-roles.json";

export function defaultModelRoleMapping(runtimeIds: readonly string[]): ModelRoleMapping {
  const catalogs = runtimeIds
    .map((id) => runtimeModelCatalogs.find((catalog) => catalog.runtimeId === id))
    .filter((catalog): catalog is RuntimeModelCatalog => catalog !== undefined);
  const firstModels = catalogs.flatMap((catalog) => catalog.models);
  const unique = [...new Set(firstModels)];
  return {
    schemaVersion: 1,
    ...(unique[0] ? { code: unique[0] } : {}),
    ...(unique[1] ? { judgment: unique[1] } : unique[0] ? { judgment: unique[0] } : {}),
    ...(unique.length > 0 ? { reviewPanel: unique.slice(0, Math.min(3, unique.length)) } : {}),
    arena: false,
  };
}

export function modelsForRuntimes(runtimeIds: readonly string[]): readonly string[] {
  const models = runtimeIds.flatMap((id) => {
    const catalog = runtimeModelCatalogs.find((item) => item.runtimeId === id);
    return catalog?.models ?? [];
  });
  return [...new Set(models)];
}

export function renderModelRoleGuidance(mapping: ModelRoleMapping): string {
  const lines = [
    "# mstack model roles",
    "",
    "mstack does not run models. Use these role bindings in the configured AI runtime.",
    "",
    `- code: ${mapping.code ?? "(unset)"}`,
    `- judgment: ${mapping.judgment ?? "(unset)"}`,
    `- reviewPanel: ${(mapping.reviewPanel ?? []).join(", ") || "(unset)"}`,
  ];
  if (mapping.arena) {
    lines.push(
      "",
      "## Arena",
      "",
      "Multi-model arena is enabled. When the user invokes `/arena` or `multi-model-arena`, solicit independent proposals from:",
      ...(mapping.arenaModels ?? mapping.reviewPanel ?? []).map((model) => `- ${model}`),
      "",
      "Compare proposals against the same acceptance criteria, then recommend one path with residual risk.",
    );
  }
  return `${lines.join("\n")}\n`;
}

/** Optional user-invoked arena prompt installed only when arena is enabled. */
export function createArenaPrompt(): PromptDefinition {
  return {
    id: "multi-model-arena",
    version: "1.1.0",
    activation: "explicit",
    security: "content",
    fallback: "degrade",
    invocation: "user",
    installProfiles: ["lite", "full"],
    description: "Collect independent proposals from multiple models, then judge one path against shared acceptance criteria.",
    argumentHint: "[task or decision]",
    prompt: [
      "# multi-model-arena",
      "",
      "Run a bounded multi-model arena for the user's task.",
      "",
      "## Project identity and sources of truth",
      "",
      "Use project-owned docs/, decisions, executable code, and tests as sources of truth.",
      "",
      "## Process",
      "",
      "1. Restate the goal, checkable finish condition, required evidence, and constraints.",
      "2. Read `.mstack/model-roles.json` for arena model bindings; if unset, ask which models to compare.",
      "3. Solicit one independent proposal per arena model without sharing drafts between models.",
      "4. Score each proposal against the same acceptance criteria and constraints.",
      "5. Recommend a single path, name rejected alternatives, and list residual risk.",
      "",
      "## Output contract",
      "",
      "- Goal and finish condition",
      "- Per-model proposal summary",
      "- Comparison table or equivalent structured comparison",
      "- Recommended path with evidence and residual risk",
      "",
      "User arguments: $ARGUMENTS",
    ].join("\n"),
  };
}
