/**
 * Element resonance — how strongly an element "breathes" given the current
 * time-of-day.
 *
 * Operator framing (session 17): ambient VFX is *always on* (operator-
 * locked), but its baseline intensity should BREATHE with the day. Wood
 * pulses hardest at morning (wood-hour); water pulses hardest at night
 * (water-hour). At the opposite hour, the cluster never goes silent — it
 * just dampens.
 *
 * The wuxing cycle is a 5-element ring (wood→fire→earth→metal→water→wood).
 * Phase distance between any two elements is 0, 1, or 2 (since 5/2 = 2.5).
 *
 * Curve (operator-tunable):
 *   distance 0 → 1.00  (canonical hour, full breath)
 *   distance 1 → 0.75  (adjacent, mild damp)
 *   distance 2 → 0.50  (opposite, half breath but never silent)
 *
 * The 0.50 floor honors the "ambient always-on" rule. If gameplay wants a
 * harder damp/silence behavior, that's a different layer — this is the
 * passive baseline.
 */

import { ELEMENT_META, type ElementIdT } from "./element";
import { ELEMENT_PHASE, type TimeOfDayPhase } from "./timeOfDay";

// ── Distance metric ────────────────────────────────────────────────────────

/**
 * Phase-cycle distance between two elements. Ring with 5 nodes →
 * distance is min(forward, backward).
 */
export function elementPhaseDistance(
  a: ElementIdT,
  b: ElementIdT,
): 0 | 1 | 2 {
  const ai = ELEMENT_META[a].phaseIndex;
  const bi = ELEMENT_META[b].phaseIndex;
  const raw = Math.abs(ai - bi);
  const dist = Math.min(raw, 5 - raw);
  return dist as 0 | 1 | 2;
}

// ── Resonance curve ────────────────────────────────────────────────────────

/**
 * Default resonance multiplier per phase distance.
 *   - 0 (canonical hour): 1.0
 *   - 1 (adjacent):       0.75
 *   - 2 (opposite-ish):   0.50
 *
 * Tunable via the `floor`/`peak` params if a future cycle wants a softer
 * or harder curve.
 */
export function resonanceMultiplier(
  element: ElementIdT,
  phase: TimeOfDayPhase,
  opts: { peak?: number; floor?: number } = {},
): number {
  const peak = opts.peak ?? 1.0;
  const floor = opts.floor ?? 0.5;
  const elementOfPhase = phaseElementFor(phase);
  const dist = elementPhaseDistance(element, elementOfPhase);
  switch (dist) {
    case 0:
      return peak;
    case 1:
      // Linear interpolation point between peak and floor at 75%/25%.
      return floor + (peak - floor) * 0.5;
    case 2:
      return floor;
  }
}

/** The element that "owns" this phase (e.g. night → water). */
function phaseElementFor(phase: TimeOfDayPhase): ElementIdT {
  // Inverse of ELEMENT_PHASE. Computed inline to avoid an extra const table.
  for (const elem of Object.keys(ELEMENT_PHASE) as ElementIdT[]) {
    if (ELEMENT_PHASE[elem] === phase) return elem;
  }
  return "wood"; // unreachable; satisfies tsc
}
