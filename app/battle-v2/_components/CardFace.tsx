/**
 * CardFace — the player's card in hand, rendered with the real CardStack
 * composition: DOM-stacked layer art (background · frame · character ·
 * element effects · rarity treatment · behavioral).
 *
 * The layer system was ported into lib/cards/layers from compass — the
 * cycle-2 promise, pulled forward on operator request 2026-05-14. The harness
 * `cardType` taxonomy is role-based, so it's mapped to the layer system's
 * element + rarity inputs at this boundary.
 *
 * CardHandFan still renders <CardFace card={...}> unchanged — the composition
 * upgrade is contained entirely here.
 */

"use client";

import { CardStack, type LayerRarity } from "@/lib/cards/layers";
import { useCardTilt } from "@/lib/cards/useCardTilt";
import type { CardType as LayerCardType } from "@/lib/honeycomb/cards";
import type { CardDefinition } from "@/lib/purupuru/contracts/types";

import { beginPending, useDragState } from "./drag/dragStore";
import "./card-face.css";

interface CardFaceProps {
  readonly card: CardDefinition;
  readonly hovered?: boolean;
  readonly armed?: boolean;
  readonly onClick?: () => void;
  readonly onMouseEnter?: () => void;
  readonly onMouseLeave?: () => void;
}

/**
 * cycle-1 harness cardType → layer-system rarity. The harness taxonomy is
 * role-based; rarity escalates with how decisive the card's role is.
 */
const RARITY_BY_CARDTYPE: Record<CardDefinition["cardType"], LayerRarity> = {
  activation: "common",
  tool: "common",
  modifier: "mid",
  event: "mid",
  daemon: "rare",
  ritual: "rarest",
};

/**
 * Harness cardType → honeycomb layer-system CardType. CardStack's character
 * layer (lib/cards/layers/registry.json) uses the honeycomb taxonomy. Per
 * the pitch:
 *   - Elemental Jani  = strikers      → activation, daemon, event
 *   - Kizuna Caretaker A = support    → tool
 *   - Kizuna Caretaker B = utility    → modifier
 *   - Transcendence   = burn-special  → ritual
 * Without this bridge, CardStack would render no character art (the
 * harness cardType "activation" isn't a key in the registry's variants).
 */
const LAYER_CARDTYPE_BY_DEFINITION_CARDTYPE: Record<CardDefinition["cardType"], LayerCardType> = {
  activation: "jani",
  daemon: "jani",
  event: "jani",
  tool: "caretaker_a",
  modifier: "caretaker_b",
  ritual: "transcendence",
};

export function CardFace({
  card,
  hovered = false,
  armed = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: CardFaceProps) {
  const element = card.elementId;
  const rarity = RARITY_BY_CARDTYPE[card.cardType];
  const layerCardType = LAYER_CARDTYPE_BY_DEFINITION_CARDTYPE[card.cardType];

  // pokemon-cards-css 3D tilt — writes CSS vars to the button; card-face.css
  // applies the rotation to .card-face__art and a pointer glare on top.
  const tiltRef = useCardTilt<HTMLButtonElement>(element);

  // drag-to-region: pointer-down arms a pending drag (see drag/dragStore). Once
  // the pointer moves past threshold the DragGhost takes over and this card
  // dims in place. A sub-threshold release stays a plain click (onClick).
  const drag = useDragState();
  const isDragging = drag.phase === "dragging" && drag.cardId === card.id;

  const variantClass = armed
    ? "card-face--armed"
    : hovered
      ? "card-face--hovered"
      : "card-face--idle";

  return (
    <button
      ref={tiltRef}
      type="button"
      className={`card-face card-face--composed card-face--${element} ${variantClass}${
        isDragging ? " card-face--dragging" : ""
      }`}
      onClick={onClick}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        beginPending({
          cardId: card.id,
          element,
          cardType: layerCardType,
          rarity,
          pointer: { x: e.clientX, y: e.clientY },
        });
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-card-id={card.id}
      data-element={element}
      data-rarity={rarity}
      aria-label={`${card.id.replace(/_/g, " ")} · ${element} ${card.cardType} card`}
    >
      <CardStack
        className="card-face__art"
        element={element}
        cardType={layerCardType}
        rarity={rarity}
        alt={card.id.replace(/_/g, " ")}
      />
    </button>
  );
}
