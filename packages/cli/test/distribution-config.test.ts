import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Writable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import { buildRuntimeResourceCounts } from "../../ai-integrations/src/index.js";
import { doctorCommand } from "../src/commands/doctor.js";
import { Output } from "../src/core/output.js";
import { writeJsonAtomic } from "../src/core/fs.js";
import { createProgram } from "../src/program.js";
import { detectDuplicateSkillInstalls, writeInstallChannel } from "../src/services/distribution.js";
import { parseConfigValue } from "../src/services/config.js";
import { makeTemplates } from "./helpers.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const temporary: string[] = [];
const resourceCountsPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../ai-integrations/src/generated/resource-counts.json");
afterEach(async () => {
  process.exitCode = undefined;
  await Promise.all(temporary.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

function memoryStream(buffer: string[]): NodeJS.WriteStream {
  return new Writable({ write(chunk, _encoding, callback) { buffer.push(String(chunk)); callback(); } }) as NodeJS.WriteStream;
}

async function initializedFixture(): Promise<{ root: string; templates: string }> {
  const root = await mkdtemp(path.join(os.tmpdir(), "mstack-distribution-"));
  temporary.push(root);
  const templates = await makeTemplates(root);
  const output = new Output({ stdout: memoryStream([]), stderr: memoryStream([]), color: false });
  await createProgram({ cwd: root, templatesDirectory: templates, output })
    .parseAsync(["node", "mstack", "init", ".", "--yes", "--no-git"]);
  return { root, templates };
}

describe("distribution and runtime config", () => {
  it("accepts installProfile and arena config values", () => {
    expect(parseConfigValue("installProfile", "lite")).toBe("lite");
    expect(parseConfigValue("arena", "true")).toBe(true);
    expect(() => parseConfigValue("installProfile", "huge")).toThrow(/lite, full/);
  });

  it("blocks cli setup when a skills.sh lock overlaps the cli channel", async () => {
    const { root, templates } = await initializedFixture();
    await writeInstallChannel(root, "cli", "full");
    await writeFile(path.join(root, "skills-lock.json"), "{}\n");
    const findings = await detectDuplicateSkillInstalls(root);
    expect(findings.some((finding) => finding.code === "skills-sh-lock" && finding.level === "error")).toBe(true);

    const stdout: string[] = [];
    const stderr: string[] = [];
    const output = new Output({ stdout: memoryStream(stdout), stderr: memoryStream(stderr), color: false });
    await expect(
      createProgram({ cwd: root, templatesDirectory: templates, output })
        .parseAsync(["node", "mstack", "ai", "setup", "codex", "--yes", "--json"]),
    ).rejects.toThrow(/overlapping channels|AI runtime|skills/);
  });

  it("writes model roles, install channel, and lite profile through ai setup", async () => {
    const { root, templates } = await initializedFixture();
    const stdout: string[] = [];
    const output = new Output({ stdout: memoryStream(stdout), stderr: memoryStream([]), color: false });
    await createProgram({ cwd: root, templatesDirectory: templates, output })
      .parseAsync(["node", "mstack", "ai", "setup", "codex", "--profile", "lite", "--arena", "--yes", "--json"]);
    const report = JSON.parse(stdout.join(""));
    expect(report.profile).toBe("lite");
    expect(report.arena).toBe(true);
    expect(report.modelRoles.code).toBeTruthy();
    expect(report.tokenBudget.totals.alwaysOnTokens).toBeGreaterThan(0);
    expect(report.tokenBudget.totals.resources).toBeLessThan(buildRuntimeResourceCounts().agents + buildRuntimeResourceCounts().skills + buildRuntimeResourceCounts().prompts);

    const roles = JSON.parse(await (await import("node:fs/promises")).readFile(path.join(root, ".mstack/model-roles.json"), "utf8"));
    expect(roles.schemaVersion).toBe(1);
    expect(roles.arena).toBe(true);
    const channel = JSON.parse(await (await import("node:fs/promises")).readFile(path.join(root, ".mstack/install-channel.json"), "utf8"));
    expect(channel).toMatchObject({ channel: "cli", profile: "lite" });
  });

  it("reports context cost from doctor and status json", async () => {
    const { root } = await initializedFixture();
    await writeInstallChannel(root, "cli", "full");
    const stdout: string[] = [];
    const output = new Output({ stdout: memoryStream(stdout), stderr: memoryStream([]), color: false });
    const doctor = await doctorCommand(root, output, true);
    expect(doctor.contextCost?.alwaysOnTokens).toBeGreaterThan(0);
    expect(doctor.checks.some((check) => check.id === "CONTEXT")).toBe(true);

    stdout.length = 0;
    await createProgram({ cwd: root, output: new Output({ stdout: memoryStream(stdout), stderr: memoryStream([]), color: false }) })
      .parseAsync(["node", "mstack", "status", "--json"]);
    const status = JSON.parse(stdout.join(""));
    expect(status.contextCost.profile).toBe("full");
    expect(status.contextCost.alwaysOnTokens).toBeGreaterThan(0);
  });

  it("keeps committed resource counts aligned with the registry helper", () => {
    const live = buildRuntimeResourceCounts();
    const generated = JSON.parse(readFileSync(resourceCountsPath, "utf8"));
    expect(generated).toEqual(live);
  });

  it("ships a pstack-shaped Cursor plugin under distribution/mstack", async () => {
    const { access } = await import("node:fs/promises");
    const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../distribution/mstack");
    await access(path.join(pluginRoot, ".cursor-plugin/plugin.json"));
    await access(path.join(pluginRoot, "skills/mstack/SKILL.md"));
    await access(path.join(pluginRoot, "commands/mstack.md"));
    await access(path.join(pluginRoot, "hooks/hooks.json"));
    const manifest = JSON.parse(readFileSync(path.join(pluginRoot, ".cursor-plugin/plugin.json"), "utf8"));
    expect(manifest.name).toBe("mstack");
    expect(manifest.skills).toBe("./skills/");
    expect(manifest.commands).toBe("./commands/");
    const router = readFileSync(path.join(pluginRoot, "skills/mstack/SKILL.md"), "utf8");
    expect(router).toMatch(/mode: true/);
    expect(router).toMatch(/\/mstack/);
  });
});
