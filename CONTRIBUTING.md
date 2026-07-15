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

## Verify the work

Before submitting:

- read the rendered Markdown;
- run Markdown lint and verify local links;
- run tests, strict type checks, and builds for code changes;
- confirm templates still synchronize into the CLI package;
- describe what changed, why it belongs, and any remaining risk.

By contributing, you agree that your contribution is licensed under the MIT License.
