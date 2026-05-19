/**
 * CardFace — the player's card in hand.
 *
 * Dispatches between two render paths:
 *   1. Codex-driven (Gumi-authored) via <CodexCardFace> when the gameplay
 *      card derives to a codex-canonical slug. SoT: /codex/cards/<slug>/.
 *   2. Legacy registry fallback via <CardStack> when no codex match exists.
 *      Drives off lib/cards/layers/registry.json slot resolver.
 *
 * `data-render-via` attr on the root button makes the path visible in
 * devtools + lets the kitchen primitive count coverage. The dispatch is
 * lazy/async (codex membership check resolves after mount); during that
 * resolve the legacy path renders to avoid a flash.
 *
 * Consumers: CardHandFan · HandRack · CardShowcase · vfx-lab card-lab effect.
 * Wiring through this single dispatch propagates to all of them.
 */

"use client";

import { useEffect, useState } from "react";

import { cardTypeBridge, rarityBridge } from "@/lib/cards/bridge";
import { CardStack } from "@/lib/cards/layers";
import { resolveCodexSlug } from "@/lib/cards/codex/cardIdMap";
import { useCardTilt } from "@/lib/cards/useCardTilt";
import type { CardDefinition } from "@/lib/purupuru/contracts/types";

import { CodexCardFace } from "./cards/CodexCardFace";
import { deriveCodexSlug } from "@/lib/cards/codex/cardIdMap";
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

type RenderVia = "codex" | "legacy-registry" | "resolving";

export function CardFace({
  card,
  hovered = false,
  armed = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: CardFaceProps) {
  const element = card.elementId;
  const rarity = rarityBridge(card.cardType);
  const layerCardType = cardTypeBridge(card.cardType);

  // Async dispatch — check whether the codex has visuals for this card.
  // Cached in CodexCardsPort, so this resolves in microseconds after the
  // first card mounts.
  const [codexSlug, setCodexSlug] = useState<string | null>(null);
  const [renderVia, setRenderVia] = useState<RenderVia>("resolving");
  useEffect(() => {
    let cancelled = false;
    setRenderVia("resolving");
    resolveCodexSlug(card)
      .then((slug) => {
        if (cancelled) return;
        setCodexSlug(slug);
        setRenderVia(slug ? "codex" : "legacy-registry");
      })
      .catch(() => {
        if (!cancelled) setRenderVia("legacy-registry");
      });
    return () => {
      cancelled = true;
    };
  }, [card]);

  const tiltRef = useCardTilt<HTMLButtonElement>(element);

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
      data-render-via={renderVia}
      data-codex-slug={codexSlug ?? ""}
      aria-label={`${card.id.replace(/_/g, " ")} · ${element} ${card.cardType} card`}
    >
      {renderVia === "codex" && codexSlug ? (
        <CodexCardFace slug={codexSlug} className="card-face__art" />
      ) : (
        <CardStack
          className="card-face__art"
          element={element}
          cardType={layerCardType}
          rarity={rarity}
          alt={card.id.replace(/_/g, " ")}
        />
      )}
      <PointerChip
        renderVia={renderVia}
        codexSlug={codexSlug}
        derivedSlug={deriveCodexSlug(card)}
        gameplayId={card.id}
      />
    </button>
  );
}

/**
 * PointerChip — visible pointer to the entity this card renders.
 *
 * Operator-driven (2026-05-18): "I need to understand the reasoning for
 * changes and sources of truth in terms of pointers." Each card carries a
 * tiny chip showing the gameplay-id → codex-slug pointer + render-via state,
 * styled to be unobtrusive but legible. Same shape as Godot's scene-name
 * label or Unity's prefab-instance tag — the entity behind the visual is
 * always discoverable without devtools.
 *
 * Hide entirely by setting `--card-pointer-chip-opacity: 0` on a parent.
 */
function PointerChip({
  renderVia,
  codexSlug,
  derivedSlug,
  gameplayId,
}: {
  renderVia: RenderVia;
  codexSlug: string | null;
  derivedSlug: string;
  gameplayId: string;
}) {
  const color =
    renderVia === "codex"
      ? "rgba(127, 216, 163, 0.85)"
      : renderVia === "legacy-registry"
        ? "rgba(240, 192, 96, 0.75)"
        : "rgba(154, 170, 187, 0.65)";
  const label =
    renderVia === "codex" && codexSlug
      ? `→ ${codexSlug}`
      : renderVia === "legacy-registry"
        ? `→ ${derivedSlug}*`
        : "→ …";
  return (
    <span
      className="card-face__pointer-chip"
      data-pointer-via={renderVia}
      style={{
        position: "absolute",
        left: 4,
        bottom: 4,
        fontFamily: "monospace",
        fontSize: 9,
        letterSpacing: "0.04em",
        padding: "2px 5px",
        borderRadius: 3,
        background: "rgba(0, 0, 0, 0.5)",
        color,
        pointerEvents: "none",
        zIndex: 50,
        opacity: "var(--card-pointer-chip-opacity, 0.78)",
        whiteSpace: "nowrap",
        textShadow: "0 1px 2px rgba(0,0,0,0.6)",
      }}
      title={`gameplay: ${gameplayId} · derived: ${derivedSlug} · render: ${renderVia}`}
    >
      {label}
    </span>
  );
}
