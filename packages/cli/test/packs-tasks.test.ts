import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Writable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import { engineeringAgents, engineeringPrompts, engineeringSkills } from "../../ai-integrations/src/index.js";
import { createDefaultPackRegistry } from "../src/packs/index.js";
import { recommendPacks } from "../src/packs/recommend.js";
import { createProgram } from "../src/program.js";
import { Output } from "../src/core/output.js";
import { CliError } from "../src/core/errors.js";
import { taskRunCommand } from "../src/commands/tasks.js";

const temporary: string[] = [];
afterEach(async () => Promise.all(temporary.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))));
function stream(buffer: string[]): NodeJS.WriteStream { return new Writable({ write(chunk, _encoding, callback) { buffer.push(String(chunk)); callback(); } }) as NodeJS.WriteStream; }

describe("capability packs", () => {
  it("resolves pack dependencies and ships all named starter domains", () => {
    const registry = createDefaultPackRegistry();
    expect(registry.list().map((pack) => pack.id)).toEqual([
      "repository-intelligence",
      "software-web",
      "systems",
      "embedded-firmware",
      "robotics",
      "data-ml",
      "mobile",
      "games-graphics",
      "infrastructure-security",
      "cli-devtools",
      "backend-api",
      "qa-testing",
      "observability",
      "documentation",
    ]);
    expect(registry.resolve(["robotics"]).map((pack) => pack.id)).toEqual(["systems", "embedded-firmware", "robotics"]);
    expect(registry.get("repository-intelligence").createSpec({ projectName: "fixture" }).agents).toHaveLength(6);
  });

  it("gives every pack specialists, skills, a prompt, and argv-only tasks with unique ids", () => {
    const registry = createDefaultPackRegistry();
    const agentIds: string[] = [...engineeringAgents.map((item) => item.id)];
    const skillIds: string[] = [...engineeringSkills.map((item) => item.id)];
    const promptIds: string[] = [...engineeringPrompts.map((item) => item.id)];
    const taskIds: string[] = [];
    for (const pack of registry.list()) {
      const spec = pack.createSpec({ projectName: "fixture" });
      expect(spec.agents?.length ?? 0).toBeGreaterThan(0);
      expect(spec.skills?.length ?? 0).toBeGreaterThan(0);
      expect(spec.prompts?.length ?? 0).toBeGreaterThan(0);
      expect(pack.tasks.length).toBeGreaterThan(0);
      for (const task of pack.tasks) {
        expect(task.steps.length).toBeGreaterThan(0);
        expect(task.steps.every((step) => step.argv.length > 0)).toBe(true);
        expect(taskIds).not.toContain(task.id);
        taskIds.push(task.id);
      }
      for (const agent of spec.agents ?? []) {
        expect(agentIds).not.toContain(agent.id);
        agentIds.push(agent.id);
      }
      for (const skill of spec.skills ?? []) {
        expect(skillIds).not.toContain(skill.id);
        skillIds.push(skill.id);
      }
      for (const prompt of spec.prompts ?? []) {
        expect(promptIds).not.toContain(prompt.id);
        promptIds.push(prompt.id);
      }
    }
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
    await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "fixture" }));
    await expect(createProgram({ cwd: root, output: new Output({ stdout: stream([]), stderr: stream([]), color: false }) })
      .parseAsync(["node", "mstack", "task", "run", "dependencies.install", "--json"])).rejects.toThrow("explicit approval");
  });

  it("filters task recipes by pack and risk", async () => {
    const stdout: string[] = [];
    await createProgram({ output: new Output({ stdout: stream(stdout), stderr: stream([]), color: false }) })
      .parseAsync(["node", "mstack", "task", "list", "--pack", "mobile", "--risk", "read-only", "--json"]);
    const report = JSON.parse(stdout.join(""));
    expect(report.pack).toBe("mobile");
    expect(report.risk).toBe("read-only");
    expect(report.tasks.length).toBeGreaterThan(0);
    expect(report.tasks.every((task: { pack: string; risk: string }) => task.pack === "mobile" && task.risk === "read-only")).toBe(true);
  });

  it("fails before execution when a file precondition is missing", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "mstack-precondition-")); temporary.push(root);
    await expect(taskRunCommand({
      cwd: root,
      id: "quality.lint",
      yes: true,
      dryRun: false,
      json: false,
      output: new Output({ stdout: stream([]), stderr: stream([]), color: false }),
    })).rejects.toThrow(/missing precondition package\.json/);
  });

  it("reports a missing executable as a location-specific failure", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "mstack-missing-bin-")); temporary.push(root);
    try {
      await taskRunCommand({
        cwd: root,
        id: "robotics.ros2-doctor",
        yes: true,
        dryRun: false,
        json: false,
        output: new Output({ stdout: stream([]), stderr: stream([]), color: false }),
      });
      throw new Error("expected missing executable to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(CliError);
      expect((error as CliError).message).toMatch(/could not find executable ros2/i);
      expect((error as CliError).exitCode).toBe(127);
    }
  });

  it("recommends packs from repository evidence without installing them", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "mstack-recommend-")); temporary.push(root);
    await mkdir(path.join(root, "docs"), { recursive: true });
    await mkdir(path.join(root, "prisma"), { recursive: true });
    await mkdir(path.join(root, ".git"));
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      name: "fixture",
      bin: { fixture: "cli.js" },
      dependencies: { next: "15.0.0", prisma: "6.0.0" },
      devDependencies: { vitest: "3.0.0" },
      scripts: { test: "vitest" },
    }));
    await writeFile(path.join(root, "prisma", "schema.prisma"), "generator client {\n  provider = \"prisma-client-js\"\n}\n");
    const report = await recommendPacks(root);
    const ids = report.recommendations.map((item) => item.id);
    expect(ids).toEqual(expect.arrayContaining([
      "repository-intelligence",
      "software-web",
      "backend-api",
      "qa-testing",
      "cli-devtools",
      "documentation",
    ]));
    expect(report.recommendations.every((item) => item.alreadySelected === false)).toBe(true);
  });
});
