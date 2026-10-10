import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  createInstallChannelRecord,
  installChannelPath,
  mstackGeneratedMarker,
  type DuplicateSkillFinding,
  type InstallChannel,
  type InstallChannelRecord,
  type InstallProfile,
} from "../../../ai-integrations/src/index.js";
import { pathExists, readJson, writeJsonAtomic } from "../core/fs.js";

const skillRoots = [".agents/skills", ".claude/skills"] as const;

export async function readInstallChannel(root: string): Promise<InstallChannelRecord | undefined> {
  const filePath = path.join(root, installChannelPath);
  if (!(await pathExists(filePath))) return undefined;
  return readJson<InstallChannelRecord>(filePath);
}

export async function writeInstallChannel(
  root: string,
  channel: InstallChannel,
  profile: InstallProfile,
): Promise<string> {
  const filePath = path.join(root, installChannelPath);
  await writeJsonAtomic(filePath, createInstallChannelRecord(channel, profile));
  return filePath;
}

async function listSkillIds(root: string, relativeBase: string): Promise<string[]> {
  const absolute = path.join(root, relativeBase);
  if (!(await pathExists(absolute))) return [];
  const entries = await readdir(absolute, { withFileTypes: true });
  const ids: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(absolute, entry.name, "SKILL.md");
    if (!(await pathExists(skillPath))) continue;
    const content = await readFile(skillPath, "utf8");
    if (content.includes(mstackGeneratedMarker)) ids.push(entry.name);
  }
  return ids;
}

/**
 * Detect marketplace/skills.sh installs overlapping an mstack CLI-managed project.
 * Native adapters may intentionally write the same skill into multiple roots; that is not a conflict.
 */
export async function detectDuplicateSkillInstalls(root: string): Promise<readonly DuplicateSkillFinding[]> {
  const findings: DuplicateSkillFinding[] = [];
  const channel = await readInstallChannel(root);
  const skillsLock = path.join(root, "skills-lock.json");
  const hasSkillsLock = await pathExists(skillsLock);

  if (hasSkillsLock && channel?.channel === "cli") {
    findings.push({
      code: "skills-sh-lock",
      level: "error",
      path: "skills-lock.json",
      message:
        "skills.sh lockfile is present alongside an mstack CLI install channel. Remove one install path to avoid duplicate skills.",
    });
  }

  if (channel?.channel === "native-plugin") {
    findings.push({
      code: "channel-conflict",
      level: "warning",
      path: installChannelPath,
      message:
        "Native marketplace/skills.sh channel is recorded. Running mstack ai setup would duplicate skills unless you migrate with --force.",
    });
  }

  const trackedManifest = path.join(root, ".mstack", "manifest.json");
  const hasManifest = await pathExists(trackedManifest);
  if (hasManifest) {
    for (const skillRoot of skillRoots) {
      const ids = await listSkillIds(root, skillRoot);
      if (ids.length === 0) continue;
      if (channel === undefined && hasSkillsLock) {
        findings.push({
          code: "untracked-mstack-skill",
          level: "warning",
          path: skillRoot,
          message: `Found ${ids.length} mstack-generated skill(s) under ${skillRoot} with a skills.sh lockfile but no install channel record.`,
        });
      }
    }
  }

  return findings;
}

export async function assertSafeSkillInstallChannel(
  root: string,
  options: { force: boolean },
): Promise<readonly DuplicateSkillFinding[]> {
  const findings = await detectDuplicateSkillInstalls(root);
  const blocking = findings.filter((finding) => finding.level === "error");
  if (blocking.length > 0 && !options.force) {
    return findings;
  }
  return findings;
}
