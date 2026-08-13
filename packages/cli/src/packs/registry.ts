import { CliError } from "../core/errors.js";
import type { CapabilityPack, TaskListFilter, TaskRecipe } from "./types.js";

export interface ListedTask {
  readonly pack: string;
  readonly task: TaskRecipe;
}

export class PackRegistry {
  #packs = new Map<string, CapabilityPack>();
  #tasks = new Map<string, ListedTask>();

  constructor(packs: readonly CapabilityPack[]) {
    for (const pack of packs) this.register(pack);
  }

  register(pack: CapabilityPack): void {
    if (this.#packs.has(pack.id)) throw new CliError(`Pack already registered: ${pack.id}`);
    this.#packs.set(pack.id, pack);
    for (const task of pack.tasks) {
      const existing = this.#tasks.get(task.id);
      if (existing) throw new CliError(`Duplicate task recipe: ${task.id}`, { exitCode: 2, hints: [`Already provided by ${existing.pack}.`] });
      this.#tasks.set(task.id, { pack: pack.id, task });
    }
  }

  list(): readonly CapabilityPack[] {
    return [...this.#packs.values()];
  }

  get(id: string): CapabilityPack {
    const pack = this.#packs.get(id);
    if (!pack) throw new CliError(`Unknown capability pack: ${id}`, { exitCode: 2, hints: [`Run mstack pack list to see curated packs.`] });
    return pack;
  }

  resolve(ids: readonly string[]): readonly CapabilityPack[] {
    const resolved = new Map<string, CapabilityPack>();
    const visit = (id: string) => {
      const pack = this.get(id);
      for (const dep of pack.dependencies ?? []) visit(dep);
      resolved.set(id, pack);
    };
    ids.forEach(visit);
    return [...resolved.values()];
  }

  tasks(filter: TaskListFilter = {}): readonly ListedTask[] {
    if (filter.pack !== undefined) this.get(filter.pack);
    return [...this.#tasks.values()].filter((item) => {
      if (filter.pack !== undefined && item.pack !== filter.pack) return false;
      if (filter.risk !== undefined && item.task.risk !== filter.risk) return false;
      return true;
    });
  }

  task(id: string): TaskRecipe {
    const listed = this.#tasks.get(id);
    if (!listed) throw new CliError(`Unknown task recipe: ${id}`, { exitCode: 2, hints: ["Run mstack task list to see supported recipes."] });
    return listed.task;
  }

  taskPack(id: string): string {
    const listed = this.#tasks.get(id);
    if (!listed) throw new CliError(`Unknown task recipe: ${id}`, { exitCode: 2, hints: ["Run mstack task list to see supported recipes."] });
    return listed.pack;
  }
}
