import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { scaffoldProject } from "../src/services/scaffold.js";
import { makeTemplates } from "./helpers.js";

const temporary: string[] = [];
afterEach(async () => Promise.all(temporary.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))));

async function temp(): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "mstack-scaffold-"));
  temporary.push(directory);
  return directory;
}

describe("scaffoldProject", () => {
  it("creates deterministic managed paths and project configuration", async () => {
    const root = await temp();
    const templatesDirectory = await makeTemplates(root);
    const target = path.join(root, "app");
    const result = await scaffoldProject({
      target,
      name: "app",
      templatesDirectory,
      includeTemplates: true,
      force: false,
      packageManager: "pnpm",
      now: new Date("2026-06-01T12:00:00.000Z"),
    });
    expect(result.created).toEqual([
      "docs/product.md",
      "docs/architecture.md",
      path.join("docs", "features", "_template.md"),
      path.join("docs", "decisions", "_template.md"),
    ]);
    expect(JSON.parse(await readFile(result.configPath, "utf8"))).toMatchObject({
      project: { name: "app", initializedAt: "2026-06-01T12:00:00.000Z" },
      preferences: { packageManager: "pnpm" },
    });
  });

  it("preserves user-owned documents while adding missing files", async () => {
    const root = await temp();
    const templatesDirectory = await makeTemplates(root);
    const target = path.join(root, "app");
    await mkdir(path.join(target, "docs"), { recursive: true });
    await writeFile(path.join(target, "docs", "product.md"), "keep me\n");
    const result = await scaffoldProject({ target, name: "app", templatesDirectory, includeTemplates: true, force: false });
    expect(result.preserved).toEqual(["docs/product.md"]);
    expect(await readFile(path.join(target, "docs", "product.md"), "utf8")).toBe("keep me\n");
    expect(await readFile(path.join(target, "docs", "architecture.md"), "utf8")).toBe("# Architecture\n");
  });

  it("can intentionally refresh managed files", async () => {
    const root = await temp();
    const templatesDirectory = await makeTemplates(root);
    const target = path.join(root, "app");
    await mkdir(path.join(target, "docs"), { recursive: true });
    await writeFile(path.join(target, "docs", "product.md"), "old\n");
    const result = await scaffoldProject({ target, name: "app", templatesDirectory, includeTemplates: true, force: true });
    expect(result.overwritten).toContain("docs/product.md");
    expect(result.backups).toHaveLength(1);
    expect(await readFile(path.join(target, result.backups[0]!), "utf8")).toBe("old\n");
    expect(await readFile(path.join(target, "docs", "product.md"), "utf8")).toBe("# Product\n");
  });
});
