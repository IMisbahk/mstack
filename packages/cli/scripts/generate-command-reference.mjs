import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createProgram } from "../dist/index.js";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const destination = path.resolve(packageRoot, "..", "..", "docs", "cli", "command-reference.md");
const program = createProgram({ cwd: "." });
const commands = [];

function visit(command, parents = []) {
  const name = [...parents, command.name()].join(" ");
  if (parents.length > 0) commands.push({ name, help: command.helpInformation().trimEnd() });
  for (const child of command.commands) visit(child, [...parents, command.name()]);
}

visit(program);
const content = `# mstack command reference

> Generated from mstack ${program.version()}. Run \`pnpm --filter @imisbahk/mstack build && pnpm --filter @imisbahk/mstack docs:generate\` after changing the command surface.

## Global command

\`\`\`text
${program.helpInformation().trimEnd()}
\`\`\`

${commands.map(({ name, help }) => `## ${name}\n\n\`\`\`text\n${help}\n\`\`\``).join("\n\n")}
`;

await mkdir(path.dirname(destination), { recursive: true });
await writeFile(destination, content, "utf8");
console.log(`Generated ${path.relative(process.cwd(), destination)}`);
