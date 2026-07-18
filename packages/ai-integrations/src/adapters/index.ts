import type { IntegrationAdapter } from "../types.js";
import { aiderAdapter } from "./aider.js";
import { antigravityAdapter } from "./antigravity.js";
import { claudeAdapter } from "./claude.js";
import { codexAdapter } from "./codex.js";
import { continueAdapter } from "./continue.js";
import { cursorAdapter } from "./cursor.js";
import { geminiAdapter } from "./gemini.js";
import {
  clineAdapter,
  githubCopilotAdapter,
  junieAdapter,
  kimiCodeAdapter,
  kiroAdapter,
  openCodeAdapter,
  qwenCodeAdapter,
  rooCodeAdapter,
} from "./portable.js";

export const builtInAdapters: readonly IntegrationAdapter[] = [
  claudeAdapter,
  codexAdapter,
  cursorAdapter,
  geminiAdapter,
  continueAdapter,
  aiderAdapter,
  antigravityAdapter,
  kimiCodeAdapter,
  githubCopilotAdapter,
  openCodeAdapter,
  kiroAdapter,
  qwenCodeAdapter,
  junieAdapter,
  clineAdapter,
  rooCodeAdapter,
];

export {
  aiderAdapter,
  antigravityAdapter,
  claudeAdapter,
  clineAdapter,
  codexAdapter,
  continueAdapter,
  cursorAdapter,
  geminiAdapter,
  githubCopilotAdapter,
  junieAdapter,
  kimiCodeAdapter,
  kiroAdapter,
  openCodeAdapter,
  qwenCodeAdapter,
  rooCodeAdapter,
};
