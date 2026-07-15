# mstack migration guides

## 0.1 to 0.2

Version 0.2 adds repository manifests, idempotent initialization, methodology health commands, a plugin contribution registry, and AI runtime installation.

No destructive migration is required. In each existing mstack repository, run:

```sh
mstack init --dry-run
mstack init --yes
mstack ai setup --dry-run
```

The second command adopts unchanged templates, preserves edited planning documents, refreshes project configuration, and creates `.mstack/manifest.json`. Choose AI runtimes only after reviewing the separate dry run.

Behavior changes:

- Re-running `mstack init` no longer fails merely because the project is already initialized.
- Existing planning documents are preserved unless `--force` is explicit.
- `mstack status` is the repository-readiness view; `mstack doctor` remains environment and integrity diagnostics.
- Continue prompts and agents use the current native `.continue/prompts/` and `.continue/agents/` locations.
- Machine-readable setup output uses a versioned schema through `--json`.

If a 0.1 integration generated files at an older path, keep user edits, run the 0.2 dry run, and remove obsolete generated files only after the runtime recognizes their replacements.
