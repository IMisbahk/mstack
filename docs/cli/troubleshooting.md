# mstack troubleshooting

Start with:

```sh
mstack doctor
```

Use `mstack validate` when the CLI runs correctly but repository or AI runtime state may have drifted. Add `--strict` in CI to treat incomplete planning documents and missing optional setup as failures.

For support tooling or CI, use `mstack doctor --json`. Reports include the CLI and Node versions, platform, repository detection, Git availability, write permissions, configuration, and managed-file integrity. Secrets and environment values are not included.

## Codex reports `expected struct HooksToml`

mstack `0.3.0` generated an obsolete flat hook array in `.codex/config.toml`. Upgrade to `0.3.1` or newer, then regenerate the Codex integration:

```sh
npm install -g @imisbahk/mstack@latest
mstack ai setup codex
```

Review and approve the `.codex/config.toml` replacement when prompted. The corrected configuration uses Codex's event-keyed hook tables and preserves the repository-local advisory hook behavior.

## Repository is not initialized

Run `mstack init` from the repository root or pass a target explicitly:

```sh
mstack init ./path/to/project
```

Use `mstack init --dry-run` when adopting an existing repository. Existing product and architecture documents are preserved by default.

## No AI runtime was selected

In a non-interactive environment, detection may not have enough evidence. Supply runtime IDs:

```sh
mstack ai setup codex cursor --yes
```

Run `mstack ai list` to see every supported ID.

## AI setup reports a conflict

mstack found a user-owned file at a generated target and stopped before writing. Review the paths, move or merge the content, then rerun. Use `--force` only when replacing those targets is intentional:

```sh
mstack ai setup codex --dry-run
mstack ai setup codex --force
```

Instruction files that support managed blocks are merged without replacing unrelated guidance.

## Hooks do not run

Open the runtime's hook or trust view and review the generated project configuration. Restart the runtime when it only scans newly created configuration directories at startup. Confirm `node --version` reports 20.11 or newer and run the hook script directly to diagnose it:

```sh
node .mstack/runtime/hooks/repository-health.mjs
```

## JSON is mixed with terminal formatting

Use a command's `--json` option without interactive prompts. Warnings and human diagnostics go to stderr; the requested JSON result is written to stdout. Set `NO_COLOR=1` or pass `--no-color` for tools that combine streams.

## A generated runtime file changed

`mstack validate` reports runtime ownership drift and includes affected paths in `--json` output. Review local edits, preserve anything intentional elsewhere, then preview reconciliation before writing:

```sh
mstack validate --json
mstack ai setup --dry-run
```

Set `MSTACK_DEBUG=1` only when a stack trace is necessary for local diagnosis. Do not include secrets or sensitive repository content in bug reports.
