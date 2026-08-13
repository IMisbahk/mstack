# ADR-0003: Curated capability packs and argv-only task recipes

- **Status:** Accepted
- **Date:** 2026-07-25
- **Decision owners:** mstack maintainers
- **Related:** [AI engineering packs](../features/ai-engineering-packs.md)

## Decision

Keep the core Build Like This runtime pack universal and lightweight. Add a built-in, curated pack registry whose resources are composed into the existing adapter renderer only after a project selects them. Persist selected ID/version pairs in the existing project manifest. Do not host inference or agent orchestration in mstack.

Task recipes are data, not arbitrary shell programs: each step is a literal argv array with declared risk, optional preconditions, timeout, and recovery information. Execution uses `shell: false`, stops at the first failed step, and follows a project policy. `balanced` is the default: read-only tasks run directly; all other risk classes require preview/confirmation unless explicitly approved with `--yes`.

## Consequences

- Existing runtime adapter and reconciliation behavior remains the sole file-ownership mechanism.
- v1 excludes third-party pack loading and high-consequence publishing/deployment recipes.
- Pack recommendation inspects well-known marker files and does not change selection or install resources.
- Composition is first-id-wins so a pack cannot overwrite a core resource id.
- Pack removal changes desired selection and requires normal AI setup reconciliation to remove stale owned runtime resources safely.
- Model execution remains visible to and controlled by the user’s chosen runtime.
