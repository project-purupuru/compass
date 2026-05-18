"use client";

/**
 * CardPetal — modal detail view for a single card.
 *
 * Architecture (operator decision 2026-05-12):
 *   The CARD is JUST stacked images (background + frame + character +
 *   foil shine + glare + element stone overlay). It tilts as one
 *   physical object via the Pokemon-cards-css 3D parallax in
 *   lib/cards/useCardTilt.
 *
 *   The TEXT / chrome (caretaker name, type label, virtue, power,
 *   cycle, flavor, close button) lives in a detached sidebar
 *   (.petal-info) that does NOT tilt. The two compose horizontally on
 *   desktop, vertically on narrow viewports.
 *
 * Opens on long-press (touch) / right-click (desktop). Closes on
 * backdrop click or Esc. Locks body scroll while open.
 *
 * The "petal" name comes from world-purupuru convention — a card
 * blooms outward into a contemplative full view.
 */

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Card } from "@/lib/honeycomb/cards";
import { findDef, TYPE_POWER } from "@/lib/honeycomb/cards";
import { ELEMENT_META, SHENG, KE } from "@/lib/honeycomb/wuxing";
import { audioEngine } from "@/lib/audio/engine";
import { CardStack } from "@/lib/cards/layers";
import { useCardTilt } from "@/lib/cards/useCardTilt";

interface CardPetalProps {
  readonly card: Card | null;
  readonly onClose: () => void;
}

const TYPE_LABEL: Record<string, string> = {
  jani: "Striker",
  caretaker_a: "Support",
  caretaker_b: "Utility",
  transcendence: "Transcendence",
};

export function CardPetal({ card, onClose }: CardPetalProps) {
  // Pokemon-cards-css 3D parallax — pointer over the CARD writes
  // --rotate-x/y, --pointer-x/y, --holo-hue, --card-opacity to the .petal
  // node. Only the card surface tilts; the info sidebar stays still.
  const tiltRef = useCardTilt<HTMLElement>(card?.element);

  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [card, onClose]);

  return (
    <AnimatePresence>
      {card && (
        <motion.div
          className="petal-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => {
            audioEngine().play("ui.toggle");
            onClose();
          }}
          aria-modal="true"
          role="dialog"
          aria-label={`${ELEMENT_META[card.element].caretaker} card detail`}
        >
          {/* Motion handles bloom/exit (writes inline transform). The
              tilt + the info panel are independent children. The mount
              also establishes the 3D scene so the .petal's rotateX/Y
              has somewhere to project into. */}
          <motion.div
            className="petal-mount"
            data-element={card.element}
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ─── THE CARD ───────────────────────────────────────────
                Pure image stack: bg + frame + character + element-glow
                + rarity treatment + behavioral. Tilts as one physical
                surface. Stone moved to info panel (operator decision
                2026-05-12). */}
            <article
              ref={tiltRef as React.RefObject<HTMLElement>}
              className="petal-card"
              data-element={card.element}
              data-card-type={card.cardType}
            >
              <CardStack
                className="petal-card-art"
                element={card.element}
                cardType={card.cardType}
                face="front"
                alt={`${ELEMENT_META[card.element].caretaker} · ${card.cardType}`}
              />
              {/* Holographic foil — drifts under pointer position */}
              <span className="petal-card-shine" aria-hidden />
              {/* Glare — bright spot follows the cursor */}
              <span className="petal-card-glare" aria-hidden />
            </article>

            {/* ─── DETACHED INFO PANEL ────────────────────────────────
                Caretaker name, type, virtue, power, sheng/ke cycle,
                flavor text. Does NOT tilt — lives beside the card on
                desktop, below on mobile. */}
            <aside className="petal-info" data-element={card.element}>
              <header className="petal-info-header">
                <span className="petal-info-kanji" data-element={card.element}>
                  {ELEMENT_META[card.element].kanji}
                </span>
                <div className="petal-info-titles">
                  <span className="petal-info-caretaker">
                    {ELEMENT_META[card.element].caretaker}
                  </span>
                  <span className="petal-info-type">
                    {TYPE_LABEL[card.cardType] ?? card.cardType}
                  </span>
                </div>
                {/* Element stone — replaces the virtue glyph in this
                    slot per operator request (2026-05-12). The kanji
                    is embossed on the stone, the virtue moves out of
                    the header (deferred / surfaceable elsewhere). */}
                <img
                  className="petal-info-stone"
                  src={`/art/stones/transparent/${card.element}.png`}
                  alt={`${ELEMENT_META[card.element].kanji} stone`}
                  title={`${ELEMENT_META[card.element].virtue} — ${ELEMENT_META[card.element].name}`}
                  draggable={false}
                />
              </header>

              <div className="petal-info-stats">
                <div className="petal-info-power" aria-label="power">
                  <span className="petal-info-power__num">
                    {TYPE_POWER[card.cardType].toFixed(2)}
                  </span>
                  <span className="petal-info-power__times">×</span>
                </div>
                <div className="petal-info-cycle">
                  <div
                    className="petal-info-cycle-pair"
                    title={`Generates ${ELEMENT_META[SHENG[card.element]].name}`}
                  >
                    <span className="petal-info-cycle-arrow">→</span>
                    <span
                      className="petal-info-cycle-kanji"
                      data-element={SHENG[card.element]}
                    >
                      {ELEMENT_META[SHENG[card.element]].kanji}
                    </span>
                  </div>
                  <div
                    className="petal-info-cycle-pair"
                    title={`Overcomes ${ELEMENT_META[KE[card.element]].name}`}
                  >
                    <span className="petal-info-cycle-arrow">⚔</span>
                    <span
                      className="petal-info-cycle-kanji"
                      data-element={KE[card.element]}
                    >
                      {ELEMENT_META[KE[card.element]].kanji}
                    </span>
                  </div>
                </div>
              </div>

              <div className="petal-info-flavor">
                {findDef(card.defId)?.name && (
                  <p className="petal-info-name">{findDef(card.defId)?.name}</p>
                )}
                <p className="petal-info-text">{flavorFor(card)}</p>
              </div>

              <button
                type="button"
                className="petal-info-close"
                onClick={() => {
                  audioEngine().play("ui.toggle");
                  onClose();
                }}
                aria-label="Close"
              >
                close
              </button>
            </aside>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function flavorFor(card: Card): string {
  const def = findDef(card.defId);
  if (!def) return "an unfamiliar card";
  if (def.cardType === "transcendence") {
    return `${def.name} — ability: ${(def as { ability?: string }).ability ?? "—"}`;
  }
  return `${ELEMENT_META[card.element].caretaker} of ${ELEMENT_META[card.element].name.toLowerCase()}`;
}
