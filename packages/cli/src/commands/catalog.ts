import {
  engineeringAgents,
  engineeringHooks,
  engineeringPrompts,
  engineeringSkills,
  runtimeTemplates,
} from "../../../ai-integrations/src/index.js";
import type { Output } from "../core/output.js";

export const CATALOG_KINDS = ["agents", "skills", "prompts", "hooks", "templates"] as const;
export type CatalogKind = (typeof CATALOG_KINDS)[number];

export interface CatalogItem {
  readonly kind: CatalogKind;
  readonly id: string;
  readonly description: string;
  readonly detail?: string;
}

export interface CatalogReport {
  readonly schemaVersion: 1;
  readonly counts: Readonly<Record<CatalogKind, number>>;
  readonly items: readonly CatalogItem[];
}

export function buildCatalog(kind?: CatalogKind): CatalogReport {
  const items: CatalogItem[] = [
    ...engineeringAgents.map((item) => ({ kind: "agents" as const, id: item.id, description: item.description })),
    ...engineeringSkills.map((item) => ({ kind: "skills" as const, id: item.id, description: item.description })),
    ...engineeringPrompts.map((item) => ({
      kind: "prompts" as const,
      id: item.id,
      description: item.description,
      ...(item.argumentHint === undefined ? {} : { detail: item.argumentHint }),
    })),
    ...engineeringHooks.map((item) => ({
      kind: "hooks" as const,
      id: item.id,
      description: `Runs on ${item.event} with a ${item.timeoutMs ?? 5_000}ms timeout.`,
      detail: `${item.security ?? "executable"} · ${item.activation ?? "privileged"}`,
    })),
    ...runtimeTemplates.map((item) => ({
      kind: "templates" as const,
      id: item.id ?? item.path,
      description: `Reusable engineering template at ${item.path}.`,
    })),
  ];
  const counts = Object.fromEntries(CATALOG_KINDS.map((name) => [name, items.filter((item) => item.kind === name).length])) as Record<CatalogKind, number>;
  return { schemaVersion: 1, counts, items: kind === undefined ? items : items.filter((item) => item.kind === kind) };
}

export function catalogCommand(output: Output, kind: CatalogKind | undefined, json: boolean): void {
  const report = buildCatalog(kind);
  if (json) return output.json(report);

  output.title(kind === undefined ? "mstack catalog" : `mstack catalog · ${kind}`);
  for (const group of CATALOG_KINDS) {
    const items = report.items.filter((item) => item.kind === group);
    if (items.length === 0) continue;
    output.line(`\n${title(group)} (${items.length})`);
    const width = Math.max(13, ...items.map((item) => item.id.length));
    for (const item of items) output.field(item.id, item.description, width);
  }
  output.next(`Install or reconcile this catalog with ${output.command("mstack ai setup")}`);
}

function title(kind: CatalogKind): string {
  return `${kind[0]!.toUpperCase()}${kind.slice(1)}`;
}
