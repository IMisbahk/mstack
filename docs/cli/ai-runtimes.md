# AI runtime support

mstack installs one platform-neutral Build Like This pack and renders it through runtime adapters. The host repository remains the project being built: Build Like This is the engineering method and mstack is the installer. The pack contains specialist engineering agents, one skill and prompt for each of the ten lifecycle phases, repository guidance, safe lifecycle checks, and reusable templates. Adapter capability metadata is the source of truth, so a new runtime can be registered without adding CLI conditionals.

## Support matrix

| Runtime | Instructions | Prompts and commands | Skills | Agents | Hooks | Repository paths |
| --- | --- | --- | --- | --- | --- | --- |
| Claude Code | Native | Native skills/commands | Native | Native | Native | `CLAUDE.md`, `.claude/` |
| OpenAI Codex | Native | Skills; personal custom prompts are deprecated | Native | Native | Native | `AGENTS.md`, `.agents/skills/`, `.codex/` |
| Cursor | Native rules | Native skills/commands | Native | Native | Native | `.cursor/`, `.agents/skills/` |
| Gemini CLI | Native | Native TOML commands | Native | Native | Native | `GEMINI.md`, `.gemini/`, `.agents/skills/` |
| Continue | Native rules | Native invokable prompts | Emulated as conditional rules | Native | Unsupported | `.continue/` |
| Aider | Native conventions | On-demand indexed files | On-demand indexed files | Sequential indexed personas | Unsupported | `CONVENTIONS.md`, `.aider.conf.yml`, `.mstack/aider/` |

Unsupported capabilities are skipped with a warning; mstack does not generate fictional configuration. Shared Open Agent Skills use `.agents/skills/` where runtimes support that interoperable location.

## Agent delegation and fallback

Every material lifecycle prompt delegates at least one bounded specialist lane. Claude Code, Codex, Cursor, Gemini CLI, and Continue use their native project-agent surfaces; independent lanes may run concurrently while one lead owns synthesis. Shared documents, contracts, migrations, overlapping files, deployments, and other consequential actions stay serialized and retain their normal authorization requirements.

Aider has no native project subagent or slash-command execution model. Its always-read resource catalog is therefore a compact index, with full prompt, skill, and persona bodies stored under `.mstack/aider/` for explicit loading. Aider performs those named lanes sequentially and must not claim that it spawned agents or ran them concurrently.

When `docs/product.md` is missing or still a template, the installed guidance routes work through `research-idea` and `write-product-definition`. `.mstack/templates/` is reference scaffolding only; project-owned documents, code, tests, feature specifications, and ADRs remain authoritative.

## Install runtimes

Interactive setup selects detected environments:

```sh
mstack ai setup
```

Explicit and automation-friendly forms are:

```sh
mstack ai setup codex cursor
mstack ai setup --all --yes
mstack ai setup claude-code gemini-cli --dry-run
```

Project hooks are code execution surfaces. Claude Code, Codex, Cursor, and Gemini CLI require or expose repository trust controls; review generated hook configuration before enabling it. mstack's bundled hook scripts are local, deterministic, avoid network access, and report repository health or change-discipline guidance.

## Official runtime references

The adapter conventions were verified against current official sources on 2026-07-15:

- [Claude Code `.claude` directory](https://code.claude.com/docs/en/claude-directory), [skills](https://code.claude.com/docs/en/skills), [subagents](https://code.claude.com/docs/en/sub-agents), and [hooks](https://code.claude.com/docs/en/hooks)
- [OpenAI Codex customization](https://learn.chatgpt.com/docs/customization/overview), [skills](https://learn.chatgpt.com/docs/build-skills), [subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents), and [hooks](https://learn.chatgpt.com/docs/hooks)
- [Cursor rules](https://cursor.com/docs/rules), [skills](https://cursor.com/docs/skills), [subagents](https://cursor.com/docs/subagents), and [hooks](https://cursor.com/docs/hooks)
- [Gemini CLI context](https://geminicli.com/docs/cli/gemini-md), [custom commands](https://geminicli.com/docs/cli/custom-commands), [subagents](https://geminicli.com/docs/core/subagents), and [hooks](https://geminicli.com/docs/hooks)
- [Continue rules](https://docs.continue.dev/customize/deep-dives/rules), prompts, and the official [Continue repository](https://github.com/continuedev/continue/tree/main/.continue)
- [Aider conventions](https://aider.chat/docs/usage/conventions.html) and [configuration](https://aider.chat/docs/config/aider_conf.html)

Runtime formats evolve. The adapter registry keeps capability details and official documentation URLs beside each renderer so support can be updated independently.
