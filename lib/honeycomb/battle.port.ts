/**
 * Battle — the typed boundary for the card-game state machine.
 *
 * v1 surface (this cycle): selection → arrangement → preview → committed.
 * Clash resolution is intentionally NOT in v1 — the operator validates the
 * substrate FEEL through these phases first, then clash logic lands in v2.
 *
 * The single Effect.provide site is `lib/runtime/runtime.ts`. Append
 * `BattleLive` to AppLayer to wire it in.
 */

import { Context, type Effect, type Stream } from "effect";
import type { Card } from "./cards";
import type { Combo, ComboSummary } from "./combos";
import type { BattleCondition } from "./conditions";
import type { KaironicWeights } from "./curves";
import type { Element } from "./wuxing";

export type BattlePhase = "idle" | "select" | "arrange" | "preview" | "committed";

export interface BattleSnapshot {
  readonly phase: BattlePhase;
  /** Deterministic seed — the same seed reproduces the same match exactly. */
  readonly seed: string;
  /** Daily weather element. */
  readonly weather: Element;
  /** Opponent element (drives the imbalance condition). */
  readonly opponentElement: Element;
  readonly condition: BattleCondition;

  /** Cards in the player's collection (v1: deterministic starter set). */
  readonly collection: readonly Card[];
  /** Indices of selected cards, in selection order. */
  readonly selectedIndices: readonly number[];
  /** Final arranged lineup once entering 'arrange'. */
  readonly lineup: readonly Card[];

  /** Combos detected on the current lineup. */
  readonly combos: readonly Combo[];
  readonly comboSummary: ComboSummary;

  /** Kaironic timing weights — DialKit-tunable at runtime. */
  readonly kaironic: KaironicWeights;

  /** Latest whisper line emitted; the view subscribes to BattleEvent for the stream. */
  readonly lastWhisper: string | null;

  /**
   * Monotonic whisper counter. Increments on every whisper emission so
   * replay reproduces the exact sequence of whispers from the same seed.
   * Closes FR-24 / AC-12 — see lib/honeycomb/battle.live.ts:emitWhisper.
   */
  readonly whisperCounter: number;
}

export type BattleEvent =
  | { readonly _tag: "phase-entered"; readonly phase: BattlePhase; readonly at: number }
  | { readonly _tag: "card-selected"; readonly index: number; readonly card: Card }
  | { readonly _tag: "card-deselected"; readonly index: number }
  | { readonly _tag: "lineup-rearranged"; readonly from: number; readonly to: number }
  | { readonly _tag: "combos-detected"; readonly combos: readonly Combo[] }
  | { readonly _tag: "whisper-emitted"; readonly line: string; readonly element: Element }
  | { readonly _tag: "seed-reset"; readonly seed: string }
  | { readonly _tag: "kaironic-tuned"; readonly weights: KaironicWeights };

export type BattleCommand =
  | { readonly _tag: "begin-match" }
  | { readonly _tag: "select-card"; readonly index: number }
  | { readonly _tag: "deselect-card"; readonly index: number }
  | { readonly _tag: "proceed-to-arrange" }
  | { readonly _tag: "rearrange-lineup"; readonly from: number; readonly to: number }
  | { readonly _tag: "preview-lineup" }
  | { readonly _tag: "lock-in" }
  | { readonly _tag: "reset-match"; readonly seed?: string }
  | { readonly _tag: "tune-kaironic"; readonly weights: Partial<KaironicWeights> };

export type BattleError =
  | {
      readonly _tag: "wrong-phase";
      readonly current: BattlePhase;
      readonly expected: readonly BattlePhase[];
    }
  | { readonly _tag: "lineup-invalid"; readonly reason: string }
  | { readonly _tag: "index-out-of-range"; readonly index: number; readonly bound: number };

export class Battle extends Context.Tag("purupuru-ttrpg/Battle")<
  Battle,
  {
    readonly current: Effect.Effect<BattleSnapshot>;
    readonly events: Stream.Stream<BattleEvent>;
    readonly invoke: (cmd: BattleCommand) => Effect.Effect<void, BattleError>;
  }
>() {}
