/**
 * Match reducer — pure (snapshot, command) → { next, events }.
 *
 * Handles the deterministic commands of the match state machine:
 *   begin-match · choose-element · complete-tutorial · tap-position ·
 *   swap-positions · reset-match
 *
 * The async fiber-driven commands (lock-in / advance-clash / advance-round)
 * stay in match.live.ts because they involve scheduled state transitions
 * (the staggered clash reveal).
 *
 * Why a pure reducer:
 *   1. Testable without Effect, React, or DOM (vitest, <500ms).
 *   2. All "did this mutation emit a tick?" bugs become impossible —
 *      events are returned explicitly alongside the next snapshot.
 *   3. Future cycle can extract the whole effect tree the same way.
 */

import { type Card, CARD_DEFINITIONS, createCard } from "./cards";
import { type Combo, detectCombos } from "./combos";
import { rememberFirstElement } from "./companion";
import { CONDITIONS, type BattleCondition } from "./conditions";
import { isFirstTime, loadDiscovery, recordDiscovery } from "./discovery";
import type {
  MatchCommand,
  MatchEvent,
  MatchPhase,
  MatchSnapshot,
} from "./match.port";
import { validCommandsFor } from "./match.port";
import { rngFromSeed } from "./seed";
import { ELEMENT_ORDER, type Element, getDailyElement } from "./wuxing";

export interface ReduceResult {
  readonly next: MatchSnapshot;
  readonly events: readonly MatchEvent[];
}

export interface ReduceError {
  readonly _tag: "wrong-phase";
  readonly current: MatchPhase;
  readonly expected: readonly MatchPhase[];
}

/**
 * Pure transition function. Returns either a new snapshot + emitted events,
 * or an error indicating the command isn't valid in the current phase.
 *
 * Commands not handled here (lock-in, advance-clash, advance-round) return
 * the snapshot unchanged with no events — match.live.ts intercepts them
 * before reaching the reducer.
 */
export function reduce(
  snap: MatchSnapshot,
  cmd: MatchCommand,
): ReduceResult | ReduceError {
  // Phase validity check
  const valid = validCommandsFor(snap.phase);
  if (!valid.includes(cmd._tag)) {
    const allPhases: MatchPhase[] = [
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
    return {
      _tag: "wrong-phase",
      current: snap.phase,
      expected: allPhases.filter((p) => validCommandsFor(p).includes(cmd._tag)),
    };
  }

  switch (cmd._tag) {
    case "begin-match": {
      // Preserve the player's owned collection across the rebuild — a fresh
      // match re-rolls weather/opponent/condition, but the owned pool only
      // changes via the /burn route, not the battle loop (FR-7a deal seam).
      const fresh = initialSnapshot(cmd.seed ?? snap.seed, snap.collection);
      const next: MatchSnapshot = { ...fresh, phase: "entry" };
      return {
        next,
        events: [{ _tag: "phase-entered", phase: "entry", at: Date.now() }],
      };
    }

    case "choose-element": {
      const dealtIndices = Array.from(
        { length: Math.min(5, snap.collection.length) },
        (_, i) => i,
      );
      const dealtLineup = dealtIndices.map((i) => snap.collection[i]!);
      const dealtCombos = detectCombos(dealtLineup, { weather: snap.weather });
      const p2Lineup = stubOpponentLineup(snap);
      const p2Combos = detectCombos(p2Lineup, { weather: snap.weather });
      // Companion side-effect: stamp the player's first vow.
      // No-op if firstElement is already set; safe to call repeatedly.
      rememberFirstElement(cmd.element);
      const next: MatchSnapshot = {
        ...snap,
        playerElement: cmd.element,
        selectedIndices: dealtIndices,
        p1Lineup: dealtLineup,
        p1Combos: dealtCombos,
        p2Lineup,
        p2Combos,
        phase: "arrange",
      };
      return {
        next,
        events: [
          { _tag: "player-element-chosen", element: cmd.element },
          { _tag: "phase-entered", phase: "arrange", at: Date.now() },
          { _tag: "state-changed" },
        ],
      };
    }

    case "complete-tutorial": {
      return {
        next: { ...snap, hasSeenTutorial: true },
        events: [{ _tag: "tutorial-completed" }, { _tag: "state-changed" }],
      };
    }

    case "tap-position": {
      const i = cmd.index;
      // Bounds guard
      if (i < 0 || i >= snap.p1Lineup.length) {
        return { next: snap, events: [] };
      }
      // Empty selection → select i
      if (snap.selectedIndex === null) {
        return {
          next: { ...snap, selectedIndex: i },
          events: [{ _tag: "state-changed" }],
        };
      }
      // Tap same index → deselect
      if (snap.selectedIndex === i) {
        return {
          next: { ...snap, selectedIndex: null },
          events: [{ _tag: "state-changed" }],
        };
      }
      // Tap different index → swap + clear selection
      const nextLineup = [...snap.p1Lineup];
      const tmp = nextLineup[snap.selectedIndex]!;
      nextLineup[snap.selectedIndex] = nextLineup[i]!;
      nextLineup[i] = tmp;
      const nextCombos = detectCombos(nextLineup, { weather: snap.weather });
      const discoveryEvents = comboDiscoveryEvents(snap.p1Combos, nextCombos);
      return {
        next: {
          ...snap,
          p1Lineup: nextLineup,
          p1Combos: nextCombos,
          selectedIndex: null,
        },
        events: [{ _tag: "state-changed" }, ...discoveryEvents],
      };
    }

    case "swap-positions": {
      const { a, b } = cmd;
      if (a === b) return { next: snap, events: [] };
      if (a < 0 || b < 0 || a >= snap.p1Lineup.length || b >= snap.p1Lineup.length) {
        return { next: snap, events: [] };
      }
      const nextLineup = [...snap.p1Lineup];
      const tmp = nextLineup[a]!;
      nextLineup[a] = nextLineup[b]!;
      nextLineup[b] = tmp;
      const nextCombos = detectCombos(nextLineup, { weather: snap.weather });
      const discoveryEvents = comboDiscoveryEvents(snap.p1Combos, nextCombos);
      return {
        next: {
          ...snap,
          p1Lineup: nextLineup,
          p1Combos: nextCombos,
          selectedIndex: null,
        },
        events: [{ _tag: "state-changed" }, ...discoveryEvents],
      };
    }

    case "reset-match": {
      // Preserve the owned collection across a reset (FR-7a deal seam) — same
      // rationale as begin-match: the owned pool only changes via /burn.
      const fresh = initialSnapshot(cmd.seed ?? `match-${Date.now()}`, snap.collection);
      return {
        next: fresh,
        events: [{ _tag: "phase-entered", phase: "idle", at: Date.now() }],
      };
    }

    // Fiber-driven and dev commands fall through. match.live.ts handles
    // these BEFORE calling reduce(); we never see them here in practice,
    // but the case labels keep the switch exhaustive for the type checker.
    case "lock-in":
    case "advance-clash":
    case "advance-round":
    case "dev:force-phase":
    case "dev:inject-snapshot":
      return { next: snap, events: [] };
  }
}

// ─────────────────────────────────────────────────────────────────
// Shared helpers — these moved out of match.live.ts so the reducer
// stays self-contained. match.live.ts still uses them via re-export.
// ─────────────────────────────────────────────────────────────────

/**
 * Build a fresh idle snapshot.
 *
 * `collection` (FR-7a deal seam): when provided, it *is* the player's owned
 * pool — owned transcendence cards reach the playable lineup via the
 * `choose-element` slice (`Math.min(5, collection.length)` above). When
 * absent (tests, fresh boot), falls back to the original 12-random
 * `CARD_DEFINITIONS` deal so existing callers — and the regression suites —
 * are unaffected. Stays pure and synchronous: the optional param is the only
 * addition (SDD §6.2 — an Effect cascade was explicitly rejected).
 */
export function initialSnapshot(
  seed: string,
  collection?: readonly Card[],
): MatchSnapshot {
  const rng = rngFromSeed(seed);
  const weather = getDailyElement();
  const opponentElement: Element = rng.pick(ELEMENT_ORDER);
  const condition: BattleCondition = CONDITIONS[opponentElement];
  const dealtCollection: readonly Card[] =
    collection ??
    Array.from({ length: 12 }, (_, i) =>
      createCard(rng.pick(CARD_DEFINITIONS), new Date(2026, 4, 12 + i)),
    );
  return {
    phase: "idle",
    seed,
    weather,
    opponentElement,
    condition,
    playerElement: null,
    hasSeenTutorial: false,
    collection: dealtCollection,
    selectedIndices: [],
    p1Lineup: [],
    p2Lineup: [],
    currentRound: 0,
    rounds: [],
    winner: null,
    p1Combos: [],
    p2Combos: [],
    chainBonusAtRoundStart: 0,
    clashSequence: [],
    visibleClashIdx: -1,
    activeClashPhase: null,
    stamps: [],
    dyingP1: [],
    dyingP2: [],
    shieldedP1: [],
    shieldedP2: [],
    selectedIndex: null,
    lastWhisper: null,
    playerClashWins: 0,
    opponentClashWins: 0,
    lastPlayed: null,
    lastGenerated: null,
    lastOvercome: null,
    animState: "idle",
  };
}

/**
 * Diff prev/next combos and return discovery events for any combo kind
 * that's newly active (wasn't active in the prev set). Side-effect: records
 * first-time discoveries to localStorage so subsequent rounds don't re-fire.
 */
function comboDiscoveryEvents(
  prev: readonly Combo[],
  next: readonly Combo[],
): readonly MatchEvent[] {
  const prevKinds = new Set(prev.map((c) => c.kind));
  const newlyActive = next.filter((c) => !prevKinds.has(c.kind));
  if (newlyActive.length === 0) return [];
  const state = loadDiscovery();
  const out: MatchEvent[] = [];
  for (const combo of newlyActive) {
    const first = isFirstTime(combo.kind, state);
    if (first) recordDiscovery(combo.kind);
    out.push({
      _tag: "combo-discovered",
      kind: combo.kind,
      name: combo.name,
      isFirstTime: first,
    });
  }
  return out;
}

export function stubOpponentLineup(snap: MatchSnapshot): Card[] {
  const rng = rngFromSeed(`${snap.seed}|opponent`);
  return Array.from({ length: 5 }, () =>
    createCard(rng.pick(CARD_DEFINITIONS), new Date(2026, 4, 13)),
  );
}
