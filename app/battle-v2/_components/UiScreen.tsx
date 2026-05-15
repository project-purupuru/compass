/**
 * UiScreen — slot-driven layout wrapper.
 *
 * Per PRD r2 FR-20 + Opus HIGH-2: consumes ui.world_map_screen.yaml's
 * layoutSlots[] and components[] arrays as the source of truth for layout.
 *
 * Cycle-1: simplified — renders 3 named regions (top_strip · center_world ·
 * bottom_strip) with absolute-positioned slots inside each. Children are
 * passed via props for each slot.
 */

"use client";

import type { ReactNode } from "react";

import type { UiScreenDefinition } from "@/lib/purupuru/contracts/types";

interface UiScreenProps {
  readonly screen: UiScreenDefinition;
  readonly slots: {
    readonly worldMap?: ReactNode;
    readonly cardHand?: ReactNode;
    readonly focusBanner?: ReactNode;
    readonly tideIndicator?: ReactNode;
    readonly selectedCardPreview?: ReactNode;
    readonly endTurnButton?: ReactNode;
    readonly deckCounter?: ReactNode;
    readonly titleCartouche?: ReactNode;
  };
}

export function UiScreen({ screen, slots }: UiScreenProps) {
  void screen; // Cycle-1: schema validates the YAML; layout uses CSS regions.
  return (
    <div className="ui-screen ui-screen--world-map">
      {/* Top strip removed (operator fence F2, 2026-05-14) — replaced by the
          Ribbon zone in _components/hud/HudOverlay.tsx. The titleCartouche /
          focusBanner / tideIndicator / selectedCardPreview slots are still
          accepted by the props type but no longer rendered here; BattleV2 may
          stop passing them in a coordinated cleanup. */}
      <main className="ui-screen__center-world">
        {slots.worldMap ? <div className="ui-screen__slot ui-screen__slot--world-map">{slots.worldMap}</div> : null}
      </main>
      <footer className="ui-screen__bottom-strip">
        {slots.deckCounter ? (
          <div className="ui-screen__slot ui-screen__slot--deck-counter">{slots.deckCounter}</div>
        ) : null}
        {slots.cardHand ? (
          <div className="ui-screen__slot ui-screen__slot--card-hand">{slots.cardHand}</div>
        ) : null}
        {slots.endTurnButton ? (
          <div className="ui-screen__slot ui-screen__slot--end-turn">{slots.endTurnButton}</div>
        ) : null}
      </footer>
    </div>
  );
}
