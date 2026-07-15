# Feature: Runtime catalog and repository validation

> Status: Released
> Owner: mstack CLI
> Last updated: 2026-07-16
> Product need: Make installed capabilities discoverable and make repository/runtime drift safe to detect in local development and CI

## Outcome and scope

Developers can see what the Build Like This runtime contains without inspecting generated directories, and can run one read-only command to determine whether repository onboarding and managed AI runtime state are healthy.

Included:

- `mstack catalog [kind]` for agents, skills, prompts, hooks, and templates;
- stable, versioned JSON output for catalog automation;
- `mstack validate [directory]` for planning-document readiness, mstack manifest integrity, and AI runtime verification;
- `--strict` validation that treats warnings as release-blocking;
- stable exit code `4` when validation fails;
- human output with specific recovery actions.

Not included:

- invoking agents or prompts;
- installing individual catalog resources;
- a hosted orchestration loop;
- mutating or repairing failed validation automatically;
- duplicating environment diagnostics already owned by `mstack doctor`.

## Behavior contract

### Catalog

`mstack catalog` lists every resource grouped by kind and reports exact totals. An optional kind limits output to `agents`, `skills`, `prompts`, `hooks`, or `templates`. Catalog reads the versioned runtime definitions directly, so documentation and terminal output cannot maintain a separate inventory.

### Validation

Validation is read-only. It reports stable checks for initialization, product documentation, architecture documentation, the repository manifest, and the AI runtime. Missing or draft planning documents are warnings; missing managed files, content drift, invalid hooks, unsafe ownership state, and an installed runtime without its runtime manifest are errors.

Normal validation fails only on errors. `--strict` also fails on warnings. Human and JSON modes use the same report and exit semantics.

## Acceptance criteria

- [x] Catalog totals and IDs come from runtime exports rather than duplicated CLI constants.
- [x] Every supported catalog kind has human and JSON output.
- [x] Validation makes no filesystem changes.
- [x] A healthy initialized repository exits successfully.
- [x] A repository with warnings exits successfully normally and with code `4` under `--strict`.
- [x] Runtime drift or missing manifest-owned resources exits with code `4`.
- [x] Every warning or error includes one relevant recovery action.
- [x] Tests cover catalog filtering, JSON schemas, healthy validation, strict warnings, and runtime failure.

## Release and measurement

Both commands ship as additive functionality in mstack 0.3.0. Measure usefulness through issue reports and whether validation becomes viable as a CI quality gate; do not add repair behavior until real failure patterns justify it.
