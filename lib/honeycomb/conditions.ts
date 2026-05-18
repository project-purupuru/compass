/**
 * Battle conditions — the per-match imbalance modifier.
 *
 * Each element brings a different way of warping the puzzle:
 *   - Wood "Growing"  · late positions hit harder
 *   - Fire "Volatile" · early positions hit harder
 *   - Earth "Steady"  · center positions strengthened
 *   - Metal "Precise" · the single biggest clash is doubled
 *   - Water "Tidal"   · all shifts amplified — bigger swings
 *
 * Lifted from purupuru-game/prototype/src/lib/game/conditions.ts.
 */

import type { Element } from "./wuxing";

export type ConditionEffect =
  | {
      readonly type: "position_scale";
      readonly scales: readonly [number, number, number, number, number];
    }
  | { readonly type: "entrenched" }
  | { readonly type: "precise" }
  | { readonly type: "tidal"; readonly multiplier: number };

export interface BattleCondition {
  readonly id: string;
  readonly element: Element;
  readonly name: string;
  readonly description: string;
  readonly tooltip: string;
  readonly effect: ConditionEffect;
}

export const CONDITIONS: Record<Element, BattleCondition> = {
  wood: {
    id: "growing",
    element: "wood",
    name: "Growing",
    description: "Late positions are stronger.",
    tooltip: "The garden rewards patience. Position 5 hits hardest.",
    effect: { type: "position_scale", scales: [0.9, 0.95, 1.0, 1.1, 1.2] },
  },
  fire: {
    id: "volatile",
    element: "fire",
    name: "Volatile",
    description: "Early positions are stronger.",
    tooltip: "Strike first or burn out. Position 1 hits hardest.",
    effect: { type: "position_scale", scales: [1.2, 1.1, 1.0, 0.95, 0.9] },
  },
  earth: {
    id: "steady",
    element: "earth",
    name: "Steady",
    description: "Center holds; close clashes favor the entrenched side.",
    tooltip: "The center is fortified. Position 3 hits hardest, ties go to bigger lineup.",
    effect: { type: "entrenched" },
  },
  metal: {
    id: "precise",
    element: "metal",
    name: "Precise",
    description: "The largest single clash shift is doubled.",
    tooltip: "One clean cut, twice as deep.",
    effect: { type: "precise" },
  },
  water: {
    id: "tidal",
    element: "water",
    name: "Tidal",
    description: "All shifts amplified — bigger swings, real comebacks.",
    tooltip: "The current carries everything further than expected.",
    effect: { type: "tidal", multiplier: 1.4 },
  },
};
