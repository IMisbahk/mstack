# mstack

**The AI engineering operating system for your repository.**

mstack is the companion CLI for [Build Like This](https://github.com/IMisbahk/mstack#readme). It bootstraps an opinionated product-to-production workflow, installs a capability-aware AI runtime, and configures the coding environments already used by a project.

```sh
npm install -g @imisbahk/mstack
mstack init
mstack ai setup
```

`mstack init` installs the planning documents, project configuration, and ownership manifest. `mstack ai setup` then installs the capability-aware repository instructions, specialist agents, reusable skills and prompts, advisory hooks, and reference templates for selected coding environments. Both preview changes, preserve existing work, and record generated-file ownership.

## Why mstack exists

AI made code generation fast. It did not remove the need to decide what should exist, where responsibilities belong, how systems fail, or what evidence makes a change safe to ship.

That context is tedious to recreate by hand. Instructions drift between tools. Prompts become disconnected snippets. One generic assistant is asked to cover every discipline. Files are copied without an upgrade path or clear ownership.

Build Like This defines the engineering method. mstack installs it consistently.

| Manual setup | With mstack |
| --- | --- |
| Translate rules for each AI tool | Render one platform-neutral workflow through capability adapters |
| Copy agents, prompts, skills, hooks, and templates | Install one versioned engineering pack |
| Guess what a repository already contains | Detect project state, runtimes, and conflicts |
| Risk replacing existing guidance | Preserve user-owned files by default |
| Recheck setup manually | Use manifests, `status`, `validate`, `doctor`, and versioned JSON output |
| Use one assistant for every concern | Hand work between bounded engineering specialists |

## Capabilities

### AI runtime

mstack detects, configures, and onboards six AI coding environments:

- Claude Code
- OpenAI Codex
- Cursor
- Gemini CLI
- Continue
- Aider

The runtime renders only capabilities the target actually supports. Native, adapted, experimental, and unsupported behavior stays explicit; unsupported resources are reported instead of being represented by fictional configuration.

```sh
mstack ai list
mstack ai setup
mstack ai setup codex cursor --dry-run
mstack ai setup --all --yes
```

See the [AI runtime support matrix](https://github.com/IMisbahk/mstack/blob/main/docs/cli/ai-runtimes.md) for exact platform mappings.

### Multi-agent system

Build Like This includes **19 specialist agents**. Each has a defined responsibility, strict boundaries, preferred workflow, required inputs, expected outputs, and safe handoff rules.

| Specialist | Owns |
| --- | --- |
| Product Manager | User problem, evidence, scope, outcomes, and acceptance criteria |
| Software Architect | Boundaries, contracts, ownership, failure behavior, and decisions |
| Backend Engineer | Validated server behavior, authorization, invariants, and recovery |
| Frontend Engineer | Accessible journeys, UI states, and contract integration |
| Database Engineer | Durable models, constraints, queries, and safe migrations |
| AI Engineer | Evaluated model behavior, constrained tools, and fallbacks |
| Code Reviewer | Correctness, security, compatibility, operations, and test gaps |
| Refactoring Specialist | Behavior-preserving structural improvement |
| Performance Engineer | Measurement, bottleneck isolation, and validated optimization |
| Security Reviewer | Trust boundaries, abuse cases, and exploitable failures |
| DevOps Engineer | Delivery, observability, rollback, and recovery |
| Debugging Specialist | Reproduction, causal diagnosis, and regression evidence |
| Workflow Coordinator | Phase gates, dependency lanes, delegation, and result integration |
| Product Researcher | Sourced problem, alternative, and market evidence |
| User Researcher | Ethical research plans and evidence synthesis |
| Product Designer | User journeys, interaction states, content, and accessibility |
| Test Engineer | Independent risk-based verification and acceptance evidence |
| Product Analyst | Metrics, experiments, outcome interpretation, and learning |
| Release Manager | Go/no-go coordination, rollout thresholds, and recovery ownership |

Supported environments expose these specialists using their native agent or persona mechanisms.

### Skills

The runtime includes **20 reusable engineering skills**:

`idea-validation` · `target-user-definition` · `user-needs-research` · `feature-design` · `product-definition` · `architecture-design` · `backend-delivery` · `frontend-delivery` · `deployment-delivery` · `continuous-improvement` · `feature-planning` · `api-contract-design` · `database-modeling` · `repository-audit` · `architecture-assessment` · `threat-model-review` · `systematic-debugging` · `safe-refactoring` · `performance-investigation` · `release-readiness`

Skills turn broad requests into repeatable processes with explicit inputs, output contracts, and guardrails.

### Hooks

Three local, deterministic, advisory hooks automate checks around AI work:

| Hook | Event | Automation |
| --- | --- | --- |
| Repository health | Session start | Finds missing or incomplete product/architecture context and project scripts |
| Change discipline | Before tool use | Flags vague commit messages and dependency changes that require review |
| Feature completeness | After response | Flags source changes without tests, uncovered contract changes, and migration risk |

Hooks execute code and remain subject to each runtime's repository-trust controls. Review generated configuration before enabling them.

### Prompt packs

The runtime ships **19 complete task prompts**:

`research-idea` · `identify-target-users` · `research-user-needs` · `design-features` · `write-product-definition` · `design-architecture` · `build-backend` · `build-frontend` · `deploy-product` · `improve-product` · `build-feature` · `plan-mvp` · `review-architecture` · `review-pull-request` · `debug-failure` · `refactor-module` · `design-api` · `improve-documentation` · `production-readiness`

Each prompt discovers repository instructions, checks relevant sources of truth, defines boundaries, and requires exact verification evidence.

### Templates

Ten runtime templates keep engineering decisions durable:

| Template | Purpose |
| --- | --- |
| Repository | Boundaries, entry points, workflow, and quality gates |
| Product | Users, problem, scope, non-goals, and success measures |
| Architecture | Components, contracts, data, security, and operations |
| Feature | Behavior, permissions, states, rollout, and measurement |
| ADR | Consequential decisions, alternatives, and consequences |
| API | Operations, schemas, authorization, errors, and compatibility |
| Agent | Bounded specialist definitions |
| Prompt | Reusable, verifiable task workflows |
| Discovery | Sourced idea, user, alternative, and needs evidence |
| Experiment | Hypothesis, baseline, threshold, result, and next decision |

`mstack init` installs project-owned product and architecture documents plus feature and ADR templates. `mstack ai setup` installs the selected environments' runtime library, including reference scaffolds under `.mstack/templates/`.

### Catalog and validation

The runtime catalog is discoverable without inspecting generated directories:

```sh
mstack catalog
mstack catalog agents
mstack catalog hooks --json
```

Repository validation checks planning readiness, managed-file integrity, and AI runtime drift. Normal mode allows actionable warnings; strict mode turns them into CI failures.

The runtime manifest and installed hooks remain trackable. A managed `.mstack/runtime/.gitignore` excludes local backups, operation journals, and staging data from Git.

```sh
mstack validate
mstack validate --strict
mstack validate --json
```

## Multi-agent workflows

mstack installs the specialists and shared methods; Build Like This defines the handoffs. Every material lifecycle prompt delegates at least one bounded specialist lane, and independent lanes run concurrently where the AI environment supports native subagents. Shared contracts, documents, migrations, and production actions keep one owner. The current release configures these roles inside supported AI environments; it does not operate a hosted autonomous agent loop.

### Idea to production

```text
Idea
  ↓
Product Manager ─┬─ Product Researcher — sourced problem and alternatives
                 ├─ User Researcher — target users and needs
                 └─ Product Analyst — assumptions and success signals
  ↓ synthesis gate
Product definition
  ↓
Software Architect ─┬─ Database Engineer
                    ├─ Security Reviewer
                    └─ DevOps Engineer
  ↓ contract gate
Backend / Database / Test lanes with disjoint ownership
  ↓ backend behavior and contract gate
Frontend / Product Design / Test lanes with disjoint ownership
  ↓ integration and release gate
Release Manager + parallel read-only reviews
  ↓
Production and measured learning
```

### Bug report to deployment

```text
Bug report
  ↓
Debugging Specialist — reproduce the failure
  ↓
Systematic Debugging — isolate the root cause with evidence
  ↓
Owning Engineer — implement the narrowest durable fix
  ↓
Code Reviewer — verify the failure path and regression coverage
  ↓
Release Readiness — validate deployment and recovery
  ↓
Deployment
```

### Feature request to release

```text
Feature request
  ↓
Product Manager + Feature Planning
  ↓
Software Architect + API Contract Design
  ↓
Backend / Database / Frontend implementation
  ↓
Focused tests and failure-path verification
  ↓
Security, performance, and code review as required by risk
  ↓
Release Readiness
  ↓
Release
```

## Current statistics

These totals come from the runtime catalog, adapter registry, templates, and examples in the repository.

| Capability | Total |
| --- | ---: |
| Supported AI environments | 6 |
| Specialist agents | 19 |
| Reusable skills | 20 |
| Automation hooks | 3 |
| Prompt packs | 19 |
| Runtime templates | 10 |
| Worked example projects | 5 |
| Supported package managers | 4 |

Catalog totals are enforced by [runtime tests](https://github.com/IMisbahk/mstack/blob/main/packages/ai-integrations/test/runtime.test.ts).

## Installation

Requires Node.js 20.11 or newer. Git is recommended; pass `--no-git` when initialization must not create a repository.

Install mstack globally with npm:

```sh
npm install -g @imisbahk/mstack
```

Then initialize a repository:

```sh
cd your-project
mstack init
```

For a zero-install run, use:

```sh
npx @imisbahk/mstack@latest init
```

mstack understands npm, pnpm, Yarn, and Bun for project setup and self-updates.

## Quick start

The standard onboarding journey is:

```sh
mstack init
mstack ai setup
mstack validate
```

Preview everything before changing an established repository:

```sh
mstack init --dry-run
mstack ai setup codex cursor --dry-run
```

Use explicit runtimes and versioned JSON in automation:

```sh
mstack init --yes
mstack ai setup codex continue --yes
mstack validate --strict --json
```

### Initialize

Representative output; paths and counts depend on repository state.

```text
$ mstack init --dry-run
mstack init · dry run

  Project       TypeScript · existing Git repository
  Add           4 planning files, project configuration, manifest
  Create        docs/product.md, docs/architecture.md,
                docs/features/_template.md, docs/decisions/_template.md
  Git           keep existing repository
```

```text
$ mstack init
✓ Initialized acme
  Added         4 files
  Preserved     1 existing document
  Manifest      .mstack/manifest.json

Next
  1. Configure AI runtimes          mstack ai setup
  2. Research or define product     research-idea / write-product-definition
  3. Check repository               mstack status
```

### Onboard AI environments

```text
$ mstack ai list
AI coding runtimes

  Claude Code   configured · 11 native
  OpenAI Codex  detected · 5 native · 2 adapted
  Cursor        available · 7 native · 1 adapted
  Gemini CLI    available · 9 native
  Continue      available · 5 native · 2 adapted
  Aider         available · 2 native · 4 adapted
```

```text
$ mstack ai setup codex
AI runtime setup
  Runtimes      OpenAI Codex
  Files         skill files · prompt files · agent files · hook files · template files

✓ Configured OpenAI Codex
  Manifest      .mstack/manifest.json
! Project hooks require runtime trust. Review the generated hook configuration.

Next
  Run research-idea if product evidence is missing, then write-product-definition.
```

### Validate the repository

```text
$ mstack status
mstack status
  Setup         needs attention
  Product       draft · 7 placeholders remaining · docs/product.md
  Architecture  complete · docs/architecture.md
  AI runtimes   codex
  Manifest      .mstack/manifest.json

Next
  Use research-idea to validate the idea, then write-product-definition to
  complete the product document (7 placeholders remain).  docs/product.md
```

```text
$ mstack doctor
mstack doctor
  ✓ CLI         0.4.0
  ✓ RUNTIME     Node.js 22.4.1
  ✓ GIT         available
  ✓ REPOSITORY  ~/code/acme
  ✓ PERMISSIONS repository is writable
  ✓ MANIFEST    .mstack/manifest.json

No issues found
```

```text
$ mstack validate
mstack validate
  ✓ SETUP        Build Like This is initialized
  ✓ PRODUCT      docs/product.md is ready
  ✓ ARCHITECTURE docs/architecture.md is ready
  ✓ MANIFEST     .mstack/manifest.json is consistent
  ✓ AI_RUNTIME   74 managed runtime resources verified

✓ Repository validation passed.
```

### Update

```text
$ mstack update
Checking the npm registry…
✓ mstack 0.4.0 is up to date.
```

## Commands

Every command below is implemented. `mstack ai`, `mstack config`, and `mstack plugins` run their default subcommands.

| Command | Purpose | Syntax and example | Expected behavior |
| --- | --- | --- | --- |
| `init` | Install the workflow or bootstrap from Git | `mstack init [directory] [options]`<br>`mstack init ./app --from <repo> --ref main --install` | Inspects the target, previews changes, optionally clones and installs dependencies, preserves files unless `--force` is explicit, writes config and a manifest, and reports the next action. Supports `--dry-run`, `--yes`, `--json`, `--no-git`, `--[no-]templates`, and four package managers. |
| `status` | Report repository readiness | `mstack status [--json]`<br>`mstack status --json` | Reads document state, installed AI runtimes, manifest presence, and the next recommended action. Makes no changes. |
| `explain` | Walk through the installed workflow | `mstack explain [--json]`<br>`mstack explain` | Describes the planning documents that exist and points to the first incomplete step. Makes no changes. |
| `ai setup` | Install the AI engineering pack | `mstack ai setup [runtimes...] [options]`<br>`mstack ai setup claude-code codex --dry-run` | Detects or accepts runtimes, renders supported capabilities, reports limitations and conflicts, confirms before applying, and updates the manifest. Supports `--all`, `--yes`, `--force`, and `--json`. |
| `ai list` | Inspect runtime support and detection | `mstack ai list [--json]`<br>`mstack ai list` | Shows every environment as available, detected, or configured with native and adapted capability counts. Makes no changes. |
| `catalog` | Discover runtime resources | `mstack catalog [kind] [--json]`<br>`mstack catalog agents` | Lists source-backed agents, skills, prompts, hooks, and templates with exact catalog totals. Makes no changes. |
| `validate` | Verify repository and runtime integrity | `mstack validate [directory] [--strict] [--json]`<br>`mstack validate --strict` | Checks planning readiness, repository ownership, and AI runtime drift. Exits with code `4` on errors, or on warnings in strict mode. Makes no changes. |
| `plugins list` | Inspect capability plugins | `mstack plugins list [--json]`<br>`mstack plugins list --json` | Lists plugin metadata and integration, template, and generator contributions. Makes no changes. |
| `config list` | Print resolved configuration | `mstack config list [--json]`<br>`mstack config list` | Merges user and project preferences, then prints the resolved values. Makes no changes. |
| `config get` | Read one setting | `mstack config get <key>`<br>`mstack config get packageManager` | Prints the resolved value or gives guidance for an unknown or unset key. |
| `config set` | Set a project or user preference | `mstack config set <key> <value> [--global]`<br>`mstack config set packageManager pnpm` | Validates and writes `packageManager`, `defaultBranch`, `initializeGit`, `updateCheck`, or `template`. |
| `config unset` | Remove a preference | `mstack config unset <key> [--global]`<br>`mstack config unset template --global` | Removes the value from the chosen scope so lower-precedence configuration can apply. |
| `doctor` | Diagnose the runtime and repository | `mstack doctor [--json]`<br>`mstack doctor` | Checks CLI and Node versions, Git, initialization, write permissions, and manifest integrity, with a specific fix for each issue. Makes no changes. |
| `update` | Check for and apply CLI updates | `mstack update [--manager <manager>] [--yes]`<br>`mstack update --manager npm --yes` | Checks the npm registry, reports when current, or confirms before updating the global package with npm, pnpm, Yarn, or Bun. |

Global options include `-C, --cwd <directory>`, `-q, --quiet`, `--no-color`, and `-v, --version`. See the generated [command reference](https://github.com/IMisbahk/mstack/blob/main/docs/cli/command-reference.md) for every option.

## Planned commands

The following command families describe the platform direction. **They are planned, not implemented.** Names and scopes may change as their contracts are designed.

| Planned command | Direction |
| --- | --- |
| `mstack agent` | Invoke and coordinate installed specialists |
| `mstack prompt` | Apply and compose prompt packs |
| `mstack hook` | Manage activation of approved hooks |
| `mstack skill` | Install or update individual engineering skills |
| `mstack runtime` | Inspect and reconcile AI runtime state |
| `mstack migrate` | Apply explicit config and manifest migrations |
| `mstack template` | Browse and install individual templates |
| `mstack upgrade` | Upgrade repository workflow assets independently of the CLI binary |

Today, use `mstack ai setup` for runtime installation and `mstack update` for the global CLI.

## Repository overview

```text
.
├── docs/                         Build Like This handbook and mstack specifications
│   ├── cli/                      CLI guide, command reference, runtime matrix, migrations
│   ├── decisions/                Architecture decision records
│   └── features/                 Capability specifications
├── examples/                     Five worked product and architecture examples
├── packages/
│   ├── ai-integrations/          Runtime catalog, adapters, ownership, verification
│   └── cli/                      Commands, configuration, manifests, project services
├── templates/                    Product, architecture, feature, and ADR templates
└── AGENTS.md                     Repository-wide AI engineering instructions
```

Build Like This is the method: it explains how to move from evidence and product scope to architecture, contracts, implementation, and production. mstack is the delivery mechanism: it installs that method in the formats a repository's tools understand and keeps ownership explicit.

The `ai-integrations` package owns the provider-neutral resource model, capability adapters, safe planning, reconciliation, and verification. The CLI package owns terminal interaction, project configuration, diagnostics, and the installation journey.

## Direction

mstack is evolving toward a complete repository-local AI engineering platform: a shared AI runtime, specialized agents, reusable skills and prompts, advisory hooks, engineering templates, safe repository bootstrapping, multi-agent orchestration, and automatic configuration for the environments developers already use.

The direction is incremental. The current release installs and maintains the workflow; it does not provide hosted model inference or an autonomous agent execution service. Orchestration will require explicit contracts, permission boundaries, recovery behavior, and evidence that it improves real engineering work before it becomes a shipped promise.

Read the [Build Like This playbook](https://github.com/IMisbahk/mstack#readme), the [complete CLI guide](https://github.com/IMisbahk/mstack/tree/main/docs/cli), the [changelog](https://github.com/IMisbahk/mstack/blob/main/CHANGELOG.md), and the [developer experience contract](https://github.com/IMisbahk/mstack/blob/main/docs/mstack-developer-experience.md).

Released under the [MIT License](LICENSE).
