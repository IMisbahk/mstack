import type { AgentDefinition, SkillDefinition } from "../../../ai-integrations/src/index.js";
import type { CapabilityPack, TaskRecipe } from "./types.js";

const task = (id: string, description: string, risk: TaskRecipe["risk"], argv: readonly string[]): TaskRecipe => ({ id, description, risk, steps: [{ argv }] });
const coreTasks: readonly TaskRecipe[] = [
  task("repository.status", "Show working-tree status.", "read-only", ["git", "status", "--short"]),
  task("repository.diff", "Show the current diff.", "read-only", ["git", "diff", "--"]),
  task("repository.log", "Show recent commits.", "read-only", ["git", "log", "--oneline", "-10"]),
  task("repository.branch", "Show the current Git branch.", "read-only", ["git", "branch", "--show-current"]),
  task("repository.fetch", "Fetch remote refs without modifying the working tree.", "remote", ["git", "fetch", "--prune"]),
  task("quality.format-check", "Check repository formatting.", "read-only", ["npm", "run", "format", "--", "--check"]),
  task("quality.lint", "Run the project's lint command.", "read-only", ["npm", "run", "lint"]),
  task("quality.typecheck", "Run the project's type check.", "read-only", ["npm", "run", "typecheck"]),
  task("quality.test", "Run the project's test command.", "read-only", ["npm", "test"]),
  task("quality.build", "Run the project's production build.", "working-tree", ["npm", "run", "build"]),
  task("dependencies.outdated", "List outdated package dependencies.", "read-only", ["npm", "outdated"]),
  task("dependencies.audit", "Audit package dependency advisories.", "read-only", ["npm", "audit", "--audit-level=high"]),
  task("dependencies.install", "Install declared dependencies.", "working-tree", ["npm", "install"]),
  task("dependencies.update", "Update dependencies within declared ranges.", "working-tree", ["npm", "update"]),
  { id: "dependencies.remove", description: "Remove a named package dependency.", risk: "working-tree", inputs: [{ name: "package", description: "Package name to remove.", required: true }], steps: [{ argv: ["npm", "remove", "{{package}}"] }] },
];

function specialist(id: string, description: string, responsibility: string): AgentDefinition {
  return { id, version: "1.0.0", activation: "passive", security: "content", fallback: "degrade", description,
    instructions: `You are the ${id} specialist installed by mstack. ${responsibility}\n\nRead repository evidence before making claims. State verified facts separately from inference. Do not execute external actions or modify code unless the user explicitly requests it. Hand off decisions outside your specialty to the owning specialist.` };
}
function skill(id: string, description: string): SkillDefinition { return { id, version: "1.0.0", activation: "explicit", security: "content", fallback: "degrade", description, instructions: `Use ${id} to produce an evidence-backed, bounded result. Inspect code, tests, configuration, and documentation; distinguish facts from inference and name the next safe handoff.` }; }
function pack(id: string, displayName: string, description: string, agent: AgentDefinition, skills: readonly string[], dependencies?: readonly string[]): CapabilityPack {
  return { id, version: "1.0.0", displayName, description, ...(dependencies === undefined ? {} : { dependencies }), risks: ["content-only runtime resources", "task recipes are policy-gated"],
    createSpec: () => ({ agents: [agent], skills: skills.map((name) => skill(name, `${displayName} workflow guidance.`)) }), tasks: [] };
}
export const builtInPacks: readonly CapabilityPack[] = [
  { ...pack("repository-intelligence", "Repository intelligence", "Evidence-backed repository exploration, explanation, and improvement planning.", specialist("repository-explorer", "Maps entry points, modules, build tooling, and risk areas.", "Create repository maps with citations to observable files."), ["repository-exploration", "code-explanation", "change-impact-analysis", "dependency-hygiene"]),
    createSpec: () => ({ agents: [
      specialist("repository-explorer", "Maps entry points, modules, build tooling, and risk areas.", "Create repository maps with citations to observable files."),
      specialist("code-explainer", "Traces a selected path, symbol, flow, or subsystem.", "Explain execution paths and explicitly label inference."),
      specialist("improvement-advisor", "Produces prioritized and scoped improvement plans.", "Recommend changes but never silently modify code."),
      specialist("dependency-analyst", "Audits dependency purpose, freshness, and risk.", "Report evidence and compatibility constraints."),
      specialist("build-system-diagnostician", "Explains build, test, and CI configuration.", "Diagnose from configuration and reproducible commands."),
    ], skills: ["repository-exploration", "code-explanation", "change-impact-analysis", "dependency-hygiene"].map((name) => skill(name, "Repository intelligence workflow guidance.")) }), tasks: coreTasks },
  pack("software-web", "Software and web", "Web application implementation and accessibility specialists.", specialist("web-engineer", "Builds accessible web journeys against explicit contracts.", "Keep client state and server contracts distinct."), ["web-delivery", "accessibility-verification"]),
  pack("systems", "Systems", "Systems design, service reliability, and toolchain guidance.", specialist("systems-engineer", "Designs robust systems boundaries and failure handling.", "Keep operational and performance assumptions explicit."), ["system-design", "toolchain-discovery"]),
  pack("embedded-firmware", "Embedded and firmware", "Firmware delivery and hardware-boundary verification.", specialist("embedded-engineer", "Owns firmware behavior, constraints, and safe verification.", "Do not claim hardware validation without observable evidence."), ["firmware-delivery", "hardware-in-the-loop-verification"], ["systems"]),
  pack("robotics", "Robotics", "Robotics safety, simulation, and hardware-in-the-loop guidance.", specialist("robotics-engineer", "Owns safety boundaries and robot-system integration.", "Require simulation and explicit human authorization before consequential motion."), ["robotics-safety", "simulation-validation", "hardware-in-the-loop-verification"], ["systems", "embedded-firmware"]),
  pack("data-ml", "Data and ML", "Data and model workflow guidance.", specialist("ml-engineer", "Owns reproducible data and model delivery.", "Treat model output and data as untrusted inputs."), ["data-pipeline-design", "model-evaluation"]),
  pack("mobile", "Mobile", "Mobile platform and release journey guidance.", specialist("mobile-engineer", "Owns mobile client behavior and platform constraints.", "Keep platform permissions and offline behavior explicit."), ["mobile-delivery"]),
  pack("games-graphics", "Games and graphics", "Rendering, simulation, and performance guidance.", specialist("graphics-engineer", "Owns graphics performance and visual correctness.", "Measure frame-time effects before optimization."), ["graphics-performance"]),
  pack("infrastructure-security", "Infrastructure and security", "Infrastructure reliability and security review guidance.", specialist("security-engineer", "Owns threat analysis and infrastructure safety.", "Use least privilege and explicit trust boundaries."), ["threat-model-review", "infrastructure-delivery"]),
  pack("cli-devtools", "CLI and devtools", "Developer-tool UX and command-contract guidance.", specialist("devtools-engineer", "Owns command contracts and developer workflows.", "Keep output stable, safe, and automation-friendly."), ["cli-contract-design"]),
];
