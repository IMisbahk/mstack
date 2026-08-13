import {
  engineeringAgents,
  engineeringHooks,
  engineeringPrompts,
  engineeringSkills,
  runtimeTemplates,
} from "../../../ai-integrations/src/index.js";
import { createDefaultPackRegistry } from "../packs/index.js";
import type { Output } from "../core/output.js";

export const CATALOG_KINDS = ["packs", "agents", "skills", "prompts", "hooks", "templates", "task-recipes"] as const;
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
  readonly query?: string;
}

function matchesQuery(item: CatalogItem, query: string | undefined): boolean {
  if (query === undefined || query.trim() === "") return true;
  const needle = query.trim().toLowerCase();
  return item.id.toLowerCase().includes(needle)
    || item.description.toLowerCase().includes(needle)
    || (item.detail?.toLowerCase().includes(needle) ?? false);
}

export function buildCatalog(kind?: CatalogKind, query?: string): CatalogReport {
  const packs = createDefaultPackRegistry().list();
  const packSpecs = packs.map((pack) => ({ pack, spec: pack.createSpec({ projectName: "Project" }) }));
  const items: CatalogItem[] = [
    ...packs.map((item) => ({ kind: "packs" as const, id: item.id, description: item.description, detail: item.version })),
    ...engineeringAgents.map((item) => ({ kind: "agents" as const, id: item.id, description: item.description, detail: "build-like-this" })),
    ...packSpecs.flatMap(({ pack, spec }) => (spec.agents ?? []).map((item) => ({ kind: "agents" as const, id: item.id, description: item.description, detail: pack.id }))),
    ...engineeringSkills.map((item) => ({ kind: "skills" as const, id: item.id, description: item.description, detail: "build-like-this" })),
    ...packSpecs.flatMap(({ pack, spec }) => (spec.skills ?? []).map((item) => ({ kind: "skills" as const, id: item.id, description: item.description, detail: pack.id }))),
    ...engineeringPrompts.map((item) => ({
      kind: "prompts" as const,
      id: item.id,
      description: item.description,
      detail: item.argumentHint === undefined ? "build-like-this" : `${item.argumentHint} · build-like-this`,
    })),
    ...packSpecs.flatMap(({ pack, spec }) => (spec.prompts ?? []).map((item) => ({
      kind: "prompts" as const,
      id: item.id,
      description: item.description,
      detail: pack.id,
    }))),
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
    ...packs.flatMap((pack) => pack.tasks.map((item) => ({ kind: "task-recipes" as const, id: item.id, description: item.description, detail: `${item.risk} · ${pack.id}` }))),
  ];
  const filtered = items.filter((item) => (kind === undefined || item.kind === kind) && matchesQuery(item, query));
  const counts = Object.fromEntries(CATALOG_KINDS.map((name) => [name, items.filter((item) => item.kind === name).length])) as Record<CatalogKind, number>;
  return {
    schemaVersion: 1,
    counts,
    items: filtered,
    ...(query === undefined || query.trim() === "" ? {} : { query: query.trim() }),
  };
}

export function catalogCommand(output: Output, kind: CatalogKind | undefined, json: boolean, query?: string): void {
  const report = buildCatalog(kind, query);
  if (json) return output.json(report);

  output.title(kind === undefined ? "mstack catalog" : `mstack catalog · ${kind}`);
  for (const group of CATALOG_KINDS) {
    const groupItems = report.items.filter((item) => item.kind === group);
    if (groupItems.length === 0) continue;
    output.line(`\n${title(group)} (${groupItems.length})`);
    const width = Math.max(13, ...groupItems.map((item) => item.id.length));
    for (const item of groupItems) output.field(item.id, item.description, width);
  }
  output.next(`Install or reconcile core resources with ${output.command("mstack ai setup")} and curated packs with ${output.command("mstack pack add <id>")}`);
}

function title(kind: CatalogKind): string {
  return `${kind[0]!.toUpperCase()}${kind.slice(1)}`;
}
