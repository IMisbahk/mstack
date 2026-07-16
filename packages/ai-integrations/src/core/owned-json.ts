import type { ManifestOwnedEntry } from "../types.js";
import { hashContent, stableStringify } from "./safety.js";

export interface OwnedJsonResult {
  readonly content: string;
  readonly entries: readonly ManifestOwnedEntry[];
  readonly conflicts: readonly string[];
}

export function reconcileOwnedJson(currentContent: string | undefined, desiredContent: string, previous: readonly ManifestOwnedEntry[] = []): OwnedJsonResult {
  const current = currentContent === undefined ? {} : parseObject(currentContent, "current JSON");
  const desired = parseObject(desiredContent, "generated JSON");
  const result = structuredClone(current);
  const conflicts: string[] = [];
  const entries: ManifestOwnedEntry[] = [];
  reconcileObject(result, desired, "", previous, entries, conflicts);
  return { content: `${JSON.stringify(result, null, 2)}\n`, entries, conflicts };
}

export function removeOwnedJson(currentContent: string, previous: readonly ManifestOwnedEntry[]): OwnedJsonResult {
  const current = parseObject(currentContent, "current JSON");
  const result = structuredClone(current);
  const conflicts: string[] = [];
  for (const entry of previous) {
    const container = getPointer(result, entry.pointer);
    if (Array.isArray(container)) {
      const index = container.findIndex((item) => identity(item) === entry.identity);
      if (index < 0) continue;
      if (hashValue(container[index]) !== entry.installedHash) conflicts.push(`${entry.pointer}#${entry.identity}`);
      container.splice(index, 1);
    } else if (container !== undefined && entry.identity === "$value") {
      if (hashValue(container) !== entry.installedHash) conflicts.push(entry.pointer);
      deletePointer(result, entry.pointer);
    }
  }
  for (const pointer of new Set(previous.map((entry) => entry.pointer))) pruneEmptyPointer(result, pointer);
  return { content: `${JSON.stringify(result, null, 2)}\n`, entries: [], conflicts };
}

function reconcileObject(result: Record<string, unknown>, desired: Record<string, unknown>, base: string, previous: readonly ManifestOwnedEntry[], entries: ManifestOwnedEntry[], conflicts: string[]): void {
  for (const [key, desiredValue] of Object.entries(desired)) {
    const pointer = `${base}/${escapePointer(key)}`;
    const currentValue = result[key];
    if (isObject(desiredValue)) {
      if (currentValue !== undefined && !isObject(currentValue)) conflicts.push(pointer);
      const child = isObject(currentValue) ? currentValue : {};
      result[key] = child;
      reconcileObject(child, desiredValue, pointer, previous, entries, conflicts);
    } else if (Array.isArray(desiredValue)) {
      if (currentValue !== undefined && !Array.isArray(currentValue)) conflicts.push(pointer);
      const array = Array.isArray(currentValue) ? currentValue : [];
      const previousHere = previous.filter((entry) => entry.pointer === pointer);
      for (const prior of previousHere) {
        const index = array.findIndex((item) => identity(item) === prior.identity);
        if (index < 0) conflicts.push(`${pointer}#${prior.identity}`);
        else { if (hashValue(array[index]) !== prior.installedHash) conflicts.push(`${pointer}#${prior.identity}`); array.splice(index, 1); }
      }
      for (const desiredItem of desiredValue) {
        const itemIdentity = identity(desiredItem);
        let collisionIndex = array.findIndex((item) => identity(item) === itemIdentity);
        if (collisionIndex < 0) {
          const legacyIndex = legacyNamedItemIndex(array, desiredItem);
          if (legacyIndex !== undefined) array.splice(legacyIndex, 1);
        }
        const collision = collisionIndex < 0 ? undefined : array[collisionIndex];
        if (collision !== undefined && hashValue(collision) !== hashValue(desiredItem)) conflicts.push(`${pointer}#${itemIdentity}`);
        if (collision === undefined || hashValue(collision) !== hashValue(desiredItem)) array.push(desiredItem);
        entries.push({ pointer, identity: itemIdentity, installedHash: hashValue(desiredItem) });
      }
      result[key] = array;
    } else {
      const prior = previous.find((entry) => entry.pointer === pointer && entry.identity === "$value");
      if (prior !== undefined && currentValue !== undefined && hashValue(currentValue) !== prior.installedHash) conflicts.push(pointer);
      else if (prior === undefined && currentValue !== undefined && hashValue(currentValue) !== hashValue(desiredValue)) conflicts.push(pointer);
      result[key] = desiredValue;
      entries.push({ pointer, identity: "$value", installedHash: hashValue(desiredValue) });
    }
  }
}

function identity(value: unknown): string {
  if (isObject(value)) {
    for (const key of ["id", "name", "command"]) if (typeof value[key] === "string") return `${key}:${value[key]}`;
    const hooks = value.hooks;
    if (Array.isArray(hooks) && isObject(hooks[0]) && typeof hooks[0].command === "string") return `command:${hooks[0].command}`;
  }
  return `hash:${hashValue(value)}`;
}

function legacyNamedItemIndex(array: readonly unknown[], desired: unknown): number | undefined {
  if (!isObject(desired) || typeof desired.name !== "string" || !hasCommand(desired)) return undefined;
  const legacy = structuredClone(desired);
  delete legacy.name;
  const legacyHash = hashValue(legacy);
  const matches = array.flatMap((item, index) => hashValue(item) === legacyHash ? [index] : []);
  return matches.length === 1 ? matches[0] : undefined;
}

function hasCommand(value: Record<string, unknown>): boolean {
  if (typeof value.command === "string") return true;
  return Array.isArray(value.hooks) && isObject(value.hooks[0]) && typeof value.hooks[0].command === "string";
}

function hashValue(value: unknown): string { return hashContent(stableStringify(value)); }
function isObject(value: unknown): value is Record<string, unknown> { return value !== null && !Array.isArray(value) && typeof value === "object"; }
function parseObject(content: string, label: string): Record<string, unknown> {
  let value: unknown;
  try { value = JSON.parse(content); } catch (error) { throw new Error(`${label} is invalid`, { cause: error }); }
  if (!isObject(value)) throw new Error(`${label} must contain an object`);
  return value;
}
function escapePointer(value: string): string { return value.replaceAll("~", "~0").replaceAll("/", "~1"); }
function unescapePointer(value: string): string { return value.replaceAll("~1", "/").replaceAll("~0", "~"); }
function getPointer(root: Record<string, unknown>, pointer: string): unknown {
  let value: unknown = root;
  for (const segment of pointer.split("/").slice(1).map(unescapePointer)) { if (!isObject(value)) return undefined; value = value[segment]; }
  return value;
}
function deletePointer(root: Record<string, unknown>, pointer: string): void {
  const parts = pointer.split("/").slice(1).map(unescapePointer); const key = parts.pop(); if (key === undefined) return;
  let value: unknown = root;
  for (const segment of parts) { if (!isObject(value)) return; value = value[segment]; }
  if (isObject(value)) delete value[key];
}
function pruneEmptyPointer(root: Record<string, unknown>, pointer: string): void {
  const parts = pointer.split("/").slice(1).map(unescapePointer);
  for (let length = parts.length; length > 0; length -= 1) {
    const parentParts = parts.slice(0, length - 1); const key = parts[length - 1]!; let parent: unknown = root;
    for (const segment of parentParts) { if (!isObject(parent)) return; parent = parent[segment]; }
    if (!isObject(parent)) return;
    const value = parent[key];
    if ((Array.isArray(value) && value.length === 0) || (isObject(value) && Object.keys(value).length === 0)) delete parent[key];
    else return;
  }
}
