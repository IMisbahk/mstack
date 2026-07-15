import { hashContent } from "./safety.js";

export interface ManagedBlockResult {
  readonly content: string;
  readonly managedHash: string;
  readonly migratedLegacyMarker: boolean;
}

export function markerIdFor(resourceId: string): string {
  return resourceId.replace(/[^a-z0-9.-]+/g, "-").replace(/^-|-$/g, "");
}

export function inspectManagedMarkers(content: string): readonly string[] {
  const defects: string[] = [];
  const starts = [...content.matchAll(/<!-- mstack:([a-z0-9.-]+):start -->/g)];
  const ends = [...content.matchAll(/<!-- mstack:([a-z0-9.-]+):end -->/g)];
  const ids = new Set([...starts, ...ends].map((match) => match[1]!));
  for (const id of ids) {
    const startCount = starts.filter((match) => match[1] === id).length;
    const endCount = ends.filter((match) => match[1] === id).length;
    if (startCount !== 1 || endCount !== 1) defects.push(`marker '${id}' has ${startCount} start and ${endCount} end markers`);
    const start = content.indexOf(startMarker(id));
    const end = content.indexOf(endMarker(id));
    if (start >= 0 && end >= 0 && end < start) defects.push(`marker '${id}' ends before it starts`);
  }
  if ((content.match(/<!-- mstack:[^>]*:start -->/g)?.length ?? 0) !== starts.length) defects.push("malformed mstack start marker");
  if ((content.match(/<!-- mstack:[^>]*:end -->/g)?.length ?? 0) !== ends.length) defects.push("malformed mstack end marker");
  return defects;
}

export function readManagedBlock(content: string, id: string): string | undefined {
  const start = startMarker(id);
  const end = endMarker(id);
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end);
  if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) return undefined;
  return content.slice(startIndex + start.length, endIndex).replace(/^\r?\n/, "").replace(/\r?\n$/, "");
}

export function mergeManagedBlock(current: string | undefined, id: string, body: string, legacyIds: readonly string[] = []): ManagedBlockResult {
  const normalizedBody = body.trim();
  const block = `${startMarker(id)}\n${normalizedBody}\n${endMarker(id)}`;
  if (current === undefined || current.trim().length === 0) return { content: `${block}\n`, managedHash: hashContent(normalizedBody), migratedLegacyMarker: false };
  const defects = inspectManagedMarkers(current);
  if (defects.length > 0) throw new Error(`Cannot reconcile managed text: ${defects.join("; ")}`);

  let selected = id;
  let migratedLegacyMarker = false;
  if (readManagedBlock(current, id) === undefined) {
    const matches = legacyIds.filter((legacy) => readManagedBlock(current, legacy) !== undefined);
    if (matches.length > 1) throw new Error(`Cannot migrate ambiguous legacy markers: ${matches.join(", ")}`);
    if (matches.length === 1) { selected = matches[0]!; migratedLegacyMarker = true; }
  }
  const selectedBody = readManagedBlock(current, selected);
  if (selectedBody !== undefined) {
    const start = startMarker(selected);
    const end = endMarker(selected);
    const startIndex = current.indexOf(start);
    const endIndex = current.indexOf(end) + end.length;
    return { content: `${current.slice(0, startIndex)}${block}${current.slice(endIndex)}`, managedHash: hashContent(normalizedBody), migratedLegacyMarker };
  }
  return { content: `${current.trimEnd()}\n\n${block}\n`, managedHash: hashContent(normalizedBody), migratedLegacyMarker: false };
}

export function removeManagedBlock(current: string, id: string): string {
  const defects = inspectManagedMarkers(current);
  if (defects.length > 0) throw new Error(`Cannot remove managed text: ${defects.join("; ")}`);
  const start = startMarker(id); const end = endMarker(id);
  const startIndex = current.indexOf(start); const endIndex = current.indexOf(end);
  if (startIndex < 0 || endIndex < startIndex) return current;
  let next = `${current.slice(0, startIndex)}${current.slice(endIndex + end.length)}`;
  next = next.replace(/\n{3,}/g, "\n\n").replace(/^\s+$/, "");
  return next.length === 0 ? "" : `${next.trimEnd()}\n`;
}

function startMarker(id: string): string { return `<!-- mstack:${id}:start -->`; }
function endMarker(id: string): string { return `<!-- mstack:${id}:end -->`; }
