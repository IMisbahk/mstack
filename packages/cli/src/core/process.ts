import { spawn } from "node:child_process";
import { CliError } from "./errors.js";

export interface RunOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  stdio?: "inherit" | "pipe";
  timeoutMs?: number;
}

export interface RunResult {
  stdout: string;
  stderr: string;
}

export function run(command: string, args: readonly string[], options: RunOptions = {}): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args], {
      cwd: options.cwd,
      env: options.env ?? process.env,
      stdio: options.stdio === "inherit" ? "inherit" : ["ignore", "pipe", "pipe"],
      shell: false,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timeout = options.timeoutMs === undefined ? undefined : setTimeout(() => {
      timedOut = true;
      child.kill();
      reject(new CliError(`${command} timed out after ${options.timeoutMs}ms.`));
    }, options.timeoutMs);
    timeout?.unref();
    child.stdout?.setEncoding("utf8").on("data", (chunk: string) => (stdout += chunk));
    child.stderr?.setEncoding("utf8").on("data", (chunk: string) => (stderr += chunk));
    child.once("error", (cause) => {
      if (timeout) clearTimeout(timeout);
      reject(new CliError(`Could not run ${command}: ${cause.message}`, { cause }));
    });
    child.once("close", (code, signal) => {
      if (timeout) clearTimeout(timeout);
      if (timedOut) return;
      if (code === 0) return resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
      const detail = stderr.trim() || `exited with ${code ?? signal ?? "an unknown status"}`;
      reject(new CliError(`${command} ${args.join(" ")} failed: ${detail}`));
    });
  });
}

export async function commandExists(command: string): Promise<boolean> {
  try {
    await run(command, ["--version"], { timeoutMs: 1_500 });
    return true;
  } catch {
    return false;
  }
}
