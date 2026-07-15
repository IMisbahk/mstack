import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
const expected = `mstack-v${packageJson.version}`;
const actual = process.env.RELEASE_TAG;

if (actual !== expected) {
  console.error(`Release tag ${actual ?? "<missing>"} does not match package version ${packageJson.version}; expected ${expected}.`);
  process.exitCode = 1;
} else {
  console.log(`Publishing mstack ${packageJson.version}.`);
}
