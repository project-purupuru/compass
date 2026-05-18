/**
 * Match — orchestrator above Battle phase machine.
 *
 * Drives the full match lifecycle: Entry → Quiz (first-time) → Select →
 * Arrange → Committed → Clashing → Disintegrating → Between-rounds → Result.
 *
 * Calls into Battle (for selection/arrangement state) + Clash (for round
 * resolution) + future Opponent service (for AI lineup generation).
 *
 * Closes PRD r1 FR-14. SDD §3.3.
 */

import { Context, type Effect, type Stream } from "effect";
import type { Card } from "./cards";
import type { Combo } from "./combos";
import type { BattleCondition } from "./conditions";
import type { ClashResult, RoundResult } from "./clash.port";
import type { Element } from "./wuxing";

/** Per-card in-progress clash animation phase — drives OpponentZone CSS states. */
export type ClashStepPhase = "approach" | "impact" | "settle";

export type MatchPhase =
  | "idle"
  | "entry" // EntryScreen (FR-1)
  | "quiz" // ElementQuiz (FR-2 · first-time only)
  | "select" // CollectionGrid
  | "arrange" // BattleHand / BattleField (FR-3/4)
  | "committed" // both lineups locked
  | "clashing" // animated clash sequence
  | "disintegrating" // 敗 stamp + card dissolve
  | "between-rounds" // rearrange survivors
  | "result"; // ResultScreen (FR-11)

export interface MatchSnapshot {
  readonly phase: MatchPhase;
  readonly seed: string;
  readonly weather: Element;
  readonly opponentElement: Element;
  readonly condition: BattleCondition;
  /** From ElementQuiz; null until completed. */
  readonly playerElement: Element | null;
  readonly hasSeenTutorial: boolean;

  readonly collection: readonly Card[];
  readonly selectedIndices: readonly number[];
  readonly p1Lineup: readonly Card[];
  readonly p2Lineup: readonly Card[];
  readonly currentRound: number;
  readonly rounds: readonly RoundResult[];
  readonly winner: "p1" | "p2" | "draw" | null;

  /** Active combos on current p1 lineup. */
  readonly p1Combos: readonly Combo[];
  readonly p2Combos: readonly Combo[];

  /** Chain bonus carried across rounds (Garden grace). */
  readonly chainBonusAtRoundStart: number;

  // ── In-progress clash animation state (populated during `clashing`) ──
  /** Pre-resolved clash sequence for the current round; empty otherwise. */
  readonly clashSequence: readonly ClashResult[];
  /** Index into clashSequence; -1 before any clash has surfaced. */
  readonly visibleClashIdx: number;
  /** Animation phase for the visible clash, or null between clashes. */
  readonly activeClashPhase: ClashStepPhase | null;
  /** Lineup positions that have received a 敗 stamp this round. */
  readonly stamps: readonly number[];
  /** Positions disintegrating this round (player + opponent). */
  readonly dyingP1: readonly number[];
  readonly dyingP2: readonly number[];
  /** Positions saved by Caretaker A Shield this round. */
  readonly shieldedP1: readonly number[];
  readonly shieldedP2: readonly number[];
  /** Tap-to-swap helper. Null when nothing is currently selected. */
  readonly selectedIndex: number | null;
  /** Most recent whisper line surfaced by the navigator. */
  readonly lastWhisper: string | null;
  /** Player + opponent cumulative clash wins this match (for UI score chips). */
  readonly playerClashWins: number;
  readonly opponentClashWins: number;
  /** Most recent play signals — drives BattleField sparks / ripple. */
  readonly lastPlayed: Element | null;
  readonly lastGenerated: Element | null;
  readonly lastOvercome: Element | null;
  /** Coarse animation state derived for BattleField wrapper (idle / golden-hold / hitstop). */
  readonly animState: "idle" | "golden-hold" | "hitstop";
}

export type MatchEvent =
  | { readonly _tag: "phase-entered"; readonly phase: MatchPhase; readonly at: number }
  | { readonly _tag: "player-element-chosen"; readonly element: Element }
  | { readonly _tag: "tutorial-completed" }
  | { readonly _tag: "lineups-locked" }
  | { readonly _tag: "clash-resolved"; readonly result: RoundResult }
  | {
      readonly _tag: "round-ended";
      readonly round: number;
      readonly eliminated: readonly string[];
    }
  | { readonly _tag: "match-completed"; readonly winner: "p1" | "p2" | "draw" }
  /** Newly-active combo detected on the current p1 lineup. `isFirstTime` is
   * true when this kind has never been seen by the player on this device.
   * UI subscribes to fire the first-time discovery ceremony (FR-5). */
  | {
      readonly _tag: "combo-discovered";
      readonly kind: import("./combos").ComboKind;
      readonly name: string;
      readonly isFirstTime: boolean;
    }
  /** Lightweight tick — fired after any snapshot mutation that doesn't have
   * its own named event. Lets `useMatch()` re-read state on visual ticks. */
  | { readonly _tag: "state-changed" };

export type MatchCommand =
  | { readonly _tag: "begin-match"; readonly seed?: string }
  | { readonly _tag: "choose-element"; readonly element: Element }
  | { readonly _tag: "complete-tutorial" }
  /** Tap a card position to select / deselect / swap with the prior selection. */
  | { readonly _tag: "tap-position"; readonly index: number }
  /** Direct swap of two positions in the player lineup (drag-to-reorder). */
  | { readonly _tag: "swap-positions"; readonly a: number; readonly b: number }
  | { readonly _tag: "lock-in" }
  | { readonly _tag: "advance-clash" }
  | { readonly _tag: "advance-round" }
  | { readonly _tag: "reset-match"; readonly seed?: string }
  /** Dev-only: force-set the phase. Bypasses the transition matrix. */
  | { readonly _tag: "dev:force-phase"; readonly phase: MatchPhase }
  /** Dev-only: shallow-merge a snapshot patch. Bypasses validation. */
  | { readonly _tag: "dev:inject-snapshot"; readonly patch: Partial<MatchSnapshot> };

export type MatchError =
  | {
      readonly _tag: "wrong-phase";
      readonly current: MatchPhase;
      readonly expected: readonly MatchPhase[];
    }
  | { readonly _tag: "match-not-ready"; readonly reason: string };

export class Match extends Context.Tag("purupuru-ttrpg/Match")<
  Match,
  {
    readonly current: Effect.Effect<MatchSnapshot>;
    readonly events: Stream.Stream<MatchEvent>;
    readonly invoke: (cmd: MatchCommand) => Effect.Effect<void, MatchError>;
  }
>() {}

/**
 * SDD §3.3.1 Phase × Command transition matrix.
 * Returns the list of valid commands for a phase. Used by Match.invoke to
 * reject wrong-phase commands with a typed error.
 */
export function validCommandsFor(phase: MatchPhase): readonly MatchCommand["_tag"][] {
  // Dev-only commands valid in EVERY phase (gated separately by NODE_ENV).
  const DEV_ALL: readonly MatchCommand["_tag"][] = ["dev:force-phase", "dev:inject-snapshot"];
  switch (phase) {
    case "idle":
      return ["begin-match", "reset-match", ...DEV_ALL];
    case "entry":
      return ["choose-element", "reset-match", ...DEV_ALL];
    case "quiz":
      return ["choose-element", "reset-match", ...DEV_ALL];
    case "select":
      return ["complete-tutorial", "lock-in", "reset-match", ...DEV_ALL];
    case "arrange":
      return ["lock-in", "tap-position", "swap-positions", "reset-match", ...DEV_ALL];
    case "committed":
      return ["advance-clash", "reset-match", ...DEV_ALL];
    case "clashing":
      return ["advance-clash", "reset-match", ...DEV_ALL];
    case "disintegrating":
      return ["advance-round", "reset-match", ...DEV_ALL];
    case "between-rounds":
      return ["lock-in", "tap-position", "swap-positions", "reset-match", ...DEV_ALL];
    case "result":
      return ["begin-match", "reset-match", ...DEV_ALL];
  }
}
