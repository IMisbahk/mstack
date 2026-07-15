# The Stack I Prefer

These are the technologies I reach for when building a modern web product with a small team. They are defaults, not claims that every project should use the same tools.

Defaults matter because repeated stack debates consume time and because familiarity improves delivery, debugging, and operation. Exceptions matter too. If a product constraint makes another choice better, use it and record the reason in an ADR.

Every item below answers two questions: what does it buy, and what cost am I accepting?

## Frontend

### Next.js

I prefer Next.js because routing, server rendering, static generation, server-side data access, image handling, and deployment conventions arrive as one coherent system. That reduces assembly work and keeps a React product productive from prototype through production.

The cost is framework complexity and platform-specific behavior. I use server components for server-owned data and client components only where browser interaction requires them. I do not move core domain logic into frontend route handlers simply because Next.js makes it possible.

### TypeScript

I use strict TypeScript across frontend and backend. It catches integration mistakes early, makes refactoring safer, and lets API contracts become useful tooling for both humans and agents.

Types do not validate network input and they do not prove the business rule is correct. Runtime schemas still protect every untrusted boundary.

### Tailwind CSS

I prefer Tailwind CSS for consistent design tokens, fast composition, and styles that remain close to the component they affect. It lets a small team build a coherent interface without inventing a styling architecture first.

The cost is noisy markup when classes are copied without discipline. Repeated patterns become accessible primitives; semantic HTML remains the foundation.

### GSAP

I use GSAP when motion communicates change, hierarchy, or intentional product character and CSS is no longer a clear solution. I do not add it to make an ordinary interaction look more sophisticated.

Animation carries performance and accessibility costs. Respect reduced-motion preferences, avoid layout shifts, and make sure the product still works without the effect.

## Backend

### Express with TypeScript

I prefer Express when the API deserves its own deployment or serves several clients. It has a broad ecosystem and very little framework policy, which keeps routes, application services, domain rules, and repositories visible.

That freedom means the project must supply its own discipline: runtime validation, centralized errors, structured logging, security middleware, module boundaries, and graceful shutdown. For a small Next.js-only product, route handlers may be enough. A separate Express service earns its cost when the backend has independent clients, workers, scaling, or deployment needs.

## Data

### PostgreSQL

PostgreSQL is my default system of record. Transactions, constraints, indexes, JSON support, full-text capabilities, extensions, and a mature operational ecosystem cover a remarkable range of products.

I prefer one well-understood database over several specialized stores introduced too early. A second datastore adds consistency, backup, security, and operational work. It should solve a measured access pattern that PostgreSQL cannot meet reasonably.

### Prisma

I use Prisma for readable schema definitions, typed queries, migrations, and strong developer ergonomics. It makes routine data access easier for a small TypeScript team and gives AI agents a clear schema to reason about.

The abstraction still has a cost. I review generated SQL and query plans on critical paths, add indexes deliberately, and keep Prisma types inside the data layer. The ORM is not the domain model or the public API.

## Object storage

### S3-compatible storage

For uploads and generated assets, I use AWS S3 or Supabase Storage. Object storage is durable, scalable, and more appropriate for binary data than application servers or relational rows.

I keep it behind an adapter because provider APIs and delivery decisions change. Buckets are private by default, access uses short-lived signed URLs, types and sizes are validated, lifecycle policies are explicit, and malware scanning is added when the product's risk requires it.

## Authentication

### Custom authentication when the control is worth the burden

I build custom authentication only when identity flows, tenancy, regulation, credentials, or integrations require control that a managed system cannot provide. Custom auth is not just a login screen; it creates a continuing security responsibility.

Use established password hashing, secure cookies, CSRF protection where applicable, short-lived sessions or tokens, rotation, revocation, rate limiting, and audit trails. Never invent cryptography.

### Supabase Auth when using Supabase

When Supabase is already part of the platform, I prefer Supabase Auth because identity, sessions, providers, and database authorization integrate cleanly. Row Level Security policies are security boundaries and need dedicated tests.

In either approach, authentication is only identity. The application still decides whether that identity may access this organization, invoice, file, or action.

## AI

### OpenAI by default

I start with OpenAI for model quality, structured outputs, tool calling, multimodal capability, and developer tooling. I pin model identifiers where reproducibility matters, version prompts, validate outputs, and evaluate representative tasks before release.

The cost includes latency, variable behavior, data-handling questions, dependency risk, and usage spend. A model call is an external distributed-system call, not a magic function.

### OpenRouter for production routing

I use OpenRouter when production benefits from multi-provider routing, model choice, fallback, or centralized usage visibility. The application talks to a provider adapter so routing policy does not leak into domain code.

Before routing sensitive data, verify privacy, retention, region, and underlying-provider behavior. More providers improve optionality while increasing the surface that must be evaluated and operated.

### Cheaper models where evaluation permits

I prefer the cheapest model that passes the quality and safety threshold for a task. Classification, extraction, routing, and other constrained work often do not need the largest model. Strong instructions, examples, structured outputs, and task decomposition usually matter more than prestige.

Cost optimization follows evaluation. A cheaper wrong answer is not a saving.

## Deployment

### Vercel for frontend

Vercel is my default for Next.js because previews, CDN delivery, builds, and framework behavior work together with little operational overhead. The trade-off is platform coupling and potential cost or runtime constraints, so I watch duration, bandwidth, regions, and serverless limits.

### Render for backend

I prefer Render for independently deployed Express APIs and workers. It provides straightforward continuous delivery, managed services, health checks, and enough control for most early production systems without owning servers.

The application still needs health endpoints, graceful shutdown, connection-pool discipline, scaling expectations, backups, and monitoring. Managed does not mean operated by nobody.

### Oracle Cloud VM with Docker when control justifies operations

An Oracle Cloud VM with Docker is an advanced option when cost, networking, long-running workloads, or infrastructure control matters enough to own the server lifecycle. Pin images, run as non-root, terminate TLS correctly, restrict the network, automate patching and backups, monitor the host, and rehearse recovery.

A cheaper VM can produce a more expensive operating model. I choose it only when I am willing to carry that work.

## Product services

### Razorpay for payments

For India-focused products, I prefer Razorpay because its local payment methods and ecosystem fit the market. Payment state remains server-owned: verify webhook signatures, process events idempotently, reconcile provider state, and store provider references rather than card data.

Payments turn edge cases into financial incidents. Provider redirects are never proof of payment.

### Resend for email

I use Resend for transactional email because its API and developer workflow are direct. Configure SPF, DKIM, and DMARC, separate transactional from marketing mail, process bounces, and make retries idempotent.

Email is asynchronous and unreliable by nature. A user request should not fail merely because a delivery provider is slow.

## Before adding or replacing technology

I ask:

1. Which documented requirement cannot the current stack meet?
2. What new operating model does this choice introduce?
3. Can the team test, secure, observe, upgrade, and recover it?
4. What data or contracts will become coupled to it?
5. What is the migration path if the choice stops working?
6. Is the benefit visible now, or are we paying for a speculative future?

If those answers are weak, I keep the simpler system.
