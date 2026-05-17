/**
 * CardShowcase — right-side big-card art panel during playback.
 *
 * Per operator framing 2026-05-17: the card "animates INWARDS" — it slides
 * IN from off-screen right, settles at its anchor position with a slight
 * back-and-forth oscillation (overshoot), holds during playback, then
 * slides back OUT on exit. NOT a scale-in-place stamp.
 *
 * Composition:
 *   - Entry: translateX(+160%) → translateX(0) over 0.32s easeOutBack;
 *     slight rotateZ(-4deg → 0) so the card reads like it was dealt in
 *     from the deck, not teleported.
 *   - Hold: subtle breathing scale (1.0 ↔ 1.012) at 2.6s period so the
 *     card feels alive during the playback hold.
 *   - Exit: translateX(0) → translateX(+160%) over 0.24s easeInCubic.
 */

"use client";

import { useEffect, useRef, useState } from "react";

import { CardFace } from "@/app/battle-v2/_components/CardFace";
import type { CardDefinition } from "@/lib/purupuru/contracts/types";

interface CardShowcaseProps {
  readonly card: CardDefinition | null;
  readonly visible: boolean;
  /** Card width in pixels (base 110×160 scales up — defaults to ~1.9x base). */
  readonly widthPx?: number;
  readonly heightPx?: number;
  /** Anchor offset from right edge in pixels. */
  readonly rightPx?: number;
}

export function CardShowcase({
  card,
  visible,
  widthPx = 200,
  heightPx = 290,
  rightPx = 64,
}: CardShowcaseProps) {
  const [renderedCard, setRenderedCard] = useState<CardDefinition | null>(null);

  // Latch the card on show so exit transitions still have art to render.
  useEffect(() => {
    if (visible && card) setRenderedCard(card);
    if (!visible) {
      const id = window.setTimeout(() => setRenderedCard(null), 280);
      return () => window.clearTimeout(id);
    }
  }, [visible, card]);

  // Subtle breathing during hold — scale 1.0 ↔ 1.012 at 2.6s period.
  // Driven via rAF so it doesn't fight the entry transition.
  const [breathPhase, setBreathPhase] = useState(0);
  const breathStartRef = useRef<number | null>(null);
  useEffect(() => {
    if (!visible) {
      breathStartRef.current = null;
      return;
    }
    let raf = 0;
    const tick = (t: number) => {
      if (breathStartRef.current === null) breathStartRef.current = t;
      // Start breathing 0.4s after entry to let the entry settle first.
      const elapsed = (t - breathStartRef.current) / 1000;
      if (elapsed > 0.4) {
        const phase = ((elapsed - 0.4) / 2.6) * Math.PI * 2;
        setBreathPhase(phase);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  if (!renderedCard) return null;

  const breathScale = 1 + 0.012 * Math.sin(breathPhase);
  const visScale = visible ? breathScale : 1;
  const translateX = visible ? 0 : 160; // percent
  const rotate = visible ? 0 : -4; // deg — slight tilt as it leaves/enters

  return (
    <div
      role="img"
      aria-label={`now playing: ${renderedCard.id.replace(/_/g, " ")}`}
      style={{
        position: "fixed",
        right: rightPx,
        top: "50%",
        marginTop: -heightPx / 2,
        width: widthPx,
        height: heightPx,
        transform: `translateX(${translateX}%) rotate(${rotate}deg) scale(${visScale})`,
        transformOrigin: "100% 50%",
        opacity: visible ? 1 : 0,
        transition: visible
          ? // Entry: slide IN + spring overshoot
            "transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.18s linear"
          : // Exit: slide OUT, faster, no overshoot
            "transform 0.24s cubic-bezier(0.32, 0, 0.67, 0), opacity 0.22s linear",
        zIndex: 25,
        pointerEvents: "none",
        filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.65))",
      }}
    >
      {/* Inner wrapper scales the CardFace up. The CardFace base is
          ~110×160 (battle-v2.css); we want roughly 200×290 here. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          // Center the underlying CardFace + scale it to fill our box.
          // Use transform-based scaling so card-face's internal layout
          // stays intact (no reflow).
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            transform: `scale(${widthPx / 110})`,
            transformOrigin: "center center",
          }}
        >
          <CardFace card={renderedCard} hovered={false} armed={false} />
        </div>
      </div>
    </div>
  );
}
