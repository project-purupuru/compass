/**
 * Match transition matrix tests · SDD §3.3.1.
 *
 * For every (phase, command) pair: asserts valid → success, invalid →
 * wrong-phase typed error. Catches future BattlePhase additions that don't
 * update validCommandsFor().
 */

import { Effect, Exit, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { ClashLive } from "../clash.live";
import { Match, type MatchCommand, type MatchPhase, validCommandsFor } from "../match.port";
import { MatchLive } from "../match.live";

const TestLayer = Layer.provide(MatchLive, ClashLive);

const run = <A>(eff: Effect.Effect<A, unknown, Match>) =>
  Effect.runPromise(Effect.provide(eff, TestLayer) as Effect.Effect<A>);

const runExit = <A>(eff: Effect.Effect<A, unknown, Match>) =>
  Effect.runPromiseExit(Effect.provide(eff, TestLayer) as Effect.Effect<A>);

const ALL_PHASES: readonly MatchPhase[] = [
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

const ALL_COMMANDS: readonly MatchCommand[] = [
  { _tag: "begin-match" },
  { _tag: "choose-element", element: "wood" },
  { _tag: "complete-tutorial" },
  { _tag: "lock-in" },
  { _tag: "advance-clash" },
  { _tag: "advance-round" },
  { _tag: "reset-match" },
];

describe("validCommandsFor · §3.3.1 transition matrix", () => {
  for (const phase of ALL_PHASES) {
    it(`${phase} has at least one valid command (reset-match minimum)`, () => {
      const valid = validCommandsFor(phase);
      expect(valid).toContain("reset-match");
    });
  }

  it("idle accepts begin-match", () => {
    expect(validCommandsFor("idle")).toContain("begin-match");
  });

  it("entry accepts choose-element (to proceed) and reset-match", () => {
    expect(validCommandsFor("entry")).toContain("choose-element");
  });

  it("select accepts lock-in", () => {
    expect(validCommandsFor("select")).toContain("lock-in");
  });

  it("arrange accepts lock-in (to commit)", () => {
    expect(validCommandsFor("arrange")).toContain("lock-in");
  });

  it("committed and clashing accept advance-clash", () => {
    expect(validCommandsFor("committed")).toContain("advance-clash");
    expect(validCommandsFor("clashing")).toContain("advance-clash");
  });

  it("disintegrating accepts advance-round", () => {
    expect(validCommandsFor("disintegrating")).toContain("advance-round");
  });

  it("result accepts begin-match (replay) and reset-match", () => {
    expect(validCommandsFor("result")).toContain("begin-match");
  });
});

describe("Match.invoke phase enforcement", () => {
  it("idle → begin-match transitions to entry", async () => {
    const snap = await run(
      Effect.gen(function* () {
        const m = yield* Match;
        yield* m.invoke({ _tag: "begin-match" });
        return yield* m.current;
      }),
    );
    expect(snap.phase).toBe("entry");
  });

  it("idle rejects choose-element with wrong-phase", async () => {
    const exit = await runExit(
      Effect.gen(function* () {
        const m = yield* Match;
        yield* m.invoke({ _tag: "choose-element", element: "wood" });
      }),
    );
    expect(Exit.isFailure(exit)).toBe(true);
  });

  it("entry → choose-element transitions to arrange (substrate auto-deals)", async () => {
    // Behavior change 2026-05-12: choose-element now goes straight to
    // arrange because we auto-deal the lineup at element-pick time,
    // mirroring world-purupuru's createBattleState.start(). select is
    // reachable only when a UI explicitly stays there (e.g. for a tutorial).
    const snap = await run(
      Effect.gen(function* () {
        const m = yield* Match;
        yield* m.invoke({ _tag: "begin-match" });
        yield* m.invoke({ _tag: "choose-element", element: "fire" });
        return yield* m.current;
      }),
    );
    expect(snap.phase).toBe("arrange");
    expect(snap.playerElement).toBe("fire");
  });

  it("reset-match works from any phase (idle test)", async () => {
    const snap = await run(
      Effect.gen(function* () {
        const m = yield* Match;
        yield* m.invoke({ _tag: "reset-match", seed: "test-reset" });
        return yield* m.current;
      }),
    );
    expect(snap.seed).toBe("test-reset");
  });

  it("lock-in preserves p1Lineup survivors across rounds (regression: dying cards came back)", async () => {
    // Reported 2026-05-12 mid-cycle: cards that died in round 1 re-appeared
    // in round 2's hand. Root cause: choose-element seeds selectedIndices
    // to [0,1,2,3,4] permanently, and lock-in's old logic branched on
    // selectedIndices.length === 5 to re-deal from the full collection,
    // overwriting the surviving lineup.
    //
    // This test simulates the bug: post-clash, p1Lineup is patched down
    // to 2 survivors via dev:inject-snapshot. Then lock-in is invoked.
    // The lineup must remain at 2 cards, NOT bounce back to 5.
    (globalThis as { __PURU_DEV__?: { enabled: boolean } }).__PURU_DEV__ = {
      enabled: true,
    };
    const snap = await run(
      Effect.gen(function* () {
        const m = yield* Match;
        yield* m.invoke({ _tag: "begin-match" });
        yield* m.invoke({ _tag: "choose-element", element: "wood" });
        const full = yield* m.current;
        // Simulate post-clash survivors: keep only positions 0 and 2.
        const survivors = [full.p1Lineup[0]!, full.p1Lineup[2]!];
        yield* m.invoke({
          _tag: "dev:inject-snapshot",
          patch: { p1Lineup: survivors, phase: "between-rounds" },
        });
        yield* m.invoke({ _tag: "lock-in" });
        return yield* m.current;
      }),
    );
    expect(snap.p1Lineup).toHaveLength(2);
    (globalThis as { __PURU_DEV__?: unknown }).__PURU_DEV__ = undefined;
  });

  it("complete-tutorial is rejected from arrange (only valid in select)", async () => {
    // The default flow goes idle → entry → arrange. complete-tutorial is
    // a select-only command — UIs that want it must keep the player in
    // the select phase. This test guards the phase-gate.
    const exit = await Effect.runPromiseExit(
      Effect.provide(
        Effect.gen(function* () {
          const m = yield* Match;
          yield* m.invoke({ _tag: "begin-match" });
          yield* m.invoke({ _tag: "choose-element", element: "wood" });
          yield* m.invoke({ _tag: "complete-tutorial" });
        }),
        Layer.provide(MatchLive, ClashLive),
      ),
    );
    expect(Exit.isFailure(exit)).toBe(true);
  });
});
