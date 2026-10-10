# Planning pipeline and session continuity

Status: in progress  
Owner: mstack maintainers  
Product/architecture links: [product.md](../product.md), [architecture.md](../architecture.md), [ADR-0006](../decisions/0006-planning-pipeline-and-session-continuity.md)

## Outcome and scope

- **User need:** Coding agents lose decisions across sessions, invent ticket systems, and write product/architecture docs before trade-offs are confirmed.
- **Intended observable outcome:** In every mstack-supported runtime, agents can grill decisions, keep glossary/ADRs current, sync tracer-bullet tickets to a chosen tracker, implement along the DAG, dual-axis review, and resume safely—without replacing the ten-phase lifecycle.
- **In scope:** Core skills/prompts, templates, validate checks, documentation-pack stewardship, dogfood regeneration.
- **Non-goals:** Playbook router redesign, principle-skill packs, npm distribution/README marketing, skill dedupe of legacy aliases.
- **Assumptions:** Users confirm grilled decisions; tracker CLIs may be absent (local markdown fallback).

## Behavior contract

### Actors and permissions

| Actor | May | Must not | Ownership rule |
| --- | --- | --- | --- |
| Lead agent | Run grilling, publish tickets to configured tracker, implement frontier | Invent a second tracker; write product.md before confirmation | Follows docs/agents/issue-tracker.md when present |
| Subagent lane | Own a non-overlapping ticket or review axis | Recursively fan out or edit shared contracts | Lead merges |
| Human | Confirm decisions; approve encode-lessons | — | Decision owner |

### Pipeline

```text
planning-setup (once)
  -> design-grilling / grill-with-docs
  -> spec-synthesis
  -> ticket-graph
  -> implement-task-graph
  -> dual-axis-review
```

Session continuity: `session-handoff` / `pause-safely` → `session-pickup` / `session-recall`; `encode-lessons` after approval.

Lifecycle binding: grilling prepares phases 5–6; tickets implement after contracts exist or as agreed vertical slices inside phases 7–8.

## Acceptance criteria

- [x] Core runtime exports the planning and continuity skills/prompts and templates.
- [x] `mstack validate` reports GLOSSARY and DECISIONS.
- [x] `mstack init` seeds `docs/glossary.md`.
- [x] Documentation pack inventories glossary/decisions.
- [x] Dogfooded adapter trees include the new resources after `mstack ai setup`.

## Verification

- `pnpm --filter @imisbahk/ai-integrations test`
- `pnpm --filter @imisbahk/mstack test`
- `mstack validate` on this repository
