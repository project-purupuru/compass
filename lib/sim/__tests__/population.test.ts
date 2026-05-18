/**
 * PopulationMock smoke tests.
 */

import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { Population } from "../population.port";
import { PopulationMock } from "../population.mock";
import type { SpawnedPuruhani } from "../population.system";

const samplePuruhani: SpawnedPuruhani = {
  seed: 1,
  trader: "test-trader",
  identity: {
    archetype: "fire",
    swag: "Bold",
    era: "Past",
    ancestor: "Inkstone",
    molecule: "Salt",
  } as never,
  primaryElement: "fire",
  joinedAt: new Date().toISOString(),
  isYou: false,
};

describe("PopulationLive lift", () => {
  it("current returns seeded population", async () => {
    const program = Effect.gen(function* () {
      const p = yield* Population;
      return yield* p.current;
    });
    const result = await Effect.runPromise(
      Effect.provide(program, PopulationMock([samplePuruhani])),
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.primaryElement).toBe("fire");
  });

  it("distribution counts by element", async () => {
    const seed: SpawnedPuruhani[] = [
      { ...samplePuruhani, seed: 1, primaryElement: "fire" },
      { ...samplePuruhani, seed: 2, primaryElement: "fire" },
      { ...samplePuruhani, seed: 3, primaryElement: "wood" },
    ];
    const program = Effect.gen(function* () {
      const p = yield* Population;
      return yield* p.distribution;
    });
    const result = await Effect.runPromise(Effect.provide(program, PopulationMock(seed)));
    expect(result.fire).toBe(2);
    expect(result.wood).toBe(1);
    expect(result.water).toBe(0);
  });
});
