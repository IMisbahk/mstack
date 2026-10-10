# Build Like This / mstack

Opinionated product-to-production engineering method, plus the CLI that installs it into every coding agent you use.

## Quick start

```sh
npm install -g @imisbahk/mstack
mstack init
mstack ai setup --dry-run
mstack ai setup
```

`init` installs planning docs and project config. `ai setup --dry-run` shows the exact runtime plan; `ai setup` installs agents, skills, prompts, hooks, and reference templates for detected environments.

### One install line per tool

| Tool | Install / invoke |
| --- | --- |
| npm | `npm install -g @imisbahk/mstack` |
| pnpm | `pnpm add -g @imisbahk/mstack` |
| Yarn | `yarn global add @imisbahk/mstack` |
| Bun | `bun add -g @imisbahk/mstack` |
| npx (no global install) | `npx @imisbahk/mstack@latest init` |
| Claude Code | `mstack ai setup claude-code` |
| Codex | `mstack ai setup codex` |
| Cursor | `mstack ai setup cursor` |
| Gemini CLI | `mstack ai setup gemini-cli` |
| Continue | `mstack ai setup continue` |
| Aider | `mstack ai setup aider` |
| Antigravity | `mstack ai setup antigravity` |
| Kimi Code | `mstack ai setup kimi-code` |
| GitHub Copilot | `mstack ai setup github-copilot` |
| OpenCode | `mstack ai setup opencode` |
| Kiro | `mstack ai setup kiro` |
| Qwen Code | `mstack ai setup qwen-code` |
| Junie | `mstack ai setup junie` |
| Cline | `mstack ai setup cline` |
| Roo Code | `mstack ai setup roo-code` |
| Windsurf | `mstack ai setup windsurf` |
| Warp | `mstack ai setup warp` |
| Amp | `mstack ai setup amp` |
| Zed | `mstack ai setup zed` |
| All detected | `mstack ai setup --all --yes` |

Full command reference: [packages/cli/README.md](packages/cli/README.md) · [docs/cli/README.md](docs/cli/README.md)

## Failure mode → fix

| When this happens | Do this |
| --- | --- |
| Agents invent product scope | Write `docs/product.md` first (`research-idea` → `write-product-definition`) |
| Frontend and backend disagree | Design contracts with `design-api` / `api-contract-design` before UI |
| “We need an MVP” vs “plan this feature” collide | Use `plan-mvp` for hypothesis→experiment; `feature-planning` for agreed capability→slices ([ADR-0005](docs/decisions/0005-catalog-keep-merge-remove.md)) |
| Setup differs across Claude/Cursor/Codex/… | `mstack ai setup` (preview with `--dry-run`) |
| Don’t know what is installed | `mstack catalog` / `mstack catalog --query <name>` (aliases resolve old IDs) |
| Paste context into a new AI session | `mstack snapshot` or `mstack snapshot --json` |
| Docs missing or runtime drifted | `mstack doctor` then `mstack validate --strict` |
| Want domain specialists (web, ML, firmware, …) | `mstack pack recommend` then `mstack pack add <id>` |
| Release / publish the CLI | See [CONTRIBUTING.md](CONTRIBUTING.md#releasing-mstack) — do not tag from this README |

## Why this exists

AI made code cheap. Judgment is still expensive: which problem is real, who has it, what not to build, where ownership sits, and how the system fails. Build Like This is the method. mstack is the installer that keeps agents, skills, prompts, hooks, and templates consistent across coding environments.

```text
idea -> users -> needs -> features -> product.md -> architecture.md
     -> backend contracts -> frontend -> deployment -> continuous improvement
```

Core platform (enforced in tests): **19** AI environments · **19** specialist agents · **23** skills · **21** prompts · **4** hooks · **10** runtime templates · **15** curated packs. Pack totals and discovery aliases: `mstack catalog --json`.

## Handbook

| Document | Why it exists |
| --- | --- |
| [Product lifecycle](docs/lifecycle.md) | Idea → continuous improvement |
| [`product.md` guide](docs/product.md) | Users, scope, success measures |
| [`architecture.md` guide](docs/architecture.md) | Boundaries, contracts, operations |
| [Engineering philosophy](docs/philosophy.md) | Defaults and trade-offs |
| [Decision records](docs/decisions.md) | Consequential choices (incl. [ADR-0005 catalog hygiene](docs/decisions/0005-catalog-keep-merge-remove.md)) |
| [mstack CLI](docs/cli/README.md) | Commands, config, runtimes, troubleshooting |
| [Developer experience contract](docs/mstack-developer-experience.md) | Inspection, consent, recovery |
| [Contributing / release](CONTRIBUTING.md) | How to change the playbook and publish mstack |

## Worked examples

Examples teach reasoning, not starter apps: [hackathon](examples/hackathon/README.md) · [AI app](examples/ai-agent/README.md) · [SaaS](examples/saas/README.md) · [startup](examples/startup/README.md) · [web](examples/web-app/README.md) · [mobile](examples/mobile-app/README.md) · [data](examples/data-platform/README.md) · [CLI](examples/cli-tool/README.md) · [firmware](examples/firmware-device/README.md).

## Agents in this repository

[`AGENTS.md`](AGENTS.md) is the method for coding agents. [`CLAUDE.md`](CLAUDE.md) adds Claude Code notes. They supply context, constraints, and verification—not fake judgment.

Released under the [MIT License](LICENSE).
