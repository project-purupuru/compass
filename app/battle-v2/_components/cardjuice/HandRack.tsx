/**
 * HandRack — 5-card lineup with drag-to-reorder + canonical CardFace render.
 *
 * Session 18 Stage B refactor #3 (2026-05-17 per operator pushback):
 *   - The cards can be REORDERED (drag-to-swap OR arrow keys when armed).
 *     Pitch: "you pick 5 cards and arrange them in a lineup." Lineup order
 *     is THE strategic decision.
 *   - The visible order drives a `slotOrder: instanceId[]` array, which
 *     parent (`CardLab`) reads via `onLineupChange` to sequence playback
 *     through ALL 5 cards on lock-in.
 *   - Uses canonical `CardFace` (real layered art via CardStack) and the
 *     canonical `.card-hand-fan` + `.card-hand-fan__slot` CSS classes from
 *     `app/battle-v2/_styles/battle-v2.css` for the layout. No bespoke
 *     fan curve.
 *
 * Lab-only conveniences (NOT canon game mechanics):
 *   - `1-5` arm slot · `D` discard · `R` reroll · `Shift+1-5` direct discard
 *   - `←` / `→` swap armed card with neighbor (lineup reorder)
 *   - HTML5 native drag from any slot onto another → swap slots
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CardFace } from "@/app/battle-v2/_components/CardFace";
import { ELEMENT_META } from "@/lib/wuxing/element";
import type { CardDefinition } from "@/lib/purupuru/contracts/types";

import { MOCK_DECK, MOCK_HAND } from "./cardData";

// ── Config ────────────────────────────────────────────────────────────────

export interface HandRackConfig {
  hoverLiftPx: number;
  hoverScaleMul: number;
  hoverDurationSec: number;
  keybindFlashDurationSec: number;
  keybindFlashOpacity: number;
  discardDurationSec: number;
  replacementDurationSec: number;
  replacementOvershoot: number;
  cardGapPx: number;
  cardWidthPx: number;
  cardHeightPx: number;
  bottomPx: number;
}

export const HAND_RACK_DEFAULTS: HandRackConfig = {
  hoverLiftPx: 20,
  hoverScaleMul: 1.15,
  hoverDurationSec: 0.1,
  keybindFlashDurationSec: 0.06,
  keybindFlashOpacity: 0.32,
  discardDurationSec: 0.22,
  replacementDurationSec: 0.28,
  replacementOvershoot: 1.08,
  cardGapPx: 14,
  cardWidthPx: 130,
  cardHeightPx: 184,
  bottomPx: 28,
};

// ── Slot model (internal) ─────────────────────────────────────────────────

interface SlotState {
  instanceId: string;
  card: CardDefinition;
  mode: "idle" | "hovered" | "armed" | "haptic" | "discarding" | "drawing";
  drawKey: number;
}

let _seqCounter = 0;
function mintInstanceId(card: CardDefinition): string {
  return `inst_${card.id}_${++_seqCounter}`;
}

function nextDeckCard(seenIds: Set<string>): CardDefinition {
  for (const c of MOCK_DECK) {
    if (!seenIds.has(c.id)) return c;
  }
  return MOCK_DECK[Math.floor(Math.random() * MOCK_DECK.length)];
}

// ── Component ─────────────────────────────────────────────────────────────

export interface HandRackProps {
  readonly config: HandRackConfig;
  readonly locked?: boolean;
  /**
   * Fires whenever the lineup changes (reorder, discard+draw, reroll).
   * Parent caches and uses on lock-in to sequence playback.
   */
  readonly onLineupChange?: (lineup: readonly CardDefinition[]) => void;
}

export function HandRack({ config, locked = false, onLineupChange }: HandRackProps) {
  const [slots, setSlots] = useState<SlotState[]>(() =>
    MOCK_HAND.map((card) => ({
      instanceId: mintInstanceId(card),
      card,
      mode: "idle",
      drawKey: 0,
    })),
  );
  const armedId = slots.find((s) => s.mode === "armed")?.instanceId ?? null;
  const armedIndex = slots.findIndex((s) => s.instanceId === armedId);

  // Notify parent on lineup change.
  const lineupRef = useRef<readonly CardDefinition[]>([]);
  useEffect(() => {
    const lineup = slots.map((s) => s.card);
    lineupRef.current = lineup;
    onLineupChange?.(lineup);
  }, [slots, onLineupChange]);

  // ── Arm / hover ──
  const armSlot = useCallback((instanceId: string) => {
    if (locked) return;
    setSlots((prev) =>
      prev.map((s) => {
        if (s.mode === "discarding" || s.mode === "drawing") return s;
        if (s.instanceId === instanceId) {
          return { ...s, mode: s.mode === "armed" ? "idle" : "armed" };
        }
        return { ...s, mode: s.mode === "armed" ? "idle" : s.mode };
      }),
    );
  }, [locked]);

  const setHover = useCallback((instanceId: string, hovered: boolean) => {
    if (locked) return;
    setSlots((prev) =>
      prev.map((s) => {
        if (s.instanceId !== instanceId) return s;
        if (s.mode === "armed" || s.mode === "discarding" || s.mode === "drawing" || s.mode === "haptic") {
          return s;
        }
        return { ...s, mode: hovered ? "hovered" : "idle" };
      }),
    );
  }, [locked]);

  // ── Reorder ──
  const swap = useCallback((iA: number, iB: number) => {
    if (locked) return;
    setSlots((prev) => {
      if (iA < 0 || iB < 0 || iA >= prev.length || iB >= prev.length) return prev;
      const next = [...prev];
      [next[iA], next[iB]] = [next[iB], next[iA]];
      return next;
    });
  }, [locked]);

  // ── Discard / draw / reroll ──
  const discardSlot = useCallback(
    (instanceId: string) => {
      const setMode = (mode: SlotState["mode"]) =>
        setSlots((prev) =>
          prev.map((s) => (s.instanceId === instanceId ? { ...s, mode } : s)),
        );

      setMode("haptic");
      window.setTimeout(() => {
        setMode("discarding");
        window.setTimeout(() => {
          setSlots((prev) => {
            const occupiedDefIds = new Set(
              prev
                .filter((s) => s.instanceId !== instanceId)
                .map((s) => s.card.id as unknown as string),
            );
            const next = nextDeckCard(occupiedDefIds);
            return prev.map((s) =>
              s.instanceId === instanceId
                ? {
                    instanceId: mintInstanceId(next),
                    card: next,
                    mode: "drawing",
                    drawKey: s.drawKey + 1,
                  }
                : s,
            );
          });
          window.setTimeout(() => {
            // After replacement settle, the new slot returns to idle.
            setSlots((prev) =>
              prev.map((s) =>
                s.mode === "drawing" ? { ...s, mode: "idle" } : s,
              ),
            );
          }, config.replacementDurationSec * 1000);
        }, config.discardDurationSec * 1000);
      }, config.keybindFlashDurationSec * 1000);
    },
    [config.discardDurationSec, config.keybindFlashDurationSec, config.replacementDurationSec],
  );

  const rerollHand = useCallback(() => {
    slots.forEach((s, i) =>
      window.setTimeout(() => discardSlot(s.instanceId), i * 70),
    );
  }, [slots, discardSlot]);

  // ── Keybinds ──
  useEffect(() => {
    if (locked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.target instanceof HTMLTextAreaElement) return;

      if (e.key >= "1" && e.key <= "5") {
        const idx = parseInt(e.key, 10) - 1;
        const s = slots[idx];
        if (s) armSlot(s.instanceId);
      }
      if (e.key === "d" || e.key === "D") {
        if (armedId) discardSlot(armedId);
      }
      if (e.key === "r" || e.key === "R") {
        rerollHand();
      }
      if (e.shiftKey && "!@#$%".includes(e.key)) {
        const idx = "!@#$%".indexOf(e.key);
        const s = slots[idx];
        if (s) discardSlot(s.instanceId);
      }
      // Arrow keys → swap armed slot with neighbor
      if (e.key === "ArrowLeft" && armedIndex > 0) {
        e.preventDefault();
        swap(armedIndex, armedIndex - 1);
      }
      if (e.key === "ArrowRight" && armedIndex >= 0 && armedIndex < slots.length - 1) {
        e.preventDefault();
        swap(armedIndex, armedIndex + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slots, armedId, armedIndex, armSlot, discardSlot, rerollHand, swap, locked]);

  // ── HTML5 drag-to-reorder state ──
  const [dragSrc, setDragSrc] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const onDragStart = (e: React.DragEvent, instanceId: string) => {
    if (locked) {
      e.preventDefault();
      return;
    }
    setDragSrc(instanceId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", instanceId);
    // Use a transparent 1x1 png as drag image so the browser default
    // doesn't show a confusing thumbnail.
    const img = new window.Image();
    img.src =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const onDragOver = (e: React.DragEvent, instanceId: string) => {
    if (locked || !dragSrc) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOver !== instanceId) setDragOver(instanceId);
  };

  const onDrop = (e: React.DragEvent, instanceId: string) => {
    e.preventDefault();
    if (!dragSrc || dragSrc === instanceId) {
      setDragSrc(null);
      setDragOver(null);
      return;
    }
    const iA = slots.findIndex((s) => s.instanceId === dragSrc);
    const iB = slots.findIndex((s) => s.instanceId === instanceId);
    swap(iA, iB);
    setDragSrc(null);
    setDragOver(null);
  };

  const onDragEnd = () => {
    setDragSrc(null);
    setDragOver(null);
  };

  // ── Layout ──
  const totalWidth = useMemo(
    () => slots.length * config.cardWidthPx + (slots.length - 1) * config.cardGapPx,
    [slots.length, config.cardWidthPx, config.cardGapPx],
  );

  return (
    <div
      role="region"
      aria-label="hand rack"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: config.bottomPx,
        display: "flex",
        justifyContent: "center",
        pointerEvents: locked ? "none" : "none",
        zIndex: 10,
        transform: locked ? "translateY(150px)" : "translateY(0)",
        opacity: locked ? 0 : 1,
        transition:
          "transform 0.2s cubic-bezier(0.32, 0, 0.67, 0), opacity 0.2s cubic-bezier(0.32, 0, 0.67, 0)",
      }}
    >
      <div
        style={{
          pointerEvents: locked ? "none" : "auto",
          position: "relative",
          width: totalWidth + 100,
          height: config.cardHeightPx + 40,
          padding: "0 24px",
          ["--card-face-w" as never]: `${config.cardWidthPx}px`,
          ["--card-face-h" as never]: `${config.cardHeightPx}px`,
        }}
      >
        {slots.map((slot, i) => (
          <CardSlot
            key={slot.instanceId}
            slot={slot}
            index={i}
            slotOffsetX={
              24 + i * (config.cardWidthPx + config.cardGapPx)
            }
            config={config}
            isDragOver={dragOver === slot.instanceId && dragSrc !== slot.instanceId}
            isDragSrc={dragSrc === slot.instanceId}
            onArm={() => armSlot(slot.instanceId)}
            onHover={(hovered) => setHover(slot.instanceId, hovered)}
            onDiscard={() => discardSlot(slot.instanceId)}
            onDragStart={(e) => onDragStart(e, slot.instanceId)}
            onDragOver={(e) => onDragOver(e, slot.instanceId)}
            onDrop={(e) => onDrop(e, slot.instanceId)}
            onDragEnd={onDragEnd}
          />
        ))}
        <DiscardPileMarker
          h={config.cardHeightPx * 0.5}
          offsetX={24 + slots.length * (config.cardWidthPx + config.cardGapPx) + 4}
          baseY={config.cardHeightPx * 0.25 + 20}
        />
      </div>
    </div>
  );
}

// ── Single slot ──────────────────────────────────────────────────────────

interface CardSlotProps {
  readonly slot: SlotState;
  readonly index: number;
  /** X offset in the rack (driven by slot index — animates when reordered). */
  readonly slotOffsetX: number;
  readonly config: HandRackConfig;
  readonly isDragOver: boolean;
  readonly isDragSrc: boolean;
  readonly onArm: () => void;
  readonly onHover: (hovered: boolean) => void;
  readonly onDiscard: () => void;
  readonly onDragStart: (e: React.DragEvent) => void;
  readonly onDragOver: (e: React.DragEvent) => void;
  readonly onDrop: (e: React.DragEvent) => void;
  readonly onDragEnd: () => void;
}

function CardSlot({
  slot,
  index,
  slotOffsetX,
  config,
  isDragOver,
  isDragSrc,
  onArm,
  onHover,
  onDiscard,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: CardSlotProps) {
  const accent =
    ELEMENT_META[slot.card.elementId as keyof typeof ELEMENT_META]?.canonicalHue ?? "#888";

  let translateY = 0;
  let scale = 1;
  let opacity = 1;
  let transitionTime = config.hoverDurationSec;
  let transitionEase = "cubic-bezier(0.215, 0.61, 0.355, 1)"; // easeOutQuad

  if (slot.mode === "discarding") {
    translateY = -240;
    scale = 0.5;
    opacity = 0;
    transitionTime = config.discardDurationSec;
    transitionEase = "cubic-bezier(0.32, 0, 0.67, 0)";
  } else if (slot.mode === "drawing") {
    transitionTime = config.replacementDurationSec;
    transitionEase = `cubic-bezier(0.34, ${0.4 + config.replacementOvershoot * 1.1}, 0.64, 1)`;
  }

  if (isDragSrc) opacity *= 0.35;

  const isHovered = slot.mode === "hovered" || slot.mode === "haptic" || isDragOver;
  const isArmed = slot.mode === "armed";

  // Outer wrapper handles ABSOLUTE positioning by slot index — when the
  // slot reorders, slotOffsetX changes and CSS transition handles the
  // animated slide to the new position. Inner wrapper handles per-mode
  // transforms (hover lift, discard fly-out, drawing slide-in).
  //
  // FLIP-style reorder is achieved cheaply via this position-based layout
  // instead of a measure-and-invert loop.
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translateX(${slotOffsetX}px)`,
        transition:
          "transform 0.34s cubic-bezier(0.34, 1.56, 0.64, 1)",
        width: config.cardWidthPx,
        height: config.cardHeightPx,
        pointerEvents: "auto",
      }}
    >
      <div
        draggable={!isArmed} // armed cards stay put; un-armed cards can be dragged
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        style={{
          width: config.cardWidthPx,
          height: config.cardHeightPx,
          transform: `translateY(${translateY}px) scale(${scale})`,
          transformOrigin: "50% 100%",
          transition: `transform ${transitionTime}s ${transitionEase}, opacity ${transitionTime}s ${transitionEase}`,
          opacity,
          animation:
            slot.mode === "drawing"
              ? `card-draw-in ${config.replacementDurationSec}s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`
              : undefined,
          position: "relative",
          cursor: isArmed ? "pointer" : "grab",
        }}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
      >
      <CardFace
        card={slot.card}
        hovered={isHovered}
        armed={isArmed}
        onClick={onArm}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
      />

      {/* Element-color haptic pulse */}
      {slot.mode === "haptic" && config.keybindFlashOpacity > 0 && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 8,
            background: accent,
            mixBlendMode: "soft-light",
            opacity: config.keybindFlashOpacity,
            pointerEvents: "none",
            transition: `opacity ${config.keybindFlashDurationSec}s linear`,
          }}
        />
      )}

      {/* Drop-target highlight */}
      {isDragOver && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: 10,
            border: `2px dashed ${accent}`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Slot number + right-click discard target */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 4,
          right: 6,
          width: 18,
          height: 18,
          borderRadius: 9,
          background: "rgba(0,0,0,0.65)",
          color: "#f0e6d0",
          fontFamily: "var(--font-puru-mono, monospace)",
          fontSize: 11,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        {index + 1}
      </div>
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          onDiscard();
        }}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />

      <style>{`
        @keyframes card-draw-in {
          from {
            transform: translate(180px, 80px) scale(0.5) rotate(8deg);
            opacity: 0;
          }
          to {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
      </div>
    </div>
  );
}

function DiscardPileMarker({
  h,
  offsetX,
  baseY,
}: {
  h: number;
  offsetX: number;
  baseY: number;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: offsetX,
        top: baseY,
        width: h * 0.7,
        height: h,
        border: "1.5px dashed rgba(200,160,100,0.35)",
        borderRadius: 8,
        background: "rgba(20,14,8,0.32)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-puru-mono, monospace)",
        fontSize: 10,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "rgba(200,160,100,0.5)",
        pointerEvents: "none",
        alignSelf: "center",
      }}
    >
      disc
    </div>
  );
}
