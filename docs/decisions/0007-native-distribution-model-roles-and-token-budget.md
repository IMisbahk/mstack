# ADR-0007: Native distribution, model-role config, and token budget

- **Status:** Accepted
- **Date:** 2026-10-10
- **Decision owners:** mstack maintainers
- **Related:** [AI workspace runtime](../features/ai-runtime.md), ADR-0001

## Context

Coding agents get more reliable work done when mstack resources install natively with auto-update (Claude plugin marketplace, Cursor `/add-plugin`, Codex/Copilot marketplaces, skills.sh) while `mstack ai setup` remains the universal fallback. Today resource counts are hard-coded in tests and docs, install density is all-or-nothing (a token bomb risk), and there is no shared model-role mapping across tools. Publishing to npm or marketplaces is out of scope for this change; manifests and generators must still be ready.

## Decision drivers

- One runtime registry must remain the source of truth for skills, agents, prompts, hooks, templates, and adapters.
- Users must not install the same skills twice across native and CLI channels.
- Context cost must be measurable (`doctor` / `status`) and reducible (`lite` vs `full`).
- Model routing stays in the user’s AI runtime; mstack only records role bindings.
- CI must fail when committed distribution artifacts or counts drift from the registry.

## Options considered

### Option A: Hand-maintained marketplace trees beside the monorepo

- **Advantages:** Simple to browse; matches some community repos.
- **Disadvantages:** Drifts from `packages/ai-integrations/src/runtime`; duplicates skill content.
- **Fit with drivers:** Poor.

### Option B: Generate `distribution/` and counts from the runtime registry

- **Advantages:** Single source; CI drift gate; same content for every tool; CLI remains fallback.
- **Disadvantages:** Requires a generate step before release.
- **Fit with drivers:** Strong.

### Option C: Host inference and enforce model roles inside mstack

- **Advantages:** Central control.
- **Disadvantages:** Violates existing product boundary (runtimes own inference).
- **Fit with drivers:** Rejected.

## Decision

**Primary deliverable:** generate a first-class Cursor plugin at `distribution/mstack/` in the same shape as pstack in [cursor/plugins](https://github.com/cursor/plugins): `.cursor-plugin/plugin.json`, `skills/` (including `/mstack` router and `/setup-mstack`), `commands/`, `agents/`, `rules/`, `hooks/` + `scripts/`. From the same runtime registry, also generate Claude/Codex/skills.sh layouts and `packages/ai-integrations/src/generated/resource-counts.json`. Keep `mstack ai setup` as the fallback for every adapter. Record an install channel and refuse overlapping native/CLI installs unless `--force`. Tag resources as user- or model-invoked, support `lite`/`full` profiles, write model-role bindings during setup, and optionally install `multi-model-arena`. Report estimated context cost from `mstack doctor` and `mstack status`. Provide local install (`~/.cursor/plugins/local/mstack`) and publishing docs for cursor/plugins submission vs self-host. Do not publish marketplaces or npm from this change.

## Rationale

A generated distribution tree matches how mattpocock/skills and Cursor/Claude marketplaces expect content, without splitting ownership away from the runtime package. Token and role controls address pstack’s “token bomb” criticism while preserving mstack’s non-inference boundary.

## Consequences

### Positive

- One regenerate command refreshes every marketplace layout and the counts lockfile.
- Lite installs shrink always-on metadata; doctor surfaces the cost.
- Duplicate channel installs are detectable before context doubles.

### Negative and accepted risks

- Token estimates use a fixed chars/token heuristic, not provider tokenizers.
- Model catalogs are documented defaults and will lag vendor renames.
- Generated `distribution/` adds a committed tree that must stay regenerated.

### Follow-up work

- [ ] Wire README install section (owned by the README rewrite lane).
- [ ] Publish marketplace entries when maintainers authorize a release.
- [ ] Revisit lite membership when router/playbook skills land.

## Validation

- Unit tests cover policies, token budget, model-role defaults, and channel conflicts.
- `pnpm verify:runtime-artifacts` regenerates and `git diff --exit-code`s committed outputs in CI.

## Revisit when

- A marketplace requires a layout the generator cannot produce.
- Measured always-on token cost for `full` exceeds an accepted product budget.
- Maintainers authorize actual marketplace or npm publishing automation.
