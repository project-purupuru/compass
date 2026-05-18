/**
 * cardData — minimum-shape mock CardDefinitions for the card-lab.
 *
 * Session 18 Stage B refactor. Real CardDefinitions are heavy (resolver
 * steps, presentation IDs, schema version, etc.) — see
 * `lib/purupuru/contracts/types.ts`. The lab only needs the 3 fields
 * CardFace reads: `id`, `elementId`, `cardType`. We cast through
 * `unknown` to a partial CardDefinition for type-compat.
 *
 * Element identity drives the card-stack art via the layer registry at
 * `lib/cards/layers/registry.json`. The cardType drives rarity escalation.
 */

import type { CardDefinition } from "@/lib/purupuru/contracts/types";
import type { ElementIdT } from "@/lib/wuxing/element";

/** Minimum subset the card-lab needs. */
type MockCardShape = {
  readonly id: string;
  readonly elementId: ElementIdT;
  readonly cardType: CardDefinition["cardType"];
};

function makeMockCard(shape: MockCardShape): CardDefinition {
  return shape as unknown as CardDefinition;
}

/**
 * Five-card mock hand — one per wuxing element, mirroring the canonical
 * Jani striker set from the pitch.
 */
export const MOCK_HAND: readonly CardDefinition[] = [
  makeMockCard({ id: "jani_wood_strike",  elementId: "wood",  cardType: "activation" }),
  makeMockCard({ id: "jani_fire_burst",   elementId: "fire",  cardType: "activation" }),
  makeMockCard({ id: "jani_earth_stand",  elementId: "earth", cardType: "activation" }),
  makeMockCard({ id: "jani_metal_edge",   elementId: "metal", cardType: "activation" }),
  makeMockCard({ id: "jani_water_pull",   elementId: "water", cardType: "activation" }),
];

/** Deck pool — when a card is discarded, replacement is drawn from here. */
export const MOCK_DECK: readonly CardDefinition[] = [
  ...MOCK_HAND,
  makeMockCard({ id: "wood_modifier",     elementId: "wood",  cardType: "modifier" }),
  makeMockCard({ id: "fire_tool",         elementId: "fire",  cardType: "tool" }),
  makeMockCard({ id: "earth_daemon",      elementId: "earth", cardType: "daemon" }),
  makeMockCard({ id: "metal_event",       elementId: "metal", cardType: "event" }),
  makeMockCard({ id: "water_ritual",      elementId: "water", cardType: "ritual" }),
];
