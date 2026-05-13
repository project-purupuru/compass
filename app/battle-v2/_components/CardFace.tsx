/**
 * Harness-native card face — cycle-1 placeholder per OD-2 path B.
 *
 * Renders from CardDefinition without depending on lib/cards/layers/ (which
 * lives on a different branch in this worktree). Cycle-2 swaps to full
 * art_anchor integration when branches merge.
 *
 * Per PRD r2 §5.5 + operator-confirmed pivot 2026-05-13 PM.
 */

"use client";

import type { CardDefinition, ElementId } from "@/lib/purupuru/contracts/types";

interface CardFaceProps {
  readonly card: CardDefinition;
  readonly hovered?: boolean;
  readonly armed?: boolean;
  readonly onClick?: () => void;
  readonly onMouseEnter?: () => void;
  readonly onMouseLeave?: () => void;
}

const ELEMENT_KANJI: Record<ElementId, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水",
};

const ELEMENT_LABEL: Record<ElementId, string> = {
  wood: "Wood",
  fire: "Fire",
  earth: "Earth",
  metal: "Metal",
  water: "Water",
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
  const kanji = ELEMENT_KANJI[element];
  const label = ELEMENT_LABEL[element];

  const variantClass = armed
    ? "card-face--armed"
    : hovered
      ? "card-face--hovered"
      : "card-face--idle";

  return (
    <button
      type="button"
      className={`card-face card-face--${element} ${variantClass}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-card-id={card.id}
      data-element={element}
      aria-label={`${label} card · ${card.id}`}
    >
      <div className="card-face__kanji" aria-hidden="true">
        {kanji}
      </div>
      <div className="card-face__name">{card.id.replace(/_/g, " ")}</div>
      <div className="card-face__type">{card.cardType}</div>
      <div className="card-face__verbs">
        {card.verbs.map((v) => (
          <span key={v} className="card-face__verb">
            {v}
          </span>
        ))}
      </div>
    </button>
  );
}
