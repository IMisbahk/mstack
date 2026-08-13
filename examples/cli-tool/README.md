# CLI Tool Example: RepoLens

RepoLens is a fictional local CLI that maps a repository's modules, entry points, and documented test commands so a developer or agent can orient without guessing.

I included a CLI example because developer tools are products with contracts. Stdout, JSON, exit codes, and default safety are the user interface. A mapper that writes files, runs tests, or changes format without a version bump is a breaking change, even if the code still "works."

## What this example demonstrates

- treat argv, stdout, stderr, and exit codes as a versioned contract;
- keep JSON output stable and explicit so scripts and agents can rely on it;
- default to non-destructive, read-only behavior;
- distinguish observed repository facts from inferred structure;
- skip network, installs, and test execution until the user asks.

## Documents before implementation

1. [`product.md`](product.md) defines the local user, the map they need, and what the tool must never do by default.
2. [`architecture.md`](architecture.md) describes command contracts, scanners, output schemas, and failure behavior.

## How I would deliver it

1. Watch five developers (or agents) onboard onto an unfamiliar repo and note where they guess.
2. Define the map schema, command names, and exit codes.
3. Implement read-only detectors for modules and test commands.
4. Freeze `--json` fixtures before polishing human output.
5. Add `--print-tests` display; do not execute tests in the first release.
6. Pilot on this repository and two others with different layouts before calling the contract stable.

## Suggested mstack packs

Pack ids to consider later: `cli-devtools` and `repository-intelligence`. `mstack pack recommend` may cite repository evidence for them; it does not install packs. Adding a pack remains an explicit choice.
