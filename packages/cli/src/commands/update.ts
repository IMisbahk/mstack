import * as prompts from "@clack/prompts";
import type { Output } from "../core/output.js";
import { CliError } from "../core/errors.js";
import { PACKAGE_MANAGERS, type PackageManager } from "../services/config.js";
import { applyUpdate, fetchLatestVersion, hasUpdate, updateCommand } from "../services/packages.js";
import { PACKAGE_NAME, VERSION } from "../meta.js";
import { detectInvocationPackageManager } from "../services/project.js";

function inferredManager(): PackageManager {
  return detectInvocationPackageManager() ?? "npm";
}

export async function updateCommandHandler(options: { manager?: string; yes: boolean; output: Output }): Promise<void> {
  const manager = options.manager ?? inferredManager();
  if (!PACKAGE_MANAGERS.includes(manager as PackageManager)) {
    throw new CliError(`Unknown package manager ${manager}.`, { hints: [`Choose one of: ${PACKAGE_MANAGERS.join(", ")}.`] });
  }
  options.output.info("Checking the npm registry…");
  const { latest } = await fetchLatestVersion(PACKAGE_NAME);
  if (!hasUpdate(VERSION, latest)) {
    options.output.success(`mstack ${VERSION} is up to date.`);
    return;
  }

  const command = updateCommand(manager as PackageManager, PACKAGE_NAME);
  options.output.warn(`mstack ${latest} is available (current: ${VERSION}).`);
  let shouldApply = options.yes;
  if (!shouldApply && process.stdin.isTTY && process.stdout.isTTY) {
    const answer = await prompts.confirm({ message: `Run ${command.display}?`, initialValue: true });
    if (prompts.isCancel(answer)) return;
    shouldApply = answer;
  }
  if (!shouldApply) {
    options.output.line(`Update with: ${options.output.command(command.display)}`);
    return;
  }
  await applyUpdate(manager as PackageManager, PACKAGE_NAME);
  options.output.success(`Updated mstack to ${latest}.`);
}
