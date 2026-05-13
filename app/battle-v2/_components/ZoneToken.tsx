/**
 * ZoneToken — per-zone interactive surface.
 *
 * Per PRD r2 FR-22 + SDD r1 §5.3 + Opus HIGH-1 (10+6 state compose).
 *
 * Two orthogonal state spaces:
 *   • Gameplay states from harness §7.3: 10 values (Locked/Idle/ValidTarget/...)
 *   • UI interaction states: 6 values (idle/hovered/pressed/selected/disabled/resolving)
 *
 * Decorative locked tiles (per D9) are pinned to gameplay=Locked + UI=disabled
 * via the `decorative` prop. They cannot accept commands.
 */

"use client";

import type { ElementId, ZoneRuntimeState, ZoneState } from "@/lib/purupuru/contracts/types";

export type UiInteractionState =
  | "idle"
  | "hovered"
  | "pressed"
  | "selected"
  | "disabled"
  | "resolving";

interface ZoneTokenProps {
  readonly zoneId: string;
  readonly state: ZoneRuntimeState;
  readonly uiState?: UiInteractionState;
  /** When true, pins gameplay=Locked + UI=disabled regardless of state input. */
  readonly decorative?: boolean;
  readonly onClick?: () => void;
  readonly onMouseEnter?: () => void;
  readonly onMouseLeave?: () => void;
}

const ELEMENT_KANJI: Record<ElementId, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水",
};

export function ZoneToken({
  zoneId,
  state,
  uiState = "idle",
  decorative = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: ZoneTokenProps) {
  const gameplayState: ZoneState = decorative ? "Locked" : state.state;
  const ui: UiInteractionState = decorative ? "disabled" : uiState;
  const element = state.elementId;
  const kanji = ELEMENT_KANJI[element];
  const isInteractive = !decorative && gameplayState !== "Locked";

  return (
    <button
      type="button"
      className={`zone-token zone-token--${element} zone-token--${gameplayState.toLowerCase()} zone-token--ui-${ui}`}
      onClick={isInteractive ? onClick : undefined}
      onMouseEnter={isInteractive ? onMouseEnter : undefined}
      onMouseLeave={isInteractive ? onMouseLeave : undefined}
      disabled={!isInteractive}
      data-zone-id={zoneId}
      data-element={element}
      data-gameplay-state={gameplayState}
      data-ui-state={ui}
      aria-label={`${zoneId} (${element})`}
    >
      <div className="zone-token__kanji" aria-hidden="true">
        {kanji}
      </div>
      <div className="zone-token__name">{zoneId.replace(/_/g, " ")}</div>
      {state.activationLevel > 0 ? (
        <div className="zone-token__activation">⚡ {state.activationLevel}</div>
      ) : null}
    </button>
  );
}
