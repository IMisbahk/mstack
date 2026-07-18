# ADR-0002: Make the local release script the npm publisher

- **Status:** Accepted
- **Date:** 2026-07-18
- **Decision owners:** Release
- **Related:** [`script.sh`](../../script.sh), [`cli-publish.yml`](../../.github/workflows/cli-publish.yml)

## Context

The package is released from a versioned `mstack-v<version>` tag. Publishing
from both a local command and the tag-triggered GitHub workflow can race and
attempt to publish the same immutable npm version twice. The maintainer also
wants npm's interactive web authentication available from a local release.

## Decision

Use the root `script.sh` as the single release publisher. It accepts only
`major`, `minor`, or `patch`; requires a clean named release branch; validates
the current package; synchronizes the root, CLI, and integration package
versions; runs the full checks; regenerates the command reference; commits and
annotates the `mstack-v<version>` tag; pushes the branch and tag; authenticates
with `npm login --auth-type=web` when `npm whoami` is not already authorized;
and publishes `@imisbahk/mstack` with provenance.

The tag-triggered GitHub workflow remains as a release validation gate only. It
does not publish and therefore cannot duplicate the local npm publication.

## Consequences

- The maintainer gets one documented local command and an interactive npm auth
  path without storing a token in the repository.
- A failed publish after the git push leaves an immutable commit and tag; the
  script prints the safe retry command instead of creating another version.
- Non-interactive CI cannot use this script's auth path; it should run the
  validation workflow and use an explicitly configured publisher if that policy
  changes later.
- A clean working tree is required so the release commit contains only the
  intended version and generated reference changes.

## Revisit when

- Releases need unattended publishing from a trusted CI environment.
- npm or GitHub changes make local web authentication unavailable.
- The project adopts a separate release orchestration service.
