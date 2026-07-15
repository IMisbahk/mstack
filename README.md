# Build Like This

This is how I build software.

Build Like This is my engineering playbook for turning an idea into a production product. I wrote it to capture the decisions I make before and around the code: how I decide whether a problem is worth solving, how I narrow the user, how I design the system, why I start with backend contracts, and how I keep the result maintainable as it changes.

It is intentionally opinionated. These are not the only valid ways to build software. They are the defaults I trust after repeatedly seeing where projects become unclear, fragile, or unnecessarily complex.

## Why I built this

AI changed the cost of producing code. A working CRUD application can be generated in an afternoon. That is useful, but it does not remove the difficult part of software engineering.

The difficult part is deciding:

- which problem is real enough to solve;
- who actually has that problem;
- what the product should and should not do;
- where responsibilities belong;
- which trade-offs are acceptable;
- how the system will fail, recover, and evolve;
- which generated code is good enough to keep.

Writing code is no longer the bottleneck it once was. Thinking clearly is.

I built this repository because AI is a multiplier for engineering judgment, not a replacement for it. When the product thinking is weak, AI helps produce the wrong system faster. When the product and architecture are clear, AI becomes extraordinarily effective: it can implement against stable contracts, follow explicit boundaries, generate focused tests, and help refactor without guessing at the intent.

Good autocomplete saves keystrokes. Good documentation saves wrong turns.

## The workflow

```text
idea -> users -> needs -> features -> product.md -> architecture.md
     -> backend contracts -> frontend -> deployment -> continuous improvement
```

This is the workflow I follow before writing substantial code:

1. Start with the idea.
2. Identify the target users.
3. Understand what those users actually need.
4. Design features around those needs.
5. Write `product.md`.
6. Design the system in `architecture.md`.
7. Build the backend and its contracts.
8. Build the frontend against those contracts.
9. Deploy something observable and recoverable.
10. Improve it using evidence.

The order is deliberate. A polished interface cannot rescue the wrong product. A fast implementation cannot rescue unclear ownership or a broken data model. Product documentation answers what should exist; architecture answers how it should survive contact with reality.

Read the complete [product development lifecycle](docs/lifecycle.md).

## What I believe

- Product thinking matters more than framework choice. The stack cannot decide what users need.
- Documentation is part of implementation. It is where ambiguity becomes visible while it is still cheap.
- Backend contracts create stability. They force data, permissions, errors, and state transitions to become explicit.
- Simplicity wins because every abstraction, service, and dependency creates work someone must carry.
- Modular systems survive change. A good boundary lets one part evolve without making the whole repository move with it.
- Refactoring is normal. Architecture is maintained through steady correction, not preserved by avoiding change.
- Every technology choice has a cost. A useful decision explains why that cost is justified here.

The [engineering philosophy](docs/philosophy.md) explains how I apply these ideas when they conflict.

## Why mstack exists

Setting up an AI coding environment repeatedly is tedious. The same planning documents, agent instructions, repository rules, prompts, and integrations need to be installed and kept consistent. I do not want that setup work to become a ritual at the start of every project.

`mstack` is the companion CLI for this playbook:

```sh
npm install -g @imisbahk/mstack
mstack init
```

It inspects a repository, previews its changes, preserves existing work, and installs the parts of the workflow that fit. It can configure reusable agents, prompts, hooks, skills, project templates, onboarding, and repository-level guidance for Claude Code, Codex, Cursor, Gemini CLI, Continue, and Aider. Run `mstack ai setup --dry-run` to inspect the exact runtime plan before installing it.

The current platform includes 6 AI environments, 12 specialist agents, 10 reusable skills, 3 automation hooks, 9 prompt packs, and 8 runtime templates. It supports npm, pnpm, Yarn, and Bun, with versioned JSON output for automation.

Projects such as [g-stack](https://github.com/garrytan/gstack) already approach AI development environments with broad capability and configuration. I respect that approach. Build Like This makes a different trade-off: fewer choices, stronger defaults, and a specific product-to-production workflow. The purpose of mstack is not to expose every possible setup. It is to get a repository ready for the process I would personally use.

Read the dedicated [mstack README](packages/cli/README.md) for capabilities, workflows, installation, every implemented command, terminal examples, statistics, and the roadmap. The [CLI guide](docs/cli/README.md) covers configuration and operations, while the [developer experience contract](docs/mstack-developer-experience.md) defines inspection, consent, recovery, and diagnostics.

## Who this is for

This playbook is for people trying to build something real:

- solo founders and indie hackers turning an idea into a product;
- students learning how production decisions fit together;
- startup engineers who need speed without disposable architecture;
- hackathon builders who must cut scope without cutting thought;
- experienced engineers working out where AI belongs in their process.

It is not a step-by-step coding tutorial and it is not a collection of fashionable tools. Use the defaults, understand their reasons, and change them when your constraints provide a better reason.

## Start a project this way

1. Install mstack with `npm install -g @imisbahk/mstack`, then run `mstack init` (or copy the files from [`templates/`](templates/)).
2. Write `docs/product.md` using the [product template](templates/product.template.md).
3. Write `docs/architecture.md` using the [architecture template](templates/architecture.template.md).
4. Use the [feature template](templates/feature.template.md) only when a feature has enough uncertainty or risk to deserve one.
5. Review [project organization](docs/project-organization.md), [my stack defaults](docs/tech-stack.md), and [the engineering rules](docs/engineering-rules.md).
6. Implement the smallest complete journey, backend contract first.
7. Deploy it, observe it, and update both the product and the architecture as you learn.

Do not copy an example as a specification. The examples demonstrate the quality of reasoning I expect, not requirements for your product.

## Handbook

| Document | Why it exists |
| --- | --- |
| [How I use documentation](docs/README.md) | Defines the small set of documents that keep intent and implementation aligned |
| [Engineering philosophy](docs/philosophy.md) | Explains the judgment behind the workflow |
| [Product lifecycle](docs/lifecycle.md) | Walks from idea to continuous improvement |
| [`product.md` guide](docs/product.md) | Keeps the project anchored to a user problem |
| [`architecture.md` guide](docs/architecture.md) | Turns product requirements into technical boundaries and trade-offs |
| [Feature documentation](docs/features.md) | Adds detail only where a feature actually needs it |
| [Project organization](docs/project-organization.md) | Keeps code modular without manufacturing complexity |
| [Preferred stack](docs/tech-stack.md) | Records the technologies I reach for and the costs I accept |
| [Engineering rules](docs/engineering-rules.md) | Makes the standards humans and AI agents should follow explicit |
| [Practices I avoid](docs/anti-patterns.md) | Names patterns that make future changes expensive |
| [API design](docs/api-design.md) | Explains why I design backend contracts before frontend integration |
| [Production and evolution](docs/production.md) | Covers testing, delivery, observability, recovery, and measured scaling |
| [Decision records](docs/decisions.md) | Preserves why consequential choices were made |
| [mstack developer experience](docs/mstack-developer-experience.md) | Defines the behavior of the companion CLI |
| [mstack CLI](docs/cli/README.md) | Documents commands, configuration, AI runtimes, migrations, and troubleshooting |

## Worked examples

Each example begins with product and architecture documents. There is no implementation because the reasoning is the lesson.

- [Hackathon: QueueLess](examples/hackathon/README.md) — cut scope aggressively while keeping a coherent product.
- [AI application: Support Copilot](examples/ai-agent/README.md) — treat prompts, models, tools, evaluation, and human review as architecture.
- [SaaS: InvoiceFlow](examples/saas/README.md) — design tenancy, payments, and operational reliability before they become incidents.
- [Startup: CareCircle](examples/startup/README.md) — validate risky assumptions before automating the business.
- [Web application: LocalBoard](examples/web-app/README.md) — keep a conventional application simple and modular.

## AI agents in this repository

[`AGENTS.md`](AGENTS.md) turns this playbook into instructions for coding agents. [`CLAUDE.md`](CLAUDE.md) adds Claude Code-specific guidance. They do not ask an agent to imitate judgment it does not have. They give it the context, constraints, boundaries, and verification steps needed to make useful work more likely.

## A living playbook

This repository will change as my process changes. That is part of the point. Software evolves, tools improve, and some defaults eventually stop earning their place. The stable part is the method: understand the problem, document the intent, design clear boundaries, implement deliberately, and revise from evidence.

Released under the [MIT License](LICENSE).
