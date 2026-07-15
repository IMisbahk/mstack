# Production Is Part of the Product

I use "production-quality" to mean that the product can deliver its promised outcome safely, repeatedly, and observably. It does not mean adding every infrastructure pattern associated with large companies.

A system is not production-ready because the code compiles or the demo works. Someone needs to understand how it fails, how data is protected, how a release is reversed or repaired, and how users are affected when a dependency is unavailable.

## Test according to risk

I use a small, deliberate portfolio:

- domain unit tests for calculations, policies, and state transitions;
- integration tests for PostgreSQL, storage, queues, authentication, and provider adapters;
- contract tests for public API behavior;
- end-to-end tests for a few critical user journeys;
- manual exploratory checks for new interaction patterns and accessibility;
- regression evaluations for models, prompts, retrieval, and tools.

The goal is confidence to change the system, not a large test count. Tests that mirror private implementation can make refactoring harder without protecting the user.

Run formatting, linting, strict type checks, tests, dependency checks, and production builds in CI. Keep the main branch releasable.

## Deliver in recoverable steps

Build immutable artifacts, validate configuration at startup, and promote consistent behavior through environments. For live database changes, I prefer expand-and-contract migrations:

1. add the new form without breaking old code;
2. deploy code that can handle both forms;
3. backfill and verify;
4. switch reads and writes;
5. remove the old form in a later release.

Define rollback when it is safe and forward recovery when a data change makes rollback unsafe. Use flags or progressive release when the impact justifies the added control.

## Observe user outcomes, not just servers

Collect signals that answer concrete questions:

- structured logs for significant events and failures;
- metrics for traffic, errors, latency, saturation, jobs, model usage, cost, and product outcomes;
- traces across expensive or distributed paths;
- error tracking connected to release and request context;
- alerts tied to user impact and an actionable response.

I do not alert on every anomaly. An alert without a response is noise. Start from the critical user journey, define what failure means, and measure that.

## Security and privacy begin in the design

Maintain a lightweight threat model: assets, actors, trust boundaries, abuse cases, and mitigations. Test authentication and object-level authorization. Minimize privileges and retained data. Rotate secrets, patch dependencies, redact logs, and define export and deletion before collecting important personal data.

AI adds specific boundaries: prompts, retrieved content, model output, tool calls, provider retention, and indirect prompt injection. Treat each as untrusted where appropriate and keep consequential actions under explicit policy or human confirmation.

## Reliability means recovery

Set timeouts on every network call. Retry only transient failures, with backoff, jitter, a limit, and idempotency. Use durable state before reporting success. Back up data and test restoration; an untested backup is only a comforting assumption.

Document degraded behavior for payments, email, storage, authentication, and model providers. The simplest reliable product often preserves a manual or deterministic path when automation is unavailable.

## Scale from evidence

I normally scale in this order:

1. fix inefficient code and queries;
2. add or correct indexes;
3. cache stable, valuable reads with an invalidation plan;
4. move slow or bursty work to a queue;
5. scale stateless processes horizontally;
6. add database replicas or partitioning for demonstrated load;
7. extract services for a clear isolation or ownership benefit.

For every step, record the threshold, expected improvement, new failure mode, operating cost, and recovery path. Scale is not a reason to abandon understandable architecture.

## Keep improving the whole product

Review user outcomes, reliability, security, latency, cost, and engineering friction together. The most visible feature request is not always the most important constraint.

Update the product and architecture documents, ship a measured change, compare the result, and refactor what the new evidence made clearer. I prefer steady evolution over periodic rewrites because it keeps the reasoning connected to real use.
