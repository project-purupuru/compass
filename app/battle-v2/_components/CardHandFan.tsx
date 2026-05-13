/**
 * CardHandFan — bottom-edge 5-card hand using harness-native CardFace.
 *
 * Per PRD r2 FR-21 + OD-2 path B (no CardStack adapter).
 */

"use client";

import type {
  CardDefinition,
  ContentDatabase,
  GameState,
} from "@/lib/purupuru/contracts/types";

import { CardFace } from "./CardFace";

interface CardHandFanProps {
  readonly state: GameState;
  readonly content: ContentDatabase;
  readonly hoveredCardId: string | null;
  readonly armedCardId: string | null;
  readonly onCardClick: (cardInstanceId: string) => void;
  readonly onCardHoverChange: (cardInstanceId: string | null) => void;
}

export function CardHandFan({
  state,
  content,
  hoveredCardId,
  armedCardId,
  onCardClick,
  onCardHoverChange,
}: CardHandFanProps) {
  const handCards: { instanceId: string; definition: CardDefinition }[] = Object.values(state.cards)
    .filter((c) => c.location === "InHand" || c.location === "Hovered" || c.location === "Armed")
    .map((c) => ({
      instanceId: c.instanceId,
      definition: content.getCardDefinition(c.definitionId),
    }))
    .filter((c): c is { instanceId: string; definition: CardDefinition } => c.definition !== undefined);

  return (
    <div className="card-hand-fan">
      {handCards.map((c) => (
        <div key={c.instanceId} className="card-hand-fan__slot">
          <CardFace
            card={c.definition}
            hovered={hoveredCardId === c.instanceId}
            armed={armedCardId === c.instanceId}
            onClick={() => onCardClick(c.instanceId)}
            onMouseEnter={() => onCardHoverChange(c.instanceId)}
            onMouseLeave={() => onCardHoverChange(null)}
          />
        </div>
      ))}
    </div>
  );
}
