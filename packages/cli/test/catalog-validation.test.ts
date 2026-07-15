import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Writable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import { buildCatalog } from "../src/commands/catalog.js";
import { hasBlockingDoctorIssue } from "../src/commands/doctor.js";
import { validateRepository } from "../src/commands/validate.js";
import { Output } from "../src/core/output.js";
import { createProgram } from "../src/program.js";
import { updateManifest } from "../src/services/manifest.js";
import { makeTemplates } from "./helpers.js";

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
    const complete = buildCatalog();
    expect(complete.counts).toEqual({ agents: 12, skills: 10, prompts: 9, hooks: 3, templates: 8 });
    expect(complete.items).toHaveLength(42);

    const agents = buildCatalog("agents");
    expect(agents.items).toHaveLength(12);
    expect(agents.items.every((item) => item.kind === "agents")).toBe(true);
    expect(agents.items.some((item) => item.id === "product-manager")).toBe(true);
  });

  it("emits a versioned JSON catalog through the public CLI", async () => {
    const stdout: string[] = [];
    const output = new Output({ stdout: memoryStream(stdout), stderr: memoryStream([]), color: false });
    await createProgram({ output }).parseAsync(["node", "mstack", "catalog", "hooks", "--json"]);
    expect(JSON.parse(stdout.join(""))).toMatchObject({ schemaVersion: 1, counts: { hooks: 3 } });
  });
});

describe("repository validation", () => {
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
