/**
 * Battle.live · phase machine smoke tests.
 *
 * These guard the v1 surface (idle → select → arrange → preview → committed)
 * and the deterministic-seed contract. Combo/clash invariants live in
 * dedicated test files alongside their pure modules.
 */

import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { Battle } from "../battle.port";
import { BattleLive } from "../battle.live";

const run = <A>(eff: Effect.Effect<A, unknown, Battle>) =>
  Effect.runPromise(Effect.provide(eff, BattleLive) as Effect.Effect<A>);

describe("Battle phase machine", () => {
  it("starts in idle with deterministic collection from the seed", async () => {
    const snap = await run(
      Effect.gen(function* () {
        const b = yield* Battle;
        return yield* b.current;
      }),
    );
    expect(snap.phase).toBe("idle");
    expect(snap.seed).toBe("compass-genesis");
    expect(snap.collection.length).toBe(12);
    expect(snap.kaironic).toBeDefined();
  });

  it("begin-match transitions idle → select", async () => {
    const snap = await run(
      Effect.gen(function* () {
        const b = yield* Battle;
        yield* b.invoke({ _tag: "begin-match" });
        return yield* b.current;
      }),
    );
    expect(snap.phase).toBe("select");
  });

  it("rejects select-card before begin-match (wrong-phase)", async () => {
    const result = await Effect.runPromiseExit(
      Effect.provide(
        Effect.gen(function* () {
          const b = yield* Battle;
          yield* b.invoke({ _tag: "select-card", index: 0 });
        }),
        BattleLive,
      ),
    );
    expect(result._tag).toBe("Failure");
  });

  it("five selections then proceed-to-arrange yields a 5-card lineup with combos", async () => {
    const snap = await run(
      Effect.gen(function* () {
        const b = yield* Battle;
        yield* b.invoke({ _tag: "begin-match" });
        for (let i = 0; i < 5; i++) {
          yield* b.invoke({ _tag: "select-card", index: i });
        }
        yield* b.invoke({ _tag: "proceed-to-arrange" });
        return yield* b.current;
      }),
    );
    expect(snap.phase).toBe("arrange");
    expect(snap.lineup.length).toBe(5);
    expect(snap.comboSummary).toBeDefined();
  });

  it("tune-kaironic merges partial weights", async () => {
    const snap = await run(
      Effect.gen(function* () {
        const b = yield* Battle;
        yield* b.invoke({ _tag: "tune-kaironic", weights: { impact: 0.5 } });
        return yield* b.current;
      }),
    );
    expect(snap.kaironic.impact).toBe(0.5);
    expect(snap.kaironic.anticipation).toBe(1.2);
  });
});
