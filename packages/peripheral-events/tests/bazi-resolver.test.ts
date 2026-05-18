// AC for bazi-resolver: archetype derivation from element votes
// (Used by S1-T7 result route + S2-T3 mint authorization)

import { describe, expect, it } from "vitest";

import { archetypeFromAnswers, quizStateHashOf } from "../src/bazi-resolver";

describe("archetypeFromAnswers · element vote tally", () => {
  it("returns single-vote dominant element", () => {
    expect(archetypeFromAnswers(["FIRE"])).toBe("FIRE");
    expect(archetypeFromAnswers(["WATER"])).toBe("WATER");
  });

  it("returns dominant when one element wins clearly", () => {
    expect(archetypeFromAnswers(["FIRE", "FIRE", "FIRE", "WATER", "EARTH"])).toBe("FIRE");
  });

  it("uses canonical tie-break order (WOOD > FIRE > EARTH > METAL > WATER)", () => {
    // 2 fire 2 water · canonical order favors FIRE over WATER
    expect(archetypeFromAnswers(["FIRE", "FIRE", "WATER", "WATER"])).toBe("FIRE");
    // 2 wood 2 metal · WOOD wins
    expect(archetypeFromAnswers(["WOOD", "WOOD", "METAL", "METAL"])).toBe("WOOD");
    // Five-way tie · WOOD wins (first in canonical order)
    expect(archetypeFromAnswers(["WOOD", "FIRE", "EARTH", "METAL", "WATER"])).toBe("WOOD");
  });

  it("empty input returns WOOD sentinel (defensive default)", () => {
    expect(archetypeFromAnswers([])).toBe("WOOD");
  });

  it("all 5 answers same element → that element", () => {
    expect(archetypeFromAnswers(["WATER", "WATER", "WATER", "WATER", "WATER"])).toBe("WATER");
  });
});

describe("quizStateHashOf · hex digest of answers", () => {
  it("returns 64-char hex string", () => {
    const hash = quizStateHashOf([0, 1, 2, 3, 0]);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("same input → same hash (deterministic)", () => {
    const a = quizStateHashOf([0, 1, 2, 3, 0]);
    const b = quizStateHashOf([0, 1, 2, 3, 0]);
    expect(a).toBe(b);
  });

  it("different inputs → different hashes", () => {
    const a = quizStateHashOf([0, 1, 2, 3, 0]);
    const b = quizStateHashOf([1, 1, 2, 3, 0]);
    expect(a).not.toBe(b);
  });
});
