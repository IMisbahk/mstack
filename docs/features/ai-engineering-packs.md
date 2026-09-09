# Extensible AI Engineering Packs and Safe Task Recipes

## Outcome and scope

Users of `mstack` can opt into a curated domain pack, discover its specialists and tasks, and safely run a small catalog of local argv-only task recipes. `mstack ai setup` remains the lightweight core setup and renders selected compatible packs; it does not execute models or coordinate inference.

The catalog includes starter packs for repository intelligence, software/web, systems, embedded/firmware, robotics, data/ML, mobile, games/graphics, infrastructure/security, CLI/devtools, backend/API, QA/testing, observability, documentation, and computer use. Repository intelligence produces evidence-backed maps and explanations, not autonomous code edits. The computer-use pack covers grounded UI automation and browser-journey evidence behind explicit authorization; its recipes stay read-only and its specialists hand control back instead of guessing. `mstack pack recommend` inspects well-known repository markers and suggests packs with cited evidence; it never installs them.

Every curated pack ships specialists, skills, an invokable prompt, and policy-gated task recipes. Domain recipes stay argv-only and fail before execution when declared file preconditions are missing.

## Acceptance criteria

- `mstack pack list`, `info`, `add`, `remove`, `update`, and `recommend` expose only bundled curated packs.
- Selected pack IDs and versions are persisted in the mstack manifest and are composed into normal runtime rendering.
- `mstack catalog` includes packs, pack specialists, pack skills, pack prompts, and task recipes, and `mstack agent` only describes installed specialists and invocation guidance.
- `mstack catalog --query` and `mstack task list --pack/--risk` filter the same source-backed inventory.
- `mstack task` accepts declarative literal argv steps only, supports ordered failure-stop execution, dry run, JSON records, timeout, file preconditions, and policy confirmation.
- Default `balanced` policy runs read-only recipes directly and requires explicit confirmation for working-tree, destructive, and remote work.
- Duplicate pack, specialist, skill, prompt, and task IDs are rejected before a pack can be registered.

## Non-goals

- Remote, npm, Git, or marketplace pack installation.
- Hosting inference, selecting models, or autonomously dispatching agents.
- Shell-script recipes, implicit commit/push, packaging, publishing, or deployment recipes.
- Automatic pack installation from repository heuristics.

## Failure and recovery

Unknown packs/tasks, missing initialization, missing recipe preconditions, declined confirmation, missing executables, command errors, and timeouts fail with a location-specific result. Recipe execution stops at its first failed step. Pack removal changes desired selection; `mstack ai setup` reconciles runtime-owned artifacts under existing ownership and drift protections. Recommendation is read-only and does not change the manifest.
