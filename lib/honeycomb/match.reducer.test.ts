/**
 * Match reducer tests.
 *
 * Pure (snapshot, command) → { next, events } walks. No fibers, no Effect,
 * no DOM. Catches the bug class where deterministic mutations forget to
 * publish a state-changed tick (AC-4).
 *
 * Target: ≥20 assertions, runs in <500ms.
 */

import { describe, expect, it } from "vitest";
import { initialSnapshot, reduce, type ReduceError, type ReduceResult } from "./match.reducer";
import type { MatchCommand, MatchPhase, MatchSnapshot } from "./match.port";
import {
  type Card,
  CARD_DEFINITIONS,
  TRANSCENDENCE_DEFINITIONS,
  createCard,
} from "./cards";

const SEED = "fixed-seed-reducer-tests";

/** Helper: assert reduce returned a success result (not a wrong-phase error). */
function expectOk(r: ReduceResult | ReduceError): ReduceResult {
  if ("_tag" in r) throw new Error(`expected ReduceResult, got error ${r._tag} ${r.current}`);
  return r;
}

/** Helper: build a snapshot at the given phase by walking real reducer steps. */
function snapAtPhase(phase: MatchPhase): MatchSnapshot {
  let snap = initialSnapshot(SEED);
  if (phase === "idle") return snap;
  // idle → entry
  snap = expectOk(reduce(snap, { _tag: "begin-match", seed: SEED })).next;
  if (phase === "entry") return snap;
  // entry → arrange (choose-element)
  snap = expectOk(reduce(snap, { _tag: "choose-element", element: "wood" })).next;
  if (phase === "arrange") return snap;
  // Any deeper phase requires the fiber-driven lock-in path; tests for those
  // belong in integration suites, not the pure reducer.
  throw new Error(`Cannot reach phase ${phase} synchronously`);
}

// ─────────────────────────────────────────────────────────────────
describe("reduce / phase validity", () => {
  it("rejects choose-element while in idle phase", () => {
    const snap = snapAtPhase("idle");
    const r = reduce(snap, { _tag: "choose-element", element: "fire" });
    expect("_tag" in r).toBe(true);
    if ("_tag" in r) {
      expect(r._tag).toBe("wrong-phase");
      expect(r.current).toBe("idle");
      expect(r.expected).toContain("entry");
    }
  });

  it("accepts begin-match in idle", () => {
    const snap = snapAtPhase("idle");
    const r = reduce(snap, { _tag: "begin-match", seed: SEED });
    expect("_tag" in r).toBe(false);
  });

  it("rejects tap-position in idle (only valid in arrange/between-rounds)", () => {
    const snap = snapAtPhase("idle");
    const r = reduce(snap, { _tag: "tap-position", index: 0 });
    expect("_tag" in r).toBe(true);
  });

  it("rejects lock-in via reducer (it's a fiber-driven command)", () => {
    // lock-in IS in the validCommandsFor("arrange") list, so the reducer
    // returns a passthrough (next === snap, no events). This is by design —
    // match.live intercepts lock-in BEFORE reaching reduce().
    const snap = snapAtPhase("arrange");
    const r = expectOk(reduce(snap, { _tag: "lock-in" }));
    expect(r.next).toBe(snap);
    expect(r.events).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────
describe("reduce / begin-match", () => {
  it("transitions idle → entry", () => {
    const snap = snapAtPhase("idle");
    const r = expectOk(reduce(snap, { _tag: "begin-match", seed: SEED }));
    expect(r.next.phase).toBe("entry");
  });

  it("publishes phase-entered event", () => {
    const snap = snapAtPhase("idle");
    const r = expectOk(reduce(snap, { _tag: "begin-match", seed: SEED }));
    const ev = r.events.find((e) => e._tag === "phase-entered");
    expect(ev).toBeDefined();
    if (ev?._tag === "phase-entered") expect(ev.phase).toBe("entry");
  });

  it("begin-match is rejected from arrange (only valid in idle/entry/result)", () => {
    const snap = snapAtPhase("arrange");
    const r = reduce(snap, { _tag: "begin-match", seed: SEED });
    expect("_tag" in r).toBe(true);
    if ("_tag" in r) {
      expect(r._tag).toBe("wrong-phase");
      expect(r.current).toBe("arrange");
    }
  });
});

// ─────────────────────────────────────────────────────────────────
describe("reduce / choose-element", () => {
  it("transitions entry → arrange", () => {
    const snap = snapAtPhase("entry");
    const r = expectOk(reduce(snap, { _tag: "choose-element", element: "water" }));
    expect(r.next.phase).toBe("arrange");
  });

  it("sets playerElement", () => {
    const snap = snapAtPhase("entry");
    const r = expectOk(reduce(snap, { _tag: "choose-element", element: "metal" }));
    expect(r.next.playerElement).toBe("metal");
  });

  it("populates p1Lineup with 5 cards", () => {
    const snap = snapAtPhase("entry");
    const r = expectOk(reduce(snap, { _tag: "choose-element", element: "wood" }));
    expect(r.next.p1Lineup).toHaveLength(5);
  });

  it("populates p2Lineup with 5 cards", () => {
    const snap = snapAtPhase("entry");
    const r = expectOk(reduce(snap, { _tag: "choose-element", element: "wood" }));
    expect(r.next.p2Lineup).toHaveLength(5);
  });

  it("publishes player-element-chosen + phase-entered + state-changed", () => {
    const snap = snapAtPhase("entry");
    const r = expectOk(reduce(snap, { _tag: "choose-element", element: "fire" }));
    const tags = r.events.map((e) => e._tag);
    expect(tags).toContain("player-element-chosen");
    expect(tags).toContain("phase-entered");
    expect(tags).toContain("state-changed");
  });
});

// ─────────────────────────────────────────────────────────────────
describe("reduce / tap-position", () => {
  it("first tap on null selectedIndex selects that index", () => {
    const snap = snapAtPhase("arrange");
    expect(snap.selectedIndex).toBeNull();
    const r = expectOk(reduce(snap, { _tag: "tap-position", index: 2 }));
    expect(r.next.selectedIndex).toBe(2);
  });

  it("tap same index deselects", () => {
    const snap = { ...snapAtPhase("arrange"), selectedIndex: 1 };
    const r = expectOk(reduce(snap, { _tag: "tap-position", index: 1 }));
    expect(r.next.selectedIndex).toBeNull();
  });

  it("tap different index swaps the two positions + clears selection", () => {
    const snap = snapAtPhase("arrange");
    const original0 = snap.p1Lineup[0]!.id;
    const original3 = snap.p1Lineup[3]!.id;
    const r1 = expectOk(reduce(snap, { _tag: "tap-position", index: 0 }));
    const r2 = expectOk(reduce(r1.next, { _tag: "tap-position", index: 3 }));
    expect(r2.next.p1Lineup[0]!.id).toBe(original3);
    expect(r2.next.p1Lineup[3]!.id).toBe(original0);
    expect(r2.next.selectedIndex).toBeNull();
  });

  it("out-of-bounds tap is a silent no-op", () => {
    const snap = snapAtPhase("arrange");
    const r = expectOk(reduce(snap, { _tag: "tap-position", index: 99 }));
    expect(r.next).toBe(snap);
    expect(r.events).toHaveLength(0);
  });

  it("negative tap is a silent no-op", () => {
    const snap = snapAtPhase("arrange");
    const r = expectOk(reduce(snap, { _tag: "tap-position", index: -1 }));
    expect(r.next).toBe(snap);
  });

  it("AC-4 regression: tap publishes state-changed (catches the Ref.update bug)", () => {
    const snap = snapAtPhase("arrange");
    const r = expectOk(reduce(snap, { _tag: "tap-position", index: 0 }));
    const hasTick = r.events.some((e) => e._tag === "state-changed");
    expect(hasTick).toBe(true);
  });

  it("recomputes p1Combos after swap", () => {
    const snap = snapAtPhase("arrange");
    const before = JSON.stringify(snap.p1Combos);
    // Force a swap that's likely to change combos
    const r1 = expectOk(reduce(snap, { _tag: "tap-position", index: 0 }));
    const r2 = expectOk(reduce(r1.next, { _tag: "tap-position", index: 4 }));
    // p1Combos is a fresh array, even if structurally equal
    expect(r2.next.p1Combos).not.toBe(snap.p1Combos);
    void before;
  });
});

// ─────────────────────────────────────────────────────────────────
describe("reduce / swap-positions", () => {
  it("valid pair swaps and clears selection", () => {
    const snap = { ...snapAtPhase("arrange"), selectedIndex: 2 };
    const id1 = snap.p1Lineup[1]!.id;
    const id4 = snap.p1Lineup[4]!.id;
    const r = expectOk(reduce(snap, { _tag: "swap-positions", a: 1, b: 4 }));
    expect(r.next.p1Lineup[1]!.id).toBe(id4);
    expect(r.next.p1Lineup[4]!.id).toBe(id1);
    expect(r.next.selectedIndex).toBeNull();
  });

  it("equal pair is silent no-op", () => {
    const snap = snapAtPhase("arrange");
    const r = expectOk(reduce(snap, { _tag: "swap-positions", a: 2, b: 2 }));
    expect(r.next).toBe(snap);
    expect(r.events).toHaveLength(0);
  });

  it("out-of-bounds pair is silent no-op", () => {
    const snap = snapAtPhase("arrange");
    const r = expectOk(reduce(snap, { _tag: "swap-positions", a: 1, b: 99 }));
    expect(r.next).toBe(snap);
  });

  it("publishes state-changed for valid swap", () => {
    const snap = snapAtPhase("arrange");
    const r = expectOk(reduce(snap, { _tag: "swap-positions", a: 0, b: 1 }));
    expect(r.events.some((e) => e._tag === "state-changed")).toBe(true);
  });

  it("recomputes p1Combos after swap", () => {
    const snap = snapAtPhase("arrange");
    const r = expectOk(reduce(snap, { _tag: "swap-positions", a: 0, b: 4 }));
    expect(r.next.p1Combos).not.toBe(snap.p1Combos);
  });
});

// ─────────────────────────────────────────────────────────────────
describe("reduce / complete-tutorial", () => {
  it("sets hasSeenTutorial = true", () => {
    // select phase admits complete-tutorial — emulate by snapshot patch
    const snap: MatchSnapshot = { ...snapAtPhase("arrange"), phase: "select" };
    const r = expectOk(reduce(snap, { _tag: "complete-tutorial" }));
    expect(r.next.hasSeenTutorial).toBe(true);
  });

  it("publishes tutorial-completed + state-changed", () => {
    const snap: MatchSnapshot = { ...snapAtPhase("arrange"), phase: "select" };
    const r = expectOk(reduce(snap, { _tag: "complete-tutorial" }));
    const tags = r.events.map((e) => e._tag);
    expect(tags).toContain("tutorial-completed");
    expect(tags).toContain("state-changed");
  });
});

// ─────────────────────────────────────────────────────────────────
describe("reduce / reset-match", () => {
  it("returns a fresh idle snapshot", () => {
    const snap = snapAtPhase("arrange");
    const r = expectOk(reduce(snap, { _tag: "reset-match", seed: "post-reset" }));
    expect(r.next.phase).toBe("idle");
    expect(r.next.playerElement).toBeNull();
    expect(r.next.p1Lineup).toHaveLength(0);
    expect(r.next.seed).toBe("post-reset");
  });

  it("publishes phase-entered idle", () => {
    const snap = snapAtPhase("arrange");
    const r = expectOk(reduce(snap, { _tag: "reset-match", seed: "x" }));
    const ev = r.events.find((e) => e._tag === "phase-entered");
    expect(ev).toBeDefined();
    if (ev?._tag === "phase-entered") expect(ev.phase).toBe("idle");
  });
});

// ─────────────────────────────────────────────────────────────────
describe("initialSnapshot / FR-7a collection-aware deal seam", () => {
  it("without a collection arg, falls back to the 12-random deal", () => {
    // Regression guard for the optional-param default: existing callers
    // (tests, fresh boot) get the original 12-card CARD_DEFINITIONS deal.
    const snap = initialSnapshot(SEED);
    expect(snap.collection).toHaveLength(12);
    expect(
      snap.collection.every((c) => c.cardType !== "transcendence"),
    ).toBe(true);
  });

  it("with a collection arg, the snapshot collection IS the passed pool", () => {
    const owned: readonly Card[] = [
      createCard(CARD_DEFINITIONS[0]!),
      createCard(TRANSCENDENCE_DEFINITIONS[0]!),
    ];
    const snap = initialSnapshot(SEED, owned);
    expect(snap.collection).toBe(owned);
  });

  it("a transcendence card reaches the dealt lineup through the real begin-match flow", () => {
    // Seed an owned pool: base cards + a transcendence card inside the
    // choose-element window (Math.min(5, collection.length) → first 5).
    const forgeDef = TRANSCENDENCE_DEFINITIONS.find(
      (d) => d.defId === "transcendence-forge",
    )!;
    const owned: readonly Card[] = [
      createCard(CARD_DEFINITIONS[0]!),
      createCard(CARD_DEFINITIONS[1]!),
      createCard(forgeDef),
      createCard(CARD_DEFINITIONS[2]!),
      createCard(CARD_DEFINITIONS[3]!),
    ];

    // The real runtime flow: match.live.ts seeds the idle snapshot with the
    // owned collection, then the player issues begin-match → choose-element.
    // begin-match MUST preserve the collection across its rebuild (FR-7a) —
    // otherwise the owned pool is replaced by the 12-random fallback before
    // choose-element ever runs.
    const idle = initialSnapshot(SEED, owned);
    const entered = expectOk(reduce(idle, { _tag: "begin-match" }));
    expect(entered.next.phase).toBe("entry");
    expect(entered.next.collection).toBe(owned); // begin-match preserved it

    const arrange = expectOk(
      reduce(entered.next, { _tag: "choose-element", element: "metal" }),
    );

    const lineupDefIds = arrange.next.p1Lineup.map((c) => c.defId);
    expect(arrange.next.p1Lineup).toHaveLength(5);
    expect(lineupDefIds).toContain("transcendence-forge");
    expect(
      arrange.next.p1Lineup.some((c) => c.cardType === "transcendence"),
    ).toBe(true);
  });

  it("reset-match preserves the owned collection across the rebuild", () => {
    // reset-match re-rolls the match but the owned pool only changes via the
    // /burn route — the collection must survive a reset (FR-7a).
    const owned: readonly Card[] = [
      createCard(CARD_DEFINITIONS[0]!),
      createCard(TRANSCENDENCE_DEFINITIONS[0]!),
    ];
    const idle = initialSnapshot(SEED, owned);
    const reset = expectOk(reduce(idle, { _tag: "reset-match" }));
    expect(reset.next.phase).toBe("idle");
    expect(reset.next.collection).toBe(owned);
  });
});

// ─────────────────────────────────────────────────────────────────
describe("reduce / determinism", () => {
  it("same (snapshot, command) → same next", () => {
    const snap = snapAtPhase("entry");
    const cmd: MatchCommand = { _tag: "choose-element", element: "earth" };
    const r1 = expectOk(reduce(snap, cmd));
    const r2 = expectOk(reduce(snap, cmd));
    // Lineup composition is deterministic from the seed
    expect(r1.next.p1Lineup.map((c) => c.defId)).toEqual(
      r2.next.p1Lineup.map((c) => c.defId),
    );
    expect(r1.next.playerElement).toBe(r2.next.playerElement);
  });

  it("does not mutate input snapshot", () => {
    const snap = snapAtPhase("arrange");
    const beforeLen = snap.p1Lineup.length;
    const beforeId0 = snap.p1Lineup[0]!.id;
    reduce(snap, { _tag: "swap-positions", a: 0, b: 4 });
    expect(snap.p1Lineup).toHaveLength(beforeLen);
    expect(snap.p1Lineup[0]!.id).toBe(beforeId0);
  });
});
