# Contributing to Build Like This

This repository captures how I approach product and software engineering. Contributions are welcome when they make that reasoning clearer, correct a weak recommendation, improve the tools that carry it into projects, or add evidence from real work.

The goal is not to make the playbook cover every possible preference. Its usefulness comes from having strong defaults and explaining why they exist.

## Propose a change

Open an issue or pull request that explains:

- which reader, project stage, or user outcome is affected;
- what is ambiguous, incomplete, incorrect, or unsafe;
- which change you propose and why it fits the philosophy;
- what cost or trade-off the change introduces;
- which example or evidence supports it when the decision is consequential.

I am especially interested in cases where a default fails under a real constraint. Describe the constraint rather than replacing one opinionated recommendation with a list of options.

## Preserve the voice

Write like an experienced engineer explaining a decision to another engineer:

- be direct, technical, and specific;
- explain why, not only what;
- use first person where it clarifies that a recommendation is a chosen default;
- avoid company voice, marketing language, hype, and invented certainty;
- keep AI in its proper role as an accelerator of judgment;
- include failure, security, operations, cost, and evolution when they change the decision.

Templates should remain useful when copied into someone else's project. Examples should demonstrate reasoning rather than quietly becoming starter applications.

## Keep the system coherent

- Update navigation when adding or renaming documentation.
- Keep guides, templates, generated CLI assets, and examples aligned.
- Change mstack behavior and its developer-experience contract together.
- Preserve the distinction between current CLI behavior and future direction.
- Keep unrelated refactoring out of focused changes.
- Catalog keep/merge/remove and discovery aliases are recorded in [ADR-0005](docs/decisions/0005-catalog-keep-merge-remove.md).

## Templates (two sources, no accidental drift)

| Path | Role | Consumer |
| --- | --- | --- |
| `templates/*.template.md` | Init scaffolds for project-owned `docs/` | `packages/cli` via `pnpm run sync-assets` → `packages/cli/templates/` |
| `templates/runtime/*.template.md` | Reference scaffolds installed under `.mstack/templates/` | `packages/ai-integrations` via `pnpm run sync-runtime-templates` → `src/runtime/templates.ts` |

Edit the Markdown under `templates/` (or `templates/runtime/`), run the matching sync script, and commit both the source and the generated copy. Do not hand-edit `.mstack/templates/` or `packages/cli/templates/`.

## Package manager

This monorepo uses **pnpm** (`packageManager` in the root `package.json`). Use `pnpm install`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. End-user install docs may still show `npm install -g` because that is the common global path; pack recipes that invoke a project's own `npm` scripts are intentional when targeting foreign repositories.

## Verify the work

Before submitting:

- read the rendered Markdown;
- run Markdown lint and verify local links;
- run `pnpm typecheck`, `pnpm test`, and `pnpm build` for code changes;
- confirm `pnpm --filter @mstack/ai-integrations sync-runtime-templates` and `pnpm --filter @imisbahk/mstack sync-assets` leave a clean git diff;
- describe what changed, why it belongs, and any remaining risk.

## Releasing mstack

Do not publish or tag from a feature branch unless maintainers explicitly ask. From a clean `main` checkout:

1. Confirm CI is green and `CHANGELOG.md` `[Unreleased]` is complete.
2. Run `./script.sh major`, `./script.sh minor`, or `./script.sh patch`.
3. The script validates the package, updates workspace versions, regenerates the command reference, runs release checks, creates and pushes the `mstack-v<version>` commit and tag, then opens npm's web login when needed and publishes `@imisbahk/mstack`.
4. If publishing fails after the git push, rerun the printed `npm publish` command; do not create another version.

Registry login and `npm publish` remain npm-specific by design ([ADR-0002](docs/decisions/0002-local-release-publisher.md)). Local development and CI stay on pnpm.

By contributing, you agree that your contribution is licensed under the MIT License.
