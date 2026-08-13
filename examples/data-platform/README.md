# Data Platform Example: SignalWell

SignalWell is a fictional internal metrics warehouse for a 40-person operations team that needs trustworthy service and workflow metrics, including when events arrive late.

I included a data-platform example because notebooks and dashboard tools do not make a warehouse. Event contracts, late-arriving facts, restatement, and evaluation of metric correctness are architecture. Without them the team argues over screens instead of operating the product.

## What this example demonstrates

- define producer-consumer data contracts before building charts;
- treat late events as a first-class state, not a pipeline bug to ignore;
- evaluate freshness, completeness, and metric definitions as release gates;
- keep a modular monolith for a 40-person internal audience rather than a lakehouse;
- separate operational metrics from ad-hoc exploration so notebooks cannot silently redefine truth.

## Documents before implementation

1. [`product.md`](product.md) names the ops users, the trust problem, and the first metrics that must be right.
2. [`architecture.md`](architecture.md) defines ingest, contracts, restatement, serving, and evaluation.

## How I would deliver it

1. Inventory the five metrics on-call actually uses and where they disagree today.
2. Write event contracts and late-arrival rules with producer owners.
3. Implement ingest, storage, and one restatable metric serving path.
4. Add freshness and completeness checks before any dashboard.
5. Connect a narrow internal UI to the serving contract.
6. Pilot with on-call, then add metrics only when the previous definition stays stable.

## Suggested mstack packs

Pack ids to consider later: `data-ml`, `backend-api`, and `observability`. `mstack pack recommend` may cite repository evidence for them; it does not install packs. Adding a pack remains an explicit choice.
