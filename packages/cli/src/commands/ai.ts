import * as prompts from "@clack/prompts";
import {
  applyIntegrationPlan,
  approveIntegrationPlan,
  createDefaultRegistry,
  createIntegrationPlan,
  createReconciliationPlan,
  inspectIntegrationRepository,
  type ApplyResult,
  type ApprovalRequirement,
} from "../../../ai-integrations/src/index.js";
import type { Output } from "../core/output.js";
import { CliError, errorMessage } from "../core/errors.js";
import { createDefaultPluginRegistry } from "../plugins/index.js";
import { inspectRepository } from "../services/health.js";
import { updateManifest } from "../services/manifest.js";
import { detectRuntimes } from "../services/runtimes.js";

function valueOrCancel<T>(value: T | symbol): T {
  if (prompts.isCancel(value)) throw new CliError("AI runtime setup cancelled.", { exitCode: 130 });
  return value;
}

export async function aiListCommand(cwd: string, output: Output, json: boolean): Promise<void> {
  const registry = createDefaultRegistry();
  const runtimes = await detectRuntimes(cwd, registry);
  const result = runtimes.map((runtime) => {
    const adapter = registry.get(runtime.id);
    return { ...runtime, capabilities: adapter.capabilities };
  });
  if (json) return output.json({ schemaVersion: 1, runtimes: result });
  output.title("AI coding runtimes");
  output.line("");
  for (const runtime of result) {
    const state = runtime.configured ? "configured" : runtime.installed ? "detected" : "available";
    const capabilities = Object.values(runtime.capabilities);
    const native = capabilities.filter((capability) => capability.level === "native").length;
    const emulated = capabilities.filter((capability) => capability.level === "emulated").length;
    output.field(runtime.displayName, `${state} · ${native} native${emulated > 0 ? ` · ${emulated} adapted` : ""}`);
  }
  output.next(`Install the recommended pack with ${output.command("mstack ai setup")}`);
}

export interface AiSetupOptions {
  cwd: string;
  runtimes: readonly string[];
  all: boolean;
  dryRun: boolean;
  force: boolean;
  yes: boolean;
  json: boolean;
  output: Output;
}

export async function aiSetupCommand(options: AiSetupOptions): Promise<void> {
  const health = await inspectRepository(options.cwd);
  if (!health.initialized) {
    throw new CliError("Build Like This is not initialized in this repository.", {
      exitCode: 2,
      hints: ["Run mstack init first, then rerun mstack ai setup."],
    });
  }
  const registry = createDefaultRegistry();
  const known = new Set(registry.list().map((adapter) => adapter.id));
  const unknown = options.runtimes.filter((runtime) => !known.has(runtime));
  if (unknown.length > 0) throw new CliError(`Unknown AI runtime: ${unknown.join(", ")}.`, { hints: [`Available runtimes: ${[...known].join(", ")}.`] });

  let selected = options.all ? [...known] : [...new Set(options.runtimes)];
  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY && !options.yes && !options.json);
  const detections = selected.length === 0 ? await detectRuntimes(health.root, registry) : [];
  if (selected.length === 0 && interactive) {
    selected = valueOrCancel(await prompts.multiselect({
      message: "Which AI coding environments should mstack configure?",
      options: detections.map((runtime) => ({
        value: runtime.id,
        label: runtime.displayName,
        ...(runtime.configured ? { hint: "configured" } : runtime.installed ? { hint: "detected" } : {}),
      })),
      initialValues: detections.filter((runtime) => runtime.installed || runtime.configured).map((runtime) => runtime.id),
      required: true,
    }));
  }
  if (selected.length === 0) {
    selected = detections.filter((runtime) => runtime.installed || runtime.configured).map((runtime) => runtime.id);
  }
  if (selected.length === 0) {
    throw new CliError("No AI coding environment was selected or detected.", {
      exitCode: 3,
      hints: ["Choose one explicitly, for example: mstack ai setup codex cursor"],
    });
  }

  const pluginRegistry = createDefaultPluginRegistry();
  const pack = pluginRegistry.integrationPack("build-like-this");
  const spec = pack.createSpec({ root: health.root, projectName: health.root.split(/[\\/]/).at(-1) ?? "Project" });
  let plan;
  try {
    plan = createIntegrationPlan(registry, spec, selected);
  } catch (error) {
    throw new CliError(`Could not create the AI runtime plan: ${errorMessage(error)}`, { cause: error });
  }
  const inspection = await inspectIntegrationRepository(health.root, plan);
  const reconciliation = createReconciliationPlan(plan, inspection);
  const conflicts = reconciliation.changes.filter((change) => change.action === "conflict");
  if (conflicts.length > 0) {
    if (!options.force) throw new CliError(`Setup would replace ${conflicts.length} user-owned file${conflicts.length === 1 ? "" : "s"}.`, {
      exitCode: 3,
      hints: [`Preserved: ${conflicts.map((file) => file.path).join(", ")}`, "Review those files, or pass --force to replace them intentionally."],
    });
  }
  const requirements = reconciliation.changes.flatMap((change) => change.approvalRequirements);
  if (!options.dryRun && !interactive && !options.yes && requirements.length > 0) {
    throw new CliError("AI runtime setup requires explicit approval for privileged or conflicting resources.", {
      exitCode: 3,
      hints: ["Review the plan with mstack ai setup --dry-run, then rerun with --yes."],
    });
  }
  const approved = approveIntegrationPlan(reconciliation, requirements.map((requirement) => ({
    requirementId: requirement.id,
    decision: "approve" as const,
    decidedBy: "mstack-cli",
  })));
  const preview = await applyIntegrationPlan(health.root, approved, { dryRun: true });

  const displayNames = selected.map((id) => registry.get(id).displayName);
  if (!options.json) {
    outputPlan(options.output, displayNames, preview, plan.artifacts, plan.diagnostics.length, requirements, options.dryRun);
    for (const diagnostic of plan.diagnostics) options.output.warn(`${registry.get(diagnostic.environment).displayName}: ${diagnostic.message}`);
  }
  if (options.dryRun) {
    if (options.json) options.output.json(aiResult("dry-run", selected, preview, plan.diagnostics));
    return;
  }
  if (interactive) {
    const confirmed = valueOrCancel(await prompts.confirm({ message: "Apply this AI runtime setup?", initialValue: true }));
    if (!confirmed) throw new CliError("AI runtime setup cancelled.", { exitCode: 130 });
  }

  const progress = interactive ? prompts.spinner() : undefined;
  progress?.start("Installing AI runtime pack");
  const applied = await applyIntegrationPlan(health.root, approved);
  progress?.stop("AI runtime pack installed");
  const managedFiles = applied.files.filter((file) => file.status !== "conflict").map((file) => ({
    path: file.path,
    kind: file.path.startsWith(".mstack/runtime/") ? "runtime" as const : "integration" as const,
    owner: file.path.startsWith(".mstack/runtime/") ? "mstack" : plan.artifacts.find((artifact) => artifact.path === file.path)?.environment ?? "mstack",
    integrity: plan.artifacts.find((artifact) => artifact.path === file.path)?.mergeStrategy === "replace" ? "content" as const : "existence" as const,
  }));
  const manifest = await updateManifest(health.root, { files: managedFiles, integrations: selected });

  if (options.json) return options.output.json({ ...aiResult("applied", selected, applied, plan.diagnostics), manifest: ".mstack/manifest.json", operationId: manifest.operationId });
  const changed = applied.files.filter((file) => file.status === "created" || file.status === "updated").length;
  options.output.success(`Configured ${displayNames.join(", ")}`);
  options.output.field("Changed", `${changed} file${changed === 1 ? "" : "s"}`);
  options.output.field("Manifest", ".mstack/manifest.json");
  if (selected.some((id) => ["claude-code", "codex", "cursor", "gemini-cli"].includes(id))) {
    options.output.warn("Project hooks require runtime trust. Review the generated hook configuration before enabling it.");
  }
  options.output.next(`Check repository readiness with ${options.output.command("mstack status")}`);
}

function outputPlan(
  output: Output,
  displayNames: readonly string[],
  preview: ApplyResult,
  artifacts: readonly { feature: string }[],
  warnings: number,
  approvals: readonly ApprovalRequirement[],
  dryRun: boolean,
): void {
  const counts = new Map<string, number>();
  for (const artifact of artifacts) counts.set(artifact.feature, (counts.get(artifact.feature) ?? 0) + 1);
  const contents = [...counts.entries()].map(([feature, count]) => `${count} ${artifactLabel(feature, count)}`).join(" · ");
  output.title(dryRun ? "AI runtime setup · dry run" : "AI runtime setup");
  output.field("Runtimes", displayNames.join(", "));
  output.field("Files", contents);
  output.field("Create", String(preview.files.filter((file) => file.status === "created").length));
  output.field("Update", String(preview.files.filter((file) => file.status === "updated").length));
  output.field("Unchanged", String(preview.files.filter((file) => file.status === "unchanged").length));
  if (approvals.length > 0) {
    output.field("Approvals", String(approvals.length));
    for (const [path, kinds] of approvalSummary(approvals)) output.warn(`${path}: ${kinds.join(", ")}`);
  }
  if (warnings > 0) output.field("Limitations", String(warnings));
}

function artifactLabel(feature: string, count: number): string {
  const singular = feature === "instructions" ? "instruction" : feature.endsWith("s") ? feature.slice(0, -1) : feature;
  return `${singular} file${count === 1 ? "" : "s"}`;
}

function approvalSummary(requirements: readonly ApprovalRequirement[]): Map<string, string[]> {
  const byPath = new Map<string, string[]>();
  for (const requirement of requirements) {
    const kinds = byPath.get(requirement.path) ?? [];
    if (!kinds.includes(requirement.kind)) kinds.push(requirement.kind);
    byPath.set(requirement.path, kinds);
  }
  return byPath;
}

function aiResult(mode: "dry-run" | "applied", runtimes: readonly string[], result: ApplyResult, diagnostics: ApplyResult["diagnostics"]): object {
  return { schemaVersion: 1, mode, runtimes, files: result.files, diagnostics };
}
