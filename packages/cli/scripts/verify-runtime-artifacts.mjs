#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, "../../..");

const generate = spawnSync("node", [path.join(scriptDirectory, "generate-runtime-artifacts.mjs")], {
  cwd: repoRoot,
  stdio: "inherit",
});
if (generate.status !== 0) process.exit(generate.status ?? 1);

const diff = spawnSync(
  "git",
  ["diff", "--exit-code", "--", "distribution", "packages/ai-integrations/src/generated/resource-counts.json"],
  { cwd: repoRoot, stdio: "inherit" },
);
if (diff.status !== 0) {
  console.error("Runtime artifacts drifted. Commit the regenerated distribution/ and resource-counts.json.");
  process.exit(diff.status ?? 1);
}

console.log("Runtime artifacts match the registry.");
