import path from "node:path";
import { mkdir, rm } from "node:fs/promises";
import * as prompts from "@clack/prompts";
import type { Output } from "../core/output.js";
import { CliError } from "../core/errors.js";
import { pathExists } from "../core/fs.js";
import { cloneRepository, initializeRepository } from "../services/git.js";
import { ConfigStore, PACKAGE_MANAGERS, type PackageManager } from "../services/config.js";
import { detectInvocationPackageManager, detectProject, isDirectoryEmpty, type ProjectDetails } from "../services/project.js";
import { installDependencies } from "../services/packages.js";
import { scaffoldProject, type ScaffoldResult } from "../services/scaffold.js";
import { updateManifest } from "../services/manifest.js";
import { inspectRepository } from "../services/health.js";

export interface InitOptions {
  cwd: string;
  directory?: string;
  name?: string;
  from?: string;
  ref?: string;
  packageManager?: string;
  git: boolean;
  templates?: boolean;
  install: boolean;
  force: boolean;
  yes: boolean;
  dryRun: boolean;
  json: boolean;
  templatesDirectory: string;
  output: Output;
}

function valueOrCancel<T>(value: T | symbol): T {
  if (prompts.isCancel(value)) throw new CliError("Initialization cancelled.", { exitCode: 130 });
  return value;
}

function validateName(value: string | undefined): string | undefined {
  const name = value?.trim();
  if (!name) return "Enter a project name.";
  if (name === "." || name === ".." || /[\\/]/.test(name)) return "Use a name without path separators.";
  return undefined;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY && !options.yes && !options.json);
  if (interactive) prompts.intro("mstack · initialize");

  const target = path.resolve(options.cwd, options.directory ?? ".");
  const name = options.name ?? path.basename(target);
  const invalidName = validateName(name);
  if (invalidName) throw new CliError(invalidName, { exitCode: 2 });

  const existing = await detectProject(target, { searchParents: false });
  const config = new ConfigStore({ cwd: target });
  const preferences = existing.isMstackProject ? await config.resolved() : (await config.global()).preferences;
  const repository = options.from ?? (!existing.isMstackProject ? preferences.template : undefined);
  if (options.ref && !repository) throw new CliError("--ref can only be used with --from or a configured template.", { exitCode: 2 });
  let packageManager = options.packageManager ?? existing.packageManager ?? preferences.packageManager ?? detectInvocationPackageManager() ?? "npm";
  if (!PACKAGE_MANAGERS.includes(packageManager as PackageManager)) {
    throw new CliError(`Unknown package manager ${packageManager}.`, {
      exitCode: 2,
      hints: [`Choose one of: ${PACKAGE_MANAGERS.join(", ")}.`],
    });
  }

  const includeTemplates = options.templates ?? !repository;
  const initializeGit = options.git;
  if (repository && !(await isDirectoryEmpty(target))) {
    throw new CliError(`Cannot clone into non-empty directory ${target}.`, {
      hints: ["Choose a new directory, or initialize the existing project without --from."],
    });
  }

  const scaffoldOptions = {
    target,
    name,
    templatesDirectory: options.templatesDirectory,
    includeTemplates,
    force: options.force,
    packageManager: packageManager as PackageManager,
    preferences: {
      defaultBranch: preferences.defaultBranch ?? "main",
      initializeGit,
      updateCheck: preferences.updateCheck ?? true,
      ...(repository ? { template: repository } : {}),
    },
  };
  const preview = await scaffoldProject({ ...scaffoldOptions, dryRun: true });
  if (!options.json) outputInitPlan(options.output, target, existing, preview, repository, initializeGit, options.dryRun);
  if (options.dryRun) {
    if (options.json) options.output.json(initResult("dry-run", target, preview));
    return;
  }
  if (interactive) {
    const confirmed = valueOrCancel(await prompts.confirm({ message: "Apply this setup?", initialValue: true }));
    if (!confirmed) throw new CliError("Initialization cancelled.", { exitCode: 130 });
  }

  let cloned = false;
  if (repository) {
    await mkdir(path.dirname(target), { recursive: true });
    const progress = interactive ? prompts.spinner() : undefined;
    if (progress) progress.start(`Cloning ${repository}`);
    else options.output.info(`Cloning ${repository}…`);
    try {
      await cloneRepository(repository, target, options.ref);
      cloned = true;
      progress?.stop("Repository cloned");
    } catch (error) {
      progress?.stop("Clone failed", 1);
      if (!(await pathExists(target)) || await isDirectoryEmpty(target)) await rm(target, { recursive: true, force: true });
      throw error;
    }
  }

  let result: ScaffoldResult;
  try {
    result = await scaffoldProject(scaffoldOptions);
  } catch (error) {
    if (cloned) await rm(target, { recursive: true, force: true });
    throw error;
  }

  if (initializeGit && !existing.hasGit) await initializeRepository(target, preferences.defaultBranch ?? "main");
  if (options.install) {
    if (!(await pathExists(path.join(target, "package.json")))) throw new CliError("Cannot install dependencies because the project has no package.json.");
    const progress = interactive ? prompts.spinner() : undefined;
    progress?.start(`Installing dependencies with ${packageManager}`);
    await installDependencies(packageManager as PackageManager, target);
    progress?.stop("Dependencies installed");
  }

  const managedTemplates = [...result.created, ...result.overwritten, ...result.unchanged].map((file) => ({
    path: file,
    kind: "template" as const,
    owner: "build-like-this",
  }));
  const manifest = await updateManifest(target, { files: managedTemplates });
  const health = await inspectRepository(target);
  if (options.json) {
    options.output.json({ ...initResult("applied", target, result), manifest: ".mstack/manifest.json", operationId: manifest.operationId, health });
    return;
  }

  options.output.success(`${cloned ? "Bootstrapped" : "Initialized"} ${name}`);
  options.output.field("Added", `${result.created.length} file${result.created.length === 1 ? "" : "s"}`);
  if (result.preserved.length > 0) options.output.field("Preserved", `${result.preserved.length} existing document${result.preserved.length === 1 ? "" : "s"}`);
  if (result.backups.length > 0) options.output.field("Backups", result.backups.join(", "));
  if (result.created.length + result.overwritten.length === 0 && result.unchanged.length > 0) options.output.field("Templates", "already current");
  options.output.field("Manifest", ".mstack/manifest.json");
  options.output.next(`1. ${health.next.message} ${health.next.path ?? health.next.command ?? ""}`.trimEnd());
  options.output.line(`  2. Configure AI runtimes  ${options.output.command("mstack ai setup")}`);
  options.output.line(`  3. Check repository      ${options.output.command("mstack status")}`);
  if (interactive) prompts.outro(`Ready in ${path.relative(options.cwd, target) || "."}`);
}

function outputInitPlan(
  output: Output,
  target: string,
  existing: ProjectDetails,
  preview: ScaffoldResult,
  repository: string | undefined,
  initializeGit: boolean,
  dryRun: boolean,
): void {
  output.title(dryRun ? "mstack init · dry run" : "Set up Build Like This");
  output.line(`\n  ${target}\n`);
  output.field("Project", `${existing.framework ?? (existing.hasPackageJson ? "Node.js" : "repository")} · ${existing.hasGit ? "existing Git repository" : "new repository"}`);
  output.field("Add", `${preview.created.length} planning file${preview.created.length === 1 ? "" : "s"}, project configuration, manifest`);
  if (preview.created.length > 0) output.field("Create", preview.created.join(", "));
  if (preview.preserved.length > 0) output.field("Preserve", preview.preserved.join(", "));
  if (preview.overwritten.length > 0) output.field("Replace", preview.overwritten.join(", "));
  if (repository) output.field("Source", repository);
  output.field("Git", existing.hasGit ? "keep existing repository" : initializeGit ? "initialize" : "skip");
}

function initResult(mode: "dry-run" | "applied", target: string, result: ScaffoldResult): object {
  return {
    schemaVersion: 1,
    mode,
    target,
    files: { created: result.created, overwritten: result.overwritten, preserved: result.preserved, unchanged: result.unchanged, backups: result.backups },
    config: result.configPath,
  };
}
