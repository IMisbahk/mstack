import { access, readFile, writeFile, mkdir, rename, rm } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export function normalizeRepositoryPath(filePath: string): string {
  return filePath.replaceAll("\\", "/");
}

export function relativeRepositoryPath(root: string, target: string): string {
  return normalizeRepositoryPath(path.relative(root, target));
}

export async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

export async function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
  await writeFileAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function writeFileAtomic(filePath: string, value: string | Buffer): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const suffix = `${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}`;
  const temporary = `${filePath}.${suffix}.tmp`;
  const backup = `${filePath}.${suffix}.bak`;
  const existed = await pathExists(filePath);
  try {
    await writeFile(temporary, value);
    if (existed) await rename(filePath, backup);
    await rename(temporary, filePath);
    if (existed) await rm(backup, { force: true });
  } catch (error) {
    if (existed && await pathExists(backup) && !(await pathExists(filePath))) await rename(backup, filePath);
    throw error;
  } finally {
    await rm(temporary, { force: true }).catch(() => undefined);
    await rm(backup, { force: true }).catch(() => undefined);
  }
}

export function walkParents(start: string): string[] {
  const parents: string[] = [];
  let current = path.resolve(start);
  while (true) {
    parents.push(current);
    const parent = path.dirname(current);
    if (parent === current) return parents;
    current = parent;
  }
}
