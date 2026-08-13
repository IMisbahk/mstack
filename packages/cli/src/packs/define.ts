import type { AgentDefinition, PromptDefinition, SkillDefinition } from "../../../ai-integrations/src/index.js";
import type { CapabilityPack, TaskRecipe, TaskRisk } from "./types.js";

export function createTaskRecipe(options: {
  id: string;
  description: string;
  risk: TaskRisk;
  argv?: readonly string[];
  steps?: TaskRecipe["steps"];
  inputs?: TaskRecipe["inputs"];
  preconditions?: readonly string[];
  timeoutMs?: number;
  cwd?: string;
}): TaskRecipe {
  const steps = options.steps ?? (options.argv === undefined ? [] : [{ argv: options.argv }]);
  return {
    id: options.id,
    description: options.description,
    risk: options.risk,
    steps,
    ...(options.inputs === undefined ? {} : { inputs: options.inputs }),
    ...(options.preconditions === undefined ? {} : { preconditions: options.preconditions }),
    ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs }),
    ...(options.cwd === undefined ? {} : { cwd: options.cwd }),
  };
}

export function createSpecialist(id: string, description: string, responsibility: string): AgentDefinition {
  return {
    id,
    version: "1.0.0",
    activation: "passive",
    security: "content",
    fallback: "degrade",
    description,
    instructions: [
      `You are the ${id} specialist installed by mstack. ${responsibility}`,
      "",
      "Read repository evidence before making claims. State verified facts separately from inference.",
      "Do not execute external actions, mutate production, or modify code unless the user explicitly requests it.",
      "Hand off decisions outside your specialty to the owning specialist. Prefer mstack task recipes over undeclared shell programs.",
    ].join("\n"),
  };
}

export function createPackSkill(id: string, description: string, guidance: string): SkillDefinition {
  return {
    id,
    version: "1.0.0",
    activation: "explicit",
    security: "content",
    fallback: "degrade",
    description,
    instructions: [
      guidance,
      "",
      "Inspect code, tests, configuration, and documentation. Distinguish facts from inference.",
      "Name the next safe handoff. Do not host inference, mutate production, or run undeclared shell programs.",
    ].join("\n"),
  };
}

export function createPackPrompt(id: string, description: string, argumentHint: string, body: string): PromptDefinition {
  return {
    id,
    version: "1.0.0",
    activation: "passive",
    security: "content",
    fallback: "degrade",
    description,
    argumentHint,
    prompt: [
      `# ${id}`,
      "",
      body.trim(),
      "",
      "The repository is the host project. Build Like This is the method; mstack only installs resources.",
      "Use project-owned docs, code, and tests as sources of truth. Label inference separately from evidence.",
      "Do not execute undeclared shell programs, deploy, or contact external systems. Finish with verification evidence and residual risk.",
    ].join("\n"),
  };
}

export function createCapabilityPack(options: {
  id: string;
  displayName: string;
  description: string;
  agents: readonly AgentDefinition[];
  skills: readonly SkillDefinition[];
  prompts?: readonly PromptDefinition[];
  tasks: readonly TaskRecipe[];
  dependencies?: readonly string[];
  requiredToolchains?: readonly string[];
}): CapabilityPack {
  return {
    id: options.id,
    version: "1.0.0",
    displayName: options.displayName,
    description: options.description,
    ...(options.dependencies === undefined ? {} : { dependencies: options.dependencies }),
    ...(options.requiredToolchains === undefined ? {} : { requiredToolchains: options.requiredToolchains }),
    risks: ["content-only runtime resources", "task recipes are policy-gated"],
    createSpec: () => ({
      agents: [...options.agents],
      skills: [...options.skills],
      ...(options.prompts === undefined ? {} : { prompts: [...options.prompts] }),
    }),
    tasks: options.tasks,
  };
}
