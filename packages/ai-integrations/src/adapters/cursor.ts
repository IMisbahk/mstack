import type {
  AdapterRenderResult,
  HookEvent,
  IntegrationAdapter,
  IntegrationSpec,
} from "../types.js";
import {
  artifact,
  capability,
  capabilityProfile,
  generatedHeader,
  renderAgentMarkdown,
  renderInstructionBody,
  renderPromptSkill,
  renderStandardSkillArtifacts,
  timeoutSeconds,
  validateRenderedArtifacts,
} from "./shared.js";

const hookEvents: Record<HookEvent, string> = {
  "session-start": "sessionStart",
  "before-prompt": "beforeSubmitPrompt",
  "before-tool": "preToolUse",
  "after-tool": "postToolUse",
  "after-response": "afterAgentResponse",
  "session-end": "sessionEnd",
};

const capabilities = capability({ prompts: ["native", "Reusable prompts are represented as Agent Skills."], hooks: ["native", "Project hooks are stored in .cursor/hooks.json."], skills: ["native", "Open Agent Skills are stored under .agents/skills."], instructions: ["native", "A project rule is stored under .cursor/rules."], "slash-commands": ["native", "Skills can be invoked from Cursor commands."], agents: ["native", "Project subagents are stored under .cursor/agents."], "automatic-context": ["emulated", "An always-applied project rule lists relevant context."], "repository-onboarding": ["native", "The always-applied project rule carries onboarding steps."] });

export const cursorAdapter: IntegrationAdapter = {
  id: "cursor",
  displayName: "Cursor",
  runtime: {
    commands: ["cursor"],
    projectMarkers: [".cursor"],
    documentationUrl: "https://cursor.com/docs/rules",
  },
  capabilities,
  profile: capabilityProfile("cursor.2026-07-15", capabilities),
  validate: (_root, artifacts) => validateRenderedArtifacts("cursor", artifacts),
  render(spec: IntegrationSpec): AdapterRenderResult {
    const environment = "cursor";
    const artifacts = [
      artifact(
        environment,
        "instructions",
        ".cursor/rules/mstack.mdc",
        [
          "---",
          "description: Misbah's Build Like This product-to-production guidance",
          "alwaysApply: true",
          "---",
          "",
          generatedHeader(environment),
          renderInstructionBody(spec, (path) => `\`${path}\``),
        ].join("\n"),
      ),
      ...renderStandardSkillArtifacts(environment, ".agents/skills", spec.skills ?? []),
      ...(spec.prompts ?? []).map((prompt) =>
        artifact(
          environment,
          "prompts",
          `.agents/skills/${prompt.id}/SKILL.md`,
          renderPromptSkill(prompt),
        ),
      ),
      ...(spec.agents ?? []).map((agent) =>
        artifact(
          environment,
          "agents",
          `.cursor/agents/${agent.id}.md`,
          renderAgentMarkdown(agent),
        ),
      ),
    ];
    if ((spec.hooks?.length ?? 0) > 0) {
      const hooks: Record<string, unknown[]> = {};
      for (const hook of spec.hooks ?? []) {
        (hooks[hookEvents[hook.event]] ??= []).push({
          name: hook.id,
          command: hook.command,
          ...(hook.matcher === undefined ? {} : { matcher: hook.matcher }),
          ...(hook.timeoutMs === undefined ? {} : { timeout: timeoutSeconds(hook.timeoutMs) }),
        });
      }
      artifacts.push(
        artifact(
          environment,
          "hooks",
          ".cursor/hooks.json",
          JSON.stringify({ version: 1, hooks }, null, 2),
          "merge-json",
        ),
      );
    }
    return { artifacts, diagnostics: [] };
  },
};
