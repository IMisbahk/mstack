import type {
  AgentDefinition,
  AdapterValidationFinding,
  CapabilityProfile,
  CapabilityMap,
  GeneratedArtifact,
  IntegrationDiagnostic,
  IntegrationFeature,
  IntegrationSpec,
  PromptDefinition,
  SkillDefinition,
} from "../types.js";

export function capability(
  values: Partial<Record<IntegrationFeature, readonly ["native" | "emulated" | "experimental" | "unsupported", string]>>,
): CapabilityMap {
  return Object.fromEntries(integrationFeatureNames.map((feature) => {
    const value = values[feature];
    const level = value?.[0] ?? "unsupported";
    const detail = value?.[1] ?? `${feature} has no verified project-local surface in this profile.`;
    return [feature, { level, detail, ...(level === "native" ? {} : { limitations: [detail] }), ...(["hooks", "mcp", "permissions"].includes(feature) && level !== "unsupported" ? { requiresTrust: true, requiresActivation: true } : level === "experimental" ? { requiresActivation: true } : {}) }];
  })) as unknown as CapabilityMap;
}

const integrationFeatureNames: readonly IntegrationFeature[] = ["prompts", "hooks", "skills", "instructions", "rules", "slash-commands", "agents", "automatic-context", "repository-onboarding", "templates", "mcp", "permissions", "assets"];

export function capabilityProfile(
  id: string,
  capabilities: CapabilityMap,
  verifiedAt = "2026-07-15",
  platformVersion = "verified-current",
): CapabilityProfile {
  return { id, verifiedAt, platformVersion, capabilities };
}

export function validateRenderedArtifacts(environment: string, artifacts: readonly GeneratedArtifact[]): readonly AdapterValidationFinding[] {
  const findings: AdapterValidationFinding[] = [];
  for (const artifact of artifacts) {
    if (!(artifact.environments ?? [artifact.environment]).includes(environment)) findings.push({ level: "error", path: artifact.path, message: `Artifact does not retain contributing adapter '${environment}'` });
    if (artifact.path.endsWith(".json")) { try { JSON.parse(artifact.content); } catch { findings.push({ level: "error", path: artifact.path, message: "Generated JSON is invalid" }); } }
    if (/CLAUDE\.local\.md$/.test(artifact.path)) findings.push({ level: "error", path: artifact.path, message: "CLAUDE.local.md must never be generated" });
    if (artifact.content.includes("httpUrl")) findings.push({ level: "error", path: artifact.path, message: "MCP configuration must use url with an explicit type" });
  }
  return findings;
}

export function artifact(
  environment: string,
  feature: IntegrationFeature,
  path: string,
  content: string,
  mergeStrategy: GeneratedArtifact["mergeStrategy"] = "replace",
): GeneratedArtifact {
  return { environment, feature, path, content: ensureNewline(content), mergeStrategy };
}

export function warning(
  environment: string,
  feature: IntegrationFeature,
  message: string,
): IntegrationDiagnostic {
  return { environment, feature, level: "warning", message };
}

export function renderInstructionBody(
  spec: IntegrationSpec,
  contextRenderer: (path: string) => string,
): string {
  const sections: string[] = [`# ${spec.project.name}`];
  if (spec.project.description !== undefined) sections.push(spec.project.description.trim());
  if (spec.instructions !== undefined) {
    sections.push(`## Project instructions\n\n${spec.instructions.content.trim()}`);
  }
  if ((spec.context?.length ?? 0) > 0) {
    sections.push(
      `## Required context\n\n${spec.context
        ?.map((source) => {
          const suffix = source.description === undefined ? "" : ` — ${source.description}`;
          const requirement = source.required === false ? "Optional" : "Load before relevant work";
          return `- ${requirement}: ${contextRenderer(source.path)}${suffix}`;
        })
        .join("\n")}`,
    );
  }
  if (spec.onboarding !== undefined) {
    const lines: string[] = [];
    if (spec.onboarding.summary !== undefined) lines.push(spec.onboarding.summary.trim());
    if ((spec.onboarding.setupCommands?.length ?? 0) > 0) {
      lines.push(
        `### Setup\n\n${spec.onboarding.setupCommands?.map((command) => `- \`${command}\``).join("\n")}`,
      );
    }
    if ((spec.onboarding.verificationCommands?.length ?? 0) > 0) {
      lines.push(
        `### Verify\n\n${spec.onboarding.verificationCommands
          ?.map((command) => `- \`${command}\``)
          .join("\n")}`,
      );
    }
    sections.push(`## Repository onboarding\n\n${lines.join("\n\n")}`);
  }
  return sections.join("\n\n");
}

export function renderManagedInstructionBody(
  spec: IntegrationSpec,
  contextRenderer: (path: string) => string,
): string {
  const lines = renderInstructionBody(spec, contextRenderer).split("\n");
  let fence: "```" | "~~~" | undefined;
  return lines.map((line) => {
    const marker = line.trimStart().slice(0, 3);
    if (marker === "```" || marker === "~~~") {
      fence = fence === marker ? undefined : fence ?? marker;
      return line;
    }
    return fence === undefined && /^#{1,5}\s/.test(line) ? `#${line}` : line;
  }).join("\n");
}

export function renderStandardSkill(skill: SkillDefinition): string {
  return [
    "---",
    `name: ${yamlString(skill.id)}`,
    `description: ${yamlString(oneLine(skill.description))}`,
    "---",
    "",
    "<!-- Generated by mstack from Misbah's Build Like This workflow. Regenerate instead of editing. -->",
    "",
    skill.instructions.trim(),
  ].join("\n");
}

export function renderStandardSkillArtifacts(
  environment: string,
  base: string,
  skills: readonly SkillDefinition[],
): GeneratedArtifact[] {
  return skills.flatMap((skill) => {
    const root = `${base}/${skill.id}`;
    return [
      artifact(environment, "skills", `${root}/SKILL.md`, renderStandardSkill(skill)),
      ...(skill.resources ?? []).map((resource) =>
        artifact(environment, "skills", `${root}/${resource.path}`, resource.content),
      ),
    ];
  });
}

export function renderAgentsCompatibleArtifacts(
  environment: string,
  spec: IntegrationSpec,
  skillBase = ".agents/skills",
  includePrompts = true,
): GeneratedArtifact[] {
  return [
    artifact(
      environment,
      "instructions",
      "AGENTS.md",
      renderManagedInstructionBody(spec, (path) => `\`${path}\``),
      "managed-block",
    ),
    ...renderStandardSkillArtifacts(environment, skillBase, spec.skills ?? []),
    ...(includePrompts ? spec.prompts ?? [] : []).map((prompt) =>
      artifact(
        environment,
        "prompts",
        `${skillBase}/${prompt.id}/SKILL.md`,
        renderPromptSkill(prompt),
      ),
    ),
  ];
}

export function renderPersonaSkillArtifacts(
  environment: string,
  base: string,
  agents: readonly AgentDefinition[],
  version: string,
): GeneratedArtifact[] {
  return agents.map((agent) => ({
    ...artifact(
      environment,
      "agents",
      `${base}/mstack-agent-${agent.id}/SKILL.md`,
      renderStandardSkill({
        id: `mstack-agent-${agent.id}`,
        description: `Provides the ${agent.id} specialist persona for bounded work: ${oneLine(agent.description)}`,
        instructions: [
          `Use this skill to perform a bounded ${agent.id} specialist pass or to give the same persona to a generic subagent when the runtime supports delegation.`,
          "",
          agent.instructions.trim(),
        ].join("\n"),
      }),
    ),
    resourceId: agent.id,
    resourceVersion: agent.version ?? version,
  }));
}

export function renderPromptSkill(prompt: PromptDefinition): string {
  return [
    "---",
    `name: ${yamlString(prompt.id)}`,
    `description: ${yamlString(prompt.description)}`,
    "---",
    "",
    "<!-- Generated by mstack from Misbah's Build Like This workflow. Regenerate instead of editing. -->",
    "",
    prompt.prompt.trim(),
    "",
    "Apply any arguments supplied by the user as task-specific input.",
  ].join("\n");
}

export function renderAgentMarkdown(agent: AgentDefinition, extra: readonly string[] = []): string {
  return [
    "---",
    `name: ${yamlString(agent.id)}`,
    `description: ${yamlString(oneLine(agent.description))}`,
    ...(agent.model === undefined ? [] : [`model: ${yamlString(agent.model)}`]),
    ...(agent.tools === undefined || agent.tools.length === 0
      ? []
      : ["tools:", ...agent.tools.map((tool) => `  - ${yamlString(tool)}`)]),
    ...extra,
    "---",
    "",
    "<!-- Generated by mstack from Misbah's Build Like This workflow. Regenerate instead of editing. -->",
    "",
    agent.instructions.trim(),
  ].join("\n");
}

export function generatedHeader(environment: string): string {
  return `<!-- Generated by mstack from Misbah's Build Like This workflow for ${environment}. Regenerate instead of editing. -->`;
}

export function yamlString(value: string): string {
  return JSON.stringify(oneLine(value));
}

export function tomlString(value: string): string {
  return JSON.stringify(value);
}

export function timeoutSeconds(timeoutMs: number): number {
  return Math.max(1, Math.ceil(timeoutMs / 1_000));
}

export function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function ensureNewline(content: string): string {
  return `${content.trimEnd()}\n`;
}
