import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function makeTemplates(root: string): Promise<string> {
  const directory = path.join(root, "templates");
  await mkdir(directory, { recursive: true });
  await Promise.all([
    writeFile(path.join(directory, "product.template.md"), "# Product\n"),
    writeFile(path.join(directory, "architecture.template.md"), "# Architecture\n"),
    writeFile(path.join(directory, "feature.template.md"), "# Feature\n"),
    writeFile(path.join(directory, "adr.template.md"), "# Decision\n"),
  ]);
  return directory;
}
