export const CATALOG_KINDS = ["packs", "agents", "skills", "prompts", "hooks", "templates", "task-recipes"] as const;
export type CatalogKind = (typeof CATALOG_KINDS)[number];

export interface CatalogAlias {
  readonly alias: string;
  readonly aliasKind: CatalogKind;
  readonly canonicalId: string;
  readonly canonicalKind: CatalogKind;
  readonly reason: string;
}

/**
 * Discovery aliases for removed pack resources and skill/prompt dual names.
 * Aliases are not separately installable; see ADR-0005.
 */
export const catalogAliases: readonly CatalogAlias[] = [
  {
    alias: "design-api",
    aliasKind: "skills",
    canonicalId: "api-contract-design",
    canonicalKind: "skills",
    reason: "Toolkit API journey prompt stays design-api; method skill is api-contract-design",
  },
  {
    alias: "api-contract-design",
    aliasKind: "prompts",
    canonicalId: "design-api",
    canonicalKind: "prompts",
    reason: "Skill lookup for the design-api journey",
  },
  {
    alias: "build-backend",
    aliasKind: "skills",
    canonicalId: "backend-delivery",
    canonicalKind: "skills",
    reason: "Phase 7 journey prompt; method skill is backend-delivery",
  },
  {
    alias: "backend-delivery",
    aliasKind: "prompts",
    canonicalId: "build-backend",
    canonicalKind: "prompts",
    reason: "Skill name used as a prompt lookup",
  },
  {
    alias: "build-frontend",
    aliasKind: "skills",
    canonicalId: "frontend-delivery",
    canonicalKind: "skills",
    reason: "Phase 8 journey prompt; method skill is frontend-delivery",
  },
  {
    alias: "frontend-delivery",
    aliasKind: "prompts",
    canonicalId: "build-frontend",
    canonicalKind: "prompts",
    reason: "Skill name used as a prompt lookup",
  },
  {
    alias: "production-readiness",
    aliasKind: "skills",
    canonicalId: "release-readiness",
    canonicalKind: "skills",
    reason: "Readiness journey prompt; method skill is release-readiness",
  },
  {
    alias: "release-readiness",
    aliasKind: "prompts",
    canonicalId: "production-readiness",
    canonicalKind: "prompts",
    reason: "Skill name used as a prompt lookup",
  },
  {
    alias: "web-engineer",
    aliasKind: "agents",
    canonicalId: "frontend-engineer",
    canonicalKind: "agents",
    reason: "Removed pack specialist; use core frontend-engineer",
  },
  {
    alias: "web-delivery",
    aliasKind: "skills",
    canonicalId: "frontend-delivery",
    canonicalKind: "skills",
    reason: "Removed pack skill; use core frontend-delivery",
  },
  {
    alias: "security-engineer",
    aliasKind: "agents",
    canonicalId: "security-reviewer",
    canonicalKind: "agents",
    reason: "Removed pack specialist; use core security-reviewer",
  },
  {
    alias: "api-boundary-engineer",
    aliasKind: "agents",
    canonicalId: "backend-engineer",
    canonicalKind: "agents",
    reason: "Removed pack specialist; use core backend-engineer",
  },
  {
    alias: "api-boundary-design",
    aliasKind: "skills",
    canonicalId: "api-contract-design",
    canonicalKind: "skills",
    reason: "Removed pack skill; use core api-contract-design",
  },
  {
    alias: "verification-strategist",
    aliasKind: "agents",
    canonicalId: "test-engineer",
    canonicalKind: "agents",
    reason: "Removed pack specialist; use core test-engineer",
  },
  {
    alias: "regression-analyst",
    aliasKind: "agents",
    canonicalId: "test-engineer",
    canonicalKind: "agents",
    reason: "Removed pack specialist; use core test-engineer",
  },
  {
    alias: "dependency-analyst",
    aliasKind: "agents",
    canonicalId: "repository-explorer",
    canonicalKind: "agents",
    reason: "Merged into repository-explorer",
  },
  {
    alias: "build-system-diagnostician",
    aliasKind: "agents",
    canonicalId: "repository-explorer",
    canonicalKind: "agents",
    reason: "Merged into repository-explorer",
  },
  {
    alias: "repository-historian",
    aliasKind: "agents",
    canonicalId: "repository-explorer",
    canonicalKind: "agents",
    reason: "Merged into repository-explorer",
  },
];

export function resolveCatalogAlias(alias: string, kind?: CatalogKind): CatalogAlias | undefined {
  const needle = alias.trim().toLowerCase();
  return catalogAliases.find((entry) =>
    entry.alias === needle && (kind === undefined || entry.aliasKind === kind));
}
