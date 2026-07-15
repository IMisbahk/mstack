import { CliError } from "../core/errors.js";
import type { IntegrationPack, MstackPlugin } from "./types.js";

export class PluginRegistry {
  readonly #plugins = new Map<string, MstackPlugin>();
  readonly #integrationPacks = new Map<string, IntegrationPack>();

  constructor(plugins: readonly MstackPlugin[] = []) {
    for (const plugin of plugins) this.register(plugin);
  }

  register(plugin: MstackPlugin): void {
    if (this.#plugins.has(plugin.id)) throw new CliError(`Plugin already registered: ${plugin.id}`);
    for (const pack of plugin.integrations ?? []) {
      if (this.#integrationPacks.has(pack.id)) throw new CliError(`Integration pack already registered: ${pack.id}`);
      this.#integrationPacks.set(pack.id, pack);
    }
    this.#plugins.set(plugin.id, plugin);
  }

  list(): readonly MstackPlugin[] {
    return [...this.#plugins.values()];
  }

  integrationPack(id: string): IntegrationPack {
    const pack = this.#integrationPacks.get(id);
    if (!pack) throw new CliError(`Unknown integration pack: ${id}`);
    return pack;
  }
}
