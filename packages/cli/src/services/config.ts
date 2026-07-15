import os from "node:os";
import path from "node:path";
import { CliError, errorMessage } from "../core/errors.js";
import { pathExists, readJson, walkParents, writeJsonAtomic } from "../core/fs.js";

export const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

export interface Preferences {
  packageManager?: PackageManager;
  defaultBranch?: string;
  initializeGit?: boolean;
  updateCheck?: boolean;
  template?: string;
}

export interface UserConfig {
  schemaVersion: 1;
  preferences: Preferences;
}

export interface ProjectConfig extends UserConfig {
  project: {
    name: string;
    initializedAt: string;
  };
}

export const CONFIG_KEYS = [
  "packageManager",
  "defaultBranch",
  "initializeGit",
  "updateCheck",
  "template",
] as const;
export type ConfigKey = (typeof CONFIG_KEYS)[number];

const booleanKeys = new Set<ConfigKey>(["initializeGit", "updateCheck"]);

export function globalConfigPath(env: NodeJS.ProcessEnv = process.env, platform = process.platform): string {
  if (env.MSTACK_CONFIG_HOME) return path.join(env.MSTACK_CONFIG_HOME, "config.json");
  if (platform === "win32") return path.win32.join(env.APPDATA ?? path.win32.join(os.homedir(), "AppData", "Roaming"), "mstack", "config.json");
  return path.join(env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config"), "mstack", "config.json");
}

export function projectConfigPath(root: string): string {
  return path.join(root, ".mstack", "config.json");
}

export async function findProjectRoot(start: string): Promise<string | undefined> {
  for (const directory of walkParents(start)) {
    if (await pathExists(projectConfigPath(directory))) return directory;
  }
  return undefined;
}

async function loadConfig<T extends UserConfig>(filePath: string): Promise<T | undefined> {
  if (!(await pathExists(filePath))) return undefined;
  try {
    const config = await readJson<T>(filePath);
    if (config.schemaVersion !== 1 || typeof config.preferences !== "object" || config.preferences === null) {
      throw new Error("unsupported or invalid schema");
    }
    return config;
  } catch (error) {
    throw new CliError(`Could not read configuration at ${filePath}: ${errorMessage(error)}`, {
      hints: ["Fix the JSON file or remove it and run mstack init again."],
      cause: error,
    });
  }
}

export class ConfigStore {
  readonly cwd: string;
  readonly globalPath: string;

  constructor(options: { cwd?: string; globalPath?: string } = {}) {
    this.cwd = path.resolve(options.cwd ?? process.cwd());
    this.globalPath = options.globalPath ?? globalConfigPath();
  }

  async projectRoot(): Promise<string | undefined> {
    return findProjectRoot(this.cwd);
  }

  async global(): Promise<UserConfig> {
    return (await loadConfig<UserConfig>(this.globalPath)) ?? { schemaVersion: 1, preferences: {} };
  }

  async project(): Promise<ProjectConfig | undefined> {
    const root = await this.projectRoot();
    return root ? loadConfig<ProjectConfig>(projectConfigPath(root)) : undefined;
  }

  async resolved(): Promise<Preferences> {
    const [global, project] = await Promise.all([this.global(), this.project()]);
    return { ...global.preferences, ...project?.preferences };
  }

  async set(key: ConfigKey, rawValue: string, scope: "global" | "project"): Promise<string> {
    const value = parseConfigValue(key, rawValue);
    const filePath = await this.scopePath(scope);
    if (scope === "global") {
      const config = await this.global();
      config.preferences[key] = value as never;
      await writeJsonAtomic(filePath, config);
    } else {
      const config = await this.requireProject();
      config.preferences[key] = value as never;
      await writeJsonAtomic(filePath, config);
    }
    return filePath;
  }

  async unset(key: ConfigKey, scope: "global" | "project"): Promise<string> {
    const filePath = await this.scopePath(scope);
    if (scope === "global") {
      const config = await this.global();
      delete config.preferences[key];
      await writeJsonAtomic(filePath, config);
    } else {
      const config = await this.requireProject();
      delete config.preferences[key];
      await writeJsonAtomic(filePath, config);
    }
    return filePath;
  }

  private async requireProject(): Promise<ProjectConfig> {
    const config = await this.project();
    if (!config) {
      throw new CliError("This directory is not part of an mstack project.", {
        hints: ["Run mstack init first, or pass --global."],
      });
    }
    return config;
  }

  private async scopePath(scope: "global" | "project"): Promise<string> {
    if (scope === "global") return this.globalPath;
    const root = await this.projectRoot();
    if (!root) throw new CliError("This directory is not part of an mstack project.", { hints: ["Run mstack init first, or pass --global."] });
    return projectConfigPath(root);
  }
}

export function isConfigKey(value: string): value is ConfigKey {
  return CONFIG_KEYS.includes(value as ConfigKey);
}

export function parseConfigValue(key: ConfigKey, raw: string): Preferences[ConfigKey] {
  if (booleanKeys.has(key)) {
    if (raw === "true") return true;
    if (raw === "false") return false;
    throw new CliError(`${key} must be true or false.`);
  }
  if (key === "packageManager" && !PACKAGE_MANAGERS.includes(raw as PackageManager)) {
    throw new CliError(`packageManager must be one of: ${PACKAGE_MANAGERS.join(", ")}.`);
  }
  if (!raw.trim()) throw new CliError(`${key} cannot be empty.`);
  return raw as Preferences[ConfigKey];
}
