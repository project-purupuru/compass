/**
 * Wuxing — the Five Phases. Ported verbatim-in-logic from Gumi's game repo
 * (purupuru-game/prototype/src/lib/game/wuxing.ts) — her interpretation of the
 * canon. Decoupled only from the `$lib/data/elements` import; the cycles and
 * interaction values are unchanged.
 *
 * Generative (Shēng 生): Wood → Fire → Earth → Metal → Water → Wood
 * Destructive (Kè 克):   Wood → Earth → Water → Fire → Metal → Wood
 */

export type Element = "wood" | "fire" | "earth" | "metal" | "water";

/** The Shēng cycle order — also drives the daily/turn element rotation. */
export const ELEMENT_ORDER: readonly Element[] = ["wood", "fire", "earth", "metal", "water"];

/** Generative cycle (Shēng 生): each element nourishes the next. */
export const SHENG: Record<Element, Element> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

/** Destructive cycle (Kè 克): each element overcomes another. */
export const KE: Record<Element, Element> = {
  wood: "earth",
  earth: "water",
  water: "fire",
  fire: "metal",
  metal: "wood",
};

export type InteractionType =
  | "generates"
  | "overcomes"
  | "generated_by"
  | "overcome_by"
  | "same"
  | "neutral";

export interface ElementInteraction {
  readonly type: InteractionType;
  /** -0.3 to +0.3 */
  readonly advantage: number;
  readonly description: string;
}

export function getInteraction(attacker: Element, defender: Element): ElementInteraction {
  if (attacker === defender) {
    return { type: "same", advantage: 0, description: "Same element — balanced" };
  }
  if (KE[attacker] === defender) {
    return { type: "overcomes", advantage: 0.2, description: `${attacker} overcomes ${defender}` };
  }
  if (KE[defender] === attacker) {
    return {
      type: "overcome_by",
      advantage: -0.2,
      description: `${attacker} is overcome by ${defender}`,
    };
  }
  if (SHENG[attacker] === defender) {
    return { type: "generates", advantage: 0.1, description: `${attacker} nourishes ${defender}` };
  }
  if (SHENG[defender] === attacker) {
    return {
      type: "generated_by",
      advantage: -0.1,
      description: `${attacker} is nourished by ${defender}`,
    };
  }
  return { type: "neutral", advantage: 0, description: "Neutral interaction" };
}

/** Element that generates the given element (the Shēng source). */
export function getShengSource(element: Element): Element {
  for (const [source, target] of Object.entries(SHENG) as [Element, Element][]) {
    if (target === element) return source;
  }
  return element;
}

/** Element that overcomes the given element (the Kè counter). */
export function getKeCounter(element: Element): Element {
  for (const [attacker, defender] of Object.entries(KE) as [Element, Element][]) {
    if (defender === element) return attacker;
  }
  return element;
}
