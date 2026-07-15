# Why I Design the API First

An API is an agreement between parts of the product that will change independently. I design that agreement before frontend integration because it forces the durable behavior into the open: data, permissions, validation, state transitions, errors, and side effects.

This is one of the highest-leverage uses of documentation in my workflow. A precise contract lets frontend and backend work proceed independently, gives AI agents an unambiguous target, and exposes missing states before they become scattered UI assumptions.

## The sequence I use

1. Start from a documented user journey and its state transitions.
2. Name resources and commands in product language.
3. Define authentication and resource-level authorization.
4. Write request, response, and error schemas with examples.
5. Specify validation, idempotency, pagination, ordering, and rate limits.
6. Review the contract from user, backend, frontend, security, and operations perspectives.
7. Implement domain behavior, publish the contract, and test conformance.

The journey comes first. "Backend first" does not mean designing an API around database tables and asking the product to adapt.

## HTTP conventions I prefer

- Use nouns for resources and explicit action endpoints only for genuine commands.
- Use standard methods and status codes consistently.
- Return one stable error envelope with a machine-readable code and a safe human message.
- Use cursor pagination for large or changing collections.
- Accept an idempotency key for retried operations that create payments, jobs, messages, or other costly side effects.
- Include request identifiers for support and tracing.
- Never expose stack traces, secrets, ORM details, or internal database errors.

Example:

```json
{
  "error": {
    "code": "invoice_already_paid",
    "message": "This invoice has already been paid.",
    "requestId": "req_01J...",
    "details": {}
  }
}
```

An error is part of the contract, not an implementation accident. The frontend needs enough information to explain the state and offer a valid recovery.

## Keep the contract separate from storage

Database records and Prisma models are not API responses. I map them to explicit schemas so a migration, normalization, or provider change does not leak through every consumer.

This boundary also prevents accidental data exposure. A field existing in the database is not a reason to send it over the network.

## Compatibility is a feature

Prefer additive changes: add optional fields, accept old inputs during migration, and never change a field's meaning in place. When compatibility cannot be preserved, define a version or migration with usage inventory, deadline, guide, telemetry, and owner.

Breaking a consumer is an operational event. Treat it with the same care as a database migration.

## Contract artifacts

Keep OpenAPI, runtime schemas, or an equivalent machine-readable contract in version control. Generate client types when they remove drift, but review the surface they create. Contract tests should verify provider behavior and the assumptions critical consumers depend on.

AI is excellent at generating code from a good contract. It is also excellent at inventing different contracts in different files when none exists.

## What the frontend receives before integration

- operation and product purpose;
- authentication and permission rules;
- request and response examples;
- asynchronous, loading, and eventual-consistency states;
- validation and error cases;
- pagination or streaming behavior;
- a stable mock, sandbox, or implemented endpoint;
- compatibility policy and owner.

If those are missing, the frontend is not blocked by implementation. It is blocked by an undecided system.
