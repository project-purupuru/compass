/**
 * Card model — 18 cards across three sets, plus three transcendence cards.
 *
 * Sets:
 *   - jani         (1 per element × 5 = 5 strikers)
 *   - caretaker_a  (1 per element × 5 = 5 support)
 *   - caretaker_b  (1 per element × 5 = 5 utility)
 *   - transcendence (3 group-art cards, burn-only — Forge, Garden, Void)
 *
 * Pure module. No I/O.
 */

import { ELEMENT_ORDER, type Element } from "./wuxing";

export type CardType = "jani" | "caretaker_a" | "caretaker_b" | "transcendence";
export type CardStage = "still" | "moving" | "soul";

export interface CardDefinition {
  readonly defId: string;
  readonly element: Element;
  readonly cardType: CardType;
  readonly name: string;
  readonly basePower: number;
}

/** Type power hierarchy from purupuru-game battle.ts:TYPE_POWER. */
export const TYPE_POWER: Record<CardType, number> = {
  caretaker_a: 1.0,
  caretaker_b: 1.05,
  jani: 1.25,
  transcendence: 1.4,
};

/**
 * The 18 base cards. Names follow the world-purupuru lore (Kaori/Akane/
 * Nemu/Eun/Ruan as caretakers; element-specific Jani names per set).
 *
 * Transcendence cards are NOT in this list — they're only acquired via
 * the Burn Rite (see `burn.ts`).
 */
export const CARD_DEFINITIONS: readonly CardDefinition[] = [
  ...ELEMENT_ORDER.map(
    (element): CardDefinition => ({
      defId: `jani-${element}`,
      element,
      cardType: "jani",
      name: `Jani · ${element}`,
      basePower: 100,
    }),
  ),
  ...ELEMENT_ORDER.map(
    (element): CardDefinition => ({
      defId: `caretaker-a-${element}`,
      element,
      cardType: "caretaker_a",
      name: `Caretaker A · ${element}`,
      basePower: 100,
    }),
  ),
  ...ELEMENT_ORDER.map(
    (element): CardDefinition => ({
      defId: `caretaker-b-${element}`,
      element,
      cardType: "caretaker_b",
      name: `Caretaker B · ${element}`,
      basePower: 100,
    }),
  ),
];

/**
 * Three transcendence cards — only obtainable by burning a complete
 * 5-element set of the parent type.
 *   - The Forge (克)  ← burns 5 jani         · auto-counters opponent
 *   - The Garden (生) ← burns 5 caretaker_a  · protects chain bonuses
 *   - The Void (無)   ← burns 5 caretaker_b  · mirrors opponent power
 */
export const TRANSCENDENCE_DEFINITIONS: readonly (CardDefinition & {
  ability: "forge" | "garden" | "void";
})[] = [
  {
    defId: "transcendence-forge",
    element: "metal",
    cardType: "transcendence",
    name: "The Forge · 克",
    basePower: 100,
    ability: "forge",
  },
  {
    defId: "transcendence-garden",
    element: "wood",
    cardType: "transcendence",
    name: "The Garden · 生",
    basePower: 100,
    ability: "garden",
  },
  {
    defId: "transcendence-void",
    element: "water",
    cardType: "transcendence",
    name: "The Void · 無",
    basePower: 100,
    ability: "void",
  },
];

export interface Card {
  readonly id: string;
  readonly defId: string;
  readonly element: Element;
  readonly cardType: CardType;
  readonly stage: CardStage;
  readonly evolutionEnergy: number;
  readonly acquiredAt: string;
  /** Resonance for transcendence cards. 1 = base. ≥3 = immune to numbers-advantage tiebreak. */
  readonly resonance?: number;
}

let counter = 0;

/** Card factory. Deterministic-ish ids; tests overwrite via fixtures. */
export function createCard(def: CardDefinition, now: Date = new Date()): Card {
  counter += 1;
  return {
    id: `card-${now.getTime()}-${counter}`,
    defId: def.defId,
    element: def.element,
    cardType: def.cardType,
    stage: "still",
    evolutionEnergy: 0,
    acquiredAt: now.toISOString(),
  };
}

export function findDef(defId: string): CardDefinition | undefined {
  return (
    CARD_DEFINITIONS.find((d) => d.defId === defId) ??
    TRANSCENDENCE_DEFINITIONS.find((d) => d.defId === defId)
  );
}
