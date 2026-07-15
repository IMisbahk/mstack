import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Writable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import { createProgram } from "../src/program.js";
import { Output } from "../src/core/output.js";
import { inspectRepository } from "../src/services/health.js";
import { detectRuntimes } from "../src/services/runtimes.js";
import { createDefaultRegistry } from "../../ai-integrations/src/index.js";
import { makeTemplates } from "./helpers.js";

const temporary: string[] = [];
afterEach(async () => Promise.all(temporary.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))));

function memoryStream(buffer: string[]): NodeJS.WriteStream {
  return new Writable({ write(chunk, _encoding, callback) { buffer.push(String(chunk)); callback(); } }) as NodeJS.WriteStream;
}

async function fixture(): Promise<{ root: string; templates: string; output: Output; stdout: string[]; stderr: string[] }> {
  const root = await mkdtemp(path.join(os.tmpdir(), "mstack-vnext-"));
  temporary.push(root);
  const templates = await makeTemplates(root);
  const stdout: string[] = [];
  const stderr: string[] = [];
  return { root, templates, stdout, stderr, output: new Output({ stdout: memoryStream(stdout), stderr: memoryStream(stderr), color: false }) };
}

describe("vNext developer experience", () => {
  it("reruns initialization safely and preserves changed documents", async () => {
    const { root, templates, output } = await fixture();
    const args = ["node", "mstack", "init", ".", "--yes", "--no-git"];
    await createProgram({ cwd: root, templatesDirectory: templates, output }).parseAsync(args);
    await writeFile(path.join(root, "docs", "product.md"), "# My product\n");
    await createProgram({ cwd: root, templatesDirectory: templates, output }).parseAsync(args);
    expect(await readFile(path.join(root, "docs", "product.md"), "utf8")).toBe("# My product\n");
    expect((await inspectRepository(root)).manifest).toBe(".mstack/manifest.json");
  });

  it("installs a complete AI pack for selected runtimes", async () => {
    const { root, templates, output } = await fixture();
    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "init", ".", "--yes", "--no-git"]);
    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "ai", "setup", "codex", "continue", "--yes"]);

    expect(await readFile(path.join(root, "AGENTS.md"), "utf8")).toContain("mstack:project-instructions:start");
    expect(await readFile(path.join(root, ".agents", "skills", "feature-planning", "SKILL.md"), "utf8")).toContain("Build Like This");
    expect(await readFile(path.join(root, ".continue", "prompts", "build-feature.md"), "utf8")).toContain("invokable: true");
    expect(await readFile(path.join(root, ".continue", "agents", "product-manager.md"), "utf8")).toContain("product and engineering judgment");
    expect(await readFile(path.join(root, ".mstack", "runtime", "hooks", "repository-health.mjs"), "utf8")).toContain("repository health");
    const manifest = JSON.parse(await readFile(path.join(root, ".mstack", "manifest.json"), "utf8"));
    expect(manifest.integrations).toEqual(["codex", "continue"]);
  });

  it("keeps AI dry runs read-only", async () => {
    const { root, templates, output } = await fixture();
    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "init", ".", "--yes", "--no-git"]);
    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "ai", "setup", "codex", "--dry-run", "--yes"]);
    await expect(readFile(path.join(root, "AGENTS.md"))).rejects.toThrow();
  });

  it("requires explicit approval for privileged resources in non-interactive setup", async () => {
    const { root, templates, output } = await fixture();
    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "init", ".", "--yes", "--no-git"]);

    await expect(createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "ai", "setup", "codex"]))
      .rejects.toThrow("requires explicit approval");
    await expect(readFile(path.join(root, "AGENTS.md"))).rejects.toThrow();
  });

  it("derives runtime detection from adapter metadata", async () => {
    const { root } = await fixture();
    await mkdir(path.join(root, ".cursor"));
    const detected = await detectRuntimes(root, createDefaultRegistry(), async (command) => command === "codex");
    expect(detected.find((runtime) => runtime.id === "codex")?.installed).toBe(true);
    expect(detected.find((runtime) => runtime.id === "cursor")?.configured).toBe(true);
  });

  it("emits stable plain output without ANSI escapes", async () => {
    const { root, templates, output, stdout } = await fixture();
    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "init", ".", "--yes", "--no-git"]);
    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "status"]);
    expect(stdout.join("")).not.toMatch(/\u001B\[/);
  });

  it("emits versioned JSON for repository and AI automation", async () => {
    const { root, templates, output } = await fixture();
    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "init", ".", "--yes", "--no-git"]);

    const statusLines: string[] = [];
    const statusOutput = new Output({ stdout: memoryStream(statusLines), stderr: memoryStream([]), color: false });
    await createProgram({ cwd: root, templatesDirectory: templates, output: statusOutput })
      .parseAsync(["node", "mstack", "status", "--json"]);
    expect(JSON.parse(statusLines.join("")).schemaVersion).toBe(1);

    const aiLines: string[] = [];
    const aiOutput = new Output({ stdout: memoryStream(aiLines), stderr: memoryStream([]), color: false });
    await createProgram({ cwd: root, templatesDirectory: templates, output: aiOutput })
      .parseAsync(["node", "mstack", "ai", "setup", "codex", "--dry-run", "--yes", "--json"]);
    expect(JSON.parse(aiLines.join(""))).toMatchObject({ schemaVersion: 1, mode: "dry-run", runtimes: ["codex"] });
  });

  it("does not mistake Markdown links and checkboxes for template placeholders", async () => {
    const { root, templates, output } = await fixture();
    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "init", ".", "--yes", "--no-git"]);
    await writeFile(path.join(root, "docs", "product.md"), "# Product\n\nRead the [guide](https://example.com).\n\n- [x] Approved\n");
    await writeFile(path.join(root, "docs", "architecture.md"), "# Architecture\n\nThe system is intentionally simple.\n");
    expect((await inspectRepository(root)).setup).toBe("complete");
  });
});
