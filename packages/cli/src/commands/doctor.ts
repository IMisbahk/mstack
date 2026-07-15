import { access } from "node:fs/promises";
import { constants } from "node:fs";
import type { Output } from "../core/output.js";
import { commandExists } from "../core/process.js";
import { detectProject } from "../services/project.js";
import { ConfigStore } from "../services/config.js";
import { inspectRepository } from "../services/health.js";
import { verifyManifest } from "../services/manifest.js";
import { VERSION } from "../meta.js";

interface Check {
  id: string;
  status: "ok" | "warning" | "error";
  detail: string;
  fix?: string;
}

export async function doctorCommand(cwd: string, output: Output, json: boolean): Promise<void> {
  const project = await detectProject(cwd);
  const config = new ConfigStore({ cwd });
  const health = await inspectRepository(cwd);
  const git = await commandExists("git");
  const integrity = await verifyManifest(health.root);
  let writable = true;
  try { await access(health.root, constants.W_OK); } catch { writable = false; }
  const checks: Check[] = [
    { id: "CLI", status: "ok", detail: VERSION },
    { id: "RUNTIME", status: Number(process.versions.node.split(".")[0]) >= 20 ? "ok" : "error", detail: `Node.js ${process.versions.node}`, fix: "Install Node.js 20.11 or newer." },
    { id: "GIT", status: git ? "ok" : "warning", detail: git ? "available" : "not found", fix: "Install Git or initialize with --no-git." },
    { id: "REPOSITORY", status: health.initialized ? "ok" : "warning", detail: health.initialized ? health.root : "not initialized", fix: "Run mstack init." },
    { id: "PERMISSIONS", status: writable ? "ok" : "error", detail: writable ? "repository is writable" : "repository is not writable", fix: `Grant the current user write access to ${health.root}.` },
    { id: "MANIFEST", status: integrity.length === 0 ? "ok" : "warning", detail: integrity.length === 0 ? health.manifest ?? "not installed" : `${integrity.length} managed file${integrity.length === 1 ? "" : "s"} changed`, fix: "Review mstack status and rerun the relevant setup command." },
  ];
  const report = {
    schemaVersion: 1,
    mstack: VERSION,
    runtime: `Node ${process.versions.node}`,
    platform: `${process.platform} ${process.arch}`,
    project,
    preferences: await config.resolved(),
    checks,
    integrity,
  };
  if (json) return output.json(report);

  output.title("mstack doctor");
  output.line("");
  for (const check of checks) {
    const symbol = check.status === "ok" ? "✓" : check.status === "warning" ? "!" : "✗";
    output.field(`${symbol} ${check.id}`, check.detail);
  }
  const issues = checks.filter((check) => check.status !== "ok");
  output.line(`\n${issues.length === 0 ? "No issues found" : `${issues.length} issue${issues.length === 1 ? "" : "s"} found`}`);
  for (const issue of issues) if (issue.fix) output.line(`Fix: ${issue.fix}`);
}
