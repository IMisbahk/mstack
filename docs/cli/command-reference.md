# mstack command reference

> Generated from mstack 0.2.0. Run `pnpm --filter mstack build && pnpm --filter mstack docs:generate` after changing the command surface.

## Global command

```text
Usage: mstack [options] [command]

Install Misbah Khursheed's documentation-first engineering workflow in a
repository

Options:
  -C, --cwd <directory>       run as if mstack was started in this directory
                              (default: ".")
  -h, --help                  display help for command
  --no-color                  disable terminal colors
  -q, --quiet                 suppress non-error output (default: false)
  -v, --version               output the version number

Commands:
  ai                          configure AI coding environments for this
                              repository
  config                      inspect or change mstack configuration
  doctor [options]            inspect the runtime and current project
  explain [options]           walk through Misbah's Build Like This workflow in
                              this repository
  help [command]              display help for command
  init [options] [directory]  install Misbah's Build Like This workflow or
                              bootstrap a project
  plugins                     inspect installed mstack capability plugins
  status [options]            show repository readiness and the next recommended
                              action
  update [options]            check for and apply mstack updates
```

## mstack init

```text
Usage: mstack init [options] [directory]

install Misbah's Build Like This workflow or bootstrap a project

Options:
  --dry-run                    preview the complete setup without writing files
                               (default: false)
  -f, --force                  replace existing managed files (default: false)
  --from <repository>          bootstrap from a Git repository
  -h, --help                   display help for command
  --install                    install dependencies after bootstrapping
                               (default: false)
  --json                       print a versioned JSON result (default: false)
  --name <name>                set the project name
  --no-git                     do not initialize a Git repository
  --no-templates               do not include planning templates
  --package-manager <manager>  set the preferred package manager (choices:
                               "npm", "pnpm", "yarn", "bun")
  --ref <branch-or-tag>        check out a branch or tag when bootstrapping
  --templates                  include planning templates
  -y, --yes                    accept defaults without prompting (default:
                               false)
```

## mstack status

```text
Usage: mstack status [options]

show repository readiness and the next recommended action

Options:
  -h, --help  display help for command
  --json      print a versioned JSON report (default: false)
```

## mstack explain

```text
Usage: mstack explain [options]

walk through Misbah's Build Like This workflow in this repository

Options:
  -h, --help  display help for command
  --json      print a versioned JSON report (default: false)
```

## mstack ai

```text
Usage: mstack ai [options] [command]

configure AI coding environments for this repository

Options:
  -h, --help                     display help for command

Commands:
  help [command]                 display help for command
  list [options]                 show supported, detected, and configured AI
                                 coding environments
  setup [options] [runtimes...]  install Misbah's Build Like This agent, prompt,
                                 skill, hook, and instruction pack
```

## mstack ai setup

```text
Usage: mstack ai setup [options] [runtimes...]

install Misbah's Build Like This agent, prompt, skill, hook, and instruction
pack

Options:
  --all        configure every supported runtime (default: false)
  --dry-run    preview files and limitations without writing (default: false)
  -f, --force  replace conflicting generated targets (default: false)
  -h, --help   display help for command
  --json       print a versioned JSON result (default: false)
  -y, --yes    accept the displayed runtime plan without prompting (default:
               false)
```

## mstack ai list

```text
Usage: mstack ai list [options]

show supported, detected, and configured AI coding environments

Options:
  -h, --help  display help for command
  --json      print a versioned JSON report (default: false)
```

## mstack plugins

```text
Usage: mstack plugins [options] [command]

inspect installed mstack capability plugins

Options:
  -h, --help      display help for command

Commands:
  help [command]  display help for command
  list [options]  show plugin contributions
```

## mstack plugins list

```text
Usage: mstack plugins list [options]

show plugin contributions

Options:
  -h, --help  display help for command
  --json      print a versioned JSON report (default: false)
```

## mstack config

```text
Usage: mstack config [options] [command]

inspect or change mstack configuration

Options:
  -h, --help                   display help for command

Commands:
  get <key>                    print a resolved configuration value
  help [command]               display help for command
  list [options]               print resolved configuration
  set [options] <key> <value>  set a project configuration value
  unset [options] <key>        remove a project configuration value
```

## mstack config list

```text
Usage: mstack config list [options]

print resolved configuration

Options:
  -h, --help  display help for command
  --json      print JSON (default: false)
```

## mstack config get

```text
Usage: mstack config get [options] <key>

print a resolved configuration value

Options:
  -h, --help  display help for command
```

## mstack config set

```text
Usage: mstack config set [options] <key> <value>

set a project configuration value

Options:
  -g, --global  write to user configuration (default: false)
  -h, --help    display help for command
```

## mstack config unset

```text
Usage: mstack config unset [options] <key>

remove a project configuration value

Options:
  -g, --global  write to user configuration (default: false)
  -h, --help    display help for command
```

## mstack doctor

```text
Usage: mstack doctor [options]

inspect the runtime and current project

Options:
  -h, --help  display help for command
  --json      print JSON (default: false)
```

## mstack update

```text
Usage: mstack update [options]

check for and apply mstack updates

Options:
  -h, --help           display help for command
  --manager <manager>  choose the global package manager (choices: "npm",
                       "pnpm", "yarn", "bun")
  -y, --yes            apply an available update without prompting (default:
                       false)
```
