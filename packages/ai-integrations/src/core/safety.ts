import { createHash } from "node:crypto";
import { lstat, realpath } from "node:fs/promises";
import { dirname, isAbsolute, normalize, posix, relative, resolve } from "node:path";

export function hashContent(content: string | Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, sortValue(item)]),
    );
  }
  return value;
}

export function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const item of Object.values(value as Record<string, unknown>)) deepFreeze(item);
    Object.freeze(value);
  }
  return value;
}

export function assertSafeRelativePath(path: string, label = "path"): void {
  const portable = path.replaceAll("\\", "/");
  const normalized = normalize(portable).replaceAll("\\", "/");
  if (
    path.length === 0 ||
    path !== path.trim() ||
    isAbsolute(path) ||
    /^[a-zA-Z]:[\\/]/.test(path) ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    posix.isAbsolute(portable) ||
    portable.includes("\0") ||
    portable.split("/").some((part) => part === ".." || part.length === 0)
  ) {
    throw new Error(`${label} must stay inside the repository: ${path}`);
  }
}

export function isInside(root: string, candidate: string): boolean {
  const repositoryRelative = relative(root, candidate);
  return (
    repositoryRelative === "" ||
    (repositoryRelative !== ".." &&
      !repositoryRelative.startsWith("../") &&
      !repositoryRelative.startsWith("..\\") &&
      !isAbsolute(repositoryRelative))
  );
}

export async function canonicalRepositoryRoot(root: string): Promise<string> {
  const canonical = await realpath(resolve(root));
  const stats = await lstat(canonical);
  if (!stats.isDirectory()) throw new Error(`Repository root is not a directory: ${root}`);
  return canonical;
}

export async function assertSafeTarget(root: string, relativePath: string): Promise<string> {
  assertSafeRelativePath(relativePath, "target path");
  const target = resolve(root, relativePath);
  if (!isInside(root, target)) throw new Error(`Target escapes repository root: ${relativePath}`);

  let candidate = target;
  let targetExists = true;
  try {
    const stats = await lstat(candidate);
    if (stats.isSymbolicLink()) throw new Error(`Target must not be a symlink: ${relativePath}`);
    if (!stats.isFile()) throw new Error(`Target must be a regular file: ${relativePath}`);
    const resolved = await realpath(candidate);
    if (!isInside(root, resolved)) throw new Error(`Target resolves outside repository root: ${relativePath}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    targetExists = false;
  }
  if (targetExists) return target;

  candidate = dirname(target);
  while (candidate !== root) {
    try {
      const stats = await lstat(candidate);
      if (stats.isSymbolicLink()) throw new Error(`Target parent must not be a symlink: ${relativePath}`);
      if (!stats.isDirectory()) throw new Error(`Target parent must be a directory: ${relativePath}`);
      const resolved = await realpath(candidate);
      if (!isInside(root, resolved)) throw new Error(`Target parent resolves outside repository root: ${relativePath}`);
      return target;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      candidate = dirname(candidate);
    }
  }
  return target;
}

export function assertIdentifier(id: string, label = "id"): void {
  if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(id)) {
    throw new Error(`${label} must use lowercase letters, numbers, dots, or hyphens: ${id}`);
  }
}

export function assertVersion(version: string, label = "version"): void {
  if (!/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`${label} must be a semantic version: ${version}`);
  }
}

export function assertHttpsUrl(url: string, label: string, allowLocalhost = false): void {
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new Error(`${label} must be a valid URL`); }
  const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "::1";
  if (parsed.protocol !== "https:" && !(allowLocalhost && local && parsed.protocol === "http:")) {
    throw new Error(`${label} must use HTTPS${allowLocalhost ? " or explicit localhost HTTP" : ""}`);
  }
  if (parsed.username || parsed.password) throw new Error(`${label} must not contain credentials`);
}
