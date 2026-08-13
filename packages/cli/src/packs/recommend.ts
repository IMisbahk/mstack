import path from "node:path";
import { pathExists, readJson } from "../core/fs.js";
import { builtInPacks } from "./builtins.js";
import { PackRegistry } from "./registry.js";
import { readManifest } from "../services/manifest.js";

export type RecommendationConfidence = "high" | "medium" | "low";

export interface PackRecommendation {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  readonly reasons: readonly string[];
  readonly confidence: RecommendationConfidence;
  readonly alreadySelected: boolean;
}

export interface PackRecommendReport {
  readonly schemaVersion: 1;
  readonly root: string;
  readonly recommendations: readonly PackRecommendation[];
}

interface PackageManifest {
  readonly bin?: unknown;
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly optionalDependencies?: Readonly<Record<string, string>>;
  readonly scripts?: Readonly<Record<string, string>>;
}

const markerReasons: readonly { file: string; pack: string; reason: string }[] = [
  { file: "package.json", pack: "repository-intelligence", reason: "package.json describes Node package metadata." },
  { file: "Cargo.toml", pack: "systems", reason: "Cargo.toml indicates a Rust workspace or crate." },
  { file: "go.mod", pack: "systems", reason: "go.mod indicates a Go module." },
  { file: "go.mod", pack: "cli-devtools", reason: "Go modules commonly ship command-line tools." },
  { file: "pyproject.toml", pack: "data-ml", reason: "pyproject.toml indicates a Python project." },
  { file: "requirements.txt", pack: "data-ml", reason: "requirements.txt lists Python dependencies." },
  { file: "Dockerfile", pack: "infrastructure-security", reason: "Dockerfile describes a container build." },
  { file: "Dockerfile", pack: "observability", reason: "Container images usually need health and log guidance." },
  { file: "compose.yaml", pack: "observability", reason: "Compose files describe local multi-process topology." },
  { file: "compose.yml", pack: "observability", reason: "Compose files describe local multi-process topology." },
  { file: "docker-compose.yml", pack: "infrastructure-security", reason: "docker-compose.yml describes service topology." },
  { file: "docker-compose.yaml", pack: "infrastructure-security", reason: "docker-compose.yaml describes service topology." },
  { file: "platformio.ini", pack: "embedded-firmware", reason: "platformio.ini indicates a firmware project." },
  { file: "west.yml", pack: "embedded-firmware", reason: "west.yml indicates a Zephyr/west workspace." },
  { file: "CMakeLists.txt", pack: "systems", reason: "CMakeLists.txt indicates a native build." },
  { file: "CMakeLists.txt", pack: "embedded-firmware", reason: "CMake is a common firmware build surface." },
  { file: "pubspec.yaml", pack: "mobile", reason: "pubspec.yaml indicates a Flutter or Dart client." },
  { file: "project.godot", pack: "games-graphics", reason: "project.godot indicates a Godot project." },
  { file: "main.tf", pack: "infrastructure-security", reason: "main.tf indicates Terraform configuration." },
  { file: "terraform/main.tf", pack: "infrastructure-security", reason: "terraform/main.tf indicates Terraform configuration." },
  { file: "prisma/schema.prisma", pack: "backend-api", reason: "prisma/schema.prisma indicates a persistence contract." },
  { file: "openapi.yaml", pack: "backend-api", reason: "openapi.yaml describes an HTTP contract." },
  { file: "openapi.json", pack: "backend-api", reason: "openapi.json describes an HTTP contract." },
  { file: "docs", pack: "documentation", reason: "docs/ is present as a documentation tree." },
  { file: "android", pack: "mobile", reason: "android/ indicates a native Android tree." },
  { file: "ios", pack: "mobile", reason: "ios/ indicates a native iOS tree." },
  { file: "package.xml", pack: "robotics", reason: "package.xml may indicate a ROS package." },
  { file: "playwright.config.ts", pack: "qa-testing", reason: "playwright.config.ts indicates browser verification." },
  { file: "playwright.config.js", pack: "qa-testing", reason: "playwright.config.js indicates browser verification." },
  { file: "vitest.config.ts", pack: "qa-testing", reason: "vitest.config.ts indicates a unit/integration test runner." },
  { file: "jest.config.ts", pack: "qa-testing", reason: "jest.config.ts indicates a JavaScript test runner." },
];

const webDependencies = ["next", "react", "vue", "nuxt", "svelte", "remix", "astro", "@angular/core"];
const apiDependencies = ["express", "fastify", "hono", "@nestjs/core", "prisma", "drizzle-orm", "openapi-typescript"];
const mobileDependencies = ["react-native", "expo", "@capacitor/core"];
const gameDependencies = ["three", "pixi.js", "babylonjs"];
const cliDependencies = ["commander", "citty", "yargs", "cac"];
const telemetryDependencies = ["pino", "winston", "@opentelemetry/api"];
const mlDependencies = ["torch", "pytorch", "scikit-learn", "tensorflow", "pandas"];
const qaDependencies = ["playwright", "cypress", "vitest", "jest", "@testing-library/react"];

function dependencyNames(manifest: PackageManifest): Set<string> {
  return new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
  ]);
}

function hasAny(names: Set<string>, candidates: readonly string[]): string | undefined {
  return candidates.find((name) => names.has(name));
}

function confidenceFor(reasonCount: number): RecommendationConfidence {
  if (reasonCount >= 3) return "high";
  if (reasonCount >= 2) return "high";
  return "medium";
}

export async function recommendPacks(root: string): Promise<PackRecommendReport> {
  const registry = new PackRegistry(builtInPacks);
  const selected = new Set((await readManifest(root))?.packs?.map((pack) => pack.id) ?? []);
  const reasons = new Map<string, string[]>();
  const addReason = (pack: string, reason: string) => {
    const list = reasons.get(pack) ?? [];
    if (!list.includes(reason)) list.push(reason);
    reasons.set(pack, list);
  };

  if (await pathExists(path.join(root, ".git"))) {
    addReason("repository-intelligence", ".git is present, so repository maps and git recipes apply.");
  }

  for (const marker of markerReasons) {
    if (await pathExists(path.join(root, marker.file))) addReason(marker.pack, marker.reason);
  }

  const packagePath = path.join(root, "package.json");
  if (await pathExists(packagePath)) {
    try {
      const manifest = await readJson<PackageManifest>(packagePath);
      const names = dependencyNames(manifest);
      const web = hasAny(names, webDependencies);
      if (web) addReason("software-web", `package.json depends on ${web}.`);
      const api = hasAny(names, apiDependencies);
      if (api) addReason("backend-api", `package.json depends on ${api}.`);
      const mobile = hasAny(names, mobileDependencies);
      if (mobile) addReason("mobile", `package.json depends on ${mobile}.`);
      const game = hasAny(names, gameDependencies);
      if (game) addReason("games-graphics", `package.json depends on ${game}.`);
      const cli = hasAny(names, cliDependencies);
      if (cli || manifest.bin !== undefined) {
        addReason("cli-devtools", cli ? `package.json depends on ${cli}.` : "package.json declares a bin entry.");
      }
      const telemetry = hasAny(names, telemetryDependencies);
      if (telemetry) addReason("observability", `package.json depends on ${telemetry}.`);
      const ml = hasAny(names, mlDependencies);
      if (ml) addReason("data-ml", `package.json depends on ${ml}.`);
      const qa = hasAny(names, qaDependencies);
      if (qa) addReason("qa-testing", `package.json depends on ${qa}.`);
      if (manifest.scripts && Object.keys(manifest.scripts).some((name) => /test|lint|typecheck/.test(name))) {
        addReason("qa-testing", "package.json declares verification scripts.");
      }
    } catch {
      addReason("repository-intelligence", "package.json exists but could not be parsed; inspect it before selecting packs.");
    }
  }

  const recommendations = [...reasons.entries()]
    .map(([id, packReasons]) => {
      const pack = registry.get(id);
      return {
        id,
        displayName: pack.displayName,
        description: pack.description,
        reasons: packReasons,
        confidence: confidenceFor(packReasons.length),
        alreadySelected: selected.has(id),
      };
    })
    .sort((left, right) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return rank[left.confidence] - rank[right.confidence] || left.id.localeCompare(right.id);
    });

  return { schemaVersion: 1, root, recommendations };
}
