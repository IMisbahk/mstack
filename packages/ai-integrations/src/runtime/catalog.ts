import { builtInAdapters } from "../adapters/index.js";
import type { InstallProfile, IntegrationSpec } from "../types.js";
import { engineeringAgents } from "./agents.js";
import { engineeringHooks, hookAssets } from "./hooks.js";
import { playbookSkills } from "./playbooks.js";
import { principleSkills } from "./principles.js";
import { applyAgentPolicy, applyPromptPolicy, applySkillPolicy, matchesInstallProfile } from "./resource-policy.js";
import { engineeringPrompts } from "./prompts.js";
import { deliverySkills } from "./skills.js";
import { runtimeTemplates } from "./templates.js";
import { workflowSkills } from "./workflow.js";

/** Composed skill library — keep in sync with runtime/index.ts engineeringSkills. */
const engineeringSkills = [...deliverySkills, ...principleSkills, ...playbookSkills, ...workflowSkills];

export interface RuntimeResourceCounts {
  readonly schemaVersion: 1;
  readonly generatedFrom: "build-like-this-runtime";
  readonly adapters: number;
  readonly agents: number;
  readonly skills: number;
  readonly prompts: number;
  readonly hooks: number;
  readonly templates: number;
  readonly hookAssets: number;
  readonly profiles: {
    readonly lite: {
      readonly agents: number;
      readonly skills: number;
      readonly prompts: number;
    };
    readonly full: {
      readonly agents: number;
      readonly skills: number;
      readonly prompts: number;
    };
  };
}

export function decoratedSkills() {
  return engineeringSkills.map(applySkillPolicy);
}

export function decoratedPrompts() {
  return engineeringPrompts.map(applyPromptPolicy);
}

export function decoratedAgents() {
  return engineeringAgents.map(applyAgentPolicy);
}

export function countForProfile(profile: InstallProfile): {
  readonly agents: number;
  readonly skills: number;
  readonly prompts: number;
} {
  return {
    agents: decoratedAgents().filter((item) => matchesInstallProfile(item.installProfiles, profile)).length,
    skills: decoratedSkills().filter((item) => matchesInstallProfile(item.installProfiles, profile)).length,
    prompts: decoratedPrompts().filter((item) => matchesInstallProfile(item.installProfiles, profile)).length,
  };
}

export function buildRuntimeResourceCounts(): RuntimeResourceCounts {
  return {
    schemaVersion: 1,
    generatedFrom: "build-like-this-runtime",
    adapters: builtInAdapters.length,
    agents: engineeringAgents.length,
    skills: engineeringSkills.length,
    prompts: engineeringPrompts.length,
    hooks: engineeringHooks.length,
    templates: runtimeTemplates.length,
    hookAssets: hookAssets.length,
    profiles: {
      lite: countForProfile("lite"),
      full: countForProfile("full"),
    },
  };
}

export function filterSpecForProfile(spec: IntegrationSpec, profile: InstallProfile): IntegrationSpec {
  return {
    ...spec,
    agents: (spec.agents ?? []).filter((item) => matchesInstallProfile(item.installProfiles, profile)),
    skills: (spec.skills ?? []).filter((item) => matchesInstallProfile(item.installProfiles, profile)),
    prompts: (spec.prompts ?? []).filter((item) => matchesInstallProfile(item.installProfiles, profile)),
  };
}
