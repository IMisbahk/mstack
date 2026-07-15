import { defineConfig } from "tsup";
import { chmod, readFile, writeFile } from "node:fs/promises";

export default defineConfig({
  entry: ["src/cli.ts", "src/index.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  bundle: true,
  clean: true,
  dts: true,
  sourcemap: true,
  splitting: false,
  onSuccess: async () => {
    const cli = new URL("./dist/cli.js", import.meta.url);
    const output = await readFile(cli, "utf8");
    await writeFile(cli, `#!/usr/bin/env node\n${output}`);
    await chmod(cli, 0o755);
  },
});
