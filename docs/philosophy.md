# How I Think About Engineering

Build Like This began with a simple observation: AI made code easier to produce, but it did not make software easier to understand.

The quality of a product still depends on the questions asked before the first implementation and the decisions made after it starts changing. AI can accelerate both good and bad thinking. My goal is to create enough clarity that the acceleration points in the right direction.

## Thinking is the work

Typing used to consume a large part of implementation. It consumes less now. The scarce work is defining the problem, reducing ambiguity, choosing boundaries, recognizing risk, and deciding which trade-off is appropriate for this product.

I use AI heavily, but I do not outsource intent to it. An agent can compare approaches, expose missing cases, draft contracts, implement modules, and run verification. It cannot interview the user for me, own the consequences of a shortcut, or decide what this product should mean.

The better the context, the better the result. That is why this playbook spends so much time on product and architecture before code.

## Documentation is an engineering tool

I write before I build because writing makes vague thinking visible. If I cannot explain the user, the problem, the desired behavior, and the boundaries of the system, generating implementation only hides the uncertainty inside code.

Documentation should not be ceremonial. A weekend prototype may need two concise documents. A payment system needs deeper state models, failure behavior, and recovery plans. The useful amount is the amount that changes a decision, prevents conflicting assumptions, or makes a risky behavior testable.

The document must evolve with the product. Stale documentation is worse than missing documentation because it creates false confidence.

## The user comes before the feature

The biggest product mistake I see is starting from a feature because it is exciting to build. Features are implementation candidates, not evidence of value.

I start with the user's current situation: what they are trying to accomplish, what makes it difficult, what they do today, and what a better outcome would look like. Only then do I decide what the software should do.

This is especially important with AI. Adding a model can make a demo impressive without making the product useful. The model earns its place only when it improves a user outcome enough to justify its cost, latency, uncertainty, and privacy implications.

## Backend contracts create stable systems

I design backend behavior before frontend integration because the backend owns the durable rules: data, permissions, validation, state transitions, errors, and side effects. Making those rules explicit gives every interface a stable target.

Backend-first does not mean database-first or user-experience-last. The user journey shapes the contract. The contract then prevents visual implementation details from accidentally defining domain behavior.

This matters even more when AI agents implement different parts of a system. A precise contract lets work happen independently. An implied contract makes every agent guess.

## Modularity is how software survives

Requirements always change. I do not try to predict every change, but I do expect change to happen.

A module should own one coherent capability and expose a small interface. Its implementation can then evolve without pulling unrelated code with it. This is why I prefer organizing around product domains rather than building giant controller, service, or utility folders.

Modularity does not mean microservices. I prefer a well-structured modular monolith until scaling, security, reliability, ownership, or deployment independence gives me a concrete reason to split it. A network boundary is expensive. A folder with a real interface is often enough.

## Simplicity has the lowest carrying cost

Every abstraction, dependency, queue, cache, service, and provider creates a cost someone must carry. That cost appears in debugging, upgrades, observability, failure recovery, onboarding, and future changes.

I prefer the simplest design that meets the known constraints. That can still include sophisticated infrastructure when the product requires it. The distinction is whether the complexity pays for a real requirement or for an imagined future.

Simple does not mean careless. A single PostgreSQL database with good constraints, indexes, backups, and module boundaries is simple. Ignoring data integrity is not.

## Refactoring is ordinary work

The first design is made with the least information the project will ever have. Expecting it to remain perfect is unrealistic.

I refactor continuously as the product teaches me where the real boundaries are. I remove premature abstractions, split responsibilities that have diverged, and strengthen interfaces that are changing too often. Refactoring is not evidence that the architecture failed. Refusing to adapt after learning is.

## Technology choices are cost decisions

I keep a preferred stack because repeated decisions are expensive and familiar tools make delivery faster. But a default is not a law.

Every technology buys capabilities and creates obligations. The right question is not "Is this technology good?" It is "Which requirement makes its cost worthwhile here?" A new datastore adds an operating model. A model provider adds privacy and reliability questions. A managed platform reduces operations but adds constraints and pricing risk.

When a project needs a different choice, I want the reason recorded. That makes the exception thoughtful and gives the team a condition for revisiting it.

## How I resolve trade-offs

When good principles conflict, I use this order:

1. Protect user safety, privacy, and data integrity.
2. Preserve the core user outcome.
3. Meet explicit reliability and business constraints.
4. Prefer the option that is easier to understand, operate, and reverse.
5. Optimize performance or flexibility only with evidence.

This is not a formula that removes judgment. It is a way to make the judgment visible.
