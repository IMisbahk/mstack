import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Writable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import { buildCatalog } from "../src/commands/catalog.js";
import { createDefaultPackRegistry } from "../src/packs/index.js";
import { hasBlockingDoctorIssue } from "../src/commands/doctor.js";
import { validateRepository } from "../src/commands/validate.js";
import { Output } from "../src/core/output.js";
import { createProgram } from "../src/program.js";
import { readManifest, updateManifest } from "../src/services/manifest.js";
import { makeTemplates } from "./helpers.js";
import { engineeringAgents, engineeringPrompts, engineeringSkills } from "../../ai-integrations/src/index.js";

const temporary: string[] = [];
afterEach(async () => {
  process.exitCode = undefined;
  await Promise.all(temporary.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

function memoryStream(buffer: string[]): NodeJS.WriteStream {
  return new Writable({ write(chunk, _encoding, callback) { buffer.push(String(chunk)); callback(); } }) as NodeJS.WriteStream;
}

async function initializedFixture(): Promise<{ root: string; templates: string }> {
  const root = await mkdtemp(path.join(os.tmpdir(), "mstack-validation-"));
  temporary.push(root);
  const templates = await makeTemplates(root);
  const output = new Output({ stdout: memoryStream([]), stderr: memoryStream([]), color: false });
  await createProgram({ cwd: root, templatesDirectory: templates, output })
    .parseAsync(["node", "mstack", "init", ".", "--yes", "--no-git"]);
  return { root, templates };
}

describe("runtime catalog", () => {
  it("derives complete counts and filtered resources from runtime exports", () => {
    const registry = createDefaultPackRegistry();
    const packs = registry.list();
    const packSpecs = packs.map((pack) => pack.createSpec({ projectName: "fixture" }));
    const complete = buildCatalog();
    expect(complete.counts.packs).toBe(packs.length);
    expect(complete.counts["task-recipes"]).toBe(packs.reduce((sum, pack) => sum + pack.tasks.length, 0));
    expect(complete.counts.agents).toBe(engineeringAgents.length + packSpecs.reduce((sum, spec) => sum + (spec.agents?.length ?? 0), 0));
    expect(complete.counts.skills).toBe(engineeringSkills.length + packSpecs.reduce((sum, spec) => sum + (spec.skills?.length ?? 0), 0));
    expect(complete.counts.prompts).toBe(engineeringPrompts.length + packSpecs.reduce((sum, spec) => sum + (spec.prompts?.length ?? 0), 0));
    expect(complete.counts.hooks).toBe(4);
    expect(complete.counts.templates).toBe(10);
    expect(packs).toHaveLength(14);
    expect(complete.counts["task-recipes"]).toBeGreaterThanOrEqual(40);
    expect(complete.items.some((item) => item.id === "product-manager" && item.kind === "agents")).toBe(true);
    expect(complete.items.some((item) => item.id === "workflow-coordinator" && item.kind === "agents")).toBe(true);

    const agents = buildCatalog("agents");
    expect(agents.items.every((item) => item.kind === "agents")).toBe(true);
    expect(agents.items.some((item) => item.id === "product-manager")).toBe(true);
    expect(agents.items.some((item) => item.id === "web-engineer")).toBe(true);
  });

  it("filters the catalog by query without changing source counts", async () => {
    const stdout: string[] = [];
    const output = new Output({ stdout: memoryStream(stdout), stderr: memoryStream([]), color: false });
    await createProgram({ output }).parseAsync(["node", "mstack", "catalog", "packs", "--query", "mobile", "--json"]);
    const report = JSON.parse(stdout.join(""));
    expect(report.schemaVersion).toBe(1);
    expect(report.query).toBe("mobile");
    expect(report.counts.packs).toBe(14);
    expect(report.items.every((item: { id: string; description: string }) => `${item.id} ${item.description}`.toLowerCase().includes("mobile"))).toBe(true);
  });

  it("emits a versioned JSON catalog through the public CLI", async () => {
    const stdout: string[] = [];
    const output = new Output({ stdout: memoryStream(stdout), stderr: memoryStream([]), color: false });
    await createProgram({ output }).parseAsync(["node", "mstack", "catalog", "hooks", "--json"]);
    expect(JSON.parse(stdout.join(""))).toMatchObject({ schemaVersion: 1, counts: { hooks: 4 } });
  });
});

describe("repository validation", () => {
  it("removes an explicitly reconciled file that no longer exists from the project manifest", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "mstack-manifest-removal-"));
    temporary.push(root);
    const managedPath = path.join(root, "managed.txt");
    const descriptor = { path: "managed.txt", kind: "integration" as const, owner: "aider" };
    await writeFile(managedPath, "managed\n", "utf8");
    await updateManifest(root, { files: [descriptor], integrations: ["aider"] });
    await rm(managedPath);

    await updateManifest(root, { files: [descriptor], integrations: ["aider"] });
    expect((await readManifest(root))?.files.some((file) => file.path === descriptor.path)).toBe(false);
  });

  it("passes a healthy initialized repository while reporting optional AI setup", async () => {
    const { root } = await initializedFixture();
    const report = await validateRepository(root);
    expect(report.valid).toBe(true);
    expect(report.checks).toContainEqual(expect.objectContaining({ id: "AI_RUNTIME", status: "warning" }));
  });

  it("treats warnings as failures in strict mode and exposes exit code 4", async () => {
    const { root, templates } = await initializedFixture();
    const stdout: string[] = [];
    const output = new Output({ stdout: memoryStream(stdout), stderr: memoryStream([]), color: false });
    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "validate", "--strict", "--json"]);

    expect(JSON.parse(stdout.join(""))).toMatchObject({ schemaVersion: 1, strict: true, valid: false });
    expect(process.exitCode).toBe(4);
  });

  it("fails when configured runtimes have no ownership manifest", async () => {
    const { root } = await initializedFixture();
    await updateManifest(root, { files: [], integrations: ["codex"] });
    const report = await validateRepository(root);
    expect(report.valid).toBe(false);
    expect(report.checks).toContainEqual(expect.objectContaining({ id: "AI_RUNTIME", status: "error" }));
  });
});

describe("doctor exit semantics", () => {
  it("fails only for blocking checks", () => {
    expect(hasBlockingDoctorIssue({ checks: [{ id: "GIT", status: "warning", detail: "not found" }] })).toBe(false);
    expect(hasBlockingDoctorIssue({ checks: [{ id: "PERMISSIONS", status: "error", detail: "not writable" }] })).toBe(true);
  });
});
