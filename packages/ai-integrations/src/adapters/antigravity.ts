import type {
  AdapterRenderResult,
  GeneratedArtifact,
  HookDefinition,
  IntegrationAdapter,
  IntegrationDiagnostic,
  IntegrationSpec,
} from "../types.js";
import {
  artifact,
  capability,
  capabilityProfile,
  generatedHeader,
  renderAgentMarkdown,
  renderAgentsCompatibleArtifacts,
  timeoutSeconds,
  validateRenderedArtifacts,
  warning,
} from "./shared.js";

const capabilities = capability({
  prompts: ["native", "Reusable prompts are native Agent Skills under .agents/skills."],
  hooks: ["native", "Verified Antigravity hook events are stored in .agents/hooks.json; session-start hooks are omitted because no exact event exists."],
  skills: ["native", "Open Agent Skills are stored under .agents/skills."],
  instructions: ["native", "AGENTS.md is loaded as repository guidance."],
  rules: ["native", "Workspace rules are stored under .agents/rules."],
  "slash-commands": ["native", "Agent Skills are directly invokable workflows."],
  agents: ["native", "Antigravity CLI project agents are stored under .agents/agents."],
  "automatic-context": ["native", "AGENTS.md and workspace rules provide automatic project context."],
  "repository-onboarding": ["native", "Repository setup is loaded through AGENTS.md."],
  mcp: ["native", "Workspace MCP servers are owned entries in .agents/mcp_config.json."],
  permissions: ["unsupported", "Antigravity permission policy remains user-owned."],
});

export const antigravityAdapter: IntegrationAdapter = {
  id: "antigravity",
  displayName: "Google Antigravity",
  runtime: {
    commands: ["agy"],
    projectMarkers: [".agents/hooks.json", ".agents/mcp_config.json", ".agents/agents"],
    documentationUrl: "https://antigravity.google/docs/skills",
  },
  capabilities,
  profile: capabilityProfile("antigravity.2026-07-18", capabilities, "2026-07-18", "2.0"),
  validate: (_root, artifacts) => validateRenderedArtifacts("antigravity", artifacts),
  render(spec: IntegrationSpec): AdapterRenderResult {
    const environment = "antigravity";
    const diagnostics: IntegrationDiagnostic[] = [];
    const artifacts: GeneratedArtifact[] = [
      ...renderAgentsCompatibleArtifacts(environment, spec),
      ...(spec.rules ?? []).map((rule) => artifact(
        environment,
        "rules",
        `.agents/rules/build-like-this/${rule.id}.md`,
        `${generatedHeader(environment)}\n\n${rule.content.trim()}`,
      )),
      ...(spec.agents ?? []).map((agent) => artifact(
        environment,
        "agents",
        `.agents/agents/${agent.id}/agent.md`,
        renderAgentMarkdown(agent),
      )),
    ];

    const hookConfig: Record<string, unknown> = {};
    for (const hook of spec.hooks ?? []) {
      const event = hookEvent(hook);
      if (event === undefined) {
        diagnostics.push(warning(
          environment,
          "hooks",
          `Hook '${hook.id}' was skipped because Antigravity has no exact project session-start event.`,
        ));
        continue;
      }
      const handler = {
        type: "command",
        command: hook.command,
        ...(hook.timeoutMs === undefined ? {} : { timeout: timeoutSeconds(hook.timeoutMs) }),
      };
      hookConfig[hook.id] = event.matcher
        ? { [event.name]: [{ matcher: hook.matcher ?? "*", hooks: [handler] }] }
        : { [event.name]: [handler] };
    }
    if (Object.keys(hookConfig).length > 0) {
      artifacts.push({
        ...artifact(
          environment,
          "hooks",
          ".agents/hooks.json",
          JSON.stringify(hookConfig, null, 2),
          "merge-json",
        ),
        security: "executable",
        activation: "privileged",
      });
    }

    if ((spec.mcpServers?.length ?? 0) > 0) {
      const mcpServers = Object.fromEntries((spec.mcpServers ?? []).map((server) => [
        server.id,
        server.type === "stdio"
          ? { command: server.command, ...(server.args === undefined ? {} : { args: server.args }) }
          : { serverUrl: server.url },
      ]));
      artifacts.push({
        ...artifact(
          environment,
          "mcp",
          ".agents/mcp_config.json",
          JSON.stringify({ mcpServers }, null, 2),
          "merge-json",
        ),
        security: "network",
        activation: "privileged",
      });
    }

    return { artifacts, diagnostics };
  },
};

function hookEvent(hook: HookDefinition): { name: string; matcher: boolean } | undefined {
  switch (hook.event) {
    case "session-start": return undefined;
    case "before-prompt": return { name: "PreInvocation", matcher: false };
    case "before-tool": return { name: "PreToolUse", matcher: true };
    case "after-tool": return { name: "PostToolUse", matcher: true };
    case "after-response": return { name: "PostInvocation", matcher: false };
    case "session-end": return { name: "Stop", matcher: false };
  }
}
