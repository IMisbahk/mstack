#!/usr/bin/env node
/**
 * Copies distribution/mstack into ~/.cursor/plugins/local/mstack for local Cursor testing.
 * Does not submit or publish anything.
 */
import { cp, mkdir, rm, access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, "../../..");
const source = path.join(repoRoot, "distribution/mstack");
const destination = path.join(os.homedir(), ".cursor/plugins/local/mstack");

try {
  await access(path.join(source, ".cursor-plugin/plugin.json"));
} catch {
  console.error("Missing distribution/mstack. Run: pnpm generate:runtime-artifacts");
  process.exit(1);
}

await mkdir(path.dirname(destination), { recursive: true });
await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });
console.log(`Installed local Cursor plugin at ${destination}`);
console.log("Reload Cursor (Developer: Reload Window), then try /mstack");
