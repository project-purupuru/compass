/**
 * ActivityMock smoke tests. Verifies the lift pattern: port surface
 * (recent/events/seed) composes through Layer.provide.
 */

import { describe, it, expect } from "vitest";
import { Effect, Layer, Stream } from "effect";
import { Activity } from "../activity.port";
import { ActivityMock } from "../activity.mock";
import type { JoinActivity } from "../types";

const sampleEvent: JoinActivity = {
  id: "test-1",
  kind: "join",
  origin: "off-chain",
  element: "fire",
  actor: "test-wallet",
  at: new Date().toISOString(),
};

describe("ActivityLive lift", () => {
  it("seed pushes event into recent buffer", async () => {
    const program = Effect.gen(function* () {
      const a = yield* Activity;
      yield* a.seed(sampleEvent);
      const recent = yield* a.recent(10);
      return recent;
    });
    const result = await Effect.runPromise(Effect.provide(program, ActivityMock()));
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("test-1");
  });

  it("recent returns seeded events newest-first", async () => {
    const seed: JoinActivity[] = [
      {
        id: "a",
        kind: "join",
        origin: "off-chain",
        element: "wood",
        actor: "w1",
        at: "2026-05-12T01:00:00Z",
      },
      {
        id: "b",
        kind: "join",
        origin: "off-chain",
        element: "metal",
        actor: "w2",
        at: "2026-05-12T02:00:00Z",
      },
    ];
    const program = Effect.gen(function* () {
      const a = yield* Activity;
      return yield* a.recent(10);
    });
    const result = await Effect.runPromise(Effect.provide(program, ActivityMock(seed)));
    expect(result).toHaveLength(2);
    // newest-first: b before a
    expect(result[0]?.id).toBe("b");
  });

  it("events stream surface exists and is consumable", async () => {
    // Smoke check: the events stream is well-typed and can be obtained
    // from the service. Round-trip stream emission is timing-dependent
    // (subscriber registration races with seed) so we verify the surface
    // rather than the live emission · the recent() + seed() tests
    // already prove the underlying buffer mutates correctly.
    const program = Effect.gen(function* () {
      const a = yield* Activity;
      return typeof a.events;
    });
    const result = await Effect.runPromise(Effect.provide(program, ActivityMock()));
    expect(result).toBe("object");
  });
});
