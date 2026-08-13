# Product: RepoLens

> Status: Approved for private preview
> Owner: Developer tools lead
> Last updated: 2026-08-13

**Playbook lesson:** a CLI's product is its command contract. Stable stdout
and JSON, honest inference labels, and non-destructive defaults matter more
than extra subcommands.

## Vision

A developer or coding agent can open an unfamiliar repository and quickly see which modules exist, where entry points live, and which commands the project already uses to test them—without the tool changing the tree.

## Problem

READMEs go stale. Test commands hide in CI YAML or package scripts. Agents and new contributors spend the first session guessing `npm test` versus `pnpm vitest` versus a Makefile target, and they infer module boundaries from folder names that are not real packages.

Observation from five internal repositories: three documented a test command that CI no longer ran; four had modules with no README pointer. Hypothesis: a local read-only map will be used in onboarding and in agent context if it is fast, accurate enough, and never writes. Willingness to install another CLI is still a hypothesis.

## Target users and personas

**Primary user:** a software engineer opening a repository they do not own, including during incident response or review.

**Secondary user:** an AI coding agent that needs a cited map rather than a guessed architecture.

**Persona — incoming engineer:** will run one command, wants a scannable summary in seconds, needs a `--json` form for scripts, and treats unexpected file writes or test runs as a trust failure.

## User needs

| Need | Evidence |
| --- | --- |
| See modules and entry points with file citations | Observed onboarding delay; high confidence |
| Discover the test command the repo actually declares | Observed stale READMEs; high confidence |
| Machine-readable output that does not churn | Agent/script users; high importance |
| No writes, installs, or test runs by default | Trust requirement; treat as constraint |
| Know what was inferred vs read from config | Hypothesis; high importance |

## First-release features

| Feature | User outcome | Acceptance summary |
| --- | --- | --- |
| `repolens map` | Orient without spelunking | Prints modules, entry points, and source citations |
| Test command discovery | Know how this repo tests | Shows commands found in manifests and CI, not executed |
| `--json` | Scripts and agents parse one schema | Versioned document; unknown fields may be added, not removed |
| Human stdout | Quick reading in a terminal | Default format is text; progress and warnings go to stderr |
| Inference labels | Avoid false certainty | Each module record is `observed` or `inferred` |
| Dry defaults | Tree is unchanged | Exit 0 mapping never creates, edits, or deletes files |

## Non-goals

- Editing code, applying refactors, installing dependencies, starting services, or running the discovered test commands in v1.
- Cloud indexing, hosted SaaS, secret scanning as a product, or replacing language servers.
- Perfect language coverage. First release targets Node package manifests, lockfiles, CI YAML, and well-known `src/` package layouts, plus a documented extension point.

## Success metrics

| Metric | Preview target |
| --- | --- |
| Time to first useful map on a mid-size repo | Median under 5 seconds |
| Test commands matching what CI actually invokes | At least 90% on a 10-repo fixture set |
| Accidental working-tree writes in default commands | 0 |
| `--json` fixture compatibility | No breaking field rename without a schema version bump |
| Preview users who run it twice in a week | At least 6 of 10 |

Guardrails: default commands make no network calls; output never prints secret values found in files; inferred structure cannot be presented as observed.

## Core journey

1. A developer clones a service and runs `repolens map` at the repository root.
2. Stderr may show scan progress; stdout prints modules with paths and whether each fact is observed.
3. They run `repolens map --json` and pipe it to an agent or script.
4. The JSON lists `testCommands` discovered from `package.json` and CI, with file citations.
5. They run those tests themselves. RepoLens does not.
6. A later RepoLens version adds a field to JSON without breaking existing parsers.

## Constraints and risks

- The working tree is untrusted input. Symlinks, huge trees, and generated folders need bounds and ignores.
- Hypothesis: citing files will beat a prettier but uncited tree. If citations are wrong, trust collapses.
- Exit codes are part of the product: `0` success, `2` usage error, `3` unsupported repo layout, `1` unexpected failure.
- Preview is local-only. Do not add telemetry that phones home from a default map.
