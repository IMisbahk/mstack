import { spawn } from "node:child_process";
import path from "node:path";
import * as prompts from "@clack/prompts";
import type { Output } from "../core/output.js";
import { CliError } from "../core/errors.js";
import { createDefaultPackRegistry } from "../packs/index.js";
import type { TaskRisk } from "../packs/types.js";
import { ConfigStore } from "../services/config.js";

export function taskListCommand(output: Output, json: boolean): void { const tasks = createDefaultPackRegistry().list().flatMap((pack) => pack.tasks.map((task) => ({ ...task, pack: pack.id }))); if (json) return output.json({ schemaVersion: 1, tasks }); output.title("mstack task recipes"); for (const task of tasks) output.field(task.id, `${task.risk} · ${task.description}`); }
export function taskShowCommand(output: Output, id: string, json: boolean): void { const task = createDefaultPackRegistry().task(id); if (json) return output.json({ schemaVersion: 1, task }); output.title(task.id); output.field("Risk", task.risk); output.field("Steps", task.steps.map((step) => step.argv.join(" ")).join("; ")); output.field("Description", task.description); }
function needsConfirmation(policy: string, risk: TaskRisk): boolean { return policy === "strict" || (policy === "balanced" && risk !== "read-only"); }
export async function taskRunCommand(options: { cwd: string; id: string; yes: boolean; dryRun: boolean; json: boolean; inputs?: readonly string[]; output: Output }): Promise<void> {
  const task = createDefaultPackRegistry().task(options.id); const policy = (await new ConfigStore({ cwd: options.cwd }).resolved()).taskPolicy ?? "balanced";
  const inputs = new Map((options.inputs ?? []).map((raw) => { const index = raw.indexOf("="); if (index < 1) throw new CliError("Task inputs must use name=value.", { exitCode: 2 }); return [raw.slice(0, index), raw.slice(index + 1)]; }));
  for (const input of task.inputs ?? []) if (input.required && !inputs.get(input.name)) throw new CliError(`Task ${task.id} requires --input ${input.name}=...`, { exitCode: 2 });
  const steps = task.steps.map((step) => ({ ...step, argv: step.argv.map((part) => part.replace(/{{([a-zA-Z][a-zA-Z0-9_-]*)}}/g, (_match, name: string) => { const value = inputs.get(name); if (value === undefined) throw new CliError(`Missing task input: ${name}`, { exitCode: 2 }); return value; })) }));
  const confirmation = needsConfirmation(policy, task.risk);
  const resultBase = { schemaVersion: 1, task: task.id, policy, risk: task.risk, steps: steps.map((step) => ({ argv: step.argv })) };
  if (options.dryRun) { if (options.json) return options.output.json({ ...resultBase, mode: "dry-run" }); options.output.title(`mstack task run · ${task.id}`); steps.forEach((step) => options.output.line(step.argv.join(" "))); return; }
  if (policy === "automation" && task.risk !== "read-only" && !options.yes) {
    throw new CliError("Automation policy still requires --yes for a non-read-only task.", { exitCode: 3, hints: ["Review with --dry-run, then pass --yes."] });
  }
  if (confirmation && !options.yes) {
    if (!process.stdin.isTTY || !process.stdout.isTTY || options.json) throw new CliError("Task execution requires explicit approval.", { exitCode: 3, hints: ["Review with --dry-run, then pass --yes."] });
    const approved = await prompts.confirm({ message: `Run ${task.id} (${task.risk})?`, initialValue: false }); if (prompts.isCancel(approved) || !approved) throw new CliError("Task execution cancelled.", { exitCode: 130 });
  }
  const records: { argv: readonly string[]; exitCode: number; startedAt: string; finishedAt: string }[] = [];
  for (const step of steps) { const startedAt = new Date().toISOString(); const exitCode = await execute(step.argv, path.resolve(options.cwd, task.cwd ?? "."), task.timeoutMs); const finishedAt = new Date().toISOString(); records.push({ argv: step.argv, exitCode, startedAt, finishedAt }); if (exitCode !== 0) { if (options.json) return options.output.json({ ...resultBase, mode: "failed", failedStep: records.length, records }); throw new CliError(`Task ${task.id} failed at step ${records.length}: ${step.argv.join(" ")}`, { exitCode }); } }
  if (options.json) return options.output.json({ ...resultBase, mode: "completed", records }); options.output.success(`Completed ${task.id}`);
}
function execute(argv: readonly string[], cwd: string, timeoutMs = 120_000): Promise<number> { if (argv.length === 0) return Promise.resolve(1); return new Promise((resolve, reject) => { const child = spawn(argv[0]!, argv.slice(1), { cwd, stdio: "inherit", shell: false }); const timer = setTimeout(() => { child.kill("SIGTERM"); }, timeoutMs); child.once("error", reject); child.once("close", (code) => { clearTimeout(timer); resolve(code ?? 1); }); }); }
