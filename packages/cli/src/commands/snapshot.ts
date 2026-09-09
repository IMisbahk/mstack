import { VERSION } from "../meta.js";
import { buildCatalog } from "./catalog.js";
import type { Output } from "../core/output.js";
import { inspectRepository } from "../services/health.js";

export interface SnapshotReport {
  readonly schemaVersion: 1;
  readonly generatedAt: string;
  readonly mstack: string;
  readonly root: string;
  readonly setup: string;
  readonly documents: readonly { id: string; path: string; state: string; placeholders: number }[];
  readonly integrations: readonly string[];
  readonly packs: readonly string[];
  readonly manifest: string | null;
  readonly catalog: Readonly<Record<string, number>>;
  readonly next: { command?: string; path?: string; message: string };
  readonly guidance: string;
}

export async function snapshotCommand(cwd: string, output: Output, json: boolean): Promise<SnapshotReport> {
  const health = await inspectRepository(cwd);
  const catalog = buildCatalog();
  const guidance = [
    "Paste this snapshot at the start of an AI session, then run the next action.",
    `Sources of truth: ${health.documents.map((document) => `${document.path} (${document.state})`).join(", ") || "none installed yet"}; code and tests.`,
    `Installed method resources: ${catalog.counts.packs} packs, ${catalog.counts.agents} agents, ${catalog.counts.skills} skills, ${catalog.counts.prompts} prompts, ${catalog.counts.hooks} hooks, ${catalog.counts.templates} templates, ${catalog.counts["task-recipes"]} task recipes across ${health.integrations.length} configured runtimes.`,
  ].join("\n");
  const report: SnapshotReport = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    mstack: VERSION,
    root: health.root,
    setup: health.setup,
    documents: health.documents,
    integrations: health.integrations,
    packs: health.packs,
    manifest: health.manifest,
    catalog: { ...catalog.counts },
    next: health.next,
    guidance,
  };
  if (json) {
    output.json(report);
    return report;
  }

  output.title("mstack snapshot");
  output.field("Setup", health.setup);
  output.field("Runtimes", health.integrations.length > 0 ? health.integrations.join(", ") : "not configured");
  output.field("Packs", health.packs.length > 0 ? health.packs.join(", ") : "none selected");
  output.field("Resources", `${catalog.counts.agents} agents · ${catalog.counts.skills} skills · ${catalog.counts.prompts} prompts · ${catalog.counts["task-recipes"]} task recipes`);
  output.line("");
  output.line(guidance);
  const destination = health.next.path ? ` ${health.next.path}` : health.next.command ? ` ${output.command(health.next.command)}` : "";
  output.next(`${health.next.message}${destination}`);
  return report;
}
