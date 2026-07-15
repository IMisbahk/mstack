import path from "node:path";
import semver from "semver";
import { CliError, errorMessage } from "../core/errors.js";
import { run } from "../core/process.js";
import type { PackageManager } from "./config.js";

export interface RegistryPackage {
  latest: string;
}

export async function fetchLatestVersion(packageName: string, options: { timeoutMs?: number; registry?: string } = {}): Promise<RegistryPackage> {
  const registry = (options.registry ?? process.env.npm_config_registry ?? "https://registry.npmjs.org").replace(/\/$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5_000);
  try {
    const response = await fetch(`${registry}/${encodeURIComponent(packageName)}/latest`, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`registry returned ${response.status}`);
    const body = (await response.json()) as { version?: unknown };
    if (typeof body.version !== "string" || !semver.valid(body.version)) throw new Error("registry returned an invalid version");
    return { latest: body.version };
  } catch (error) {
    throw new CliError(`Could not check for updates: ${errorMessage(error)}`, { cause: error });
  } finally {
    clearTimeout(timeout);
  }
}

export function hasUpdate(current: string, latest: string): boolean {
  return semver.gt(latest, current);
}

export function updateCommand(manager: PackageManager, packageName: string): { command: string; args: string[]; display: string } {
  const spec = `${packageName}@latest`;
  switch (manager) {
    case "pnpm": return { command: "pnpm", args: ["add", "--global", spec], display: `pnpm add --global ${spec}` };
    case "yarn": return { command: "yarn", args: ["global", "add", spec], display: `yarn global add ${spec}` };
    case "bun": return { command: "bun", args: ["add", "--global", spec], display: `bun add --global ${spec}` };
    case "npm": return { command: "npm", args: ["install", "--global", spec], display: `npm install --global ${spec}` };
  }
}

export async function installDependencies(manager: PackageManager, cwd: string): Promise<void> {
  await run(manager, ["install"], { cwd: path.resolve(cwd), stdio: "inherit" });
}

export async function applyUpdate(manager: PackageManager, packageName: string): Promise<void> {
  const command = updateCommand(manager, packageName);
  await run(command.command, command.args, { stdio: "inherit" });
}
