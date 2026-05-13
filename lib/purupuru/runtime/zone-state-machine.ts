/**
 * Zone state machine — pure transition function (harness §7.3).
 *
 * Per SDD r1 §4.3. 10 states: Locked → Idle → ValidTarget → InvalidTarget →
 * Previewed → Active → Resolving → Afterglow → Resolved → Exhausted.
 *
 * AC-5: full transition coverage. The 4 decorative locked tiles per PRD D9 are
 * pinned to "Locked" forever in cycle 1 (cannot transition).
 */

import type { SemanticEvent, ZoneState } from "../contracts/types";

export function transitionZone(
  current: ZoneState,
  event: SemanticEvent,
  zoneId: string,
): ZoneState {
  // Locked zones (decorative tiles per D9) never transition.
  if (current === "Locked") return current;

  // Does event reference this zone?
  const refersTo = (e: SemanticEvent): boolean => {
    if ("zoneId" in e) return e.zoneId === zoneId;
    if ("target" in e && e.target && typeof e.target === "object" && "kind" in e.target) {
      return e.target.kind === "zone" && e.target.zoneId === zoneId;
    }
    return false;
  };

  if (!refersTo(event)) return current;

  switch (current) {
    case "Idle":
      // CardArmed with this zone as a valid target → ValidTarget.
      // The runtime / UI determines validity before emitting TargetPreviewed.
      if (event.type === "TargetPreviewed") return event.valid ? "ValidTarget" : "InvalidTarget";
      if (event.type === "ZoneActivated") return "Active";
      return current;

    case "ValidTarget":
      if (event.type === "TargetCommitted") return "Previewed";
      if (event.type === "ZoneActivated") return "Active";
      // Card un-armed (no specific event in cycle-1 union) → back to Idle.
      return current;

    case "InvalidTarget":
      // CardPlayRejected on invalid target → back to Idle.
      if (event.type === "CardPlayRejected") return "Idle";
      return current;

    case "Previewed":
      if (event.type === "CardCommitted") return "Active";
      if (event.type === "CardPlayRejected") return "Idle";
      return current;

    case "Active":
      if (event.type === "ZoneEventStarted") return "Resolving";
      return current;

    case "Resolving":
      if (event.type === "ZoneEventResolved") return "Afterglow";
      return current;

    case "Afterglow":
      // Afterglow → Resolved after presentation completes (InputUnlocked is the runtime signal).
      if (event.type === "InputUnlocked") return "Resolved";
      return current;

    case "Resolved":
      // Cycle-1: resolved zones stay resolved. Cycle-2 may re-arm on day transition.
      if (event.type === "WeatherChanged") return "Idle";
      return current;

    case "Exhausted":
      // Terminal cycle-1.
      return current;

    default: {
      const _exhaustive: never = current;
      void _exhaustive;
      return current;
    }
  }
}
