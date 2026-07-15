import { describe, expect, it } from "vitest";
import { hasUpdate, updateCommand } from "../src/services/packages.js";

describe("package updates", () => {
  it("uses semantic version precedence", () => {
    expect(hasUpdate("1.9.0", "1.10.0")).toBe(true);
    expect(hasUpdate("2.0.0", "2.0.0")).toBe(false);
    expect(hasUpdate("2.0.0", "1.99.0")).toBe(false);
  });

  it("builds shell-free package manager commands", () => {
    expect(updateCommand("pnpm", "mstack")).toEqual({
      command: "pnpm",
      args: ["add", "--global", "mstack@latest"],
      display: "pnpm add --global mstack@latest",
    });
  });
});
