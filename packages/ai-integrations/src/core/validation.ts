import { isAbsolute, normalize, posix } from "node:path";
import type { IntegrationSpec } from "../types.js";

const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function assertSafeRelativePath(path: string, label = "path"): void {
  const portable = path.replaceAll("\\", "/");
  const normalized = normalize(portable).replaceAll("\\", "/");
  if (
    path.length === 0 ||
    isAbsolute(path) ||
    /^[a-zA-Z]:[\\/]/.test(path) ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    posix.isAbsolute(portable) ||
    portable.includes("\0")
  ) {
    throw new Error(`${label} must stay inside the repository: ${path}`);
  }
}

export function validateIntegrationSpec(spec: IntegrationSpec): void {
  if (spec.project.name.trim().length === 0) {
    throw new Error("project.name is required");
  }

  const ids = new Map<string, string>();
  const register = (id: string, kind: string): void => {
    if (!idPattern.test(id)) {
      throw new Error(`${kind} id must be kebab-case: ${id}`);
    }
    const previous = ids.get(id);
    if (previous !== undefined) {
      throw new Error(`Duplicate integration id '${id}' used by ${previous} and ${kind}`);
    }
    ids.set(id, kind);
  };

  for (const prompt of spec.prompts ?? []) {
    register(prompt.id, "prompt");
    requireText(prompt.description, `prompt '${prompt.id}' description`);
    requireText(prompt.prompt, `prompt '${prompt.id}' body`);
  }
  for (const skill of spec.skills ?? []) {
    register(skill.id, "skill");
    requireText(skill.description, `skill '${skill.id}' description`);
    requireText(skill.instructions, `skill '${skill.id}' instructions`);
    for (const resource of skill.resources ?? []) {
      assertSafeRelativePath(resource.path, `resource path for skill '${skill.id}'`);
    }
  }
  for (const hook of spec.hooks ?? []) {
    register(hook.id, "hook");
    requireText(hook.command, `hook '${hook.id}' command`);
    if (hook.timeoutMs !== undefined && (!Number.isInteger(hook.timeoutMs) || hook.timeoutMs <= 0)) {
      throw new Error(`hook '${hook.id}' timeoutMs must be a positive integer`);
    }
  }
  for (const agent of spec.agents ?? []) {
    register(agent.id, "agent");
    requireText(agent.description, `agent '${agent.id}' description`);
    requireText(agent.instructions, `agent '${agent.id}' instructions`);
  }
  for (const source of spec.context ?? []) {
    assertSafeRelativePath(source.path, "context path");
  }
  const assetPaths = new Set<string>();
  for (const asset of spec.assets ?? []) {
    assertSafeRelativePath(asset.path, "runtime asset path");
    if (assetPaths.has(asset.path)) throw new Error(`Duplicate runtime asset path: ${asset.path}`);
    assetPaths.add(asset.path);
    requireText(asset.content, `runtime asset '${asset.path}' content`);
  }
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} is required`);
  }
}
