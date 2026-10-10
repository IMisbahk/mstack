# Issue tracker setup

Configured by planning-setup for this repository. Ticket-graph and implement-task-graph must follow this file.

- Tracker: {{github|gitlab|local|other}}
- Remote or local root: {{url_or_path}}
- Commands or adapter notes: {{gh|glab|filesystem layout}}
- Local ticket path (if local): {{path such as .scratch/<feature>/issues/}}
- Triage labels: {{map or none}}
- Glossary path: docs/glossary.md
- ADR path: docs/decisions/
- Spec path convention: {{docs/features/<name>.md or tracker}}

## Sync rules

- Publish blocker tickets before dependents so edges can cite real IDs.
- Prefer native blocked-by dependencies when the tracker supports them; otherwise use a Blocked by field in the ticket body.
- Do not invent a second tracker.
