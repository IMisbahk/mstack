import { CliError } from "../core/errors.js";
import type { CapabilityPack, TaskRecipe } from "./types.js";

export class PackRegistry {
  #packs = new Map<string, CapabilityPack>();
  constructor(packs: readonly CapabilityPack[]) { for (const pack of packs) this.register(pack); }
  register(pack: CapabilityPack): void {
    if (this.#packs.has(pack.id)) throw new CliError(`Pack already registered: ${pack.id}`);
    this.#packs.set(pack.id, pack);
  }
  list(): readonly CapabilityPack[] { return [...this.#packs.values()]; }
  get(id: string): CapabilityPack {
    const pack = this.#packs.get(id);
    if (!pack) throw new CliError(`Unknown capability pack: ${id}`, { exitCode: 2, hints: [`Run mstack pack list to see curated packs.`] });
    return pack;
  }
  resolve(ids: readonly string[]): readonly CapabilityPack[] {
    const resolved = new Map<string, CapabilityPack>();
    const visit = (id: string) => { const pack = this.get(id); for (const dep of pack.dependencies ?? []) visit(dep); resolved.set(id, pack); };
    ids.forEach(visit); return [...resolved.values()];
  }
  task(id: string): TaskRecipe {
    for (const pack of this.list()) { const task = pack.tasks.find((candidate) => candidate.id === id); if (task) return task; }
    throw new CliError(`Unknown task recipe: ${id}`, { exitCode: 2, hints: ["Run mstack task list to see supported recipes."] });
  }
}
