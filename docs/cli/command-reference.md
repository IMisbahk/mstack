# mstack command reference

> Generated from mstack 0.6.0. Run `pnpm --filter @imisbahk/mstack build && pnpm --filter @imisbahk/mstack docs:generate` after changing the command surface.

## Global command

```text
Usage: mstack [options] [command]

Install the Build Like This AI engineering workflow in any repository

Options:
  -C, --cwd <directory>           run as if mstack was started in this directory
  -h, --help                      display help for command
  --no-color                      disable terminal colors
  -q, --quiet                     suppress non-error output (default: false)
  -v, --version                   output the version number

Commands:
  agent [options] [id]            list installed specialists and runtime
                                  invocation guidance; does not execute models
  ai                              configure AI coding environments for this
                                  repository
  catalog [options] [kind]        discover agents, skills, prompts, hooks, and
                                  templates
  config                          inspect or change mstack configuration
  doctor [options]                inspect the runtime and current project
  explain [options]               walk through Misbah's Build Like This workflow
                                  in this repository
  help [command]                  display help for command
  init [options] [directory]      install Misbah's Build Like This workflow or
                                  bootstrap a project
  pack                            discover and manage curated capability packs
  plugins                         inspect installed mstack capability plugins
  status [options]                show repository readiness and the next
                                  recommended action
  task                            inspect and run curated, policy-gated
                                  argv-only task recipes
  update [options]                check for and apply mstack updates
  validate [options] [directory]  verify repository readiness and managed AI
                                  runtime integrity
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

## mstack catalog

```text
Usage: mstack catalog [options] [kind]

discover agents, skills, prompts, hooks, and templates

Arguments:
  kind        limit results to one resource kind (choices: "packs", "agents",
              "skills", "prompts", "hooks", "templates", "task-recipes")

Options:
  -h, --help  display help for command
  --json      print a versioned JSON catalog (default: false)
```

## mstack pack

```text
Usage: mstack pack [options] [command]

discover and manage curated capability packs

Options:
  -h, --help                 display help for command

Commands:
  add [options] <ids...>     preview and install curated packs into compatible
                             configured runtimes
  help [command]             display help for command
  info [options] <id>        show pack resources and prerequisites
  list [options]             show curated packs
  remove [options] <ids...>  remove selected packs and reconcile owned runtime
                             files
  update [options]           reconcile selected packs through ai setup
```

## mstack pack list

```text
Usage: mstack pack list [options]

show curated packs

Options:
  -h, --help  display help for command
  --json      print a versioned JSON result (default: false)
```

## mstack pack info

```text
Usage: mstack pack info [options] <id>

show pack resources and prerequisites

Options:
  -h, --help  display help for command
  --json      print a versioned JSON result (default: false)
```

## mstack pack add

```text
Usage: mstack pack add [options] <ids...>

preview and install curated packs into compatible configured runtimes

Options:
  --dry-run          preview without writing (default: false)
  -h, --help         display help for command
  --json             print a versioned JSON result (default: false)
  --runtime <id...>  also configure these runtimes
  -y, --yes          accept the displayed plan (default: false)
```

## mstack pack remove

```text
Usage: mstack pack remove [options] <ids...>

remove selected packs and reconcile owned runtime files

Options:
  --dry-run   preview without writing (default: false)
  -h, --help  display help for command
  --json      print a versioned JSON result (default: false)
  -y, --yes   accept the displayed reconciliation plan (default: false)
```

## mstack pack update

```text
Usage: mstack pack update [options]

reconcile selected packs through ai setup

Options:
  --dry-run   preview without writing (default: false)
  -h, --help  display help for command
  --json      print a versioned JSON result (default: false)
  -y, --yes   accept the displayed plan (default: false)
```

## mstack agent

```text
Usage: mstack agent [options] [id]

list installed specialists and runtime invocation guidance; does not execute
models

Options:
  -h, --help  display help for command
  --json      print a versioned JSON result (default: false)
```

## mstack task

```text
Usage: mstack task [options] [command]

inspect and run curated, policy-gated argv-only task recipes

Options:
  -h, --help           display help for command

Commands:
  help [command]       display help for command
  list [options]       list task recipes
  run [options] <id>   run one policy-gated task recipe
  show [options] <id>  show a task recipe
```

## mstack task list

```text
Usage: mstack task list [options]

list task recipes

Options:
  -h, --help  display help for command
  --json      print a versioned JSON result (default: false)
```

## mstack task show

```text
Usage: mstack task show [options] <id>

show a task recipe

Options:
  -h, --help  display help for command
  --json      print a versioned JSON result (default: false)
```

## mstack task run

```text
Usage: mstack task run [options] <id>

run one policy-gated task recipe

Options:
  --dry-run                preview argv without executing (default: false)
  -h, --help               display help for command
  --input <name=value...>  provide a declared recipe input
  --json                   print a versioned JSON result (default: false)
  -y, --yes                approve task execution (default: false)
```

## mstack validate

```text
Usage: mstack validate [options] [directory]

verify repository readiness and managed AI runtime integrity

Options:
  -h, --help  display help for command
  --json      print a versioned JSON report (default: false)
  --strict    treat warnings as validation failures (default: false)
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
