import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { findProjectRoot } from "./config.js";
import { readManifest } from "./manifest.js";

export type DocumentState = "missing" | "draft" | "ready";

export interface DocumentHealth {
  readonly id: "product" | "architecture";
  readonly path: string;
  readonly state: DocumentState;
  readonly placeholders: number;
}

export interface RepositoryHealth {
  readonly schemaVersion: 1;
  readonly root: string;
  readonly initialized: boolean;
  readonly setup: "not-initialized" | "needs-attention" | "complete";
  readonly documents: readonly DocumentHealth[];
  readonly integrations: readonly string[];
  readonly manifest: string | null;
  readonly next: { command?: string; path?: string; message: string };
}

function countPlaceholders(content: string): number {
  let count = content.match(/YYYY-MM-DD|\{\{[^}\n]+\}\}/g)?.length ?? 0;
  for (const match of content.matchAll(/\[([^\]\n]{2,160})\]/g)) {
    const index = match.index ?? 0;
    const next = content[index + match[0].length];
    const previous = content[index - 1];
    if (next !== "(" && previous !== "!" && !/^[ xX]$/.test(match[1] ?? "")) count += 1;
  }
  return count;
}

async function documentHealth(root: string, id: DocumentHealth["id"], relativePath: string): Promise<DocumentHealth> {
  const absolute = path.join(root, relativePath);
  try {
    await access(absolute);
  } catch {
    return { id, path: relativePath, state: "missing", placeholders: 0 };
  }
  const content = await readFile(absolute, "utf8");
  const placeholders = countPlaceholders(content);
  return { id, path: relativePath, state: placeholders > 0 ? "draft" : "ready", placeholders };
}

export async function inspectRepository(start: string): Promise<RepositoryHealth> {
  const root = await findProjectRoot(start) ?? path.resolve(start);
  const documents = await Promise.all([
    documentHealth(root, "product", "docs/product.md"),
    documentHealth(root, "architecture", "docs/architecture.md"),
  ]);
  const manifest = await readManifest(root);
  const initialized = manifest !== undefined || await findProjectRoot(root) !== undefined;
  const incomplete = documents.find((document) => document.state !== "ready");
  const setup = !initialized ? "not-initialized" : incomplete ? "needs-attention" : "complete";
  const next = !initialized
    ? { command: "mstack init", message: "Initialize Build Like This in this repository." }
    : incomplete?.state === "missing"
      ? { command: "mstack init", path: incomplete.path, message: `Add the missing ${incomplete.id} document.` }
      : incomplete
        ? { path: incomplete.path, message: `Complete the ${incomplete.id} document (${incomplete.placeholders} placeholders remain).` }
        : { command: "mstack explain", message: "Review the repository workflow and begin the next delivery slice." };
  return {
    schemaVersion: 1,
    root,
    initialized,
    setup,
    documents,
    integrations: manifest?.integrations ?? [],
    manifest: manifest ? path.relative(root, path.join(root, ".mstack", "manifest.json")) : null,
    next,
  };
}
