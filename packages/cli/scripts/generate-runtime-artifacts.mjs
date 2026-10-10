#!/usr/bin/env node
/**
 * Generates committed distribution artifacts from the runtime registry:
 * 1) packages/ai-integrations/src/generated/resource-counts.json
 * 2) distribution/mstack/ — first-class Cursor plugin (/add-plugin shape, pstack-like)
 * 3) Claude / Codex / skills.sh marketplace layouts derived from the same source
 *
 * Do not publish from this script. CI fails when committed outputs drift.
 */
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, "../../..");
const aiPackage = path.join(repoRoot, "packages/ai-integrations");
const generatedCountsPath = path.join(aiPackage, "src/generated/resource-counts.json");
const distributionRoot = path.join(repoRoot, "distribution");

function run(command, args, cwd = repoRoot) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("pnpm", ["--filter", "@mstack/ai-integrations", "build"]);

const runtime = await import(pathToFileURL(path.join(aiPackage, "dist/src/index.js")).href);
const shared = await import(pathToFileURL(path.join(aiPackage, "dist/src/adapters/shared.js")).href);

const {
  buildRuntimeResourceCounts,
  buildCursorPluginBundle,
  createBuildLikeThisRuntime,
  createDefaultRegistry,
  engineeringHooks,
  hookAssets,
  renderModelRoleGuidance,
  defaultModelRoleMapping,
  modelRoleConfigPath,
} = runtime;
const { renderStandardSkill, renderPromptSkill, renderAgentMarkdown } = shared;

const counts = buildRuntimeResourceCounts();
await mkdir(path.dirname(generatedCountsPath), { recursive: true });
await writeFile(generatedCountsPath, `${JSON.stringify(counts, null, 2)}\n`, "utf8");

const version = JSON.parse(await readFile(path.join(repoRoot, "packages/cli/package.json"), "utf8")).version;
const spec = createBuildLikeThisRuntime({
  projectName: "mstack",
  projectDescription: "Build Like This engineering workflow installed by mstack",
  profile: "full",
  arena: true,
});

await rm(distributionRoot, { recursive: true, force: true });

async function write(relativePath, content) {
  const absolute = path.join(distributionRoot, relativePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  const body = typeof content === "string" ? content : JSON.stringify(content, null, 2);
  await writeFile(absolute, body.endsWith("\n") ? body : `${body}\n`, "utf8");
}

// --- Primary deliverable: Cursor plugin (pstack-shaped) ---
const cursorPlugin = buildCursorPluginBundle({
  version,
  spec,
  hooks: engineeringHooks,
  hookAssets,
});
for (const file of cursorPlugin.files) {
  await write(path.join(cursorPlugin.pluginName, file.path), file.content);
}

const license = await readFile(path.join(repoRoot, "LICENSE"), "utf8");
await write(`${cursorPlugin.pluginName}/LICENSE`, license);

await write(`${cursorPlugin.pluginName}/README.md`, `# mstack (Cursor plugin)

Build Like This for Cursor. Installable like [pstack](https://github.com/cursor/plugins/tree/main/pstack).

## Entry point

Use **\`/mstack\`** at the start of a task. It routes to phase prompts, discipline skills, and specialist agents.

Configure models with **\`/setup-mstack\`** (code / judgment / reviewPanel, optional arena).

## Local test (before marketplace)

\`\`\`bash
pnpm --filter @imisbahk/mstack generate:runtime-artifacts
pnpm --filter @imisbahk/mstack install:cursor-plugin:local
\`\`\`

Then reload Cursor (**Developer: Reload Window**) and confirm skills/commands under Customize → Plugins.

Local path: \`~/.cursor/plugins/local/mstack\` (copy, not an outside symlink).

## One channel only

Do **not** also run \`mstack ai setup\` for the same skills in a repo that already uses this plugin. Use the plugin **or** the CLI fallback.

## Contents

Generated from the mstack runtime registry (do not edit by hand):

- \`skills/\` — \`/mstack\` router, \`/setup-mstack\`, engineering skills, prompt skills
- \`commands/\` — slash-command surfaces for the router and phase prompts
- \`agents/\` — specialist agents + \`mstack-agent\`
- \`rules/\` — always-applied Build Like This + model-role template
- \`hooks/\` + \`scripts/\` — repository health, change discipline, risk review, feature completeness

Regenerate with \`pnpm generate:runtime-artifacts\`.
`);

await write(`${cursorPlugin.pluginName}/INSTALL_TEST.md`, `# Local install test for the mstack Cursor plugin

## Path A — recommended local copy

1. Generate: \`pnpm generate:runtime-artifacts\`
2. Install: \`pnpm --filter @imisbahk/mstack install:cursor-plugin:local\`
3. Reload Cursor window
4. Check Customize → Plugins for **mstack**
5. Run \`/mstack\` and \`/setup-mstack\`

This copies \`distribution/mstack\` → \`~/.cursor/plugins/local/mstack\`.

Teams/Enterprise may need **Allow Local Plugin Imports** enabled.

## Path B — manual

\`\`\`bash
rm -rf ~/.cursor/plugins/local/mstack
mkdir -p ~/.cursor/plugins/local
cp -R distribution/mstack ~/.cursor/plugins/local/mstack
\`\`\`

Do not place the plugin under \`~/.cursor/plugins/cache/\`.

## Validate without Cursor

\`\`\`bash
pnpm --filter @imisbahk/mstack validate:cursor-plugin
\`\`\`
`);

await write(`${cursorPlugin.pluginName}/assets/README.md`, `# Assets

Optional logo for marketplace listing. Prefer a committed \`logo.svg\` or \`logo.png\` referenced from \`.cursor-plugin/plugin.json\` as \`"logo": "assets/logo.svg"\` before submitting to cursor/plugins.
`);

// Self-host marketplace at distribution root (Option B)
await write(".cursor-plugin/marketplace.json", {
  name: "mstack-distribution",
  owner: { name: "Misbah K.", email: "m.misbahkhursheed@gmail.com" },
  metadata: {
    description: "Self-hosted mstack marketplace. Primary plugin is mstack (Cursor). Other manifests support Claude/Codex/skills.sh.",
  },
  plugins: [
    {
      name: "mstack",
      source: "mstack",
      description: "Build Like This for Cursor — /mstack playbook router, skills, agents, hooks.",
      version,
      category: "developer-tools",
      keywords: ["mstack", "build-like-this", "workflow"],
    },
  ],
});

// --- Secondary: Claude / Codex / skills.sh from the same runtime ---
const pluginName = "mstack";
const pluginDescription =
  "Build Like This agents, skills, and prompts. Prefer one install channel: Cursor plugin (/mstack) OR mstack ai setup OR Claude/Codex/skills.sh — not multiple.";

for (const skill of spec.skills ?? []) {
  await write(`plugins/${pluginName}/skills/${skill.id}/SKILL.md`, renderStandardSkill(skill));
  await write(`skills/${skill.id}/SKILL.md`, renderStandardSkill(skill));
}
for (const prompt of spec.prompts ?? []) {
  await write(`plugins/${pluginName}/skills/${prompt.id}/SKILL.md`, renderPromptSkill(prompt));
  await write(`skills/${prompt.id}/SKILL.md`, renderPromptSkill(prompt));
}
for (const agent of spec.agents ?? []) {
  await write(`plugins/${pluginName}/agents/${agent.id}.md`, renderAgentMarkdown(agent));
}

// Mirror Cursor plugin skills into Claude/Codex shared plugin for parity of router entry points
await cp(
  path.join(distributionRoot, "mstack/skills/mstack"),
  path.join(distributionRoot, `plugins/${pluginName}/skills/mstack`),
  { recursive: true },
);
await cp(
  path.join(distributionRoot, "mstack/skills/setup-mstack"),
  path.join(distributionRoot, `plugins/${pluginName}/skills/setup-mstack`),
  { recursive: true },
);

const modelRoles = {
  ...defaultModelRoleMapping(["claude-code", "cursor", "codex"]),
  arena: true,
};
modelRoles.arenaModels = modelRoles.reviewPanel;
await write(`plugins/${pluginName}/${modelRoleConfigPath}`, {
  ...modelRoles,
  updatedAt: "1970-01-01T00:00:00.000Z",
  runtimes: ["claude-code", "cursor", "codex"],
});
await write(`plugins/${pluginName}/rules/model-roles.md`, renderModelRoleGuidance(modelRoles));

const author = { name: "Misbah Khursheed", url: "https://github.com/IMisbahk" };
const repository = "https://github.com/IMisbahk/mstack";
const allSkillPaths = [
  "./skills/mstack",
  "./skills/setup-mstack",
  ...(spec.skills ?? []).map((skill) => `./skills/${skill.id}`),
  ...(spec.prompts ?? []).map((prompt) => `./skills/${prompt.id}`),
];

await write("plugins/mstack/.claude-plugin/plugin.json", {
  name: pluginName,
  version,
  description: pluginDescription,
  author,
  homepage: repository,
  repository,
  license: "MIT",
  keywords: ["engineering", "skills", "agents", "build-like-this", "mstack"],
  skills: allSkillPaths,
  agents: "./agents",
});

await write("plugins/mstack/.codex-plugin/plugin.json", {
  name: pluginName,
  version,
  description: pluginDescription,
  keywords: ["engineering", "skills", "agents", "build-like-this", "mstack"],
  skills: "./skills",
});

await write(".claude-plugin/marketplace.json", {
  name: "mstack",
  owner: author,
  description: "mstack Build Like This marketplace for Claude Code.",
  plugins: [{ name: pluginName, source: "./plugins/mstack", description: pluginDescription, category: "engineering", version }],
});

await write(".agents/plugins/marketplace.json", {
  name: "mstack",
  interface: { displayName: "mstack" },
  plugins: [
    {
      name: pluginName,
      source: { source: "local", path: "./plugins/mstack" },
      policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
      category: "Productivity",
      description: pluginDescription,
    },
  ],
});

await write("skills/package.json", {
  name: "@mstack/skills",
  private: true,
  version,
  description: "skills.sh-compatible layout generated from the mstack runtime registry.",
});

const adapterCount = createDefaultRegistry().list().length;
await write("PUBLISHING.md", `# Publishing mstack distribution

**Top deliverable:** the Cursor plugin at [\`mstack/\`](./mstack/) — same shape as [pstack](https://github.com/cursor/plugins/tree/main/pstack).

This tree is **generated**. Regenerate with:

\`\`\`bash
pnpm generate:runtime-artifacts
\`\`\`

Do not npm-publish or submit marketplaces from CI in this change. Prepare only.

## Option A — Submit to cursor/plugins (official \`/add-plugin\`)

This is how users get \`/add-plugin mstack\` like pstack.

1. Regenerate artifacts; commit \`distribution/\`.
2. Open a PR against [cursor/plugins](https://github.com/cursor/plugins) that:
   - Adds the contents of \`distribution/mstack/\` as a new top-level \`mstack/\` directory (keep \`.cursor-plugin/plugin.json\`, skills, commands, agents, rules, hooks, scripts, README, LICENSE).
   - Appends a marketplace entry to the root \`.cursor-plugin/marketplace.json\`:
     \`\`\`json
     {
       "name": "mstack",
       "source": "mstack",
       "description": "Build Like This for Cursor: /mstack routes outcome-driven engineering across skills, prompts, specialists, and hooks."
     }
     \`\`\`
3. Optionally add \`assets/logo.svg\` before submit.
4. Also submit via [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish) if required by current Cursor process.
5. After approval, users install with \`/add-plugin mstack\`.

**Do not submit from this automation.** Maintainers submit manually.

## Option B — Host ourselves (supported today for testing + team use)

### B1. Local plugin import (developers)

\`\`\`bash
pnpm generate:runtime-artifacts
pnpm --filter @imisbahk/mstack install:cursor-plugin:local
\`\`\`

Copies into \`~/.cursor/plugins/local/mstack\`. Reload Cursor. See [\`mstack/INSTALL_TEST.md\`](./mstack/INSTALL_TEST.md).

### B2. Self-hosted marketplace repo

Point a dedicated public repo (or sparse subtree) at this \`distribution/\` root, which already contains:

- \`.cursor-plugin/marketplace.json\` listing \`mstack\`
- \`mstack/\` plugin directory

Team/enterprise marketplaces can register that git URL. End users still need Cursor marketplace or team marketplace access; \`/add-plugin\` only resolves plugins Cursor knows about.

### B3. Universal CLI fallback (every tool)

\`\`\`bash
npx @imisbahk/mstack ai setup cursor
\`\`\`

Works without any marketplace. Do **not** combine with the Cursor plugin for the same skills.

## Other generated surfaces

| Surface | Path |
| --- | --- |
| Claude Code marketplace | \`.claude-plugin/marketplace.json\` + \`plugins/mstack\` |
| Codex / Copilot marketplace | \`.agents/plugins/marketplace.json\` |
| skills.sh layout | \`skills/*/SKILL.md\` |

Registry snapshot: **${counts.adapters} adapters**, **${counts.agents} agents**, **${counts.skills} skills**, **${counts.prompts} prompts**, **${counts.hooks} hooks**, **${counts.templates} templates** (registry adapters: ${adapterCount}).
`);

console.log(`Wrote ${path.relative(repoRoot, generatedCountsPath)}`);
console.log(`Wrote ${path.relative(repoRoot, path.join(distributionRoot, "mstack"))} (Cursor plugin)`);
console.log(`Wrote ${path.relative(repoRoot, distributionRoot)}`);
console.log(JSON.stringify(counts, null, 2));
