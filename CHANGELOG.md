# Changelog

All notable changes to mstack are documented here. This project follows [Semantic Versioning](https://semver.org/).

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
- Aligned status terminology, installation instructions, runtime counts, and command documentation with shipped behavior.

### Security

- Privileged hooks, executable changes, network resources, trust changes, and policy changes now require recorded operation-specific approval.
- Runtime manifests exclude secrets, absolute paths, and user content; generated hooks remain local, deterministic, bounded, and reviewable.

[0.3.0]: https://github.com/IMisbahk/mstack/compare/c54a28b...mstack-v0.3.0
