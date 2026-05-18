/**
 * Clash — round-level battle resolution.
 *
 * Pure-given-seed: same input → identical RoundResult. The Match service
 * (lib/honeycomb/match.live.ts) orchestrates this, calling resolveRound at
 * the right phase beats.
 *
 * Closes PRD r1 FR-12 + AC-4. SDD §3.1.
 */

import { Context, type Effect, type Stream } from "effect";
import type { Card } from "./cards";
import type { Combo } from "./combos";
import type { BattleCondition } from "./conditions";
import type { Element, ElementInteraction } from "./wuxing";

export interface ClashCard {
  readonly card: Card;
  readonly position: number; // 0..4
}

export interface ClashResult {
  readonly p1Card: ClashCard;
  readonly p2Card: ClashCard;
  readonly p1Power: number; // post-multiplier
  readonly p2Power: number;
  readonly shift: number; // |p1Power - p2Power|
  readonly loser: "p1" | "p2" | "draw";
  readonly interaction: ElementInteraction;
  readonly vfx: ClashVfx;
  readonly reason: string;
}

export type ClashVfx =
  | "resonance"
  | "steam"
  | "sparks"
  | "roots"
  | "melt"
  | "absorb"
  | "blaze"
  | "forge"
  | "flow"
  | "ash"
  | "bloom"
  | "clash";

export interface RoundResult {
  readonly round: number;
  readonly clashes: readonly ClashResult[];
  /** UIDs of cards eliminated this round. */
  readonly eliminated: readonly string[];
  /** Survivors per side, in order. */
  readonly survivors: {
    readonly p1: readonly Card[];
    readonly p2: readonly Card[];
  };
  /** Chain bonus at start vs end of round (Garden grace preserves on death). */
  readonly chainBonusAtRoundStart: number;
  readonly chainBonusAtRoundEnd: number;
  readonly gardenGraceFired: boolean;
}

export interface ResolveRoundInput {
  readonly p1Lineup: readonly Card[];
  readonly p2Lineup: readonly Card[];
  readonly weather: Element;
  readonly condition: BattleCondition;
  readonly round: number;
  readonly seed: string;
  readonly p1CombosAtRoundStart: readonly Combo[];
  readonly p2CombosAtRoundStart: readonly Combo[];
  /** For Garden grace continuation across rounds. */
  readonly previousChainBonus?: number;
}

export class Clash extends Context.Tag("purupuru-ttrpg/Clash")<
  Clash,
  {
    /** Resolve a single round of attrition. Pure-given-seed. */
    readonly resolveRound: (input: ResolveRoundInput) => Effect.Effect<RoundResult>;
    /** Apply a condition's post-processing to a clash sequence. */
    readonly applyCondition: (
      clashes: readonly ClashResult[],
      condition: BattleCondition,
    ) => readonly ClashResult[];
    /** Stream of round results for consumers. */
    readonly emit: Stream.Stream<RoundResult>;
  }
>() {}
