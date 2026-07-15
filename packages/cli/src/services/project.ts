import path from "node:path";
import { readdir } from "node:fs/promises";
import { pathExists, readJson, walkParents } from "../core/fs.js";
import type { PackageManager } from "./config.js";

const lockfiles: ReadonlyArray<readonly [string, PackageManager]> = [
  ["pnpm-lock.yaml", "pnpm"],
  ["bun.lock", "bun"],
  ["bun.lockb", "bun"],
  ["yarn.lock", "yarn"],
  ["package-lock.json", "npm"],
  ["npm-shrinkwrap.json", "npm"],
];

export interface ProjectDetails {
  root: string;
  name: string;
  packageManager?: PackageManager;
  framework?: string;
  hasGit: boolean;
  hasPackageJson: boolean;
  isMstackProject: boolean;
}

export function detectInvocationPackageManager(env: NodeJS.ProcessEnv = process.env): PackageManager | undefined {
  const agent = env.npm_config_user_agent?.split(/[\s/]/)[0];
  return ["npm", "pnpm", "yarn", "bun"].includes(agent ?? "") ? agent as PackageManager : undefined;
}

interface PackageJson {
  name?: string;
  packageManager?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export async function detectPackageManager(root: string, packageJson?: PackageJson): Promise<PackageManager | undefined> {
  const declared = packageJson?.packageManager?.split("@")[0];
  if (["npm", "pnpm", "yarn", "bun"].includes(declared ?? "")) return declared as PackageManager;
  for (const [lockfile, manager] of lockfiles) {
    if (await pathExists(path.join(root, lockfile))) return manager;
  }
  return undefined;
}

function detectFramework(packageJson: PackageJson): string | undefined {
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  if (dependencies.next) return "Next.js";
  if (dependencies["@remix-run/react"]) return "Remix";
  if (dependencies["@sveltejs/kit"]) return "SvelteKit";
  if (dependencies.nuxt) return "Nuxt";
  if (dependencies.astro) return "Astro";
  if (dependencies.vite) return "Vite";
  if (dependencies.react) return "React";
  return undefined;
}

export async function detectProject(start: string, options: { searchParents?: boolean } = {}): Promise<ProjectDetails> {
  const resolved = path.resolve(start);
  let root = resolved;
  const candidates = options.searchParents === false ? [resolved] : walkParents(resolved);
  for (const candidate of candidates) {
    if (await pathExists(path.join(candidate, ".mstack", "config.json"))) {
      root = candidate;
      break;
    }
    if (await pathExists(path.join(candidate, "package.json")) || await pathExists(path.join(candidate, ".git"))) {
      root = candidate;
      break;
    }
  }

  const packagePath = path.join(root, "package.json");
  const hasPackageJson = await pathExists(packagePath);
  const packageJson: PackageJson = hasPackageJson ? await readJson<PackageJson>(packagePath).catch(() => ({})) : {};
  const packageManager = await detectPackageManager(root, packageJson);
  const framework = detectFramework(packageJson);
  return {
    root,
    name: packageJson.name ?? path.basename(root),
    ...(packageManager ? { packageManager } : {}),
    ...(framework ? { framework } : {}),
    hasGit: await pathExists(path.join(root, ".git")),
    hasPackageJson,
    isMstackProject: await pathExists(path.join(root, ".mstack", "config.json")),
  };
}

export async function isDirectoryEmpty(directory: string): Promise<boolean> {
  if (!(await pathExists(directory))) return true;
  return (await readdir(directory)).length === 0;
}
