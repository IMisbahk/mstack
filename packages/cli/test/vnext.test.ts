import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Writable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import { createProgram } from "../src/program.js";
import { Output } from "../src/core/output.js";
import { inspectRepository } from "../src/services/health.js";
import { detectRuntimes } from "../src/services/runtimes.js";
import { updateManifest } from "../src/services/manifest.js";
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

  it("hands a fresh idea-less project to AI setup and discovery without duplicate next steps", async () => {
    const { root, templates, output, stdout } = await fixture();
    await writeFile(path.join(templates, "product.template.md"), "# Product\n\n[Describe the product]\n");
    await writeFile(path.join(templates, "architecture.template.md"), "# Architecture\n\n[Describe the system]\n");
    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "init", ".", "--yes", "--no-git"]);

    const transcript = stdout.join("");
    expect(transcript.match(/mstack ai setup/g)).toHaveLength(1);
    expect(transcript).toContain("research-idea");
    expect(transcript).toContain("write-product-definition");
    expect(transcript).not.toContain("Design the system");
  });

  it("routes a product-ready project with draft architecture to architecture design", async () => {
    const { root, templates, output, stdout } = await fixture();
    await writeFile(path.join(templates, "product.template.md"), "# Product\n\nA defined user need and outcome.\n");
    await writeFile(path.join(templates, "architecture.template.md"), "# Architecture\n\n[Describe the system]\n");
    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "init", ".", "--yes", "--no-git"]);

    const transcript = stdout.join("");
    expect(transcript).toContain("design-architecture");
    expect(transcript).not.toContain("research-idea");
    expect(transcript).not.toContain("write-product-definition");
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

  it("installs every verified native and portable compatibility surface together", async () => {
    const { root, templates, output } = await fixture();
    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "init", ".", "--yes", "--no-git"]);
    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "ai", "setup", "--all", "--yes"]);

    expect(await readFile(path.join(root, "AGENTS.md"), "utf8")).toContain("mstack:project-instructions:start");
    expect(await readFile(path.join(root, ".agents", "hooks.json"), "utf8")).toContain("PostInvocation");
    expect(await readFile(path.join(root, ".agents", "agents", "product-manager", "agent.md"), "utf8")).toContain("name: \"product-manager\"");
    expect(await readFile(path.join(root, ".github", "prompts", "build-feature.prompt.md"), "utf8")).toContain("Build the requested feature");
    expect(await readFile(path.join(root, ".opencode", "agents", "software-architect.md"), "utf8")).toContain("mode: subagent");
    expect(await readFile(path.join(root, ".kiro", "skills", "build-feature", "SKILL.md"), "utf8")).toContain("Build the requested feature");
    expect(await readFile(path.join(root, ".qwen", "commands", "build-feature.md"), "utf8")).toContain("Build the requested feature");
    expect(await readFile(path.join(root, ".junie", "agents", "backend-engineer.md"), "utf8")).toContain("backend application behavior");
    expect(await readFile(path.join(root, ".cline", "skills", "mstack-agent-code-reviewer", "SKILL.md"), "utf8")).toContain("code-reviewer specialist pass");
    expect(await readFile(path.join(root, ".roo", "commands", "build-feature.md"), "utf8")).toContain("Build the requested feature");

    const manifest = JSON.parse(await readFile(path.join(root, ".mstack", "manifest.json"), "utf8"));
    expect(manifest.integrations).toEqual([
      "aider", "antigravity", "claude-code", "cline", "codex", "continue", "cursor", "gemini-cli",
      "github-copilot", "junie", "kimi-code", "kiro", "opencode", "qwen-code", "roo-code",
    ]);
    expect(manifest.files.find((file: { path: string }) => file.path === "AGENTS.md")?.owner).toBe("mstack-ai-runtime");
  });

  it("retains previously configured runtimes when reconciling an explicit subset", async () => {
    const { root, templates, output } = await fixture();
    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "init", ".", "--yes", "--no-git"]);
    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "ai", "setup", "codex", "continue", "--yes"]);
    const continuePrompt = path.join(root, ".continue", "prompts", "build-feature.md");
    const before = await readFile(continuePrompt, "utf8");

    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "ai", "setup", "codex", "--yes"]);

    expect(await readFile(continuePrompt, "utf8")).toBe(before);
    const manifest = JSON.parse(await readFile(path.join(root, ".mstack", "manifest.json"), "utf8"));
    expect(manifest.integrations).toEqual(["codex", "continue"]);
    const runtimeManifest = JSON.parse(await readFile(path.join(root, ".mstack", "runtime", "manifest.json"), "utf8"));
    expect(runtimeManifest.resources.some((resource: { path: string }) => resource.path.startsWith(".continue/"))).toBe(true);
  });

  it("uses the configured project identity in generated runtime guidance", async () => {
    const { root, templates, output } = await fixture();
    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "init", ".", "--name", "Acme", "--yes", "--no-git"]);
    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "ai", "setup", "codex", "--yes"]);

    const instructions = await readFile(path.join(root, "AGENTS.md"), "utf8");
    expect(instructions).toContain("# Acme");
    expect(instructions).toContain("This host repository is the project being built");
    expect(instructions).toContain("Build Like This is the engineering method");
    expect(instructions).toContain("mstack is the installer");
    expect(instructions).toContain("docs/ directory, code, and tests as its sources of truth");
    expect(instructions).toContain(".mstack/templates/ only as reference scaffolds");
  });

  it("routes draft projects through idea, product, and architecture prompts", async () => {
    const { root, templates, output } = await fixture();
    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "init", ".", "--yes", "--no-git"]);
    await writeFile(path.join(root, "docs", "product.md"), "# Product\n\n[Describe the product]\n");
    await writeFile(path.join(root, "docs", "architecture.md"), "# Architecture\n\n[Describe the system]\n");

    const unconfigured = await inspectRepository(root);
    expect(unconfigured.next.command).toBe("mstack ai setup");
    expect(unconfigured.next.message).toContain("research-idea");

    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "ai", "setup", "codex", "--yes"]);
    const productDraft = await inspectRepository(root);
    expect(productDraft.next.path).toBe("docs/product.md");
    expect(productDraft.next.message).toContain("research-idea");
    expect(productDraft.next.message).toContain("write-product-definition");

    await writeFile(path.join(root, "docs", "product.md"), "# Product\n\nA product for a defined user and need.\n");
    const architectureDraft = await inspectRepository(root);
    expect(architectureDraft.next.path).toBe("docs/architecture.md");
    expect(architectureDraft.next.message).toContain("design-architecture");
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

  it("uses manifest ownership instead of shared compatibility files for configured detection", async () => {
    const { root } = await fixture();
    await mkdir(path.join(root, ".agents", "skills"), { recursive: true });
    await mkdir(path.join(root, ".claude", "rules"), { recursive: true });
    await writeFile(path.join(root, "AGENTS.md"), "# Shared guidance\n");
    await writeFile(path.join(root, "CLAUDE.md"), "# Compatible guidance\n");

    const before = await detectRuntimes(root, createDefaultRegistry(), async () => false);
    for (const id of ["claude-code", "codex", "kimi-code", "github-copilot", "opencode", "roo-code"]) {
      expect(before.find((runtime) => runtime.id === id)?.configured).toBe(false);
    }
    expect(before.find((runtime) => runtime.id === "roo-code")?.installed).toBe(false);

    await updateManifest(root, { files: [], integrations: ["kimi-code", "roo-code"] });
    const after = await detectRuntimes(root, createDefaultRegistry(), async () => false);
    expect(after.find((runtime) => runtime.id === "kimi-code")?.configured).toBe(true);
    expect(after.find((runtime) => runtime.id === "roo-code")?.configured).toBe(true);
    expect(after.find((runtime) => runtime.id === "codex")?.configured).toBe(false);
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
