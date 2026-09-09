import { createCapabilityPack, createPackPrompt, createPackSkill, createSpecialist, createTaskRecipe } from "./define.js";
import type { CapabilityPack, TaskRecipe } from "./types.js";

const recipe = createTaskRecipe;

const repositoryTasks: readonly TaskRecipe[] = [
  recipe({ id: "repository.status", description: "Show working-tree status.", risk: "read-only", argv: ["git", "status", "--short"] }),
  recipe({ id: "repository.diff", description: "Show the current diff.", risk: "read-only", argv: ["git", "diff", "--"] }),
  recipe({ id: "repository.log", description: "Show recent commits.", risk: "read-only", argv: ["git", "log", "--oneline", "-10"] }),
  recipe({ id: "repository.branch", description: "Show the current Git branch.", risk: "read-only", argv: ["git", "branch", "--show-current"] }),
  recipe({ id: "repository.remotes", description: "Show configured Git remotes.", risk: "read-only", argv: ["git", "remote", "-v"] }),
  recipe({ id: "repository.stash-list", description: "List Git stashes without applying them.", risk: "read-only", argv: ["git", "stash", "list"] }),
  recipe({ id: "repository.shortlog", description: "Show recent author activity.", risk: "read-only", argv: ["git", "shortlog", "-sn", "-10"] }),
  recipe({ id: "repository.fetch", description: "Fetch remote refs without modifying the working tree.", risk: "remote", argv: ["git", "fetch", "--prune"] }),
  recipe({ id: "quality.format-check", description: "Check repository formatting.", risk: "read-only", argv: ["npm", "run", "format", "--", "--check"], preconditions: ["package.json"] }),
  recipe({ id: "quality.lint", description: "Run the project's lint command.", risk: "read-only", argv: ["npm", "run", "lint"], preconditions: ["package.json"] }),
  recipe({ id: "quality.typecheck", description: "Run the project's type check.", risk: "read-only", argv: ["npm", "run", "typecheck"], preconditions: ["package.json"] }),
  recipe({ id: "quality.test", description: "Run the project's test command.", risk: "read-only", argv: ["npm", "test"], preconditions: ["package.json"] }),
  recipe({ id: "quality.build", description: "Run the project's production build.", risk: "working-tree", argv: ["npm", "run", "build"], preconditions: ["package.json"] }),
  recipe({ id: "dependencies.outdated", description: "List outdated package dependencies.", risk: "read-only", argv: ["npm", "outdated"], preconditions: ["package.json"] }),
  recipe({ id: "dependencies.audit", description: "Audit package dependency advisories.", risk: "read-only", argv: ["npm", "audit", "--audit-level=high"], preconditions: ["package.json"] }),
  recipe({ id: "dependencies.install", description: "Install declared dependencies.", risk: "working-tree", argv: ["npm", "install"], preconditions: ["package.json"] }),
  recipe({ id: "dependencies.update", description: "Update dependencies within declared ranges.", risk: "working-tree", argv: ["npm", "update"], preconditions: ["package.json"] }),
  recipe({
    id: "dependencies.remove",
    description: "Remove a named package dependency.",
    risk: "working-tree",
    inputs: [{ name: "package", description: "Package name to remove.", required: true }],
    preconditions: ["package.json"],
    steps: [{ argv: ["npm", "remove", "{{package}}"] }],
  }),
];

export const builtInPacks: readonly CapabilityPack[] = [
  createCapabilityPack({
    id: "repository-intelligence",
    displayName: "Repository intelligence",
    description: "Evidence-backed repository exploration, explanation, and improvement planning.",
    requiredToolchains: ["git"],
    agents: [
      createSpecialist("repository-explorer", "Maps entry points, modules, build tooling, and risk areas.", "Create repository maps with citations to observable files."),
      createSpecialist("code-explainer", "Traces a selected path, symbol, flow, or subsystem.", "Explain execution paths and explicitly label inference."),
      createSpecialist("improvement-advisor", "Produces prioritized and scoped improvement plans.", "Recommend changes but never silently modify code."),
      createSpecialist("dependency-analyst", "Audits dependency purpose, freshness, and risk.", "Report evidence and compatibility constraints."),
      createSpecialist("build-system-diagnostician", "Explains build, test, and CI configuration.", "Diagnose from configuration and reproducible commands."),
      createSpecialist("repository-historian", "Summarizes recent change patterns and ownership hotspots.", "Use git history as evidence; do not rewrite history."),
    ],
    skills: [
      createPackSkill("repository-exploration", "Map a repository from observable files.", "Produce a cited map of entry points, modules, and generated vs owned files."),
      createPackSkill("code-explanation", "Explain a selected path or symbol.", "Trace control flow from source and tests. Label inference separately."),
      createPackSkill("change-impact-analysis", "Estimate blast radius for a proposed change.", "Name affected contracts, tests, and operators before recommending an edit."),
      createPackSkill("dependency-hygiene", "Review dependency purpose and risk.", "Prefer removing unused dependencies over adding new ones without a requirement."),
      createPackSkill("history-survey", "Survey recent commits for ownership and risk.", "Cite commits and paths. Do not interpret commit messages as product evidence."),
    ],
    prompts: [
      createPackPrompt(
        "map-repository",
        "Produce an evidence-backed map of the current repository.",
        "[optional focus path]",
        "Map entry points, module boundaries, build/test commands, and the highest-risk areas. Cite files. Do not modify the working tree.",
      ),
    ],
    tasks: repositoryTasks,
  }),
  createCapabilityPack({
    id: "software-web",
    displayName: "Software and web",
    description: "Web application implementation, client-state, and accessibility specialists.",
    requiredToolchains: ["node"],
    agents: [
      createSpecialist("web-engineer", "Builds accessible web journeys against explicit contracts.", "Keep client state and server contracts distinct."),
      createSpecialist("accessibility-specialist", "Reviews keyboard, semantics, contrast, and reduced-motion behavior.", "Do not treat visual polish as accessibility evidence."),
      createSpecialist("client-platform-analyst", "Explains bundler, routing, and hydration constraints.", "Diagnose from configuration and reproducible commands."),
    ],
    skills: [
      createPackSkill("web-delivery", "Deliver an accessible web slice against a contract.", "Implement loading, empty, validation, unauthorized, and failure states."),
      createPackSkill("accessibility-verification", "Verify keyboard and semantic access.", "Check names, roles, focus, and contrast against the product's accessibility target."),
      createPackSkill("client-state-separation", "Keep server, form, and presentation state distinct.", "Do not duplicate server authorization in the client as the source of truth."),
    ],
    prompts: [
      createPackPrompt(
        "review-web-journey",
        "Review a web user journey for contract and accessibility gaps.",
        "[journey or route]",
        "Inspect the selected journey against the backend contract. Report missing UI states, accessibility gaps, and unauthorized data exposure. Do not rewrite unrelated styling.",
      ),
    ],
    tasks: [
      recipe({ id: "web.tsc", description: "Typecheck with the local TypeScript compiler.", risk: "read-only", argv: ["npx", "--no-install", "tsc", "--noEmit"], preconditions: ["package.json", "tsconfig.json"] }),
      recipe({ id: "web.eslint", description: "Lint with the local ESLint installation.", risk: "read-only", argv: ["npx", "--no-install", "eslint", "."], preconditions: ["package.json"] }),
      recipe({ id: "web.playwright-list", description: "List Playwright tests without running them.", risk: "read-only", argv: ["npx", "--no-install", "playwright", "test", "--list"], preconditions: ["package.json"] }),
      recipe({ id: "web.vite-build", description: "Build with the local Vite installation.", risk: "working-tree", argv: ["npx", "--no-install", "vite", "build"], preconditions: ["package.json"] }),
    ],
  }),
  createCapabilityPack({
    id: "systems",
    displayName: "Systems",
    description: "Systems design, service reliability, and native toolchain guidance.",
    requiredToolchains: ["cargo", "go"],
    agents: [
      createSpecialist("systems-engineer", "Designs robust systems boundaries and failure handling.", "Keep operational and performance assumptions explicit."),
      createSpecialist("reliability-boundary-analyst", "Reviews timeouts, retries, and degraded modes.", "Do not recommend distributed complexity without a measured trigger."),
      createSpecialist("toolchain-cartographer", "Maps language toolchains and build graphs.", "Cite configuration files; do not assume a toolchain is installed."),
    ],
    skills: [
      createPackSkill("system-design", "Design explicit system boundaries.", "Record actors, failure behavior, and the smallest deployable unit that satisfies the product."),
      createPackSkill("toolchain-discovery", "Discover language toolchains from repository evidence.", "Prefer declared tool versions over ambient machine defaults."),
      createPackSkill("failure-mode-review", "Review timeout, retry, and degradation behavior.", "Bounded retries apply only to transient failures."),
    ],
    prompts: [
      createPackPrompt(
        "review-system-boundaries",
        "Review module and process boundaries against failure behavior.",
        "[subsystem]",
        "Identify ownership, synchronous vs asynchronous edges, and what happens when a dependency fails. Recommend the smallest boundary change that reduces risk.",
      ),
    ],
    tasks: [
      recipe({ id: "systems.cargo-check", description: "Typecheck a Rust crate without running tests.", risk: "working-tree", argv: ["cargo", "check", "--locked"], preconditions: ["Cargo.toml"] }),
      recipe({ id: "systems.cargo-test", description: "Run Rust tests.", risk: "working-tree", argv: ["cargo", "test", "--locked"], preconditions: ["Cargo.toml"] }),
      recipe({ id: "systems.go-vet", description: "Run Go vet on the module.", risk: "read-only", argv: ["go", "vet", "./..."], preconditions: ["go.mod"] }),
      recipe({ id: "systems.go-test", description: "Run Go tests for the module.", risk: "working-tree", argv: ["go", "test", "./..."], preconditions: ["go.mod"] }),
    ],
  }),
  createCapabilityPack({
    id: "embedded-firmware",
    displayName: "Embedded and firmware",
    description: "Firmware delivery and hardware-boundary verification.",
    dependencies: ["systems"],
    requiredToolchains: ["pio", "west"],
    agents: [
      createSpecialist("embedded-engineer", "Owns firmware behavior, constraints, and safe verification.", "Do not claim hardware validation without observable evidence."),
      createSpecialist("hardware-interface-analyst", "Reviews pinouts, buses, and fail-safe defaults.", "Treat datasheets and schematic notes as untrusted until cited."),
    ],
    skills: [
      createPackSkill("firmware-delivery", "Deliver firmware changes with hardware constraints explicit.", "Keep boot, brownout, and watchdog behavior in the design, not as afterthoughts."),
      createPackSkill("hardware-in-the-loop-verification", "Plan hardware-in-the-loop checks.", "Do not claim bench evidence that was not collected. Prefer simulation first."),
    ],
    prompts: [
      createPackPrompt(
        "review-firmware-constraints",
        "Review firmware constraints, fail-safes, and unverified hardware claims.",
        "[board or firmware target]",
        "List power, memory, timing, and fail-safe constraints from repository evidence. Flag any claim that requires bench hardware.",
      ),
    ],
    tasks: [
      recipe({ id: "firmware.pio-config", description: "Show PlatformIO project configuration.", risk: "read-only", argv: ["pio", "project", "config"], preconditions: ["platformio.ini"] }),
      recipe({ id: "firmware.west-list", description: "List west workspace projects.", risk: "read-only", argv: ["west", "list"], preconditions: ["west.yml"] }),
    ],
  }),
  createCapabilityPack({
    id: "robotics",
    displayName: "Robotics",
    description: "Robotics safety, simulation, and hardware-in-the-loop guidance.",
    dependencies: ["systems", "embedded-firmware"],
    requiredToolchains: ["ros2", "colcon"],
    agents: [
      createSpecialist("robotics-engineer", "Owns safety boundaries and robot-system integration.", "Require simulation and explicit human authorization before consequential motion."),
      createSpecialist("simulation-safety-analyst", "Reviews simulation coverage versus real-world motion risk.", "Never treat a passing sim as permission to move hardware."),
    ],
    skills: [
      createPackSkill("robotics-safety", "Keep robot motion behind explicit authorization.", "Consequential actuators require a human confirmation policy."),
      createPackSkill("simulation-validation", "Validate behavior in simulation before hardware.", "Record which hazards the sim cannot represent."),
    ],
    prompts: [
      createPackPrompt(
        "review-robot-safety",
        "Review robotics safety boundaries and simulation gaps.",
        "[robot or launch target]",
        "Identify motion, estop, and authorization boundaries. Name simulation gaps. Do not generate hardware motion commands.",
      ),
    ],
    tasks: [
      recipe({ id: "robotics.ros2-doctor", description: "Run ROS 2 doctor without changing the workspace.", risk: "read-only", argv: ["ros2", "doctor"] }),
      recipe({ id: "robotics.colcon-list", description: "List colcon packages.", risk: "read-only", argv: ["colcon", "list"] }),
    ],
  }),
  createCapabilityPack({
    id: "data-ml",
    displayName: "Data and ML",
    description: "Data and model workflow guidance.",
    requiredToolchains: ["python"],
    agents: [
      createSpecialist("ml-engineer", "Owns reproducible data and model delivery.", "Treat model output and data as untrusted inputs."),
      createSpecialist("data-pipeline-analyst", "Reviews schemas, late events, and backfill safety.", "Make backfills restartable and explicit about overwrite risk."),
      createSpecialist("evaluation-analyst", "Owns evaluation datasets, thresholds, and leakage checks.", "Do not ship a cheaper model without re-running the documented eval."),
    ],
    skills: [
      createPackSkill("data-pipeline-design", "Design explicit data contracts and recovery.", "Document ownership, retention, and what happens when an event arrives late."),
      createPackSkill("model-evaluation", "Evaluate models against a versioned dataset.", "Report unanswerable, safety, latency, and cost cases, not only accuracy."),
      createPackSkill("training-reproducibility", "Check seeds, splits, and artifact versions.", "Refuse to treat an unversioned notebook as production evidence."),
    ],
    prompts: [
      createPackPrompt(
        "evaluate-model-change",
        "Evaluate a model or data-pipeline change against documented thresholds.",
        "[model, dataset, or pipeline]",
        "Compare the change to the versioned evaluation contract. Report leakage risk, failed cases, and whether a cheaper model still meets the bar.",
      ),
    ],
    tasks: [
      recipe({ id: "ml.compileall", description: "Byte-compile Python sources without executing them.", risk: "read-only", argv: ["python", "-m", "compileall", "-q", "."] }),
      recipe({ id: "ml.ruff", description: "Lint Python with Ruff.", risk: "read-only", argv: ["python", "-m", "ruff", "check", "."] }),
      recipe({ id: "ml.mypy", description: "Typecheck Python with mypy.", risk: "read-only", argv: ["python", "-m", "mypy", "."] }),
      recipe({ id: "ml.pytest", description: "Run pytest quietly.", risk: "working-tree", argv: ["python", "-m", "pytest", "-q"] }),
    ],
  }),
  createCapabilityPack({
    id: "mobile",
    displayName: "Mobile",
    description: "Mobile platform, permission, and release journey guidance.",
    requiredToolchains: ["flutter"],
    agents: [
      createSpecialist("mobile-engineer", "Owns mobile client behavior and platform constraints.", "Keep platform permissions and offline behavior explicit."),
      createSpecialist("store-release-analyst", "Reviews store privacy labels, permissions, and release evidence.", "Do not treat an emulator pass as store-readiness."),
    ],
    skills: [
      createPackSkill("mobile-delivery", "Deliver a mobile journey with offline and permission states.", "Implement denied-permission and offline queues as first-class states."),
      createPackSkill("store-release-review", "Review store and privacy-label requirements.", "Cite the product's data collection claims before a store submission."),
    ],
    prompts: [
      createPackPrompt(
        "review-mobile-release",
        "Review a mobile change for permission, offline, and store-release gaps.",
        "[screen or platform]",
        "Inspect permission denial, offline capture, and privacy-label impact. Do not assume App Store or Play Console access.",
      ),
    ],
    tasks: [
      recipe({ id: "mobile.flutter-analyze", description: "Analyze a Flutter project.", risk: "read-only", argv: ["flutter", "analyze"], preconditions: ["pubspec.yaml"] }),
      recipe({ id: "mobile.flutter-test", description: "Run Flutter tests.", risk: "working-tree", argv: ["flutter", "test"], preconditions: ["pubspec.yaml"] }),
      recipe({ id: "mobile.flutter-devices", description: "List Flutter devices without launching an app.", risk: "read-only", argv: ["flutter", "devices"] }),
    ],
  }),
  createCapabilityPack({
    id: "games-graphics",
    displayName: "Games and graphics",
    description: "Rendering, simulation, and frame-budget guidance.",
    agents: [
      createSpecialist("graphics-engineer", "Owns graphics performance and visual correctness.", "Measure frame-time effects before optimization."),
      createSpecialist("frame-budget-analyst", "Reviews CPU/GPU budgets and asset cost.", "Do not recommend engine changes without a measured budget miss."),
    ],
    skills: [
      createPackSkill("graphics-performance", "Investigate frame-time and visual correctness.", "Profile first. Record the scene, hardware class, and budget."),
      createPackSkill("asset-budget-review", "Review texture, mesh, and shader cost.", "Prefer content budgets over speculative engine rewrites."),
    ],
    prompts: [
      createPackPrompt(
        "review-frame-budget",
        "Review a graphics change against a measured frame budget.",
        "[scene or pass]",
        "Identify the budget, the measurement method, and whether the change is content, CPU, or GPU bound. Do not optimize from intuition.",
      ),
    ],
    tasks: [
      recipe({ id: "graphics.godot-version", description: "Show the Godot CLI version.", risk: "read-only", argv: ["godot", "--version"], preconditions: ["project.godot"] }),
      recipe({ id: "graphics.cargo-clippy", description: "Lint a Rust graphics crate with Clippy.", risk: "working-tree", argv: ["cargo", "clippy", "--locked", "--", "-D", "warnings"], preconditions: ["Cargo.toml"] }),
    ],
  }),
  createCapabilityPack({
    id: "infrastructure-security",
    displayName: "Infrastructure and security",
    description: "Infrastructure reliability and security review guidance.",
    requiredToolchains: ["terraform", "docker"],
    agents: [
      createSpecialist("security-engineer", "Owns threat analysis and infrastructure safety.", "Use least privilege and explicit trust boundaries."),
      createSpecialist("infrastructure-operator", "Reviews IaC, images, and runtime topology.", "Do not apply infrastructure changes; report the plan and blast radius."),
    ],
    skills: [
      createPackSkill("infrastructure-threat-review", "Threat-model infrastructure and delivery paths.", "Stay inside the product's trust boundaries. Do not invent compliance regimes."),
      createPackSkill("infrastructure-delivery", "Review delivery topology and recovery.", "Prefer additive, reversible infrastructure changes."),
      createPackSkill("container-hygiene", "Review image and compose configuration.", "Flag secrets in images, latest tags, and privileged containers."),
    ],
    prompts: [
      createPackPrompt(
        "review-infra-threats",
        "Review infrastructure and trust-boundary changes.",
        "[service or environment]",
        "Identify actors, secrets, network edges, and recoverable failure. Do not apply Terraform, Kubernetes, or cloud mutations.",
      ),
    ],
    tasks: [
      recipe({ id: "infra.tf-fmt-check", description: "Check Terraform formatting without rewriting files.", risk: "read-only", argv: ["terraform", "fmt", "-check", "-recursive"], preconditions: ["main.tf"] }),
      recipe({ id: "infra.compose-config", description: "Validate Compose configuration.", risk: "read-only", argv: ["docker", "compose", "config"], preconditions: ["compose.yaml"] }),
      recipe({ id: "infra.hadolint", description: "Lint a Dockerfile with hadolint.", risk: "read-only", argv: ["hadolint", "Dockerfile"], preconditions: ["Dockerfile"] }),
      recipe({ id: "infra.docker-images", description: "List local Docker images.", risk: "read-only", argv: ["docker", "images"] }),
    ],
  }),
  createCapabilityPack({
    id: "cli-devtools",
    displayName: "CLI and devtools",
    description: "Developer-tool UX and command-contract guidance.",
    requiredToolchains: ["node"],
    agents: [
      createSpecialist("devtools-engineer", "Owns command contracts and developer workflows.", "Keep output stable, safe, and automation-friendly."),
      createSpecialist("command-contract-analyst", "Reviews flags, exit codes, and JSON schemas.", "Do not break machine-readable output for cosmetic reasons."),
    ],
    skills: [
      createPackSkill("cli-contract-design", "Design stable CLI contracts.", "Define exit codes, JSON schemas, and non-interactive approval rules before implementation."),
      createPackSkill("developer-workflow-review", "Review local developer loops.", "Prefer one obvious happy path and explicit dry runs over hidden defaults."),
    ],
    prompts: [
      createPackPrompt(
        "review-cli-contract",
        "Review a CLI command for stability, safety, and automation use.",
        "[command]",
        "Inspect help, flags, exit codes, and JSON. Report breaking-change risk and missing dry-run or approval behavior.",
      ),
    ],
    tasks: [
      recipe({ id: "devtools.pkg-bin", description: "Show package.bin from package.json.", risk: "read-only", argv: ["npm", "pkg", "get", "bin"], preconditions: ["package.json"] }),
      recipe({ id: "devtools.node-test", description: "Run Node's built-in test runner.", risk: "read-only", argv: ["node", "--test"] }),
      recipe({ id: "devtools.help", description: "Print this CLI's help.", risk: "read-only", argv: ["node", "--help"] }),
    ],
  }),
  createCapabilityPack({
    id: "backend-api",
    displayName: "Backend and API",
    description: "Server contracts, authorization, and persistence-boundary guidance.",
    requiredToolchains: ["node"],
    agents: [
      createSpecialist("api-boundary-engineer", "Owns HTTP and event contracts without leaking persistence models.", "Define authentication, authorization, idempotency, and errors before clients integrate."),
      createSpecialist("persistence-contract-analyst", "Reviews schema ownership, constraints, and expand-and-contract changes.", "Never edit an applied production migration to rewrite history."),
    ],
    skills: [
      createPackSkill("api-boundary-design", "Design stable request, response, and error schemas.", "Keep Prisma and vendor types behind the owning module."),
      createPackSkill("authz-operation-review", "Review resource-level authorization per operation.", "Authentication is not authorization. Deny by default."),
      createPackSkill("schema-expand-contract", "Plan additive schema changes.", "Prefer expand-and-contract over destructive cutovers."),
    ],
    prompts: [
      createPackPrompt(
        "review-api-boundary",
        "Review an API operation for contract, auth, and compatibility risk.",
        "[operation or route]",
        "Check request/response schemas, authorization, idempotency, and error mapping. Do not expose database models.",
      ),
    ],
    tasks: [
      recipe({ id: "api.prisma-validate", description: "Validate a Prisma schema.", risk: "read-only", argv: ["npx", "--no-install", "prisma", "validate"], preconditions: ["package.json", "prisma/schema.prisma"] }),
      recipe({ id: "api.contract-files", description: "List tracked API contract files.", risk: "read-only", argv: ["git", "ls-files", "--", "openapi.json", "openapi.yaml", "prisma/schema.prisma"] }),
      recipe({ id: "api.prisma-version", description: "Show the local Prisma CLI version.", risk: "read-only", argv: ["npx", "--no-install", "prisma", "-v"], preconditions: ["package.json"] }),
    ],
  }),
  createCapabilityPack({
    id: "qa-testing",
    displayName: "QA and testing",
    description: "Independent verification, coverage, and regression guidance.",
    agents: [
      createSpecialist("verification-strategist", "Owns risk-based test selection and acceptance evidence.", "Do not duplicate the implementer's happy-path tests as the only evidence."),
      createSpecialist("regression-analyst", "Reviews flaky tests, missing failure paths, and coverage gaps.", "A skipped failure path is a product risk, not a cleanup item."),
    ],
    skills: [
      createPackSkill("verification-planning", "Plan verification from user risk, not folder structure.", "Cover success, validation, denial, failure, and recovery at the level that proves behavior."),
      createPackSkill("flaky-test-triage", "Triage flaky tests without deleting signal.", "Do not weaken or delete a meaningful test merely to make a change pass."),
    ],
    prompts: [
      createPackPrompt(
        "plan-verification",
        "Plan independent verification for a change.",
        "[change or feature]",
        "List the important success, denial, failure, and recovery paths. Name the smallest tests that prove them. Do not implement the feature in this pass.",
      ),
    ],
    tasks: [
      recipe({ id: "qa.node-test", description: "Run Node's built-in test runner recursively.", risk: "read-only", argv: ["node", "--test"] }),
      recipe({ id: "qa.pytest", description: "Run pytest quietly.", risk: "working-tree", argv: ["python", "-m", "pytest", "-q"] }),
      recipe({ id: "qa.coverage", description: "Run the npm test script with coverage arguments.", risk: "working-tree", argv: ["npm", "test", "--", "--coverage"], preconditions: ["package.json"] }),
      recipe({ id: "qa.playwright-list", description: "List Playwright tests without running them.", risk: "read-only", argv: ["npx", "--no-install", "playwright", "test", "--list"], preconditions: ["package.json"] }),
    ],
  }),
  createCapabilityPack({
    id: "observability",
    displayName: "Observability",
    description: "Telemetry, health, and incident-evidence guidance.",
    requiredToolchains: ["docker"],
    agents: [
      createSpecialist("telemetry-engineer", "Owns logs, metrics, and traces without collecting secrets.", "Redact credentials, tokens, payment data, and unnecessary personal content."),
      createSpecialist("incident-analyst", "Reviews degraded modes and operator evidence.", "Prefer actionable error reports over verbose debug dumps."),
    ],
    skills: [
      createPackSkill("telemetry-design", "Design structured observability for critical paths.", "Include request or job identifiers and outcome metrics. Omit secrets."),
      createPackSkill("degraded-mode-review", "Review operator-visible degraded behavior.", "Define rollback or forward recovery for risky changes."),
    ],
    prompts: [
      createPackPrompt(
        "review-telemetry",
        "Review a change for missing operator evidence and secret leakage in logs.",
        "[service or job]",
        "Identify the critical path, required identifiers, and redaction gaps. Do not add a new vendor without a product reason.",
      ),
    ],
    tasks: [
      recipe({ id: "obs.compose-config", description: "Validate Compose configuration used for local telemetry stacks.", risk: "read-only", argv: ["docker", "compose", "config"] }),
      recipe({ id: "obs.compose-ps", description: "Show Compose service status.", risk: "read-only", argv: ["docker", "compose", "ps"] }),
      recipe({ id: "obs.docker-ps", description: "List running containers.", risk: "read-only", argv: ["docker", "ps"] }),
    ],
  }),
  createCapabilityPack({
    id: "documentation",
    displayName: "Documentation",
    description: "Product, architecture, and changelog stewardship.",
    agents: [
      createSpecialist("docs-engineer", "Keeps product and architecture documents aligned with shipped behavior.", "Do not treat templates as requirements. Update docs in the same change as behavior."),
      createSpecialist("changelog-steward", "Reviews user-facing change notes and migration copy.", "Keep current behavior separate from future direction."),
    ],
    skills: [
      createPackSkill("source-of-truth-alignment", "Align docs with executable behavior.", "If documents conflict with deployed behavior, identify the intended source of truth."),
      createPackSkill("changelog-hygiene", "Write user-facing change notes.", "Record verification evidence and residual risk, not a file list."),
    ],
    prompts: [
      createPackPrompt(
        "review-project-docs",
        "Review product and architecture docs against current behavior.",
        "[document or change]",
        "Find contradictions, missing actors, and undocumented failure behavior. Do not invent user evidence.",
      ),
    ],
    tasks: [
      recipe({ id: "docs.list", description: "List tracked documentation files.", risk: "read-only", argv: ["git", "ls-files", "--", "docs", "README.md"] }),
      recipe({ id: "docs.diff", description: "Show documentation diffs.", risk: "read-only", argv: ["git", "diff", "--", "docs", "README.md"] }),
      recipe({ id: "docs.grep-todo", description: "Find TODO markers in documentation.", risk: "read-only", argv: ["git", "grep", "-n", "TODO", "--", "docs"] }),
    ],
  }),
  createCapabilityPack({
    id: "computer-use",
    displayName: "Computer use and browser automation",
    description: "Grounded UI automation, browser-journey evidence, and tool-trust guidance.",
    agents: [
      createSpecialist("computer-use-operator", "Operates GUI targets through grounded, authorized steps.", "Prefer APIs and CLIs. Re-ground every action from fresh state and stop on ambiguity."),
      createSpecialist("automation-safety-reviewer", "Reviews automation plans for authorization and recovery gaps.", "Require confirmation points for consequential actions and hand control back instead of guessing."),
    ],
    skills: [
      createPackSkill("computer-use-grounding", "Ground one UI action at a time from fresh screenshots.", "Re-ground after every state change and verify the success signal before continuing."),
      createPackSkill("browser-journey-evidence", "Capture screenshots, console, and traces for web journeys.", "Record seeded state, environment, and exact commands so any engineer can reproduce the run."),
      createPackSkill("automation-fallback-planning", "Define stop conditions and human handoff for automation.", "Name what the automation must not touch and where a person resumes."),
    ],
    prompts: [
      createPackPrompt(
        "review-automation-plan",
        "Review a UI automation plan for authorization, grounding, and recovery.",
        "[application and goal]",
        "Check authorization scope, API/CLI alternatives, per-step grounding evidence, confirmation points, stop conditions, and handoff behavior. Do not execute the plan.",
      ),
    ],
    tasks: [
      recipe({ id: "auto.node-version", description: "Show the Node.js version available to automation.", risk: "read-only", argv: ["node", "--version"] }),
      recipe({ id: "auto.python-version", description: "Show the Python version available to automation.", risk: "read-only", argv: ["python", "--version"] }),
      recipe({ id: "auto.workspace-tree", description: "List tracked files for agent context.", risk: "read-only", argv: ["git", "ls-files"] }),
      recipe({ id: "auto.docs-inventory", description: "List source-of-truth documents for agent context.", risk: "read-only", argv: ["git", "ls-files", "--", "docs", "README.md", "AGENTS.md", "CLAUDE.md"] }),
      recipe({ id: "auto.diff-stat", description: "Summarize working-tree changes for review.", risk: "read-only", argv: ["git", "diff", "--stat"] }),
    ],
  }),
];
