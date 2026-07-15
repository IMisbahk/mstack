import { CommanderError } from "commander";
import { createProgram } from "./program.js";
import { CliError, errorMessage } from "./core/errors.js";
import { Output } from "./core/output.js";

async function main(): Promise<void> {
  const json = process.argv.includes("--json");
  const output = new Output({ color: !process.argv.includes("--no-color") });
  try {
    await createProgram().parseAsync(process.argv);
  } catch (error) {
    if (error instanceof CommanderError) {
      process.exitCode = error.exitCode;
      return;
    }
    if (error instanceof CliError) {
      if (json) {
        output.json({ schemaVersion: 1, ok: false, error: { code: error.code, message: error.message, hints: error.hints } });
        process.exitCode = error.exitCode;
        return;
      }
      output.error(error.message);
      for (const hint of error.hints) output.warn(hint);
      output.line(`Error: ${error.code}`);
      process.exitCode = error.exitCode;
      return;
    }
    output.error(errorMessage(error));
    if (process.env.MSTACK_DEBUG === "1" && error instanceof Error && error.stack) output.error(error.stack);
    process.exitCode = 1;
  }
}

await main();
