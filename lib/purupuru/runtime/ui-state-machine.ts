/**
 * UI state machine — pure transition function (harness §7.1).
 *
 * Per SDD r1 §4.1. AC-5: full transition coverage.
 */

import type { SemanticEvent, UiMode } from "../contracts/types";

/**
 * Pure function: (UiMode, SemanticEvent) → UiMode.
 * Unknown / inapplicable transitions return the input mode unchanged (no-op).
 *
 * Test discipline: exhaustively cover every (mode, event) tuple in
 * __tests__/state-machines.test.ts. Untouched transitions count as no-op
 * (intentional — most events don't drive UI transitions).
 */
export function transitionUi(mode: UiMode, event: SemanticEvent): UiMode {
  switch (mode) {
    case "Boot":
      // System bootstrap. Loader fires WeatherChanged after initial state factory.
      if (event.type === "WeatherChanged") return "Loading";
      return mode;

    case "Loading":
      // Loading → WorldMapIdle on first WeatherChanged from runtime.
      // (Or system can manually move via an InputUnlocked from sequence.boot.)
      if (event.type === "InputUnlocked") return "WorldMapIdle";
      return mode;

    case "WorldMapIdle":
      if (event.type === "CardHovered") return "CardHovered";
      if (event.type === "CardArmed") return "CardArmed";
      return mode;

    case "CardHovered":
      if (event.type === "CardArmed") return "CardArmed";
      // Hover dropped → back to idle (no specific event; UI manages)
      return mode;

    case "CardArmed":
      if (event.type === "TargetPreviewed" && event.valid) return "Targeting";
      if (event.type === "CardPlayRejected") return "WorldMapIdle";
      return mode;

    case "Targeting":
      if (event.type === "TargetCommitted") return "Confirming";
      if (event.type === "CardPlayRejected") return "WorldMapIdle";
      return mode;

    case "Confirming":
      if (event.type === "CardCommitted") return "Resolving";
      if (event.type === "CardPlayRejected") return "WorldMapIdle";
      return mode;

    case "Resolving":
      if (event.type === "RewardGranted") return "RewardPreview";
      if (event.type === "InputUnlocked") return "WorldMapIdle";
      return mode;

    case "RewardPreview":
      // RewardPreview → WorldMapIdle on InputUnlocked (after sequence completes)
      if (event.type === "InputUnlocked") return "WorldMapIdle";
      return mode;

    case "TurnEnding":
      // System transition. WeatherChanged at day-rollover advances.
      if (event.type === "WeatherChanged") return "DayTransition";
      return mode;

    case "DayTransition":
      if (event.type === "WeatherChanged") return "WorldMapIdle";
      return mode;

    default: {
      const _exhaustive: never = mode;
      void _exhaustive;
      return mode;
    }
  }
}
