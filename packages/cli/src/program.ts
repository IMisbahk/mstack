import path from "node:path";
import { Argument, Command, Option } from "commander";
import pc from "picocolors";
import { Output } from "./core/output.js";
import { ConfigStore } from "./services/config.js";
import { DESCRIPTION, VERSION } from "./meta.js";
import { packagedTemplatesDirectory } from "./services/scaffold.js";
import { initCommand } from "./commands/init.js";
import { configGetCommand, configListCommand, configSetCommand, configUnsetCommand } from "./commands/config.js";
import { doctorCommand, hasBlockingDoctorIssue } from "./commands/doctor.js";
import { updateCommandHandler } from "./commands/update.js";
import { explainCommand, statusCommand } from "./commands/status.js";
import { aiListCommand, aiSetupCommand } from "./commands/ai.js";
import { pluginsCommand } from "./commands/plugins.js";
import { catalogCommand, CATALOG_KINDS, type CatalogKind } from "./commands/catalog.js";
import { packAddCommand, packInfoCommand, packListCommand, packRecommendCommand, packRemoveCommand } from "./commands/packs.js";
import { taskListCommand, taskRunCommand, taskShowCommand } from "./commands/tasks.js";
import { agentCommand } from "./commands/agents.js";
import { validateCommand } from "./commands/validate.js";
import { createDefaultRegistry } from "../../ai-integrations/src/index.js";
import { TASK_RISKS } from "./packs/types.js";

export interface ProgramOptions {
  cwd?: string;
  templatesDirectory?: string;
  output?: Output;
}

interface Globals {
  cwd?: string;
  quiet: boolean;
  color: boolean;
}

interface ResolvedGlobals {
  cwd: string;
  quiet: boolean;
  color: boolean;
}

export function createProgram(options: ProgramOptions = {}): Command {
  const defaultCwd = options.cwd ?? process.cwd();
  const templatesDirectory = options.templatesDirectory ?? packagedTemplatesDirectory();
  const suppliedOutput = options.output;
  const program = new Command();
  const runtimeIds = createDefaultRegistry().list().map((adapter) => adapter.id).join(", ");

  program
    .name("mstack")
    .description(DESCRIPTION)
    .version(VERSION, "-v, --version")
    .option("-C, --cwd <directory>", "run as if mstack was started in this directory")
    .option("-q, --quiet", "suppress non-error output", false)
    .option("--no-color", "disable terminal colors")
    .showSuggestionAfterError(true)
    .showHelpAfterError("Run mstack --help for usage.")
    .configureHelp({
      sortSubcommands: true,
      sortOptions: true,
    })
    .addHelpText("after", `\nExamples:\n  $ mstack init\n  $ mstack ai setup\n  $ mstack catalog agents\n  $ mstack pack recommend\n  $ mstack task list --risk read-only\n  $ mstack validate --strict\n  $ mstack doctor --json`);

  const globals = (command: Command): { values: ResolvedGlobals; output: Output } => {
    const raw = command.optsWithGlobals<Globals>();
    const values: ResolvedGlobals = { cwd: raw.cwd ?? defaultCwd, quiet: raw.quiet, color: raw.color };
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
    .option("-y, --yes", "accept the displayed runtime plan without prompting", false)
    .option("--json", "print a versioned JSON result", false)
    .addHelpText("after", `\nRuntime IDs:\n  ${runtimeIds}`)
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

  program
    .command("catalog")
    .description("discover packs, agents, skills, prompts, hooks, templates, and task recipes")
    .addArgument(new Argument("[kind]", "limit results to one resource kind").choices([...CATALOG_KINDS]))
    .option("--query <text>", "filter by id, description, or pack")
    .option("--json", "print a versioned JSON catalog", false)
    .action((kind: CatalogKind | undefined, local: { json: boolean; query?: string }, command: Command) => {
      const context = globals(command);
      catalogCommand(context.output, kind, local.json, local.query);
    });

  const pack = program.command("pack").description("discover and manage curated capability packs");
  pack.command("list", { isDefault: true }).description("show curated packs").option("--json", "print a versioned JSON result", false).action((local: { json: boolean }, command: Command) => { const context = globals(command); packListCommand(context.output, local.json); });
  pack.command("info <id>").description("show pack resources and prerequisites").option("--json", "print a versioned JSON result", false).action((id: string, local: { json: boolean }, command: Command) => { const context = globals(command); packInfoCommand(context.output, id, local.json); });
  pack.command("recommend").description("suggest curated packs from repository evidence without installing them").option("--json", "print a versioned JSON result", false).action(async (local: { json: boolean }, command: Command) => { const context = globals(command); await packRecommendCommand(context.values.cwd, context.output, local.json); });
  pack.command("add <ids...>").description("preview and install curated packs into compatible configured runtimes").option("--runtime <id...>", "also configure these runtimes").option("-y, --yes", "accept the displayed plan", false).option("--dry-run", "preview without writing", false).option("--json", "print a versioned JSON result", false).action(async (ids: string[], local: { runtime?: string[]; yes: boolean; dryRun: boolean; json: boolean }, command: Command) => { const context = globals(command); await packAddCommand({ cwd: context.values.cwd, ids, runtimes: local.runtime ?? [], yes: local.yes, dryRun: local.dryRun, json: local.json, output: context.output }); });
  pack.command("remove <ids...>").description("remove selected packs and reconcile owned runtime files").option("-y, --yes", "accept the displayed reconciliation plan", false).option("--dry-run", "preview without writing", false).option("--json", "print a versioned JSON result", false).action(async (ids: string[], local: { yes: boolean; dryRun: boolean; json: boolean }, command: Command) => { const context = globals(command); await packRemoveCommand({ cwd: context.values.cwd, ids, yes: local.yes, dryRun: local.dryRun, json: local.json, output: context.output }); });
  pack.command("update").description("reconcile selected packs through ai setup").option("-y, --yes", "accept the displayed plan", false).option("--dry-run", "preview without writing", false).option("--json", "print a versioned JSON result", false).action(async (local: { yes: boolean; dryRun: boolean; json: boolean }, command: Command) => { const context = globals(command); await packAddCommand({ cwd: context.values.cwd, ids: [], runtimes: [], yes: local.yes, dryRun: local.dryRun, json: local.json, output: context.output }); });

  program.command("agent [id]").description("list installed specialists and runtime invocation guidance; does not execute models").option("--json", "print a versioned JSON result", false).action(async (id: string | undefined, local: { json: boolean }, command: Command) => { const context = globals(command); await agentCommand(context.values.cwd, context.output, id, local.json); });

  const task = program.command("task").description("inspect and run curated, policy-gated argv-only task recipes");
  task.command("list", { isDefault: true }).description("list task recipes").option("--pack <id>", "limit results to one pack").addOption(new Option("--risk <class>", "limit results to one risk class").choices([...TASK_RISKS])).option("--json", "print a versioned JSON result", false).action((local: { json: boolean; pack?: string; risk?: typeof TASK_RISKS[number] }, command: Command) => { const context = globals(command); taskListCommand(context.output, local.json, { ...(local.pack === undefined ? {} : { pack: local.pack }), ...(local.risk === undefined ? {} : { risk: local.risk }) }); });
  task.command("show <id>").description("show a task recipe").option("--json", "print a versioned JSON result", false).action((id: string, local: { json: boolean }, command: Command) => { const context = globals(command); taskShowCommand(context.output, id, local.json); });
  task.command("run <id>").description("run one policy-gated task recipe").option("--input <name=value...>", "provide a declared recipe input").option("-y, --yes", "approve task execution", false).option("--dry-run", "preview argv without executing", false).option("--json", "print a versioned JSON result", false).action(async (id: string, local: { input?: string[]; yes: boolean; dryRun: boolean; json: boolean }, command: Command) => { const context = globals(command); await taskRunCommand({ cwd: context.values.cwd, id, yes: local.yes, dryRun: local.dryRun, json: local.json, ...(local.input === undefined ? {} : { inputs: local.input }), output: context.output }); });

  program
    .command("validate [directory]")
    .description("verify repository readiness and managed AI runtime integrity")
    .option("--strict", "treat warnings as validation failures", false)
    .option("--json", "print a versioned JSON report", false)
    .action(async (directory: string | undefined, local: { strict: boolean; json: boolean }, command: Command) => {
      const context = globals(command);
      const report = await validateCommand(path.resolve(context.values.cwd, directory ?? "."), context.output, local);
      if (!report.valid) process.exitCode = 4;
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
      const report = await doctorCommand(context.values.cwd, context.output, local.json);
      if (hasBlockingDoctorIssue(report)) process.exitCode = 1;
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
