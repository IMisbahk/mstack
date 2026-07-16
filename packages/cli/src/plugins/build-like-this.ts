import { createBuildLikeThisRuntime } from "../../../ai-integrations/src/index.js";
import type { MstackPlugin } from "./types.js";

export const buildLikeThisPlugin: MstackPlugin = {
  id: "build-like-this",
  version: "1.1.0",
  displayName: "Build Like This",
  description: "Misbah Khursheed's opinionated product-to-production engineering workflow",
  templates: [
    { id: "repository", description: "Repository boundaries, entry points, workflow, and quality gates" },
    { id: "product", description: "Product intent, users, scope, and success criteria" },
    { id: "architecture", description: "System boundaries, contracts, and operational design" },
    { id: "feature", description: "Feature outcome, behavior, rollout, and measurement" },
    { id: "adr", description: "Consequential engineering decision record" },
  ],
  generators: [
    { id: "repository-onboarding", description: "Repository guidance, runtime assets, and health checks" },
  ],
  integrations: [
    {
      id: "build-like-this",
      displayName: "Build Like This engineering pack",
      description: "Project guidance, specialist agents, reusable prompts, skills, hooks, and templates",
      createSpec: ({ projectName }) => createBuildLikeThisRuntime({
        projectName,
        projectDescription: "This host repository is the project being built. Build Like This is the engineering method, and mstack is the installer that adds the method to the project. They describe how to work, not what to build, unless project-owned documentation explicitly makes them the product.",
        projectInstructions: "Treat the project's own docs/ directory, code, and tests as its sources of truth. Read docs/product.md and docs/architecture.md before material implementation work, preserve user-owned guidance, and update affected sources of truth with behavioral changes. Use .mstack/templates/ only as reference scaffolds: adapt them to this project, and never treat template text as a project requirement or evidence.",
        context: [
          { path: "docs/product.md", description: "product intent, users, scope, and success measures" },
          { path: "docs/architecture.md", description: "system boundaries, contracts, and operational decisions" },
          { path: "docs/features.md", description: "feature index when present", required: false },
        ],
        onboarding: {
          summary: "If the idea is not validated, begin with the research-idea prompt. Then use write-product-definition and design-architecture to establish project intent and system boundaries before shipping a verified vertical slice.",
          verificationCommands: ["mstack status", "mstack doctor"],
        },
        includeHooks: true,
        includeTemplates: true,
      }),
    },
  ],
};
