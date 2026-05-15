/**
 * Ribbon — operator strip (operator fence F2).
 *
 * A stubby, content-width banner anchored top-left: the operator's handle +
 * tagline, with the active-tide kanji + element label in the element's vivid
 * hue. Persistent counters were removed (operator note 2026-05-14): turn was
 * redundant with the round herald; the 5-stone column collapsed to a single
 * symbol (the stone art didn't sit well against the operator strip — kanji
 * fits the typographic register, operator note 2026-05-14).
 *
 * The username — `henlo` — is the foundational greeting of the Purupuru
 * universe (HENLO: Hopeful · Empty · Naughty · Loyal · Overstimulated). Lives
 * in the construct-purupuru-codex/core-lore/henlo.md canon.
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

// Mock username — placeholder until a real player identity lands. Sourced from
// construct-purupuru-codex (HENLO: the world's foundational greeting).
const USERNAME = "henlo";

export function Ribbon({ state }: RibbonProps) {
  const tide = state.weather.activeElement;
  return (
    <header className="hud-ribbon" aria-label="Player and active tide">
      <div className="hud-ribbon__id">
        <strong>{USERNAME}</strong>
        <small>caretaker of the grove</small>
      </div>
      <span className="hud-ribbon__kanji" data-element={tide} aria-hidden="true">
        {ELEMENT_KANJI[tide]}
      </span>
      <span className="hud-ribbon__element" data-element={tide}>{tide} tide</span>
    </header>
  );
}
