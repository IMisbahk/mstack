# Changelog

All notable changes to mstack are documented here. This project follows [Semantic Versioning](https://semver.org/).

## Unreleased

### Added

- Add a risk-review hook for destructive commands, external writes,
  deployments, and secret-bearing paths.
- Add verified adapters for Google Antigravity, Kimi Code, GitHub Copilot,
  OpenCode, Kiro, Qwen Code, Junie, Cline, and Roo Code.
- Add native provider paths where required and portable persona-skill fallbacks
  where a provider has no stable auto-discovered project-agent format.

### Changed

- Strengthen repository-health, change-discipline, and feature-completeness
  hooks with bounded input, higher-signal checks, robust Git path parsing, and
  content-aware repeat detection.
- Validate installed AI runtime integrity in CI and remove the obsolete Codex
  `hooks.json` configuration superseded by `.codex/config.toml`.
- Derive configured runtime state from provider-unique markers and the mstack
  manifest so shared `AGENTS.md` and `.agents/skills/` files do not cause false
  detection.
- Record every sorted adapter and capability profile that co-owns a shared
  artifact, independent of runtime selection order.
- Allow explicitly selected editor integrations without inventing a CLI
  executable detector.

## [0.4.0] - 2026-07-16

### Added

- Add a complete ten-phase Build Like This lifecycle from idea validation through continuous improvement, with one reusable skill and full-task prompt per phase.
- Add seven specialist roles for workflow coordination, product and user research, product design, testing, analysis, and release management.
- Add discovery and experiment reference templates plus phase-gated delegation rules for parallel work with a single integration owner.

### Changed

- Identify the receiving repository as the host project across every adapter; treat Build Like This as the method, mstack as the installer, project documentation as authoritative, and `.mstack/templates/` as reference-only.
- Route incomplete products through evidence gathering and product definition before architecture, while allowing contract-safe backend and frontend overlap.
- Keep Aider's expanded catalog on demand behind a compact index and disclose its sequential persona fallback.
- Separate repository initialization from AI runtime setup throughout onboarding, CLI output, documentation, and the website.

### Fixed

- Preserve privileged approvals across no-op reconciliation, repair legacy missing approval records, retain previously configured runtimes, and remove deleted paths from the top-level manifest.
- Upgrade unchanged Aider configuration safely and migrate legacy unnamed Claude and Cursor hooks without duplicate execution or loss of user-owned hooks.
- Keep local runtime backups, operation journals, and staging data out of Git while retaining trackable manifests and hooks.

## [0.3.1] - 2026-07-16

### Fixed

- Render Codex lifecycle hooks with the current event-keyed `[hooks]` schema, nested command definitions, and supported `timeout` field.
- Stop emitting the unsupported `type` field for Codex MCP server configuration.
- Verify generated Codex configuration with the installed Codex CLI when it is available during the test run.

### Migration

- `0.3.0` users who configured Codex should upgrade and rerun `mstack ai setup codex` to replace the invalid `.codex/config.toml` hook configuration.

## [0.3.0] - 2026-07-16

### Added

- Manifest-backed inspection, reconciliation, resource-specific approvals, drift detection, safe backups, interrupted-operation recovery, and verification for the existing six-environment AI workspace runtime.
- `mstack catalog [kind]` for source-backed discovery of agents, skills, prompts, hooks, and templates.
- `mstack validate [directory]` with versioned JSON, strict CI mode, runtime integrity findings, recovery guidance, and exit code `4` on validation failure.

### Changed

- Repositioned mstack as the Build Like This AI engineering platform and rebuilt the package README around capabilities, workflows, commands, and current statistics.
- Improved initialization, onboarding, status, diagnostics, AI setup approvals, terminal summaries, and command help.
- Expanded package metadata and release verification across Node.js 20, 22, and 24 on Linux, macOS, and Windows.
- Made `mstack doctor` return a failing exit code only for blocking environment issues.

### Fixed

- Preserved unmanaged and drifted files unless the exact operation is approved.
- Prevented stale-file writes, symlink escapes, unsafe paths, malformed ownership manifests, and accidental deletion of user-modified managed state.
- Corrected scoped-package release scripts, workspace filters, npm tarball detection, generated command documentation, and launcher verification.
- Normalized repository-relative paths to forward slashes on Windows for stable manifests, JSON, and terminal output.
- Made runtime test discovery portable across the supported Node.js 20, 22, and 24 release matrix.
- Preserved explicit executable-mode intent in manifests while avoiding false mode-drift failures on Windows filesystems.
- Made managed instruction blocks heading-safe when merged into existing repository guidance.
- Aligned status terminology, installation instructions, runtime counts, and command documentation with shipped behavior.

### Security

- Privileged hooks, executable changes, network resources, trust changes, and policy changes now require recorded operation-specific approval.
- Runtime manifests exclude secrets, absolute paths, and user content; generated hooks remain local, deterministic, bounded, and reviewable.

[0.4.0]: https://github.com/IMisbahk/mstack/compare/mstack-v0.3.1...mstack-v0.4.0
[0.3.1]: https://github.com/IMisbahk/mstack/compare/mstack-v0.3.0...mstack-v0.3.1
[0.3.0]: https://github.com/IMisbahk/mstack/compare/c54a28b...mstack-v0.3.0
