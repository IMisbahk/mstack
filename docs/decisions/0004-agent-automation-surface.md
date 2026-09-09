# ADR-0004: Agent automation surface (computer use, browser verification, snapshot)

- **Status:** Accepted
- **Date:** 2026-09-09
- **Decision owners:** mstack maintainers
- **Related:** [AI engineering packs](../features/ai-engineering-packs.md), [ADR-0003](0003-curated-capability-packs-and-task-recipes.md)

## Decision

Extend the core runtime with a bounded automation surface and keep mstack out of model hosting:

- Core skills `computer-use-safety`, `browser-verification`, and `mcp-governance` define when grounded UI automation, real-browser verification, and MCP servers are justified, with authorization, confirmation, and recovery rules.
- Core prompts `operate-computer` and `verify-journey` turn those skills into invokable end-to-end journeys in every configured runtime.
- A curated `computer-use` pack adds operator and safety-reviewer specialists, grounding and evidence skills, a plan-review prompt, and read-only context recipes (`auto.*`). Pack recommendation triggers on Playwright/Cypress configs and dependencies.
- `mstack snapshot` exports repository readiness, configured runtimes, selected packs, catalog totals, the next action, and paste-ready guidance as JSON or text. It is read-only.
- Four portable adapters (Windsurf, Warp, Amp, Zed) widen runtime coverage using the existing Markdown compatibility profile; unverified surfaces stay emulated or uninstalled with diagnostics.

## Consequences

- GUI automation is last-resort by default: API/CLI paths first, one grounded action at a time, human confirmation for consequential steps, and handoff instead of guessing.
- Computer-use task recipes stay read-only; no shell programs, deployments, or external writes are added.
- MCP servers remain user-owned configuration; mstack contributes only the trust-review guidance, not server installation.
- `snapshot` output is safe to paste into an agent session: counts, paths, and next actions only, no secrets or file contents.
- New adapters inherit the shared `AGENTS.md` and Open Agent Skills surfaces where verified; Amp additionally renders native commands and subagents.
