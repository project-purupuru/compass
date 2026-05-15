/**
 * Ribbon — operator strip (operator fence F2).
 *
 * A stubby, content-width banner anchored top-left: the operator's handle +
 * tagline, with a single breathing stone for the active tide. Persistent
 * counters were removed (operator note 2026-05-14): turn was redundant with
 * the round herald; the 5-stone column collapsed to just the active stone
 * here. Match progression is announced ambiently by RoundAnnounce, not
 * counted on the strip.
 */

"use client";

import type { GameState } from "@/lib/purupuru/contracts/types";

interface RibbonProps {
  readonly state: GameState;
}

// Mock username — placeholder until a real player identity lands. The handle
// is the only mutable thing on the strip; the rest of the identity is fixed.
const USERNAME = "@soju";

export function Ribbon({ state }: RibbonProps) {
  const tide = state.weather.activeElement;
  return (
    <header className="hud-ribbon" aria-label="Player and active tide">
      <div className="hud-ribbon__id">
        <strong>{USERNAME}</strong>
        <small>caretaker of the grove</small>
      </div>
      <img
        className="hud-ribbon__stone"
        data-element={tide}
        src={`/art/stones/transparent/${tide}.png`}
        alt={`${tide} tide`}
      />
      <span className="hud-ribbon__element" data-element={tide}>{tide} tide</span>
    </header>
  );
}
