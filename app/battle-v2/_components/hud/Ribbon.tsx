/**
 * Ribbon — the player + stats strip (operator fence F2).
 *
 * A stubby, content-width banner anchored top-left (operator FEEL note
 * 2026-05-14): the operator name + a couple of compact stat chips. Day/night
 * was removed — it'll read off the map/world later, not a HUD chip.
 */

"use client";

import type { ElementId, GameState } from "@/lib/purupuru/contracts/types";

const ELEMENT_KANJI: Record<ElementId, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水",
};

interface RibbonProps {
  readonly state: GameState;
}

export function Ribbon({ state }: RibbonProps) {
  const tide = state.weather.activeElement;
  return (
    <header className="hud-ribbon" aria-label="Player and match status">
      <div className="hud-ribbon__id">
        <strong>Operator</strong>
        <small>caretaker of the grove</small>
      </div>
      <div className="hud-ribbon__chips">
        <span className="hud-ribbon__chip hud-ribbon__chip--tide" data-element={tide}>
          {ELEMENT_KANJI[tide]} {tide} tide
        </span>
        <span className="hud-ribbon__chip">turn {state.turn}</span>
      </div>
    </header>
  );
}
