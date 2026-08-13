import type { Output } from "../core/output.js";
import { CliError } from "../core/errors.js";
import { createDefaultPackRegistry } from "../packs/index.js";
import { recommendPacks } from "../packs/recommend.js";
import { readManifest, updateManifest } from "../services/manifest.js";
import { aiSetupCommand } from "./ai.js";
import { inspectRepository } from "../services/health.js";

export function packListCommand(output: Output, json: boolean): void {
  const packs = createDefaultPackRegistry().list().map((pack) => ({
    id: pack.id,
    version: pack.version,
    displayName: pack.displayName,
    description: pack.description,
    dependencies: pack.dependencies ?? [],
    requiredToolchains: pack.requiredToolchains ?? [],
    tasks: pack.tasks.map((task) => task.id),
  }));
  if (json) return output.json({ schemaVersion: 1, packs });
  output.title("mstack capability packs");
  for (const pack of packs) output.field(`${pack.id} ${pack.version}`, pack.description);
}

export function packInfoCommand(output: Output, id: string, json: boolean): void {
  const pack = createDefaultPackRegistry().get(id);
  const spec = pack.createSpec({ projectName: "Project" });
  const info = {
    id: pack.id,
    version: pack.version,
    displayName: pack.displayName,
    description: pack.description,
    dependencies: pack.dependencies ?? [],
    requiredToolchains: pack.requiredToolchains ?? [],
    agents: (spec.agents ?? []).map((agent) => agent.id),
    skills: (spec.skills ?? []).map((skill) => skill.id),
    prompts: (spec.prompts ?? []).map((prompt) => prompt.id),
    tasks: pack.tasks.map((task) => ({ id: task.id, risk: task.risk, description: task.description })),
  };
  if (json) {
    return output.json({
      schemaVersion: 1,
      pack: {
        id: pack.id,
        version: pack.version,
        displayName: pack.displayName,
        description: pack.description,
        dependencies: info.dependencies,
        requiredToolchains: info.requiredToolchains,
        risks: pack.risks ?? [],
        agents: info.agents,
        skills: info.skills,
        prompts: info.prompts,
        tasks: pack.tasks,
      },
    });
  }
  output.title(`${pack.displayName} ${pack.version}`);
  output.field("ID", pack.id);
  output.field("Description", pack.description);
  output.field("Dependencies", info.dependencies.join(", ") || "none");
  output.field("Toolchains", info.requiredToolchains.join(", ") || "none");
  output.field("Agents", info.agents.join(", ") || "none");
  output.field("Skills", info.skills.join(", ") || "none");
  output.field("Prompts", info.prompts.join(", ") || "none");
  output.field("Tasks", info.tasks.map((task) => task.id).join(", ") || "none");
}

export async function packRecommendCommand(cwd: string, output: Output, json: boolean): Promise<void> {
  const health = await inspectRepository(cwd);
  const report = await recommendPacks(health.root);
  if (json) return output.json(report);
  output.title("mstack pack recommend");
  if (report.recommendations.length === 0) {
    output.line("  No pack evidence was found in well-known repository markers.");
  }
  for (const item of report.recommendations) {
    const state = item.alreadySelected ? "selected" : "suggested";
    output.field(`${item.id} ${item.confidence}`, `${state} · ${item.reasons[0]}`);
    for (const reason of item.reasons.slice(1)) output.line(`               ${reason}`);
  }
  output.next(`Review a pack with ${output.command("mstack pack info <id>")} and install only after that review with ${output.command("mstack pack add <id>")}`);
}

export async function packAddCommand(options: { cwd: string; ids: readonly string[]; runtimes: readonly string[]; yes: boolean; dryRun: boolean; json: boolean; output: Output }): Promise<void> {
  const health = await inspectRepository(options.cwd);
  if (!health.initialized) throw new CliError("Build Like This is not initialized in this repository.", { exitCode: 2, hints: ["Run mstack init first."] });
  const registry = createDefaultPackRegistry();
  const current = (await readManifest(health.root))?.packs?.map((item) => item.id) ?? [];
  const selected = registry.resolve([...current, ...options.ids]);
  await aiSetupCommand({ cwd: health.root, runtimes: options.runtimes, all: false, yes: options.yes, dryRun: options.dryRun, force: false, json: options.json, output: options.output, packs: selected.map((item) => item.id) });
}

export async function packRemoveCommand(options: { cwd: string; ids: readonly string[]; yes: boolean; dryRun: boolean; json: boolean; output: Output }): Promise<void> {
  const health = await inspectRepository(options.cwd);
  if (!health.initialized) throw new CliError("Build Like This is not initialized in this repository.", { exitCode: 2 });
  const manifest = await readManifest(health.root);
  const present = manifest?.packs ?? [];
  const remove = new Set(options.ids);
  const remaining = present.filter((pack) => !remove.has(pack.id));
  if ((manifest?.integrations.length ?? 0) === 0) {
    if (options.dryRun) {
      if (options.json) return options.output.json({ schemaVersion: 1, mode: "dry-run", remove: options.ids, remaining });
      return;
    }
    await updateManifest(health.root, { files: [], packs: remaining });
    if (options.json) return options.output.json({ schemaVersion: 1, mode: "applied", remove: options.ids, remaining });
    options.output.success(`Removed ${options.ids.join(", ")} from the selected pack manifest.`);
    return;
  }
  await aiSetupCommand({ cwd: health.root, runtimes: manifest!.integrations, all: false, yes: options.yes, dryRun: options.dryRun, force: false, json: options.json, output: options.output, packs: remaining.map((pack) => pack.id) });
}
