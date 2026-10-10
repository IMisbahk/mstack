import {
  engineeringAgents,
  engineeringHooks,
  engineeringPrompts,
  engineeringSkills,
  runtimeTemplates,
} from "../../../ai-integrations/src/index.js";
import { CATALOG_KINDS, catalogAliases, type CatalogKind } from "../catalog/aliases.js";
import { createDefaultPackRegistry } from "../packs/index.js";
import type { Output } from "../core/output.js";

export { CATALOG_KINDS, type CatalogKind };

export interface CatalogItem {
  readonly kind: CatalogKind;
  readonly id: string;
  readonly description: string;
  readonly detail?: string;
  readonly aliasOf?: string;
}

export interface CatalogReport {
  readonly schemaVersion: 1;
  readonly counts: Readonly<Record<CatalogKind, number>>;
  readonly items: readonly CatalogItem[];
  readonly aliases: readonly {
    readonly alias: string;
    readonly aliasKind: CatalogKind;
    readonly canonicalId: string;
    readonly canonicalKind: CatalogKind;
    readonly reason: string;
  }[];
  readonly query?: string;
}

function matchesQuery(item: CatalogItem, query: string | undefined): boolean {
  if (query === undefined || query.trim() === "") return true;
  const needle = query.trim().toLowerCase();
  return item.id.toLowerCase().includes(needle)
    || item.description.toLowerCase().includes(needle)
    || (item.detail?.toLowerCase().includes(needle) ?? false)
    || (item.aliasOf?.toLowerCase().includes(needle) ?? false);
}

export function buildCatalog(kind?: CatalogKind, query?: string): CatalogReport {
  const packs = createDefaultPackRegistry().list();
  const packSpecs = packs.map((pack) => ({ pack, spec: pack.createSpec({ projectName: "Project" }) }));
  const installedItems: CatalogItem[] = [
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
  const installedIds = new Set(installedItems.map((item) => `${item.kind}:${item.id}`));
  const aliasItems: CatalogItem[] = catalogAliases
    .filter((entry) => !installedIds.has(`${entry.aliasKind}:${entry.alias}`))
    .map((entry) => ({
      kind: entry.aliasKind,
      id: entry.alias,
      description: `Alias of ${entry.canonicalKind} ${entry.canonicalId}. ${entry.reason}`,
      detail: `alias → ${entry.canonicalId}`,
      aliasOf: entry.canonicalId,
    }));
  const items = [...installedItems, ...aliasItems];
  const filtered = items.filter((item) => (kind === undefined || item.kind === kind) && matchesQuery(item, query));
  const counts = Object.fromEntries(
    CATALOG_KINDS.map((name) => [name, installedItems.filter((item) => item.kind === name).length]),
  ) as Record<CatalogKind, number>;
  return {
    schemaVersion: 1,
    counts,
    items: filtered,
    aliases: catalogAliases.map((entry) => ({ ...entry })),
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
    for (const item of groupItems) {
      const suffix = item.aliasOf === undefined ? item.description : `${item.description}`;
      output.field(item.id, suffix, width);
    }
  }
  if (report.aliases.length > 0 && (kind === undefined || query !== undefined)) {
    output.line(`\nAliases (${report.aliases.length})`);
    const width = Math.max(13, ...report.aliases.map((item) => item.alias.length));
    for (const entry of report.aliases) {
      if (kind !== undefined && entry.aliasKind !== kind) continue;
      if (query !== undefined && query.trim() !== "" && !`${entry.alias} ${entry.canonicalId} ${entry.reason}`.toLowerCase().includes(query.trim().toLowerCase())) continue;
      output.field(entry.alias, `→ ${entry.canonicalId} (${entry.canonicalKind})`, width);
    }
  }
  output.next(`Install or reconcile core resources with ${output.command("mstack ai setup")} and curated packs with ${output.command("mstack pack add <id>")}`);
}

function title(kind: CatalogKind): string {
  return `${kind[0]!.toUpperCase()}${kind.slice(1)}`;
}
