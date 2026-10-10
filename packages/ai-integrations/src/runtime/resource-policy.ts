import type { AgentDefinition, InstallProfile, InvocationMode, PromptDefinition, SkillDefinition } from "../types.js";

export interface ResourcePolicy {
  readonly invocation?: InvocationMode;
  readonly installProfiles: readonly InstallProfile[];
}

const liteAndFull = ["lite", "full"] as const;
const fullOnly = ["full"] as const;

/** Lifecycle + high-frequency discipline skills stay in the lite profile. */
const liteSkillIds = new Set([
  "idea-validation",
  "target-user-definition",
  "user-needs-research",
  "feature-design",
  "product-definition",
  "architecture-design",
  "backend-delivery",
  "frontend-delivery",
  "deployment-delivery",
  "continuous-improvement",
  "feature-planning",
  "systematic-debugging",
  "safe-refactoring",
  "release-readiness",
]);

/** Ten-phase prompts stay in lite; opportunistic prompts are full-only. */
const litePromptIds = new Set([
  "research-idea",
  "identify-target-users",
  "research-user-needs",
  "design-features",
  "write-product-definition",
  "design-architecture",
  "build-backend",
  "build-frontend",
  "deploy-product",
  "improve-product",
]);

const liteAgentIds = new Set([
  "product-manager",
  "software-architect",
  "backend-engineer",
  "frontend-engineer",
  "test-engineer",
  "code-reviewer",
  "debugging-specialist",
  "workflow-coordinator",
]);

export function skillPolicy(id: string): ResourcePolicy {
  return {
    invocation: "model",
    installProfiles: liteSkillIds.has(id) ? liteAndFull : fullOnly,
  };
}

export function promptPolicy(id: string): ResourcePolicy {
  return {
    invocation: "user",
    installProfiles: litePromptIds.has(id) ? liteAndFull : fullOnly,
  };
}

export function agentPolicy(id: string): ResourcePolicy {
  return {
    installProfiles: liteAgentIds.has(id) ? liteAndFull : fullOnly,
  };
}

export function applySkillPolicy(skill: SkillDefinition): SkillDefinition {
  const policy = skillPolicy(skill.id);
  const invocation = skill.invocation ?? policy.invocation ?? "model";
  return {
    ...skill,
    invocation,
    installProfiles: skill.installProfiles ?? policy.installProfiles,
  };
}

export function applyPromptPolicy(prompt: PromptDefinition): PromptDefinition {
  const policy = promptPolicy(prompt.id);
  const invocation = prompt.invocation ?? policy.invocation ?? "user";
  return {
    ...prompt,
    invocation,
    installProfiles: prompt.installProfiles ?? policy.installProfiles,
  };
}

export function applyAgentPolicy(agent: AgentDefinition): AgentDefinition {
  const policy = agentPolicy(agent.id);
  return {
    ...agent,
    installProfiles: agent.installProfiles ?? policy.installProfiles,
  };
}

export function matchesInstallProfile(
  profiles: readonly InstallProfile[] | undefined,
  selected: InstallProfile,
): boolean {
  const effective = profiles ?? fullOnly;
  return effective.includes(selected);
}
