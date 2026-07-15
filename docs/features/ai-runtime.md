# Feature: AI workspace runtime

> Status: Released
> Owner: AI Runtime
> Last updated: 2026-07-16
> Product need: Install a safe, production-quality AI development workspace into an existing repository

## Summary

Developers need one coherent engineering workflow across the AI coding tools they already use. The AI workspace runtime provides a versioned catalog and a capability-aware installation lifecycle without inventing unsupported platform features or taking ownership of user files.

## Scope

### Included

- Project-local instructions, rules, prompts, skills, agents, hooks, context, templates, MCP declarations, and permission recommendations.
- Claude Code, Codex CLI, Cursor, Gemini CLI, Continue, and Aider adapters.
- Read-only inspection, deterministic planning, explicit approvals, recoverable application, reconciliation, and verification.
- Manifest-backed ownership for safe upgrades and removal.

### Not included

- CLI arguments, terminal prompts, or command output.
- Model inference, provider SDKs, hosted agents, or an agent execution loop.
- User-level configuration, credentials, or implicit repository trust.
- Unsupported cross-platform feature parity.

## Primary flow

1. A caller selects runtime resources and target platforms.
2. The runtime validates the specification and inspects the repository without writing.
3. Adapters render only verified capabilities and report degradation or omission.
4. The planner compares desired resources, current files, and prior ownership.
5. The caller resolves required approvals for conflicts and privileged resources.
6. The runtime applies approved operations with stale-file checks, backups, and an operation journal.
7. Verification checks the installed state and a second plan confirms convergence.

## Resource and capability contract

Every resource has a stable ID, version, feature, activation mode, security class, and fallback policy. Adapters declare native, emulated, experimental, or unsupported capabilities with limitations and optional platform-version constraints.

Unsupported resources are skipped with diagnostics. Emulation is allowed only when the resource permits semantic degradation. Experimental resources require explicit activation.

Hooks, executable assets, MCP endpoints, trust changes, and permission broadening are privileged. They are never activated by a safe default and require a decision specific to that resource and path.

## Lifecycle states

| State | Meaning | Safe behavior |
| --- | --- | --- |
| Create | Target does not exist | Create after plan approval |
| Adopt | Existing content exactly matches desired managed content | Record ownership without rewriting |
| Update | Previously owned content is unchanged since installation | Reconcile owned content |
| Preserve | Existing user-owned content needs no managed edit | Leave untouched |
| Conflict | Ownership is absent, ambiguous, malformed, or drifted | Require a specific decision |
| Delete | Prior owned resource is no longer desired | Remove only unchanged owned state |
| Unchanged | Installed state already matches | Perform no write |

## Ownership and recovery

`.mstack/runtime/manifest.json` records resource identity, adapter, path, merge strategy, and installed hashes. It contains no secrets, credentials, absolute paths, or user content.

Whole files are deleted only when the manifest owns them and their current hash matches the installed hash. Shared files remove only the owned block or structured entry. User-modified managed content is preserved as drift.

Before an approved destructive edit, the runtime stores a repository-local backup and operation journal. The manifest is written last. On interruption, the runtime resumes or reports exact recovery steps; it does not claim universal rollback when safe restoration cannot be proven.

## Security and privacy

- Reject absolute paths, traversal, symlink escapes, and non-regular targets.
- Re-read targets before mutation and fail when content changed after inspection.
- Preserve restrictive trust, sandbox, approval, and permission settings.
- Store no credentials or secret-bearing MCP configuration.
- Require HTTPS for remote MCP endpoints unless localhost is explicitly approved.
- Keep curated hooks bounded, dependency-free, and disabled until approved.

## Acceptance criteria

- [x] The public package API supports create, inspect, plan, approve, apply, verify, upgrade, and remove without CLI coupling.
- [x] Planning is read-only and classifies create, adopt, update, preserve, conflict, delete, and unchanged operations.
- [x] Existing unmanaged files are not replaced or deleted without explicit approval and a backup.
- [x] Privileged resources require resource-specific activation.
- [x] A target changed after inspection fails untouched.
- [x] Rerunning an unchanged installation produces no writes.
- [x] Upgrades and platform deselection remove only unchanged manifest-owned state.
- [x] User-modified managed state is preserved and reported as drift.
- [x] Filesystem safety and interrupted-operation recovery are tested.
- [x] All six adapters have supported and degraded behavior tests.
- [x] A clean package build imports successfully through its published export.

## Test plan

- **Unit:** schemas, capabilities, ownership, merges, approvals, hashes, and path safety.
- **Integration:** inspect-plan-apply-verify, rerun, upgrade, drift, removal, and interrupted writes in temporary repositories.
- **Contract:** golden output and diagnostics for each platform capability profile.
- **Distribution:** clean build, package archive inspection, and import from a temporary consumer.

## Rollout and recovery

The runtime ships as a library boundary before CLI integration. New platform capabilities remain disabled until official behavior is captured in fixtures. A failed application retains its journal and backups; a prior manifest remains authoritative until verification succeeds.
