import type { Output } from "../core/output.js";
import { createDefaultPackRegistry } from "../packs/index.js";
import { readManifest } from "../services/manifest.js";
import { engineeringAgents } from "../../../ai-integrations/src/index.js";

export async function agentCommand(cwd: string, output: Output, id: string | undefined, json: boolean): Promise<void> {
  const manifest = await readManifest(cwd); const selected = new Set((manifest?.packs ?? []).map((pack) => pack.id));
  const core = manifest?.integrations.length ? engineeringAgents.map((agent) => ({ ...agent, pack: "build-like-this" })) : [];
  const agents = [...core, ...createDefaultPackRegistry().list().filter((pack) => selected.has(pack.id)).flatMap((pack) => (pack.createSpec({ projectName: "Project" }).agents ?? []).map((agent) => ({ ...agent, pack: pack.id })))];
  const filtered = id === undefined ? agents : agents.filter((agent) => agent.id === id);
  if (json) return output.json({ schemaVersion: 1, agents: filtered, invocation: "Invoke the named specialist in a configured compatible AI runtime; mstack does not execute models." });
  output.title("Installed specialists"); if (filtered.length === 0) output.line("No capability-pack specialists are installed. Add one with mstack pack add <id>."); for (const agent of filtered) output.field(agent.id, `${agent.description} (${agent.pack})`); output.next("Invoke a listed specialist in your configured AI runtime. mstack only installs and describes these resources; it does not host inference.");
}
