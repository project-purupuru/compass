/**
 * Card definitions — Gumi's 18-card catalog, ported from purupuru-game
 * (prototype/src/lib/data/card-defs.ts). Plus the BattleCard instance shape +
 * factory the battle engine works with.
 *
 * BattleCard is intentionally ComboCard-compatible (lib/cards/synergy) so the
 * synergy detector reads battle lineups directly.
 */

import type { LayerRarity } from "../layers";
import type { ComboCard } from "../synergy";
import type { Element } from "../synergy/wuxing";

export type CardType = "jani" | "caretaker_a" | "caretaker_b" | "transcendence";

export interface CardDefinition {
  readonly defId: string;
  readonly name: string;
  readonly element: Element;
  readonly cardType: CardType;
  readonly set: string;
  readonly flavorText: string;
}

/** Gumi's canonical 18-card catalog. */
export const CARD_DEFINITIONS: readonly CardDefinition[] = [
  // Elemental Jani (Strikers)
  { defId: "jani-wood", name: "Jani of Wood", element: "wood", cardType: "jani", set: "Elemental Jani", flavorText: "where the moss grows thickest, jani takes the longest naps." },
  { defId: "jani-fire", name: "Jani of Fire", element: "fire", cardType: "jani", set: "Elemental Jani", flavorText: "the rooftop is closer to the sun. jani likes it here." },
  { defId: "jani-earth", name: "Jani of Earth", element: "earth", cardType: "jani", set: "Elemental Jani", flavorText: "the kitchen smells like honey. jani is home." },
  { defId: "jani-metal", name: "Jani of Metal", element: "metal", cardType: "jani", set: "Elemental Jani", flavorText: "the stars are data. jani is reading them." },
  { defId: "jani-water", name: "Jani of Water", element: "water", cardType: "jani", set: "Elemental Jani", flavorText: "the tide is a lullaby. jani is listening." },

  // Kizuna Caretakers Set A (Support)
  { defId: "caretaker-a-wood", name: "Kaori & Happy", element: "wood", cardType: "caretaker_a", set: "Kizuna A", flavorText: "the garden yields little, but she tends it still." },
  { defId: "caretaker-a-fire", name: "Akane & Nefarious", element: "fire", cardType: "caretaker_a", set: "Kizuna A", flavorText: "the rooftop belongs to whoever climbs it first." },
  { defId: "caretaker-a-earth", name: "Nemu & Exhausted", element: "earth", cardType: "caretaker_a", set: "Kizuna A", flavorText: "drifting is not the same as lost." },
  { defId: "caretaker-a-metal", name: "Ren & Loving", element: "metal", cardType: "caretaker_a", set: "Kizuna A", flavorText: "the experiment continues. results pending." },
  { defId: "caretaker-a-water", name: "Ruan & Overwhelmed", element: "water", cardType: "caretaker_a", set: "Kizuna A", flavorText: "every feeling is a wave. she surfs them all." },

  // Kizuna Caretakers Set B (Utility)
  { defId: "caretaker-b-wood", name: "Kaori's Promise", element: "wood", cardType: "caretaker_b", set: "Kizuna B", flavorText: "one day the garden will feed everyone." },
  { defId: "caretaker-b-fire", name: "Akane's Dare", element: "fire", cardType: "caretaker_b", set: "Kizuna B", flavorText: "you won't know until you try." },
  { defId: "caretaker-b-earth", name: "Nemu's Rest", element: "earth", cardType: "caretaker_b", set: "Kizuna B", flavorText: "the couch is fine. the couch is always fine." },
  { defId: "caretaker-b-metal", name: "Ren's Theorem", element: "metal", cardType: "caretaker_b", set: "Kizuna B", flavorText: "hypothesis: bears are the answer. testing continues." },
  { defId: "caretaker-b-water", name: "Ruan's Melody", element: "water", cardType: "caretaker_b", set: "Kizuna B", flavorText: "the song changes key with the tide." },

  // Transcendence (obtainable only through burn)
  { defId: "transcendence-garden", name: "The Garden", element: "wood", cardType: "transcendence", set: "Transcendence", flavorText: "all rivers find the sea." },
  { defId: "transcendence-forge", name: "The Forge", element: "fire", cardType: "transcendence", set: "Transcendence", flavorText: "tension creates strength." },
  { defId: "transcendence-void", name: "The Void", element: "water", cardType: "transcendence", set: "Transcendence", flavorText: "beyond the cycle, stillness." },
];

export function getDefinition(defId: string): CardDefinition | undefined {
  return CARD_DEFINITIONS.find((d) => d.defId === defId);
}

export function definitionsByElement(element: Element): readonly CardDefinition[] {
  return CARD_DEFINITIONS.filter((d) => d.element === element);
}

/** cardType → CardStack rarity (the layered art treatment). Strikers +
 *  transcendence read at the high treatments; support/utility mid/common. */
export const RARITY_BY_CARDTYPE: Record<CardType, LayerRarity> = {
  jani: "rare",
  caretaker_a: "mid",
  caretaker_b: "common",
  transcendence: "rarest",
};

/**
 * A card instance in a battle — flat, and ComboCard-compatible (so the synergy
 * detector reads lineups directly). `uid` is the per-instance identity used to
 * track elimination.
 */
export interface BattleCard extends ComboCard {
  readonly uid: string;
  readonly defId: string;
  readonly element: Element;
  readonly cardType: CardType;
  readonly name: string;
  readonly rarity: LayerRarity;
  readonly resonance?: number;
}

let uidCounter = 0;

/** Mint a battle-card instance from a definition id. */
export function createBattleCard(defId: string, resonance?: number): BattleCard {
  const def = getDefinition(defId);
  if (!def) throw new Error(`[battle] unknown card def: ${defId}`);
  uidCounter += 1;
  return {
    uid: `${defId}#${uidCounter}`,
    defId: def.defId,
    element: def.element,
    cardType: def.cardType,
    name: def.name,
    rarity: RARITY_BY_CARDTYPE[def.cardType],
    resonance,
  };
}
