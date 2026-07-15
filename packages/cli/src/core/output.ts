import pc from "picocolors";

export interface OutputOptions {
  quiet?: boolean;
  color?: boolean;
  stdout?: NodeJS.WriteStream;
  stderr?: NodeJS.WriteStream;
}

export class Output {
  readonly stdout: NodeJS.WriteStream;
  readonly stderr: NodeJS.WriteStream;
  readonly quiet: boolean;
  readonly colors: ReturnType<typeof pc.createColors>;

  constructor(options: OutputOptions = {}) {
    this.stdout = options.stdout ?? process.stdout;
    this.stderr = options.stderr ?? process.stderr;
    this.quiet = options.quiet ?? false;
    const interactive = Boolean(this.stdout.isTTY && process.env.TERM !== "dumb" && process.env.NO_COLOR === undefined);
    this.colors = pc.createColors(options.color ?? interactive);
  }

  line(message = ""): void {
    if (!this.quiet) this.stdout.write(`${message}\n`);
  }

  info(message: string): void {
    this.line(`${this.colors.cyan("i")} ${message}`);
  }

  success(message: string): void {
    this.line(`${this.colors.green("✓")} ${message}`);
  }

  warn(message: string): void {
    this.stderr.write(`${this.colors.yellow("!")} ${message}\n`);
  }

  error(message: string): void {
    this.stderr.write(`${this.colors.red("✗")} ${message}\n`);
  }

  command(command: string): string {
    return this.colors.cyan(command);
  }

  title(message: string): void {
    this.line(this.colors.bold(message));
  }

  field(label: string, value: string): void {
    this.line(`  ${this.colors.dim(label.padEnd(13))} ${value}`);
  }

  next(message: string): void {
    this.line(`\n${this.colors.bold("Next")}\n  ${message}`);
  }

  json(value: unknown): void {
    this.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
  }
}
