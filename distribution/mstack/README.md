# mstack (Cursor plugin)

Build Like This for Cursor. Installable like [pstack](https://github.com/cursor/plugins/tree/main/pstack).

## Entry point

Use **`/mstack`** at the start of a task. It routes to phase prompts, discipline skills, and specialist agents.

Configure models with **`/setup-mstack`** (code / judgment / reviewPanel, optional arena).

## Local test (before marketplace)

```bash
pnpm --filter @imisbahk/mstack generate:runtime-artifacts
pnpm --filter @imisbahk/mstack install:cursor-plugin:local
```

Then reload Cursor (**Developer: Reload Window**) and confirm skills/commands under Customize → Plugins.

Local path: `~/.cursor/plugins/local/mstack` (copy, not an outside symlink).

## One channel only

Do **not** also run `mstack ai setup` for the same skills in a repo that already uses this plugin. Use the plugin **or** the CLI fallback.

## Contents

Generated from the mstack runtime registry (do not edit by hand):

- `skills/` — `/mstack` router, `/setup-mstack`, engineering skills, prompt skills
- `commands/` — slash-command surfaces for the router and phase prompts
- `agents/` — specialist agents + `mstack-agent`
- `rules/` — always-applied Build Like This + model-role template
- `hooks/` + `scripts/` — repository health, change discipline, risk review, feature completeness

Regenerate with `pnpm generate:runtime-artifacts`.
