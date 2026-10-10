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

async function mustExist(relativePath, root = pluginRoot) {
  try {
    await access(path.join(root, relativePath));
  } catch {
    errors.push(`missing ${relativePath}`);
  }
}

function hasFrontmatter(content, requiredKeys) {
  if (!content.startsWith("---\n")) return false;
  const end = content.indexOf("\n---\n", 4);
  if (end === -1) return false;
  const block = content.slice(4, end);
  return requiredKeys.every((key) => new RegExp(`^${key}\\s*:`, "m").test(block));
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
await mustExist("assets/logo.svg");
await mustExist("README.md");
await mustExist("INSTALL_TEST.md");
await mustExist(".cursor-plugin/marketplace.json", repoRoot);
await mustExist("assets/logo.svg", repoRoot);

const manifest = JSON.parse(await readFile(path.join(pluginRoot, ".cursor-plugin/plugin.json"), "utf8"));
for (const field of [
  "name",
  "displayName",
  "version",
  "description",
  "author",
  "license",
  "keywords",
  "homepage",
  "repository",
  "logo",
  "skills",
  "agents",
  "commands",
  "rules",
  "hooks",
]) {
  if (manifest[field] === undefined) errors.push(`plugin.json missing ${field}`);
}
if (manifest.name !== "mstack") errors.push(`plugin.json name must be mstack, got ${manifest.name}`);
if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(manifest.name)) {
  errors.push("plugin.json name must be kebab-case");
}
if (manifest.homepage !== "https://misbah.lol/mstack") {
  errors.push(`plugin.json homepage must be https://misbah.lol/mstack, got ${manifest.homepage}`);
}
if (manifest.repository !== "https://github.com/IMisbahk/mstack") {
  errors.push("plugin.json repository URL mismatch");
}
if (manifest.logo !== "assets/logo.svg") errors.push("plugin.json logo must be assets/logo.svg");
if (!manifest.author?.name || !manifest.author?.email) {
  errors.push("plugin.json author must include name and email");
}

const marketplace = JSON.parse(await readFile(path.join(repoRoot, ".cursor-plugin/marketplace.json"), "utf8"));
if (marketplace.name !== "mstack") errors.push("root marketplace.json name must be mstack");
if (marketplace.owner?.name !== "Misbah K." || marketplace.owner?.email !== "m.misbahkhursheed@gmail.com") {
  errors.push("root marketplace.json owner must be Misbah K. with contact email");
}
const pluginEntry = marketplace.plugins?.find((entry) => entry.name === "mstack");
if (!pluginEntry || pluginEntry.source !== "distribution/mstack") {
  errors.push("root marketplace.json must list plugins[{name:mstack, source:distribution/mstack}]");
}
if (!pluginEntry?.description) errors.push("root marketplace.json plugin entry missing description");

const router = await readFile(path.join(pluginRoot, "skills/mstack/SKILL.md"), "utf8");
if (!/^name:\s*"?mstack"?\s*$/m.test(router)) errors.push("router skill missing name: mstack");
if (!router.includes("mode: true")) errors.push("router skill should set mode: true like poteto-mode");
if (!router.includes("disable-model-invocation: true")) errors.push("router skill should be user-invoked");
if (!router.includes("playbook-bug-fix")) errors.push("router skill should use playbook routes from the registry");
if (!hasFrontmatter(router, ["name", "description"])) errors.push("router skill missing complete frontmatter");

const hooks = JSON.parse(await readFile(path.join(pluginRoot, "hooks/hooks.json"), "utf8"));
if (!hooks.hooks || typeof hooks.hooks !== "object") errors.push("hooks/hooks.json missing hooks object");

async function assertFrontmatterTree(relativeDirectory, requiredKeys) {
  const absolute = path.join(pluginRoot, relativeDirectory);
  const entries = await readdir(absolute, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillPath = path.join(relativeDirectory, entry.name, "SKILL.md");
      try {
        const content = await readFile(path.join(pluginRoot, skillPath), "utf8");
        if (!hasFrontmatter(content, requiredKeys)) errors.push(`${skillPath} missing frontmatter keys ${requiredKeys.join(",")}`);
      } catch {
        errors.push(`missing ${skillPath}`);
      }
      continue;
    }
    if (!entry.isFile() || !/\.(md|mdc)$/.test(entry.name)) continue;
    const relativePath = path.join(relativeDirectory, entry.name);
    const content = await readFile(path.join(pluginRoot, relativePath), "utf8");
    if (!hasFrontmatter(content, requiredKeys)) {
      errors.push(`${relativePath} missing frontmatter keys ${requiredKeys.join(",")}`);
    }
  }
}

await assertFrontmatterTree("skills", ["name", "description"]);
await assertFrontmatterTree("commands", ["name", "description"]);
await assertFrontmatterTree("agents", ["name", "description"]);
await assertFrontmatterTree("rules", ["description"]);

const skillDirs = await readdir(path.join(pluginRoot, "skills"), { withFileTypes: true });
const skillCount = skillDirs.filter((entry) => entry.isDirectory()).length;
if (skillCount < 40) errors.push(`expected expanded skill library after merge, found ${skillCount}`);

const scriptDirs = await readdir(path.join(pluginRoot, "scripts")).catch(() => []);
if (scriptDirs.length < 4) errors.push(`expected hook scripts under scripts/, found ${scriptDirs.length}`);

if (errors.length > 0) {
  console.error("Cursor plugin validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Cursor plugin ok: ${skillCount} skills, hooks=${Object.keys(hooks.hooks).join(",")}`);
