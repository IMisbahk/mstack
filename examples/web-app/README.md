# Web Application Example: LocalBoard

LocalBoard is a fictional neighborhood notice board for road closures, lost pets, community events, and other time-sensitive local updates.

I included a conventional web application because good engineering is not reserved for payments or AI. A small product still needs a clear audience, moderation rules, privacy boundaries, failure states, and a structure that will survive the next set of requirements.

## What this example demonstrates

- choose utility over engagement mechanics;
- define content lifetime and moderation before opening the feed;
- avoid collecting precise location because the product does not need it;
- use a modular monolith rather than manufacturing services;
- omit GSAP, real-time infrastructure, and native apps when CSS and HTTP solve the product.

## Documents before implementation

1. [`product.md`](product.md) defines one neighborhood pilot, trust needs, and constrained content categories.
2. [`architecture.md`](architecture.md) describes moderation, location privacy, image handling, deployment, and simple module boundaries.

## How I would deliver it

1. Interview residents and one community moderator.
2. Define post, report, and moderation state transitions.
3. Build authentication, membership, moderation, and post APIs.
4. Add the feed and composer after contract review.
5. Open the pilot only after reporting and moderation work end to end.
6. Measure useful-post rate and moderation load before adding surface area.
