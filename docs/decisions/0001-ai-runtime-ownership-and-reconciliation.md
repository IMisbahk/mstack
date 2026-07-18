# ADR-0001: Use capability adapters and manifest-backed reconciliation

- **Status:** Accepted
- **Date:** 2026-07-15
- **Decision owners:** AI Runtime
- **Related:** [`docs/features/ai-runtime.md`](../features/ai-runtime.md)

## Context

AI coding environments use different project files, precedence rules, trust gates, and extension models. A generated file may share a user-owned document, contain executable hooks, or grant model tools access to an external MCP server. The runtime must upgrade its own resources without confusing a generated marker with permission to overwrite user work.

## Decision drivers

- Preserve existing repositories and user edits by default.
- Represent native platform behavior without fabricated parity.
- Make upgrades, removal, interruption, and concurrent edits recoverable.
- Keep platform additions isolated and testable.
- Keep privileged automation subject to explicit approval.

## Options considered

### Lowest-common-denominator files

- **Advantages:** Small implementation and superficially uniform output.
- **Disadvantages:** Discards useful native features and encourages invented mappings where no equivalent exists.
- **Fit:** Does not meet platform fidelity or production-quality requirements.

### Marker-only generated ownership

- **Advantages:** Easy to implement and inspect manually.
- **Disadvantages:** Cannot reliably distinguish user edits, structured entries, renamed resources, or stale generated files. A copied marker can incorrectly authorize replacement.
- **Fit:** Does not meet safe upgrade and removal requirements.

### Capability adapters with manifest-backed reconciliation

- **Advantages:** Each platform renders verified surfaces; durable resource identities and hashes support drift detection, upgrades, and precise removal.
- **Disadvantages:** Requires an inspection model, format-aware ownership, migrations, and more extensive fixtures.
- **Fit:** Meets safety, extensibility, and fidelity requirements.

## Decision

Use a provider-neutral, versioned resource catalog rendered by independent capability adapters. Persist installation ownership in `.mstack/runtime/manifest.json`. Plan changes by comparing desired resources, current repository snapshots, and prior ownership. Apply only resolved operations with stale-file checks, backups, and a repository-local journal.

A prose marker remains useful for humans but is not ownership authority. Shared files use resource-specific managed blocks or stable structured keys. If a format cannot be merged safely, the runtime preserves the file and returns a conflict or manual proposal rather than using a partial parser.

Hooks, MCP servers, trust, executable state, and permission expansion are separate privileged resources. Rendering support does not imply activation approval.

### Compatibility amendment (2026-07-18)

Treat every supported tool as a named capability adapter, including tools that
consume an interoperable `AGENTS.md`, `.agents/skills/`, or `.claude/` surface.
Adapters may co-own byte-identical files, but they must not use symlinks or
inherit another tool's hooks, MCP configuration, permissions, or trust behavior
without independent verification.

Provider detection uses provider-unique project markers and the mstack
manifest. Shared compatibility paths are never sufficient evidence that a
specific provider is configured. Environments without a reliable executable,
such as editor extensions, remain explicitly selectable and detectable from
their unique project state or the manifest.

Shared artifacts store every sorted adapter and capability-profile contributor
so desired state and safe removal do not depend on selection order.

## Consequences

### Positive

- Unsupported capabilities produce honest diagnostics instead of speculative files.
- Reruns converge, and obsolete owned resources can be removed precisely.
- User-modified content is detectable and preserved.
- A new platform is an adapter and fixture set rather than conditionals across the installer.
- The future CLI can present plans and collect approvals without owning filesystem semantics.

### Negative and accepted risks

- TOML and YAML shared-file merging may remain manual unless a native dedicated-file surface exists or a parser dependency is approved.
- Platform behavior changes require capability-profile and fixture maintenance.
- Multi-file application cannot be perfectly atomic; journals and backups provide recoverability rather than an absolute rollback guarantee.

### Follow-up work

- Implement schema and manifest migrations.
- Add fixture-backed adapter profiles.
- Add fault-injection tests around every durable write boundary.
- Integrate the library with the CLI in a separate feature.

## Validation

The decision succeeds when install, no-op rerun, upgrade, adapter removal, user drift, stale writes, and interrupted operations pass from the public package API for all supported adapters, and no test requires overwriting unmanaged content by default.

## Revisit when

- A shared cross-platform standard provides equivalent resource and ownership semantics.
- A supported platform removes project-local configuration or introduces a safer provider-managed installation API.
- Recovery evidence shows repository-local journals and backups are insufficient.
