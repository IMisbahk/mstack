import type {
  CanonicalResource,
  GeneratedArtifact,
  IntegrationDiagnostic,
  IntegrationPlan,
  IntegrationSpec,
  NormalizedIntegrationSpec,
  SecurityClass,
} from "../types.js";
import { IntegrationRegistry } from "./registry.js";
import { normalizeIntegrationSpec } from "./normalization.js";
import { hashContent, stableStringify } from "./safety.js";
import { validateArtifact, validateIntegrationPlan } from "./validation.js";

export function createIntegrationPlan(registry: IntegrationRegistry, spec: IntegrationSpec, environments: readonly string[]): IntegrationPlan {
  const normalized = normalizeIntegrationSpec(spec);
  if (environments.length === 0) throw new Error("At least one AI environment is required");
  const selected = [...new Set(environments)];
  const artifacts = new Map<string, GeneratedArtifact>();
  const diagnostics: IntegrationDiagnostic[] = [];

  for (const environment of selected) {
    const adapter = registry.get(environment);
    for (const resource of normalized.resources.filter((item) => item.kind !== "asset" && item.kind !== "template" && (item.platforms.length === 0 || item.platforms.includes(environment)))) {
      const feature = featureFor(resource);
      const support = adapter.capabilities[feature];
      if (support.level === "unsupported") {
        if (resource.fallback === "fail") throw new Error(`Adapter '${environment}' does not support ${resource.kind} '${resource.id}': ${support.detail}`);
        diagnostics.push({ environment, feature, level: "warning", resourceId: resource.id, message: `${resource.kind} '${resource.id}' was ${resource.fallback === "degrade" ? "degraded or skipped" : "skipped"}: ${support.detail}` });
      } else if (support.level === "emulated" && resource.fallback !== "degrade") {
        if (resource.fallback === "fail") throw new Error(`Adapter '${environment}' only emulates ${resource.kind} '${resource.id}'`);
        diagnostics.push({ environment, feature, level: "warning", resourceId: resource.id, message: `${resource.kind} '${resource.id}' requires native behavior and was skipped` });
      }
    }
    const rendered = adapter.render(specForAdapter(normalized, environment, adapter.capabilities));
    diagnostics.push(...rendered.diagnostics);
    for (const raw of rendered.artifacts) {
      const experimental = adapter.capabilities[raw.feature].level === "experimental";
      const artifact = enrichArtifact(experimental ? { ...raw, constraints: { ...(raw.constraints ?? {}), experimental: true }, activation: "privileged" } : raw, normalized.resources, adapter.profile?.id);
      validateArtifact(artifact);
      const previous = artifacts.get(artifact.path);
      if (previous === undefined) artifacts.set(artifact.path, artifact);
      else if (!interoperable(previous, artifact)) throw new Error(`Adapters '${previous.environment}' and '${artifact.environment}' generated incompatible artifacts at ${artifact.path}`);
      else {
        const contributors = [...new Set([...(previous.environments ?? [previous.environment]), ...(artifact.environments ?? [artifact.environment])])].sort();
        const profileContributors = [...(previous.profileContributors ?? []), ...(artifact.profileContributors ?? [])]
          .filter((item, index, values) => values.findIndex((candidate) => candidate.environment === item.environment && candidate.profileId === item.profileId) === index)
          .sort((left, right) => left.environment.localeCompare(right.environment) || left.profileId.localeCompare(right.profileId));
        const profiles = [...new Set([...(previous.profileIds ?? (previous.profileId === undefined ? [] : [previous.profileId])), ...(artifact.profileIds ?? (artifact.profileId === undefined ? [] : [artifact.profileId]))])].sort();
        artifacts.set(artifact.path, {
          ...previous,
          environment: contributors[0]!,
          environments: contributors,
          ...(profiles.length === 0 ? {} : { profileId: profiles[0], profileIds: profiles }),
          ...(profileContributors.length === 0 ? {} : { profileContributors }),
        });
      }
    }
  }

  for (const asset of normalized.assets ?? []) {
    const resource = normalized.resources.find((item) => item.kind === "asset" && (item.source.path === asset.path));
    const generated: GeneratedArtifact = {
      environment: "mstack-runtime", environments: ["mstack-runtime"], profileId: "mstack-runtime.2026-07-15",
      resourceId: resource?.id ?? `asset.${hashContent(asset.path).slice(0, 12)}`, resourceVersion: resource?.version ?? normalized.version,
      feature: asset.feature, path: asset.path, content: `${asset.content.trimEnd()}\n`, mergeStrategy: managementToMerge(resource?.management ?? asset.management ?? "whole-file"),
      management: resource?.management ?? asset.management ?? "whole-file", security: asset.executable === true ? "executable" : (resource?.security ?? "content"), activation: asset.executable === true ? "privileged" : (resource?.activation ?? "passive"),
      dependencies: resource?.dependencies ?? asset.dependencies ?? [], ...(asset.constraints === undefined ? {} : { constraints: asset.constraints }),
      ...(asset.executable === undefined ? {} : { executable: asset.executable }), ...(asset.mode === undefined ? {} : { mode: asset.mode }),
    };
    validateArtifact(generated);
    const previous = artifacts.get(asset.path);
    if (previous !== undefined) throw new Error(`Runtime asset conflicts with adapter '${previous.environment}' at ${asset.path}`);
    artifacts.set(asset.path, generated);
  }
  for (const template of normalized.templates ?? []) {
    const resource = normalized.resources.find((item) => item.kind === "template" && item.id === template.id)!;
    const generated: GeneratedArtifact = { environment: "mstack-runtime", environments: ["mstack-runtime"], profileId: "mstack-runtime.2026-07-15", resourceId: resource.id, resourceVersion: resource.version, feature: "templates", path: template.path, content: `${template.content.trimEnd()}\n`, mergeStrategy: managementToMerge(resource.management), management: resource.management, security: resource.security, activation: resource.activation, dependencies: resource.dependencies, ...(resource.constraints === undefined ? {} : { constraints: resource.constraints }) };
    validateArtifact(generated);
    const previous = artifacts.get(template.path);
    if (previous !== undefined) throw new Error(`Template '${template.id}' conflicts with adapter '${previous.environment}' at ${template.path}`);
    artifacts.set(template.path, generated);
  }

  const plan: IntegrationPlan = { schemaVersion: 1, integrationId: normalized.id, integrationVersion: normalized.version, environments: selected, artifacts: [...artifacts.values()].sort((a, b) => a.path.localeCompare(b.path)), diagnostics };
  validateIntegrationPlan(plan);
  return plan;
}

function enrichArtifact(artifact: GeneratedArtifact, resources: readonly CanonicalResource[], profileId: string | undefined): GeneratedArtifact {
  const candidates = resources.filter((resource) => featureFor(resource) === artifact.feature && (resource.platforms.length === 0 || resource.platforms.includes(artifact.environment)));
  const named = candidates.filter((resource) => artifact.path.split(/[/.]/).includes(resource.id));
  const selected = named.length === 1 ? named[0] : candidates.length === 1 ? candidates[0] : undefined;
  const resourceId = artifact.resourceId ?? selected?.id ?? `${artifact.feature}.${hashContent(artifact.path).slice(0, 12)}`;
  const management = artifact.management ?? selected?.management ?? mergeToManagement(artifact.mergeStrategy);
  return {
    ...artifact,
    environments: artifact.environments ?? [artifact.environment],
    ...(profileId === undefined ? {} : { profileId, profileIds: [profileId], profileContributors: [{ environment: artifact.environment, profileId }] }),
    resourceId,
    resourceVersion: artifact.resourceVersion ?? selected?.version ?? "0.0.0",
    management,
    security: artifact.security ?? selected?.security ?? securityFor(artifact),
    activation: artifact.activation ?? selected?.activation ?? (securityFor(artifact) === "content" ? "passive" : "privileged"),
    dependencies: artifact.dependencies ?? selected?.dependencies ?? [],
    ...((selected?.constraints === undefined && artifact.constraints === undefined) ? {} : { constraints: { ...(selected?.constraints ?? {}), ...(artifact.constraints ?? {}) } }),
    ...(artifact.mergeStrategy === "managed-block" ? { markerId: artifact.markerId ?? resourceId } : {}),
  };
}

function interoperable(left: GeneratedArtifact, right: GeneratedArtifact): boolean {
  const material = (artifact: GeneratedArtifact): unknown => ({ resourceId: artifact.resourceId, resourceVersion: artifact.resourceVersion, feature: artifact.feature, path: artifact.path, content: artifact.content, mergeStrategy: artifact.mergeStrategy, management: artifact.management, security: artifact.security, activation: artifact.activation, dependencies: artifact.dependencies ?? [], constraints: artifact.constraints ?? {}, executable: artifact.executable ?? false, mode: artifact.mode ?? null, markerId: artifact.markerId ?? null });
  return stableStringify(material(left)) === stableStringify(material(right));
}

function featureFor(resource: CanonicalResource): GeneratedArtifact["feature"] {
  const map: Record<CanonicalResource["kind"], GeneratedArtifact["feature"]> = { instructions: "instructions", rule: "rules", prompt: "prompts", skill: "skills", hook: "hooks", agent: "agents", context: "automatic-context", onboarding: "repository-onboarding", template: "templates", "mcp-server": "mcp", permission: "permissions", asset: "assets" };
  return map[resource.kind];
}
function securityFor(artifact: GeneratedArtifact): SecurityClass { return artifact.executable === true || artifact.feature === "hooks" ? "executable" : artifact.feature === "mcp" ? "network" : artifact.feature === "permissions" ? "policy" : "content"; }
function managementToMerge(value: CanonicalResource["management"]): GeneratedArtifact["mergeStrategy"] { return value === "whole-file" ? "replace" : value === "owned-json" ? "merge-json" : value; }
function mergeToManagement(value: GeneratedArtifact["mergeStrategy"]): NonNullable<GeneratedArtifact["management"]> { return value === "replace" ? "whole-file" : value === "merge-json" ? "owned-json" : value; }

function specForAdapter(spec: NormalizedIntegrationSpec, environment: string, capabilities: import("../types.js").CapabilityMap): IntegrationSpec {
  const allowed = (resource: CanonicalResource): boolean => {
    if (resource.platforms.length > 0 && !resource.platforms.includes(environment)) return false;
    const level = capabilities[featureFor(resource)].level;
    return level === "native" || level === "experimental" || (level === "emulated" && resource.fallback === "degrade");
  };
  const resources = spec.resources.filter(allowed);
  const idAllowed = (kind: CanonicalResource["kind"], id: string): boolean => resources.some((resource) => resource.kind === kind && resource.id === id);
  const sourcePathAllowed = (kind: CanonicalResource["kind"], path: string): boolean => resources.some((resource) => resource.kind === kind && resource.source.path === path);
  const { instructions, prompts, skills, hooks, agents, context, onboarding, rules, templates, mcpServers, permissionRecommendations, resources: _resources, ...base } = spec;
  void _resources;
  return {
    ...base,
    ...(instructions === undefined || !idAllowed("instructions", instructions.id ?? "project-instructions") ? {} : { instructions }),
    ...(prompts === undefined ? {} : { prompts: prompts.filter((item) => idAllowed("prompt", item.id)) }),
    ...(skills === undefined ? {} : { skills: skills.filter((item) => idAllowed("skill", item.id)) }),
    ...(hooks === undefined ? {} : { hooks: hooks.filter((item) => idAllowed("hook", item.id)) }),
    ...(agents === undefined ? {} : { agents: agents.filter((item) => idAllowed("agent", item.id)) }),
    ...(context === undefined ? {} : { context: context.filter((item) => sourcePathAllowed("context", item.path)) }),
    ...(onboarding === undefined || !resources.some((resource) => resource.kind === "onboarding") ? {} : { onboarding }),
    ...(rules === undefined ? {} : { rules: rules.filter((item) => idAllowed("rule", item.id)) }),
    ...(templates === undefined ? {} : { templates: templates.filter((item) => idAllowed("template", item.id)) }),
    ...(mcpServers === undefined ? {} : { mcpServers: mcpServers.filter((item) => idAllowed("mcp-server", item.id)) }),
    ...(permissionRecommendations === undefined ? {} : { permissionRecommendations: permissionRecommendations.filter((item) => idAllowed("permission", item.id)) }),
  };
}
