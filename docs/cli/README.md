# mstack CLI

`mstack` installs and maintains Misbah Khursheed's Build Like This engineering workflow in a repository. It is safe to run against an existing project: setup previews its plan, adds missing assets, preserves user-owned documents by default, verifies the result, and records managed files in `.mstack/manifest.json`.

## Start in one command

The preferred zero-install entry point is:

```sh
npx mstack
```

Equivalent launchers are supported:

```sh
pnpm dlx mstack
bunx mstack
yarn dlx mstack
```

Inside an existing repository, the standard journey is:

```sh
mstack init
mstack ai setup
mstack status
```

`mstack init --dry-run` previews repository changes. `mstack ai setup --dry-run` previews every runtime artifact and limitation. In automation, pass `--yes` plus explicit runtime IDs or `--all`.

## What setup installs

- Product, architecture, feature, and decision templates when missing.
- `.mstack/config.json` for project preferences.
- `.mstack/manifest.json` for generated-file ownership and upgrade safety.
- Optional repository guidance, prompts, skills, agents, hooks, and runtime templates for supported AI coding environments.

Existing planning documents are preserved. `--force` is the only path that intentionally replaces conflicting generated targets, and should be used after reviewing the dry run.

## Everyday commands

| Command | Purpose |
| --- | --- |
| `mstack init` | Initialize or safely refresh repository onboarding |
| `mstack status` | Show methodology readiness and the next action |
| `mstack explain` | Walk through the repository's installed workflow |
| `mstack ai setup` | Configure detected or selected AI coding runtimes |
| `mstack ai list` | Inspect runtime support and detection |
| `mstack doctor` | Diagnose runtime, repository, permissions, and manifest health |
| `mstack config` | Inspect or change layered configuration |
| `mstack plugins` | Inspect installed capability contributions |
| `mstack update` | Check and apply CLI updates |

See the generated [command reference](command-reference.md) for every option.

## Output and automation

Interactive terminals receive color, progress, and one safe confirmation. Redirected output is stable and contains no animation. Use `--no-color` for plain terminal output and `--json` on setup, status, explain, doctor, AI, and configuration inspection commands for a versioned machine-readable result.

Exit codes are stable:

| Code | Meaning |
| --- | --- |
| `0` | Completed or valid dry run |
| `1` | Operational or unexpected failure |
| `2` | Invalid input or configuration |
| `3` | A required non-interactive decision is missing |
| `4` | Reserved for completed operations with unresolved verification issues |

## More information

- [AI runtime support](ai-runtimes.md)
- [Configuration reference](configuration.md)
- [Troubleshooting](troubleshooting.md)
- [Migration guides](migrations.md)
