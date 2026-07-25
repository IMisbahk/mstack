# Extensible AI Engineering Packs and Safe Task Recipes

## Outcome and scope

Users of `mstack` can opt into a curated domain pack, discover its specialists and tasks, and safely run a small catalog of local argv-only task recipes. `mstack ai setup` remains the lightweight core setup and renders selected compatible packs; it does not execute models or coordinate inference.

The first release includes starter packs for repository intelligence, software/web, systems, embedded/firmware, robotics, data/ML, mobile, games/graphics, infrastructure/security, and CLI/devtools. Repository intelligence produces evidence-backed maps and explanations, not autonomous code edits.

## Acceptance criteria

- `mstack pack list`, `info`, `add`, `remove`, and `update` expose only bundled curated packs.
- Selected pack IDs and versions are persisted in the mstack manifest and are composed into normal runtime rendering.
- `mstack catalog` includes packs and task recipes, and `mstack agent` only describes installed specialists and invocation guidance.
- `mstack task` accepts declarative literal argv steps only, supports ordered failure-stop execution, dry run, JSON records, timeout, and policy confirmation.
- Default `balanced` policy runs read-only recipes directly and requires explicit confirmation for working-tree, destructive, and remote work.

## Non-goals

- Remote, npm, Git, or marketplace pack installation.
- Hosting inference, selecting models, or autonomously dispatching agents.
- Shell-script recipes, implicit commit/push, packaging, publishing, or deployment recipes.

## Failure and recovery

Unknown packs/tasks, missing initialization, declined confirmation, command errors, and timeouts fail with a location-specific result. Recipe execution stops at its first failed step. Pack removal changes desired selection; `mstack ai setup` reconciles runtime-owned artifacts under existing ownership and drift protections.
