/**
 * CardHandFan — bottom-edge 5-card hand using harness-native CardFace.
 *
 * Per PRD r2 FR-21 + OD-2 path B (no CardStack adapter).
 *
 * Session 7: the hand is now an anchor. It binds `anchor.hand.card.center` —
 * the origin point the PetalArc launches from. The played card itself leaves
 * the hand the instant it commits (resolver → Resolving location), so the
 * honest origin is the *hand*, not a card slot that's already gone. On the
 * `card_anticipation` beat the hand gives a brief release-settle: the give of
 * a thrown thing.
 */

"use client";

import { useEffect, useRef, useState } from "react";

import type {
  CardDefinition,
  ContentDatabase,
  GameState,
} from "@/lib/purupuru/contracts/types";
import type { BeatFireRecord } from "@/lib/purupuru/presentation/sequencer";

import { ANCHOR, type AnchorStore } from "./anchors/anchorStore";
import { useDomAnchorBinding } from "./anchors/useAnchorBinding";
import { CardFace } from "./CardFace";

interface CardHandFanProps {
  readonly state: GameState;
  readonly content: ContentDatabase;
  readonly hoveredCardId: string | null;
  readonly armedCardId: string | null;
  readonly onCardClick: (cardInstanceId: string) => void;
  readonly onCardHoverChange: (cardInstanceId: string | null) => void;
  readonly anchorStore: AnchorStore;
  readonly activeBeat: BeatFireRecord | null;
}

export function CardHandFan({
  state,
  content,
  hoveredCardId,
  armedCardId,
  onCardClick,
  onCardHoverChange,
  anchorStore,
  activeBeat,
}: CardHandFanProps) {
  const handRef = useRef<HTMLDivElement>(null);

  // Bind the hand container as the launch anchor. Remeasure when a card arms
  // (the hand re-lays-out as the armed card lifts).
  useDomAnchorBinding(anchorStore, ANCHOR.handCardCenter, handRef, [armedCardId]);

  // The hand's acknowledgement of the release — card_anticipation beat.
  // The timer is ref-owned: the next beat fires ~120ms later, so a cleanup
  // tied to `[activeBeat]` would cancel the release-settle before it resolves.
  const [releasing, setReleasing] = useState(false);
  const releaseTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (activeBeat?.beatId !== "card_anticipation") return;
    if (releaseTimerRef.current !== null) window.clearTimeout(releaseTimerRef.current);
    setReleasing(true);
    releaseTimerRef.current = window.setTimeout(() => {
      setReleasing(false);
      releaseTimerRef.current = null;
    }, 340);
  }, [activeBeat]);
  useEffect(
    () => () => {
      if (releaseTimerRef.current !== null) window.clearTimeout(releaseTimerRef.current);
    },
    [],
  );

  const handCards: { instanceId: string; definition: CardDefinition }[] = Object.values(state.cards)
    .filter((c) => c.location === "InHand" || c.location === "Hovered" || c.location === "Armed")
    .map((c) => ({
      instanceId: c.instanceId,
      definition: content.getCardDefinition(c.definitionId),
    }))
    .filter((c): c is { instanceId: string; definition: CardDefinition } => c.definition !== undefined);

  return (
    <div
      ref={handRef}
      className={`card-hand-fan${releasing ? " card-hand-fan--releasing" : ""}`}
    >
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
