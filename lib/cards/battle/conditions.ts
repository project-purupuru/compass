/**
 * Battle conditions — ported from Gumi's purupuru-game
 * (prototype/src/lib/game/conditions.ts). Each imbalance element brings a
 * modifier that changes the lineup puzzle. Decoupled only from the $lib
 * Element import.
 */

import type { Element } from "../synergy/wuxing";

export type ConditionEffect =
  | { readonly type: "position_scale"; readonly scales: readonly number[] }
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
    tooltip:
      "Cards on the right of your lineup get a power boost. Position 1: -20%. Position 5: +40%. Put your strongest cards last — the garden blooms at the end.",
    effect: { type: "position_scale", scales: [0.8, 0.9, 1.0, 1.2, 1.4] },
  },
  fire: {
    id: "volatile",
    element: "fire",
    name: "Volatile",
    description: "Early positions hit hard.",
    tooltip:
      "Cards on the left hit harder, the right side fades. Position 1: +30%. Position 5: -30%. Front-load your best cards or waste them.",
    effect: { type: "position_scale", scales: [1.3, 1.15, 1.0, 0.85, 0.7] },
  },
  earth: {
    id: "steady",
    element: "earth",
    name: "Steady",
    description: "The center holds strongest.",
    tooltip:
      "Cards in the middle are boosted. Position 3: +30%. Edges: -20%. Stack your strongest card in the center and protect the flanks.",
    effect: { type: "position_scale", scales: [0.8, 1.0, 1.3, 1.0, 0.8] },
  },
  metal: {
    id: "precise",
    element: "metal",
    name: "Precise",
    description: "One decisive clash is doubled.",
    tooltip:
      "After all clashes resolve, the single biggest power difference is doubled. Build one overwhelming clash and accept losses elsewhere. One cut. Clean.",
    effect: { type: "precise" },
  },
  water: {
    id: "tidal",
    element: "water",
    name: "Tidal",
    description: "All shifts amplified.",
    tooltip:
      "Every clash result is multiplied by 1.3x. Wins feel bigger, losses hit harder — a single strong clash can swing the whole match.",
    effect: { type: "tidal", multiplier: 1.3 },
  },
};
