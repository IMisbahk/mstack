export { createProgram, type ProgramOptions } from "./program.js";
export { CliError } from "./core/errors.js";
export { ConfigStore, type PackageManager, type Preferences, type ProjectConfig } from "./services/config.js";
export { detectInvocationPackageManager, detectProject, type ProjectDetails } from "./services/project.js";
export { scaffoldProject, type ScaffoldOptions, type ScaffoldResult } from "./services/scaffold.js";
export { fetchLatestVersion, hasUpdate, updateCommand } from "./services/packages.js";
export { inspectRepository, type DocumentHealth, type RepositoryHealth } from "./services/health.js";
export { readManifest, updateManifest, verifyManifest, type MstackManifest } from "./services/manifest.js";
export { VERSION } from "./meta.js";
