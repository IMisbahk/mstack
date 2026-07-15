import { createBuildLikeThisRuntime } from "../../../ai-integrations/src/index.js";
import type { MstackPlugin } from "./types.js";

export const buildLikeThisPlugin: MstackPlugin = {
  id: "build-like-this",
  version: "1.0.0",
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
        projectDescription: "This repository follows Misbah Khursheed's Build Like This workflow: product reasoning before implementation, explicit backend contracts, modular architecture, and verified delivery.",
        projectInstructions: "Read docs/product.md and docs/architecture.md before material implementation work. Preserve user-owned guidance and update affected sources of truth with behavioral changes.",
        context: [
          { path: "docs/product.md", description: "product intent, users, scope, and success measures" },
          { path: "docs/architecture.md", description: "system boundaries, contracts, and operational decisions" },
          { path: "docs/features.md", description: "feature index when present", required: false },
        ],
        onboarding: {
          summary: "Start with the product outcome, design system boundaries and backend contracts, then ship a verified vertical slice.",
          verificationCommands: ["mstack status", "mstack doctor"],
        },
        includeHooks: true,
        includeTemplates: true,
      }),
    },
  ],
};
