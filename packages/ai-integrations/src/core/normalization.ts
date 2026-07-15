import type {
  ActivationMode,
  CanonicalResource,
  FallbackPolicy,
  IntegrationSpec,
  ManagementMode,
  NormalizedIntegrationSpec,
  ResourceKind,
  ResourceMetadata,
  SecurityClass,
} from "../types.js";
import { deepFreeze, hashContent } from "./safety.js";
import { validateCanonicalResource, validateIntegrationSpec } from "./validation.js";

interface Defaults {
  readonly activation: ActivationMode;
  readonly security: SecurityClass;
  readonly fallback: FallbackPolicy;
  readonly management: ManagementMode;
}

const kindDefaults: Readonly<Record<ResourceKind, Defaults>> = {
  instructions: passive(), rule: passive(), prompt: degradable(), skill: degradable(), agent: degradable(), context: degradable(), onboarding: degradable(), template: passive(),
  hook: { ...privileged("executable"), fallback: "skip" },
  "mcp-server": privileged("network"),
  permission: privileged("policy"),
  asset: passive(),
};

function passive(): Defaults { return { activation: "passive", security: "content", fallback: "skip", management: "whole-file" }; }
function degradable(): Defaults { return { ...passive(), fallback: "degrade" }; }
function privileged(security: SecurityClass): Defaults { return { activation: "privileged", security, fallback: "fail", management: "owned-json" }; }

export function normalizeIntegrationSpec(spec: IntegrationSpec): NormalizedIntegrationSpec {
  validateIntegrationSpec(spec);
  const integrationId = spec.id ?? `legacy.${slug(spec.project.name)}`;
  const integrationVersion = spec.version ?? "0.0.0";
  const resources: CanonicalResource[] = [];

  const add = (kind: ResourceKind, id: string, value: ResourceMetadata & object, source: Record<string, unknown>, overrides: Partial<Defaults> = {}): void => {
    const defaults = { ...kindDefaults[kind], ...overrides };
    const resource: CanonicalResource = {
      id,
      kind,
      version: value.version ?? integrationVersion,
      activation: value.activation ?? defaults.activation,
      security: value.security ?? defaults.security,
      dependencies: [...(value.dependencies ?? [])],
      platforms: [...(value.platforms ?? [])],
      fallback: value.fallback ?? defaults.fallback,
      management: value.management ?? defaults.management,
      owner: value.owner ?? integrationId,
      ...(value.constraints === undefined ? {} : { constraints: { ...value.constraints } }),
      source,
    };
    validateCanonicalResource(resource);
    resources.push(resource);
  };

  if (spec.instructions !== undefined) add("instructions", spec.instructions.id ?? "project-instructions", spec.instructions, { content: spec.instructions.content }, { management: "managed-block" });
  for (const prompt of spec.prompts ?? []) add("prompt", prompt.id, prompt, copy(prompt));
  for (const skill of spec.skills ?? []) {
    add("skill", skill.id, skill, copy(skill));
    for (const child of skill.resources ?? []) add("asset", child.id ?? `${skill.id}.${slug(child.path)}`, child, { path: child.path, content: child.content }, { management: "whole-file" });
  }
  for (const hook of spec.hooks ?? []) add("hook", hook.id, hook, copy(hook));
  for (const agent of spec.agents ?? []) add("agent", agent.id, agent, copy(agent));
  for (const context of spec.context ?? []) add("context", context.id ?? `context.${shortHash(context.path)}`, context, copy(context));
  if (spec.onboarding !== undefined) add("onboarding", spec.onboarding.id ?? "repository-onboarding", spec.onboarding, copy(spec.onboarding), { management: "managed-block" });
  for (const asset of spec.assets ?? []) add("asset", asset.id ?? `asset.${shortHash(asset.path)}`, asset, copy(asset), { security: asset.executable === true ? "executable" : "content", activation: asset.executable === true ? "privileged" : "passive" });
  for (const rule of spec.rules ?? []) add("rule", rule.id, rule, copy(rule), { management: "managed-block" });
  for (const template of spec.templates ?? []) add("template", template.id, template, copy(template));
  for (const server of spec.mcpServers ?? []) add("mcp-server", server.id, server, copy(server));
  for (const permission of spec.permissionRecommendations ?? []) add("permission", permission.id, permission, copy(permission), { security: permission.policy === "broaden" ? "policy" : "content", activation: permission.policy === "broaden" ? "privileged" : "explicit" });

  const resourceIds = new Set<string>();
  for (const resource of resources) { if (resourceIds.has(resource.id)) throw new Error(`Duplicate canonical resource id '${resource.id}'`); resourceIds.add(resource.id); }
  const known = new Set(resources.map((resource) => resource.id));
  for (const resource of resources) {
    for (const dependency of resource.dependencies) if (!known.has(dependency)) throw new Error(`Resource '${resource.id}' depends on unknown resource '${dependency}'`);
  }
  assertAcyclic(resources);

  return deepFreeze({
    ...spec,
    schemaVersion: 1,
    id: integrationId,
    version: integrationVersion,
    resources: resources.sort(compareResources),
  }) as NormalizedIntegrationSpec;
}

function copy(value: object): Record<string, unknown> {
  return { ...(value as Record<string, unknown>) };
}

function shortHash(value: string): string { return hashContent(value).slice(0, 12); }
function slug(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "integration"; }
function compareResources(left: CanonicalResource, right: CanonicalResource): number { return left.id.localeCompare(right.id) || left.kind.localeCompare(right.kind); }

function assertAcyclic(resources: readonly CanonicalResource[]): void {
  const byId = new Map(resources.map((resource) => [resource.id, resource]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): void => {
    if (visiting.has(id)) throw new Error(`Resource dependency cycle includes '${id}'`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of byId.get(id)?.dependencies ?? []) visit(dependency);
    visiting.delete(id); visited.add(id);
  };
  for (const resource of resources) visit(resource.id);
}
