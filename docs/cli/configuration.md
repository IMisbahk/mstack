# mstack configuration reference

mstack resolves user preferences first, then overlays project preferences. Command-line options take final precedence for the current invocation.

## Locations

| Scope | macOS and Linux | Windows |
| --- | --- | --- |
| User | `$XDG_CONFIG_HOME/mstack/config.json` or `~/.config/mstack/config.json` | `%APPDATA%\mstack\config.json` |
| Project | `<repository>/.mstack/config.json` | `<repository>\.mstack\config.json` |

Set `MSTACK_CONFIG_HOME` to override the user configuration directory in automation or isolated development environments.

## Keys

| Key | Values | Effect |
| --- | --- | --- |
| `packageManager` | `npm`, `pnpm`, `yarn`, `bun` | Preferred dependency installer |
| `defaultBranch` | Non-empty branch name | Initial Git branch |
| `initializeGit` | `true`, `false` | Default Git initialization behavior |
| `updateCheck` | `true`, `false` | Whether background update notices may be shown |
| `template` | Git URL or local repository path | Default bootstrap source |

## Commands

```sh
mstack config list
mstack config list --json
mstack config get packageManager
mstack config set packageManager pnpm
mstack config set updateCheck false --global
mstack config unset template --global
```

Project writes require an initialized repository. Pass `--global` only when the preference should affect every project for the current user.

## Generated state

`.mstack/manifest.json` is not user configuration. It records the mstack version, operation ID, installed runtimes, managed paths, content hashes where safe, and ownership metadata. Do not hand-edit it; rerun the owning setup command instead.
