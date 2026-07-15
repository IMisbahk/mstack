import type { IntegrationAdapter } from "../types.js";
import { aiderAdapter } from "./aider.js";
import { claudeAdapter } from "./claude.js";
import { codexAdapter } from "./codex.js";
import { continueAdapter } from "./continue.js";
import { cursorAdapter } from "./cursor.js";
import { geminiAdapter } from "./gemini.js";

export const builtInAdapters: readonly IntegrationAdapter[] = [
  claudeAdapter,
  codexAdapter,
  cursorAdapter,
  geminiAdapter,
  continueAdapter,
  aiderAdapter,
];

export {
  aiderAdapter,
  claudeAdapter,
  codexAdapter,
  continueAdapter,
  cursorAdapter,
  geminiAdapter,
};
