# Local install test for the mstack Cursor plugin

## Path A — recommended local copy

1. Generate: `pnpm generate:runtime-artifacts`
2. Install: `pnpm --filter @imisbahk/mstack install:cursor-plugin:local`
3. Reload Cursor window
4. Check Customize → Plugins for **mstack**
5. Run `/mstack` and `/setup-mstack`

This copies `distribution/mstack` → `~/.cursor/plugins/local/mstack`.

Teams/Enterprise may need **Allow Local Plugin Imports** enabled.

## Path B — manual

```bash
rm -rf ~/.cursor/plugins/local/mstack
mkdir -p ~/.cursor/plugins/local
cp -R distribution/mstack ~/.cursor/plugins/local/mstack
```

Do not place the plugin under `~/.cursor/plugins/cache/`.

## Validate without Cursor

```bash
pnpm --filter @imisbahk/mstack validate:cursor-plugin
```
