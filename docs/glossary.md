# Glossary

Shared product and domain language for mstack and Build Like This. Prefer these terms in specs, tickets, ADRs, and code names. Update during grill-with-docs when a term is loaded or contested.

| Term | Meaning | Avoid | Related |
| --- | --- | --- | --- |
| Host project | The repository being built; product intent lives in its docs/, code, and tests | Treating mstack or Build Like This as the product by default | Project identity |
| Build Like This | The engineering method: outcomes, evidence, contracts, then implementation | Playbook as a synonym for product requirements | Ten-phase lifecycle |
| mstack | Installer and reconciler of method resources into AI runtimes | Agent runtime, model host, autonomous loop product | IntegrationSpec, packs |
| Design grilling | Interview of unsettled decisions before writing product or architecture sources of truth | Open-ended brainstorming without a frontier or confirmation | grill-with-docs, product-definition |
| Glossary | Shared decision-relevant terms and avoided synonyms | Dump of every domain noun | docs/glossary.md |
| Tracer-bullet ticket | Vertical slice that proves user-visible or contract-level behavior with explicit blockers | Horizontal layer ticket (all DB then all API) | ticket-graph |
| Ticket frontier | Open tickets that are unblocked (and unclaimed when claiming is in use) | Entire backlog treated as parallelizable | implement-task-graph |
| Dual-axis review | Parallel review keeping repository standards separate from spec fidelity | Single merged score mixing style and behavior | dual-axis-review |
| Planning setup | Per-repo choice of GitHub, GitLab, or local markdown tickets plus doc paths | Inventing a second tracker mid-session | docs/agents/issue-tracker.md |
| Session handoff | Compact secret-free resume note with pointers and one next action | Pasting full chat or secrets into product docs | session-pickup, pause-safely |

## Ambiguities

- Skill versus prompt: skills are reusable methods; prompts are invokable end-to-end journeys that name the skill to run. Both install through the same IntegrationSpec.

## Relationship notes

- Design grilling prepares product-definition and architecture-design; it does not replace those phases.
- Ticket-graph consumes a publishable spec from spec-synthesis or an agreed feature doc, then implement-task-graph walks the frontier.
- encode-lessons improves the agent environment; continuous-improvement measures product outcomes.
