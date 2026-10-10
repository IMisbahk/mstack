# ADR-0006: Planning pipeline and session continuity

- **Status:** Accepted
- **Date:** 2026-10-10
- **Decision owners:** mstack maintainers
- **Related:** [Planning pipeline feature](../features/planning-pipeline-and-continuity.md), [ADR-0001](0001-ai-runtime-ownership-and-reconciliation.md), [ADR-0004](0004-agent-automation-surface.md)

## Context

Agents lose planning intent across sessions, invent parallel ticket systems, and write `docs/product.md` / `docs/architecture.md` before hard decisions are confirmed. External inspirations (pstack continuity playbooks; mattpocock/skills grilling, ticket graphs, two-axis review) show useful structure, but mstack already owns a ten-phase lifecycle and must not duplicate or replace it with a second playbook router.

## Decision drivers

- Keep the product → architecture → contracts lifecycle as the spine.
- Make other coding agents get more reliable planning and delivery work done in every supported runtime.
- Prefer short, composable skills and validate continuity artifacts mechanically where possible.
- Stay out of router/playbook/principle redesign and distribution packaging owned elsewhere.

## Options considered

### Option A: New parallel lifecycle replacing phases 1–6

- **Advantages:** Clean slate matching external skill packs.
- **Disadvantages:** Forks mstack's documented method; forces users to relearn gates.
- **Fit with drivers:** Poor.

### Option B: Core skills/prompts that prepare and continue the existing lifecycle

- **Advantages:** Composes with current phases; installs everywhere via IntegrationSpec; glossary/ADR checks fit `mstack validate`.
- **Disadvantages:** Catalog grows; agents must learn when to grill versus when to write product docs.
- **Fit with drivers:** Strong.

### Option C: Documentation pack only

- **Advantages:** Smaller core.
- **Disadvantages:** Planning continuity would be optional and miss default dogfood installs.
- **Fit with drivers:** Weak for the stated goal.

## Decision

Adopt Option B:

- Core skills for design grilling, grill-with-docs, planning-setup, spec-synthesis, ticket-graph, implement-task-graph, dual-axis-review, and session continuity (handoff, pickup, pause-safely, recall, encode-lessons).
- Matching prompts as invokable journeys.
- Templates for glossary, ticket, session handoff, and issue-tracker setup; `mstack init` seeds `docs/glossary.md`.
- `mstack validate` warns on missing/draft glossary and missing/empty numbered ADRs without blocking setup completeness on product/architecture alone.
- Documentation pack gains glossary/ADR stewardship skills and readonly inventory tasks.

## Consequences

### Positive

- Agents interview before filling planning docs, share language via glossary/ADRs, and deliver through a ticket DAG with standards-versus-spec review.
- Continuity skills reduce context-loss rework without hosting model inference in mstack.

### Negative and accepted risks

- Larger default skill/prompt catalog (token cost for tools that load everything).
- Glossary/ADR validate warnings appear on older repos until they adopt the files.

### Follow-up work

- [ ] Router/playbook agent may cite these skills without owning their content.
- [ ] Distribution/README count updates owned by the packaging lane.

## Validation

- Runtime tests assert new skill/prompt/template IDs and planning-pipeline section in method instructions.
- Catalog and validate tests cover GLOSSARY/DECISIONS checks.
- Dogfooded runtime trees regenerate with the new resources.

## Revisit when

- Measured token/load cost forces a default-versus-pack split for continuity skills.
- Native tracker APIs need a typed mstack command beyond skill-guided `gh`/`glab`/files.
