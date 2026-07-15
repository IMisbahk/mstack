import { Command, Option } from "commander";
import pc from "picocolors";
import { Output } from "./core/output.js";
import { ConfigStore } from "./services/config.js";
import { DESCRIPTION, VERSION } from "./meta.js";
import { packagedTemplatesDirectory } from "./services/scaffold.js";
import { initCommand } from "./commands/init.js";
import { configGetCommand, configListCommand, configSetCommand, configUnsetCommand } from "./commands/config.js";
import { doctorCommand } from "./commands/doctor.js";
import { updateCommandHandler } from "./commands/update.js";
import { explainCommand, statusCommand } from "./commands/status.js";
import { aiListCommand, aiSetupCommand } from "./commands/ai.js";
import { pluginsCommand } from "./commands/plugins.js";

export interface ProgramOptions {
  cwd?: string;
  templatesDirectory?: string;
  output?: Output;
}

interface Globals {
  cwd: string;
  quiet: boolean;
  color: boolean;
}

export function createProgram(options: ProgramOptions = {}): Command {
  const defaultCwd = options.cwd ?? process.cwd();
  const templatesDirectory = options.templatesDirectory ?? packagedTemplatesDirectory();
  const suppliedOutput = options.output;
  const program = new Command();

  program
    .name("mstack")
    .description(DESCRIPTION)
    .version(VERSION, "-v, --version")
    .option("-C, --cwd <directory>", "run as if mstack was started in this directory", defaultCwd)
    .option("-q, --quiet", "suppress non-error output", false)
    .option("--no-color", "disable terminal colors")
    .showSuggestionAfterError(true)
    .showHelpAfterError("Run mstack --help for usage.")
    .configureHelp({
      sortSubcommands: true,
      sortOptions: true,
    })
    .addHelpText("after", `\nExamples:\n  $ mstack init\n  $ mstack status\n  $ mstack ai setup\n  $ mstack doctor --json`);

  const globals = (command: Command): { values: Globals; output: Output } => {
    const values = command.optsWithGlobals<Globals>();
    return { values, output: suppliedOutput ?? new Output({ quiet: values.quiet, color: values.color }) };
  };

  program
    .command("init [directory]", { isDefault: true })
    .description("install Misbah's Build Like This workflow or bootstrap a project")
    .option("--name <name>", "set the project name")
    .option("--from <repository>", "bootstrap from a Git repository")
    .option("--ref <branch-or-tag>", "check out a branch or tag when bootstrapping")
    .addOption(new Option("--package-manager <manager>", "set the preferred package manager").choices(["npm", "pnpm", "yarn", "bun"]))
    .option("--no-git", "do not initialize a Git repository")
    .option("--templates", "include planning templates")
    .option("--no-templates", "do not include planning templates")
    .option("--install", "install dependencies after bootstrapping", false)
    .option("-f, --force", "replace existing managed files", false)
    .option("-y, --yes", "accept defaults without prompting", false)
    .option("--dry-run", "preview the complete setup without writing files", false)
    .option("--json", "print a versioned JSON result", false)
    .action(async (directory: string | undefined, local: {
      name?: string;
      from?: string;
      ref?: string;
      packageManager?: string;
      git: boolean;
      templates?: boolean;
      install: boolean;
      force: boolean;
      yes: boolean;
      dryRun: boolean;
      json: boolean;
    }, command: Command) => {
      const context = globals(command);
      const templatesWereSpecified = command.getOptionValueSource("templates") === "cli";
      await initCommand({
        cwd: context.values.cwd,
        ...(directory ? { directory } : {}),
        ...(local.name ? { name: local.name } : {}),
        ...(local.from ? { from: local.from } : {}),
        ...(local.ref ? { ref: local.ref } : {}),
        ...(local.packageManager ? { packageManager: local.packageManager } : {}),
        git: local.git,
        ...(templatesWereSpecified ? { templates: local.templates } : {}),
        install: local.install,
        force: local.force,
        yes: local.yes,
        dryRun: local.dryRun,
        json: local.json,
        templatesDirectory,
        output: context.output,
      });
    });

  program
    .command("status")
    .description("show repository readiness and the next recommended action")
    .option("--json", "print a versioned JSON report", false)
    .action(async (local: { json: boolean }, command: Command) => {
      const context = globals(command);
      await statusCommand(context.values.cwd, context.output, local.json);
    });

  program
    .command("explain")
    .description("walk through Misbah's Build Like This workflow in this repository")
    .option("--json", "print a versioned JSON report", false)
    .action(async (local: { json: boolean }, command: Command) => {
      const context = globals(command);
      await explainCommand(context.values.cwd, context.output, local.json);
    });

  const ai = program.command("ai").description("configure AI coding environments for this repository");
  ai
    .command("setup [runtimes...]", { isDefault: true })
    .description("install Misbah's Build Like This agent, prompt, skill, hook, and instruction pack")
    .option("--all", "configure every supported runtime", false)
    .option("--dry-run", "preview files and limitations without writing", false)
    .option("-f, --force", "replace conflicting generated targets", false)
    .option("-y, --yes", "use detected runtimes without prompting", false)
    .option("--json", "print a versioned JSON result", false)
    .addHelpText("after", "\nRuntime IDs:\n  claude-code, codex, cursor, gemini-cli, continue, aider")
    .action(async (runtimes: string[], local: { all: boolean; dryRun: boolean; force: boolean; yes: boolean; json: boolean }, command: Command) => {
      const context = globals(command);
      await aiSetupCommand({ cwd: context.values.cwd, runtimes, ...local, output: context.output });
    });
  ai
    .command("list")
    .description("show supported, detected, and configured AI coding environments")
    .option("--json", "print a versioned JSON report", false)
    .action(async (local: { json: boolean }, command: Command) => {
      const context = globals(command);
      await aiListCommand(context.values.cwd, context.output, local.json);
    });

  const plugins = program.command("plugins").description("inspect installed mstack capability plugins");
  plugins
    .command("list", { isDefault: true })
    .description("show plugin contributions")
    .option("--json", "print a versioned JSON report", false)
    .action((local: { json: boolean }, command: Command) => {
      const context = globals(command);
      pluginsCommand(context.output, local.json);
    });

  const config = program.command("config").description("inspect or change mstack configuration");
  config
    .command("list", { isDefault: true })
    .description("print resolved configuration")
    .option("--json", "print JSON", false)
    .action(async (local: { json: boolean }, command: Command) => {
      const context = globals(command);
      await configListCommand(new ConfigStore({ cwd: context.values.cwd }), context.output, local.json);
    });
  config
    .command("get <key>")
    .description("print a resolved configuration value")
    .action(async (key: string, _local: unknown, command: Command) => {
      const context = globals(command);
      await configGetCommand(new ConfigStore({ cwd: context.values.cwd }), context.output, key);
    });
  config
    .command("set <key> <value>")
    .description("set a project configuration value")
    .option("-g, --global", "write to user configuration", false)
    .action(async (key: string, value: string, local: { global: boolean }, command: Command) => {
      const context = globals(command);
      await configSetCommand(new ConfigStore({ cwd: context.values.cwd }), context.output, key, value, local.global);
    });
  config
    .command("unset <key>")
    .description("remove a project configuration value")
    .option("-g, --global", "write to user configuration", false)
    .action(async (key: string, local: { global: boolean }, command: Command) => {
      const context = globals(command);
      await configUnsetCommand(new ConfigStore({ cwd: context.values.cwd }), context.output, key, local.global);
    });

  program
    .command("doctor")
    .description("inspect the runtime and current project")
    .option("--json", "print JSON", false)
    .action(async (local: { json: boolean }, command: Command) => {
      const context = globals(command);
      await doctorCommand(context.values.cwd, context.output, local.json);
    });

  program
    .command("update")
    .description("check for and apply mstack updates")
    .addOption(new Option("--manager <manager>", "choose the global package manager").choices(["npm", "pnpm", "yarn", "bun"]))
    .option("-y, --yes", "apply an available update without prompting", false)
    .action(async (local: { manager?: string; yes: boolean }, command: Command) => {
      const context = globals(command);
      await updateCommandHandler({ ...(local.manager ? { manager: local.manager } : {}), yes: local.yes, output: context.output });
    });

  program.configureOutput({
    writeOut: (text) => (suppliedOutput?.stdout ?? process.stdout).write(text),
    writeErr: (text) => (suppliedOutput?.stderr ?? process.stderr).write(pc.red(text)),
  });
  return program;
}
