# Why I Write `architecture.md`

Once the product is clear enough to build, `docs/architecture.md` explains how I intend the system to behave, change, and fail.

Architecture is not a polished diagram or a list of technologies. It is the set of technical decisions that turn product constraints into boundaries, contracts, data ownership, and operating behavior. The document should give a human or AI agent enough context to implement without inventing a different system in every module.

## What it must define

### High-level architecture

Show the actors, system boundary, major components, data stores, external services, and important interaction directions. Explain synchronous requests, asynchronous work, and what happens when a dependency fails.

The diagram is an index. The reasoning around it is the architecture.

### Folder and module structure

Map responsibilities to the repository and state the dependency rules. A folder becomes a boundary only when its ownership and public interface are clear. Otherwise it is visual organization without architectural value.

### Backend architecture

Define the domain modules, application behavior, API and worker entry points, repositories, integrations, background jobs, validation, and error strategy. I start with a modular monolith because it preserves simple deployment while still making boundaries explicit.

### Database

Describe entities, ownership, relationships, invariants, indexes, transaction boundaries, retention, migrations, backups, and recovery. State how tenant and sensitive data are isolated. Data usually outlives application code, so I want its rules to be deliberate.

### APIs

Document operations, request and response schemas, authentication, authorization, idempotency, pagination, versioning, errors, rate limits, and compatibility. Link a machine-readable contract when possible. A frontend should not need to inspect a database model to understand the backend.

### Authentication and authorization

Authentication answers who the actor is. Authorization answers what that actor may do to this resource. Keep them separate and define session or token lifecycle, role and ownership checks, secret handling, abuse controls, and audit needs.

### Deployment and operation

Describe environments, infrastructure, build artifacts, configuration, secrets, CI/CD, migrations, health checks, observability, backups, recovery, and incident ownership. If nobody knows how the design behaves in production, the architecture is incomplete.

### Scaling strategy

Record expected load, current limits, service-level goals, and measurable triggers for indexes, caching, queues, replicas, partitioning, or service extraction. I do not add distributed complexity to prove that a system is production-ready. I add it when evidence shows what it will solve.

## Costs and failure belong in the design

Address security boundaries, privacy, retention, accessibility dependencies, external failures, testing, model cost, infrastructure cost, and disaster recovery in proportion to the product's risk.

Every technology choice should state both what it buys and what it makes the team responsible for. Managed services, AI models, queues, and microservices move work around; none removes it.

## How I use AI here

AI is valuable for enumerating failure modes, comparing trade-offs, drafting schemas, checking a design against product constraints, and finding unclear ownership. It should not silently add infrastructure or patterns because they are common. Every component needs a requirement-linked reason.

## Keep it honest

Update `architecture.md` when a change alters a boundary, core data model, public contract, security model, deployment topology, or important operational assumption. Use an [ADR](decisions.md) to retain the reasoning behind a consequential change.

Start from [`templates/architecture.template.md`](../templates/architecture.template.md). Write the architecture you can justify now, then evolve it as the product teaches you more.
