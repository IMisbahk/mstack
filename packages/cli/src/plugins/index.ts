import { buildLikeThisPlugin } from "./build-like-this.js";
import { PluginRegistry } from "./registry.js";

export function createDefaultPluginRegistry(): PluginRegistry {
  return new PluginRegistry([buildLikeThisPlugin]);
}
