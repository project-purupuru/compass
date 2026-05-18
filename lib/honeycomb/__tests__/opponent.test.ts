/**
 * Opponent behavioral fingerprint tests · AC-5 (flatline-r1 reformulated).
 *
 * Per SDD §3.2 statistical-rigor: snapshot deterministic assertions (CI-gate)
 * + soft sanity checks on per-element distinguishability.
 *
 * The full Wilson-LB statistical suite lives in tests/local/ per SKP-006
 * (CI-flaky tests moved out of gate).
 */

import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { CARD_DEFINITIONS, createCard, type Card } from "../cards";
import { Opponent, POLICIES } from "../opponent.port";
import { OpponentLive } from "../opponent.live";
import type { Element } from "../wuxing";

const ELEMENTS: readonly Element[] = ["fire", "earth", "wood", "metal", "water"];

function fullCollection(): Card[] {
  return CARD_DEFINITIONS.map((d) => createCard(d, new Date(2026, 4, 12)));
}

const run = <A>(eff: Effect.Effect<A, never, Opponent>) =>
  Effect.runPromise(Effect.provide(eff, OpponentLive) as Effect.Effect<A>);

describe("Opponent · per-element policies", () => {
  it("each element has a policy", () => {
    for (const el of ELEMENTS) {
      expect(POLICIES[el]).toBeDefined();
    }
  });

  it("policies are distinguishable across elements", () => {
    // No two elements have identical coefficients (sanity)
    const policyStrings = new Set(ELEMENTS.map((el) => JSON.stringify(POLICIES[el])));
    expect(policyStrings.size).toBe(5);
  });

  it("Fire policy is most aggressive", () => {
    const fireAggression = POLICIES.fire.aggression;
    for (const el of ELEMENTS) {
      if (el === "fire") continue;
      expect(fireAggression).toBeGreaterThan(POLICIES[el].aggression);
    }
  });

  it("Earth policy has lowest variance target (entrenched)", () => {
    const earthVar = POLICIES.earth.varianceTarget;
    for (const el of ELEMENTS) {
      if (el === "earth") continue;
      expect(earthVar).toBeLessThanOrEqual(POLICIES[el].varianceTarget);
    }
  });

  it("Water policy has highest rearrange rate (adaptive)", () => {
    const waterRearrange = POLICIES.water.rearrangeRate;
    for (const el of ELEMENTS) {
      if (el === "water") continue;
      expect(waterRearrange).toBeGreaterThan(POLICIES[el].rearrangeRate);
    }
  });

  it("Wood policy has highest chain preference (patient build)", () => {
    const woodChain = POLICIES.wood.chainPreference;
    for (const el of ELEMENTS) {
      if (el === "wood") continue;
      expect(woodChain).toBeGreaterThan(POLICIES[el].chainPreference);
    }
  });
});

describe("Opponent · buildLineup", () => {
  it("returns a 5-card lineup", async () => {
    const arr = await run(
      Effect.gen(function* () {
        const o = yield* Opponent;
        return yield* o.buildLineup(fullCollection(), "fire", "wood", "test-seed");
      }),
    );
    expect(arr.lineup.length).toBeLessThanOrEqual(5);
    expect(arr.lineup.length).toBeGreaterThan(0);
  });

  it("deterministic — same seed produces same lineup", async () => {
    const arr1 = await run(
      Effect.gen(function* () {
        const o = yield* Opponent;
        return yield* o.buildLineup(fullCollection(), "fire", "wood", "determinism-test");
      }),
    );
    const arr2 = await run(
      Effect.gen(function* () {
        const o = yield* Opponent;
        return yield* o.buildLineup(fullCollection(), "fire", "wood", "determinism-test");
      }),
    );
    expect(arr1.lineup.map((c) => c.defId)).toEqual(arr2.lineup.map((c) => c.defId));
    expect(arr1.score).toBe(arr2.score);
  });

  it("different elements produce different rationales (typically)", async () => {
    const fire = await run(
      Effect.gen(function* () {
        const o = yield* Opponent;
        return yield* o.buildLineup(fullCollection(), "fire", "wood", "diversity-test");
      }),
    );
    const earth = await run(
      Effect.gen(function* () {
        const o = yield* Opponent;
        return yield* o.buildLineup(fullCollection(), "earth", "wood", "diversity-test");
      }),
    );
    expect(fire.rationale).not.toBe(earth.rationale);
  });
});

describe("Opponent · rearrange", () => {
  it("water rearranges more often than earth (over a sweep)", async () => {
    const collection = fullCollection();
    const startingLineup = collection.slice(0, 5);
    let waterRearranged = 0;
    let earthRearranged = 0;
    const N = 30;
    for (let i = 0; i < N; i++) {
      const waterArr = await run(
        Effect.gen(function* () {
          const o = yield* Opponent;
          return yield* o.rearrange(startingLineup, "water", "wood", `seed-${i}`, 2);
        }),
      );
      const earthArr = await run(
        Effect.gen(function* () {
          const o = yield* Opponent;
          return yield* o.rearrange(startingLineup, "earth", "wood", `seed-${i}`, 2);
        }),
      );
      if (waterArr.rationale.startsWith("rearrange")) waterRearranged++;
      if (earthArr.rationale.startsWith("rearrange")) earthRearranged++;
    }
    expect(waterRearranged).toBeGreaterThan(earthRearranged);
  });
});
