# Why I Write `product.md`

The most expensive engineering failure is a well-built product nobody needed. `docs/product.md` is how I reduce that risk before architecture and code make the idea feel more certain than it is.

It is the source of truth for product intent. It explains the value the product should create without prescribing implementation. An AI agent reading it should understand the same user, scope, and success criteria as the people building the product.

## What it must define

### Vision

Describe the durable change the product should help create. A vision should guide trade-offs after the first feature list becomes obsolete.

### Problem

Explain the user's present situation, how often the problem occurs, what it costs, and why current alternatives are inadequate. Distinguish evidence from belief. A confident paragraph is not validation.

### Target users

Name the primary segment and the important secondary actors. Include the context and constraints that change the product. Exclude the users the first release will not serve.

I prefer a narrow target because useful specificity beats imaginary reach. A product that works for one real group can expand. A product designed for everyone usually makes weak decisions for everyone.

### User personas

Use a persona only when it represents a meaningful difference in goals, behavior, authority, or constraints. Record the job to be done, pain, workaround, and definition of success. Fictional biography that changes no decision does not belong here.

### Features

Describe capabilities as user outcomes and map each one to a need. Give the first release an explicit boundary and write non-goals beside the goals. If a feature cannot explain the need it serves, it has not earned its maintenance cost.

### Goals

State the measurable product or learning outcome for a defined period. "Ship notifications" is output. "Reduce missed appointments by 20%" is an outcome that can tell you whether notifications helped.

### Success metrics

Define a small set of metrics with formulas, data sources, baselines, targets, and evaluation windows. Pair them with guardrails for error, cost, complaints, safety, or harmful behavior. A metric without an operational definition will become a debate later.

## What does not belong here

The product document can state constraints such as latency, supported regions, budget, accessibility, and compliance because those affect the user and the feasibility of the product. Frameworks, database selections, folder trees, and internal components belong in `architecture.md`.

Keeping them separate matters. Product needs should drive technology choices; a preferred technology should not quietly reshape the problem to justify itself.

## How I use AI here

AI is useful for finding contradictions, identifying missing actors and failure journeys, grouping research, improving acceptance criteria, and challenging weak metrics. It is not a source of user evidence. Every generated claim about a user remains an assumption until reality supports it.

## Review questions

- Can someone new explain the primary user and their current problem?
- Does every first-release capability map to a documented need?
- Are facts, assumptions, and open questions distinguishable?
- Are goals outcomes rather than a shipping checklist?
- Can the metrics actually be calculated?
- Are non-goals and constraints explicit enough to stop scope creep?
- Is there a named owner for product decisions?

Start from [`templates/product.template.md`](../templates/product.template.md). Delete sections that genuinely do not matter; never fill them with invented certainty just to complete the file.
