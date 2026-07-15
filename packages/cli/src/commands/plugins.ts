import type { Output } from "../core/output.js";
import { createDefaultPluginRegistry } from "../plugins/index.js";

export function pluginsCommand(output: Output, json: boolean): void {
  const plugins = createDefaultPluginRegistry().list().map((plugin) => ({
    id: plugin.id,
    version: plugin.version,
    displayName: plugin.displayName,
    description: plugin.description,
    integrations: plugin.integrations?.map((item) => item.id) ?? [],
    templates: plugin.templates?.map((item) => item.id) ?? [],
    generators: plugin.generators?.map((item) => item.id) ?? [],
  }));
  if (json) return output.json({ schemaVersion: 1, plugins });
  output.title("mstack plugins");
  output.line("");
  for (const plugin of plugins) {
    output.field(`${plugin.displayName} ${plugin.version}`, plugin.description);
    output.line(`    integrations: ${plugin.integrations.join(", ") || "none"}`);
    output.line(`    templates: ${plugin.templates.join(", ") || "none"}`);
    output.line(`    generators: ${plugin.generators.join(", ") || "none"}`);
  }
}
