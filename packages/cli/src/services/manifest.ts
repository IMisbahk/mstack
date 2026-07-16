import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathExists, readJson, writeJsonAtomic } from "../core/fs.js";
import { VERSION } from "../meta.js";

export interface ManifestFile {
  readonly path: string;
  readonly kind: "template" | "integration" | "runtime";
  readonly owner: string;
  readonly sha256: string;
  readonly updatedAt: string;
  readonly integrity?: "content" | "existence";
}

export interface MstackManifest {
  readonly schemaVersion: 1;
  readonly mstackVersion: string;
  readonly operationId: string;
  readonly updatedAt: string;
  readonly integrations: readonly string[];
  readonly files: readonly ManifestFile[];
}

export function manifestPath(root: string): string {
  return path.join(root, ".mstack", "manifest.json");
}

export async function readManifest(root: string): Promise<MstackManifest | undefined> {
  const location = manifestPath(root);
  if (!(await pathExists(location))) return undefined;
  const manifest = await readJson<MstackManifest>(location);
  return manifest.schemaVersion === 1 ? manifest : undefined;
}

export async function updateManifest(
  root: string,
  update: {
    files: readonly { path: string; kind: ManifestFile["kind"]; owner: string; integrity?: ManifestFile["integrity"] }[];
    integrations?: readonly string[];
    now?: Date;
  },
): Promise<MstackManifest> {
  const existing = await readManifest(root);
  const now = (update.now ?? new Date()).toISOString();
  const files = new Map((existing?.files ?? []).map((file) => [file.path, file]));
  for (const file of update.files) {
    const absolute = path.join(root, file.path);
    if (!(await pathExists(absolute))) {
      files.delete(file.path);
      continue;
    }
    files.set(file.path, {
      path: file.path,
      kind: file.kind,
      owner: file.owner,
      ...(file.integrity === undefined ? {} : { integrity: file.integrity }),
      sha256: createHash("sha256").update(await readFile(absolute)).digest("hex"),
      updatedAt: now,
    });
  }
  const manifest: MstackManifest = {
    schemaVersion: 1,
    mstackVersion: VERSION,
    operationId: randomUUID(),
    updatedAt: now,
    integrations: [...new Set([...(existing?.integrations ?? []), ...(update.integrations ?? [])])].sort(),
    files: [...files.values()].sort((left, right) => left.path.localeCompare(right.path)),
  };
  await writeJsonAtomic(manifestPath(root), manifest);
  return manifest;
}

export async function verifyManifest(root: string): Promise<readonly { path: string; state: "missing" | "modified" }[]> {
  const manifest = await readManifest(root);
  if (!manifest) return [];
  const issues: { path: string; state: "missing" | "modified" }[] = [];
  for (const file of manifest.files) {
    const absolute = path.join(root, file.path);
    if (!(await pathExists(absolute))) {
      issues.push({ path: file.path, state: "missing" });
      continue;
    }
    if ((file.integrity ?? (file.kind === "runtime" ? "content" : "existence")) === "content") {
      const sha256 = createHash("sha256").update(await readFile(absolute)).digest("hex");
      if (sha256 !== file.sha256) issues.push({ path: file.path, state: "modified" });
    }
  }
  return issues;
}
