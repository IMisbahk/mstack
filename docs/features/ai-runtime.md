# Feature: AI workspace runtime

> Status: Released
> Owner: AI Runtime
> Last updated: 2026-07-18
> Product need: Install a safe, production-quality AI development workspace into an existing repository

## Summary

Developers need one coherent engineering workflow across the AI coding tools they already use. The AI workspace runtime provides a versioned catalog and a capability-aware installation lifecycle without inventing unsupported platform features or taking ownership of user files.

## Scope

### Included

- Project-local instructions, rules, prompts, skills, agents, hooks, context, templates, MCP declarations, and permission recommendations.
- A complete ten-phase Build Like This catalog from idea validation through continuous improvement.
- Explicit host-project identity and source-of-truth routing for repositories with complete, draft, or missing product context.
- Phase-gated multi-agent handoffs with native parallel delegation where the selected runtime supports subagents.
- Claude Code, Codex CLI, Cursor, Gemini CLI, Continue, Aider, Antigravity,
  Kimi Code, GitHub Copilot, OpenCode, Kiro, Qwen Code, Junie, Cline, and Roo
  Code adapters.
- Read-only inspection, deterministic planning, explicit approvals, recoverable application, reconciliation, and verification.
- Manifest-backed ownership for safe upgrades and removal.

### Not included

- New CLI commands or arguments; existing onboarding copy may guide users through the separate initialization and AI runtime setup commands.
- Model inference, provider SDKs, hosted agents, or an agent execution loop.
- User-level configuration, credentials, or implicit repository trust.
- Unsupported cross-platform feature parity.
- A hosted orchestration loop or permission for mstack to contact users, deploy, or mutate external systems.

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

## Cross-runtime compatibility contract

The runtime reuses interoperable project surfaces only when current platform
documentation verifies the same semantics. `AGENTS.md` and Open Agent Skills
under `.agents/skills/` are rendered byte-for-byte once and co-owned by every
selected adapter that consumes them. Tools that require their own skill,
command, agent, rule, hook, or MCP paths receive real provider-specific files;
the installer never creates compatibility symlinks.

Reading Claude files does not grant a tool Claude's capabilities. An adapter
may reuse verified instruction or skill content without inheriting Claude
hooks, MCP settings, permissions, or trust changes. Missing project-local
surfaces are omitted with diagnostics, or represented as explicit persona
skills only where semantic degradation is allowed.

Configured-state detection uses the mstack manifest plus provider-unique
markers. Shared files such as `AGENTS.md`, `.agents/`, and `.claude/` never
identify a provider by themselves. GUI-only environments remain explicitly
selectable without a fabricated executable detector.

When several adapters contribute one shared artifact, reconciliation records
all sorted adapter and capability-profile contributors. Selection order must
not change the desired artifact, its ownership, or its removal behavior.

## Host-project and lifecycle contract

The repository receiving the runtime is the project being built. Build Like This is the engineering method and mstack is its installer; neither becomes the product unless the project-owned documentation explicitly says so. The runtime routes agents to `docs/product.md`, `docs/architecture.md`, feature specifications, ADRs, code, and tests as the relevant sources of truth. Files under `.mstack/templates/` are reference scaffolds to adapt into project-owned documents, not specifications or requirements.

When product context is missing or still contains template placeholders, agents must treat the idea, users, and needs as unknown. They begin with discovery, preserve sourced findings under `docs/research/`, label assumptions, and avoid architecture or implementation until the product gate is satisfied.

Each phase has a dedicated skill, end-to-end prompt, decision lead, and bounded supporting lanes:

| Phase | Skill | Prompt | Decision lead |
| --- | --- | --- | --- |
| Idea | `idea-validation` | `research-idea` | Product Manager |
| Target users | `target-user-definition` | `identify-target-users` | Product Manager |
| User needs | `user-needs-research` | `research-user-needs` | User Researcher |
| Feature design | `feature-design` | `design-features` | Product Manager |
| Product definition | `product-definition` | `write-product-definition` | Product Manager |
| Architecture | `architecture-design` | `design-architecture` | Software Architect |
| Backend | `backend-delivery` | `build-backend` | Backend Engineer |
| Frontend | `frontend-delivery` | `build-frontend` | Frontend Engineer |
| Deployment | `deployment-delivery` | `deploy-product` | Release Manager |
| Continuous improvement | `continuous-improvement` | `improve-product` | Product Manager |

Every material lifecycle invocation delegates at least one bounded lane. Independent research, design, implementation, or review lanes run concurrently when the runtime supports native subagents. Shared contracts, project documents, migrations, production changes, and overlapping files have one owner and remain serialized. Supporting agents do not recursively delegate unless the active lead explicitly promotes them to a coordination role.

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

Before an approved destructive edit, the runtime stores a repository-local backup and operation journal. The manifest is written last. On interruption, the runtime resumes or reports exact recovery steps; it does not claim universal rollback when safe restoration cannot be proven. A managed `.mstack/runtime/.gitignore` keeps local backups, operation journals, and staging data out of Git while leaving the runtime manifest and installed hooks trackable.

## Security and privacy

- Reject absolute paths, traversal, symlink escapes, and non-regular targets.
- Re-read targets before mutation and fail when content changed after inspection.
- Preserve restrictive trust, sandbox, approval, and permission settings.
- Store no credentials or secret-bearing MCP configuration.
- Require HTTPS for remote MCP endpoints unless localhost is explicitly approved.
- Keep curated hooks bounded, dependency-free, advisory, and disabled until approved. They warn on repository-readiness gaps, dependency or commit discipline, destructive or external actions, secret-bearing paths, and incomplete verification evidence.

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
- [x] All fifteen adapters have supported and degraded behavior tests.
- [x] Shared `AGENTS.md` and Open Agent Skills retain every adapter and profile
  contributor independent of selection order.
- [x] Shared compatibility paths do not cause unrelated runtimes to be
  auto-selected or reported as configured.
- [x] Content-compatible adapters do not inherit unverified Claude hooks, MCP,
  permissions, or settings.
- [x] Hook scripts are syntax-checked and behavior-tested as advisory checks, including repeated changes to the same dirty paths.
- [x] A clean package build imports successfully through its published export.
- [x] Generated guidance distinguishes the host project, Build Like This method, mstack installer, project-owned documentation, and reference-only templates.
- [x] Every lifecycle phase has an installed skill, prompt, decision lead, and safe parallel handoff.
- [x] Draft or idea-less repositories route to discovery without fabricating product evidence.
- [x] Native subagent runtimes delegate bounded work while non-native runtimes disclose a sequential persona fallback.
- [x] Aider loads a compact resource index instead of the full expanded catalog on every request.

## Test plan

- **Unit:** schemas, capabilities, ownership, merges, approvals, hashes, and path safety.
- **Integration:** inspect-plan-apply-verify, rerun, upgrade, drift, removal, and interrupted writes in temporary repositories.
- **Contract:** golden output and diagnostics for each platform capability profile.
- **Lifecycle:** phase coverage, unique IDs, delegation depth, handoff ownership, and research/deployment authorization boundaries.
- **Onboarding:** configured project-name propagation plus draft/no-idea routing through init, AI setup, status, and explain.
- **Distribution:** clean build, package archive inspection, and import from a temporary consumer.

## Rollout and recovery

The runtime ships as a library boundary before CLI integration. New platform capabilities remain disabled until official behavior is captured in fixtures. A failed application retains its journal and backups; a prior manifest remains authoritative until verification succeeds.
