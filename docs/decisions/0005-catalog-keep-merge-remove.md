# ADR-0005: Catalog keep / merge / remove and discovery aliases

- **Status:** Accepted
- **Date:** 2026-10-10
- **Decision owners:** mstack maintainers
- **Related:** [ADR-0003](0003-curated-capability-packs-and-task-recipes.md), [ADR-0004](0004-agent-automation-surface.md)

## Context

The core catalog grew skill/prompt pairs that look like duplicates from the outside (`design-api` / `api-contract-design`, `build-backend` / `backend-delivery`, `plan-mvp` / `feature-planning`), while packs shipped thin specialists that shadowed deep core agents. Existing installs and docs name the old IDs, so removals need aliases. Global resource IDs are unique across kinds, so a skill and its journey prompt cannot share one ID.

## Decision

1. Keep the intentional **skill (method) + prompt (journey)** duality for lifecycle and toolkit pairs. Do not collapse them into one resource.
2. **Merge content** where a toolkit prompt duplicated its skill: the prompt becomes a thin journey that invokes the canonical skill (same pattern as lifecycle phases).
3. **Remove or merge** low-value pack specialists, skills, and task recipes that shadow core or add almost no signal; keep pack prompts and domain-specific deltas.
4. Publish a **discovery alias table** in the catalog so removed or colloquial IDs still resolve without breaking installs or docs. Aliases are not separately installable resources.
5. Treat `templates/` as the editable source for init scaffolds and `templates/runtime/` as the editable source for `.mstack/templates/` (generated into `runtime/templates.ts`).

## Keep / merge / remove table

### Core agents (19) — KEEP all

| ID | Decision | Notes |
| --- | --- | --- |
| `product-manager` | KEEP | Lifecycle lead |
| `software-architect` | KEEP | Design ownership |
| `backend-engineer` | KEEP | Phase 7 lead |
| `frontend-engineer` | KEEP | Phase 8 lead; absorbs pack `web-engineer` |
| `database-engineer` | KEEP | Persistence ownership |
| `ai-engineer` | KEEP | Distinct from data-ml pack focus |
| `code-reviewer` | KEEP | Review surface |
| `refactoring-specialist` | KEEP | Structure without behavior change |
| `performance-engineer` | KEEP | Measured optimization |
| `security-reviewer` | KEEP | Absorbs pack `security-engineer` |
| `devops-engineer` | KEEP | Delivery/ops |
| `debugging-specialist` | KEEP | Root-cause path |
| `workflow-coordinator` | KEEP | Parallel lane orchestration |
| `product-researcher` | KEEP | Desk research |
| `user-researcher` | KEEP | Primary research |
| `product-designer` | KEEP | Journey/interaction |
| `test-engineer` | KEEP | Absorbs pack QA strategists |
| `product-analyst` | KEEP | Metrics/experiments |
| `release-manager` | KEEP | Go/no-go and rollout |

### Core skills (23) — KEEP all; clarify boundaries

| ID | Decision | Notes |
| --- | --- | --- |
| Ten lifecycle skills (`idea-validation` … `continuous-improvement`) | KEEP | Paired with journey prompts |
| `feature-planning` | KEEP | Post–feature-design implementation slices; **not** an alias of `plan-mvp` |
| `api-contract-design` | KEEP | Canonical method for API contracts; prompt `design-api` thinned to invoke it |
| `database-modeling` | KEEP | |
| `repository-audit` | KEEP | Pack exploration stays pack-scoped |
| `architecture-assessment` | KEEP | Assess ≠ design |
| `threat-model-review` | KEEP | |
| `systematic-debugging` | KEEP | |
| `safe-refactoring` | KEEP | |
| `performance-investigation` | KEEP | |
| `release-readiness` | KEEP | Canonical readiness method; prompt `production-readiness` thinned to invoke it |
| `computer-use-safety` | KEEP | Pack grounding skills thin-point here |
| `browser-verification` | KEEP | |
| `mcp-governance` | KEEP | Skill-only is fine |

### Core prompts (21) — KEEP IDs; MERGE content where duplicated

| ID | Decision | Canonical method | Notes |
| --- | --- | --- | --- |
| Ten lifecycle prompts (`research-idea` … `improve-product`) | KEEP | Matching lifecycle skill | Already invoke skills |
| `design-api` | MERGE content → thin journey | `api-contract-design` | Keep prompt ID as installable journey + discovery alias target |
| `build-backend` / `build-frontend` / `deploy-product` | KEEP | Matching delivery skills | Not duplicates of the skills |
| `plan-mvp` | KEEP (clarify) | — | Hypothesis → smallest MVP; do **not** alias to `feature-planning` |
| `production-readiness` | MERGE content → thin journey | `release-readiness` | Keep ID for compatibility |
| `review-architecture`, `debug-failure`, `refactor-module` | KEEP | Matching assessment/debug/refactor skills | |
| `build-feature`, `review-pull-request`, `improve-documentation` | KEEP | Convenience / unique journeys | |
| `operate-computer`, `verify-journey` | KEEP | Matching automation skills | |

### Hooks (4) — KEEP all

| ID | Decision | Notes |
| --- | --- | --- |
| `repository-health` | KEEP | session-start |
| `change-discipline` | KEEP | before-tool |
| `risk-review` | KEEP | before-tool |
| `feature-completeness` | KEEP | after-response |

### Packs — merge specialists and cut low-value tasks

| Pack resource | Decision | Alias / replacement | Rationale |
| --- | --- | --- | --- |
| `repository-intelligence` agents (6) | MERGE → 3 | `dependency-analyst`, `build-system-diagnostician`, `repository-historian` → `repository-explorer` | Sprawl; explorer owns maps + toolchain + history surveys |
| `web-engineer` | REMOVE install | → `frontend-engineer` | Thin shadow of core |
| `web-delivery` skill | REMOVE install | → `frontend-delivery` | Thin shadow of core |
| `security-engineer` | REMOVE install | → `security-reviewer` | Thin shadow of core |
| `api-boundary-engineer` | REMOVE install | → `backend-engineer` | Thin shadow of core |
| `api-boundary-design` skill | REMOVE install | → `api-contract-design` | Overlap; keep Prisma/authz/schema pack skills |
| `verification-strategist`, `regression-analyst` | REMOVE install | → `test-engineer` | Thin shadows of core |
| `computer-use-grounding`, `browser-journey-evidence`, `automation-fallback-planning` | MERGE content | Point at core `computer-use-safety` / `browser-verification` | Keep pack agents + `review-automation-plan` |
| `devtools.help` | REMOVE | — | `node --help` is noise |
| `graphics.godot-version` | REMOVE | — | Version ping |
| `api.prisma-version` | REMOVE | — | Version ping |
| `qa.node-test`, `qa.playwright-list`, `qa.pytest` | REMOVE | Use `devtools.node-test`, `web.playwright-list`, `ml.pytest` | Duplicate recipes |
| `obs.compose-config` | REMOVE | Use `infra.compose-config` | Duplicate |
| `auto.node-version`, `auto.python-version`, `auto.workspace-tree`, `auto.docs-inventory` | REMOVE | Prefer `mstack snapshot` + shell | Trivial probes |
| `auto.diff-stat` | KEEP | — | Useful pre-automation review signal; not a version ping |
| Niche packs (`robotics`, `embedded-firmware`, `games-graphics`, …) | KEEP | — | Opt-in; keep remaining domain specialists |

### Discovery aliases (catalog)

| Alias | Resolves to | Kind |
| --- | --- | --- |
| `design-api` (as skill lookup) | `api-contract-design` | skill |
| `api-contract-design` (as prompt lookup) | `design-api` | prompt |
| `build-backend` (as skill lookup) | `backend-delivery` | skill |
| `backend-delivery` (as prompt lookup) | `build-backend` | prompt |
| `build-frontend` ↔ `frontend-delivery` | matching pair | skill/prompt |
| `production-readiness` (as skill lookup) | `release-readiness` | skill |
| `release-readiness` (as prompt lookup) | `production-readiness` | prompt |
| `web-engineer` | `frontend-engineer` | agent |
| `web-delivery` | `frontend-delivery` | skill |
| `security-engineer` | `security-reviewer` | agent |
| `api-boundary-engineer` | `backend-engineer` | agent |
| `api-boundary-design` | `api-contract-design` | skill |
| `verification-strategist` | `test-engineer` | agent |
| `regression-analyst` | `test-engineer` | agent |
| `dependency-analyst` | `repository-explorer` | agent |
| `build-system-diagnostician` | `repository-explorer` | agent |
| `repository-historian` | `repository-explorer` | agent |

`plan-mvp` and `feature-planning` are **not** aliased to each other.

## Consequences

- Catalog JSON gains an `aliases` array; queries match alias IDs and descriptions.
- Removed pack resources disappear from the next `mstack ai setup` / pack reconcile for projects that still select those packs; invoke the canonical core ID instead.
- Runtime templates are edited under `templates/runtime/` and synced into `packages/ai-integrations/src/runtime/templates.ts`.
- Marketing counts should be derived from registry lengths or described as “core N + pack contributions,” not hard-coded triplicates that drift.

## Validation

- Unit/catalog tests assert alias resolution and reduced pack agent/task sets.
- Adapter and hook tests cover portable Windsurf/Warp/Amp/Zed paths and runtime hooks.
- CI path filters include every generated runtime directory.
- `pnpm typecheck`, `pnpm test`, and `pnpm build` stay green.
