"use client";

/**
 * BattleHand — 1:1 port of world-purupuru BattleHand.svelte.
 * Card fan layout (--fan-rot, --fan-y inline) · element tint+pastel
 * gradient · turn-match honey marker · skip button.
 * CSS: app/battle/_styles/BattleHand.css
 */

import { useRef } from "react";
import type { Card } from "@/lib/honeycomb/cards";
import type { MatchPhase } from "@/lib/honeycomb/match.port";
import { ELEMENT_META, type Element } from "@/lib/honeycomb/wuxing";
import { type Combo, getPositionMultiplier } from "@/lib/honeycomb/combos";
import { juiceProfile } from "@/lib/juice/profile";
import { audioEngine } from "@/lib/audio/engine";
import { CardStack } from "@/lib/cards/layers";

interface BattleHandProps {
  readonly cards: readonly Card[];
  readonly phase: MatchPhase;
  readonly turnElement: Element;
  readonly selectedIndex?: number | null;
  readonly stamps?: ReadonlySet<number>;
  readonly dying?: ReadonlySet<number>;
  readonly visibleClashIdx?: number;
  readonly activeClashPhase?: "approach" | "impact" | "settle" | null;
  /**
   * Per-position clash winners. Used to gate the 敗 stamp + .lost class to
   * positions where the PLAYER lost (clash.winner === "opponent"). Without
   * this gate, every clash position would show 敗 even on wins.
   */
  readonly clashWinners?: ReadonlyMap<number, "player" | "opponent">;
  /**
   * Positions saved by Caretaker A Shield this round. Suppresses the 敗
   * stamp and shows a shield-burst glyph instead, so the player sees the
   * save mechanic rather than a "dead but undead" card.
   */
  readonly shielded?: ReadonlySet<number>;
  /**
   * Active combos on the player's current lineup. Used to render a per-card
   * "+X%" multiplier badge — the highest-impact legibility primitive for
   * "arrange is the puzzle." See grimoires/loa/proposals/mechanics-
   * legibility-audit.md.
   */
  readonly combos?: readonly Combo[];
  readonly onPlay?: (card: Card) => void;
  readonly onTap?: (index: number) => void;
  readonly onSwap?: (a: number, b: number) => void;
  readonly onSkip?: () => void;
  /** Open the CardPetal detail modal. Triggered by long-press on touch
   * OR right-click on desktop. Substrate-shaped: handler is opaque to
   * the hand; BattleScene owns the modal. */
  readonly onLongPress?: (index: number) => void;
}

/** Canonical fan from cycle-088 +page.svelte:
 *   --fan-rotate: fanOffset * 3 deg
 *   --fan-y:      |fanOffset| * 4 px
 *   where fanOffset = i - (total-1)/2
 */
function fanRotation(index: number, total: number): number {
  if (total <= 1) return 0;
  const fanCenter = (total - 1) / 2;
  return (index - fanCenter) * 3;
}

function fanLift(index: number, total: number): number {
  if (total <= 1) return 0;
  const fanCenter = (total - 1) / 2;
  return Math.abs(index - fanCenter) * 4;
}

function setLabel(t: Card["cardType"]): string {
  if (t === "jani") return "striker";
  if (t === "caretaker_a") return "support";
  if (t === "caretaker_b") return "utility";
  return "transcendence";
}

export function BattleHand({
  cards,
  phase,
  turnElement,
  selectedIndex = null,
  stamps,
  dying,
  visibleClashIdx = -1,
  activeClashPhase = null,
  clashWinners,
  shielded,
  combos,
  onPlay,
  onTap,
  onSwap,
  onSkip,
  onLongPress,
}: BattleHandProps) {
  // Long-press timer ref; cleared on pointerup/leave/move
  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);

  const startLongPress = (i: number) => {
    if (!onLongPress) return;
    longPressFiredRef.current = false;
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true;
      onLongPress(i);
      longPressTimerRef.current = null;
    }, 450);
  };
  const cancelLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };
  const handleContextMenu = (e: React.MouseEvent, i: number) => {
    if (!onLongPress) return;
    e.preventDefault();
    onLongPress(i);
  };
  const canPlay = phase === "arrange" || phase === "between-rounds";
  const total = cards.length;

  const onCardClick = (i: number, card: Card) => {
    // Suppress the click if a long-press just fired (touch devices
    // dispatch click after pointerup; we don't want to fire tap-to-swap
    // when the user just opened the petal).
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    if (canPlay && onTap) {
      audioEngine().play("ui.tap");
      onTap(i);
    } else if (onPlay) {
      onPlay(card);
    }
  };
  const onCardHover = () => {
    if (canPlay) audioEngine().play("ui.hover");
  };
  const onDragStart = (e: React.DragEvent, i: number) => {
    if (!canPlay) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(i));
    audioEngine().play("card.lift");
  };
  const onDragOver = (e: React.DragEvent) => {
    if (!canPlay) return;
    e.preventDefault();
  };
  const onDrop = (e: React.DragEvent, j: number) => {
    if (!canPlay || !onSwap) return;
    e.preventDefault();
    const i = Number(e.dataTransfer.getData("text/plain"));
    if (Number.isFinite(i) && i !== j) {
      audioEngine().play("card.swap");
      onSwap(i, j);
    }
  };

  return (
    <div className={`lineup player-lineup${canPlay ? "" : " disabled"}`}>
      {total > 0 ? (
        <>
          <div
            className={`lineup-row${activeClashPhase !== null ? " has-active-clash" : ""}`}
          >
            {cards.map((card, i) => {
              const isSelected = selectedIndex === i;
              // The 敗 stamp + .lost class only fire on positions the PLAYER
              // lost. Positions the player WON share the same `stamps` set
              // (every resolved clash adds an index) but stay clean visually.
              // Shielded positions suppress 敗 and show a shield-burst instead —
              // they survived via Caretaker A Shield (world-purupuru spec).
              const isShielded = shielded?.has(i) ?? false;
              const lostThisPosition =
                !isShielded && stamps?.has(i) && clashWinners?.get(i) === "opponent";
              const wonThisPosition = stamps?.has(i) && clashWinners?.get(i) === "player";
              const isDying = dying?.has(i) ?? false;
              const isActiveClash = visibleClashIdx === i;
              const cls = [
                "card-slot",
                "player-card",
                isSelected && "selected",
                lostThisPosition && "stamped",
                lostThisPosition && "lost",
                wonThisPosition && "won",
                isShielded && "shielded",
                isDying && "disintegrating",
                isActiveClash && activeClashPhase === "approach" && "clashing-approach",
                isActiveClash && activeClashPhase === "impact" && "clashing-impact",
                isActiveClash && activeClashPhase === "settle" && "clashing-settle",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <div
                  key={card.id}
                  className="card-slot-wrap"
                  data-slot={i}
                  style={
                    {
                      "--fan-rotate": `${fanRotation(i, total)}deg`,
                      "--fan-y": `${fanLift(i, total)}px`,
                      "--fan-z": i + 1,
                      // juice: center cards arrive first, edges last
                      "--deal-delay": `${juiceProfile.cardDealDelayMs(i, total)}ms`,
                    } as React.CSSProperties
                  }
                >
                  <button
                    type="button"
                    className={cls}
                    data-element={card.element}
                    data-card-type={card.cardType}
                    disabled={!canPlay && !onPlay}
                    draggable={canPlay}
                    onClick={() => onCardClick(i, card)}
                    onMouseEnter={onCardHover}
                    onDragStart={(e) => onDragStart(e, i)}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, i)}
                    onPointerDown={() => startLongPress(i)}
                    onPointerUp={cancelLongPress}
                    onPointerLeave={cancelLongPress}
                    onContextMenu={(e) => handleContextMenu(e, i)}
                    aria-label={`Play ${card.element} ${ELEMENT_META[card.element].name}`}
                    aria-pressed={isSelected}
                  >
                    <CardStack
                      className="card-art"
                      element={card.element}
                      cardType={card.cardType}
                      face="front"
                      alt={`${ELEMENT_META[card.element].caretaker} · ${setLabel(card.cardType)}`}
                    />
                    {/* CSS-shader iridescent foil — composable VFX. */}
                    <span
                      className="card-foil"
                      style={{ "--foil-delay": `${i * 0.6}s` } as React.CSSProperties}
                      aria-hidden
                    />
                    <span className="card-set-overlay">{setLabel(card.cardType)}</span>
                    {card.element === turnElement && (
                      <span className="turn-match" aria-label="Matches this turn's element">
                        +
                      </span>
                    )}
                    {lostThisPosition && <span className="card-stamp">敗</span>}
                    {isShielded && (
                      <span
                        className="shield-burst"
                        data-element={card.element}
                        aria-label="Saved by Caretaker A Shield"
                      />
                    )}
                    <ComboBadge combos={combos} position={i} phase={phase} />
                  </button>
                </div>
              );
            })}
          </div>
          {canPlay && onSkip && (
            <button type="button" className="skip-btn" onClick={onSkip}>
              let the tide carry
            </button>
          )}
        </>
      ) : (
        canPlay && <p className="empty-hand">the tide carries</p>
      )}
    </div>
  );
}

/**
 * Per-card multiplier chip — surfaces the player's per-position bonus during
 * the arrange phase. Hidden in clash phases so the impact + stamp visuals
 * own the card surface. The chip COMBINES every active combo's contribution
 * at the position into a single readable +X%.
 */
function ComboBadge({
  combos,
  position,
  phase,
}: {
  readonly combos: readonly Combo[] | undefined;
  readonly position: number;
  readonly phase: MatchPhase;
}) {
  if (!combos || combos.length === 0) return null;
  if (phase !== "arrange" && phase !== "between-rounds") return null;
  const mult = getPositionMultiplier(position, combos);
  if (mult <= 1.0) return null;
  const pct = Math.round((mult - 1) * 100);
  return (
    <span
      className="combo-badge"
      aria-label={`Combo bonus: +${pct}%`}
      title={describeCombosForPosition(combos, position)}
    >
      +{pct}%
    </span>
  );
}

function describeCombosForPosition(combos: readonly Combo[], position: number): string {
  return combos
    .filter((c) => c.affected.includes(position))
    .map((c) => c.name)
    .join(" · ");
}

