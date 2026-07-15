import path from "node:path";
import { rm } from "node:fs/promises";
import { CliError } from "../core/errors.js";
import { commandExists, run } from "../core/process.js";

export async function ensureGit(): Promise<void> {
  if (!(await commandExists("git"))) {
    throw new CliError("Git is required for this operation but was not found on PATH.");
  }
}

export async function initializeRepository(root: string, defaultBranch = "main"): Promise<void> {
  await ensureGit();
  await run("git", ["init", "--initial-branch", defaultBranch], { cwd: root });
}

export async function cloneRepository(repository: string, target: string, ref?: string): Promise<void> {
  await ensureGit();
  await run("git", ["clone", "--depth", "1", ...(ref ? ["--branch", ref] : []), "--", repository, target], { stdio: "inherit" });
  await rm(path.join(target, ".git"), { recursive: true, force: true });
}
