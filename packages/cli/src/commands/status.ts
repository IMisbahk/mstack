import type { Output } from "../core/output.js";
import { inspectRepository } from "../services/health.js";

export async function statusCommand(cwd: string, output: Output, json: boolean): Promise<void> {
  const report = await inspectRepository(cwd);
  if (json) return output.json(report);

  output.title("mstack status");
  output.field("Setup", report.setup === "complete" ? "complete" : report.setup.replace("-", " "));
  for (const document of report.documents) {
    const label = document.id === "product" ? "Product" : "Architecture";
    const detail = document.state === "draft"
      ? `draft · ${document.placeholders} placeholders remaining`
      : document.state === "ready" ? "complete" : document.state;
    output.field(label, `${detail} · ${document.path}`);
  }
  output.field("AI runtimes", report.integrations.length > 0 ? report.integrations.join(", ") : "not configured");
  output.field("Manifest", report.manifest ?? "not found");
  const destination = report.next.path ? ` ${report.next.path}` : report.next.command ? ` ${output.command(report.next.command)}` : "";
  output.next(`${report.next.message}${destination}`);
}

export async function explainCommand(cwd: string, output: Output, json: boolean): Promise<void> {
  const report = await inspectRepository(cwd);
  const items = report.documents.filter((document) => document.state !== "missing").map((document) => ({
    path: document.path,
    purpose: document.id === "product" ? "Product intent, users, scope, and success criteria" : "System boundaries, contracts, and operational design",
    state: document.state,
    placeholders: document.placeholders,
  }));
  const result = { schemaVersion: 1, root: report.root, workflow: items, next: report.next };
  if (json) return output.json(result);

  output.title("Misbah's Build Like This workflow in this repository");
  output.line("");
  for (const item of items) {
    output.field(item.path, item.purpose);
  }
  if (items.length === 0) output.line("  No planning documents are installed yet.");
  const suffix = report.next.path ? ` ${report.next.path}` : report.next.command ? ` ${output.command(report.next.command)}` : "";
  output.next(`${report.next.message}${suffix}`);
}
