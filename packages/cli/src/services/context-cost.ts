import {
  buildTokenBudget,
  createBuildLikeThisRuntime,
  type InstallProfile,
  type TokenBudgetReport,
} from "../../../ai-integrations/src/index.js";
import { ConfigStore } from "./config.js";
import { readInstallChannel } from "./distribution.js";

export async function inspectContextCost(cwd: string): Promise<{
  readonly profile: InstallProfile;
  readonly channel: string | null;
  readonly tokenBudget: TokenBudgetReport;
}> {
  const config = new ConfigStore({ cwd });
  const preferences = await config.resolved();
  const channel = await readInstallChannel((await config.projectRoot()) ?? cwd);
  const profile = channel?.profile ?? preferences.installProfile ?? "full";
  const arena = preferences.arena ?? false;
  const project = await config.project();
  const projectName = project?.project?.name?.trim() || "Project";
  const spec = createBuildLikeThisRuntime({ projectName, profile, arena });
  return {
    profile,
    channel: channel?.channel ?? null,
    tokenBudget: buildTokenBudget({
      profile,
      skills: spec.skills ?? [],
      prompts: spec.prompts ?? [],
      agents: spec.agents ?? [],
    }),
  };
}
