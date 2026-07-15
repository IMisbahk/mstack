import type {
  GeneratedArtifact,
  IntegrationDiagnostic,
  IntegrationPlan,
  IntegrationSpec,
} from "../types.js";
import { IntegrationRegistry } from "./registry.js";
import { validateIntegrationSpec } from "./validation.js";

export function createIntegrationPlan(
  registry: IntegrationRegistry,
  spec: IntegrationSpec,
  environments: readonly string[],
): IntegrationPlan {
  validateIntegrationSpec(spec);
  if (environments.length === 0) throw new Error("At least one AI environment is required");

  const selected = [...new Set(environments)];
  const artifacts = new Map<string, GeneratedArtifact>();
  const diagnostics: IntegrationDiagnostic[] = [];

  for (const environment of selected) {
    const rendered = registry.get(environment).render(spec);
    diagnostics.push(...rendered.diagnostics);
    for (const artifact of rendered.artifacts) {
      const previous = artifacts.get(artifact.path);
      if (previous === undefined) {
        artifacts.set(artifact.path, artifact);
      } else if (
        previous.content !== artifact.content ||
        previous.mergeStrategy !== artifact.mergeStrategy
      ) {
        throw new Error(
          `Adapters '${previous.environment}' and '${artifact.environment}' generated incompatible artifacts at ${artifact.path}`,
        );
      }
    }
  }

  for (const asset of spec.assets ?? []) {
    const generated: GeneratedArtifact = {
      environment: "mstack-runtime",
      feature: asset.feature,
      path: asset.path,
      content: `${asset.content.trimEnd()}\n`,
      mergeStrategy: "replace",
      ...(asset.executable === undefined ? {} : { executable: asset.executable }),
    };
    const previous = artifacts.get(asset.path);
    if (previous !== undefined) {
      throw new Error(
        `Runtime asset conflicts with adapter '${previous.environment}' at ${asset.path}`,
      );
    }
    artifacts.set(asset.path, generated);
  }

  return {
    environments: selected,
    artifacts: [...artifacts.values()].sort((a, b) => a.path.localeCompare(b.path)),
    diagnostics,
  };
}
