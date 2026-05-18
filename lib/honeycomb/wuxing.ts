/**
 * Wuxing — the Five Phases engine for the card game.
 *
 * Pure constants and pure functions. No state, no I/O, no Effect.
 * Ports — `cards`, `combos`, `battle.live` — depend on this; this
 * depends on nothing.
 *
 * Lifted from purupuru-game/prototype/src/lib/game/wuxing.ts (the
 * 204-test reference). World-purupuru's state-v4 added Setup Strike
 * and Caretaker A/B mechanics; those live in `combos.ts` and
 * `battle.live.ts` respectively. Wuxing is just the elemental physics.
 */

export type Element = "wood" | "fire" | "earth" | "metal" | "water";

export const ELEMENT_ORDER: readonly Element[] = [
  "wood",
  "fire",
  "earth",
  "metal",
  "water",
] as const;

/** Generating cycle (相生 Shēng): each element nourishes the next. */
export const SHENG: Record<Element, Element> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

/** Overcoming cycle (相剋 Kè): each element overcomes another. */
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
  /** Power shift multiplier the attacker enjoys against the defender. */
  readonly attackerShift: number;
  /** Power shift multiplier the defender suffers. */
  readonly defenderShift: number;
}

/**
 * Compute the relationship between attacker and defender elements.
 *
 * Shēng (generates): +15% attacker, -10% defender
 * Kè (overcomes):    +30% attacker, -25% defender
 * Same:               neutral
 */
export function getInteraction(attacker: Element, defender: Element): ElementInteraction {
  if (attacker === defender) {
    return { type: "same", attackerShift: 1.0, defenderShift: 1.0 };
  }
  if (SHENG[attacker] === defender) {
    return { type: "generates", attackerShift: 1.15, defenderShift: 0.9 };
  }
  if (KE[attacker] === defender) {
    return { type: "overcomes", attackerShift: 1.3, defenderShift: 0.75 };
  }
  if (SHENG[defender] === attacker) {
    return { type: "generated_by", attackerShift: 0.9, defenderShift: 1.15 };
  }
  if (KE[defender] === attacker) {
    return { type: "overcome_by", attackerShift: 0.75, defenderShift: 1.3 };
  }
  return { type: "neutral", attackerShift: 1.0, defenderShift: 1.0 };
}

/**
 * Element of the day. Drives weather-blessing combos and the imbalance
 * condition. Hackathon: deterministic 5-day rotation. Production: read
 * from the Five Oracles (TREMOR seismic, CORONA solar, BREATH air).
 */
export function getDailyElement(date: Date = new Date()): Element {
  const dayIndex = Math.floor(date.getTime() / (1000 * 60 * 60 * 24)) % 5;
  return ELEMENT_ORDER[dayIndex];
}

/**
 * Are two elements adjacent on the Shēng chain (in order)?
 * Used by combo detection.
 */
export function isShengAdjacent(left: Element, right: Element): boolean {
  return SHENG[left] === right;
}

/** Element metadata — caretaker names + virtues for whisper system. */
export const ELEMENT_META: Record<
  Element,
  { kanji: string; name: string; caretaker: string; virtue: string; virtueKanji: string }
> = {
  wood: { kanji: "木", name: "Wood", caretaker: "Kaori", virtue: "Benevolence", virtueKanji: "仁" },
  fire: { kanji: "火", name: "Fire", caretaker: "Akane", virtue: "Propriety", virtueKanji: "禮" },
  earth: { kanji: "土", name: "Earth", caretaker: "Nemu", virtue: "Fidelity", virtueKanji: "信" },
  metal: {
    kanji: "金",
    name: "Metal",
    caretaker: "Eun",
    virtue: "Righteousness",
    virtueKanji: "義",
  },
  water: { kanji: "水", name: "Water", caretaker: "Ruan", virtue: "Wisdom", virtueKanji: "智" },
};
