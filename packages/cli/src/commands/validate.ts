import path from "node:path";
import { verifyIntegrationRuntime, type VerificationFinding } from "../../../ai-integrations/src/index.js";
import type { Output } from "../core/output.js";
import { CliError, errorMessage } from "../core/errors.js";
import { inspectRepository } from "../services/health.js";
import { verifyManifest } from "../services/manifest.js";

export type ValidationStatus = "ok" | "warning" | "error";

export interface ValidationCheck {
  readonly id: "SETUP" | "PRODUCT" | "ARCHITECTURE" | "MANIFEST" | "AI_RUNTIME";
  readonly status: ValidationStatus;
  readonly detail: string;
  readonly fix?: string;
}

export interface ValidationReport {
  readonly schemaVersion: 1;
  readonly root: string;
  readonly strict: boolean;
  readonly valid: boolean;
  readonly checks: readonly ValidationCheck[];
  readonly runtimeFindings: readonly VerificationFinding[];
}

export async function validateRepository(start: string, strict = false): Promise<ValidationReport> {
  let health;
  try {
    health = await inspectRepository(start);
  } catch (error) {
    throw new CliError(`Could not inspect the repository: ${errorMessage(error)}`, {
      hints: ["Fix the reported configuration or manifest, then rerun mstack validate."],
      cause: error,
    });
  }

  const checks: ValidationCheck[] = [];
  checks.push(health.initialized
    ? { id: "SETUP", status: "ok", detail: "Build Like This is initialized" }
    : { id: "SETUP", status: "error", detail: "Build Like This is not initialized", fix: "Run mstack init." });

  for (const document of health.documents) {
    const id = document.id === "product" ? "PRODUCT" as const : "ARCHITECTURE" as const;
    if (document.state === "ready") checks.push({ id, status: "ok", detail: `${document.path} is ready` });
    else if (document.state === "missing") checks.push({ id, status: "warning", detail: `${document.path} is missing`, fix: "Run mstack init to add missing planning documents." });
    else checks.push({ id, status: "warning", detail: `${document.path} has ${document.placeholders} placeholder${document.placeholders === 1 ? "" : "s"}`, fix: `Complete ${document.path}.` });
  }

  if (!health.initialized) {
    checks.push({ id: "MANIFEST", status: "warning", detail: "Repository manifest is not installed", fix: "Run mstack init." });
  } else if (health.manifest === null) {
    checks.push({ id: "MANIFEST", status: "error", detail: "Repository manifest is missing", fix: "Run mstack init to restore managed state." });
  } else {
    const issues = await verifyManifest(health.root);
    checks.push(issues.length === 0
      ? { id: "MANIFEST", status: "ok", detail: `${health.manifest} is consistent` }
      : { id: "MANIFEST", status: "error", detail: `${issues.length} managed file${issues.length === 1 ? "" : "s"} missing or modified`, fix: "Review mstack status and rerun the command that owns each file." });
  }

  let runtimeFindings: readonly VerificationFinding[] = [];
  if (health.integrations.length === 0) {
    checks.push({ id: "AI_RUNTIME", status: "warning", detail: "No AI coding environment is configured", fix: "Run mstack ai setup." });
  } else {
    try {
      const runtime = await verifyIntegrationRuntime(health.root);
      runtimeFindings = runtime.findings;
      const resources = runtime.inspection.manifest?.resources.length;
      if (runtime.inspection.manifest === undefined) {
        checks.push({ id: "AI_RUNTIME", status: "error", detail: "AI runtimes are recorded but the runtime manifest is missing", fix: "Preview recovery with mstack ai setup --dry-run." });
      } else if (!runtime.valid) {
        const errors = runtime.findings.filter((finding) => finding.level === "error").length;
        checks.push({ id: "AI_RUNTIME", status: "error", detail: `${errors} runtime integrity issue${errors === 1 ? "" : "s"} found`, fix: "Inspect mstack validate --json, then preview reconciliation with mstack ai setup --dry-run." });
      } else {
        checks.push({ id: "AI_RUNTIME", status: "ok", detail: `${resources ?? 0} managed runtime resource${resources === 1 ? "" : "s"} verified` });
      }
    } catch (error) {
      checks.push({ id: "AI_RUNTIME", status: "error", detail: `Runtime verification failed: ${errorMessage(error)}`, fix: "Inspect the runtime manifest and rerun mstack ai setup --dry-run." });
    }
  }

  const invalid = checks.some((check) => check.status === "error" || (strict && check.status === "warning"));
  return { schemaVersion: 1, root: path.resolve(health.root), strict, valid: !invalid, checks, runtimeFindings };
}

export async function validateCommand(start: string, output: Output, options: { json: boolean; strict: boolean }): Promise<ValidationReport> {
  const report = await validateRepository(start, options.strict);
  if (options.json) {
    output.json(report);
    return report;
  }

  output.title("mstack validate");
  output.line("");
  for (const check of report.checks) {
    const symbol = check.status === "ok" ? "✓" : check.status === "warning" ? "!" : "✗";
    output.field(`${symbol} ${check.id}`, check.detail);
  }
  for (const finding of report.runtimeFindings.filter((item) => item.level !== "info")) {
    output.warn(`${finding.path ? `${finding.path}: ` : ""}${finding.message}`);
  }
  const warnings = report.checks.filter((check) => check.status === "warning");
  const errors = report.checks.filter((check) => check.status === "error");
  output.line("");
  if (report.valid && warnings.length === 0) output.success("Repository validation passed.");
  else if (report.valid) output.warn(`Repository validation passed with ${warnings.length} warning${warnings.length === 1 ? "" : "s"}.`);
  else output.error(`Repository validation failed with ${errors.length} error${errors.length === 1 ? "" : "s"}${options.strict && warnings.length > 0 ? ` and ${warnings.length} strict warning${warnings.length === 1 ? "" : "s"}` : ""}.`);
  for (const check of report.checks.filter((item) => item.status === "error" || (options.strict && item.status === "warning"))) {
    if (check.fix) output.line(`Fix: ${check.fix}`);
  }
  return report;
}
