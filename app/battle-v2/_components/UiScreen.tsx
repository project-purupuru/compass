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
      <header className="ui-screen__top-strip">
        {slots.titleCartouche ? (
          <div className="ui-screen__slot ui-screen__slot--title-cartouche">{slots.titleCartouche}</div>
        ) : null}
        {slots.focusBanner ? (
          <div className="ui-screen__slot ui-screen__slot--focus-banner">
            {slots.focusBanner}
            {slots.tideIndicator ? <div className="ui-screen__inline-tide">{slots.tideIndicator}</div> : null}
          </div>
        ) : null}
        {slots.selectedCardPreview ? (
          <div className="ui-screen__slot ui-screen__slot--action-panel">{slots.selectedCardPreview}</div>
        ) : null}
      </header>
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
