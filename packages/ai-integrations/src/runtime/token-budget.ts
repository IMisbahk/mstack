import type { AgentDefinition, InstallProfile, PromptDefinition, SkillDefinition } from "../types.js";
import { matchesInstallProfile } from "./resource-policy.js";

/** Rough chars-per-token used for doctor/status reporting only. */
export const charsPerTokenEstimate = 4;

export interface TokenBudgetLine {
  readonly kind: "skill" | "prompt" | "agent";
  readonly id: string;
  readonly invocation: "user" | "model" | "agent";
  readonly alwaysOnTokens: number;
  readonly fullLoadTokens: number;
  readonly installProfiles: readonly InstallProfile[];
}

export interface TokenBudgetReport {
  readonly schemaVersion: 1;
  readonly profile: InstallProfile;
  readonly charsPerTokenEstimate: number;
  readonly lines: readonly TokenBudgetLine[];
  readonly totals: {
    readonly resources: number;
    readonly userInvoked: number;
    readonly modelInvoked: number;
    readonly agents: number;
    /** Metadata always visible to the model (name + description). */
    readonly alwaysOnTokens: number;
    /** Cost if every installed resource were fully loaded once. */
    readonly fullLibraryTokens: number;
  };
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / charsPerTokenEstimate));
}

function metadataTokens(id: string, description: string): number {
  return estimateTokens(`${id}\n${description}`);
}

export function buildTokenBudget(options: {
  readonly profile: InstallProfile;
  readonly skills: readonly SkillDefinition[];
  readonly prompts: readonly PromptDefinition[];
  readonly agents: readonly AgentDefinition[];
}): TokenBudgetReport {
  const skills = options.skills.filter((item) => matchesInstallProfile(item.installProfiles, options.profile));
  const prompts = options.prompts.filter((item) => matchesInstallProfile(item.installProfiles, options.profile));
  const agents = options.agents.filter((item) => matchesInstallProfile(item.installProfiles, options.profile));

  const lines: TokenBudgetLine[] = [
    ...skills.map((skill) => ({
      kind: "skill" as const,
      id: skill.id,
      invocation: (skill.invocation ?? "model") as "user" | "model",
      alwaysOnTokens: metadataTokens(skill.id, skill.description),
      fullLoadTokens: estimateTokens(skill.instructions),
      installProfiles: skill.installProfiles ?? ["full"],
    })),
    ...prompts.map((prompt) => ({
      kind: "prompt" as const,
      id: prompt.id,
      invocation: (prompt.invocation ?? "user") as "user" | "model",
      alwaysOnTokens: metadataTokens(prompt.id, prompt.description),
      fullLoadTokens: estimateTokens(prompt.prompt),
      installProfiles: prompt.installProfiles ?? ["full"],
    })),
    ...agents.map((agent) => ({
      kind: "agent" as const,
      id: agent.id,
      invocation: "agent" as const,
      alwaysOnTokens: metadataTokens(agent.id, agent.description),
      fullLoadTokens: estimateTokens(agent.instructions),
      installProfiles: agent.installProfiles ?? ["full"],
    })),
  ];

  return {
    schemaVersion: 1,
    profile: options.profile,
    charsPerTokenEstimate,
    lines,
    totals: {
      resources: lines.length,
      userInvoked: lines.filter((line) => line.invocation === "user").length,
      modelInvoked: lines.filter((line) => line.invocation === "model").length,
      agents: lines.filter((line) => line.kind === "agent").length,
      alwaysOnTokens: lines.reduce((sum, line) => sum + line.alwaysOnTokens, 0),
      fullLibraryTokens: lines.reduce((sum, line) => sum + line.fullLoadTokens, 0),
    },
  };
}
