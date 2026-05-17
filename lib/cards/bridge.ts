import type { LayerRarity } from "@/lib/cards/layers";
import type { CardType as LayerCardType } from "@/lib/honeycomb/cards";
import type { CardDefinition } from "@/lib/purupuru/contracts/types";

type DefinitionCardType = CardDefinition["cardType"];

/**
 * cycle-1 harness cardType -> layer-system rarity. The harness taxonomy is
 * role-based; rarity escalates with how decisive the card's role is.
 */
const RARITY_BY_DEFINITION_CARDTYPE: Record<DefinitionCardType, LayerRarity> = {
  activation: "common",
  tool: "common",
  modifier: "mid",
  event: "mid",
  daemon: "rare",
  ritual: "rarest",
};

/**
 * Harness cardType -> honeycomb layer-system CardType. CardStack's character
 * layer uses the honeycomb taxonomy, while the harness taxonomy is role-based.
 */
const LAYER_CARDTYPE_BY_DEFINITION_CARDTYPE: Record<
  DefinitionCardType,
  LayerCardType
> = {
  activation: "jani",
  daemon: "jani",
  event: "jani",
  tool: "caretaker_a",
  modifier: "caretaker_b",
  ritual: "transcendence",
};

export function cardTypeBridge(cardType: DefinitionCardType): LayerCardType {
  return LAYER_CARDTYPE_BY_DEFINITION_CARDTYPE[cardType];
}

export function rarityBridge(cardType: DefinitionCardType): LayerRarity {
  return RARITY_BY_DEFINITION_CARDTYPE[cardType];
}
