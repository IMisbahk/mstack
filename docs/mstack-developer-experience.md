# Why mstack Exists and How It Should Feel

> Status: Active UX contract · Owner: Misbah Khursheed · Last updated: 2026-07-16

I built the Build Like This playbook because better context produces better
software. I started mstack because recreating that context in every repository
is repetitive and easy to do inconsistently.

The long-term job of mstack is simple: install the way I work. That includes the
product and architecture documents that shape the project, the instructions
that guide AI agents, and eventually the reusable prompts, hooks, skills,
agents, templates, onboarding, and runtime integrations that support the same
process. It should automate setup without hiding intent or replacing judgment.

Other tools make a different and valid trade-off. g-stack, for example, is
comprehensive and highly configurable. mstack is deliberately narrower. I do
not want to ask a developer to design an AI environment before they can design
their product. I want to provide strong defaults that reflect this playbook,
show exactly what will change, and get out of the way.

This document defines the behavior I expect before, during, and after mstack
changes a repository. It specifies observable behavior, copy, and recovery—not
the internal implementation. The command names and capabilities marked below
are the intended public surface; some are not implemented yet.

## Current boundary

The current CLI can initialize a project, install planning templates, preserve
existing files, report repository status, explain the workflow, discover the
runtime catalog, validate repository and AI runtime integrity, configure
supported AI coding environments, store project configuration, inspect the
environment, and manage updates. Resumable CLI operations and undo describe the
direction of the experience, not a promise that those commands are available in
the published version today.

This distinction matters. I want the documentation to make room for the system
mstack can become without describing future work as shipped behavior.

## Experience promise

A developer should be able to run one command, understand the proposed change,
finish setup without first studying the tool, and know exactly what to do next.
I do not want automation that saves setup time by creating uncertainty. mstack
must never leave someone wondering whether it is still working, which files it
changed, or how to recover.

The experience has five rules, each inherited from the playbook itself:

1. **Show intent before side effects.** Summarize the target, detected context,
   and planned work before making a consequential change.
2. **Automate routine decisions.** Ask only when the answer changes the result
   and cannot be inferred safely.
3. **Describe outcomes, not activity.** Prefer `Created product brief` to
   `Processing step 4`.
4. **Make recovery local and specific.** Every actionable failure includes one
   next command or edit that moves the developer forward.
5. **Leave evidence.** End with a concise change summary and keep a manifest so
   a later run can distinguish generated, adopted, and user-owned files.

These rules are the CLI version of the engineering philosophy: inspect before
acting, make decisions visible, prefer reversible work, and verify the result.

## Primary journey

The default entry point is:

```sh
mstack init
```

It operates on the current repository. A path argument may target another
directory: `mstack init ./my-app`. The successful journey is:

```text
invoke -> inspect -> confirm plan -> apply -> verify -> explain next steps
```

### 1. Inspect

Inspection is read-only. It identifies the repository root, project maturity,
existing documentation, supported tools, conflicts, and missing prerequisites.
This phase should normally take less than a second. If it takes longer, show a
spinner with the label `Inspecting repository`.

Do not ask questions before inspection. Context should remove prompts, not
merely decorate them.

### 2. Confirm the plan

For a standard interactive run, show a compact plan and ask once:

```text
mstack 0.3.1

Install Misbah's Build Like This workflow in ~/code/acme

  Project     TypeScript · Next.js · existing repository
  Add         4 planning templates, contributor instructions
  Preserve    docs/product.md, docs/architecture.md

? Apply this setup? (Y/n)
```

Omit `Preserve` when there is nothing relevant to preserve. Use repository-
relative paths in ordinary output and an abbreviated home path for the target.
Never print the same plan as a sequence of separate confirmations.

`mstack init --dry-run` prints the complete plan, makes no changes, and exits
successfully when the plan is valid. `mstack init --yes` accepts safe defaults
and fails with guidance when a decision truly requires a person.

### 3. Apply

Show stable steps in place when the terminal supports it:

```text
  ✓ Inspected repository
  ✓ Added planning templates
  ✓ Configured contributor guidance
  ● Verifying setup
```

A step label describes the user-visible result. Avoid percentages unless the
total work is known and progress is meaningful. After two seconds, include
elapsed time. After ten seconds, add a brief reason such as `Waiting for package
metadata`; never leave an unchanged spinner indefinitely.

In CI, redirected output, `TERM=dumb`, or `NO_COLOR` environments, use one
newline-delimited event per completed step with no animation or ANSI control
codes.

### 4. Verify

Verification checks that expected files exist, required documents are
discoverable, generated content is readable, and any consumed subsystem
reported success. Do not print success before verification completes.

Warnings do not masquerade as success. A partial result ends with `Setup needs
attention`, the preserved work, and the exact remaining action.

### 5. Explain next steps

The success screen is a handoff, not a celebration banner:

```text
✓ mstack is ready

  Added       5 files
  Preserved   2 existing documents
  Manifest    .mstack/manifest.json

Next
  1. Define the product        docs/product.md
  2. Design the system         docs/architecture.md
  3. Review the repository     mstack explain

Details: mstack status
```

Only show next steps that apply to the resulting repository. If the product
document is already complete, do not tell the developer to create it. Keep the
default screen to three actions; link to `mstack status` for the full report.

## First-run onboarding

The first run may explain one concept that later runs omit:

```text
mstack installs Misbah's documentation-first workflow in this repository. It
previews changes, preserves existing work, and can be rerun safely.
```

Do not show a wizard, newsletter prompt, telemetry prompt, or release notes
before the developer receives value. If consent is required, ask at the moment
the relevant feature is first used and explain the consequence of each choice.

The default path should require at most one confirmation. Additional prompts
are permitted only for a real conflict, such as two existing documents that
could both be the product source of truth.

## Interactive prompts

Prompts use this pattern:

```text
? Existing docs/product.md differs from the mstack template.
  ● Keep it and add only missing files (recommended)
  ○ Show the difference
  ○ Replace it after creating a backup
```

Prompt requirements:

- Put the safest reversible choice first and mark it `recommended`.
- Explain the consequence before requesting input.
- Accept arrows and common shortcuts; support `Enter` for the visible default.
- Never make destructive behavior the default.
- Keep questions answerable without leaving the terminal.
- On `Ctrl-C`, stop cleanly and state whether anything changed.
- Detect non-interactive input before prompting and provide the needed flag.

## Repository walkthrough

`mstack explain` gives a short, context-aware tour after installation:

```text
Misbah's Build Like This workflow

  docs/product.md       Product intent and success criteria
  docs/architecture.md  System boundaries and contracts
  docs/features.md      Significant feature status
  docs/decisions/       Consequential technical decisions

Start with docs/product.md. It contains 7 unfinished placeholders.
Then run mstack status to check readiness.
```

The walkthrough reports what exists, not a hard-coded ideal tree. It calls out
the first incomplete document and uses terminology from the repository. A
developer can rerun it at any time; it never writes files.

## Status and diagnostics

`mstack status` answers “what did mstack install and what remains?” It is fast,
read-only, and project-oriented:

```text
mstack status

  Setup        complete
  Product      draft · 7 placeholders remaining
  Architecture not started
  Templates    current

Next: complete docs/product.md
```

`mstack doctor` answers “why is mstack not working?” It checks the environment,
configuration, permissions, manifest integrity, and the availability of systems
mstack consumes:

```text
mstack doctor

  ✓ CLI             0.3.1
  ✓ Runtime         Node.js 22.4.1
  ✓ Repository      ~/code/acme
  ✓ Permissions     writable
  ! Templates       Could not reach the configured template source

1 issue found
Fix: check the template source using `mstack config` and rerun `mstack doctor`.
```

Diagnostics must:

- finish with a non-zero exit only when an issue can prevent the requested
  workflow;
- redact tokens, credentials, user names, query strings, and sensitive path
  segments by default;
- support `mstack doctor --json` for automation and support tooling;
- include CLI version, operating system, runtime, repository state, relevant
  configuration sources, and stable check IDs;
- never upload a report without explicit confirmation.

`mstack validate` complements diagnostics with a repository quality gate. It
checks product and architecture readiness, manifest ownership, and AI runtime
drift. Exit code `4` means validation failed; `--strict` also treats warnings as
failures.

## Errors

Every error has four parts: what failed, why when known, what was preserved, and
the next action. Use a stable searchable code, but do not make the user decode
it.

```text
✗ Could not update docs/product.md

The file changed after mstack inspected it, so it was left untouched.
No other existing files were modified.

Try again after saving your editor changes:
  mstack init

Error: FILE_CHANGED (report: 01J2K7M4)
```

Copy standards:

- Say `Could not`, not `Oops`, `Something went wrong`, or `fatal error`.
- Name the affected resource and operation.
- Do not print a stack trace unless `--debug` is set.
- Do not blame the user (`invalid input` is better than `you entered`).
- Prefer one likely recovery action over a list of generic possibilities.
- Preserve the original cause in debug output and structured output.

### Error catalog

| Code | User-visible condition | Required recovery |
| --- | --- | --- |
| `NOT_A_REPOSITORY` | No supported project at the target | Show how to pass a path or initialize a repository |
| `PERMISSION_DENIED` | Required path is not writable | Name the path and least-privilege permission to change |
| `FILE_CONFLICT` | Safe ownership cannot be inferred | Offer keep, inspect difference, or backed-up replace |
| `FILE_CHANGED` | A file changed between inspection and write | Leave it untouched and rerun inspection |
| `MISSING_REQUIREMENT` | A required local tool or config is absent | Show the exact install/configure command |
| `DEPENDENCY_UNAVAILABLE` | A consumed system is temporarily unavailable | Preserve work and give a retry command |
| `VERIFY_FAILED` | Changes were applied but verification failed | Report completed work and repair or rollback command |
| `UNSUPPORTED_VERSION` | A detected tool is outside the supported range | Show detected and supported versions plus upgrade path |

Unknown failures use `UNEXPECTED` plus a report ID and a sanitized diagnostics
command. They still state whether files changed.

## Recovery and repeatability

`mstack init` is safe to rerun. It classifies each target as:

- **create** — absent and safe to add;
- **adopt** — existing content can be tracked without modification;
- **update** — previously generated content can be upgraded safely;
- **preserve** — user-owned content remains untouched;
- **conflict** — a person must choose.

Before replacing user-owned content, create a timestamped local backup and
print its path. If the process is interrupted, the next run detects the
incomplete operation and offers `Resume` as the default. Never call a partially
applied run “complete.”

If atomic rollback is supported by the underlying system, offer it explicitly:
`mstack undo <operation-id>`. Otherwise, do not promise rollback; enumerate the
files that are safe to remove and the files that must be reviewed.

## Future background update behavior

The shipped `mstack update` command performs an explicit registry check and
asks before changing the global installation. A future background notice, if
added, must follow this contract:

Check for updates asynchronously and never delay the requested command. Show at
most one notice every seven days, after the command result:

```text
Update available 0.3.0 → 0.3.1
Run `mstack update`
```

Security-critical notices may appear immediately but must still follow the main
result unless the installed version is unsafe to run. Respect offline mode,
package-manager ownership, prerelease channels, and disabled update checks.

## Output contract

Commands that expose structured reports support three presentation modes:

| Mode | Trigger | Contract |
| --- | --- | --- |
| Interactive | TTY | Color and in-place progress; prompts allowed |
| Plain | redirected output, `NO_COLOR`, or `--no-color` | Stable lines, no ANSI, no animation |
| Structured | `--json` | Versioned schema on stdout; human diagnostics on stderr |

Color reinforces meaning but never carries meaning alone. Symbols must have
text equivalents in plain and structured output. Respect terminal width; below
60 columns, stack labels and values rather than truncate important paths.

Stdout contains the requested result. Stderr contains warnings, progress that
is not part of the result, and diagnostics. Exit codes are stable and grouped:

| Code | Meaning |
| --- | --- |
| `0` | Completed or valid dry run |
| `1` | Unexpected or operational failure |
| `2` | Invalid command or input |
| `3` | Required decision unavailable in non-interactive mode |
| `4` | Repository validation failed |

## Installation experience

Official installation instructions begin with one preferred command:

```text
npm install -g @imisbahk/mstack
mstack init
```

The zero-install alternative is `npx @imisbahk/mstack@latest init`. mstack does
not modify shell profiles or global configuration during repository setup.

Uninstallation removes only mstack-owned global files. Repository artifacts
remain because they are user work; say so before uninstalling.

## Acceptance criteria

I consider the experience ready when automated transcript tests and manual usability
checks demonstrate that:

- a new developer completes the standard setup with one command and no more
  than one confirmation;
- a successful run names every category of change and gives a relevant first
  next step;
- an existing product or architecture document is never overwritten by
  default;
- rerunning setup produces no unintended change;
- interruption at every write boundary is recoverable;
- every cataloged failure names a next action and whether work was preserved;
- redirected and `NO_COLOR` output contain no ANSI control sequences;
- JSON output remains parseable on success, warning, and failure paths;
- diagnostics contain no seeded secret values in redaction tests;
- update checks do not add perceptible latency to the primary command.

Measure time to first successful setup, prompt count, setup completion rate,
recovery success rate, repeated-run change rate, and diagnostic resolution
rate. Treat confusion as a product defect even when the underlying operation
technically succeeds.
