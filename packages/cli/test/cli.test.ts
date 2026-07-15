import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Writable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import { createProgram } from "../src/program.js";
import { Output } from "../src/core/output.js";
import { pathExists } from "../src/core/fs.js";
import { makeTemplates } from "./helpers.js";

const temporary: string[] = [];
afterEach(async () => Promise.all(temporary.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))));

function memoryStream(buffer: string[]): NodeJS.WriteStream {
  return new Writable({
    write(chunk, _encoding, callback) {
      buffer.push(String(chunk));
      callback();
    },
  }) as NodeJS.WriteStream;
}

describe("CLI", () => {
  it("initializes a project non-interactively through the public command system", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "mstack-cli-"));
    temporary.push(root);
    const templatesDirectory = await makeTemplates(root);
    const stdout: string[] = [];
    const stderr: string[] = [];
    const output = new Output({ stdout: memoryStream(stdout), stderr: memoryStream(stderr) });
    const program = createProgram({ cwd: root, templatesDirectory, output });

    await program.parseAsync(["node", "mstack", "init", "web", "--yes", "--no-git", "--package-manager", "bun"]);

    const target = path.join(root, "web");
    const config = JSON.parse(await readFile(path.join(target, ".mstack", "config.json"), "utf8"));
    expect(config).toMatchObject({
      project: { name: "web" },
      preferences: { packageManager: "bun", initializeGit: false },
    });
    expect(await pathExists(path.join(target, "docs", "product.md"))).toBe(true);
    expect(await pathExists(path.join(target, ".git"))).toBe(false);
    expect(stdout.join("")).toContain("Initialized web");
    expect(stderr.join("")).toBe("");
  });

  it("supports configuration commands against an initialized project", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "mstack-cli-"));
    temporary.push(root);
    const templatesDirectory = await makeTemplates(root);
    const output = new Output({ stdout: memoryStream([]), stderr: memoryStream([]) });
    await createProgram({ cwd: root, templatesDirectory, output })
      .parseAsync(["node", "mstack", "init", ".", "--yes", "--no-git", "--no-templates"]);
    await createProgram({ cwd: root, templatesDirectory, output })
      .parseAsync(["node", "mstack", "config", "set", "updateCheck", "false"]);

    const config = JSON.parse(await readFile(path.join(root, ".mstack", "config.json"), "utf8"));
    expect(config.preferences.updateCheck).toBe(false);
  });
});
