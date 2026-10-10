import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { countPlaceholders } from "./placeholders.js";

export type PlanningDocumentState = "missing" | "draft" | "ready" | "empty";

export interface GlossaryHealth {
  readonly id: "glossary";
  readonly path: string;
  readonly state: Exclude<PlanningDocumentState, "empty">;
  readonly placeholders: number;
}

export interface DecisionsHealth {
  readonly id: "decisions";
  readonly path: string;
  readonly state: PlanningDocumentState;
  readonly adrCount: number;
}

async function glossaryHealth(root: string): Promise<GlossaryHealth> {
  const relativePath = "docs/glossary.md";
  const absolute = path.join(root, relativePath);
  try {
    await access(absolute);
  } catch {
    return { id: "glossary", path: relativePath, state: "missing", placeholders: 0 };
  }
  const content = await readFile(absolute, "utf8");
  const placeholders = countPlaceholders(content);
  return {
    id: "glossary",
    path: relativePath,
    state: placeholders > 0 ? "draft" : "ready",
    placeholders,
  };
}

async function decisionsHealth(root: string): Promise<DecisionsHealth> {
  const relativePath = "docs/decisions";
  const absolute = path.join(root, relativePath);
  try {
    await access(absolute);
  } catch {
    return { id: "decisions", path: relativePath, state: "missing", adrCount: 0 };
  }
  const entries = await readdir(absolute);
  const adrCount = entries.filter((entry) => /^\d{4}-.+\.md$/i.test(entry)).length;
  if (adrCount === 0) return { id: "decisions", path: relativePath, state: "empty", adrCount: 0 };
  return { id: "decisions", path: relativePath, state: "ready", adrCount };
}

export async function inspectPlanningContinuity(root: string): Promise<{
  readonly glossary: GlossaryHealth;
  readonly decisions: DecisionsHealth;
}> {
  const [glossary, decisions] = await Promise.all([glossaryHealth(root), decisionsHealth(root)]);
  return { glossary, decisions };
}
