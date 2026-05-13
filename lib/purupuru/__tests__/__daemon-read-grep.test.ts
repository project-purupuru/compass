/**
 * AC-9: static check — resolver MUST NOT import `daemons` getter from game-state.
 *
 * Per FR-14a / Opus MED-5 — daemons have affectsGameplay: false in cycle 1.
 * Reading daemon state in the resolver risks unintended gameplay coupling.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

const RESOLVER_PATH = resolve(__dirname, "..", "runtime/resolver.ts");

describe("AC-9: daemon-read prevention in resolver", () => {
  test("resolver.ts does not access state.daemons", () => {
    const src = readFileSync(RESOLVER_PATH, "utf8");
    // Check for any pattern that READS daemons from state
    expect(src).not.toMatch(/state\.daemons/);
    // ContentDatabase.getZoneDefinition returns daemon DEFINITIONS (different from state.daemons).
    // Only state.daemons is forbidden.
  });

  test("resolver.ts does not import a daemon-reading getter", () => {
    const src = readFileSync(RESOLVER_PATH, "utf8");
    // No import line that includes a daemon-state accessor
    expect(src).not.toMatch(/import .* (getDaemon|getDaemons|readDaemon)/);
  });
});
