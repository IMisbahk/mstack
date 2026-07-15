import { lstat, readFile, realpath } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  GeneratedArtifact,
  IntegrationPlan,
  RepositoryFileSnapshot,
  RepositoryInspection,
  VerificationFinding,
} from "../types.js";
import { inspectManagedMarkers } from "./managed-text.js";
import { readRuntimeManifest, runtimeManifestPath } from "./manifest.js";
import { assertSafeTarget, canonicalRepositoryRoot, deepFreeze, hashContent, isInside } from "./safety.js";
import { validateArtifact } from "./validation.js";

export async function inspectIntegrationRepository(
  root: string,
  desired: IntegrationPlan | readonly GeneratedArtifact[] = [],
): Promise<RepositoryInspection> {
  const repositoryRoot = await canonicalRepositoryRoot(root);
  const artifacts: readonly GeneratedArtifact[] = "artifacts" in desired ? desired.artifacts : desired;
  for (const artifact of artifacts) validateArtifact(artifact);
  const manifest = await readRuntimeManifest(repositoryRoot);
  const candidates = new Set<string>([
    ...artifacts.map((artifact) => artifact.path),
    ...(manifest?.resources.map((resource) => resource.path) ?? []),
  ]);
  const files: RepositoryFileSnapshot[] = [];
  const findings: VerificationFinding[] = [];
  for (const path of [...candidates].sort()) {
    const target = await assertSafeTarget(repositoryRoot, path);
    let stats;
    try { stats = await lstat(target); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") { files.push({ path, exists: false, kind: "missing", contained: true, markerDefects: [] }); continue; }
      throw error;
    }
    if (stats.isSymbolicLink()) throw new Error(`Inspection target must not be a symlink: ${path}`);
    if (!stats.isFile()) throw new Error(`Inspection target must be a regular file: ${path}`);
    const resolved = await realpath(target);
    if (!isInside(repositoryRoot, resolved)) throw new Error(`Inspection target resolves outside repository root: ${path}`);
    const content = await readFile(target, "utf8");
    const markerDefects = inspectManagedMarkers(content);
    let jsonValid: boolean | undefined;
    if (path.endsWith(".json")) { try { JSON.parse(content); jsonValid = true; } catch { jsonValid = false; } }
    if (markerDefects.length > 0) findings.push({ code: "marker-defect", level: "error", path, message: markerDefects.join("; ") });
    if (jsonValid === false) findings.push({ code: "invalid-json", level: "error", path, message: "Managed JSON target is invalid" });
    files.push({ path, exists: true, kind: "file", hash: hashContent(content), mode: stats.mode & 0o777, size: stats.size, content, realPath: resolved, contained: true, ...(jsonValid === undefined ? {} : { jsonValid }), markerDefects });
  }
  if (manifest !== undefined && candidates.has(runtimeManifestPath)) findings.push({ code: "manifest-target-overlap", level: "error", path: runtimeManifestPath, message: "A resource must not target the runtime manifest" });
  return deepFreeze({ schemaVersion: 1, root: repositoryRoot, inspectedAt: new Date().toISOString(), desired: [...artifacts], ...(manifest === undefined ? {} : { manifest }), files, findings }) as RepositoryInspection;
}
