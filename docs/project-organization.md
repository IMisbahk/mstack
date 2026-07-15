# How I Organize Projects

I want the repository tree to explain the system before I open a file. Good organization makes ownership and dependency direction visible. It also gives AI agents a map: where a change belongs, what it may depend on, and which internals it must leave alone.

I care less about the exact folder names than whether each important concern has one clear home and a small public interface.

## The shape I usually start with

```text
project/
├── apps/
│   ├── web/                 # Next.js user interface
│   └── api/                 # Express HTTP entry point
├── packages/
│   ├── domain/              # Business rules with little framework coupling
│   ├── database/            # Prisma schema, migrations, repositories
│   ├── storage/             # S3-compatible storage adapter
│   ├── prompts/             # Versioned prompts and output schemas
│   ├── mcp/                 # MCP servers, clients, tools, and policies
│   ├── contracts/           # Boundary schemas and shared generated types
│   ├── config/              # Validated configuration
│   └── ui/                  # UI primitives that are genuinely shared
├── docs/
│   ├── product.md
│   ├── architecture.md
│   ├── features.md          # optional index
│   └── decisions/           # ADRs
├── scripts/                 # Build and operational automation
├── tests/                   # Cross-module and end-to-end tests
├── AGENTS.md
└── README.md
```

This is a direction, not a folder-generation checklist. A smaller product can use `src/modules`, `src/db`, `src/integrations`, and `docs` inside one application. Empty packages do not create modularity; clear ownership does.

## I organize application code by capability

```text
src/
├── modules/
│   ├── accounts/
│   │   ├── account.routes.ts
│   │   ├── account.service.ts
│   │   ├── account.repository.ts
│   │   ├── account.schemas.ts
│   │   └── account.test.ts
│   └── invoices/
├── middleware/
├── integrations/
├── jobs/
└── app.ts
```

When invoice behavior changes, I want most of the change to remain inside `invoices`. Grouping every controller in one directory, every service in another, and every repository in a third often spreads one product change across the entire tree. It looks layered while remaining tightly coupled.

Capability folders also make AI-generated changes easier to review. The agent can work inside one bounded context instead of guessing which of several global files must change.

## Where concerns belong

- **Application code** coordinates user journeys and domain behavior.
- **APIs** authenticate, validate, call application behavior, and translate results. They do not own business rules.
- **Database code** owns schema, migrations, query implementation, and transaction mechanics. Domain modules own what the data means.
- **Storage** exposes operations such as upload, retrieve, delete, and signed URL creation without leaking a vendor across the codebase.
- **Prompts** are versioned artifacts with defined inputs, output schemas, evaluation cases, and model assumptions. Long inline prompt strings hide important behavior.
- **MCP integrations** isolate tool definitions, permissions, timeouts, confirmation rules, and untrusted tool output.
- **Shared contracts** contain types that cross a real boundary. They are not a home for every interface in the project.
- **Utilities** are small, stateless, and broadly reusable. A helper that encodes invoice behavior belongs to invoices.
- **Documentation** stays in the repository so it can change in the same work as the system.

## Dependency rules I enforce

1. Entry points depend on application modules; application modules depend on domain interfaces.
2. Infrastructure implements interfaces required by the domain, not the other way around.
3. Modules communicate through explicit public functions, contracts, or events—not imports from each other's internal files.
4. Shared packages need a specific purpose and owner.
5. Circular dependencies are design feedback. Resolve the confused ownership rather than hiding the cycle.
6. Frontend code consumes public API contracts, never backend ORM models.
7. Provider SDKs stop at adapters. Replacing a provider should not require edits throughout the product.

These rules are not about architectural purity. They reduce the number of files and concepts that move together when requirements change.

## File size is a design signal

I do not use a universal line limit. I split a file when it has several reasons to change, mixes abstraction levels, hides its public behavior, resists focused testing, or becomes a regular merge-conflict location.

The opposite failure is possible too: dozens of one-function files can make a simple flow impossible to follow. The goal is cohesion, not the smallest possible file. Names such as `helpers.ts`, `common.ts`, and `utils.ts` deserve suspicion because they often collect responsibilities nobody has named.

## Monorepository is not the same as monolith

A repository can contain several applications and remain modular. I am comfortable with a monorepository when boundaries are enforced, ownership is clear, and shared tooling removes real duplication.

What I avoid is an undifferentiated repository where every package imports every other package and all releases must move together. That is a monolith of responsibility, regardless of how many folders it has.

I extract a service only when independent scaling, failure isolation, security, ownership, or deployment cadence justifies the cost of networking, observability, versioning, and partial failure. Until then, a modular monolith is usually the simpler and more reliable system.
