import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { CliError } from "../core/errors.js";
import { pathExists, readJson, relativeRepositoryPath, writeFileAtomic, writeJsonAtomic } from "../core/fs.js";
import type { PackageManager, Preferences, ProjectConfig } from "./config.js";
import { projectConfigPath } from "./config.js";

const TEMPLATE_FILES = [
  ["product.template.md", "docs/product.md"],
  ["architecture.template.md", "docs/architecture.md"],
  ["feature.template.md", "docs/features/_template.md"],
  ["adr.template.md", "docs/decisions/_template.md"],
] as const;

export interface ScaffoldOptions {
  target: string;
  name: string;
  templatesDirectory: string;
  includeTemplates: boolean;
  force: boolean;
  dryRun?: boolean;
  packageManager?: PackageManager;
  preferences?: Preferences;
  now?: Date;
}

export interface ScaffoldResult {
  created: string[];
  overwritten: string[];
  preserved: string[];
  unchanged: string[];
  backups: string[];
  configPath: string;
}

interface WriteOperation {
  destination: string;
  content: string;
  existed: boolean;
  previous?: Buffer;
}

export async function scaffoldProject(options: ScaffoldOptions): Promise<ScaffoldResult> {
  const target = path.resolve(options.target);
  const operations: WriteOperation[] = [];
  const preserved: string[] = [];
  const unchanged: string[] = [];
  if (options.includeTemplates) {
    for (const [sourceName, destinationName] of TEMPLATE_FILES) {
      const source = path.join(options.templatesDirectory, sourceName);
      if (!(await pathExists(source))) {
        throw new CliError(`The packaged template ${sourceName} is missing.`, {
          hints: ["Reinstall mstack and try again."],
        });
      }
      const destination = path.join(target, destinationName);
      const existed = await pathExists(destination);
      const content = await readFile(source, "utf8");
      const previous = existed ? await readFile(destination) : undefined;
      if (previous?.toString("utf8") === content) {
        unchanged.push(destinationName);
      } else if (existed && !options.force) {
        preserved.push(destinationName);
      } else {
        operations.push({ destination, content, existed, ...(previous ? { previous } : {}) });
      }
    }
  }

  const configPath = projectConfigPath(target);
  const configExisted = await pathExists(configPath);
  const existingConfig = configExisted ? await readJson<ProjectConfig>(configPath) : undefined;

  if (options.dryRun) {
    return {
      created: operations.filter((operation) => !operation.existed).map((operation) => relativeRepositoryPath(target, operation.destination)),
      overwritten: operations.filter((operation) => operation.existed).map((operation) => relativeRepositoryPath(target, operation.destination)),
      preserved,
      unchanged,
      backups: [],
      configPath,
    };
  }

  await mkdir(target, { recursive: true });
  const completed: WriteOperation[] = [];
  const backups: string[] = [];
  try {
    for (const operation of operations) {
      await mkdir(path.dirname(operation.destination), { recursive: true });
      if (operation.existed && operation.previous) {
        const backup = `${operation.destination}.mstack-backup-${new Date().toISOString().replace(/[:.]/g, "-")}`;
        await writeFile(backup, operation.previous);
        backups.push(relativeRepositoryPath(target, backup));
      }
      await writeFileAtomic(operation.destination, operation.content);
      completed.push(operation);
    }

    const preferences: Preferences = {
      ...existingConfig?.preferences,
      ...options.preferences,
      ...(options.packageManager ? { packageManager: options.packageManager } : {}),
    };
    const config: ProjectConfig = {
      schemaVersion: 1,
      project: {
        name: existingConfig?.project.name ?? options.name,
        initializedAt: existingConfig?.project.initializedAt ?? (options.now ?? new Date()).toISOString(),
      },
      preferences,
    };
    await writeJsonAtomic(configPath, config);
  } catch (error) {
    for (const operation of completed.reverse()) {
      if (operation.existed && operation.previous) await writeFile(operation.destination, operation.previous);
      else await rm(operation.destination, { force: true });
    }
    throw error;
  }

  return {
    created: operations.filter((operation) => !operation.existed).map((operation) => relativeRepositoryPath(target, operation.destination)),
    overwritten: operations.filter((operation) => operation.existed).map((operation) => relativeRepositoryPath(target, operation.destination)),
    preserved,
    unchanged,
    backups,
    configPath,
  };
}

export function packagedTemplatesDirectory(): string {
  const bundled = fileURLToPath(new URL("../templates", import.meta.url));
  if (existsSync(bundled)) return bundled;
  return fileURLToPath(new URL("../../templates", import.meta.url));
}
