import { mkdtemp, mkdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { rm } from "node:fs/promises";
import { ConfigStore, globalConfigPath, parseConfigValue, projectConfigPath } from "../src/services/config.js";
import { writeJsonAtomic } from "../src/core/fs.js";

const temporary: string[] = [];
afterEach(async () => Promise.all(temporary.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))));

async function temp(): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "mstack-config-"));
  temporary.push(directory);
  return directory;
}

describe("ConfigStore", () => {
  it("merges project preferences over global preferences from nested directories", async () => {
    const root = await temp();
    const globalPath = path.join(root, "global.json");
    const nested = path.join(root, "project", "src");
    await mkdir(nested, { recursive: true });
    await writeJsonAtomic(globalPath, { schemaVersion: 1, preferences: { packageManager: "npm", updateCheck: true } });
    await writeJsonAtomic(projectConfigPath(path.join(root, "project")), {
      schemaVersion: 1,
      project: { name: "sample", initializedAt: "2026-01-01T00:00:00.000Z" },
      preferences: { packageManager: "pnpm" },
    });

    const store = new ConfigStore({ cwd: nested, globalPath });
    expect(await store.resolved()).toEqual({ packageManager: "pnpm", updateCheck: true });
  });

  it("writes project and global settings atomically", async () => {
    const root = await temp();
    const globalPath = path.join(root, "global.json");
    await writeJsonAtomic(projectConfigPath(root), {
      schemaVersion: 1,
      project: { name: "sample", initializedAt: "2026-01-01T00:00:00.000Z" },
      preferences: {},
    });
    const store = new ConfigStore({ cwd: root, globalPath });
    await store.set("initializeGit", "false", "project");
    await store.set("packageManager", "bun", "global");
    expect(JSON.parse(await readFile(projectConfigPath(root), "utf8")).preferences.initializeGit).toBe(false);
    expect(JSON.parse(await readFile(globalPath, "utf8")).preferences.packageManager).toBe("bun");
  });

  it("validates typed values", () => {
    expect(parseConfigValue("updateCheck", "true")).toBe(true);
    expect(() => parseConfigValue("packageManager", "pip")).toThrow(/must be one of/);
  });

  it("uses native Windows configuration paths", () => {
    expect(globalConfigPath({ APPDATA: "C:\\Users\\dev\\AppData\\Roaming" }, "win32"))
      .toBe("C:\\Users\\dev\\AppData\\Roaming\\mstack\\config.json");
  });
});
