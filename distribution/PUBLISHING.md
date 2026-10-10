# Publishing mstack distribution

**Top deliverable:** the Cursor plugin at [`mstack/`](./mstack/) — same shape as [pstack](https://github.com/cursor/plugins/tree/main/pstack).

This tree is **generated**. Regenerate with:

```bash
pnpm generate:runtime-artifacts
```

Do not npm-publish or submit marketplaces from CI in this change. Prepare only.

## Option A — Submit to cursor/plugins (official `/add-plugin`)

This is how users get `/add-plugin mstack` like pstack.

1. Regenerate artifacts; commit `distribution/`.
2. Open a PR against [cursor/plugins](https://github.com/cursor/plugins) that:
   - Adds the contents of `distribution/mstack/` as a new top-level `mstack/` directory (keep `.cursor-plugin/plugin.json`, skills, commands, agents, rules, hooks, scripts, README, LICENSE).
   - Appends a marketplace entry to the root `.cursor-plugin/marketplace.json`:
     ```json
     {
       "name": "mstack",
       "source": "mstack",
       "description": "Build Like This for Cursor: /mstack routes outcome-driven engineering across skills, prompts, specialists, and hooks."
     }
     ```
3. Optionally add `assets/logo.svg` before submit.
4. Also submit via [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish) if required by current Cursor process.
5. After approval, users install with `/add-plugin mstack`.

**Do not submit from this automation.** Maintainers submit manually.

## Option B — Host ourselves (supported today for testing + team use)

### B1. Local plugin import (developers)

```bash
pnpm generate:runtime-artifacts
pnpm --filter @imisbahk/mstack install:cursor-plugin:local
```

Copies into `~/.cursor/plugins/local/mstack`. Reload Cursor. See [`mstack/INSTALL_TEST.md`](./mstack/INSTALL_TEST.md).

### B2. Self-hosted marketplace repo

Point a dedicated public repo (or sparse subtree) at this `distribution/` root, which already contains:

- `.cursor-plugin/marketplace.json` listing `mstack`
- `mstack/` plugin directory

Team/enterprise marketplaces can register that git URL. End users still need Cursor marketplace or team marketplace access; `/add-plugin` only resolves plugins Cursor knows about.

### B3. Universal CLI fallback (every tool)

```bash
npx @imisbahk/mstack ai setup cursor
```

Works without any marketplace. Do **not** combine with the Cursor plugin for the same skills.

## Other generated surfaces

| Surface | Path |
| --- | --- |
| Claude Code marketplace | `.claude-plugin/marketplace.json` + `plugins/mstack` |
| Codex / Copilot marketplace | `.agents/plugins/marketplace.json` |
| skills.sh layout | `skills/*/SKILL.md` |

Registry snapshot: **19 adapters**, **19 agents**, **23 skills**, **21 prompts**, **4 hooks**, **10 templates** (registry adapters: 19).
