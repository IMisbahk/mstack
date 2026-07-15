import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { IntegrationManifest } from "../types.js";
import { stableStringify } from "./safety.js";
import { validateManifest } from "./validation.js";

export const runtimeManifestPath = ".mstack/runtime/manifest.json";

export async function readRuntimeManifest(root: string): Promise<IntegrationManifest | undefined> {
  let content: string;
  try { content = await readFile(join(root, runtimeManifestPath), "utf8"); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error; }
  let value: unknown;
  try { value = JSON.parse(content); } catch (error) { throw new Error(`Runtime manifest is invalid JSON: ${runtimeManifestPath}`, { cause: error }); }
  assertSanitized(value, "manifest");
  validateManifest(value as IntegrationManifest);
  return value as IntegrationManifest;
}

export async function writeRuntimeManifest(root: string, manifest: IntegrationManifest): Promise<void> {
  validateManifest(manifest); assertSanitized(manifest, "manifest");
  const path = join(root, runtimeManifestPath);
  await mkdir(dirname(path), { recursive: true });
  await atomicWrite(path, `${JSON.stringify(JSON.parse(stableStringify(manifest)), null, 2)}\n`);
}

export function assertSanitized(value: unknown, label: string): void {
  const banned = /credential|secret|token|password|api.?key|absolute.?path|^content$/i;
  const visit = (item: unknown, path: string): void => {
    if (Array.isArray(item)) { item.forEach((child, index) => visit(child, `${path}[${index}]`)); return; }
    if (typeof item === "string" && !path.endsWith(".pointer") && (/^(?:\/|[a-zA-Z]:[\\/])/.test(item))) throw new Error(`${label} must not store an absolute path at ${path}`);
    if (item === null || typeof item !== "object") return;
    for (const [key, child] of Object.entries(item as Record<string, unknown>)) {
      if (banned.test(key)) throw new Error(`${label} must not store '${key}' at ${path}`);
      visit(child, `${path}.${key}`);
    }
  };
  visit(value, label);
}

async function atomicWrite(path: string, content: string): Promise<void> {
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
  try { await writeFile(temporary, content, { encoding: "utf8", mode: 0o600 }); await rename(temporary, path); }
  finally { await rm(temporary, { force: true }).catch(() => undefined); }
}
