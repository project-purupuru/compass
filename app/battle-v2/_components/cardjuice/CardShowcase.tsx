/**
 * CardShowcase — right-side big-card art panel during playback.
 *
 * Per operator framing 2026-05-17: "I would want to put the actual card
 * shown really nicely in a big size, just like how the game was shown.
 * Having it on the right side allows people to see it, and then on the
 * left side you can see the actions happening."
 *
 * This is the LOCKED card position per the latitude resolution that
 * reversed Gemini's centered-marquee pushback — the operator wants the
 * STARDUST-style right-side anchor preserved because the action area
 * sits on the left half of the playfield in this game.
 *
 * Animation: spring-driven scale 1.5x → 1.0x in 0.15s easeOutBack (Gemini
 * directive #1) on entry, holds, then exits with easeInCubic.
 */

"use client";

import { useEffect, useState } from "react";

import { CardFace } from "@/app/battle-v2/_components/CardFace";
import type { CardDefinition } from "@/lib/purupuru/contracts/types";

interface CardShowcaseProps {
  readonly card: CardDefinition | null;
  /** When true, animate in. When false, animate out. */
  readonly visible: boolean;
}

export function CardShowcase({ card, visible }: CardShowcaseProps) {
  const [renderedCard, setRenderedCard] = useState<CardDefinition | null>(null);

  // Latch the card on first show so the exit transition still has art to
  // render against. Clear after the exit transition completes.
  useEffect(() => {
    if (visible && card) setRenderedCard(card);
    if (!visible) {
      const id = window.setTimeout(() => setRenderedCard(null), 250);
      return () => window.clearTimeout(id);
    }
  }, [visible, card]);

  if (!renderedCard) return null;

  return (
    <div
      role="img"
      aria-label={`now playing: ${renderedCard.id.replace(/_/g, " ")}`}
      style={{
        position: "fixed",
        right: 56,
        top: "50%",
        // Scale-down entry: 1.5x → 1.0x easeOutBack on `visible=true`,
        // 1.0x → 0.5x easeInCubic on `visible=false`. Translate Y centers
        // the card; X stays anchored to the right edge.
        transform: `translateY(-50%) scale(${visible ? 1.0 : 0.5})`,
        opacity: visible ? 1 : 0,
        transformOrigin: "100% 50%",
        transition: visible
          ? "transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s linear"
          : "transform 0.2s cubic-bezier(0.32, 0, 0.67, 0), opacity 0.2s linear",
        zIndex: 25,
        pointerEvents: "none",
        // Scale the card itself larger for the showcase — battle-v2.css's
        // .card-face base is ~110×160. We want roughly 220×320 here.
        width: 220,
        height: 320,
        filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.65))",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          // Wrap the CardFace and scale its inner art up to fill our box.
          // CardFace doesn't have a size prop; we scale via transform.
          transform: "scale(1.85)",
          transformOrigin: "center center",
        }}
      >
        <CardFace card={renderedCard} hovered={false} armed={false} />
      </div>
    </div>
  );
}
