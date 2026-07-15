import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(packageRoot, "..", "..", "templates");
const destination = path.join(packageRoot, "templates");
const entries = (await readdir(source, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".md"));

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await Promise.all(entries.map((entry) => cp(path.join(source, entry.name), path.join(destination, entry.name))));
