/**
 * trimPath — dashed-line "draw-in" animation primitive.
 *
 * Per Gemini's STARDUST analysis (2026-05-17 pull-thread "After Effects
 * Trim Paths game-engine implementation"). The dashed movement trail
 * connecting caster to target should DRAW IN progressively, not pop in.
 * This is the equivalent of AE's Trim Paths End-property animating from
 * 0% → 100%.
 *
 * Implementation: a normalized progress value 0..1 that the caller maps
 * onto a polyline geometry's visible-fraction (via shader, line-dash
 * offset, or per-vertex alpha). The substrate just owns the timing.
 *
 * Tuning (Gemini-spec):
 *   - duration: 0.18s (fast — the trail leads the character by a few
 *     frames so the character "follows the line that was drawn for them")
 *   - easing:   easeOutQuart (rapid start, gentle settle)
 *   - tail:     once draw-in completes, the LAST 30% of the trail fades
 *     out as the character traverses past it (operator can tune)
 */

import type { Easing } from "./sequence";
import { easeOutQuart } from "./sequence";

export interface TrimPathTuning {
  /** Time in seconds to draw-in 0 → 100%. Default 0.18s. */
  readonly drawInSec: number;
  /** Easing applied to draw-in progress. Default easeOutQuart. */
  readonly drawInEase: Easing;
  /** Time the trail holds at 100% before tail-fade. Default 0.10s. */
  readonly holdSec: number;
  /** Time in seconds for the tail to fade behind the character. Default 0.4s. */
  readonly tailFadeSec: number;
}

export const DEFAULT_TRIM_PATH: TrimPathTuning = {
  drawInSec: 0.18,
  drawInEase: easeOutQuart,
  holdSec: 0.10,
  tailFadeSec: 0.4,
};

export interface TrimPathState {
  /** Elapsed time since spawn. */
  elapsed: number;
  /** Cached tuning. */
  tuning: TrimPathTuning;
}

export function makeTrimPath(tuning: TrimPathTuning = DEFAULT_TRIM_PATH): TrimPathState {
  return { elapsed: 0, tuning };
}

export interface TrimPathSample {
  /** Visible start of the line, 0..1. As the tail fades, this rises. */
  readonly startT: number;
  /** Visible end of the line, 0..1. Climbs during draw-in. */
  readonly endT: number;
  /** Overall alpha multiplier (1 until lifetime exceeded, then 0). */
  readonly alpha: number;
}

export function stepTrimPath(state: TrimPathState, dt: number): TrimPathSample {
  state.elapsed += dt;
  const { drawInSec, drawInEase, holdSec, tailFadeSec } = state.tuning;
  const drawInEndT = drawInSec;
  const holdEndT = drawInSec + holdSec;
  const fadeEndT = drawInSec + holdSec + tailFadeSec;

  if (state.elapsed <= drawInEndT) {
    // Phase 1: draw-in. Tail at 0, head climbs.
    const t = state.elapsed / Math.max(drawInSec, 1e-3);
    return { startT: 0, endT: drawInEase(t), alpha: 1 };
  }
  if (state.elapsed <= holdEndT) {
    // Phase 2: hold at 100%. Full visible.
    return { startT: 0, endT: 1, alpha: 1 };
  }
  if (state.elapsed <= fadeEndT) {
    // Phase 3: tail-fade. Start climbs toward 1, head stays at 1.
    const t = (state.elapsed - holdEndT) / Math.max(tailFadeSec, 1e-3);
    return { startT: drawInEase(t), endT: 1, alpha: 1 };
  }
  // Phase 4: gone.
  return { startT: 1, endT: 1, alpha: 0 };
}

export function isTrimPathDone(state: TrimPathState): boolean {
  const { drawInSec, holdSec, tailFadeSec } = state.tuning;
  return state.elapsed > drawInSec + holdSec + tailFadeSec;
}
