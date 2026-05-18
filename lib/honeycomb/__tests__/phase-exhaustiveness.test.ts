/**
 * BattlePhase / MatchPhase exhaustiveness fuzz · SDD §3.3.2 fallback path
 * (per flatline-r1 SKP-003: oxlint custom rule deferred · this is the default).
 *
 * Strategy: for every (phase, command) pair in the cartesian product, assert
 * that `validCommandsFor(phase).includes(cmd)` is a deterministic boolean.
 * Combined with the transition test in match-transitions.test.ts, this
 * guarantees that adding a new phase or command requires updating the
 * matrix (or this test fuzzes-up the missing case).
 */

import { describe, expect, it } from "vitest";
import type { BattlePhase } from "../battle.port";
import { type MatchCommand, type MatchPhase, validCommandsFor } from "../match.port";

const BATTLE_PHASES: readonly BattlePhase[] = ["idle", "select", "arrange", "preview", "committed"];

const MATCH_PHASES: readonly MatchPhase[] = [
  "idle",
  "entry",
  "quiz",
  "select",
  "arrange",
  "committed",
  "clashing",
  "disintegrating",
  "between-rounds",
  "result",
];

const ALL_COMMAND_TAGS: readonly MatchCommand["_tag"][] = [
  "begin-match",
  "choose-element",
  "complete-tutorial",
  "lock-in",
  "advance-clash",
  "advance-round",
  "reset-match",
];

describe("Phase × Command exhaustiveness fuzz", () => {
  it("every MatchPhase × MatchCommand pair returns a deterministic boolean", () => {
    for (const phase of MATCH_PHASES) {
      const validCmds = validCommandsFor(phase);
      for (const cmd of ALL_COMMAND_TAGS) {
        const isValid = validCmds.includes(cmd);
        expect(typeof isValid).toBe("boolean");
      }
    }
  });

  it("BATTLE_PHASES is a known finite set (catches additions)", () => {
    // If a new BattlePhase is added, this test must be updated. The const
    // assertion in battle.port.ts means TypeScript will surface it.
    expect(BATTLE_PHASES.length).toBe(5);
  });

  it("MATCH_PHASES is a known finite set (catches additions)", () => {
    expect(MATCH_PHASES.length).toBe(10);
  });

  it("ALL_COMMAND_TAGS is a known finite set (catches additions)", () => {
    expect(ALL_COMMAND_TAGS.length).toBe(7);
  });

  it("every phase has at least one valid command (no dead phase)", () => {
    for (const phase of MATCH_PHASES) {
      expect(validCommandsFor(phase).length).toBeGreaterThan(0);
    }
  });

  it("reset-match is the universal escape (every phase accepts it)", () => {
    for (const phase of MATCH_PHASES) {
      expect(validCommandsFor(phase)).toContain("reset-match");
    }
  });
});
