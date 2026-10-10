#!/usr/bin/env node
/**
 * Validates the generated Cursor plugin layout without launching Cursor.
 */
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, "../../..");
const pluginRoot = path.join(repoRoot, "distribution/mstack");
const errors = [];

async function mustExist(relativePath) {
  try {
    await access(path.join(pluginRoot, relativePath));
  } catch {
    errors.push(`missing ${relativePath}`);
  }
}

try {
  await access(pluginRoot);
} catch {
  console.error("Missing distribution/mstack. Run: pnpm generate:runtime-artifacts");
  process.exit(1);
}

await mustExist(".cursor-plugin/plugin.json");
await mustExist("skills/mstack/SKILL.md");
await mustExist("skills/setup-mstack/SKILL.md");
await mustExist("commands/mstack.md");
await mustExist("commands/setup-mstack.md");
await mustExist("agents/mstack-agent.md");
await mustExist("rules/build-like-this.mdc");
await mustExist("rules/mstack-models.mdc");
await mustExist("hooks/hooks.json");
await mustExist("README.md");
await mustExist("INSTALL_TEST.md");

const manifest = JSON.parse(await readFile(path.join(pluginRoot, ".cursor-plugin/plugin.json"), "utf8"));
for (const field of ["name", "displayName", "version", "description", "skills", "agents", "commands", "rules", "hooks"]) {
  if (manifest[field] === undefined) errors.push(`plugin.json missing ${field}`);
}
if (manifest.name !== "mstack") errors.push(`plugin.json name must be mstack, got ${manifest.name}`);

const router = await readFile(path.join(pluginRoot, "skills/mstack/SKILL.md"), "utf8");
if (!router.includes("name: mstack")) errors.push("router skill missing name: mstack");
if (!router.includes("mode: true")) errors.push("router skill should set mode: true like poteto-mode");
if (!router.includes("disable-model-invocation: true")) errors.push("router skill should be user-invoked");

const hooks = JSON.parse(await readFile(path.join(pluginRoot, "hooks/hooks.json"), "utf8"));
if (!hooks.hooks || typeof hooks.hooks !== "object") errors.push("hooks/hooks.json missing hooks object");

const skillDirs = await readdir(path.join(pluginRoot, "skills"), { withFileTypes: true });
const skillCount = skillDirs.filter((entry) => entry.isDirectory()).length;
if (skillCount < 20) errors.push(`expected many skills, found ${skillCount}`);

const scriptDirs = await readdir(path.join(pluginRoot, "scripts")).catch(() => []);
if (scriptDirs.length < 4) errors.push(`expected hook scripts under scripts/, found ${scriptDirs.length}`);

if (errors.length > 0) {
  console.error("Cursor plugin validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Cursor plugin ok: ${skillCount} skills, hooks=${Object.keys(hooks.hooks).join(",")}`);
