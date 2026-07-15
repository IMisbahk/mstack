import type { Output } from "../core/output.js";
import { CliError } from "../core/errors.js";
import { ConfigStore, CONFIG_KEYS, isConfigKey, type ConfigKey } from "../services/config.js";

function requireKey(value: string): ConfigKey {
  if (!isConfigKey(value)) {
    throw new CliError(`Unknown configuration key ${value}.`, {
      hints: [`Available keys: ${CONFIG_KEYS.join(", ")}.`],
    });
  }
  return value;
}

export async function configListCommand(store: ConfigStore, output: Output, json: boolean): Promise<void> {
  const resolved = await store.resolved();
  if (json) return output.json({ schemaVersion: 1, preferences: resolved });
  for (const key of CONFIG_KEYS) {
    const value = resolved[key];
    output.line(`${key}=${value === undefined ? "" : String(value)}`);
  }
}

export async function configGetCommand(store: ConfigStore, output: Output, rawKey: string): Promise<void> {
  const key = requireKey(rawKey);
  const value = (await store.resolved())[key];
  if (value === undefined) throw new CliError(`${key} is not set.`, { exitCode: 2 });
  output.line(String(value));
}

export async function configSetCommand(store: ConfigStore, output: Output, rawKey: string, value: string, global: boolean): Promise<void> {
  const key = requireKey(rawKey);
  const location = await store.set(key, value, global ? "global" : "project");
  output.success(`Set ${key} in ${location}`);
}

export async function configUnsetCommand(store: ConfigStore, output: Output, rawKey: string, global: boolean): Promise<void> {
  const key = requireKey(rawKey);
  const location = await store.unset(key, global ? "global" : "project");
  output.success(`Removed ${key} from ${location}`);
}
