import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Writable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import { createDefaultPackRegistry } from "../src/packs/index.js";
import { createProgram } from "../src/program.js";
import { Output } from "../src/core/output.js";

const temporary: string[] = [];
afterEach(async () => Promise.all(temporary.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))));
function stream(buffer: string[]): NodeJS.WriteStream { return new Writable({ write(chunk, _encoding, callback) { buffer.push(String(chunk)); callback(); } }) as NodeJS.WriteStream; }

describe("capability packs", () => {
  it("resolves pack dependencies and ships all named starter domains", () => {
    const registry = createDefaultPackRegistry();
    expect(registry.list()).toHaveLength(10);
    expect(registry.resolve(["robotics"]).map((pack) => pack.id)).toEqual(["systems", "embedded-firmware", "robotics"]);
    expect(registry.get("repository-intelligence").createSpec({ projectName: "fixture" }).agents).toHaveLength(5);
  });

  it("prints declarative task dry-run JSON without executing", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "mstack-task-")); temporary.push(root);
    const stdout: string[] = [];
    await createProgram({ cwd: root, output: new Output({ stdout: stream(stdout), stderr: stream([]), color: false }) })
      .parseAsync(["node", "mstack", "task", "run", "repository.status", "--dry-run", "--json"]);
    expect(JSON.parse(stdout.join(""))).toMatchObject({ schemaVersion: 1, mode: "dry-run", task: "repository.status", risk: "read-only" });
  });

  it("requires explicit noninteractive approval for a working-tree task", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "mstack-task-")); temporary.push(root);
    await expect(createProgram({ cwd: root, output: new Output({ stdout: stream([]), stderr: stream([]), color: false }) })
      .parseAsync(["node", "mstack", "task", "run", "dependencies.install", "--json"])).rejects.toThrow("explicit approval");
  });
});
