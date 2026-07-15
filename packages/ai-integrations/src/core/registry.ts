import type { IntegrationAdapter } from "../types.js";

export class IntegrationRegistry {
  readonly #adapters = new Map<string, IntegrationAdapter>();

  constructor(adapters: readonly IntegrationAdapter[] = []) {
    for (const adapter of adapters) this.register(adapter);
  }

  register(adapter: IntegrationAdapter): void {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(adapter.id)) {
      throw new Error(`Adapter id must be kebab-case: ${adapter.id}`);
    }
    if (this.#adapters.has(adapter.id)) {
      throw new Error(`Adapter already registered: ${adapter.id}`);
    }
    this.#adapters.set(adapter.id, adapter);
  }

  get(id: string): IntegrationAdapter {
    const adapter = this.#adapters.get(id);
    if (adapter === undefined) throw new Error(`Unknown AI environment: ${id}`);
    return adapter;
  }

  list(): readonly IntegrationAdapter[] {
    return [...this.#adapters.values()];
  }
}
