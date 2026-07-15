import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { detectInvocationPackageManager, detectProject } from "../src/services/project.js";

const temporary: string[] = [];
afterEach(async () => Promise.all(temporary.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))));

describe("detectProject", () => {
  it("detects the launcher package manager", () => {
    expect(detectInvocationPackageManager({ npm_config_user_agent: "pnpm/10.0.0 npm/? node/v22" })).toBe("pnpm");
    expect(detectInvocationPackageManager({})).toBeUndefined();
  });

  it("finds package manager and framework from a parent project", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "mstack-project-"));
    temporary.push(root);
    await mkdir(path.join(root, "src", "nested"), { recursive: true });
    await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "web", dependencies: { next: "15.0.0" } }));
    await writeFile(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
    const project = await detectProject(path.join(root, "src", "nested"));
    expect(project).toMatchObject({ root, name: "web", packageManager: "pnpm", framework: "Next.js", hasPackageJson: true });
  });
});
