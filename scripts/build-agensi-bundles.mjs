#!/usr/bin/env node
/**
 * Regenerates Agensi.io marketplace skill bundles for selected playbooks.
 * Source of truth: packages/ai-integrations playbook/principle definitions
 * (via generated distribution/skills/<id>/SKILL.md).
 */
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, "..");
const distributionSkillsRoot = path.join(repoRoot, "distribution/skills");
const marketplaceRoot = path.join(repoRoot, "marketplace/agensi");
const distRoot = path.join(marketplaceRoot, "dist");
const licenseSource = path.join(repoRoot, "LICENSE");
const playbooksSourcePath = path.join(
  repoRoot,
  "packages/ai-integrations/src/runtime/playbooks.ts",
);
const principlesSourcePath = path.join(
  repoRoot,
  "packages/ai-integrations/src/runtime/principles.ts",
);

const maxZipBytes = 50 * 1024 * 1024;
const attributionLine = "From mstack by Misbah Khursheed (MIT)";

/**
 * Playbooks to package. Principle lists are the union of each playbook's
 * `principles` array and principle ids cited in its steps (from playbooks.ts).
 * Verified at build time against packages/ai-integrations/src/runtime/playbooks.ts:
 * - babysit-pr: principles array only
 * - bug-fix: principles array only
 * - autonomous-run: principles array + thinking-before-typing (cited in steps);
 *   encode-lessons is NOT a playbook principle (only encode-lessons-in-structure)
 * - orchestrate: principles array only
 */
const bundleSpecs = [
  {
    playbookId: "playbook-babysit-pr",
    slug: "babysit-pr",
    displayTitle: "Babysit PR / CI",
    listingTitle: "Babysit PR — CI & review until merge-ready",
    principles: [
      "fix-root-causes",
      "prove-it-works",
      "never-block-on-the-human",
      "make-failure-observable",
    ],
  },
  {
    playbookId: "playbook-bug-fix",
    slug: "bug-fix",
    displayTitle: "Bug fix",
    listingTitle: "Bug Fix Playbook — reproduce, cause, prove",
    principles: [
      "fix-root-causes",
      "prove-it-works",
      "smallest-complete-slice",
      "never-block-on-the-human",
    ],
  },
  {
    playbookId: "playbook-autonomous-run",
    slug: "autonomous-run",
    displayTitle: "Long autonomous run",
    listingTitle: "Autonomous Run — loop to a checkable exit",
    principles: [
      "never-block-on-the-human",
      "prove-it-works",
      "guard-the-context-window",
      "encode-lessons-in-structure",
      "evidence-over-optimism",
      "thinking-before-typing",
    ],
  },
  {
    playbookId: "playbook-orchestrate",
    slug: "orchestrate",
    displayTitle: "Orchestrate parallel subagents",
    listingTitle: "Orchestrate — parallel lanes, one integrator",
    principles: [
      "guard-the-context-window",
      "never-block-on-the-human",
      "prove-it-works",
      "name-the-trade-off",
      "smallest-complete-slice",
    ],
  },
];

const forbiddenPatterns = [
  { label: "mstack", regex: /\bmstack\b/i },
  { label: "/mstack", regex: /\/mstack\b/ },
  { label: "docs/product.md", regex: /docs\/product\.md/ },
  { label: "docs/architecture.md", regex: /docs\/architecture\.md/ },
  { label: "docs/features.md", regex: /docs\/features\.md/ },
  { label: "docs/decisions/", regex: /docs\/decisions\// },
  { label: "docs/glossary.md", regex: /docs\/glossary\.md/ },
  { label: ".mstack/", regex: /\.mstack\// },
  { label: "packages/ai-integrations", regex: /packages\/ai-integrations/ },
  { label: "distribution/skills", regex: /distribution\/skills/ },
];

const listingDescriptions = {
  "babysit-pr":
    "Drive a pull request to merge-ready by clearing conflicts, review threads, and CI failures in a fixed order. Ships with principle references so agents reproduce failures instead of shotgun-retrying. Drop into Claude, Cursor, or Agents skills folders — no host toolkit required.",
  "bug-fix":
    "A reproduce-first bug fix playbook: confirm the mechanism, ship the smallest causal change, and paste failing-then-passing proof. Includes root-cause and verification references so agents stop at evidence, not hopeful patches. Works as a standalone skill install.",
  "autonomous-run":
    "Define a checkable exit predicate and iterate until it passes without stalling on reversible work. Bundled principles keep context lean, verification honest, and plateaus from looking like success. Ideal for long unattended agent runs.",
  orchestrate:
    "Fan out independent agent lanes, serialize shared surfaces, and integrate with acceptance owned by the lead. Includes context, slice, and trade-off references so parallel work stays evidence-backed. Standalone install for multi-package or project-scale coordination.",
};

function stripYamlFrontmatter(content) {
  if (!content.startsWith("---\n")) return { frontmatter: null, body: content };
  const end = content.indexOf("\n---\n", 4);
  if (end === -1) return { frontmatter: null, body: content };
  return {
    frontmatter: content.slice(4, end),
    body: content.slice(end + 5),
  };
}

function parseFrontmatterFields(frontmatter) {
  const fields = {};
  if (!frontmatter) return fields;
  for (const line of frontmatter.split("\n")) {
    const match = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    fields[match[1]] = value;
  }
  return fields;
}

function stripGeneratedBanner(body) {
  return body
    .replace(/<!--\s*Generated by[\s\S]*?-->\s*/g, "")
    .replace(/^\s*\n+/, "");
}

function referencePathFor(principleId) {
  return `reference/${principleId}.md`;
}

function knownPrincipleIdsFromSource() {
  const source = readFileSync(principlesSourcePath, "utf8");
  return new Set([...source.matchAll(/id:\s*"([a-z0-9-]+)"/g)].map((match) => match[1]));
}

function expectedPrinciplesForPlaybook(playbookId) {
  const source = readFileSync(playbooksSourcePath, "utf8");
  const marker = `id: "${playbookId}"`;
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`Playbook ${playbookId} not found in playbooks.ts`);
  }
  const nextDefine = source.indexOf("definePlaybook({", start + marker.length);
  const block = source.slice(start, nextDefine === -1 ? undefined : nextDefine);

  const principlesMatch = block.match(/principles:\s*\[([\s\S]*?)\],/);
  if (!principlesMatch) {
    throw new Error(`No principles array for ${playbookId}`);
  }
  const declared = [...principlesMatch[1].matchAll(/"([a-z0-9-]+)"/g)].map(
    (match) => match[1],
  );

  const stepsMatch = block.match(/steps:\s*\[([\s\S]*?)\],\s*principles:/);
  const stepsBlock = stepsMatch ? stepsMatch[1] : "";
  const known = knownPrincipleIdsFromSource();
  const cited = [...stepsBlock.matchAll(/`([a-z0-9-]+)`/g)]
    .map((match) => match[1])
    .filter((id) => known.has(id));

  return new Set([...declared, ...cited]);
}

function verifyPlaybookPrinciplesAgainstSource(spec) {
  const expected = expectedPrinciplesForPlaybook(spec.playbookId);
  const actual = new Set(spec.principles);
  for (const id of expected) {
    if (!actual.has(id)) {
      throw new Error(
        `${spec.slug}: missing principle ${id} required by source playbook (declared/cited)`,
      );
    }
  }
  for (const id of actual) {
    if (!expected.has(id)) {
      throw new Error(
        `${spec.slug}: unexpected principle ${id} not declared/cited by source playbook`,
      );
    }
  }
}

function rewritePlaybookBody(body, principleIds) {
  let next = stripGeneratedBanner(body);

  for (const principleId of principleIds) {
    const ref = referencePathFor(principleId);
    const idPattern = new RegExp(`\`${principleId}\``, "g");
    next = next.replace(idPattern, `\`${ref}\``);
  }

  next = next.replace(
    /## Principles to cite by name\n\n([\s\S]*?)(?=\n\*\*Reply:\*\*|\n## |\n*$)/,
    () => {
      const lines = principleIds.map((id) => `- \`${referencePathFor(id)}\``).join("\n");
      return `## Principles to load\n\nLoad these bundled references when a step cites them:\n\n${lines}\n\n`;
    },
  );

  if (!next.includes(attributionLine)) {
    next = `${next.trimEnd()}\n\n---\n\n${attributionLine}\n`;
  }

  return next;
}

function renderBundledSkillMarkdown({ name, description, body }) {
  return [
    "---",
    `name: "${name}"`,
    `description: "${description.replace(/"/g, '\\"')}"`,
    "---",
    "",
    body.trimEnd(),
    "",
  ].join("\n");
}

function renderReferenceMarkdown(principleId, sourceSkillPath) {
  const raw = readFileSync(sourceSkillPath, "utf8");
  const { body } = stripYamlFrontmatter(raw);
  let content = stripGeneratedBanner(body);
  content = content.replace(
    /Cite this principle by id when it changed a decision\. Keep the citation specific\./g,
    `Cite \`${referencePathFor(principleId)}\` when it changed a decision. Keep the citation specific.`,
  );
  return `${content.trimEnd()}\n`;
}

function renderReadme(spec, description) {
  const principleList = spec.principles
    .map((id) => `- \`reference/${id}.md\``)
    .join("\n");

  return `# ${spec.displayTitle}

Standalone agent skill bundle for the **${spec.displayTitle}** playbook.

## Outcome

Follow a fixed, evidence-gated sequence so an agent finishes with a checkable result instead of open-ended churn.

## When to use it

${description}

## Install

Unzip (or copy) this folder into one of:

- \`.claude/skills/${spec.slug}/\`
- \`.cursor/skills/${spec.slug}/\`
- \`.agents/skills/${spec.slug}/\`

The skill entrypoint is \`SKILL.md\` at the folder root. Principle guidance lives under \`reference/\`.

## Bundled references

${principleList}

## Example run

1. Invoke the skill for a matching task (for example: get a PR merge-ready, fix a failing repro, drive an exit predicate, or fan out parallel lanes).
2. Copy the **Steps** into your todo list word for word.
3. When a step cites \`reference/<principle>.md\`, open that file and apply it.
4. Stop only when the finish condition passes, and paste the verification evidence in the reply.

## License

MIT. ${attributionLine}
`;
}

function assertNoForbiddenContent(relativePath, content) {
  const lines = content.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.includes(attributionLine)) continue;
    for (const pattern of forbiddenPatterns) {
      if (pattern.regex.test(line)) {
        throw new Error(
          `${relativePath}:${index + 1} contains forbidden ${pattern.label}: ${line.trim()}`,
        );
      }
    }
  }
}

function collectTextFiles(rootDirectory) {
  const results = [];
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(absolute);
        continue;
      }
      if (
        entry.isFile() &&
        (/\.(md|txt)$/i.test(entry.name) || entry.name === "LICENSE")
      ) {
        results.push(absolute);
      }
    }
  }
  walk(rootDirectory);
  return results;
}

function extractRelativeMarkdownLinks(content) {
  const links = [];
  const pattern = /\[[^\]]*]\(([^)]+)\)|`(reference\/[a-z0-9-]+\.md)`/g;
  let match = pattern.exec(content);
  while (match) {
    const target = match[1] || match[2];
    if (
      target &&
      !target.startsWith("http://") &&
      !target.startsWith("https://") &&
      !target.startsWith("#") &&
      !target.startsWith("mailto:")
    ) {
      links.push(target.split("#")[0]);
    }
    match = pattern.exec(content);
  }
  return links;
}

function zipDirectory(sourceDirectory, zipPath) {
  rmSync(zipPath, { force: true });
  // Fixed timestamps keep rebuilds bit-stable for git.
  const touch = spawnSync(
    "bash",
    [
      "-lc",
      `find . -exec touch -t 202601010000 {} + && zip -r -q -X ${JSON.stringify(zipPath)} .`,
    ],
    { cwd: sourceDirectory, stdio: "inherit" },
  );
  if (touch.status !== 0) {
    throw new Error(`zip failed for ${zipPath}`);
  }
}

function buildBundle(spec) {
  verifyPlaybookPrinciplesAgainstSource(spec);

  const sourceSkillPath = path.join(
    distributionSkillsRoot,
    spec.playbookId,
    "SKILL.md",
  );
  if (!existsSync(sourceSkillPath)) {
    throw new Error(`Missing source skill: ${sourceSkillPath}`);
  }

  const raw = readFileSync(sourceSkillPath, "utf8");
  const { frontmatter, body } = stripYamlFrontmatter(raw);
  const fields = parseFrontmatterFields(frontmatter);
  const description = fields.description || spec.displayTitle;

  const bundleDirectory = path.join(marketplaceRoot, spec.slug);
  rmSync(bundleDirectory, { recursive: true, force: true });
  mkdirSync(path.join(bundleDirectory, "reference"), { recursive: true });

  const rewrittenBody = rewritePlaybookBody(body, spec.principles);
  const skillMarkdown = renderBundledSkillMarkdown({
    name: spec.slug,
    description,
    body: rewrittenBody,
  });
  writeFileSync(path.join(bundleDirectory, "SKILL.md"), skillMarkdown);

  for (const principleId of spec.principles) {
    const principleSource = path.join(
      distributionSkillsRoot,
      principleId,
      "SKILL.md",
    );
    if (!existsSync(principleSource)) {
      throw new Error(`Missing principle skill: ${principleSource}`);
    }
    const referenceMarkdown = renderReferenceMarkdown(principleId, principleSource);
    writeFileSync(
      path.join(bundleDirectory, "reference", `${principleId}.md`),
      referenceMarkdown,
    );
  }

  writeFileSync(
    path.join(bundleDirectory, "README.md"),
    renderReadme(spec, description),
  );
  cpSync(licenseSource, path.join(bundleDirectory, "LICENSE"));

  for (const filePath of collectTextFiles(bundleDirectory)) {
    const relativePath = path.relative(bundleDirectory, filePath);
    assertNoForbiddenContent(relativePath, readFileSync(filePath, "utf8"));
  }

  for (const filePath of collectTextFiles(bundleDirectory)) {
    if (!filePath.endsWith(".md")) continue;
    const content = readFileSync(filePath, "utf8");
    for (const link of extractRelativeMarkdownLinks(content)) {
      const resolved = link.startsWith("reference/")
        ? path.resolve(bundleDirectory, link)
        : path.resolve(path.dirname(filePath), link);
      if (!existsSync(resolved)) {
        throw new Error(
          `Broken relative link in ${path.relative(bundleDirectory, filePath)}: ${link}`,
        );
      }
    }
  }

  mkdirSync(distRoot, { recursive: true });
  const zipPath = path.join(distRoot, `${spec.slug}.zip`);
  zipDirectory(bundleDirectory, zipPath);
  const zipSize = statSync(zipPath).size;
  if (zipSize >= maxZipBytes) {
    throw new Error(`${spec.slug}.zip is ${zipSize} bytes; must be under 50 MB`);
  }

  return { slug: spec.slug, zipPath, zipSize, bundleDirectory };
}

function renderListingsMarkdown() {
  const sections = bundleSpecs.map((spec) => {
    return [
      `## ${spec.slug}`,
      "",
      `- **Title:** ${spec.listingTitle}`,
      `- **Price:** $10`,
      `- **Zip:** \`marketplace/agensi/dist/${spec.slug}.zip\``,
      "",
      listingDescriptions[spec.slug],
      "",
    ].join("\n");
  });

  return [
    "# Agensi marketplace listings",
    "",
    "Suggested copy for four standalone playbook skill bundles. Do not upload from CI; publish manually when ready.",
    "",
    ...sections,
    "---",
    "",
    attributionLine,
    "",
  ].join("\n");
}

function main() {
  if (!existsSync(distributionSkillsRoot)) {
    throw new Error("Missing distribution/skills. Run: pnpm generate:runtime-artifacts");
  }
  if (!existsSync(playbooksSourcePath) || !existsSync(principlesSourcePath)) {
    throw new Error("Missing playbook/principle source files under packages/ai-integrations");
  }

  mkdirSync(marketplaceRoot, { recursive: true });
  mkdirSync(distRoot, { recursive: true });

  const built = [];
  for (const spec of bundleSpecs) {
    built.push(buildBundle(spec));
  }

  writeFileSync(path.join(marketplaceRoot, "LISTINGS.md"), renderListingsMarkdown());

  console.log("Built Agensi bundles:");
  for (const entry of built) {
    console.log(`  ${entry.slug}: ${entry.zipPath} (${entry.zipSize} bytes)`);
  }
  console.log(`  listings: ${path.join(marketplaceRoot, "LISTINGS.md")}`);
}

export {
  attributionLine,
  bundleSpecs,
  extractRelativeMarkdownLinks,
  forbiddenPatterns,
  maxZipBytes,
  parseFrontmatterFields,
  stripYamlFrontmatter,
  expectedPrinciplesForPlaybook,
};

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
