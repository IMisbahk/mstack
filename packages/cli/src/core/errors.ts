export class CliError extends Error {
  readonly exitCode: number;
  readonly hints: readonly string[];
  readonly code: string;

  constructor(message: string, options: { exitCode?: number; hints?: readonly string[]; code?: string; cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = "CliError";
    this.exitCode = options.exitCode ?? 1;
    this.hints = options.hints ?? [];
    this.code = options.code ?? (this.exitCode === 2 ? "INVALID_INPUT" : "OPERATION_FAILED");
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
