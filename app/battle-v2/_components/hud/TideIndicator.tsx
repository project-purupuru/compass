/**
 * TideIndicator — the active element as a FELT presence, not a label.
 *
 * Per build doc HUD slice: a stone badge that breathes at the element's own
 * rhythm. Wood breathes slow (`--breath-wood`). The breathing IS the read —
 * the player feels which element is in flow before they parse the text.
 */

"use client";

import type { ElementId } from "@/lib/purupuru/contracts/types";

const ELEMENT_KANJI: Record<ElementId, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水",
};

interface TideIndicatorProps {
  readonly activeElement: ElementId;
}

export function TideIndicator({ activeElement }: TideIndicatorProps) {
  return (
    <div className="tide-indicator" aria-label={`Active tide: ${activeElement}`}>
      <span className="tide-indicator__stone tide-indicator__stone--active">
        <span aria-hidden="true">{ELEMENT_KANJI[activeElement]}</span>
        <span className="tide-indicator__stone-label">{activeElement}</span>
      </span>
    </div>
  );
}
