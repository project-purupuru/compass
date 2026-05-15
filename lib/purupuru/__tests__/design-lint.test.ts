/**
 * AC-3a: 5 cycle-1 design lints (Codex SKP-MEDIUM-004)
 *
 * Asserts the validate-content script's 5 lints pass for the wood pack.
 */

import { execSync } from "node:child_process";
import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

const REPO_ROOT = resolve(__dirname, "..", "..", "..");

describe("AC-3a: design lints pass for wood pack", () => {
  test("pnpm content:validate exits 0 with all lint passes", () => {
    let exitCode = 0;
    let stdout = "";
    try {
      stdout = execSync("pnpm content:validate 2>&1", {
        cwd: REPO_ROOT,
        encoding: "utf8",
      });
    } catch (e) {
      exitCode = (e as { status: number }).status;
      stdout = (e as { stdout?: string; stderr?: string }).stdout ?? "";
    }
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/13 pass · 0 fail/);
    expect(stdout).toMatch(/All schemas validated · all lints passed/);
  });

  test("each lint's success line appears in output", () => {
    const stdout = execSync("pnpm content:validate 2>&1", {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    expect(stdout).toMatch(/LINT-1:wood_awakening.*matching verb/);
    expect(stdout).toMatch(/LINT-2:wood_activation_sequence.*localized weather on wood_grove ok/);
    expect(stdout).toMatch(/LINT-3:wood_activation_sequence.*unlock_input beat present/);
    expect(stdout).toMatch(/LINT-4:wood_awakening.*all zone tags defined/);
    expect(stdout).toMatch(/LINT-5:pack.*core tier/);
  });
});
