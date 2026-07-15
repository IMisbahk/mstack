import path from "node:path";
import type { IntegrationAdapter, IntegrationRegistry } from "../../../ai-integrations/src/index.js";
import { pathExists } from "../core/fs.js";
import { commandExists } from "../core/process.js";

export interface RuntimeDetection {
  readonly id: string;
  readonly displayName: string;
  readonly installed: boolean;
  readonly configured: boolean;
  readonly documentationUrl: string;
}

export async function detectRuntimes(
  root: string,
  registry: IntegrationRegistry,
  hasCommand: (command: string) => Promise<boolean> = commandExists,
): Promise<RuntimeDetection[]> {
  return Promise.all(registry.list().map(async (adapter: IntegrationAdapter) => ({
    id: adapter.id,
    displayName: adapter.displayName,
    installed: (await Promise.all(adapter.runtime.commands.map(hasCommand))).some(Boolean),
    configured: (await Promise.all(adapter.runtime.projectMarkers.map((marker) => pathExists(path.join(root, marker))))).some(Boolean),
    documentationUrl: adapter.runtime.documentationUrl,
  })));
}
