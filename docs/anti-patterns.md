# Practices I Avoid

Most codebases do not become difficult because of one obviously terrible decision. They become difficult through locally convenient choices whose cost appears later. These are the patterns I watch for because AI can amplify them quickly.

## Starting with implementation

**What it looks like:** the first artifact is a generated application, while the user, scope, states, and success criteria remain conversational.

**Why I avoid it:** code gives assumptions weight. People start protecting the implementation before proving that its interpretation of the problem is correct.

**What I do instead:** write the smallest useful `product.md` and `architecture.md`, then build one complete vertical slice.

## Feature creep without product direction

**What it looks like:** capabilities are added because competitors have them, a stakeholder mentioned them, or a model can generate them cheaply.

**Why I avoid it:** generation cost is not maintenance cost. Every feature adds states, tests, support, documentation, and future compatibility work.

**What I do instead:** require a user need, expected outcome, metric, priority, and scope trade-off.

## Monolithic repositories without boundaries

**What it looks like:** every package imports internal files from every other package, unrelated changes move together, and ownership is unclear.

**Why I avoid it:** a folder tree suggests order while the dependency graph remains coupled.

**What I do instead:** define domain modules, public exports, dependency rules, and owners. A disciplined monorepository or modular monolith is entirely valid.

## Huge files

**What it looks like:** one file owns routes, business rules, queries, mapping, side effects, and formatting.

**Why I avoid it:** these files are easy to append to and difficult to understand, review, test, or refactor. AI will usually make them larger unless the boundary is explicit.

**What I do instead:** extract coherent responsibilities while keeping the orchestration flow visible.

## Poor separation of concerns

**What it looks like:** UI components query the database, controllers own domain rules, or provider SDK types appear throughout the application.

**Why I avoid it:** changing a layer or provider forces unrelated product behavior to change with it.

**What I do instead:** translate at boundaries and keep domain behavior behind capability-focused interfaces.

## Premature optimization

**What it looks like:** caches, microservices, event buses, or custom infrastructure appear before a measured constraint.

**Why I avoid it:** speculative performance work creates consistency problems and operational systems while the product itself is still uncertain.

**What I do instead:** set a budget, measure, optimize the actual bottleneck, and record the evidence.

## Abstraction before the pattern is understood

**What it looks like:** a generic framework is built for one or two cases that happen to look similar today.

**Why I avoid it:** the abstraction encodes a guess and makes simple behavior indirect. AI is particularly willing to manufacture these layers.

**What I do instead:** tolerate small duplication until the stable shared concept becomes clear, then extract around that concept.

## Distributed systems for appearance

**What it looks like:** an early product has several networked services despite one team, one release cadence, and no isolation requirement.

**Why I avoid it:** latency, partial failure, distributed tracing, deployment coordination, and data consistency become product work.

**What I do instead:** start with a modular monolith and extract only for measured scaling, ownership, security, or reliability reasons.

## Silent failure and unbounded retry

**What it looks like:** exceptions are swallowed, jobs retry forever, or the interface reports success before durable work exists.

**Why I avoid it:** data becomes inconsistent and nobody knows whether retrying is safe.

**What I do instead:** use explicit state, timeouts, bounded retry with backoff, idempotency, dead-letter handling, actionable alerts, and a recovery path.

## Choosing technology for identity

**What it looks like:** a project adds a database, framework, model, or orchestration system because it signals sophistication.

**Why I avoid it:** the team inherits a real cost for an imaginary requirement.

**What I do instead:** connect every choice to a documented constraint and write down what would make the choice unnecessary.
