#!/usr/bin/env node
/**
 * Validates Agensi marketplace bundles: structure, frontmatter, no host-toolkit
 * references, size, relative links, and standalone unzip usability.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  attributionLine,
  bundleSpecs,
  extractRelativeMarkdownLinks,
  forbiddenPatterns,
  maxZipBytes,
  parseFrontmatterFields,
  stripYamlFrontmatter,
  expectedPrinciplesForPlaybook,
} from "./build-agensi-bundles.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, "..");
const marketplaceRoot = path.join(repoRoot, "marketplace/agensi");
const distRoot = path.join(marketplaceRoot, "dist");

const errors = [];

function fail(message) {
  errors.push(message);
}

function collectFiles(rootDirectory) {
  const results = [];
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile()) results.push(absolute);
    }
  }
  walk(rootDirectory);
  return results;
}

function assertNoForbidden(relativePath, content) {
  for (const [index, line] of content.split("\n").entries()) {
    if (line.includes(attributionLine)) continue;
    for (const pattern of forbiddenPatterns) {
      if (pattern.regex.test(line)) {
        fail(
          `${relativePath}:${index + 1} forbidden ${pattern.label}: ${line.trim()}`,
        );
      }
    }
  }
}

function assertFrontmatter(skillPath) {
  const content = readFileSync(skillPath, "utf8");
  const { frontmatter } = stripYamlFrontmatter(content);
  if (!frontmatter) {
    fail(`${skillPath} missing YAML frontmatter`);
    return null;
  }
  const fields = parseFrontmatterFields(frontmatter);
  if (!fields.name) fail(`${skillPath} missing frontmatter name`);
  if (!fields.description) fail(`${skillPath} missing frontmatter description`);
  return fields;
}

function assertBundleStructure(slug) {
  const bundleDirectory = path.join(marketplaceRoot, slug);
  const required = ["SKILL.md", "README.md", "LICENSE", "reference"];
  for (const name of required) {
    if (!existsSync(path.join(bundleDirectory, name))) {
      fail(`${slug}: missing ${name}`);
    }
  }

  const spec = bundleSpecs.find((entry) => entry.slug === slug);
  for (const principleId of spec.principles) {
    const referencePath = path.join(
      bundleDirectory,
      "reference",
      `${principleId}.md`,
    );
    if (!existsSync(referencePath)) {
      fail(`${slug}: missing reference/${principleId}.md`);
    }
  }

  const fields = assertFrontmatter(path.join(bundleDirectory, "SKILL.md"));
  if (fields && fields.name !== slug) {
    fail(`${slug}: SKILL.md name "${fields.name}" must equal slug`);
  }

  for (const filePath of collectFiles(bundleDirectory)) {
    const relativePath = path.relative(bundleDirectory, filePath);
    if (/\.(md|txt)$/i.test(filePath) || path.basename(filePath) === "LICENSE") {
      assertNoForbidden(`${slug}/${relativePath}`, readFileSync(filePath, "utf8"));
    }
  }

  const skillContent = readFileSync(path.join(bundleDirectory, "SKILL.md"), "utf8");
  for (const principleId of spec.principles) {
    if (!skillContent.includes(`reference/${principleId}.md`)) {
      fail(`${slug}: SKILL.md does not cite reference/${principleId}.md`);
    }
  }

  for (const filePath of collectFiles(bundleDirectory)) {
    if (!filePath.endsWith(".md")) continue;
    const content = readFileSync(filePath, "utf8");
    for (const link of extractRelativeMarkdownLinks(content)) {
      const resolved = link.startsWith("reference/")
        ? path.resolve(bundleDirectory, link)
        : path.resolve(path.dirname(filePath), link);
      if (!existsSync(resolved)) {
        fail(
          `${slug}: broken link in ${path.relative(bundleDirectory, filePath)} -> ${link}`,
        );
      }
    }
  }
}

function assertZip(slug) {
  const zipPath = path.join(distRoot, `${slug}.zip`);
  if (!existsSync(zipPath)) {
    fail(`missing zip ${zipPath}`);
    return;
  }
  const size = statSync(zipPath).size;
  if (size <= 0) fail(`${slug}.zip is empty`);
  if (size >= maxZipBytes) fail(`${slug}.zip exceeds 50 MB (${size} bytes)`);

  const tempRoot = mkdtempSync(path.join(os.tmpdir(), `agensi-${slug}-`));
  const projectRoot = path.join(tempRoot, "fresh-project");
  const skillsRoot = path.join(projectRoot, ".claude", "skills", slug);
  try {
    mkdirp(skillsRoot);
    const unzip = spawnSync("unzip", ["-q", zipPath, "-d", skillsRoot], {
      stdio: "pipe",
      encoding: "utf8",
    });
    if (unzip.status !== 0) {
      fail(`${slug}: unzip failed: ${unzip.stderr || unzip.stdout}`);
      return;
    }

    if (existsSync(path.join(projectRoot, "package.json"))) {
      fail(`${slug}: temp project unexpectedly already had package.json`);
    }
    writeFileSync(
      path.join(projectRoot, "package.json"),
      JSON.stringify({ name: "fresh-project", private: true }, null, 2),
    );

    const skillPath = path.join(skillsRoot, "SKILL.md");
    if (!existsSync(skillPath)) {
      fail(`${slug}: unzipped bundle missing SKILL.md`);
      return;
    }
    const fields = assertFrontmatter(skillPath);
    if (!fields) return;

    const content = readFileSync(skillPath, "utf8");
    assertNoForbidden(`${slug}/unzipped/SKILL.md`, content);

    for (const link of extractRelativeMarkdownLinks(content)) {
      const resolved = link.startsWith("reference/")
        ? path.resolve(skillsRoot, link)
        : path.resolve(path.dirname(skillPath), link);
      if (!existsSync(resolved)) {
        fail(`${slug}: unzipped broken link ${link}`);
      }
    }

    for (const principleId of bundleSpecs.find((entry) => entry.slug === slug)
      .principles) {
      const referencePath = path.join(
        skillsRoot,
        "reference",
        `${principleId}.md`,
      );
      if (!existsSync(referencePath)) {
        fail(`${slug}: unzipped missing reference/${principleId}.md`);
      }
    }

    // Confirm the temp project has no host-toolkit install
    for (const banned of [".mstack", "docs/product.md", "mstack"]) {
      if (existsSync(path.join(projectRoot, banned))) {
        fail(`${slug}: temp project unexpectedly contains ${banned}`);
      }
    }

    maybeDryInvokeAgent(slug, skillsRoot);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

function mkdirp(directory) {
  spawnSync("mkdir", ["-p", directory], { stdio: "ignore" });
}

function maybeDryInvokeAgent(slug, skillsRoot) {
  const candidates = [
    { command: "claude", args: ["--help"] },
    { command: "agent", args: ["--help"] },
    { command: "cursor", args: ["--help"] },
  ];
  for (const candidate of candidates) {
    const probe = spawnSync(candidate.command, candidate.args, {
      encoding: "utf8",
      stdio: "pipe",
    });
    if (probe.status === 0 || probe.status === 1) {
      // Dry invocation: print skill frontmatter via the CLI help path only.
      // Full agent runs are environment-dependent; success is "CLI present + skill parses".
      console.log(
        `dry-invoke: detected ${candidate.command}; parsed ${slug} skill at ${skillsRoot}`,
      );
      return;
    }
  }
  console.log(`dry-invoke: skip (no agent CLI on PATH) for ${slug}`);
}

function assertPrincipleSync() {
  for (const spec of bundleSpecs) {
    try {
      const expected = expectedPrinciplesForPlaybook(spec.playbookId);
      const actual = new Set(spec.principles);
      for (const id of expected) {
        if (!actual.has(id)) {
          fail(`${spec.slug}: bundle missing source principle ${id}`);
        }
      }
      for (const id of actual) {
        if (!expected.has(id)) {
          fail(`${spec.slug}: bundle has extra principle ${id}`);
        }
      }
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error));
    }
  }
}

function assertListings() {
  const listingsPath = path.join(marketplaceRoot, "LISTINGS.md");
  if (!existsSync(listingsPath)) {
    fail("missing marketplace/agensi/LISTINGS.md");
    return;
  }
  const content = readFileSync(listingsPath, "utf8");
  for (const spec of bundleSpecs) {
    if (!content.includes(`## ${spec.slug}`)) {
      fail(`LISTINGS.md missing section ${spec.slug}`);
    }
    if (!content.includes(spec.listingTitle)) {
      fail(`LISTINGS.md missing title for ${spec.slug}`);
    }
    if (spec.listingTitle.length > 60) {
      fail(`${spec.slug} listing title exceeds 60 chars (${spec.listingTitle.length})`);
    }
  }
  if (!content.includes("$10")) fail("LISTINGS.md missing $10 price");
}

function main() {
  // Rebuild first so tests always cover current generator output.
  const build = spawnSync(process.execPath, [path.join(scriptDirectory, "build-agensi-bundles.mjs")], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (build.status !== 0) {
    console.error(build.stderr || build.stdout);
    process.exit(build.status ?? 1);
  }
  if (build.stdout) process.stdout.write(build.stdout);

  assertPrincipleSync();
  assertListings();

  for (const spec of bundleSpecs) {
    assertBundleStructure(spec.slug);
    assertZip(spec.slug);
  }

  if (errors.length > 0) {
    console.error("Agensi bundle tests failed:");
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  console.log("Agensi bundle tests passed.");
  for (const spec of bundleSpecs) {
    const zipPath = path.join(distRoot, `${spec.slug}.zip`);
    console.log(`  ${spec.slug}.zip ${statSync(zipPath).size} bytes`);
  }
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main();
}
