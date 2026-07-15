# Startup Example: CareCircle

CareCircle is a fictional early-stage startup that helps families coordinate non-clinical care tasks for an older relative after hospital discharge.

I included this example because startup speed is often confused with automation speed. The highest-risk questions here are whether families will change behavior, whether the shared plan reduces coordination, and whether somebody will pay. A concierge workflow can answer those questions before a larger software system exists.

## What this example demonstrates

- separate product uncertainty from technical uncertainty;
- validate repeated behavior manually before automating it;
- define stop and pivot conditions before sunk cost distorts the decision;
- treat consent, access, and sensitive data as first-release requirements;
- build reversible boundaries without designing for imaginary scale.

## Documents before implementation

1. [`product.md`](product.md) defines a narrow transition-of-care scenario, user roles, assumptions, evidence thresholds, and stop conditions.
2. [`architecture.md`](architecture.md) chooses a modular monolith and makes consent, audit, notifications, and provider boundaries explicit.

## How I would deliver it

1. Run a concierge pilot with ten invited families and a manual coordinator.
2. Test whether the shared plan reduces missed tasks and coordination messages.
3. Define household, task, invitation, consent, and notification contracts.
4. Implement the smallest self-service backend flow.
5. Build the family interface against those contracts.
6. Automate only the manual work that proved repetitive and valuable.
