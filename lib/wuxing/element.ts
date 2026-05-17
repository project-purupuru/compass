/**
 * Wuxing — element primitives, grounded in the construct-purupuru-codex's
 * `core-lore/wuxing.yaml` source-of-truth.
 *
 * This module IS the runtime expression of that YAML. Hue / season / time-of-
 * day mappings here are CANON — operator-locked through the codex. Don't
 * invent new colors or shift the time mapping here; if canon evolves, update
 * the codex first, then mirror here.
 *
 * The sheng cycle (generative: wood → fire → earth → metal → water → wood)
 * also expresses time-of-day progression — morning → noon → afternoon →
 * evening → night → morning. The five elements ARE the five day-phases.
 */

import { Schema as S } from "effect";

// ── ElementId ──────────────────────────────────────────────────────────────

export const ElementId = S.Literal("wood", "fire", "earth", "metal", "water");
export type ElementIdT = S.Schema.Type<typeof ElementId>;

export const ALL_ELEMENTS: readonly ElementIdT[] = [
  "wood",
  "fire",
  "earth",
  "metal",
  "water",
];

// ── Element metadata (mirrors core-lore/wuxing.yaml) ───────────────────────

export interface ElementMeta {
  readonly id: ElementIdT;
  readonly canonicalHue: string;     // From wuxing.yaml `color`
  readonly season: "spring" | "summer" | "late-summer" | "autumn" | "winter";
  /** Position in the sheng / day-phase cycle. 0=wood/morning, 4=water/night. */
  readonly phaseIndex: 0 | 1 | 2 | 3 | 4;
  readonly henloLetter: "H" | "N" | "E" | "L" | "O";
  readonly traitPair: string;
  readonly puruhaniTrait: string;
}

export const ELEMENT_META: Record<ElementIdT, ElementMeta> = {
  wood: {
    id: "wood",
    canonicalHue: "#4CAF50",
    season: "spring",
    phaseIndex: 0,
    henloLetter: "H",
    traitPair: "Hopeful / Happy",
    puruhaniTrait: "hums while working",
  },
  fire: {
    id: "fire",
    canonicalHue: "#E55548",
    season: "summer",
    phaseIndex: 1,
    henloLetter: "N",
    traitPair: "Naughty / Nefarious",
    puruhaniTrait: "starts small fires",
  },
  earth: {
    id: "earth",
    canonicalHue: "#8D6E63",
    season: "late-summer",
    phaseIndex: 2,
    henloLetter: "E",
    traitPair: "Empty / Exhausted",
    puruhaniTrait: "naps between tasks",
  },
  metal: {
    id: "metal",
    canonicalHue: "#B0BEC5",
    season: "autumn",
    phaseIndex: 3,
    henloLetter: "L",
    traitPair: "Loyal / Loving",
    puruhaniTrait: "polishes carefully",
  },
  water: {
    id: "water",
    canonicalHue: "#42A5F5",
    season: "winter",
    phaseIndex: 4,
    henloLetter: "O",
    traitPair: "Overstimulated / Overwhelmed",
    puruhaniTrait: "drifts with the tide",
  },
};

// ── Sheng + ke cycles (from wuxing.yaml `cycles`) ──────────────────────────

/** Generative cycle — each element gives rise to the next. */
export const SHENG_SEQUENCE: readonly ElementIdT[] = [
  "wood",
  "fire",
  "earth",
  "metal",
  "water",
];

/** Overcoming cycle — each element restrains another. */
export const KE_SEQUENCE: readonly ElementIdT[] = [
  "wood",
  "earth",
  "water",
  "fire",
  "metal",
];

export function shengGenerates(element: ElementIdT): ElementIdT {
  const i = SHENG_SEQUENCE.indexOf(element);
  return SHENG_SEQUENCE[(i + 1) % 5];
}

export function shengGeneratedBy(element: ElementIdT): ElementIdT {
  const i = SHENG_SEQUENCE.indexOf(element);
  return SHENG_SEQUENCE[(i + 4) % 5];
}
