# Product: SignalWell

> Status: Approved for internal pilot
> Owner: Operations lead
> Last updated: 2026-08-13

**Playbook lesson:** a metrics warehouse is a product with contracts and
failure behavior. Late events, disputed definitions, and unevaluated
dashboards are not notebook problems; they are architecture.

## Vision

The operations team can answer "is this service healthy for customers right now?" from a small set of metrics whose meaning does not change when a job finishes late or someone edits a query.

## Problem

A 40-person company currently mixes application logs, spreadsheet rollups, and a few Grafana panels. When a worker finishes after the hour, some charts under-count and others ignore the late data. Incident reviews spend time reconciling numbers. Engineers paste SQL into notebooks that become unofficial truth.

Observation from two incident reviews: on-call trusted a green error-rate panel that had dropped events arriving more than 15 minutes late. Observation from five engineer interviews: three maintain a private query that disagrees with the shared dashboard. Hypothesis: named contracts and restatement will reduce reconciliation time; that is what the pilot must test.

## Target users and personas

**Primary user:** an on-call operations engineer who needs a small number of trustworthy service metrics during and after an incident.

**Secondary users:** producing-service engineers who emit events, and the ops lead who owns metric definitions.

**On-call persona:** checks a handful of metrics under time pressure, needs to know freshness and completeness, and succeeds when a late backfill changes a number visibly rather than silently.

## User needs

| Need | Evidence |
| --- | --- |
| One owned definition per pilot metric | Observed disagreement; high confidence |
| See when a number is stale or incomplete | Observed in incidents; high confidence |
| Include late events without pretending they were on time | Observed; high confidence |
| Know which producer broke a contract | Hypothesis; high importance |
| Explore freely without overwriting official metrics | Observed notebook drift; medium confidence |

## First-release features

| Feature | User outcome | Acceptance summary |
| --- | --- | --- |
| Versioned event contracts | Producers and consumers share a schema | Breaking field changes are rejected at ingest |
| Late-arrival window | Ops knows what is still open | Each metric declares a watermark and restatement rule |
| Official metric serving | On-call reads one number | Five named metrics with owners, formulas, and units |
| Freshness and completeness | Trust is inspectable | UI shows last event time, expected vs received counts, and late restates |
| Contract evaluation | Bad producers fail visibly | Replay fixtures and daily checks run before the metric is marked healthy |
| Read-only exploration | Ad-hoc questions stay ad-hoc | Notebooks may query replicas; they cannot publish official metrics |

## Non-goals

- Customer-facing analytics, advertising attribution, a self-serve warehouse for every team, real-time bidding, ML training, a general data lake, or replacing OLTP systems.
- Streaming-first infrastructure for the pilot. Batch plus a declared watermark is enough for the five metrics.

## Success metrics

| Metric | Eight-week internal pilot target |
| --- | --- |
| On-call uses SignalWell as first metric source during incidents | At least 8 of 10 sampled incidents |
| Reconciliation arguments about the five official metrics | Reduce to zero unresolved definition disputes |
| Late events included within the declared watermark | 100% of accepted events in evaluation fixtures |
| Contract-breaking producer deploys reaching official metrics | 0 |
| Time to explain a metric's formula and owner | Under 2 minutes from the metric page |

Guardrails: official metrics never silently drop late-but-in-window events; exploration queries cannot mutate serving tables; PII and secrets do not enter event payloads; query cost stays within the stated internal budget.

## Core journey

1. A producer engineer publishes `checkout.completed.v1` with an owner and schema.
2. Ingest validates and stores the event, including ones that arrive 20 minutes late.
3. The transform restates hourly checkout-success for that window.
4. On-call opens the metric, sees it restated, and sees completeness 99.4% with an open watermark.
5. A notebook user explores a replica and cannot publish a competing official number.
6. Evaluation fixtures fail a breaking field rename before it reaches serving.

## Constraints and risks

- Forty people and five metrics do not justify a distributed lakehouse; complexity must be earned by measured volume or ownership split.
- Hypothesis: producers will version events if rejection is loud and early. If they bypass ingest, the metric cannot be official.
- Retention follows existing operational-log policy; the warehouse is not an unbounded archive.
- This is an internal tool. Availability matters for incidents, but it is not a customer data product.
